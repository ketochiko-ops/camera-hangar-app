import { useState } from "react";
import { useInventory } from "../context/InventoryContext";
import { formatItemLabel, useLabelMode } from "../context/LabelModeContext";
import {
  cameraPartLabels,
  MAX_CAMERA_PARTS,
  partFeatureLabels,
  type Camera,
} from "../types";
import { availableCameraParts, partKey } from "../utils/loadout";
import { getPartFeatures, getPartWeight } from "../utils/partEffects";
import styles from "./Loadout.module.css";

export function CameraLoadoutControls({ camera }: { camera: Camera }) {
  const { data, saveCamera } = useInventory();
  const { mode } = useLabelMode();
  const [message, setMessage] = useState("");
  const equipped = new Set(camera.additionalParts.map(partKey));
  const options = availableCameraParts(data, camera);
  return (
    <details className={styles.equipmentControls}>
      <summary>
        装備を付け替える{" "}
        <span>
          {camera.additionalParts.length} / {MAX_CAMERA_PARTS}
        </span>
      </summary>
      <p>
        タップして装着・解除。ステータスと機能へ即時反映し、変更を保存します。新しい装備や補正値はデータ管理で登録できます。
      </p>
      <div className={styles.partOptions}>
        {options.map((part) => {
          const attached = equipped.has(partKey(part));
          const weight = getPartWeight(part);
          return (
            <button
              key={partKey(part)}
              type="button"
              aria-pressed={attached}
              aria-label={`${part.name}を${attached ? "外す" : "装着"}`}
              disabled={
                !attached && camera.additionalParts.length >= MAX_CAMERA_PARTS
              }
              onClick={() => {
                const additionalParts = attached
                  ? camera.additionalParts.filter(
                      (entry) => partKey(entry) !== partKey(part),
                    )
                  : [...camera.additionalParts, structuredClone(part)];
                if (saveCamera({ ...camera, additionalParts }))
                  setMessage(
                    `${part.name}を${attached ? "解除" : "装着"}しました。`,
                  );
                else setMessage("");
              }}
            >
              <span>
                {attached ? "● EQUIPPED" : "＋ AVAILABLE"} /{" "}
                {formatItemLabel(cameraPartLabels[part.kind], mode)}
              </span>
              <strong>{part.name}</strong>
              {weight > 0 && <small>+{weight} g</small>}
              <small>
                {getPartFeatures(part)
                  .map((key) => formatItemLabel(partFeatureLabels[key], mode))
                  .join(" · ")}
              </small>
            </button>
          );
        })}
      </div>
      {camera.additionalParts.length >= MAX_CAMERA_PARTS && (
        <p>装備枠が満杯です。外してから付け替えてください。</p>
      )}
      {message && <p role="status">{message}</p>}
    </details>
  );
}
