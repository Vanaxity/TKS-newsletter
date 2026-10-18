export type ThemeChoice = "light" | "dark" | "system";
export const THEME_KEY = "theme";

export function resolveTheme(choice: ThemeChoice, prefersDark: boolean): "light" | "dark" {
  if (choice === "system") return prefersDark ? "dark" : "light";
  return choice;
}

// Runs in <head> before the first paint so the page never flashes the wrong theme.
export const THEME_SCRIPT = `(function(){try{var c=localStorage.getItem("${THEME_KEY}");var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var t=c==="light"||c==="dark"?c:(d?"dark":"light");document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
