import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Markdown } from "@/components/markdown";
import { ArticleActions } from "./article-actions";
import { YouTubeEmbed } from "@/components/youtube-embed";
import type { ArticleCard } from "@/lib/articles/feed";
import { getArticle, getArticleMeta } from "@/lib/articles/queries";
import { INTERESTS } from "@/lib/interests";

const LABELS = new Map<string, string>(INTERESTS.map((i) => [i.slug, i.label]));

export async function generateMetadata({ params }: PageProps<"/a/[slug]">): Promise<Metadata> {
  const meta = await getArticleMeta((await params).slug);
  return meta ? { title: `${meta.headline} · TKS articles`, description: meta.dek } : { title: "TKS articles" };
}

export default function ArticlePage({ params }: PageProps<"/a/[slug]">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10">
      {/* The homepage sends members on to their feed, so this works for visitors from shared links too. */}
      <Link href="/" className="text-sm font-semibold tracking-tight text-tks-black">
        TKS articles
      </Link>
      <Suspense fallback={<p className="text-tks-grey">Loading the article…</p>}>
        <ArticleBody params={params} />
      </Suspense>
    </main>
  );
}

async function ArticleBody({ params }: { params: PageProps<"/a/[slug]">["params"] }) {
  const result = await getArticle((await params).slug);
  if (!result) notFound();
  const { article } = result;

  return (
    <article className="flex flex-col gap-6">
      <Header article={article} member={result.kind === "full"} />
      {result.kind === "full" ? (
        <>
          <YouTubeEmbed videoId={article.youtubeVideoId} title={result.article.videoTitle ?? article.headline} />
          <Markdown>{result.article.bodyMd}</Markdown>
          <ArticleActions
            articleId={result.article.id}
            headline={article.headline}
            repostCount={result.article.repostCount}
            ratingAvg={result.article.ratingAvg}
            ratingCount={result.article.ratingCount}
            mine={result.article.mine}
          />
          {result.article.videoTitle ? (
            <p className="text-sm text-tks-grey">
              Based on “{result.article.videoTitle}”{result.article.channelName ? ` by ${result.article.channelName}` : ""}.
            </p>
          ) : null}
        </>
      ) : (
        <>
          <div className="relative">
            <Markdown>{result.article.previewMd}</Markdown>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-tks-offwhite" aria-hidden />
          </div>
          <SignUpWall />
        </>
      )}
    </article>
  );
}

function Header({ article, member }: { article: ArticleCard; member: boolean }) {
  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {article.tags.map((t) =>
          member ? (
            <Link key={t} href={`/feed?topic=${t}`} className="rounded-full bg-tks-green px-3 py-1 font-medium text-tks-black">
              {LABELS.get(t) ?? t}
            </Link>
          ) : (
            <span key={t} className="rounded-full bg-tks-green px-3 py-1 font-medium text-tks-black">
              {LABELS.get(t) ?? t}
            </span>
          ),
        )}
        <span className="text-tks-grey">{article.readMinutes} min read</span>
      </div>
      <h1 className="text-4xl font-semibold tracking-tight text-tks-black sm:text-5xl">{article.headline}</h1>
      <p className="text-xl text-tks-grey">{article.dek}</p>
    </header>
  );
}

function SignUpWall() {
  return (
    <aside className="flex flex-col items-start gap-4 rounded-3xl bg-tks-black p-6 text-tks-white sm:p-8">
      <h2 className="text-2xl font-semibold tracking-tight">Read the rest on TKS articles</h2>
      <p className="text-tks-line">It&apos;s for TKS students only. Sign up with the join code from TKS Slack to read every article.</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/signup" className="rounded-full bg-tks-green px-6 py-3 font-semibold text-tks-black hover:bg-tks-green-hover">
          Sign up
        </Link>
        <Link href="/login" className="rounded-full border border-tks-white px-6 py-3 font-semibold text-tks-white hover:bg-tks-white hover:text-tks-black">
          Log in
        </Link>
      </div>
    </aside>
  );
}
