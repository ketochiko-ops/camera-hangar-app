import {
  isCamera,
  type Camera,
  type Lens,
  type Equipment,
  type EquipmentKind,
  type Inventory,
} from "../../types";
import { validateEquipment } from "../../utils/domain";

export const CSV_MAX_BYTES = 2 * 1024 * 1024;
export const CSV_MAX_RECORDS = 1000;
const cameraSpecs = {
  sensor: "sensor",
  effective_pixels: "resolution",
  burst_rate: "continuousShooting",
  image_stabilization: "ibis",
  weight: "weight",
  storage_media: "storageSlots",
  af_system: "autofocusNote",
  release_year: "releaseYear",
} as const;
const lensRatings = {
  rating_resolution: "resolution",
  rating_bokeh: "bokeh",
  rating_low_light: "lowLight",
  rating_reach: "reach",
  rating_close_focus: "closeFocus",
  rating_mobility: "mobility",
  rating_versatility: "versatility",
} as const;
const cameraRatings = {
  rating_detail: "detail",
  rating_night: "night",
  rating_latitude: "latitude",
  rating_response: "response",
  rating_stability: "stability",
  rating_endurance: "endurance",
  rating_mobility: "mobility",
} as const;
const cameraRatingFallbacks = {
  detail: ["rating_detail", "rating_resolution", "resolution"],
  night: ["rating_night", "rating_low_light", "lowLight"],
  latitude: ["rating_latitude", "rating_dynamic_range", "dynamicRange"],
  response: ["rating_response", "rating_autofocus", "autofocus"],
} as const;
const legacyCameraRatings = {
  rating_resolution: "resolution",
  rating_bokeh: "bokeh",
  rating_low_light: "lowLight",
  rating_reach: "reach",
  rating_close_focus: "closeFocus",
  rating_versatility: "versatility",
  rating_autofocus: "autofocus",
  rating_dynamic_range: "dynamicRange",
  rating_handling: "handling",
  rating_color: "colorRendering",
} as const;
const ratingAliases: Record<EquipmentKind, Record<string, string>> = {
  camera: {
    rating_high_iso: "rating_low_light",
    rating_portability: "rating_mobility",
  },
  lens: {
    rating_sharpness: "rating_resolution",
    rating_portability: "rating_mobility",
    rating_close_up: "rating_close_focus",
  },
};
const baseColumns = ["id", "name", "maker", "category", "summary"];
const requiredBase = ["name", "maker", "category", "summary"];
export const csvColumns = (kind: EquipmentKind): string[] =>
  kind === "camera"
    ? [
        ...baseColumns,
        "role",
        "mount",
        ...Object.keys(cameraSpecs),
        ...Object.keys(cameraRatings),
      ]
    : [
        ...baseColumns,
        "compatible_mounts",
        "focal_length",
        "max_aperture",
        "weight",
        "usage_tags",
        ...Object.keys(lensRatings),
      ];
const requiredColumns = (kind: EquipmentKind) =>
  kind === "camera"
    ? [...requiredBase, "role", "mount"]
    : [
        ...requiredBase,
        "compatible_mounts",
        "focal_length",
        "max_aperture",
        "weight",
      ];

