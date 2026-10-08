export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
// Rasterize locally; no original photo or metadata leaves the browser.
export async function prepareImage(file: File): Promise<string> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error("PNG / JPEG / WebP画像を選んでください。");
  if (file.size > MAX_UPLOAD_BYTES)
    throw new Error("画像は10MB以下にしてください。");
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(
      1,
      1200 / Math.max(img.naturalWidth, img.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("画像処理に対応したブラウザでお試しください。");
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    // WebP retains transparency, unlike JPEG; fallback is supported by canvas.
    return canvas.toDataURL("image/webp", 0.82);
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `画像を読み込めませんでした。${error.message}`
        : "画像を読み込めませんでした。",
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
