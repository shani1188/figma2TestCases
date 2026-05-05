import { loadImage } from './image-loader';
import type { ResolvedInput } from '../types';

export async function resolveInput(imagePath: string): Promise<ResolvedInput> {
  const { base64, mimeType } = await loadImage(imagePath);
  return {
    source: 'image',
    imageBase64: base64,
    imageMimeType: mimeType,
    sourceRef: imagePath,
  };
}
