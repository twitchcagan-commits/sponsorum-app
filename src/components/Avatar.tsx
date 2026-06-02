// Shared avatar: renders the uploaded profile photo when available, otherwise a
// solid initials tile. Sizing/shape are controlled by the caller via class props
// so it can match each surface (navbar chip, profile hero, message list, …).

// First letters of the first and last word, e.g. "Can Yılmaz" → "CY", "ahmet" → "AH".
export function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

export default function Avatar({
  src,
  name,
  sizeClass,
  textClass = "text-sm font-bold",
  rounded = "rounded-xl",
}: {
  src?: string | null;
  name: string;
  sizeClass: string;            // e.g. "w-11 h-11"
  textClass?: string;           // font size/weight for the initials fallback
  rounded?: string;             // e.g. "rounded-lg" | "rounded-full"
}) {
  const base = `${sizeClass} ${rounded} flex-shrink-0`;

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`${base} object-cover`}
        style={{ backgroundColor: "#042C53" }}
      />
    );
  }

  return (
    <div
      className={`${base} flex items-center justify-center text-white ${textClass}`}
      style={{ backgroundColor: "#042C53" }}
    >
      {avatarInitials(name)}
    </div>
  );
}
