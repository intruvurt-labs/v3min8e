export default async () => {
  return new Response(JSON.stringify({
    status: "ONLINE",
    health: 1,
    lastPing: new Date().toISOString(),
    activeUsers: 42
  }), { headers: { 'content-type': 'application/json' }});
};
