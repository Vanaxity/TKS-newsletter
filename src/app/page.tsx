import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <h1 className="text-5xl font-semibold tracking-tight text-tks-black sm:text-7xl">TKS articles</h1>
      <p className="max-w-md text-lg text-tks-grey">
        Cool videos from #r-thisiscool, turned into articles. Coming soon.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/signup"
          className="rounded-full bg-tks-green px-6 py-3 font-semibold text-tks-black transition hover:bg-tks-green-hover"
        >
          Sign up
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-tks-black px-6 py-3 font-semibold text-tks-black transition hover:bg-tks-black hover:text-tks-white"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
