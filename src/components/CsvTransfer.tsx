import { useEffect, useRef, useState } from "react";
import { useInventory } from "../context/InventoryContext";
import { type EquipmentKind } from "../types";
import {
  CSV_MAX_BYTES,
  csvColumns,
  csvCreationPrompt,
  downloadCsv,
  equipmentCsvValues,
  exportEquipmentCsv,
  mergeCsvImport,
  parseEquipmentCsv,
  type CsvImport,
} from "../features/csv/inventoryCsv";
import { Modal } from "./Modal";
import styles from "./Manage.module.css";

export function CsvTransfer({ kind }: { kind: EquipmentKind }) {
  const { data, importCsv, error, clearError } = useInventory();
  const input = useRef<HTMLInputElement>(null);
  const request = useRef(0);
  const [busy, setBusy] = useState(false);
  const [batch, setBatch] = useState<CsvImport>();
  const [message, setMessage] = useState("");
  const [fileError, setFileError] = useState("");
  const [filename, setFilename] = useState("");
  const items = kind === "camera" ? data.cameras : data.lenses;
  const label = kind === "camera" ? "カメラ" : "レンズ";
  const basename = kind === "camera" ? "cameras" : "lenses";
  const currentIds = new Set(items.map((item) => item.id));
  const updates =
    batch?.items.filter((item) => currentIds.has(item.id)).length ?? 0;
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );

  async function readFile(file?: File) {
    if (!file) return;
    const version = ++request.current;
    clearError();
    setFileError("");
    setMessage("");
    setBatch(undefined);
    if (!/\.csv$/i.test(file.name)) {
      setFileError(".csvファイルを選択してください。");
      return;
    }
    if (file.size > CSV_MAX_BYTES) {
      setFileError("CSVは2 MiB以下にしてください。");
      return;
    }
    setBusy(true);
    try {
      const bytes = await file.arrayBuffer();
      let text: string;
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      } catch {
        throw new Error("文字コードをUTF-8にして保存してください。");
      }
      const parsed = parseEquipmentCsv(text, kind);
      if (version !== request.current) return;
      // Check cross-kind ID conflicts before offering a commit.
      if (!parsed.issues.length) mergeCsvImport(data, parsed);
      setFilename(file.name);
      setBatch(parsed);
    } catch (e) {
      if (version === request.current)
        setFileError(
          e instanceof Error
            ? e.message
            : "CSVを読み込めません。もう一度選択してください。",
        );
    } finally {
      if (version === request.current) setBusy(false);
    }
  }

  return (
    <section className={styles.csvTransfer} aria-label={`${label}のCSV入出力`}>
      <div className={styles.csvToolbar}>
        <h2>CSV TRANSFER</h2>
        <button
          onClick={() => {
            downloadCsv(exportEquipmentCsv(kind, items), `${basename}.csv`);
            setMessage(`${label}${items.length}件のCSVを出力しました。`);
          }}
        >
          CSV出力
        </button>
        <button disabled={busy} onClick={() => input.current?.click()}>
          CSV読み込み
        </button>
        <input
          ref={input}
          type="file"
          accept=".csv,text/csv"
          aria-label={`${label}CSVファイル`}
          hidden
          onChange={(e) => {
            const file = e.currentTarget.files?.[0];
            e.currentTarget.value = "";
            void readFile(file);
          }}
        />
        <button
          onClick={() =>
            downloadCsv(
              `\uFEFF${csvColumns(kind).join(",")}\r\n`,
              `${basename}-template.csv`,
            )
          }
        >
          CSVテンプレート
        </button>
      </div>
      <p>
        選択中の{label}
        のCSVを扱います。読み込み前に追加・更新内容を確認できます。写真はCSVに含まれません。
      </p>
      <details className={styles.csvHelp}>
        <summary>ChatGPTで登録CSVを作る</summary>
        <p>
          下の依頼文をコピーして、調査したい機材名と一緒にChatGPTへ渡してください。CSVファイルを受け取ったら、この画面で読み込めます。
        </p>
        <textarea
          aria-label={`${label}CSV作成の依頼文`}
          readOnly
          value={csvCreationPrompt(kind)}
          rows={7}
        />
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(csvCreationPrompt(kind));
              setMessage("ChatGPTへの依頼文をコピーしました。");
            } catch {
              setFileError("依頼文を選択してコピーしてください。");
            }
          }}
        >
          依頼文をコピー
        </button>
        <p>
          UTF-8・カンマ区切り。IDが空欄なら新規追加、既存IDならCSVの項目で更新します。複数マウント・用途タグは「|」区切り。評価の空欄は0になります。最大1,000件・2
          MiB。
        </p>
      </details>
      {busy && <p role="status">CSVを確認しています…</p>}
      {message && (
        <p role="status" className={styles.csvSuccess}>
          {message}
        </p>
      )}
      {fileError && (
        <p role="alert" className={styles.error}>
          {fileError}
        </p>
      )}
      {batch && (
        <Modal
          title={
            batch.issues.length
              ? "CSVの内容を修正してください"
              : "CSV読み込みの確認"
          }
          onClose={() => setBatch(undefined)}
          wide
        >
          <div className={styles.csvPreview}>
            <p className={styles.csvFilename}>{filename}</p>
            {batch.issues.length ? (
              <>
                <p role="alert">
                  {batch.issues.length}
                  件の問題があります。登録内容は変更されていません。
                </p>
                <ul className={styles.csvIssues}>
                  {batch.issues.slice(0, 50).map((issue, index) => (
                    <li key={index}>
                      {issue.line}行目 · <strong>{issue.column}</strong>：
                      {issue.message}
                    </li>
                  ))}
                </ul>
                {batch.issues.length > 50 && <p>先頭50件を表示しています。</p>}
                <div className={styles.formFooter}>
                  <button onClick={() => setBatch(undefined)}>閉じる</button>
                </div>
              </>
            ) : (
              <>
                <p>
                  {label}：追加 {batch.items.length - updates}件 ／ 更新{" "}
                  {updates}件
                </p>
                <p>
                  CSVにない機材は保持します。同じIDの機材は、空欄を含めCSVの内容で更新します。登録済みの写真は保持します。
                </p>
                <div className={styles.csvRecords}>
                  {batch.items.slice(0, 50).map((item) => (
                    <details key={item.id}>
                      <summary>
                        <span>
                          {currentIds.has(item.id) ? "UPDATE" : "NEW"}
                        </span>{" "}
                        {item.name} <small>{item.maker}</small>
                      </summary>
                      <dl>
                        {Object.entries(equipmentCsvValues(item)).map(
                          ([key, value]) => (
                            <div key={key}>
                              <dt>{key}</dt>
                              <dd>{value || "—"}</dd>
                            </div>
                          ),
                        )}
                      </dl>
                    </details>
                  ))}
                </div>
                {batch.items.length > 50 && (
                  <p>
                    先頭50件を表示しています。登録対象は全{batch.items.length}
                    件です。
                  </p>
                )}
                {error && (
                  <p role="alert" className={styles.error}>
                    {error}
                  </p>
                )}
                <div className={styles.formFooter}>
                  <button onClick={() => setBatch(undefined)}>
                    キャンセル
                  </button>
                  <button
                    className="primary"
                    onClick={() => {
                      if (importCsv(batch)) {
                        setMessage(
                          `${label}のCSVを登録しました。追加 ${batch.items.length - updates}件・更新 ${updates}件。`,
                        );
                        setBatch(undefined);
                      }
                    }}
                  >
                    {batch.items.length}件を登録する
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </section>
  );
}
