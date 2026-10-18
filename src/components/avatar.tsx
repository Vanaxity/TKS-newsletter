import { initials } from "@/lib/avatar";

// A round profile photo, or initials on TKS green when there's no photo.
export function Avatar({
  url,
  firstName,
  lastName,
  size = 64,
}: {
  url: string | null;
  firstName: string | null;
  lastName: string | null;
  size?: number;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-tks-green font-semibold text-tks-black"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed storage URL
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        initials(firstName, lastName)
      )}
    </span>
  );
}
