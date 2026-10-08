import { ratingPercent } from "../utils/domain";
import styles from "./Equipment.module.css";
export function RatingBars({
  ratings,
  labels,
}: {
  ratings: Record<string, number>;
  labels: Record<string, string>;
}) {
  return (
    <div className={styles.ratings}>
      {Object.entries(labels).map(([key, label]) => (
        <div className={styles.rating} key={key}>
          <div className={styles.ratingLabel}>
            <span>{label}</span>
            <strong>
              {Number.isFinite(ratings[key])
                ? Math.max(0, Math.min(10, ratings[key])).toFixed(1)
                : "0.0"}
              <small> / 10</small>
            </strong>
          </div>
          <div
            className={styles.track}
            role="meter"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={10}
            aria-valuenow={ratingPercent(ratings[key]) / 10}
          >
            <div style={{ width: `${ratingPercent(ratings[key])}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
