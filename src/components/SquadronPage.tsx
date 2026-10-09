import { useState } from "react";
import { useInventory } from "../context/InventoryContext";
import { formatItemLabel, useLabelMode } from "../context/LabelModeContext";
import {
  cameraRatingLabels,
  lensRatingLabels,
  type Inventory,
  type LoadoutSelection,
  type Squadron,
} from "../types";
import { cameraAcceptsLens, normalizeSquadron } from "../utils/loadout";
import { equipmentRatings } from "../utils/partEffects";
import { EquipmentImage } from "./EquipmentImage";
import { CameraParts } from "./CameraParts";
import { CameraFeatures } from "./CameraFeatures";
import { CameraMounts } from "./CameraMounts";
import { CameraWeight } from "./CameraWeight";
import { CameraLoadoutControls } from "./CameraLoadoutControls";
import { RatingBars } from "./RatingBars";
import styles from "./Loadout.module.css";

export function SquadronPage({
  initialLeader,
}: {
  initialLeader: LoadoutSelection;
}) {
  const { data, saveSquadron } = useInventory();
  const { mode } = useLabelMode();
  const [message, setMessage] = useState("");
  const squadron = normalizeSquadron(
    data,
    data.squadron ?? { leader: initialLeader, wingmen: [] },
  );
  const units = [squadron.leader, ...squadron.wingmen];
  const ready = units.every((entry) => {
    const camera = data.cameras.find((c) => c.id === entry.cameraId);
    const lens = data.lenses.find((l) => l.id === entry.lensId);
    return camera && lens && cameraAcceptsLens(camera, lens);
  });
  const update = (next: Squadron) => {
    if (saveSquadron(next)) setMessage("編成を保存しました。");
    else setMessage("");
  };
  const unusedCameras = data.cameras.filter(
    (camera) => !units.some((entry) => entry.cameraId === camera.id),
  );
  return (
    <div className={styles.page} data-testid="squadron-page">
      <div className={styles.intro}>
        <div>
          <p className="eyebrow">03 / SQUADRON LOADOUT</p>
          <h1>SQUADRON / SORTIE</h1>
          <p>
            メイン機と僚機のカメラ・レンズ・装備を選択。撮影に持ち出す編成をここで確認します。
          </p>
        </div>
        <div className={styles.status}>
          <strong data-testid="squadron-status">
            ● {formatItemLabel(ready ? "READY" : "INCOMPLETE", mode)}
          </strong>
          <span>
            {String(units.length).padStart(2, "0")} UNITS /{" "}
            {squadron.wingmen.length} WINGMEN
          </span>
        </div>
      </div>
      {message && <p role="status">{message}</p>}
      <div className={styles.roster}>
        {units.map((selection, index) => (
          <SquadronUnit
            key={index}
            data={data}
            selection={selection}
            index={index}
            units={units}
            onChange={(next) =>
              update(
                index === 0
                  ? { ...squadron, leader: next }
                  : {
                      ...squadron,
                      wingmen: squadron.wingmen.map((entry, i) =>
                        i === index - 1 ? next : entry,
                      ),
                    },
              )
            }
            onRemove={
              index > 0
                ? () =>
                    update({
                      ...squadron,
                      wingmen: squadron.wingmen.filter(
                        (_, i) => i !== index - 1,
                      ),
                    })
                : undefined
            }
          />
        ))}
      </div>
      <div className={styles.actions}>
        <button
          disabled={
            !unusedCameras.length || units.length >= data.cameras.length
          }
          onClick={() => {
            const camera = unusedCameras[0];
            if (!camera || units.length >= data.cameras.length) return;
            const lens = data.lenses.find(
              (l) =>
                !units.some((entry) => entry.lensId === l.id) &&
                cameraAcceptsLens(camera, l),
            );
            update({
              ...squadron,
              wingmen: [
                ...squadron.wingmen,
                { cameraId: camera.id, lensId: lens?.id },
              ],
            });
          }}
        >
          ＋ 僚機を追加
        </button>
        <button onClick={() => update(squadron)}>編成を保存</button>
      </div>
      <p className={styles.empty}>
        登録済みのカメラ台数まで僚機を追加できます。同じカメラ・レンズを複数台へ重複配置しません。マウント対応の表示は接続可否の目安で、AF動作やセンサー範囲はレンズごとに確認してください。
      </p>
    </div>
  );
}

