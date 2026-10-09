import { formatItemLabel, useLabelMode } from "../context/LabelModeContext";
import type { RangeScores, ShootingRange } from "../utils/shootingRange";
import { shootingRangeLabels } from "../utils/shootingRange";
import { RatingBars } from "./RatingBars";
import styles from "./Loadout.module.css";

export function ShootingRangePanel({
  ratings,
  profile,
  eligible,
  total,
}: {
  ratings: RangeScores;
  profile?: ShootingRange;
  eligible?: number;
  total?: number;
}) {
  const { mode } = useLabelMode();
  const title = formatItemLabel(
    profile ? "SHOOTING RANGE" : "SQUADRON COVERAGE",
    mode,
  );
  const focal = profile?.equivalent;
  return (
    <section
      className={styles.rangePanel}
      aria-label={title}
      data-testid={profile ? "unit-range" : "squadron-coverage"}
    >
      <div className={styles.rangeHeader}>
        {profile ? <h3>{title}</h3> : <h2>{title}</h2>}
        {focal && (
          <span>
            {formatItemLabel("35MM EQUIVALENT", mode)}{" "}
            {Number(focal.min.toFixed(1))}
            {focal.max !== focal.min
              ? `–${Number(focal.max.toFixed(1))}`
              : ""}{" "}
            mm
          </span>
        )}
        {!profile && (
          <span>
            {eligible} / {total} UNITS
          </span>
        )}
      </div>
      <RatingBars
        ratings={ratings}
        labels={Object.fromEntries(
          Object.entries(shootingRangeLabels).map(([key, label]) => [
            key,
            formatItemLabel(label, mode),
          ]),
        )}
      />
      <p className={styles.rangeNote}>
        {!profile
          ? "各レンジで最も得意な機体の値を表示します。焦点距離・センサー形式・マウント対応を確認できる機体を集計します。"
          : profile.status === "incomplete"
            ? "カメラとレンズを選ぶと撮影レンジを表示します。"
            : profile.status === "incompatible"
              ? "マウント不一致のため、編成全体の集計から外れています。"
              : profile.status === "unknown"
                ? "算出できるセンサー形式と焦点距離をデータ管理で確認してください。"
                : "広角・標準・望遠は35mm換算の焦点距離によるカバー力、接写はレンズのCLOSE FOCUS評価です。DX・EF-Sレンズは対応するクロップ画角で扱います。"}
      </p>
    </section>
  );
}
