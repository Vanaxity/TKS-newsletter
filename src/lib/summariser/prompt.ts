import { INTEREST_SLUGS } from "@/lib/interests";

export const SUMMARISER_PROMPT = `Watch this video and write an article about it for curious teenagers in an innovation program.

Length: first work out how long the video is. If it is 5 minutes or shorter, write 100-250 words and never pad. If it is longer, write about 30 words per minute of video, at least 250 and at most 1500 words. For example, a 20-minute video needs about 600 words and a 45-minute video about 1350. Cover the video's main ideas in order until you reach that length. Use ## subheadings when the article is longer than about 400 words.

Rules:
- Only state things the video actually says or shows. If unsure, leave it out.
- Write in your own words. Do not copy sentences from the narration.
- Plain, vivid, accurate. No filler. Never write "in this video" or "the video discusses".
- Pick 1 to 3 tags, only from this list: ${INTEREST_SLUGS.join(", ")}.

Return ONLY a JSON object with these keys:
"video_title" (the video's exact title), "channel" (the channel name), "video_minutes" (number),
"headline" (your article's headline), "dek" (one-sentence subtitle), "tags" (array), "article_markdown" (the article, Markdown, no headline).`;
