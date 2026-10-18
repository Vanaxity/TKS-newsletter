// Usage: npm run draft-article -- "<youtube url>" [> out.json]
// Runs the summariser (a few cents) and prints a ready-to-insert article as JSON.
import { splitPreview } from "@/lib/articles/preview";
import { randomSuffix, slugify } from "@/lib/articles/slug";
import { summariseVideo } from "@/lib/summariser/summarise";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Use the environment as is.
}

async function main() {
  const input = process.argv[2];
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!input || !apiKey) {
    console.error(!input ? 'Usage: npm run draft-article -- "<youtube url>"' : "OPENROUTER_API_KEY is missing.");
    process.exitCode = 1;
    return;
  }

  const r = await summariseVideo(input, { apiKey, model: process.env.SUMMARISER_MODEL || undefined });
  if (r.status !== "ok") {
    console.error(`${r.status}: ${r.reason} (cost $${r.costUsd.toFixed(4)})`);
    process.exitCode = 1;
    return;
  }
  const d = r.draft;
  console.log(
    JSON.stringify(
      {
        slug: slugify(d.headline, randomSuffix()),
        youtube_video_id: r.videoId,
        headline: d.headline,
        dek: d.dek,
        body_md: d.articleMarkdown,
        preview_md: splitPreview(d.articleMarkdown),
        tags: d.tags,
        read_minutes: r.readMinutes,
        video_title: d.videoTitle,
        channel_name: d.channel,
        video_minutes: d.videoMinutes,
        problems: r.problems,
        cost_usd: r.costUsd,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(`error: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
