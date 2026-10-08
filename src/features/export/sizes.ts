export const exportSizes = {
  "16:9": { width: 1600, height: 900 },
  "1:1": { width: 1200, height: 1200 },
  "4:5": { width: 1200, height: 1500 },
} as const;
export type ExportRatio = keyof typeof exportSizes;
export const getExportSize = (ratio: ExportRatio) => exportSizes[ratio];
