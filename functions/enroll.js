// functions/enroll.js

/**
 * Cloudflare Pages Function: handles POST /api/enroll
 *   1) Logs an entry so you can watch in the Pages Function logs
 *   2) Parses all form fields
 *   3) Sends a plain-text summary via Mailgun (sandbox)
 *   4) Returns JSON { success: true } or an error
 */

// functions/enroll.js
export async function onRequestPost({ request, env }) {
  console.log("🐝 stub onRequestPost invoked");
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

  // 3) Extract every field you need (text inputs). Adjust names to match your <input name="...">
  const firstName    = formData.get("firstName")?.trim()      || "";
  const lastName     = formData.get("lastName")?.trim()       || "";
  const birthDate    = formData.get("birthDate")?.trim()      || "";
  const gender       = formData.get("gender")?.trim()         || "";
  const school       = formData.get("school")?.trim()         || "";
  const grade        = formData.get("grade")?.trim()          || "";

  const parentName   = formData.get("parentName")?.trim()     || "";
  const relationship = formData.get("relationship")?.trim()   || "";
  const email        = formData.get("email")?.trim()          || "";
  const phone        = formData.get("phone")?.trim()          || "";
  const address      = formData.get("address")?.trim()        || "";
  const city         = formData.get("city")?.trim()           || "";
  const state        = formData.get("state")?.trim()          || "";
  const zip          = formData.get("zip")?.trim()            || "";

  const emergencyName        = formData.get("emergencyName")?.trim()        || "";
  const emergencyRelationship = formData.get("emergencyRelationship")?.trim() || "";
  const emergencyPhone       = formData.get("emergencyPhone")?.trim()       || "";

  const experience   = formData.get("experience")?.trim()   || "";
  const position     = formData.get("position")?.trim()     || "";
  const newsletter   = formData.get("newsletter")           ? "Yes" : "No";

  const parentSignature = formData.get("parentSignature")?.trim() || "";
  const signatureDate   = formData.get("signatureDate")?.trim()   || "";

  // (You can similarly grab waiver and document fields as needed,
  //  but here we’ll send a minimal summary.)

  // 4) Check any required fields:
  if (!firstName || !lastName || !email || !parentSignature) {
    console.error("🐝 Missing required fields:");
    return new Response(
      JSON.stringify({ success: false, error: "Missing required fields." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 5) Build Mailgun parameters (URLSearchParams for x-www-form-urlencoded)
  const mailgunDomain = env.MAILGUN_DOMAIN;   // e.g. sandbox-abcdef123.mailgun.org
  const mailgunKey    = env.MAILGUN_API_KEY;  // e.g. key-1234567890abcdef
  const mgEndpoint    = `https://api.mailgun.net/v3/${mailgunDomain}/messages`;

  // *** IMPORTANT: in sandbox mode, you can only send to "Authorized Recipients" ***
  // Make sure you have added & verified this address under Mailgun → Authorized Recipients
  const recipient = "your.verified.email@example.com";

  const body = new URLSearchParams();
  body.append("from", `Rovers FC Sandbox <postmaster@${mailgunDomain}>`);
  body.append("to", recipient);
  body.append("subject", "📥 New Rovers FC Enrollment Submission");
  body.append(
    "text",
    `
A new enrollment was submitted:

— Player Info —
Name: ${firstName} ${lastName}
DOB: ${birthDate}
Gender: ${gender}
School: ${school}
Grade: ${grade}

— Parent/Guardian —
Name: ${parentName}
Relationship: ${relationship}
Email: ${email}
Phone: ${phone}
Address: ${address}, ${city}, ${state} ${zip}

— Emergency Contact —
Name: ${emergencyName}
Relationship: ${emergencyRelationship}
Phone: ${emergencyPhone}

— Soccer Experience —
Years: ${experience}
Position(s): ${position}
Subscribed to newsletter? ${newsletter}

— Signature —
Parent Signature: ${parentSignature}
Date: ${signatureDate}

(End of submission.)
    `.trim()
  );

  console.log("🐝 Sending to Mailgun…");
  let mgResponse;
  try {
    mgResponse = await fetch(mgEndpoint, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`api:${mailgunKey}`),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });
  } catch (err) {
    console.error("🐝 Mailgun fetch error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Unable to reach Mailgun." }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  const respText = await mgResponse.text();
  console.log("🐝 Mailgun response status:", mgResponse.status);
  console.log("🐝 Mailgun response body:", respText);

  if (!mgResponse.ok) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Mailgun error: ${mgResponse.status} – ${respText}`
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // 6) All good → return JSON success  
  return new Response(
    JSON.stringify({ success: true }), 
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
