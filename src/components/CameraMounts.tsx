import type { Camera } from "../types";
import { cameraAdaptedMounts } from "../utils/partEffects";
import styles from "./CameraMounts.module.css";

export function CameraMounts({ camera }: { camera: Camera }) {
  return (
    <>
      {camera.mount.toUpperCase() || "—"}
      {cameraAdaptedMounts(camera).map(({ mount, adapters }) => (
        <span key={mount}>
          {" "}
          <span
            className={styles.added}
            data-testid="adapter-mount"
            title={`VIA ${adapters.join(" / ")}`}
          >
            + {mount.toUpperCase()}
          </span>
        </span>
      ))}
    </>
  );
}
