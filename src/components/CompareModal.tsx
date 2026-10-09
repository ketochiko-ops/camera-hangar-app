import {
  cameraRatingLabels,
  lensRatingLabels,
  isCamera,
  lensSpecLabels,
  type Equipment,
} from "../types";
import { Modal } from "./Modal";
import { EquipmentImage } from "./EquipmentImage";
import { RatingBars } from "./RatingBars";
import { CameraParts } from "./CameraParts";
import { cameraDetailSpecs } from "../utils/equipmentProfile";
import { equipmentRatings } from "../utils/partEffects";
import { formatItemLabel, useLabelMode } from "../context/LabelModeContext";
import styles from "./Manage.module.css";
export function CompareModal({
  items,
  onClose,
}: {
  items: Equipment[];
  onClose(): void;
}) {
  const { mode } = useLabelMode();
  return (
    <Modal title="機材を比較" onClose={onClose} wide>
      <div
        className={styles.compareGrid}
        style={{
          gridTemplateColumns: `repeat(${items.length},minmax(240px,1fr))`,
        }}
      >
        {items.map((item) => {
          const cam = isCamera(item);
          return (
            <article key={item.id}>
              <EquipmentImage
                kind={cam ? "camera" : "lens"}
                name={item.name}
                image={item.image}
                compact
              />
              <p className="eyebrow">{item.maker}</p>
              <h3>{item.name}</h3>
              <p>{item.category}</p>
              <RatingBars
                {...equipmentRatings(item)}
                labels={Object.fromEntries(
                  Object.entries(
                    cam ? cameraRatingLabels : lensRatingLabels,
                  ).map(([key, label]) => [key, formatItemLabel(label, mode)]),
                )}
              />
              <dl>
                {(cam
                  ? cameraDetailSpecs(item)
                  : [
                      [
                        lensSpecLabels.compatibleMounts,
                        item.compatibleMounts.join(", "),
                      ],
                      [lensSpecLabels.focalLength, item.focalLength],
                      [lensSpecLabels.maxAperture, item.maxAperture],
                      [lensSpecLabels.weight, item.weight],
                    ]
                ).map(([k, v]) => (
                  <div key={k}>
                    <dt>{formatItemLabel(k, mode)}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              {cam && <CameraParts parts={item.additionalParts} mode={mode} />}
              <p>{item.summary}</p>
            </article>
          );
        })}
      </div>
    </Modal>
  );
}
