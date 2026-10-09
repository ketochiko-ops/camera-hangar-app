import { cameraPartLabels, MAX_CAMERA_PARTS, type CameraPart } from "../types";
import { formatItemLabel, type LabelMode } from "../context/LabelModeContext";
import styles from "./CameraParts.module.css";

export function CameraParts({
  parts,
  mode,
  exporting = false,
  portrait = false,
}: {
  parts: CameraPart[];
  mode: LabelMode;
  exporting?: boolean;
  portrait?: boolean;
}) {
  if (!parts.length) return null;
  const title = formatItemLabel("ADDITIONAL PARTS", mode);
  return (
    <section
      className={`${styles.panel} ${exporting ? styles.exporting : ""} ${portrait ? styles.portrait : ""}`}
      data-testid="camera-parts"
    >
      <div className={styles.header}>
        <h3>{title}</h3>
        <span>
          {String(parts.length).padStart(2, "0")} /{" "}
          {String(MAX_CAMERA_PARTS).padStart(2, "0")}
        </span>
      </div>
      <ul aria-label={title}>
        {parts.map((part, index) => (
          <li key={index}>
            <span className={styles.slot} aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <span className={styles.kind}>
                {formatItemLabel(cameraPartLabels[part.kind], mode)}
              </span>
              <strong>{part.name}</strong>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
