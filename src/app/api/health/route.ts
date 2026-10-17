import { createPublicClient } from "@/lib/supabase/public";

// Proves a deployment can reach Supabase: counts the interest rows.
export async function GET() {
  try {
    const { count, error } = await createPublicClient()
      .from("interests")
      .select("slug", { count: "exact", head: true });
    if (error) throw new Error(error.message);
    return Response.json({ ok: true, interests: count });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: message }, { status: 503 });
  }
}
