// functions/enroll.js

/**
 * This Cloudflare Pages Function handles POST requests from the enrollment form.
 * It uses Mailgun’s sandbox domain to send the collected form data via email.
 */

export async function onRequestPost({ request, env }) {
  try {
    // 1. Parse the incoming multipart/form-data
    const formData = await request.formData();

    // 2. Extract text fields from the form
    const firstName   = formData.get("firstName")?.trim()   || "";
    const lastName    = formData.get("lastName")?.trim()    || "";
    const birthDate   = formData.get("birthDate")?.trim()   || "";
    const gender      = formData.get("gender")?.trim()      || "";
    const school      = formData.get("school")?.trim()      || "";
    const grade       = formData.get("grade")?.trim()       || "";

    const parentName  = formData.get("parentName")?.trim()  || "";
    const relationship= formData.get("relationship")?.trim()|| "";
    const email       = formData.get("email")?.trim()       || "";
    const phone       = formData.get("phone")?.trim()       || "";
    const address     = formData.get("address")?.trim()     || "";
    const city        = formData.get("city")?.trim()        || "";
    const state       = formData.get("state")?.trim()       || "";
    const zip         = formData.get("zip")?.trim()         || "";

    const emergencyName        = formData.get("emergencyName")?.trim()        || "";
    const emergencyRelationship= formData.get("emergencyRelationship")?.trim()|| "";
    const emergencyPhone       = formData.get("emergencyPhone")?.trim()       || "";

    const experience = formData.get("experience")?.trim() || "";
    const position   = formData.get("position")?.trim()   || "";

    const newsletter = formData.get("newsletter") === "on" ? "Yes" : "No";

    // 3. Extract file uploads (they will be File objects if provided)
    const proofAgeFile       = formData.get("proofAge");       // File or null
    const proofResidencyFile = formData.get("proofResidency"); // File or null
    const physicalExamFile   = formData.get("physicalExam");   // File or null

    // 4. Basic validation: ensure required fields are present
    // (You can expand this as needed.)
    if (!firstName || !lastName || !email) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields (firstName, lastName, or email)." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 5. Build a plain-text summary of all form fields
    let emailBody = `
New enrollment received:

--- Player Information ---
First Name: ${firstName}
Last Name: ${lastName}
Date of Birth: ${birthDate}
Gender: ${gender}
School Attending: ${school}
Grade: ${grade}

--- Parent/Guardian Information ---
Parent Name: ${parentName}
Relationship: ${relationship}
Email: ${email}
Phone: ${phone}
Address: ${address}, ${city}, ${state} ${zip}

--- Emergency Contact ---
Emergency Contact Name: ${emergencyName}
Emergency Contact Relationship: ${emergencyRelationship}
Emergency Contact Phone: ${emergencyPhone}

--- Soccer Experience ---
Years of Experience: ${experience}
Preferred Position(s): ${position}
Subscribe to newsletter: ${newsletter}
`;

    // 6. If files were uploaded, append their filenames to the body
    if (proofAgeFile?.name) {
      emailBody += `\nProof of Age: ${proofAgeFile.name}`;
    }
    if (proofResidencyFile?.name) {
      emailBody += `\nProof of Residency: ${proofResidencyFile.name}`;
    }
    if (physicalExamFile?.name) {
      emailBody += `\nPhysical Exam Form: ${physicalExamFile.name}`;
    }

    // 7. Prepare the Mailgun API call
    // Replace with your actual sandbox domain (e.g. "sandboxXYZ.mailgun.org")
    const MAILGUN_DOMAIN = "sandbox3d4826c69b374263844c2414e3e9b0ac.mailgun.org";

    // Mailgun endpoint for sending messages
    const mailgunUrl = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;

    // Build the form data to post to Mailgun
    const mgFormData = new URLSearchParams();
    mgFormData.append("from", `Enrollment Bot <postmaster@${MAILGUN_DOMAIN}>`);
    // Change the "to" address to whichever email you’ve added under “Authorized Recipients” in the Mailgun sandbox
    mgFormData.append("to", "you@yourdomain.com"); 
    mgFormData.append("subject", `New Enrollment: ${firstName} ${lastName}`);
    mgFormData.append("text", emailBody);

    // 8. Send the HTTP request to Mailgun
    const mgResponse = await fetch(mailgunUrl, {
      method: "POST",
      headers: {
        // Basic Auth with API key: “api:YOUR_API_KEY” base64-encoded
        Authorization: "Basic " + btoa(`api:${env.MAILGUN_API_KEY}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: mgFormData.toString(),
    });

    if (!mgResponse.ok) {
      const errorText = await mgResponse.text();
      return new Response(
        JSON.stringify({
          success: false,
          error: `Mailgun error: ${mgResponse.status} ${errorText}`
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // 9. Redirect the user to a thank-you page after successful submission
    return Response.redirect("/thank-you.html");
  } catch (e) {
    // Catch any unexpected errors
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
