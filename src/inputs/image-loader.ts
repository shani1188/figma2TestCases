import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const MAX_DIMENSION = 2000;
const SUPPORTED = ['.png', '.jpg', '.jpeg', '.webp'];

export async function loadImage(filePath: string): Promise<{ base64: string; mimeType: 'image/png' }> {
  const absolute = path.resolve(filePath);

  if (!fs.existsSync(absolute)) {
    throw new Error(`Image not found: ${absolute}`);
  }

  const ext = path.extname(filePath).toLowerCase();
  if (!SUPPORTED.includes(ext)) {
    throw new Error(`Unsupported format "${ext}". Supported: ${SUPPORTED.join(', ')}`);
  }

  let pipeline = sharp(absolute);
  const meta = await pipeline.metadata();

  if ((meta.width && meta.width > MAX_DIMENSION) || (meta.height && meta.height > MAX_DIMENSION)) {
    pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true });
  }

  const buffer = await pipeline.png().toBuffer();
  return { base64: buffer.toString('base64'), mimeType: 'image/png' };
}
