import { connection } from "next/server";

// Process liveness: no session, database access or billable tool call.
export async function GET() {
  await connection();
  return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
