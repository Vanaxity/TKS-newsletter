"use client";

import { Bookmark01Icon, RepeatIcon, Share08Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef, useState, useTransition } from "react";
import { CometDial, PulseHeart } from "@/components/react-bits/typed";
import { rateArticle, toggleRepost, toggleSave } from "./actions";

type Props = {
  articleId: number;
  headline: string;
  repostCount: number;
  ratingAvg: number | null;
  ratingCount: number;
  mine: { score: number | null; saved: boolean; reposted: boolean };
};

const GREEN = "#51B04C";

// Rate (Comet Dial), repost (Pulse Heart), save and share, for signed-in members.
export function ArticleActions({ articleId, headline, repostCount, ratingAvg, ratingCount, mine }: Props) {
  const [score, setScore] = useState<number | null>(mine.score);
  const [rateState, setRateState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saved, setSaved] = useState(mine.saved);
  const [reposted, setReposted] = useState(mine.reposted);
  const [count, setCount] = useState(repostCount);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onRate(value: number) {
    setScore(value);
    setRateState("saving");
    if (timer.current) clearTimeout(timer.current);
    // Save once the dial settles, not on every tick of a drag.
    timer.current = setTimeout(() => {
      startTransition(async () => {
        const res = await rateArticle(articleId, value);
        setRateState(res.ok ? "saved" : "error");
      });
    }, 600);
  }

  function onRepost() {
    startTransition(async () => {
      const res = await toggleRepost(articleId);
      if (res) {
        setReposted(res.reposted);
        setCount(res.count);
      }
    });
  }

  function onSave() {
    setSaved((s) => !s);
    startTransition(async () => {
      const res = await toggleSave(articleId);
      if (res) setSaved(res.saved);
    });
  }

  async function onShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: headline, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareNote("Link copied");
    } catch {
      setShareNote("Couldn't share. Copy the address bar instead.");
    }
    setTimeout(() => setShareNote(null), 2000);
  }

  return (
    <section aria-label="Your reaction" className="flex flex-col items-center gap-6 rounded-3xl bg-tks-black p-6 text-tks-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div className="flex flex-col items-center gap-2">
        <CometDial
          value={score ?? 5}
          min={1}
          max={10}
          step={1}
          unit=""
          label="Your rating out of 10"
          accent={GREEN}
          ink="#F2F2F2"
          size={170}
          onChange={onRate}
        />
        <p className="text-sm text-tks-line" aria-live="polite">
          {rateState === "saving"
            ? "Saving…"
            : rateState === "error"
              ? "Couldn't save your rating"
              : score
                ? `You rated it ${score}/10`
                : "Drag to rate it out of 10"}
        </p>
        {ratingAvg !== null ? (
          <p className="text-sm text-tks-line">
            Average {ratingAvg} from {ratingCount} ratings
          </p>
        ) : null}
      </div>

      <div className="flex flex-col items-center gap-4 sm:items-end">
        <PulseHeart
          liked={reposted}
          count={count}
          onChange={onRepost}
          icon={<HugeiconsIcon icon={RepeatIcon} size={28} />}
          likedColor={GREEN}
          idleColor="#8F9091"
          pillColor="#232628"
          textColor="#F2F2F2"
          size={32}
          label={reposted ? "Undo repost" : "Repost"}
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onSave}
            aria-pressed={saved}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              saved ? "bg-tks-green text-on-green" : "border border-tks-grey text-tks-white hover:border-tks-white"
            }`}
          >
            <HugeiconsIcon icon={Bookmark01Icon} size={18} />
            {saved ? "Saved" : "Save"}
          </button>
          <button
            type="button"
            onClick={onShare}
            className="flex items-center gap-2 rounded-full border border-tks-grey px-4 py-2 text-sm font-semibold text-tks-white hover:border-tks-white"
          >
            <HugeiconsIcon icon={Share08Icon} size={18} />
            Share
          </button>
        </div>
        <p className="h-5 text-sm text-tks-green" aria-live="polite">
          {shareNote}
        </p>
      </div>
    </section>
  );
}