// Protect spreadsheet cells without losing the original text on a round trip.
const formulaLike = (value: string) => /^'|^\s*[=+@-]/.test(value);
const encodeCell = (value: string) => {
  const safe = formulaLike(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
};
const decodeCell = (value: string) =>
  value.startsWith("'") && formulaLike(value.slice(1)) ? value.slice(1) : value;

export function equipmentCsvValues(item: Equipment): Record<string, string> {
  const values: Record<string, string> = {
    id: item.id,
    name: item.name,
    maker: item.maker,
    category: item.category,
    summary: item.summary,
  };
  if (isCamera(item)) {
    values.role = item.role;
    values.mount = item.mount;
    for (const [column, key] of Object.entries(cameraSpecs))
      values[column] = item.specs[key];
    for (const [column, key] of Object.entries(legacyCameraRatings))
      if ((item.ratings as Record<string, number>)[key] !== undefined)
        values[column] = String(item.ratings[key]);
  } else {
    values.compatible_mounts = item.compatibleMounts.join("|");
    values.focal_length = item.focalLength;
    values.max_aperture = item.maxAperture;
    values.weight = item.weight;
    values.usage_tags = item.usageTags.join("|");
  }
  const ratings = item.ratings as Record<string, number>;
  for (const [column, key] of Object.entries(
    isCamera(item) ? cameraRatings : lensRatings,
  ))
    values[column] = String(ratings[key]);
  return values;
}

export function exportEquipmentCsv(
  kind: EquipmentKind,
  items: Equipment[],
): string {
  const columns = [
    ...csvColumns(kind),
    ...(kind === "camera"
      ? Object.entries(legacyCameraRatings)
          .filter(([, key]) =>
            items.some(
              (item) =>
                (item.ratings as Record<string, number>)[key] !== undefined,
            ),
          )
          .map(([column]) => column)
      : []),
  ];
  const rows = items.map((item) => {
    if (isCamera(item) !== (kind === "camera"))
      throw new Error("機材の種類が一致しません。");
    const values = equipmentCsvValues(item);
    return columns.map((column) => encodeCell(values[column] ?? "")).join(",");
  });
  return `\uFEFF${[columns.join(","), ...rows].join("\r\n")}\r\n`;
}

type CsvRow = { line: number; cells: string[] };
function readRows(source: string): CsvRow[] {
  const rows: CsvRow[] = [];
  const text = source.replace(/^\uFEFF/, "");
  let cells: string[] = [],
    value = "",
    state: "start" | "bare" | "quoted" | "closed" = "start";
  let line = 1,
    rowLine = 1;
  const finishCell = () => {
    cells.push(value);
    value = "";
    state = "start";
  };
  const finishRow = () => {
    finishCell();
    if (cells.some((cell) => cell.trim())) rows.push({ line: rowLine, cells });
    cells = [];
    if (rows.length > CSV_MAX_RECORDS + 1)
      throw new Error(`一度に読み込める機材は${CSV_MAX_RECORDS}件までです。`);
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (state === "quoted") {
      if (c === '"') {
        if (text[i + 1] === '"') {
          value += '"';
          i++;
        } else state = "closed";
      } else {
        value += c;
        if (c === "\n" || (c === "\r" && text[i + 1] !== "\n")) line++;
      }
    } else if (c === ",") finishCell();
    else if (c === "\r" || c === "\n") {
      finishRow();
      if (c === "\r" && text[i + 1] === "\n") i++;
      line++;
      rowLine = line;
    } else if (c === '"' && state === "start") state = "quoted";
    else if (c === '"' || state === "closed")
      throw new Error(`${line}行目：引用符の形式が正しくありません。`);
    else {
      value += c;
      state = "bare";
    }
  }
  if (state === "quoted")
    throw new Error(`${rowLine}行目：閉じていない引用符があります。`);
  if (cells.length || value || state === "closed") finishRow();
  return rows;
}

export type CsvIssue = { line: number; column: string; message: string };
export type CsvImport = {
  kind: EquipmentKind;
  items: Equipment[];
  issues: CsvIssue[];
};
export function parseEquipmentCsv(
  source: string,
  kind: EquipmentKind,
): CsvImport {
  const result: CsvImport = { kind, items: [], issues: [] };
  const issue = (line: number, column: string, message: string) =>
    result.issues.push({ line, column, message });
  let rows: CsvRow[];
  try {
    if (new Blob([source]).size > CSV_MAX_BYTES)
      throw new Error("CSVは2 MiB以下にしてください。");
    rows = readRows(source);
  } catch (error) {
    issue(
      1,
      "CSV",
      error instanceof Error ? error.message : "CSVを読み込めません。",
    );
    return result;
  }
  if (!rows.length) {
    issue(1, "CSV", "CSVが空です。");
    return result;
  }
  const headers = rows[0].cells.map((cell) => {
    const header = cell.trim().toLowerCase();
    return Object.hasOwn(ratingAliases[kind], header)
      ? ratingAliases[kind][header]
      : header;
  });
  const allowed = [
    ...csvColumns(kind),
    ...(kind === "camera" ? Object.keys(legacyCameraRatings) : []),
  ];
  if (new Set(headers).size !== headers.length)
    issue(rows[0].line, "HEADER", "列名が重複しています。");
  for (const header of headers)
    if (!allowed.includes(header))
      issue(
        rows[0].line,
        header || "HEADER",
        "未対応の列名です。選択したカメラ／レンズのテンプレートをご確認ください。",
      );
  for (const header of requiredColumns(kind))
    if (!headers.includes(header))
      issue(rows[0].line, header, "必須の列がありません。");
  if (rows.length === 1)
    issue(
      1,
      "CSV",
      "機材の行がありません。テンプレートに登録内容を入力してください。",
    );
  if (result.issues.length) return result;
  const ratingColumns = {
    ...(kind === "camera" ? cameraRatings : lensRatings),
    ...(kind === "camera"
      ? Object.fromEntries(
          Object.entries(legacyCameraRatings).filter(([column]) =>
            headers.includes(column),
          ),
        )
      : {}),
  };
  const ids = new Set<string>();
  for (const row of rows.slice(1)) {
    if (row.cells.length !== headers.length) {
      issue(
        row.line,
        "CSV",
        "列数がヘッダーと一致しません。カンマを含む値は二重引用符で囲んでください。",
      );
      continue;
    }
    const values: Record<string, string> = Object.fromEntries(
      headers.map((header, i) => [header, decodeCell(row.cells[i])]),
    );
    const get = (column: string) => values[column] ?? "";
    for (const [column, value] of Object.entries(values)) {
      const limit = column === "summary" ? 700 : column === "name" ? 100 : 180;
      if (value.length > limit)
        issue(row.line, column, `${limit}文字以内にしてください。`);
    }
    const id = get("id").trim() || crypto.randomUUID();
    if (ids.has(id)) issue(row.line, "id", "CSV内でIDが重複しています。");
    ids.add(id);
    const ratings = Object.fromEntries(
      Object.entries(ratingColumns).map(([column, key]) => {
        const text = get(column).trim();
        const value =
          text === ""
            ? 0
            : /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(text)
              ? Number(text)
              : NaN;
        return [key, value];
      }),
    );
    if (kind === "camera") {
      for (const [key, [column, , former]] of Object.entries(
        cameraRatingFallbacks,
      ))
        if (!headers.includes(column)) ratings[key] = ratings[former] ?? 0;
    }
    const base = {
      id,
      name: get("name"),
      maker: get("maker"),
      category: get("category"),
      summary: get("summary"),
    };
    const splitList = (column: string) => [
      ...new Set(
        get(column)
          .split("|")
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ];
    const item: Equipment =
      kind === "camera"
        ? {
            ...base,
            mount: get("mount"),
            role: get("role"),
            specs: Object.fromEntries(
              Object.entries(cameraSpecs).map(([column, key]) => [
                key,
                get(column),
              ]),
            ) as Camera["specs"],
            ratings: ratings as Camera["ratings"],
          }
        : {
            ...base,
            compatibleMounts: splitList("compatible_mounts"),
            focalLength: get("focal_length"),
            maxAperture: get("max_aperture"),
            weight: get("weight"),
            usageTags: splitList("usage_tags"),
            ratings: ratings as Lens["ratings"],
          };
    const fieldColumns: Record<string, string> = {
      compatibleMounts: "compatible_mounts",
      focalLength: "focal_length",
      maxAperture: "max_aperture",
      ...Object.fromEntries(
        Object.entries(cameraSpecs).map(([column, key]) => [
          `specs.${key}`,
          column,
        ]),
      ),
      ...Object.fromEntries(
        Object.entries(ratingColumns).map(([column, key]) => [
          `ratings.${key}`,
          column,
        ]),
      ),
    };
    if (kind === "camera")
      for (const [key, [column, formerColumn]] of Object.entries(
        cameraRatingFallbacks,
      ))
        if (!headers.includes(column) && headers.includes(formerColumn))
          fieldColumns[`ratings.${key}`] = formerColumn;
    for (const [field, message] of Object.entries(validateEquipment(item)))
      issue(row.line, fieldColumns[field] ?? field, message);
    result.items.push(item);
  }
  // Never return a partially usable batch.
  if (result.issues.length) result.items = [];
  return result;
}

export function mergeCsvImport(data: Inventory, batch: CsvImport): Inventory {
  if (batch.issues.length || !batch.items.length)
    throw new Error("読み込み内容を確認してください。");
  const current = batch.kind === "camera" ? data.cameras : data.lenses;
  const other = batch.kind === "camera" ? data.lenses : data.cameras;
  const otherIds = new Set(other.map((item) => item.id));
  const existing = new Map<string, Equipment>(
    current.map((item) => [item.id, item]),
  );
  const seen = new Set<string>();
  for (const item of batch.items) {
    if (
      isCamera(item) !== (batch.kind === "camera") ||
      Object.keys(validateEquipment(item)).length
    )
      throw new Error("登録内容に不正な値があります。");
    if (!item.id || seen.has(item.id) || otherIds.has(item.id))
      throw new Error(
        `ID「${item.id}」が重複しています。新規登録する場合はIDを空欄にしてください。`,
      );
    seen.add(item.id);
    const previous = existing.get(item.id);
    const previousScores =
      previous && isCamera(previous)
        ? Object.fromEntries(
            Object.values(legacyCameraRatings)
              .filter((key) => previous.ratings[key] !== undefined)
              .map((key) => [key, previous.ratings[key]]),
          )
        : {};
    existing.set(
      item.id,
      isCamera(item)
        ? {
            ...item,
            ratings: { ...previousScores, ...item.ratings },
            image: previous?.image,
          }
        : { ...item, image: previous?.image },
    );
  }
  return batch.kind === "camera"
    ? { ...data, cameras: [...existing.values()] as Camera[] }
    : { ...data, lenses: [...existing.values()] as Lens[] };
}

export function csvCreationPrompt(kind: EquipmentKind): string {
  return `調査結果から${kind === "camera" ? "カメラ" : "レンズ"}登録用のUTF-8 CSVファイルを作成してください。\nヘッダーは次の列名をそのまま使ってください。\n${csvColumns(kind).join(",")}\n必須項目：${requiredColumns(kind).join(", ")}。\n1行に1機材。新規登録のidは空欄。既存機材の更新は出力CSVのidを保持。複数マウント・用途タグは | 区切り。カンマ・改行・引用符を含む値は二重引用符で囲み、値内の引用符は二重にしてください。\n評価は0〜10の数値。主観評価を測定値と混同せず、評価できない項目は空欄（アプリでは0として登録）。不明な任意スペックも空欄にし、必須情報が確認できない機材は含めないでください。\nセンサーは例 FULL FRAME CMOS、重量は例 710 g、画素数は例 24.5 MP、連写は例 14frames /s、焦点距離は例 24–70 mm、開放F値は例 f/2.8、発売年は4桁。nameは100文字以内、summaryは700文字以内、その他の各セルは180文字以内。写真はCSVに含めません。\n調査元URLと不確かな情報はCSVと別に説明してください。CSV内に説明行やMarkdownのコードフェンス、追加列を入れないでください。`;
}

export function downloadCsv(text: string, filename: string): void {
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
