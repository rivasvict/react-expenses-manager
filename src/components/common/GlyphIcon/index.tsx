import React from "react";

/**
 * A single-source, dependency-free glyph set drawn in one 2px-stroke family
 * (viewBox 0 0 24 24) to match the codicon chevrons already used in the header.
 * It backs both the category chips on entry rows (candidate 1) and the main
 * navigation destinations (candidate 7), so the ledger and the nav speak one
 * visual language.
 *
 * Stroke defaults live on the <svg> element and inherit down; individual marks
 * override only where they must (e.g. a filled dot).
 */
export type GlyphName =
  | "home"
  | "car"
  | "bus"
  | "cart"
  | "coffee"
  | "wine"
  | "zap"
  | "wifi"
  | "phone"
  | "repeat"
  | "bank"
  | "shirt"
  | "gift"
  | "ticket"
  | "plane"
  | "dumbbell"
  | "sparkle"
  | "alert"
  | "user"
  | "book"
  | "health"
  | "bottle"
  | "briefcase"
  | "deposit"
  | "vault"
  | "grid"
  | "bucket"
  | "database";

const GLYPHS: Record<GlyphName, React.ReactNode> = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.7V21h5v-6h4v6h5V9.7" />
    </>
  ),
  car: (
    <>
      <path d="M5.5 11l1.1-3.8A2 2 0 0 1 8.5 5.8h7a2 2 0 0 1 1.9 1.4L18.5 11" />
      <rect x="3" y="11" width="18" height="6" rx="1.6" />
      <circle cx="7.3" cy="17.6" r="1.4" />
      <circle cx="16.7" cy="17.6" r="1.4" />
    </>
  ),
  bus: (
    <>
      <rect x="4.5" y="3.5" width="15" height="14" rx="2" />
      <path d="M4.5 10h15" />
      <path d="M8.5 14h.01M15.5 14h.01" />
      <path d="M7.5 17.5v2.5M16.5 17.5v2.5" />
    </>
  ),
  cart: (
    <>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </>
  ),
  coffee: (
    <>
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" />
      <line x1="6" y1="1.5" x2="6" y2="4" />
      <line x1="10" y1="1.5" x2="10" y2="4" />
      <line x1="14" y1="1.5" x2="14" y2="4" />
    </>
  ),
  wine: (
    <>
      <path d="M8 3h8l-.6 6.2a3.4 3.4 0 0 1-6.8 0z" />
      <path d="M12 12.8V19" />
      <path d="M8.5 21h7" />
    </>
  ),
  zap: (
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  ),
  wifi: (
    <>
      <path d="M2.8 9.8a14.5 14.5 0 0 1 18.4 0" />
      <path d="M5.8 13.2a10 10 0 0 1 12.4 0" />
      <path d="M8.8 16.5a5.5 5.5 0 0 1 6.4 0" />
      <circle cx="12" cy="19.6" r="0.4" fill="currentColor" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2.2" />
      <path d="M11 18.3h2" />
    </>
  ),
  repeat: (
    <>
      <polyline points="17 1.5 21 5.5 17 9.5" />
      <path d="M3 11.5v-2a4 4 0 0 1 4-4h14" />
      <polyline points="7 22.5 3 18.5 7 14.5" />
      <path d="M21 12.5v2a4 4 0 0 1-4 4H3" />
    </>
  ),
  bank: (
    <>
      <path d="M3.5 9.5 12 4l8.5 5.5" />
      <line x1="4.5" y1="9.5" x2="19.5" y2="9.5" />
      <line x1="6.5" y1="13" x2="6.5" y2="17.5" />
      <line x1="10.3" y1="13" x2="10.3" y2="17.5" />
      <line x1="13.7" y1="13" x2="13.7" y2="17.5" />
      <line x1="17.5" y1="13" x2="17.5" y2="17.5" />
      <line x1="3.5" y1="21" x2="20.5" y2="21" />
    </>
  ),
  shirt: (
    <path d="M9.2 3.5 12 5.2l2.8-1.7 5 3.2-1.8 3-2-1.1V20.5H8V8.6l-2 1.1-1.8-3z" />
  ),
  gift: (
    <>
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </>
  ),
  ticket: (
    <>
      <path d="M2 9.5a2.8 2.8 0 0 0 0 5V19h20v-4.5a2.8 2.8 0 0 1 0-5V5H2z" />
      <path d="M14 5v2.4M14 10.8v2.4M14 16.6V19" />
    </>
  ),
  plane: (
    <>
      <path d="M21.5 2.5 11 13" />
      <path d="M21.5 2.5 14.8 21.5l-3.8-8.5-8.5-3.8z" />
    </>
  ),
  dumbbell: (
    <>
      <path d="M6.7 6.7v10.6M17.3 6.7v10.6" />
      <path d="M3.5 9.5v5M20.5 9.5v5" />
      <path d="M6.7 12h10.6" />
    </>
  ),
  sparkle: (
    <>
      <path d="M11 4l1.6 4.6L17.2 10l-4.6 1.6L11 16l-1.6-4.4L4.8 10l4.6-1.4z" />
      <path d="M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
  user: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  book: (
    <>
      <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
      <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
    </>
  ),
  health: (
    <>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8z" />
      <polyline points="7.5 12 10 12 11.5 9.8 13 13.6 14.5 12 16.5 12" />
    </>
  ),
  bottle: (
    <>
      <path d="M9 8.5h6V19a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
      <path d="M10 8.5V7a2 2 0 0 1 4 0v1.5" />
      <path d="M12 2.8V5" />
      <path d="M9 12.3h6M9 15.3h6" />
    </>
  ),
  briefcase: (
    <>
      <rect x="2.5" y="7" width="19" height="13.5" rx="2" />
      <path d="M16 20.5V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v15.5" />
    </>
  ),
  deposit: (
    <>
      <path d="M12 3v9" />
      <polyline points="8.5 8.5 12 12 15.5 8.5" />
      <path d="M3 13.5v4a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-4" />
    </>
  ),
  vault: (
    <>
      <rect x="3" y="3.5" width="18" height="15.5" rx="2" />
      <circle cx="12" cy="11.2" r="3.4" />
      <path d="M12 7.8V6.5M12 16v-1.4M8.6 11.2H7.3M16.7 11.2h-1.3" />
      <path d="M6 19v2M18 19v2" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
    </>
  ),
  bucket: (
    <>
      <path d="M4.2 7.5h15.6l-1.4 11.8a2 2 0 0 1-2 1.7H7.6a2 2 0 0 1-2-1.7z" />
      <path d="M3.2 7.5a8.8 3 0 0 1 17.6 0" />
      <path d="M5.7 13.4h12.6" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5.5" rx="7.5" ry="3" />
      <path d="M4.5 5.5v6c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-6" />
      <path d="M4.5 11.5v6c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-6" />
    </>
  ),
};

type GlyphIconProps = {
  name: GlyphName;
  size?: number;
  className?: string;
};

const GlyphIcon = ({ name, size = 20, className }: GlyphIconProps) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {GLYPHS[name]}
  </svg>
);

export default GlyphIcon;
export { GLYPHS };
