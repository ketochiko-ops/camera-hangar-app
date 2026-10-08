import { useId } from "react";
import styles from "./Equipment.module.css";
// Original generic equipment drawing. No brand mark or traced product outline.
export function EquipmentImage({
  image,
  name,
  kind,
  compact = false,
}: {
  image?: string;
  name: string;
  kind: "camera" | "lens";
  compact?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <div
      className={`${styles.equipmentImage} ${compact ? styles.compact : ""}`}
    >
      {image ? (
        <img src={image} alt={`${name}の写真`} />
      ) : (
        <>
          <svg
            viewBox="0 0 620 410"
            role="img"
            aria-label={`${name}の画像未設定・オリジナルイラスト`}
          >
            <defs>
              <linearGradient id={`metal-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#90999a" />
                <stop offset=".35" stopColor="#394347" />
                <stop offset="1" stopColor="#12191b" />
              </linearGradient>
              <radialGradient id={`glass-${id}`}>
                <stop stopColor="#374b52" />
                <stop offset=".4" stopColor="#102a30" />
                <stop offset=".7" stopColor="#0b1114" />
                <stop offset="1" stopColor="#26343b" />
              </radialGradient>
              <pattern
                id={`grip-${id}`}
                width="5"
                height="5"
                patternUnits="userSpaceOnUse"
              >
                <rect width="5" height="5" fill="#222b2d" />
                <circle cx="1" cy="1" r=".7" fill="#4d5658" />
              </pattern>
            </defs>
            <ellipse
              cx="315"
              cy="339"
              rx="215"
              ry="19"
              fill="#000"
              opacity=".35"
            />
            {kind === "camera" ? (
              <g transform="rotate(-7 310 210)">
                <path
                  d="M102 147h87l30-37h110l29 37h134v166H102z"
                  fill={`url(#metal-${id})`}
                  stroke="#6d797c"
                  strokeWidth="2"
                />
                <path
                  d="M109 175h91v129h-91zM417 167h67v137h-67z"
                  fill={`url(#grip-${id})`}
                />
                <path d="M108 148h381v23H108z" fill="#929b9b" />
                <path d="M222 110h102l25 37H194z" fill="#7c8789" />
                <rect
                  x="246"
                  y="123"
                  width="56"
                  height="17"
                  rx="3"
                  fill="#1e272b"
                />
                <path d="M112 176h371" stroke="#b4c0bd" opacity=".4" />
                <ellipse
                  cx="154"
                  cy="137"
                  rx="24"
                  ry="8"
                  fill="#778385"
                  stroke="#a8b2b3"
                />
                <rect x="130" y="125" width="48" height="12" fill="#364247" />
                <ellipse cx="154" cy="125" rx="24" ry="8" fill="#858f8f" />
                <ellipse cx="397" cy="142" rx="25" ry="8" fill="#111d20" />
                <ellipse
                  cx="397"
                  cy="132"
                  rx="25"
                  ry="8"
                  fill="#778385"
                  stroke="#a8b2b3"
                />
                <circle
                  cx="304"
                  cy="239"
                  r="92"
                  fill="#12191b"
                  stroke="#849193"
                  strokeWidth="3"
                />
                <circle
                  cx="304"
                  cy="239"
                  r="79"
                  fill="#263237"
                  stroke="#46565b"
                  strokeWidth="7"
                />
                <circle
                  cx="304"
                  cy="239"
                  r="64"
                  fill={`url(#glass-${id})`}
                  stroke="#727e81"
                  strokeWidth="2"
                />
                <circle
                  cx="304"
                  cy="239"
                  r="48"
                  fill="#0b171c"
                  stroke="#23404a"
                  strokeWidth="2"
                />
                <circle cx="304" cy="239" r="33" fill="#14282b" />
                <path
                  d="M270 206q32-24 59 3"
                  stroke="#779799"
                  strokeWidth="3"
                  fill="none"
                  opacity=".4"
                />
                <circle cx="282" cy="218" r="12" fill="#9bb4b9" opacity=".1" />
                <rect x="446" y="184" width="14" height="10" fill="#d5dfd9" />
                <circle cx="186" cy="272" r="6" fill="#7b8b8b" />
              </g>
            ) : (
              <g transform="rotate(-20 310 215)">
                <path
                  d="M203 105h207v213H203z"
                  fill={`url(#metal-${id})`}
                  stroke="#67777b"
                  strokeWidth="2"
                />
                <path
                  d="M203 173h207v54H203zM203 255h207v32H203z"
                  fill={`url(#grip-${id})`}
                />
                <ellipse
                  cx="307"
                  cy="318"
                  rx="104"
                  ry="30"
                  fill="#152024"
                  stroke="#5c6b71"
                  strokeWidth="3"
                />
                <ellipse
                  cx="307"
                  cy="105"
                  rx="104"
                  ry="42"
                  fill="#202c31"
                  stroke="#88999d"
                  strokeWidth="3"
                />
                <ellipse
                  cx="307"
                  cy="105"
                  rx="83"
                  ry="32"
                  fill={`url(#glass-${id})`}
                  stroke="#50696f"
                  strokeWidth="3"
                />
                <ellipse cx="307" cy="105" rx="60" ry="23" fill="#122327" />
                <path
                  d="M263 95q43-20 87 0"
                  stroke="#779799"
                  strokeWidth="3"
                  fill="none"
                  opacity=".4"
                />
                <path
                  d="M205 160h203M205 237h203M205 293h203"
                  stroke="#83958c"
                />
                <rect
                  x="259"
                  y="137"
                  width="92"
                  height="20"
                  rx="2"
                  fill="#162226"
                />
                <path d="M272 145h65" stroke="#89a8a7" strokeDasharray="4 6" />
              </g>
            )}
          </svg>
          {!compact && (
            <span className={styles.imageNote}>
              IMAGE NOT SET · ORIGINAL SCHEMATIC
            </span>
          )}
        </>
      )}
    </div>
  );
}
