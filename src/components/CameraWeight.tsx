import type { Camera } from "../types";
import { cameraPartWeight } from "../utils/partEffects";
import styles from "./CameraWeight.module.css";

export function CameraWeight({ camera }: { camera: Camera }) {
  const extra = cameraPartWeight(camera);
  return (
    <>
      {camera.specs.weight || "—"}
      {extra > 0 && (
        <>
          {" "}
          <span
            className={styles.extra}
            data-testid="part-weight"
            title="ADDITIONAL PARTS"
          >
            +{extra} g
          </span>
        </>
      )}
    </>
  );
}
