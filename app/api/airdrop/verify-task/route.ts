export async function POST(req: Request) {
  const { taskId, userId, walletAddress, proof } = await req.json();

  if (!taskId || !userId || !walletAddress) {
    return new Response(JSON.stringify({ success:false, message:"Missing fields" }), { status:400 });
  }

  // TODO: verify per-task
  // e.g. taskId === "first_scan" => check scan log table for walletAddress
  const ok = true;

  return Response.json({ success: ok, message: ok ? "Verified" : "Failed" });
}
