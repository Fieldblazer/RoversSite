// functions/enroll.js

/**
 * Cloudflare Pages Function: handles POST /api/enroll
 *
 * This minimal version simply logs and replies { success: true }.
 * Once you confirm this is working, you can paste your Mailgun code back in.
 */

export async function onRequestPost({ request, env, context }) {
  // 1) Log so you can verify that this runs
  console.log("🐝 enroll.js onRequestPost was invoked at", new Date().toISOString());

  // 2) (Optional) Try to parse formData, just to be sure
  let formData;
  try {
    formData = await request.formData();
  } catch (err) {
    console.error("🐝 Failed to parse formData:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Invalid form submission." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3) (Optional) Log out one field so we know it arrived
  const firstName = formData.get("firstName") || "(no firstName)";
  console.log("🐝 Received firstName =", firstName);

  // 4) Return a simple JSON success
  return new Response(
    JSON.stringify({ success: true, receivedName: firstName }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
