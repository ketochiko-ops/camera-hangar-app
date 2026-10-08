import { useRef, useState } from "react";
import { useInventory } from "./context/InventoryContext";
import { filterLenses, isCompatible } from "./utils/domain";
import { isCamera, type Camera, type Equipment } from "./types";
import { DetailBoard } from "./components/DetailBoard";
import { EquipmentImage } from "./components/EquipmentImage";
import { ManagePage } from "./components/ManagePage";
import { CompareModal } from "./components/CompareModal";
import { Icon } from "./components/Icon";
import { exportPng } from "./features/export/exportPng";
import {
  exportSizes,
  getExportSize,
  type ExportRatio,
} from "./features/export/sizes";
import styles from "./App.module.css";
type Page = "camera" | "lens" | "manage";
export function App() {
  const { data, error } = useInventory();
  const [page, setPage] = useState<Page>("camera");
  const [cameraId, setCameraId] = useState(data.cameras[0]?.id);
  const [lensId, setLensId] = useState<string>();
  const [compatibleOnly, setCompatibleOnly] = useState(true);
  const [query, setQuery] = useState("");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const [ratio, setRatio] = useState<ExportRatio>("16:9");
  const [exportState, setExportState] = useState<{
    item: Equipment;
    camera?: Camera;
    ratio: ExportRatio;
  }>();
  const [exportMessage, setExportMessage] = useState("");
  const [exportError, setExportError] = useState("");
  const exportRef = useRef<HTMLDivElement>(null);
  const camera = data.cameras.find((c) => c.id === cameraId) ?? data.cameras[0];
  const compatibleLenses = filterLenses(
    data.lenses,
    camera?.mount ?? "",
    compatibleOnly,
  );
  const lens =
    compatibleLenses.find((l) => l.id === lensId) ?? compatibleLenses[0];
  const item = page === "camera" ? camera : lens;
  const allItems: Equipment[] =
    page === "camera" ? data.cameras : compatibleLenses;
  const items = allItems.filter((i) =>
    `${i.name} ${i.maker} ${i.category}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const compared = (page === "camera" ? data.cameras : data.lenses).filter(
    (i) => compareIds.includes(i.id),
  );
  const navigate = (next: Page) => {
    setPage(next);
    setQuery("");
    setCompareIds([]);
    setComparing(false);
    setExportMessage("");
    setExportError("");
  };
  const toggleCompare = (id: string) =>
    setCompareIds((prev) =>
      prev.includes(id)
        ? prev.filter((v) => v !== id)
        : prev.length < 3
          ? [...prev, id]
          : prev,
    );
  async function download() {
    if (!item || exportState) return;
    setExportMessage("");
    setExportError("");
    setExportState({
      item: structuredClone(item),
      camera: camera ? structuredClone(camera) : undefined,
      ratio,
    });
    try {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      if (!exportRef.current)
        throw new Error("出力画面を準備できませんでした。");
      await exportPng(exportRef.current, ratio, item.name);
      setExportMessage("PNGを保存しました。");
    } catch (e) {
      setExportError(
        e instanceof Error
          ? `PNG出力に失敗しました。${e.message}`
          : "PNG出力に失敗しました。",
      );
    } finally {
      setExportState(undefined);
    }
  }
  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>
            O<span>＋</span>A
          </div>
          <span>
            OPTICAL
            <br />
            ARSENAL
          </span>
        </div>
        <div className={styles.sidebarLabel}>EQUIPMENT TERMINAL</div>
        <nav aria-label="メインナビゲーション">
          <button
            className={page === "camera" ? styles.active : ""}
            aria-current={page === "camera" ? "page" : undefined}
            onClick={() => navigate("camera")}
          >
            <Icon name="camera" />
            <span>
              CAMERA SELECT<small>カメラ選択</small>
            </span>
            <span className={styles.navNumber}>01</span>
          </button>
          <button
            className={page === "lens" ? styles.active : ""}
            aria-current={page === "lens" ? "page" : undefined}
            onClick={() => navigate("lens")}
          >
            <Icon name="lens" />
            <span>
              LENS / LOADOUT<small>レンズ選択</small>
            </span>
            <span className={styles.navNumber}>02</span>
          </button>
          <button
            className={page === "manage" ? styles.active : ""}
            aria-current={page === "manage" ? "page" : undefined}
            onClick={() => navigate("manage")}
          >
            <Icon name="grid" />
            <span>
              DATA MANAGEMENT<small>データ管理</small>
            </span>
            <span className={styles.navNumber}>03</span>
          </button>
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.archiveNumbers}>
            <span>
              <strong>{String(data.cameras.length).padStart(2, "0")}</strong>
              CAMERAS
            </span>
            <span>
              <strong>{String(data.lenses.length).padStart(2, "0")}</strong>
              LENSES
            </span>
          </div>
          <div className={styles.local}>
            <span>●</span> LOCAL ARCHIVE <small>PERSONAL USE / V1.0</small>
          </div>
        </div>
      </aside>
      <div className={styles.main}>
        <header className={styles.topbar}>
          <span>
            PERSONAL OPTICS DIVISION{" "}
            <span className={styles.topDivider}>/</span> EQUIPMENT ARCHIVE
          </span>
          <span className={styles.system}>
            <i /> SYSTEM ONLINE
          </span>
        </header>
        <main className={styles.content}>
          {error && (
            <div className={styles.errorBanner} role="alert">
              {error}
            </div>
          )}
          {page === "manage" ? (
            <ManagePage />
          ) : (
            <>
              <div className={styles.pageIntro}>
                <div>
                  <p className="eyebrow">
                    {page === "camera"
                      ? "01 / CAMERA HANGAR"
                      : "02 / OPTICAL LOADOUT"}{" "}
                    <span> — YOUR NEXT FRAME STARTS HERE</span>
                  </p>
                  <h1>
                    {page === "camera" ? "CAMERA SELECT" : "LENS / LOADOUT"}
                    <span>.</span>
                  </h1>
                  <p>
                    {page === "camera"
                      ? "撮影の相棒を選択。あなたの機材を、あなたの視点で。"
                      : `${camera?.name ?? "カメラ未選択"}に組み合わせる、次の一本を選択。`}
                  </p>
                </div>
                <div className={styles.introStamp}>
                  <span>ARCHIVE STATUS</span>
                  <strong>
                    {String(allItems.length).padStart(2, "0")}{" "}
                    <small>UNITS</small>
                  </strong>
                </div>
              </div>
              <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                  <span className={styles.sectionNumber}>
                    {page === "camera" ? "BODY" : "OPTICS"}
                  </span>
                  <span>SELECTED EQUIPMENT</span>
                  {page === "lens" && (
                    <label className={styles.mountSelect}>
                      使用ボディ
                      <select
                        aria-label="使用カメラ"
                        value={camera?.id ?? ""}
                        onChange={(e) => {
                          setCameraId(e.target.value);
                          setLensId(undefined);
                        }}
                      >
                        {data.cameras.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
                <div className={styles.exportControls}>
                  <label>
                    出力サイズ
                    <select
                      aria-label="出力サイズ"
                      value={ratio}
                      disabled={!!exportState}
                      onChange={(e) => setRatio(e.target.value as ExportRatio)}
                    >
                      {Object.keys(exportSizes).map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    className={styles.exportButton}
                    disabled={!item || !!exportState}
                    onClick={() => void download()}
                  >
                    <Icon name="download" size={17} />
                    {exportState ? "出力中…" : "PNG出力"}
                  </button>
                </div>
              </div>
              {exportMessage && (
                <p role="status" className={styles.success}>
                  {exportMessage}
                </p>
              )}
              {exportError && (
                <p role="alert" className={styles.errorBanner}>
                  {exportError}
                </p>
              )}
              {item ? (
                <DetailBoard item={item} camera={camera} />
              ) : (
                <div className="empty">
                  <Icon
                    name={page === "camera" ? "camera" : "lens"}
                    size={38}
                  />
                  <h2>
                    {page === "camera"
                      ? "カメラが登録されていません"
                      : "表示できるレンズがありません"}
                  </h2>
                  <p>
                    {page === "camera"
                      ? "データ管理から最初のカメラを登録してください。"
                      : "すべて表示へ切り替えるか、データ管理から対応レンズを追加してください。"}
                  </p>
                  <button onClick={() => navigate("manage")}>
                    データ管理を開く
                  </button>
                </div>
              )}
              {page === "lens" &&
                lens &&
                camera &&
                !isCompatible(lens, camera.mount) && (
                  <p className={styles.compatibilityNotice}>
                    このレンズは選択中カメラのマウントに対応していません。アダプター・AF動作・センサー範囲は別途ご確認ください。
                  </p>
                )}
              <div className={styles.inventoryHeader}>
                <div>
                  <span className={styles.sectionNumber}>ARCHIVE</span>
                  <h2>
                    {page === "camera" ? "CAMERA INVENTORY" : "LENS INVENTORY"}
                    <small>{String(items.length).padStart(2, "0")} UNITS</small>
                  </h2>
                </div>
                <div className={styles.inventoryTools}>
                  {page === "lens" && (
                    <label className={styles.filter}>
                      <input
                        type="checkbox"
                        checked={compatibleOnly}
                        onChange={(e) => {
                          setCompatibleOnly(e.target.checked);
                          setLensId(undefined);
                        }}
                      />
                      対応レンズのみ表示
                    </label>
                  )}
                  <input
                    type="search"
                    aria-label="機材を検索"
                    placeholder="機材を検索…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <button
                    disabled={compared.length < 2}
                    onClick={() => setComparing(true)}
                  >
                    <Icon name="compare" size={16} />
                    比較 {compared.length}/3
                  </button>
                </div>
              </div>
              <div className={styles.inventory}>
                {items.map((entry, index) => (
                  <article
                    key={entry.id}
                    className={`${styles.card} ${entry.id === item?.id ? styles.selected : ""}`}
                  >
                    <button
                      className={styles.selectCard}
                      aria-label={`${entry.name}を選択`}
                      aria-pressed={entry.id === item?.id}
                      onClick={() => {
                        if (isCamera(entry)) {
                          setCameraId(entry.id);
                          setLensId(undefined);
                        } else setLensId(entry.id);
                      }}
                    >
                      <span className={styles.cardMeta}>
                        <span>UNIT {String(index + 1).padStart(2, "0")}</span>
                        <span>
                          {entry.id === item?.id ? "● SELECTED" : "○ STANDBY"}
                        </span>
                      </span>
                      <EquipmentImage
                        image={entry.image}
                        name={entry.name}
                        kind={page === "camera" ? "camera" : "lens"}
                        compact
                      />
                      <span className={styles.cardMaker}>
                        {entry.maker.toUpperCase()}
                      </span>
                      <strong>{entry.name}</strong>
                      <span className={styles.cardDetail}>
                        {isCamera(entry)
                          ? `${entry.mount} / ${entry.role}`
                          : `${entry.focalLength} / ${entry.maxAperture}`}
                      </span>
                    </button>
                    <label className={styles.compareCheck}>
                      <input
                        type="checkbox"
                        aria-label={`${entry.name}を比較に追加`}
                        checked={compareIds.includes(entry.id)}
                        disabled={
                          compareIds.length >= 3 &&
                          !compareIds.includes(entry.id)
                        }
                        onChange={() => toggleCompare(entry.id)}
                      />
                      比較に追加
                    </label>
                  </article>
                ))}
              </div>
              {!items.length && allItems.length > 0 && (
                <div className="empty">
                  検索条件に一致する機材はありません。
                </div>
              )}
              <div className={styles.inventoryFooter}>
                <span>SELECT A UNIT · COMPARE UP TO 3</span>
                {page === "camera" && camera && (
                  <button
                    className={styles.loadoutButton}
                    onClick={() => navigate("lens")}
                  >
                    レンズを選択 <Icon name="arrow" size={17} />
                  </button>
                )}
              </div>
            </>
          )}
          <footer className={styles.footer}>
            <span>
              OPTICAL ARSENAL <span> / </span> BUILT FOR YOUR PERSPECTIVE
            </span>
            <span>ORIGINAL UI · LOCAL FIRST</span>
          </footer>
        </main>
      </div>
      {comparing && compared.length >= 2 && (
        <CompareModal items={compared} onClose={() => setComparing(false)} />
      )}
      {exportState && (
        <div aria-hidden="true" className={styles.exportStage}>
          <div
            ref={exportRef}
            style={{
              width: getExportSize(exportState.ratio).width,
              height: getExportSize(exportState.ratio).height,
            }}
          >
            <DetailBoard
              item={exportState.item}
              camera={exportState.camera}
              portrait={exportState.ratio !== "16:9"}
              exporting
            />
          </div>
        </div>
      )}
    </div>
  );
}
