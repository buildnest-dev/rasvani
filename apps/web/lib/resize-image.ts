/** Browser only: shrinks a chosen picture to at most 1000px and about 150 KB so uploads are quick on mobile data. */
export async function shrinkImage(file: File, maxSide = 1000): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Choose a JPG, PNG or WebP picture.');
  if (file.size > 15 * 1024 * 1024) throw new Error('That picture is too large. Choose one under 15 MB.');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser cannot prepare this picture.');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  for (const quality of [0.85, 0.7, 0.55, 0.4]) {
    const url = canvas.toDataURL('image/jpeg', quality);
    if (url.length < 340_000) return url;
  }
  throw new Error('This picture is still too large after shrinking. Try a simpler one.');
}
