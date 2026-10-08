import type { CSSProperties } from "react";
export function Icon({
  name,
  size = 20,
  style,
}: {
  name:
    | "camera"
    | "lens"
    | "grid"
    | "download"
    | "plus"
    | "arrow"
    | "close"
    | "compare"
    | "edit"
    | "trash";
  size?: number;
  style?: CSSProperties;
}) {
  const paths = {
    camera: (
      <>
        <path d="M3 7h4l2-3h6l2 3h4v13H3z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),
    lens: (
      <>
        <ellipse cx="12" cy="5" rx="7" ry="3" />
        <path d="M5 5v14c0 4 14 4 14 0V5M5 10c0 4 14 4 14 0M5 15c0 4 14 4 14 0" />
      </>
    ),
    grid: (
      <>
        <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
      </>
    ),
    plus: <path d="M12 4v16M4 12h16" />,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    close: <path d="m5 5 14 14M5 19 19 5" />,
    compare: (
      <>
        <path d="M4 5h6v14H4zM14 5h6v14h-6z" />
      </>
    ),
    edit: (
      <>
        <path d="m4 16 12-12 4 4L8 20H4zM13 7l4 4" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {paths[name]}
    </svg>
  );
}
