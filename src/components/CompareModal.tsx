import {
  cameraRatingLabels,
  lensRatingLabels,
  isCamera,
  specLabels,
  lensSpecLabels,
  type Equipment,
  type Camera,
} from "../types";
import { Modal } from "./Modal";
import { EquipmentImage } from "./EquipmentImage";
import { RatingBars } from "./RatingBars";
import styles from "./Manage.module.css";
export function CompareModal({
  items,
  onClose,
}: {
  items: Equipment[];
  onClose(): void;
}) {
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
                ratings={item.ratings}
                labels={cam ? cameraRatingLabels : lensRatingLabels}
              />
              <dl>
                {(cam
                  ? [
                      ["MOUNT", item.mount],
                      ...Object.entries(item.specs).map(([k, v]) => [
                        specLabels[k as keyof Camera["specs"]],
                        v || "—",
                      ]),
                    ]
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
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <p>{item.summary}</p>
            </article>
          );
        })}
      </div>
    </Modal>
  );
}
