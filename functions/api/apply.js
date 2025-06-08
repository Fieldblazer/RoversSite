// functions/api/apply.js
export async function onRequestPost({ request, env, context }) {
  console.log("🚀 Application function started at", new Date().toISOString());
  
  // Check if environment variables exist
  console.log("🚀 MAILGUN_API_KEY exists:", !!env.MAILGUN_API_KEY);
  console.log("🚀 MAILGUN_DOMAIN exists:", !!env.MAILGUN_DOMAIN);
  
  let formData;
  try {
    formData = await request.formData();
    console.log("🚀 Form data parsed successfully");
  } catch (err) {
    console.error("🚀 Failed to parse formData:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Invalid form submission." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Get position type to determine which fields to capture
  const positionType = formData.get("positionType") || "Unknown";

  // Base application data
  const applicationData = {
    positionType: positionType,
    firstName: formData.get("firstName") || "(not provided)",
    lastName: formData.get("lastName") || "(not provided)",
    email: formData.get("email") || "(not provided)",
    phone: formData.get("phone") || "(not provided)",
    city: formData.get("city") || "(not provided)",
    state: formData.get("state") || "(not provided)",
  };

  // Position-specific data
  let specificData = {};
  
  if (positionType === "Social Media Manager") {
    // Get checkbox values for platforms
    const platforms = [];
    formData.getAll("platforms").forEach(platform => platforms.push(platform));
    
    specificData = {
      socialMediaExperience: formData.get("socialMediaExperience") || "(not provided)",
      platforms: platforms.join(", ") || "(none selected)",
      contentSkills: formData.get("contentSkills") || "(not provided)",
      motivation: formData.get("motivation") || "(not provided)",
      availability: formData.get("availability") || "(not provided)",
      portfolio: formData.get("portfolio") || "(not provided)"
    };
  } else if (positionType === "Volunteer") {
    // Get checkbox values for volunteer areas
    const volunteerAreas = [];
    formData.getAll("volunteerAreas").forEach(area => volunteerAreas.push(area));
    
    specificData = {
      age: formData.get("age") || "(not provided)",
      volunteerAreas: volunteerAreas.join(", ") || "(none selected)",
      volunteerExperience: formData.get("volunteerExperience") || "(not provided)",
      motivation: formData.get("motivation") || "(not provided)",
      availability: formData.get("availability") || "(not provided)",
      backgroundCheck: formData.get("backgroundCheck") ? "Yes" : "No"
    };
  } else if (positionType === "Sponsor") {
    specificData = {
      companyName: formData.get("companyName") || "(not provided)",
      companyAddress: formData.get("companyAddress") || "(not provided)",
      industry: formData.get("industry") || "(not provided)",
      sponsorshipLevel: formData.get("sponsorshipLevel") || "(not provided)",
      sponsorshipGoals: formData.get("sponsorshipGoals") || "(not provided)",
      targetAudience: formData.get("targetAudience") || "(not provided)",
      specialRequests: formData.get("specialRequests") || "(not provided)",
      companyWebsite: formData.get("companyWebsite") || "(not provided)"
    };
  }

  // Combine all data
  const fullApplicationData = { ...applicationData, ...specificData };

  console.log("🚀 Captured application data:", fullApplicationData);

  // Create position-specific email content
  let positionSpecificContent = "";
  let subjectLine = "";

  if (positionType === "Social Media Manager") {
    subjectLine = `Social Media Manager Application: ${applicationData.firstName} ${applicationData.lastName}`;
    positionSpecificContent = `
      <div style="background-color: white; padding: 20px; margin: 20px 0;">
        <h3 style="color: #1E90FF; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">Social Media Manager Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px; font-weight: bold;">Platform Expertise:</td><td style="padding: 5px;">${specificData.platforms}</td></tr>
        </table>
        <div style="margin-top: 15px;">
          <h4 style="color: #1E90FF; margin: 0 0 8px 0;">Social Media Experience:</h4>
          <p style="background-color: #f8f9fa; padding: 12px; border-left: 4px solid #FFD700; margin: 0;">${specificData.socialMediaExperience}</p>
        </div>
        <div style="margin-top: 15px;">
          <h4 style="color: #1E90FF; margin: 0 0 8px 0;">Content Creation Skills:</h4>
          <p style="background-color: #f8f9fa; padding: 12px; border-left: 4px solid #FFD700; margin: 0;">${specificData.contentSkills}</p>
        </div>
        <div style="margin-top: 15px;">
          <h4 style="color: #1E90FF; margin: 0 0 8px 0;">Portfolio/Examples:</h4>
          <p style="background-color: #f8f9fa; padding: 12px; border-left: 4px solid #FFD700; margin: 0;">${specificData.portfolio}</p>
        </div>
      </div>
    `;
  } else if (positionType === "Volunteer") {
    subjectLine = `Volunteer Application: ${applicationData.firstName} ${applicationData.lastName}`;
    positionSpecificContent = `
      <div style="background-color: white; padding: 20px; margin: 20px 0;">
        <h3 style="color: #1E90FF; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">Volunteer Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px; font-weight: bold;">Age:</td><td style="padding: 5px;">${specificData.age}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Areas of Interest:</td><td style="padding: 5px;">${specificData.volunteerAreas}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Background Check Agreement:</td><td style="padding: 5px;">${specificData.backgroundCheck}</td></tr>
        </table>
        <div style="margin-top: 15px;">
          <h4 style="color: #1E90FF; margin: 0 0 8px 0;">Previous Volunteer Experience:</h4>
          <p style="background-color: #f8f9fa; padding: 12px; border-left: 4px solid #FFD700; margin: 0;">${specificData.volunteerExperience}</p>
        </div>
      </div>
    `;
  } else if (positionType === "Sponsor") {
    subjectLine = `Sponsorship Inquiry: ${specificData.companyName}`;
    positionSpecificContent = `
      <div style="background-color: white; padding: 20px; margin: 20px 0;">
        <h3 style="color: #1E90FF; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">Company Information</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px; font-weight: bold;">Company:</td><td style="padding: 5px;">${specificData.companyName}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Industry:</td><td style="padding: 5px;">${specificData.industry}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Address:</td><td style="padding: 5px;">${specificData.companyAddress}, ${applicationData.city}, ${applicationData.state}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Website:</td><td style="padding: 5px;">${specificData.companyWebsite}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Sponsorship Level:</td><td style="padding: 5px;">${specificData.sponsorshipLevel}</td></tr>
        </table>
        <div style="margin-top: 15px;">
          <h4 style="color: #1E90FF; margin: 0 0 8px 0;">Sponsorship Goals:</h4>
          <p style="background-color: #f8f9fa; padding: 12px; border-left: 4px solid #FFD700; margin: 0;">${specificData.sponsorshipGoals}</p>
        </div>
        <div style="margin-top: 15px;">
          <h4 style="color: #1E90FF; margin: 0 0 8px 0;">Target Audience:</h4>
          <p style="background-color: #f8f9fa; padding: 12px; border-left: 4px solid #FFD700; margin: 0;">${specificData.targetAudience}</p>
        </div>
        ${specificData.specialRequests && specificData.specialRequests !== "(not provided)" ? `
        <div style="margin-top: 15px;">
          <h4 style="color: #1E90FF; margin: 0 0 8px 0;">Special Requests:</h4>
          <p style="background-color: #f8f9fa; padding: 12px; border-left: 4px solid #FFD700; margin: 0;">${specificData.specialRequests}</p>
        </div>
        ` : ''}
      </div>
    `;
  }

  // Create detailed HTML email
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
      <div style="background-color: #1E90FF; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">New ${positionType} Application</h1>
        <h2 style="margin: 10px 0 0 0; color: #FFD700;">${applicationData.firstName} ${applicationData.lastName}</h2>
      </div>
      
      <div style="background-color: white; padding: 20px; margin: 20px 0;">
        <h3 style="color: #1E90FF; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">Contact Information</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px; font-weight: bold;">Name:</td><td style="padding: 5px;">${applicationData.firstName} ${applicationData.lastName}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Email:</td><td style="padding: 5px;">${applicationData.email}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Phone:</td><td style="padding: 5px;">${applicationData.phone}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Location:</td><td style="padding: 5px;">${applicationData.city}, ${applicationData.state}</td></tr>
        </table>
      </div>

      ${positionSpecificContent}

      ${specificData.motivation ? `
      <div style="background-color: white; padding: 20px; margin: 20px 0;">
        <h3 style="color: #1E90FF; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">Motivation</h3>
        <p style="background-color: #f8f9fa; padding: 12px; border-left: 4px solid #FFD700; margin: 0;">${specificData.motivation}</p>
      </div>
      ` : ''}

      ${specificData.availability ? `
      <div style="background-color: white; padding: 20px; margin: 20px 0;">
        <h3 style="color: #1E90FF; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">Availability</h3>
        <p style="background-color: #f8f9fa; padding: 12px; border-left: 4px solid #FFD700; margin: 0;">${specificData.availability}</p>
      </div>
      ` : ''}

      <div style="background-color: #FFD700; color: #0A0F1D; padding: 15px; text-align: center; margin-top: 20px;">
        <p style="margin: 0; font-weight: bold;">Application submitted on ${new Date().toLocaleDateString()}</p>
        <p style="margin: 5px 0 0 0;">Contact: ${applicationData.email} | ${applicationData.phone}</p>
      </div>
    </div>
  `;

  // Create plain text version
  const textBody = `
NEW ${positionType.toUpperCase()} APPLICATION

Applicant: ${applicationData.firstName} ${applicationData.lastName}
Email: ${applicationData.email}
Phone: ${applicationData.phone}
Location: ${applicationData.city}, ${applicationData.state}

${positionType === "Social Media Manager" ? `
SOCIAL MEDIA DETAILS:
Platform Expertise: ${specificData.platforms}
Social Media Experience: ${specificData.socialMediaExperience}
Content Creation Skills: ${specificData.contentSkills}
Portfolio: ${specificData.portfolio}
` : ''}

${positionType === "Volunteer" ? `
VOLUNTEER DETAILS:
Age: ${specificData.age}
Areas of Interest: ${specificData.volunteerAreas}
Previous Experience: ${specificData.volunteerExperience}
Background Check Agreement: ${specificData.backgroundCheck}
` : ''}

${positionType === "Sponsor" ? `
COMPANY DETAILS:
Company: ${specificData.companyName}
Industry: ${specificData.industry}
Address: ${specificData.companyAddress}, ${applicationData.city}, ${applicationData.state}
Website: ${specificData.companyWebsite}
Sponsorship Level: ${specificData.sponsorshipLevel}
Goals: ${specificData.sponsorshipGoals}
Target Audience: ${specificData.targetAudience}
Special Requests: ${specificData.specialRequests}
` : ''}

${specificData.motivation ? `MOTIVATION: ${specificData.motivation}` : ''}
${specificData.availability ? `AVAILABILITY: ${specificData.availability}` : ''}

Application submitted: ${new Date().toLocaleDateString()}
  `;

  // Try to send email
  try {
    console.log("🚀 About to call Mailgun API...");
    
    const mailgunUrl = `https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`;
    console.log("🚀 Mailgun URL:", mailgunUrl);
    
    const response = await fetch(mailgunUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${env.MAILGUN_API_KEY}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        from: `Rovers FC Applications <noreply@${env.MAILGUN_DOMAIN}>`,
        to: 'texarkanarovers@gmail.com',
        subject: subjectLine,
        html: htmlBody,
        text: textBody
      })
    });
    
    console.log("🚀 Mailgun response status:", response.status);
    const responseText = await response.text();
    console.log("🚀 Mailgun response body:", responseText);
    
    if (!response.ok) {
      throw new Error(`Mailgun API error: ${response.status} - ${responseText}`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Application submitted successfully"
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("🚀 Email sending failed:", error);
    
    // Still return success to user, but log the error
    return new Response(
      JSON.stringify({ success: true, debug: error.message }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}