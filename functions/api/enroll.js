// functions/api/enroll.js
export async function onRequestPost({ request, env, context }) {
  console.log("🐝 Function started at", new Date().toISOString());
  
  // Check if environment variables exist
  console.log("🐝 MAILGUN_API_KEY exists:", !!env.MAILGUN_API_KEY);
  console.log("🐝 MAILGUN_DOMAIN exists:", !!env.MAILGUN_DOMAIN);
  
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

  // Handle file uploads
  const files = {
    proofAge: formData.get("proofAge"),
    proofResidency: formData.get("proofResidency"),
    physicalExam: formData.get("physicalExam")
  };

  // Check which files were uploaded
  const uploadedFiles = {};
  for (const [key, file] of Object.entries(files)) {
    if (file && file.size > 0) {
      uploadedFiles[key] = {
        name: file.name,
        size: file.size,
        type: file.type
      };
    }
  }

  console.log("🐝 Uploaded files:", uploadedFiles);

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
    cardNumber: formData.get("cardNumber") || "(not provided)",
    cardExpiry: formData.get("cardExpiry") || "(not provided)",
    cardCvv: formData.get("cardCvv") || "(not provided)",
    paymentAgreement: formData.get("paymentAgreement") ? "Yes" : "No"
  };

  console.log("🐝 Captured enrollment data:", enrollmentData);

  // Create detailed HTML email
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
      <div style="background-color: #1E90FF; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">New Enrollment Submission</h1>
        <h2 style="margin: 10px 0 0 0; color: #FFD700;">${enrollmentData.firstName} ${enrollmentData.lastName}</h2>
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
          ${enrollmentData.paymentMethod === 'online' && enrollmentData.cardNumber ? `
          <tr><td style="padding: 5px; font-weight: bold;">Card Name:</td><td style="padding: 5px;">${enrollmentData.cardName}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Card Number:</td><td style="padding: 5px;">****-****-****-${enrollmentData.cardNumber.slice(-4)}</td></tr>
          ` : ''}
        </table>
      </div>

      <div style="background-color: white; padding: 20px; margin: 20px 0;">
        <h3 style="color: #1E90FF; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">Uploaded Documents</h3>
        ${Object.keys(uploadedFiles).length > 0 ? `
        <table style="width: 100%; border-collapse: collapse;">
          ${Object.entries(uploadedFiles).map(([key, file]) => {
            const displayName = key === 'proofAge' ? 'Proof of Age' : 
                              key === 'proofResidency' ? 'Proof of Residency' : 
                              key === 'physicalExam' ? 'Physical Exam Form' : key;
            return `<tr><td style="padding: 5px; font-weight: bold;">${displayName}:</td><td style="padding: 5px;">📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)</td></tr>`;
          }).join('')}
        </table>
        <p style="margin-top: 15px; padding: 10px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; color: #856404;">
          <strong>📎 Attached Files:</strong> The uploaded documents are attached to this email.
        </p>
        ` : `
        <p style="color: #666; font-style: italic;">No documents were uploaded with this enrollment.</p>
        `}
      </div>

      <div style="background-color: #FFD700; color: #0A0F1D; padding: 15px; text-align: center; margin-top: 20px;">
        <p style="margin: 0; font-weight: bold;">Enrollment submitted on ${new Date().toLocaleDateString()}</p>
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

Payment Method: ${enrollmentData.paymentMethod}
Payment Agreement: ${enrollmentData.paymentAgreement}

Documents Uploaded:
${Object.keys(uploadedFiles).length > 0 ? 
  Object.entries(uploadedFiles).map(([key, file]) => {
    const displayName = key === 'proofAge' ? 'Proof of Age' : 
                      key === 'proofResidency' ? 'Proof of Residency' : 
                      key === 'physicalExam' ? 'Physical Exam Form' : key;
    return `- ${displayName}: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  }).join('\n') 
  : '- No documents uploaded'
}

Submitted: ${new Date().toLocaleDateString()}
  `;

  // Try to send email
  try {
    console.log("🐝 About to call Mailgun API...");
    
    const mailgunUrl = `https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`;
    console.log("🐝 Mailgun URL:", mailgunUrl);
    
    // Create FormData for Mailgun (different from the incoming formData)
    const mailgunFormData = new FormData();
    mailgunFormData.append('from', `RoversFC Enrollment <mailgun@${env.MAILGUN_DOMAIN}>`);
    mailgunFormData.append('to', 'texarkanarovers@gmail.com');
    mailgunFormData.append('subject', `New Enrollment: ${enrollmentData.firstName} ${enrollmentData.lastName}`);
    mailgunFormData.append('html', htmlBody);
    mailgunFormData.append('text', textBody);
    
    // Attach uploaded files
    for (const [key, file] of Object.entries(files)) {
      if (file && file.size > 0) {
        // Create a meaningful filename
        const fileExtension = file.name.split('.').pop();
        const cleanFileName = `${enrollmentData.firstName}_${enrollmentData.lastName}_${key}.${fileExtension}`;
        mailgunFormData.append('attachment', file, cleanFileName);
        console.log(`🐝 Attaching file: ${cleanFileName} (${file.size} bytes)`);
      }
    }
    
    const response = await fetch(mailgunUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${env.MAILGUN_API_KEY}`)}`
        // Don't set Content-Type header when using FormData - let the browser set it
      },
      body: mailgunFormData
    });
    
    console.log("🐝 Mailgun response status:", response.status);
    const responseText = await response.text();
    console.log("🐝 Mailgun response body:", responseText);
    
    if (!response.ok) {
      throw new Error(`Mailgun API error: ${response.status} - ${responseText}`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Enrollment submitted successfully",
        filesAttached: Object.keys(uploadedFiles).length
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("🐝 Email sending failed:", error);
    
    // Still return success to user, but log the error
    return new Response(
      JSON.stringify({ success: true, debug: error.message }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}