function SquadronUnit({
  data,
  selection,
  units,
  index,
  onChange,
  onRemove,
}: {
  data: Inventory;
  selection: LoadoutSelection;
  units: LoadoutSelection[];
  index: number;
  onChange(next: LoadoutSelection): void;
  onRemove?: () => void;
}) {
  const { mode } = useLabelMode();
  const camera = data.cameras.find((c) => c.id === selection.cameraId);
  const lens = data.lenses.find((l) => l.id === selection.lensId);
  const title = index === 0 ? "メイン機" : `僚機${index}`;
  const compatible = !!camera && !!lens && cameraAcceptsLens(camera, lens);
  const cameraScores = camera ? equipmentRatings(camera) : undefined;
  return (
    <article
      className={`${styles.unit} ${index === 0 ? styles.leader : ""}`}
      aria-label={title}
      data-testid="squadron-unit"
    >
      <div className={styles.unitHeader}>
        <h2>
          {formatItemLabel(index === 0 ? "LEADER" : "WINGMAN", mode)}{" "}
          {String(index + 1).padStart(2, "0")}
        </h2>
        <span>
          {formatItemLabel(
            !camera || !lens
              ? "INCOMPLETE"
              : compatible
                ? "READY"
                : "MOUNT CHECK",
            mode,
          )}
        </span>
        {onRemove && (
          <button onClick={onRemove} aria-label={`${title}を削除`}>
            僚機を外す
          </button>
        )}
      </div>
      <div className={styles.selectors}>
        <label>
          {formatItemLabel("CAMERA", mode)}
          <select
            aria-label={`${title}のカメラ`}
            value={camera?.id ?? ""}
            onChange={(event) => {
              const next = data.cameras.find(
                (c) => c.id === event.target.value,
              );
              const nextLens = next
                ? data.lenses.find(
                    (l) =>
                      !units.some(
                        (entry, i) => i !== index && entry.lensId === l.id,
                      ) && cameraAcceptsLens(next, l),
                  )
                : undefined;
              onChange({ cameraId: next?.id, lensId: nextLens?.id });
            }}
          >
            <option value="">カメラを選択</option>
            {data.cameras.map((c) => (
              <option
                key={c.id}
                value={c.id}
                disabled={units.some(
                  (entry, i) => i !== index && entry.cameraId === c.id,
                )}
              >
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {formatItemLabel("LENS", mode)}
          <select
            aria-label={`${title}のレンズ`}
            value={lens?.id ?? ""}
            disabled={!camera}
            onChange={(event) =>
              onChange({
                ...selection,
                lensId: event.target.value || undefined,
              })
            }
          >
            <option value="">レンズを選択</option>
            {data.lenses.map((l) => (
              <option
                key={l.id}
                value={l.id}
                disabled={units.some(
                  (entry, i) => i !== index && entry.lensId === l.id,
                )}
              >
                {l.name}
                {camera && !cameraAcceptsLens(camera, l)
                  ? "（マウント要確認）"
                  : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={styles.pair}>
        <div className={styles.hardware}>
          {camera ? (
            <>
              <div className={styles.image}>
                <EquipmentImage
                  image={camera.image}
                  name={camera.name}
                  kind="camera"
                  compact
                />
              </div>
              <strong>{camera.name}</strong>
              <p>
                <CameraMounts camera={camera} />
              </p>
              <p>
                {formatItemLabel("WEIGHT", mode)}{" "}
                <CameraWeight camera={camera} />
              </p>
            </>
          ) : (
            <p>カメラ未選択</p>
          )}
        </div>
        <div className={styles.hardware}>
          {lens ? (
            <>
              <div className={styles.image}>
                <EquipmentImage
                  image={lens.image}
                  name={lens.name}
                  kind="lens"
                  compact
                />
              </div>
              <strong>{lens.name}</strong>
              <p>
                {lens.focalLength} / {lens.maxAperture}
              </p>
              <p>
                {formatItemLabel("WEIGHT", mode)} {lens.weight}
              </p>
            </>
          ) : (
            <p>レンズ未選択</p>
          )}
        </div>
      </div>
      {camera && lens && !compatible && (
        <p className={styles.warning} role="status">
          この組み合わせは登録済みの対応マウントに一致しません。対応するアダプターの装着またはレンズの変更を確認してください。
        </p>
      )}
      <div className={styles.ratings}>
        {cameraScores && (
          <div>
            <h3>{formatItemLabel("CAMERA PERFORMANCE", mode)}</h3>
            <RatingBars
              ratings={cameraScores.ratings}
              base={cameraScores.base}
              deltas={cameraScores.deltas}
              labels={Object.fromEntries(
                Object.entries(cameraRatingLabels).map(([key, label]) => [
                  key,
                  formatItemLabel(label, mode),
                ]),
              )}
            />
          </div>
        )}
        {lens && (
          <div>
            <h3>{formatItemLabel("LENS PERFORMANCE", mode)}</h3>
            <RatingBars
              ratings={lens.ratings}
              labels={Object.fromEntries(
                Object.entries(lensRatingLabels).map(([key, label]) => [
                  key,
                  formatItemLabel(label, mode),
                ]),
              )}
            />
          </div>
        )}
      </div>
      {camera && (
        <>
          <CameraParts parts={camera.additionalParts} mode={mode} />
          <CameraFeatures camera={camera} mode={mode} />
          <CameraLoadoutControls key={camera.id} camera={camera} />
        </>
      )}
    </article>
  );
}
