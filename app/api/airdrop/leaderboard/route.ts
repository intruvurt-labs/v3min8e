export async function GET() {
  // TODO: read from DB
  const leaderboard = [
    { rank:1, username:"RatBane", avatar:"🥇", totalEarned:2847000, tasksCompleted:42, streak:12 },
    { rank:2, username:"ScanLord", avatar:"🥈", totalEarned:2117000, tasksCompleted:35, streak:9 },
  ];
  return Response.json({ success:true, data:{ leaderboard }});
}
