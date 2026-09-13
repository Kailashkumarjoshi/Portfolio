'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import type { MediaDraft } from '@/lib/admin/schema';
import { draftFromUpload, uploadFile } from '@/lib/admin/upload';
import { parseEmbed } from '@/lib/embeds';
import { cn } from '@/lib/utils';

interface MediaManagerProps {
  items: MediaDraft[];
  onChange: (items: MediaDraft[]) => void;
}

/**
 * Photos and videos for one memory. Uploads go straight from the browser to
 * storage; links to YouTube or Vimeo are kept as links. The first item is the
 * one the memory shows on its card, which is stated rather than implied.
 */
export function MediaManager({ items, onChange }: MediaManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;

    setBusy(true);
    setError(null);
    const added: MediaDraft[] = [];

    for (let i = 0; i < list.length; i++) {
      setProgress(`Uploading ${i + 1} of ${list.length}…`);
      try {
        added.push(draftFromUpload(await uploadFile(list[i])));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'That file could not be uploaded.');
      }
    }

    if (added.length > 0) onChange([...items, ...added]);
    setProgress(null);
    setBusy(false);
  };

  const addLink = () => {
    const url = linkUrl.trim();
    if (!url) return;
    const embed = parseEmbed(url);
    if (!embed.src) {
      setError('That link is not a YouTube or Vimeo video. Paste the link from the address bar.');
      return;
    }
    onChange([
      ...items,
      {
        kind: 'embed',
        url,
        storage_path: null,
        caption: null,
        poster_url: embed.poster,
        width: null,
        height: null,
      },
    ]);
    setLinkUrl('');
    setError(null);
  };

  const update = (index: number, patch: Partial<MediaDraft>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));

  const move = (index: number, direction: -1 | 1) => {
    const to = index + direction;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    [next[index], next[to]] = [next[to], next[index]];
    onChange(next);
  };

  return (
    <div>
      <span className="label">Photos &amp; videos</span>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void addFiles(e.dataTransfer.files);
        }}
        className={cn(
          'rounded-xl border border-dashed p-5 text-center transition-colors',
          dragOver ? 'border-champagne/70 bg-champagne/10' : 'border-champagne/25',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="btn-ghost"
        >
          {busy ? (progress ?? 'Uploading…') : 'Choose photos or videos'}
        </button>
        <p className="help">Or drag them here. Up to 50 MB each.</p>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addLink();
            }
          }}
          placeholder="…or paste a YouTube or Vimeo link"
          aria-label="Link to a video elsewhere"
          className="field"
        />
        <button type="button" onClick={addLink} className="btn-ghost shrink-0">
          Add link
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 font-sans text-sm text-rose-300">
          {error}
        </p>
      )}

      {items.length > 0 && (
        <ul className="mt-5 space-y-2">
          {items.map((item, index) => (
            <li key={`${item.url}-${index}`} className="frost flex items-start gap-3 rounded-xl p-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-plum-800">
                {item.kind === 'photo' ? (
                  <Image src={item.url} alt="" fill sizes="64px" className="object-cover" />
                ) : item.poster_url ? (
                  <Image src={item.poster_url} alt="" fill sizes="64px" className="object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-champagne">
                    ▶
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="mb-1.5 font-sans text-[0.62rem] uppercase tracking-[0.16em] text-mauve-400">
                  {index === 0 ? 'Shown on the card' : item.kind === 'embed' ? 'Linked video' : item.kind}
                </p>
                <input
                  type="text"
                  value={item.caption ?? ''}
                  onChange={(e) => update(index, { caption: e.target.value })}
                  placeholder="Caption (optional)"
                  aria-label={`Caption for item ${index + 1}`}
                  className="field !min-h-[2.4rem] !py-1.5 !text-sm"
                />
              </div>

              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Move earlier"
                  className="px-2 text-mauve-300 transition-colors hover:text-cream disabled:opacity-25"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label="Move later"
                  className="px-2 text-mauve-300 transition-colors hover:text-cream disabled:opacity-25"
                >
                  ▼
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label="Remove this one"
                  className="px-2 text-mauve-400 transition-colors hover:text-rose-300"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
