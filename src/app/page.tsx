export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <h1 className="text-5xl font-semibold tracking-tight text-tks-black sm:text-7xl">TKS articles</h1>
      <p className="max-w-md text-lg text-tks-grey">
        Cool videos from #r-thisiscool, turned into articles. Coming soon.
      </p>
      <span className="rounded-full bg-tks-green px-5 py-2 text-sm font-medium text-tks-black">
        Coming soon
      </span>
    </main>
  );
}
