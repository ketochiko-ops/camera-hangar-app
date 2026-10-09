import {
  cameraPartLabels,
  cameraRatingLabels,
  MAX_CAMERA_PARTS,
  MAX_PART_NAME_LENGTH,
  type CameraPart,
  type RatingKey,
} from "../types";
import { getPartEffects, partProfile } from "../utils/partEffects";
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
        装備したパーツの補正を評価に加算します。補正値は編集でき、本体の評価は保持されます。青は増加、赤は減少です。
      </p>
      <div className={styles.partsEditor}>
        {parts.map((part, index) => {
          const profile = partProfile(part);
          const effects = getPartEffects(part);
          return (
            <fieldset key={index} className={styles.partRow}>
              <legend>PART {String(index + 1).padStart(2, "0")}</legend>
              <label className={styles.field}>
                {formatItemLabel("TYPE", mode)}
                <select
                  aria-label={`追加パーツ${index + 1}の種類`}
                  value={part.kind}
                  onChange={(event) => {
                    const kind = event.target.value as CameraPart["kind"];
                    onChange((current) =>
                      current.map((entry, i) =>
                        i === index
                          ? {
                              ...entry,
                              kind,
                            }
                          : entry,
                      ),
                    );
                  }}
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
                  onChange={(event) => {
                    const name = event.target.value;
                    onChange((current) =>
                      current.map((entry, i) =>
                        i === index ? { ...entry, name } : entry,
                      ),
                    );
                  }}
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
              <details className={styles.partEffects}>
                <summary>{formatItemLabel("STATUS EFFECTS", mode)}</summary>
                <p className={styles.partsHelp}>
                  {part.effects !== undefined
                    ? "カスタム補正"
                    : profile
                      ? "メーカー仕様をもとにした参考補正"
                      : "参考補正がないため、初期値は0です。"}
                  {profile && (
                    <>
                      {" "}
                      ·{" "}
                      <a href={profile.source} target="_blank" rel="noreferrer">
                        仕様を見る
                      </a>
                    </>
                  )}
                  <br />
                  STABILITYは手ぶれ補正と保持の安定性。縦グリップのENDURANCEはバッテリー2本使用を想定。補正後の評価は0〜10です。
                </p>
                <div className={styles.partEffectsGrid}>
                  {Object.entries(cameraRatingLabels).map(([key, label]) => {
                    const ratingKey = key as RatingKey;
                    const value = effects[ratingKey] ?? 0;
                    return (
                      <label className={styles.field} key={key}>
                        PART {String(index + 1).padStart(2, "0")} /{" "}
                        {formatItemLabel(label, mode)}
                        <input
                          type="number"
                          min={-10}
                          max={10}
                          step={0.1}
                          aria-label={`追加パーツ${index + 1}の${label}補正`}
                          aria-invalid={
                            !!error &&
                            (!Number.isFinite(value) ||
                              value < -10 ||
                              value > 10)
                          }
                          aria-describedby={error ? "parts-error" : undefined}
                          value={Number.isNaN(value) ? "" : value}
                          onChange={(event) => {
                            const number =
                              event.target.value === ""
                                ? NaN
                                : Number(event.target.value);
                            onChange((current) =>
                              current.map((entry, i) =>
                                i === index
                                  ? {
                                      ...entry,
                                      effects: {
                                        ...getPartEffects(entry),
                                        [ratingKey]: number,
                                      },
                                    }
                                  : entry,
                              ),
                            );
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onChange((current) =>
                      current.map((entry, i) => {
                        if (i !== index) return entry;
                        const reference = { ...entry };
                        delete reference.effects;
                        return reference;
                      }),
                    )
                  }
                >
                  参考値に戻す
                </button>
              </details>
            </fieldset>
          );
        })}
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
