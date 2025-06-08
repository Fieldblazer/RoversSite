// functions/api/contact.js
export async function onRequestPost({ request, env, context }) {
  console.log("🐝 Contact function started at", new Date().toISOString());
  
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

  // Capture form fields
  const contactData = {
    name: formData.get("name") || "(not provided)",
    email: formData.get("email") || "(not provided)",
    subject: formData.get("subject") || "(not provided)", 
    message: formData.get("message") || "(not provided)"
  };

  console.log("🐝 Captured contact data:", contactData);

  // Create detailed HTML email
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
      <div style="background-color: #1E90FF; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">New Contact Form Submission</h1>
        <h2 style="margin: 10px 0 0 0; color: #FFD700;">${contactData.name}</h2>
      </div>
      
      <div style="background-color: white; padding: 20px; margin: 20px 0;">
        <h3 style="color: #1E90FF; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">Contact Information</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 10px; font-weight: bold; width: 120px;">Name:</td><td style="padding: 10px;">${contactData.name}</td></tr>
          <tr><td style="padding: 10px; font-weight: bold;">Email:</td><td style="padding: 10px;"><a href="mailto:${contactData.email}" style="color: #1E90FF;">${contactData.email}</a></td></tr>
          <tr><td style="padding: 10px; font-weight: bold;">Subject:</td><td style="padding: 10px;">${contactData.subject}</td></tr>
        </table>
      </div>

      <div style="background-color: white; padding: 20px; margin: 20px 0;">
        <h3 style="color: #1E90FF; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">Message</h3>
        <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #1E90FF; line-height: 1.6;">
          ${contactData.message.replace(/\n/g, '<br>')}
        </div>
      </div>

      <div style="background-color: #FFD700; color: #0A0F1D; padding: 15px; text-align: center; margin-top: 20px;">
        <p style="margin: 0; font-weight: bold;">Message received on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Reply to: <a href="mailto:${contactData.email}" style="color: #0A0F1D; text-decoration: underline;">${contactData.email}</a></p>
      </div>
    </div>
  `;

  // Create plain text version for accessibility
  const textBody = `
NEW CONTACT FORM SUBMISSION

From: ${contactData.name}
Email: ${contactData.email}
Subject: ${contactData.subject}

Message:
${contactData.message}

--
Received: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
Reply to: ${contactData.email}
  `;

  // Try to send email
  try {
    console.log("🐝 About to call Mailgun API...");
    
    const mailgunUrl = `https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`;
    console.log("🐝 Mailgun URL:", mailgunUrl);
    
    // Create FormData for Mailgun
    const mailgunFormData = new FormData();
    mailgunFormData.append('from', `RoversFC Contact <noreply@txkrovers.com>`);
    mailgunFormData.append('to', 'texarkanarovers@gmail.com');
    mailgunFormData.append('reply-to', contactData.email);
    mailgunFormData.append('subject', `Contact Form: ${contactData.subject}`);
    mailgunFormData.append('html', htmlBody);
    mailgunFormData.append('text', textBody);
    
    const response = await fetch(mailgunUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${env.MAILGUN_API_KEY}`)}`
        // Don't set Content-Type header when using FormData
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
        message: "Message sent successfully! We'll get back to you soon."
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("🐝 Email sending failed:", error);
    
    // Still return success to user, but log the error
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Message received! We'll get back to you soon.",
        debug: error.message 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}