export async function POST(req: Request) {
  const { token, userId, walletAddress } = await req.json();
  if (!token || !userId || !walletAddress) {
    return new Response(JSON.stringify({ success:false, message:"Missing fields" }), { status:400 });
  }

  // TODO: optionally ping Telegram getMe to validate token format
  // const res = await fetch(`https://api.telegram.org/bot${token}/getMe`).then(r => r.json());
  const valid = /^(\d+):[A-Za-z0-9_-]{20,}$/.test(token); // quick sanity check

  return Response.json({ success: valid, message: valid ? "Token ok" : "Invalid token" });
}
