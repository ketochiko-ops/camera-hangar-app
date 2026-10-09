import { partFeatureLabels, type Camera } from "../types";
import { cameraFeatures } from "../utils/partEffects";
import { formatItemLabel, type LabelMode } from "../context/LabelModeContext";
import styles from "./CameraFeatures.module.css";

export function CameraFeatures({
  camera,
  mode,
  exporting = false,
}: {
  camera: Camera;
  mode: LabelMode;
  exporting?: boolean;
}) {
  const features = cameraFeatures(camera);
  const title = formatItemLabel("ADDITIONAL FUNCTIONS", mode);
  return (
    <section
      className={`${styles.panel} ${camera.additionalParts.length ? styles.afterParts : ""} ${exporting ? styles.exporting : ""}`}
      data-testid="camera-features"
    >
      <h3>{title}</h3>
      {features.length ? (
        <ul aria-label={title}>
          {features.map((feature) => (
            <li key={feature} data-testid="part-feature">
              + {formatItemLabel(partFeatureLabels[feature], mode)}
            </li>
          ))}
        </ul>
      ) : (
        <p>{formatItemLabel("NONE", mode)}</p>
      )}
      {(features.includes("ttl") || features.includes("hss")) && (
        <p className={styles.note}>
          {mode === "bilingual"
            ? "TTL：対応ストロボ使用時。HSS：対応カメラ・ストロボと無線使用時。TT600はTTL非対応。"
            : "TTL: compatible flash required. HSS: compatible camera / wireless flash required. TT600 does not support TTL."}
        </p>
      )}
    </section>
  );
}
