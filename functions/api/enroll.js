// functions/api/enroll.js
export async function onRequestPost({ request, env, context }) {
  console.log("🐝 Function started at", new Date().toISOString());
  
  // Check if environment variables exist
  console.log("🐝 MAILGUN_API_KEY exists:", !!env.MAILGUN_API_KEY);
  console.log("🐝 MAILGUN_DOMAIN exists:", !!env.MAILGUN_DOMAIN);
  console.log("🐝 STRIPE_SECRET_KEY exists:", !!env.STRIPE_SECRET_KEY);
  
  let formData;
  try {
    formData = await request.formData();
    console.log("🐝 Form data parsed successfully");
  } catch (err) {
    console.error("🐝 Failed to parse formData:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Invalid form submission." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Handle file upload - only proof of age
  const proofAgeFile = formData.get("proofAge");
  let uploadedFile = null;
  
  if (proofAgeFile && proofAgeFile.size > 0) {
    uploadedFile = {
      name: proofAgeFile.name,
      size: proofAgeFile.size,
      type: proofAgeFile.type
    };
    console.log("🐝 Proof of age file uploaded:", uploadedFile);
  }

  // Capture ALL form fields
  const enrollmentData = {
    // Player Information
    firstName: formData.get("firstName") || "(not provided)",
    lastName: formData.get("lastName") || "(not provided)",
    birthDate: formData.get("birthDate") || "(not provided)",
    gender: formData.get("gender") || "(not provided)",
    school: formData.get("school") || "(not provided)",
    grade: formData.get("grade") || "(not provided)",
    
    // Parent/Guardian Information
    parentName: formData.get("parentName") || "(not provided)",
    relationship: formData.get("relationship") || "(not provided)",
    email: formData.get("email") || "(not provided)",
    phone: formData.get("phone") || "(not provided)",
    address: formData.get("address") || "(not provided)",
    city: formData.get("city") || "(not provided)",
    state: formData.get("state") || "(not provided)",
    zip: formData.get("zip") || "(not provided)",
    
    // Emergency Contact
    emergencyName: formData.get("emergencyName") || "(not provided)",
    emergencyRelationship: formData.get("emergencyRelationship") || "(not provided)",
    emergencyPhone: formData.get("emergencyPhone") || "(not provided)",
    
    // Soccer Experience
    experience: formData.get("experience") || "(not provided)",
    position: formData.get("position") || "(not provided)",
    newsletter: formData.get("newsletter") ? "Yes" : "No",
    
    // Medical Information
    physician: formData.get("physician") || "(not provided)",
    physicianPhone: formData.get("physicianPhone") || "(not provided)",
    medicalConditions: formData.get("medicalConditions") || "(not provided)",
    medications: formData.get("medications") || "(not provided)",
    insuranceProvider: formData.get("insuranceProvider") || "(not provided)",
    policyNumber: formData.get("policyNumber") || "(not provided)",
    medicalAuthorization: formData.get("medicalAuthorization") ? "Yes" : "No",
    parentSignature: formData.get("parentSignature") || "(not provided)",
    signatureDate: formData.get("signatureDate") || "(not provided)",
    
    // Waiver Information
    playerStatusAgreement: formData.get("playerStatusAgreement") ? "Yes" : "No",
    riskAcknowledgment: formData.get("riskAcknowledgment") ? "Yes" : "No",
    insuranceAcknowledgment: formData.get("insuranceAcknowledgment") ? "Yes" : "No",
    photoRelease: formData.get("photoRelease") ? "Yes" : "No",
    liabilityRelease: formData.get("liabilityRelease") ? "Yes" : "No",
    waiverSignature: formData.get("waiverSignature") || "(not provided)",
    waiverDate: formData.get("waiverDate") || "(not provided)",
    
    // Payment Information
    paymentMethod: formData.get("paymentMethod") || "(not provided)",
    cardName: formData.get("cardName") || "(not provided)",
    billingAddress: formData.get("billingAddress") || "(not provided)",
    billingZip: formData.get("billingZip") || "(not provided)",
    paymentAgreement: formData.get("paymentAgreement") ? "Yes" : "No",
    
    // Stripe Payment Data
    stripeToken: formData.get("stripeToken") || null,
    paymentAmount: formData.get("paymentAmount") || "15000" // $150.00 in cents
  };

  console.log("🐝 Captured enrollment data:", enrollmentData);

  // Initialize payment status
  let paymentStatus = {
    processed: false,
    successful: false,
    chargeId: null,
    error: null,
    amount: null
  };

  // Process Stripe payment if online payment method
  if (enrollmentData.paymentMethod === 'online' && enrollmentData.stripeToken) {
    console.log("🐝 Processing Stripe payment...");
    
    try {
      if (!env.STRIPE_SECRET_KEY) {
        throw new Error("Stripe secret key not configured");
      }

      // Create Stripe charge using their API
      const stripeResponse = await fetch('https://api.stripe.com/v1/charges', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          amount: enrollmentData.paymentAmount,
          currency: 'usd',
          source: enrollmentData.stripeToken,
          description: `Rovers FC Enrollment - ${enrollmentData.firstName} ${enrollmentData.lastName}`,
          receipt_email: enrollmentData.email,
          'metadata[player_name]': `${enrollmentData.firstName} ${enrollmentData.lastName}`,
          'metadata[enrollment_type]': 'season_2025_2026',
          'metadata[parent_name]': enrollmentData.parentName,
          'metadata[phone]': enrollmentData.phone
        })
      });

      const stripeResult = await stripeResponse.json();
      console.log("🐝 Stripe response:", stripeResult);

      if (stripeResponse.ok && stripeResult.status === 'succeeded') {
        paymentStatus = {
          processed: true,
          successful: true,
          chargeId: stripeResult.id,
          amount: stripeResult.amount,
          error: null
        };
        console.log("🐝 Payment successful:", stripeResult.id);
      } else {
        throw new Error(stripeResult.error?.message || 'Payment failed');
      }

    } catch (error) {
      console.error("🐝 Payment processing failed:", error);
      paymentStatus = {
        processed: true,
        successful: false,
        chargeId: null,
        amount: null,
        error: error.message
      };
      
      // Return payment error to frontend
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Payment failed: ${error.message}` 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  } else if (enrollmentData.paymentMethod === 'check') {
    console.log("🐝 Check payment method selected - no processing needed");
    paymentStatus = {
      processed: false,
      successful: false,
      chargeId: null,
      amount: null,
      error: null
    };
  }

  // Create detailed HTML email with payment information
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
      <div style="background-color: #1E90FF; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">New Enrollment Submission</h1>
        <h2 style="margin: 10px 0 0 0; color: #FFD700;">${enrollmentData.firstName} ${enrollmentData.lastName}</h2>
        ${paymentStatus.successful ? 
          `<p style="margin: 10px 0 0 0; background-color: #28a745; color: white; padding: 10px; border-radius: 5px;">✅ PAYMENT PROCESSED SUCCESSFULLY</p>` :
          enrollmentData.paymentMethod === 'check' ?
          `<p style="margin: 10px 0 0 0; background-color: #ffc107; color: #212529; padding: 10px; border-radius: 5px;">💰 CHECK PAYMENT PENDING</p>` :
          `<p style="margin: 10px 0 0 0; background-color: #dc3545; color: white; padding: 10px; border-radius: 5px;">❌ PAYMENT FAILED</p>`
        }
      </div>
      
      <div style="background-color: white; padding: 20px; margin: 20px 0;">
        <h3 style="color: #1E90FF; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">Player Information</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px; font-weight: bold;">Name:</td><td style="padding: 5px;">${enrollmentData.firstName} ${enrollmentData.lastName}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Date of Birth:</td><td style="padding: 5px;">${enrollmentData.birthDate}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Gender:</td><td style="padding: 5px;">${enrollmentData.gender}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">School:</td><td style="padding: 5px;">${enrollmentData.school}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Grade:</td><td style="padding: 5px;">${enrollmentData.grade}</td></tr>
        </table>
      </div>

      <div style="background-color: white; padding: 20px; margin: 20px 0;">
        <h3 style="color: #1E90FF; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">Parent/Guardian Information</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px; font-weight: bold;">Name:</td><td style="padding: 5px;">${enrollmentData.parentName}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Relationship:</td><td style="padding: 5px;">${enrollmentData.relationship}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Email:</td><td style="padding: 5px;">${enrollmentData.email}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Phone:</td><td style="padding: 5px;">${enrollmentData.phone}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Address:</td><td style="padding: 5px;">${enrollmentData.address}, ${enrollmentData.city}, ${enrollmentData.state} ${enrollmentData.zip}</td></tr>
        </table>
      </div>

      <div style="background-color: white; padding: 20px; margin: 20px 0;">
        <h3 style="color: #1E90FF; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">Emergency Contact</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px; font-weight: bold;">Name:</td><td style="padding: 5px;">${enrollmentData.emergencyName}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Relationship:</td><td style="padding: 5px;">${enrollmentData.emergencyRelationship}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Phone:</td><td style="padding: 5px;">${enrollmentData.emergencyPhone}</td></tr>
        </table>
      </div>

      <div style="background-color: white; padding: 20px; margin: 20px 0;">
        <h3 style="color: #1E90FF; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">Soccer Experience</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px; font-weight: bold;">Experience:</td><td style="padding: 5px;">${enrollmentData.experience}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Preferred Position:</td><td style="padding: 5px;">${enrollmentData.position}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Newsletter:</td><td style="padding: 5px;">${enrollmentData.newsletter}</td></tr>
        </table>
      </div>

      <div style="background-color: white; padding: 20px; margin: 20px 0;">
        <h3 style="color: #1E90FF; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">Medical Information</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px; font-weight: bold;">Physician:</td><td style="padding: 5px;">${enrollmentData.physician}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Physician Phone:</td><td style="padding: 5px;">${enrollmentData.physicianPhone}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Medical Conditions:</td><td style="padding: 5px;">${enrollmentData.medicalConditions}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Medications:</td><td style="padding: 5px;">${enrollmentData.medications}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Insurance Provider:</td><td style="padding: 5px;">${enrollmentData.insuranceProvider}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Policy Number:</td><td style="padding: 5px;">${enrollmentData.policyNumber}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Medical Authorization:</td><td style="padding: 5px;">${enrollmentData.medicalAuthorization}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Parent Signature:</td><td style="padding: 5px;">${enrollmentData.parentSignature}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Signature Date:</td><td style="padding: 5px;">${enrollmentData.signatureDate}</td></tr>
        </table>
      </div>

      <div style="background-color: white; padding: 20px; margin: 20px 0;">
        <h3 style="color: #1E90FF; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">Waiver Agreements</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px; font-weight: bold;">Player Status Agreement:</td><td style="padding: 5px;">${enrollmentData.playerStatusAgreement}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Risk Acknowledgment:</td><td style="padding: 5px;">${enrollmentData.riskAcknowledgment}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Insurance Acknowledgment:</td><td style="padding: 5px;">${enrollmentData.insuranceAcknowledgment}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Photo Release:</td><td style="padding: 5px;">${enrollmentData.photoRelease}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Liability Release:</td><td style="padding: 5px;">${enrollmentData.liabilityRelease}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Waiver Signature:</td><td style="padding: 5px;">${enrollmentData.waiverSignature}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Waiver Date:</td><td style="padding: 5px;">${enrollmentData.waiverDate}</td></tr>
        </table>
      </div>

      <div style="background-color: white; padding: 20px; margin: 20px 0;">
        <h3 style="color: #1E90FF; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">Payment Information</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px; font-weight: bold;">Payment Method:</td><td style="padding: 5px;">${enrollmentData.paymentMethod}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Payment Agreement:</td><td style="padding: 5px;">${enrollmentData.paymentAgreement}</td></tr>
          ${enrollmentData.paymentMethod === 'online' ? `
          <tr><td style="padding: 5px; font-weight: bold;">Card Name:</td><td style="padding: 5px;">${enrollmentData.cardName}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Billing Address:</td><td style="padding: 5px;">${enrollmentData.billingAddress}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Billing ZIP:</td><td style="padding: 5px;">${enrollmentData.billingZip}</td></tr>
          ` : ''}
          ${paymentStatus.successful ? `
          <tr><td style="padding: 5px; font-weight: bold; color: #28a745;">Payment Status:</td><td style="padding: 5px; color: #28a745;">✅ PAID - $${(paymentStatus.amount / 100).toFixed(2)}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Charge ID:</td><td style="padding: 5px;">${paymentStatus.chargeId}</td></tr>
          ` : enrollmentData.paymentMethod === 'check' ? `
          <tr><td style="padding: 5px; font-weight: bold; color: #ffc107;">Payment Status:</td><td style="padding: 5px; color: #856404;">💰 PENDING - Awaiting check payment</td></tr>
          ` : paymentStatus.error ? `
          <tr><td style="padding: 5px; font-weight: bold; color: #dc3545;">Payment Status:</td><td style="padding: 5px; color: #dc3545;">❌ FAILED - ${paymentStatus.error}</td></tr>
          ` : ''}
        </table>
      </div>

      <div style="background-color: white; padding: 20px; margin: 20px 0;">
        <h3 style="color: #1E90FF; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">Document Submission</h3>
        ${uploadedFile ? `
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px; font-weight: bold;">Proof of Age:</td><td style="padding: 5px;">📎 ${uploadedFile.name} (${(uploadedFile.size / 1024).toFixed(1)} KB)</td></tr>
        </table>
        <p style="margin-top: 15px; padding: 10px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; color: #856404;">
          <strong>📎 Attached File:</strong> The birth certificate is attached to this email.
        </p>
        ` : `
        <p style="color: #666; font-style: italic;">No proof of age document was uploaded.</p>
        `}
      </div>

      <div style="background-color: #FFD700; color: #0A0F1D; padding: 15px; text-align: center; margin-top: 20px;">
        <p style="margin: 0; font-weight: bold;">Enrollment submitted on ${new Date().toLocaleDateString()}</p>
        ${paymentStatus.successful ? 
          `<p style="margin: 5px 0 0 0;">Payment processed successfully - Receipt sent to ${enrollmentData.email}</p>` :
          enrollmentData.paymentMethod === 'check' ?
          `<p style="margin: 5px 0 0 0;">Enrollment pending - Awaiting check payment of $150.00</p>` :
          ''
        }
      </div>
    </div>
  `;

  // Create plain text version for accessibility
  const textBody = `
NEW ENROLLMENT SUBMISSION

Player: ${enrollmentData.firstName} ${enrollmentData.lastName}
Date of Birth: ${enrollmentData.birthDate}
Gender: ${enrollmentData.gender}
School: ${enrollmentData.school}
Grade: ${enrollmentData.grade}

Parent/Guardian: ${enrollmentData.parentName} (${enrollmentData.relationship})
Email: ${enrollmentData.email}
Phone: ${enrollmentData.phone}
Address: ${enrollmentData.address}, ${enrollmentData.city}, ${enrollmentData.state} ${enrollmentData.zip}

Emergency Contact: ${enrollmentData.emergencyName} (${enrollmentData.emergencyRelationship})
Emergency Phone: ${enrollmentData.emergencyPhone}

Soccer Experience: ${enrollmentData.experience}
Preferred Position: ${enrollmentData.position}
Newsletter Subscription: ${enrollmentData.newsletter}

Medical Information:
- Physician: ${enrollmentData.physician} (${enrollmentData.physicianPhone})
- Medical Conditions: ${enrollmentData.medicalConditions}
- Medications: ${enrollmentData.medications}
- Insurance: ${enrollmentData.insuranceProvider} (${enrollmentData.policyNumber})
- Medical Authorization: ${enrollmentData.medicalAuthorization}

Waiver Agreements:
- Player Status Agreement: ${enrollmentData.playerStatusAgreement}
- Risk Acknowledgment: ${enrollmentData.riskAcknowledgment}
- Insurance Acknowledgment: ${enrollmentData.insuranceAcknowledgment}
- Photo Release: ${enrollmentData.photoRelease}
- Liability Release: ${enrollmentData.liabilityRelease}

Payment Information:
- Method: ${enrollmentData.paymentMethod}
- Agreement: ${enrollmentData.paymentAgreement}
${paymentStatus.successful ? `- Status: PAID - $${(paymentStatus.amount / 100).toFixed(2)}
- Charge ID: ${paymentStatus.chargeId}` : 
enrollmentData.paymentMethod === 'check' ? `- Status: PENDING - Awaiting check payment` :
paymentStatus.error ? `- Status: FAILED - ${paymentStatus.error}` : ''}

Document Uploaded:
${uploadedFile ? `- Proof of Age: ${uploadedFile.name} (${(uploadedFile.size / 1024).toFixed(1)} KB)` : '- No proof of age document uploaded'}

Submitted: ${new Date().toLocaleDateString()}
  `;

      // Try to send emails (both business notification and customer confirmation)
  try {
    console.log("🐝 About to call Mailgun API...");
    
    const mailgunUrl = `https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`;
    console.log("🐝 Mailgun URL:", mailgunUrl);
    
    // 1. Send business notification email
    const businessFormData = new FormData();
    businessFormData.append('from', `RoversFC Enrollment <noreply@txkrovers.com>`);
    businessFormData.append('to', 'texarkanarovers@gmail.com');
    businessFormData.append('subject', `New Enrollment: ${enrollmentData.firstName} ${enrollmentData.lastName}${paymentStatus.successful ? ' [PAID]' : enrollmentData.paymentMethod === 'check' ? ' [CHECK PENDING]' : paymentStatus.error ? ' [PAYMENT FAILED]' : ''}`);
    businessFormData.append('html', htmlBody);
    businessFormData.append('text', textBody);
    
    // Attach proof of age file if uploaded (business email only)
    if (proofAgeFile && proofAgeFile.size > 0) {
      const fileExtension = proofAgeFile.name.split('.').pop();
      const cleanFileName = `${enrollmentData.firstName}_${enrollmentData.lastName}_birth_certificate.${fileExtension}`;
      businessFormData.append('attachment', proofAgeFile, cleanFileName);
      console.log(`🐝 Attaching birth certificate: ${cleanFileName} (${proofAgeFile.size} bytes)`);
    }
    
    // Send business notification
    const businessResponse = await fetch(mailgunUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${env.MAILGUN_API_KEY}`)}`
      },
      body: businessFormData
    });
    
    console.log("🐝 Business email response status:", businessResponse.status);
    
    // 2. Send customer confirmation email
    const customerHtmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: #1E90FF; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Welcome to Texarkana Rovers FC!</h1>
          <h2 style="margin: 10px 0 0 0; color: #FFD700;">Enrollment Confirmation</h2>
        </div>
        
        <div style="background-color: white; padding: 30px; margin: 20px 0; text-align: center;">
          <h3 style="color: #1E90FF; margin-top: 0;">Thank you, ${enrollmentData.parentName}!</h3>
          <p style="font-size: 18px; margin: 20px 0;">
            We've received the enrollment for <strong style="color: #FFD700;">${enrollmentData.firstName} ${enrollmentData.lastName}</strong> 
            for the 2025-2026 season.
          </p>
          
          ${paymentStatus.successful ? `
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0;">✅ Payment Confirmed</h4>
            <p style="margin: 0;">Your payment of <strong>${(paymentStatus.amount / 100).toFixed(2)}</strong> has been processed successfully.</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">You'll receive a separate receipt from Stripe via email.</p>
          </div>
          ` : enrollmentData.paymentMethod === 'check' ? `
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0;">💰 Payment Instructions</h4>
            <p style="margin: 0 0 10px 0;">Please mail your check to complete the enrollment:</p>
            <ul style="text-align: left; margin: 0; padding-left: 20px;">
              <li>Make check payable to: <strong>Texarkana Rovers FC</strong></li>
              <li>Amount: <strong>$150.00</strong></li>
              <li>Write "${enrollmentData.firstName} ${enrollmentData.lastName}" in memo line</li>
              <li>Mail to: <strong>1 Legion Dr, Texarkana, AR 71854</strong></li>
            </ul>
          </div>
          ` : ''}
        </div>

        <div style="background-color: white; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1E90FF; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">Enrollment Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Player:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${enrollmentData.firstName} ${enrollmentData.lastName}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Date of Birth:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${enrollmentData.birthDate}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Experience Level:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${enrollmentData.experience}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Parent/Guardian:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${enrollmentData.parentName}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Email:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${enrollmentData.email}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Phone:</td><td style="padding: 8px;">${enrollmentData.phone}</td></tr>
          </table>
        </div>

        <div style="background-color: white; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1E90FF; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">What's Next?</h3>
          <ul style="line-height: 1.6; padding-left: 20px;">
            <li><strong>Confirmation:</strong> Our team will review your enrollment and contact you within 2-3 business days</li>
            <li><strong>Season Information:</strong> You'll receive details about practice schedules, equipment, and season start dates</li>
            <li><strong>Welcome Packet:</strong> Watch for your welcome packet in the mail with important information</li>
            ${enrollmentData.paymentMethod === 'check' ? '<li><strong>Payment:</strong> Please mail your check as soon as possible to secure your spot</li>' : ''}
          </ul>
        </div>

        <div style="background-color: white; padding: 20px; margin: 20px 0; text-align: center;">
          <h3 style="color: #1E90FF; margin-top: 0;">Questions?</h3>
          <p style="margin: 10px 0;">
            📞 <strong>Phone:</strong> (903) 748-7697<br>
            📧 <strong>Email:</strong> info@txkrovers.com<br>
            🌐 <strong>Website:</strong> www.txkrovers.com
          </p>
        </div>

        <div style="background-color: #FFD700; color: #0A0F1D; padding: 15px; text-align: center; margin-top: 20px;">
          <p style="margin: 0; font-weight: bold;">Welcome to the Rovers Family! ⚽</p>
          <p style="margin: 5px 0 0 0; font-size: 14px;">Enrollment submitted on ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    `;

    const customerTextBody = `
WELCOME TO TEXARKANA ROVERS FC!

Thank you, ${enrollmentData.parentName}!

We've received the enrollment for ${enrollmentData.firstName} ${enrollmentData.lastName} for the 2025-2026 season.

${paymentStatus.successful ? `
PAYMENT CONFIRMED ✅
Your payment of ${(paymentStatus.amount / 100).toFixed(2)} has been processed successfully.
You'll receive a separate receipt from Stripe via email.
` : enrollmentData.paymentMethod === 'check' ? `
PAYMENT INSTRUCTIONS 💰
Please mail your check to complete the enrollment:
- Make check payable to: Texarkana Rovers FC
- Amount: $150.00
- Write "${enrollmentData.firstName} ${enrollmentData.lastName}" in memo line
- Mail to: 1 Legion Dr, Texarkana, AR 71854
` : ''}

ENROLLMENT SUMMARY:
Player: ${enrollmentData.firstName} ${enrollmentData.lastName}
Date of Birth: ${enrollmentData.birthDate}
Experience Level: ${enrollmentData.experience}
Parent/Guardian: ${enrollmentData.parentName}
Email: ${enrollmentData.email}
Phone: ${enrollmentData.phone}

WHAT'S NEXT?
- Our team will review your enrollment and contact you within 2-3 business days
- You'll receive details about practice schedules, equipment, and season start dates
- Watch for your welcome packet in the mail with important information
${enrollmentData.paymentMethod === 'check' ? '- Please mail your check as soon as possible to secure your spot' : ''}

QUESTIONS?
Phone: (903) 748-7697
Email: info@txkrovers.com
Website: www.txkrovers.com

Welcome to the Rovers Family! ⚽
Enrollment submitted on ${new Date().toLocaleDateString()}
    `;

    const customerFormData = new FormData();
    customerFormData.append('from', `Texarkana Rovers FC <noreply@txkrovers.com>`);
    customerFormData.append('to', enrollmentData.email);
    customerFormData.append('subject', `Welcome to Rovers FC! Enrollment Confirmed for ${enrollmentData.firstName}`);
    customerFormData.append('html', customerHtmlBody);
    customerFormData.append('text', customerTextBody);
    
    // Send customer confirmation
    const customerResponse = await fetch(mailgunUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${env.MAILGUN_API_KEY}`)}`
      },
      body: customerFormData
    });
    
    console.log("🐝 Customer email response status:", customerResponse.status);
    
    // Check if both emails were successful
    if (!businessResponse.ok || !customerResponse.ok) {
      const businessText = await businessResponse.text();
      const customerText = await customerResponse.text();
      console.log("🐝 Business email body:", businessText);
      console.log("🐝 Customer email body:", customerText);
      
      if (!businessResponse.ok) {
        throw new Error(`Business email failed: ${businessResponse.status} - ${businessText}`);
      }
      if (!customerResponse.ok) {
        throw new Error(`Customer email failed: ${customerResponse.status} - ${customerText}`);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: paymentStatus.successful ? 
          "Enrollment and payment completed successfully! Confirmation emails sent." : 
          enrollmentData.paymentMethod === 'check' ? 
          "Enrollment submitted! Check payment instructions sent to your email." :
          "Enrollment submitted successfully! Confirmation email sent.",
        paymentStatus: paymentStatus,
        fileAttached: uploadedFile ? true : false,
        emailsSent: {
          business: true,
          customer: true
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("🐝 Email sending failed:", error);
    
    // Still return success to user, but log the error
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: paymentStatus.successful ? 
          "Payment processed successfully!" :
          enrollmentData.paymentMethod === 'check' ?
          "Enrollment submitted! Please mail your check." :
          "Enrollment submitted successfully!",
        paymentStatus: paymentStatus,
        emailError: "Confirmation emails may not have been delivered.",
        debug: error.message 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}