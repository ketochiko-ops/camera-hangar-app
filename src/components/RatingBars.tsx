import { ratingPercent } from "../utils/domain";
import styles from "./Equipment.module.css";
export function RatingBars({
  ratings,
  labels,
  base = ratings,
  deltas = {},
}: {
  ratings: Record<string, number>;
  labels: Record<string, string>;
  base?: Record<string, number>;
  deltas?: Record<string, number>;
}) {
  return (
    <div className={styles.ratings}>
      {Object.entries(labels).map(([key, label]) => {
        const value = ratingPercent(ratings[key]) / 10;
        const original = ratingPercent(base[key]) / 10;
        const delta = deltas[key] ?? 0;
        const change = `${delta > 0 ? "+" : "−"}${Math.abs(delta).toFixed(1)}`;
        const direction =
          delta > 0 ? "increase" : delta < 0 ? "decrease" : "none";
        return (
          <div className={styles.rating} key={key}>
            <div className={styles.ratingLabel}>
              <span>{label}</span>
              <strong data-change={direction}>
                {delta !== 0 && (
                  <span
                    className={styles.ratingDelta}
                    data-testid="rating-delta"
                  >
                    {change}
                  </span>
                )}
                {value.toFixed(1)}
                <small> / 10</small>
              </strong>
            </div>
            <div
              className={styles.track}
              role="meter"
              aria-label={label}
              aria-valuemin={0}
              aria-valuemax={10}
              aria-valuenow={value}
              aria-valuetext={
                delta !== 0
                  ? `${original.toFixed(1)} → ${value.toFixed(1)} (${change})`
                  : undefined
              }
              data-change={direction}
            >
              <div style={{ width: `${Math.min(original, value) * 10}%` }} />
              {delta !== 0 && (
                <span
                  className={
                    delta > 0 ? styles.increaseSegment : styles.decreaseSegment
                  }
                  aria-hidden="true"
                  style={{
                    left: `${Math.min(original, value) * 10}%`,
                    width: `${Math.abs(value - original) * 10}%`,
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
