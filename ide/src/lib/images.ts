// Imagens anexadas ao pedido da IA: reduzidas no navegador (lado maior até 1600 px) e enviadas como data URL.
export const MAX_IMAGES = 4;
const MAX_SIDE = 1600;

export async function fileToDataUrl(file: File): Promise<string> {
  if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) throw new Error('Use imagens PNG, JPG, WebP ou GIF.');
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error('Não foi possível ler esta imagem.');
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d'); if (!context) throw new Error('Não foi possível preparar a imagem.');
  context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close?.();
  const url = canvas.toDataURL('image/jpeg', 0.85);
  if (url.length > 4_000_000) throw new Error('Imagem grande demais, mesmo reduzida.');
  return url;
}
