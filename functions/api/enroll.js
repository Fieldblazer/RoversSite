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

  const firstName = formData.get("firstName") || "(no firstName)";
  const email = formData.get("email") || "(no email)";
  console.log("🐝 Received data - Name:", firstName, "Email:", email);

  // Try to send email
  try {
    console.log("🐝 About to call Mailgun API...");
    
    const mailgunUrl = `https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`;
    console.log("🐝 Mailgun URL:", mailgunUrl);
    
    const response = await fetch(mailgunUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${env.MAILGUN_API_KEY}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        from: `RoversFC <mailgun@${env.MAILGUN_DOMAIN}>`,
        to: 'texarkanarovers@gmail.com', // Replace with your actual email
        subject: 'New Enrollment - ' + firstName,
        text: `New enrollment from ${firstName} (${email})`
      })
    });

    console.log("🐝 Mailgun response status:", response.status);
    const responseText = await response.text();
    console.log("🐝 Mailgun response body:", responseText);

    if (!response.ok) {
      throw new Error(`Mailgun API error: ${response.status} - ${responseText}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
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