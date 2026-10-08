import { getExportSize, type ExportRatio } from "./sizes";
export async function exportPng(
  node: HTMLElement,
  ratio: ExportRatio,
  name: string,
): Promise<void> {
  const { toBlob } = await import("html-to-image");
  const size = getExportSize(ratio);
  await document.fonts.ready;
  await Promise.all(
    Array.from(node.querySelectorAll("img")).map((img) => img.decode()),
  );
  const blob = await toBlob(node, {
    ...size,
    canvasWidth: size.width,
    canvasHeight: size.height,
    pixelRatio: 1,
    backgroundColor: "#11191c",
    skipFonts: true,
  });
  if (!blob) throw new Error("PNGの作成に失敗しました。");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `optical-arsenal-${name.replace(/[^\p{L}\p{N}_.-]/gu, "-")}-${ratio.replace(":", "x")}.png`;
  link.href = url;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
}
