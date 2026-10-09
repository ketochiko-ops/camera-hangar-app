import { createContext, useContext, useState, type ReactNode } from "react";

export type LabelMode = "english" | "bilingual";
export const LABEL_MODE_KEY = "optical-arsenal:label-mode:v1";
const japaneseLabels: Record<string, string> = {
  "ADDITIONAL PARTS": "追加パーツ",
  "ADDITIONAL FUNCTIONS": "追加機能",
  "WIRELESS FLASH": "無線ストロボ使用可",
  FLASH: "ストロボ使用可",
  "HIGH SPEED SYNC": "ハイスピードシンクロ",
  TTL: "TTL自動調光",
  LEADER: "メイン機",
  WINGMAN: "僚機",
  CAMERA: "カメラ",
  LENS: "レンズ",
  READY: "編成完了",
  INCOMPLETE: "選択待ち",
  "MOUNT CHECK": "マウント要確認",
  "CAMERA PERFORMANCE": "カメラ性能",
  "LENS PERFORMANCE": "レンズ性能",
  "SHOOTING RANGE": "撮影レンジ",
  "SQUADRON COVERAGE": "編成全体の撮影レンジ",
  "WIDE ANGLE": "広角",
  "CLOSE-UP": "接写",
  "STANDARD RANGE": "標準",
  "TELEPHOTO RANGE": "望遠",
  "35MM EQUIVALENT": "35mm換算焦点距離",
  "PART WEIGHT": "追加重量（g）",
  LIGHTING: "ライティング",
  NONE: "なし",
  GRIP: "グリップ",
  "MOUNT ADAPTER": "マウントアダプター",
  OTHER: "その他",
  TYPE: "種類",
  "PART NAME": "パーツ名",
  "STATUS EFFECTS": "ステータス補正",
  DETAIL: "解像性能",
  NIGHT: "低照度性能",
  LATITUDE: "ダイナミックレンジ",
  AF: "AF性能",
  STABILITY: "撮影安定性",
  ENDURANCE: "バッテリー持続力",
  RESOLUTION: "解像性能",
  BOKEH: "ボケ",
  "LOW LIGHT": "低照度性能",
  REACH: "望遠性能",
  "CLOSE FOCUS": "近接撮影",
  MOBILITY: "携行性",
  VERSATILITY: "汎用性",
  SENSOR: "センサー",
  PIXELS: "画素数",
  MOUNT: "マウント",
  BURST: "連写速度",
  MEDIA: "記録メディア",
  WEIGHT: "重量",
  RELEASE: "発売年",
  "COMPATIBLE MOUNTS": "対応マウント",
  "FOCAL LENGTH": "焦点距離",
  "MAX APERTURE": "開放F値",
  "IMAGE STABILIZATION": "手ぶれ補正",
  "AF SYSTEM": "AF方式",
};

export function formatItemLabel(label: string, mode: LabelMode): string {
  return mode === "bilingual" && Object.hasOwn(japaneseLabels, label)
    ? `${label} / ${japaneseLabels[label]}`
    : label;
}

const LabelModeContext = createContext<{
  mode: LabelMode;
  setMode(mode: LabelMode): void;
}>({ mode: "english", setMode() {} });

export function LabelModeProvider({ children }: { children: ReactNode }) {
  const [mode, setLabelMode] = useState<LabelMode>(() => {
    try {
      return localStorage.getItem(LABEL_MODE_KEY) === "bilingual"
        ? "bilingual"
        : "english";
    } catch {
      return "english";
    }
  });
  const setMode = (next: LabelMode) => {
    setLabelMode(next);
    try {
      localStorage.setItem(LABEL_MODE_KEY, next);
    } catch {
      // This optional preference must not prevent changing the current view.
    }
  };
  return (
    <LabelModeContext.Provider value={{ mode, setMode }}>
      {children}
    </LabelModeContext.Provider>
  );
}

export const useLabelMode = () => useContext(LabelModeContext);
