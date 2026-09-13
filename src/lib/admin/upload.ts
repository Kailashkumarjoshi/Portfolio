'use client';

import { getBrowserSupabase } from '@/lib/supabase/client';
import { MEDIA_BUCKET } from '@/lib/supabase/config';
import type { MediaDraft } from './schema';

const MAX_BYTES = 50 * 1024 * 1024;

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'];
const AUDIO_TYPES = [
  'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/aac', 'audio/ogg',
  'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/flac',
];

export type UploadKind = 'photo' | 'video' | 'audio';

export function kindOfFile(file: File): UploadKind | null {
  if (IMAGE_TYPES.includes(file.type)) return 'photo';
  if (VIDEO_TYPES.includes(file.type)) return 'video';
  if (AUDIO_TYPES.includes(file.type)) return 'audio';
  return null;
}

/** Reads a photo's real dimensions so the site can reserve the right space for it. */
async function measureImage(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    image.src = url;
  });
}

function extensionOf(file: File): string {
  const fromName = file.name.split('.').pop();
  if (fromName && /^[a-z0-9]{1,5}$/i.test(fromName)) return fromName.toLowerCase();
  return file.type.split('/')[1]?.replace(/[^a-z0-9]/g, '') || 'bin';
}

export interface UploadResult {
  url: string;
  storage_path: string;
  kind: UploadKind;
  width: number | null;
  height: number | null;
}

/**
 * Sends a file straight from the browser to storage, so large videos never
 * travel through the app server and there is no upload size ceiling to explain.
 */
export async function uploadFile(file: File): Promise<UploadResult> {
  const kind = kindOfFile(file);
  if (!kind) {
    throw new Error(
      `${file.name} is not a kind of file this site can show. Use a photo, a video, or an audio file.`,
    );
  }
  if (file.size > MAX_BYTES) {
    throw new Error(`${file.name} is larger than 50 MB. Try a smaller or shorter version.`);
  }

  const supabase = getBrowserSupabase();
  if (!supabase) throw new Error('The database is not connected.');

  const folder = kind === 'audio' ? 'music' : 'memories';
  const path = `${folder}/${crypto.randomUUID()}.${extensionOf(file)}`;

  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  const size = kind === 'photo' ? await measureImage(file) : null;

  return {
    url: data.publicUrl,
    storage_path: path,
    kind,
    width: size?.width ?? null,
    height: size?.height ?? null,
  };
}

export function draftFromUpload(result: UploadResult, caption: string | null = null): MediaDraft {
  return {
    kind: result.kind === 'audio' ? 'video' : result.kind,
    url: result.url,
    storage_path: result.storage_path,
    caption,
    poster_url: null,
    width: result.width,
    height: result.height,
  };
}
