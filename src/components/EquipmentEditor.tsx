import { useState, useRef, type FormEvent } from "react";
import {
  cameraRatingLabels,
  lensRatingLabels,
  specLabels,
  lensSpecLabels,
  isCamera,
  type Camera,
  type Equipment,
  type Lens,
} from "../types";
import { validateEquipment, type FormErrors } from "../utils/domain";
import { prepareImage } from "../utils/image";
import { useInventory } from "../context/InventoryContext";
import { EquipmentImage } from "./EquipmentImage";
import { Modal } from "./Modal";
import styles from "./Manage.module.css";
export function EquipmentEditor({
  initial,
  onClose,
}: {
  initial: Equipment;
  onClose(): void;
}) {
  const [item, setItem] = useState<Equipment>(() => structuredClone(initial));
  // Keep list fields as text until submit so typing a comma or space never loses it.
  const [mountsText, setMountsText] = useState(
    isCamera(initial) ? "" : initial.compatibleMounts.join(", "),
  );
  const [tagsText, setTagsText] = useState(
    isCamera(initial) ? "" : initial.usageTags.join(", "),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [imageError, setImageError] = useState("");
  const [processing, setProcessing] = useState(false);
  const uploadVersion = useRef(0);
  const form = useRef<HTMLFormElement>(null);
  const { saveCamera, saveLens, error } = useInventory();
  const cam = isCamera(item);
  const set = (key: string, value: string) =>
    setItem((prev) => ({ ...prev, [key]: value }));
  const field = (
    key: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    required = false,
    placeholder = "",
  ) => (
    <label className={styles.field} key={key}>
      {label}
      {required && <span> *</span>}
      <input
        name={key}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-required={required}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `error-${key}` : undefined}
        placeholder={placeholder}
        maxLength={key === "name" ? 100 : 180}
      />
      {errors[key] && (
        <small role="alert" id={`error-${key}`}>
          {errors[key]}
        </small>
      )}
    </label>
  );
  async function upload(file?: File) {
    if (!file) return;
    const version = ++uploadVersion.current;
    setProcessing(true);
    setImageError("");
    try {
      const image = await prepareImage(file);
      if (version === uploadVersion.current)
        setItem((prev) => ({ ...prev, image }));
    } catch (e) {
      if (version === uploadVersion.current)
        setImageError(
          e instanceof Error ? e.message : "画像処理に失敗しました。",
        );
    } finally {
      if (version === uploadVersion.current) setProcessing(false);
    }
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    const parseList = (text: string) => [
      ...new Set(
        text
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ];
    const normalized = isCamera(item)
      ? { ...item, mount: item.mount.trim() }
      : {
          ...item,
          compatibleMounts: parseList(mountsText),
          usageTags: parseList(tagsText),
        };
    const found = validateEquipment(normalized);
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() =>
        form.current
          ?.querySelector<HTMLInputElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    if (isCamera(normalized) ? saveCamera(normalized) : saveLens(normalized))
      onClose();
  }
  return (
    <Modal
      title={cam ? "カメラデータ編集" : "レンズデータ編集"}
      onClose={onClose}
      wide
    >
      <form ref={form} onSubmit={submit} noValidate className={styles.editor}>
        <div className={styles.upload}>
          <EquipmentImage
            image={item.image}
            name={item.name || "機材"}
            kind={cam ? "camera" : "lens"}
            compact
          />
          <div>
            <h3>機材写真</h3>
            <p>
              PNG / JPEG / WebP · 10MBまで
              <br />
              長辺1200pxへ縮小して保存します。
            </p>
            <label className={styles.fileButton}>
              画像を選択
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                aria-label="機材画像をアップロード"
                onChange={(e) => {
                  void upload(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            {item.image && (
              <button
                type="button"
                onClick={() => {
                  ++uploadVersion.current;
                  setProcessing(false);
                  setItem((prev) => ({ ...prev, image: undefined }));
                }}
              >
                画像を削除
              </button>
            )}
            {processing && <p role="status">画像を処理しています…</p>}
            {imageError && (
              <p role="alert" className={styles.error}>
                {imageError}
              </p>
            )}
          </div>
        </div>
        <h3 className={styles.sectionLabel}>01 / 基本情報</h3>
        <div className={styles.formGrid}>
          {field("name", "機材名", item.name, (v) => set("name", v), true)}
          {field("maker", "メーカー", item.maker, (v) => set("maker", v), true)}
          {field(
            "category",
            "カテゴリ",
            item.category,
            (v) => set("category", v),
            true,
          )}
          {cam ? (
            <>
              {field(
                "mount",
                "MOUNT",
                item.mount,
                (v) => set("mount", v),
                true,
                "Nikon Z",
              )}
              {field("role", "ロール", item.role, (v) => set("role", v), true)}
            </>
          ) : (
            <>
              {field(
                "compatibleMounts",
                `${lensSpecLabels.compatibleMounts} (COMMA-SEPARATED)`,
                mountsText,
                setMountsText,
                true,
                "Nikon F, Canon EF",
              )}
              {field(
                "focalLength",
                lensSpecLabels.focalLength,
                (item as Lens).focalLength,
                (v) => set("focalLength", v),
                true,
                "35 mm",
              )}
              {field(
                "maxAperture",
                lensSpecLabels.maxAperture,
                (item as Lens).maxAperture,
                (v) => set("maxAperture", v),
                true,
                "f/1.8",
              )}
              {field(
                "weight",
                lensSpecLabels.weight,
                (item as Lens).weight,
                (v) => set("weight", v),
                true,
                "200 g",
              )}
              {field(
                "usageTags",
                "用途タグ（カンマ区切り）",
                tagsText,
                setTagsText,
                false,
                "portrait, landscape",
              )}
            </>
          )}
        </div>
        <label className={styles.field}>
          説明・機材メモ <span>*</span>
          <textarea
            name="summary"
            value={item.summary}
            onChange={(e) => set("summary", e.target.value)}
            aria-required="true"
            aria-invalid={!!errors.summary}
            aria-describedby={errors.summary ? "summary-error" : undefined}
            maxLength={700}
            rows={3}
          />
          {errors.summary && (
            <small role="alert" id="summary-error">
              {errors.summary}
            </small>
          )}
        </label>
        {cam && (
          <>
            <h3 className={styles.sectionLabel}>
              02 / TECHNICAL DATA <small>OPTIONAL</small>
            </h3>
            <div className={styles.formGrid}>
              {Object.entries(specLabels).map(([key, label]) =>
                field(
                  `specs.${key}`,
                  label,
                  (item as Camera).specs[key as keyof Camera["specs"]],
                  (v) =>
                    setItem((prev) => ({
                      ...prev,
                      specs: { ...(prev as Camera).specs, [key]: v },
                    })),
                  false,
                  key === "weight"
                    ? "710 g"
                    : key === "releaseYear"
                      ? "2023"
                      : "",
                ),
              )}
            </div>
          </>
        )}
        <h3 className={styles.sectionLabel}>
          {cam ? "03" : "02"} / PERFORMANCE PROFILE{" "}
          <small>0–10 · DECIMALS ALLOWED</small>
        </h3>
        <div className={styles.formGrid}>
          {Object.entries(cam ? cameraRatingLabels : lensRatingLabels).map(
            ([key, label]) => (
              <label key={key} className={styles.field}>
                {label}
                <input
                  name={`ratings.${key}`}
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={
                    Number.isNaN((item.ratings as Record<string, number>)[key])
                      ? ""
                      : (item.ratings as Record<string, number>)[key]
                  }
                  onChange={(e) =>
                    setItem((prev) =>
                      isCamera(prev)
                        ? {
                            ...prev,
                            ratings: {
                              ...prev.ratings,
                              [key]:
                                e.target.value === ""
                                  ? NaN
                                  : Number(e.target.value),
                            },
                          }
                        : {
                            ...prev,
                            ratings: {
                              ...prev.ratings,
                              [key]:
                                e.target.value === ""
                                  ? NaN
                                  : Number(e.target.value),
                            },
                          },
                    )
                  }
                  aria-invalid={!!errors[`ratings.${key}`]}
                  aria-describedby={
                    errors[`ratings.${key}`] ? `rating-error-${key}` : undefined
                  }
                />
                {errors[`ratings.${key}`] && (
                  <small role="alert" id={`rating-error-${key}`}>
                    {errors[`ratings.${key}`]}
                  </small>
                )}
              </label>
            ),
          )}
        </div>
        {Object.keys(errors).length > 0 && (
          <p role="alert" className={styles.error}>
            入力内容をご確認ください。保存はまだ行われていません。
          </p>
        )}
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <div className={styles.formFooter}>
          <span>* 必須項目 · 保存先はこのブラウザ</span>
          <button type="button" onClick={onClose}>
            キャンセル
          </button>
          <button type="submit" className="primary" disabled={processing}>
            {processing ? "画像処理中…" : "保存する"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
