export async function GET() {
  // TODO: pull from DB or telemetry
  return Response.json({
    success: true,
    data: { totalVermDetected: 2938402 }
  }, { headers: { "Cache-Control": "no-store" }});
}
