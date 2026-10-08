import {
  cameraRatingLabels,
  lensRatingLabels,
  isCamera,
  lensSpecLabels,
  type Equipment,
  type Camera,
} from "../types";
import { EquipmentImage } from "./EquipmentImage";
import { RatingBars } from "./RatingBars";
import { cameraDetailSpecs } from "../utils/equipmentProfile";
import styles from "./Equipment.module.css";
export function DetailBoard({
  item,
  camera,
  portrait = false,
  exporting = false,
}: {
  item: Equipment;
  camera?: Camera;
  portrait?: boolean;
  exporting?: boolean;
}) {
  const cam = isCamera(item);
  const specs = cam
    ? cameraDetailSpecs(item)
    : [
        [lensSpecLabels.compatibleMounts, item.compatibleMounts.join(" / ")],
        [lensSpecLabels.focalLength, item.focalLength],
        [lensSpecLabels.maxAperture, item.maxAperture],
        [lensSpecLabels.weight, item.weight],
      ];
  return (
    <section
      className={`${styles.board} ${portrait ? styles.portrait : ""} ${exporting ? styles.exportBoard : ""}`}
      data-testid="detail-board"
    >
      <div className={styles.boardHeader}>
        <span>OA / {cam ? "CAMERA SELECT" : "LENS LOADOUT"}</span>
        <span>PERSONAL EQUIPMENT ARCHIVE</span>
      </div>
      <div className={styles.visual}>
        <div className={styles.visualTop}>
          <span>UNIT {item.id.slice(0, 8).toUpperCase()}</span>
          <span className={styles.live}>● STANDBY</span>
        </div>
        <div className={styles.crosshair} />
        <EquipmentImage
          image={item.image}
          name={item.name}
          kind={cam ? "camera" : "lens"}
        />
        <div className={styles.visualBottom}>
          <span>
            OPTICAL SYSTEM
            <br />
            <strong>{cam ? item.mount : item.focalLength}</strong>
          </span>
          <span>
            PERSONAL COLLECTION
            <br />
            <strong>{item.maker.toUpperCase()}</strong>
          </span>
        </div>
        <div className={styles.visualCaption}>
          <span>01 / EQUIPMENT PREVIEW</span>
          <span>＋</span>
        </div>
      </div>
      <div className={styles.details}>
        <div className={styles.identity}>
          <p className={styles.eyebrow}>
            {item.maker.toUpperCase()}{" "}
            <span> / {cam ? "CAMERA BODY" : "OPTICAL LOADOUT"}</span>
          </p>
          <h2>{item.name}</h2>
          <div className={styles.badges}>
            <span>{item.category}</span>
            <span className={styles.role}>
              {cam ? item.role : item.maxAperture}
            </span>
          </div>
          {!cam && camera && (
            <p className={styles.assigned}>BODY / {camera.name}</p>
          )}
        </div>
        <div className={styles.panelTitle}>
          <span>PERFORMANCE PROFILE</span>
          <small>PERSONAL RATING</small>
        </div>
        <RatingBars
          ratings={item.ratings}
          labels={cam ? cameraRatingLabels : lensRatingLabels}
        />
        <div className={styles.panelTitle}>
          <span>TECHNICAL DATA</span>
          <small>{cam ? "BODY SPECS" : "OPTICS SPECS"}</small>
        </div>
        <dl className={styles.specs}>
          {specs.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className={styles.briefing}>
        <span className={styles.eyebrow}>
          FIELD NOTES <span>/ 機材メモ</span>
        </span>
        <p>{item.summary}</p>
        {!cam && (
          <div className={styles.tags}>
            {item.usageTags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        )}
      </div>
      <div className={styles.boardFooter}>
        <span>OPTICAL ARSENAL / ORIGINAL EQUIPMENT TERMINAL</span>
        <span>READY TO CAPTURE</span>
      </div>
    </section>
  );
}
