// Usage: npm run summarise -- "<youtube url>"
// Runs the real summariser (costs a few cents) and prints the draft article.
import { summariseVideo } from "@/lib/summariser/summarise";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Fall back to whatever is already in the environment.
}

async function main() {
  const input = process.argv[2];
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!input) {
    console.error('Usage: npm run summarise -- "<youtube url>"');
    process.exit(1);
  }
  if (!apiKey) {
    console.error("OPENROUTER_API_KEY is missing. Add it to .env.local.");
    process.exit(1);
  }

  const result = await summariseVideo(input, { apiKey, model: process.env.SUMMARISER_MODEL || undefined });

  console.log(`status: ${result.status}`);
  console.log(`cost: $${result.costUsd.toFixed(4)}`);
  if (result.status !== "ok") {
    console.log(`${result.status}: ${result.reason}`);
    process.exitCode = 1; // not process.exit(): exiting mid-cleanup crashes Node on Windows
    return;
  }

  const { draft } = result;
  console.log(`problems: ${result.problems.length ? result.problems.join("; ") : "none"}\n`);
  console.log(`# ${draft.headline}\n`);
  console.log(`_${draft.dek}_\n`);
  console.log(`${draft.tags.join(", ")} · ${result.readMinutes} min read · ${result.wordCount} words`);
  console.log(`Source: ${draft.videoTitle} (${draft.channel}, ${draft.videoMinutes} min)\n`);
  console.log(draft.articleMarkdown);
}

main();
