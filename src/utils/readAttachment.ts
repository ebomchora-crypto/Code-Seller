import {
  MAX_FILE_BYTES,
  attachmentType,
  docxXmlToText,
  htmlToText,
  limitText,
  type PreparedAttachment,
} from '@/utils/copilotAttachments'

const IMAGE_MAX_SIDE = 1600
const THUMB_MAX_SIDE = 320
const PDF_MAX_PAGES = 80
const PDF_SCAN_PAGES = 3

// Desenha a imagem reduzida num canvas e devolve em JPEG.
function drawJpeg(source: CanvasImageSource, width: number, height: number, maxSide: number, quality: number): string {
  const scale = Math.min(1, maxSide / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Não foi possível ler a imagem.')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', quality)
}

async function readImage(file: File): Promise<Pick<PreparedAttachment, 'images' | 'thumb'>> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error(`Não foi possível abrir a imagem "${file.name}". Use PNG, JPG ou WebP.`)
  }
  try {
    return {
      images: [drawJpeg(bitmap, bitmap.width, bitmap.height, IMAGE_MAX_SIDE, 0.85)],
      thumb: drawJpeg(bitmap, bitmap.width, bitmap.height, THUMB_MAX_SIDE, 0.7),
    }
  } finally {
    bitmap.close()
  }
}

// PDF: lê o texto de cada página. PDF escaneado (só imagem) vira fotos das
// primeiras páginas, que a IA consegue ler.
async function readPdf(file: File): Promise<Pick<PreparedAttachment, 'text' | 'truncated' | 'images'>> {
  const [pdfjs, worker] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')])
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
  const pdf = await task.promise
  try {
    const pages: string[] = []
    const total = Math.min(pdf.numPages, PDF_MAX_PAGES)
    for (let number = 1; number <= total; number++) {
      const page = await pdf.getPage(number)
      const content = await page.getTextContent()
      const line = content.items.map((item) => ('str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '')).join('')
      pages.push(line.trim())
    }
    const text = pages.filter(Boolean).join('\n\n')
    if (text.replace(/\s/g, '').length >= 20) {
      const limited = limitText(text)
      return { text: limited.text, truncated: limited.truncated || pdf.numPages > PDF_MAX_PAGES, images: [] }
    }
    const images: string[] = []
    for (let number = 1; number <= Math.min(pdf.numPages, PDF_SCAN_PAGES); number++) {
      const page = await pdf.getPage(number)
      const viewport = page.getViewport({ scale: 1.6 })
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(viewport.width)
      canvas.height = Math.round(viewport.height)
      await page.render({ canvas, viewport }).promise
      images.push(drawJpeg(canvas, canvas.width, canvas.height, IMAGE_MAX_SIDE, 0.85))
    }
    return { images, truncated: pdf.numPages > PDF_SCAN_PAGES }
  } finally {
    void task.destroy()
  }
}

// .docx é um zip: acha word/document.xml no índice do zip e descompacta.
async function readDocx(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const view = new DataView(bytes.buffer)
  let end = -1
  for (let index = bytes.length - 22; index >= Math.max(0, bytes.length - 65_557); index--) {
    if (view.getUint32(index, true) === 0x06054b50) {
      end = index
      break
    }
  }
  if (end < 0) throw new Error(`O arquivo "${file.name}" não parece um Word válido.`)
  const entries = view.getUint16(end + 10, true)
  let offset = view.getUint32(end + 16, true)
  const decoder = new TextDecoder()
  for (let entry = 0; entry < entries; entry++) {
    if (view.getUint32(offset, true) !== 0x02014b50) break
    const method = view.getUint16(offset + 10, true)
    const compressedSize = view.getUint32(offset + 20, true)
    const nameLength = view.getUint16(offset + 28, true)
    const extraLength = view.getUint16(offset + 30, true)
    const commentLength = view.getUint16(offset + 32, true)
    const localOffset = view.getUint32(offset + 42, true)
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength))
    if (name === 'word/document.xml') {
      const dataStart = localOffset + 30 + view.getUint16(localOffset + 26, true) + view.getUint16(localOffset + 28, true)
      const data = bytes.subarray(dataStart, dataStart + compressedSize)
      if (method === 0) return docxXmlToText(decoder.decode(data))
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
      return docxXmlToText(await new Response(stream).text())
    }
    offset += 46 + nameLength + extraLength + commentLength
  }
  throw new Error(`Não encontrei texto no arquivo "${file.name}".`)
}

/** Lê um arquivo escolhido no Copilot e deixa pronto para enviar. */
export async function readAttachment(file: File): Promise<PreparedAttachment> {
  const type = attachmentType(file.name, file.type)
  if (!type) throw new Error(`"${file.name}": envie imagem, PDF, Word (.docx) ou texto (.txt, .csv).`)
  if (file.size > MAX_FILE_BYTES) throw new Error(`"${file.name}" passa de 20 MB.`)
  const base = { id: crypto.randomUUID(), name: file.name, size: file.size }

  if (type === 'image') return { ...base, kind: 'image', ...(await readImage(file)) }
  if (type === 'pdf') return { ...base, kind: 'document', ...(await readPdf(file)) }

  const raw = type === 'docx' ? await readDocx(file) : await file.text()
  const limited = limitText(/\.html?$/i.test(file.name) ? htmlToText(raw) : raw)
  return { ...base, kind: 'document', text: limited.text, truncated: limited.truncated, images: [] }
}
