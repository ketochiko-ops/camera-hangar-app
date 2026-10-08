import { useState } from "react";
import { useInventory } from "../context/InventoryContext";
import { emptyCamera, emptyLens } from "../data/sample";
import { isCamera, type Equipment, type EquipmentKind } from "../types";
import { EquipmentEditor } from "./EquipmentEditor";
import { EquipmentImage } from "./EquipmentImage";
import { Modal } from "./Modal";
import { Icon } from "./Icon";
import { CsvTransfer } from "./CsvTransfer";
import styles from "./Manage.module.css";
export function ManagePage() {
  const { data, remove, error, clearError } = useInventory();
  const [kind, setKind] = useState<EquipmentKind>("camera");
  const [editing, setEditing] = useState<Equipment>();
  const [deleting, setDeleting] = useState<Equipment>();
  const items = kind === "camera" ? data.cameras : data.lenses;
  const changeKind = (value: EquipmentKind) => {
    setKind(value);
    clearError();
  };
  return (
    <>
      <div className={styles.manageIntro}>
        <div>
          <p className="eyebrow">INVENTORY CONTROL / 機材データ管理</p>
          <h1>YOUR EQUIPMENT.</h1>
          <p>機材の情報と写真を登録し、自分だけのアーカイブへ。</p>
        </div>
        <button
          className="primary"
          onClick={() => {
            clearError();
            setEditing(kind === "camera" ? emptyCamera() : emptyLens());
          }}
        >
          <Icon name="plus" />
          {kind === "camera" ? "カメラを追加" : "レンズを追加"}
        </button>
      </div>
      <div className={styles.tabs}>
        <button
          aria-pressed={kind === "camera"}
          onClick={() => changeKind("camera")}
        >
          CAMERAS <span>{data.cameras.length}</span>
        </button>
        <button
          aria-pressed={kind === "lens"}
          onClick={() => changeKind("lens")}
        >
          LENSES <span>{data.lenses.length}</span>
        </button>
      </div>
      <CsvTransfer key={kind} kind={kind} />
      <div className={styles.manageList}>
        {items.map((item) => (
          <article key={item.id}>
            <EquipmentImage
              image={item.image}
              name={item.name}
              kind={kind}
              compact
            />
            <div>
              <span>
                {item.maker} / {item.category}
              </span>
              <h2>{item.name}</h2>
              <p>
                {isCamera(item)
                  ? item.mount
                  : item.compatibleMounts.join(" / ")}
              </p>
            </div>
            <div className={styles.rowActions}>
              <button
                aria-label={`${item.name}を編集`}
                onClick={() => {
                  clearError();
                  setEditing(item);
                }}
              >
                <Icon name="edit" />
                編集
              </button>
              <button
                aria-label={`${item.name}を削除`}
                onClick={() => setDeleting(item)}
              >
                <Icon name="trash" />
                削除
              </button>
            </div>
          </article>
        ))}
      </div>
      {!items.length && (
        <div className="empty">
          <Icon name="grid" size={36} />
          <h2>まだ機材がありません</h2>
          <p>
            「{kind === "camera" ? "カメラ" : "レンズ"}
            を追加」から登録してください。
          </p>
        </div>
      )}
      <p className={styles.storageNote}>
        LOCAL ARCHIVE ·
        データはこのブラウザだけに保存されます。画像は自動縮小されます。サンプルのスペック・評価は編集用の参考値です。
      </p>
      {editing && (
        <EquipmentEditor
          key={editing.id}
          initial={editing}
          onClose={() => setEditing(undefined)}
        />
      )}
      {deleting && (
        <Modal title="機材を削除" onClose={() => setDeleting(undefined)}>
          <div className={styles.confirm}>
            <p>
              「{deleting.name}」を削除します。保存された画像も削除されます。
            </p>
            {error && <p role="alert">{error}</p>}
            <div>
              <button onClick={() => setDeleting(undefined)}>キャンセル</button>
              <button
                className="danger"
                onClick={() => {
                  if (remove(kind, deleting.id)) setDeleting(undefined);
                }}
              >
                削除する
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
