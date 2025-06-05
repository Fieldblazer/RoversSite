// functions/enroll.js
export async function onRequestPost({ request, env }) {
  // Parse the incoming form data (including files)
  // Using request.formData() works for multipart/form-data.
  const formData = await request.formData();

  // Extract fields by name (these match your <input name="...">)
  const firstName   = formData.get("firstName");
  const lastName    = formData.get("lastName");
  const email       = formData.get("email");
  // …and so on for every text field.

  // For file uploads (proofAge, proofResidency, physicalExam):
  // formData.get("proofAge") will be a File object (only if browser used enctype="multipart/form-data")
  const proofAgeFile       = formData.get("proofAge");
  const proofResidencyFile = formData.get("proofResidency");
  const physicalExamFile   = formData.get("physicalExam");

  // Basic validation example:
  if (!firstName || !lastName || !email) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing required fields." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // At this point you can:
  // 1) Store everything in a KV, R2, or Durable Object.
  // 2) Send a confirmation email via an external API (SendGrid, Mailgun, etc.).
  // 3) Save to a third‐party database by making a fetch() to that service.
  // For a quick example, let’s write the data to a KV called ENROLLMENTS_KV:
  //
  //   await env.ENROLLMENTS_KV.put(
  //     crypto.randomUUID(),
  //     JSON.stringify({
  //       firstName,
  //       lastName,
  //       email,
  //       // …all the other text fields…
  //       proofAgeFilename: proofAgeFile?.name || "",
  //       proofResidencyFilename: proofResidencyFile?.name || "",
  //       physicalExamFilename: physicalExamFile?.name || "",
  //       submittedAt: new Date().toISOString()
  //     })
  //   );
  //
  // (Of course, you’d need to bind a KV namespace in your Pages settings under "Functions > Variables & Secrets".)

  // For now, let’s simply redirect the user to a thank‐you page:
  return Response.redirect("/thank-you.html");
}
