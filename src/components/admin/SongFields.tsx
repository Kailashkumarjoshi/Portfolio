'use client';

import { useEffect, useRef, useState } from 'react';
import type { SongConfig } from '@/lib/types';
import { uploadFile } from '@/lib/admin/upload';
import { formatClock, parseClock } from '@/lib/utils';

const EMPTY: SongConfig = {
  url: null,
  title: null,
  artist: null,
  start_seconds: 0,
  end_seconds: null,
};

interface SongFieldsProps {
  value: SongConfig | null;
  onChange: (value: SongConfig | null) => void;
  label: string;
  help: string;
}

/**
 * A song, and the exact stretch of it that should play.
 *
 * Start and end are typed as minutes and seconds because that is how anyone
 * thinks about a song, and there is a listen button right there so the choice
 * can be made by ear instead of by arithmetic.
 */
export function SongFields({ value, onChange, label, help }: SongFieldsProps) {
  const song = value ?? EMPTY;
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startText, setStartText] = useState(formatClock(song.start_seconds));
  const [endText, setEndText] = useState(song.end_seconds === null ? '' : formatClock(song.end_seconds));
  const [previewing, setPreviewing] = useState(false);

  // Keep the typed times in step when a different song is loaded into the form.
  useEffect(() => {
    setStartText(formatClock(song.start_seconds));
    setEndText(song.end_seconds === null ? '' : formatClock(song.end_seconds));
  }, [song.url, song.start_seconds, song.end_seconds]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const patch = (next: Partial<SongConfig>) => onChange({ ...song, ...next });

  const onUpload = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const result = await uploadFile(file);
      if (result.kind !== 'audio') {
        setError('That is not an audio file. Choose an mp3, m4a, or similar.');
      } else {
        patch({ url: result.url, title: song.title ?? file.name.replace(/\.[^.]+$/, '') });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That file could not be uploaded.');
    }
    setBusy(false);
  };

  const commitStart = () => {
    const seconds = parseClock(startText);
    const next = seconds === null ? 0 : seconds;
    patch({ start_seconds: next });
    setStartText(formatClock(next));
  };

  const commitEnd = () => {
    const seconds = parseClock(endText);
    patch({ end_seconds: seconds });
    setEndText(seconds === null ? '' : formatClock(seconds));
  };

  const togglePreview = () => {
    if (!song.url) return;

    if (previewing) {
      audioRef.current?.pause();
      setPreviewing(false);
      return;
    }

    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;
    if (audio.src !== song.url) audio.src = song.url;
    audio.currentTime = song.start_seconds;
    audio.volume = 0.7;

    const stopAtEnd = () => {
      if (song.end_seconds !== null && audio.currentTime >= song.end_seconds) {
        audio.pause();
        setPreviewing(false);
        audio.removeEventListener('timeupdate', stopAtEnd);
      }
    };
    audio.addEventListener('timeupdate', stopAtEnd);
    audio.addEventListener('pause', () => setPreviewing(false), { once: true });

    void audio.play().then(() => setPreviewing(true)).catch(() => {
      setError('That audio could not be played in this browser.');
    });
  };

  return (
    <fieldset className="frost rounded-2xl p-4 sm:p-5">
      <legend className="px-2 font-sans text-[0.72rem] uppercase tracking-[0.14em] text-champagne/75">
        {label}
      </legend>
      <p className="help !mt-0 mb-4">{help}</p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          className="field"
          placeholder="Paste a link to an audio file"
          aria-label="Audio file link"
          value={song.url ?? ''}
          onChange={(e) => patch({ url: e.target.value || null })}
        />
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onUpload(file);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="btn-ghost shrink-0"
        >
          {busy ? 'Uploading…' : 'Upload a song'}
        </button>
      </div>

      {song.url && (
        <>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor={`${label}-title`}>
                Song name
              </label>
              <input
                id={`${label}-title`}
                className="field"
                value={song.title ?? ''}
                onChange={(e) => patch({ title: e.target.value || null })}
              />
            </div>
            <div>
              <label className="label" htmlFor={`${label}-artist`}>
                Artist
              </label>
              <input
                id={`${label}-artist`}
                className="field"
                value={song.artist ?? ''}
                onChange={(e) => patch({ artist: e.target.value || null })}
              />
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor={`${label}-start`}>
                Start at
              </label>
              <input
                id={`${label}-start`}
                className="field"
                inputMode="numeric"
                placeholder="0:00"
                value={startText}
                onChange={(e) => setStartText(e.target.value)}
                onBlur={commitStart}
              />
            </div>
            <div>
              <label className="label" htmlFor={`${label}-end`}>
                Stop at
              </label>
              <input
                id={`${label}-end`}
                className="field"
                inputMode="numeric"
                placeholder="end of song"
                value={endText}
                onChange={(e) => setEndText(e.target.value)}
                onBlur={commitEnd}
              />
            </div>
            <div className="flex items-end">
              <button type="button" onClick={togglePreview} className="btn-ghost w-full">
                {previewing ? 'Stop' : 'Listen to this bit'}
              </button>
            </div>
          </div>

          <p className="help">
            Type times as minutes and seconds, like 1:24. Leave &ldquo;stop at&rdquo; empty to
            play the whole song. The chosen stretch loops quietly in the background.
          </p>

          <button
            type="button"
            onClick={() => onChange(null)}
            className="mt-3 font-sans text-xs text-mauve-300 underline underline-offset-4 transition-colors hover:text-cream"
          >
            Remove this song
          </button>
        </>
      )}

      {error && (
        <p role="alert" className="mt-3 font-sans text-sm text-rose-300">
          {error}
        </p>
      )}
    </fieldset>
  );
}
