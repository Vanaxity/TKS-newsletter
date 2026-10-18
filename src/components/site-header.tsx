import Link from "next/link";
import { logout } from "@/app/actions/logout";
import { ThemeToggle } from "./theme-toggle";

// Header for members' pages. Static, so it renders instantly; "Profile" goes through /me.
export function SiteHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <Link href="/feed" className="text-sm font-semibold tracking-tight text-tks-black">
        TKS articles
      </Link>
      <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-tks-black">
        <Link href="/feed" className="hover:underline hover:underline-offset-4">
          Feed
        </Link>
        <Link href="/saved" className="hover:underline hover:underline-offset-4">
          Saved
        </Link>
        <Link href="/me" className="hover:underline hover:underline-offset-4">
          Profile
        </Link>
        <ThemeToggle />
        <form action={logout}>
          <button type="submit" className="underline underline-offset-4">
            Log out
          </button>
        </form>
      </nav>
    </header>
  );
}
