import {
  cameraPartLabels,
  MAX_CAMERA_PARTS,
  MAX_PART_NAME_LENGTH,
  type CameraPart,
} from "../types";
import { formatItemLabel, type LabelMode } from "../context/LabelModeContext";
import styles from "./Manage.module.css";

export function CameraPartsEditor({
  parts,
  mode,
  error,
  onChange,
}: {
  parts: CameraPart[];
  mode: LabelMode;
  error?: string;
  onChange(update: (current: CameraPart[]) => CameraPart[]): void;
}) {
  return (
    <>
      <h3 className={styles.sectionLabel}>
        03 / {formatItemLabel("ADDITIONAL PARTS", mode)}{" "}
        <small>
          {parts.length} / {MAX_CAMERA_PARTS}
        </small>
      </h3>
      <p className={styles.partsHelp}>
        グリップ・マウントアダプターなどの装備を、カメラ画面とPNGに表示します。
      </p>
      <div className={styles.partsEditor}>
        {parts.map((part, index) => (
          <fieldset key={index} className={styles.partRow}>
            <legend>PART {String(index + 1).padStart(2, "0")}</legend>
            <label className={styles.field}>
              {formatItemLabel("TYPE", mode)}
              <select
                aria-label={`追加パーツ${index + 1}の種類`}
                value={part.kind}
                onChange={(event) =>
                  onChange((current) =>
                    current.map((entry, i) =>
                      i === index
                        ? {
                            ...entry,
                            kind: event.target.value as CameraPart["kind"],
                          }
                        : entry,
                    ),
                  )
                }
              >
                {Object.entries(cameraPartLabels).map(([kind, label]) => (
                  <option key={kind} value={kind}>
                    {formatItemLabel(label, mode)}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              {formatItemLabel("PART NAME", mode)}
              <input
                aria-label={`追加パーツ${index + 1}の名称`}
                value={part.name}
                maxLength={MAX_PART_NAME_LENGTH}
                aria-required="true"
                aria-invalid={!!error && !part.name.trim()}
                aria-describedby={error ? "parts-error" : undefined}
                placeholder="例：Nikon FTZ II"
                onChange={(event) =>
                  onChange((current) =>
                    current.map((entry, i) =>
                      i === index
                        ? { ...entry, name: event.target.value }
                        : entry,
                    ),
                  )
                }
              />
            </label>
            <button
              type="button"
              aria-label={`追加パーツ${index + 1}を削除`}
              onClick={() =>
                onChange((current) => current.filter((_, i) => i !== index))
              }
            >
              削除
            </button>
          </fieldset>
        ))}
      </div>
      {error && (
        <p role="alert" id="parts-error" className={styles.error}>
          {error}
        </p>
      )}
      <button
        type="button"
        className={styles.addPart}
        disabled={parts.length >= MAX_CAMERA_PARTS}
        onClick={() =>
          onChange((current) => [...current, { kind: "other", name: "" }])
        }
      >
        追加パーツを追加
      </button>
    </>
  );
}
