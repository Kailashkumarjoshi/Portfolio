'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { SongConfig } from '@/lib/types';

interface MusicApi {
  /** The song currently loaded, whether or not it is sounding. */
  current: SongConfig | null;
  playing: boolean;
  /** True when the browser refused to start audio without a gesture. */
  needsGesture: boolean;
  muted: boolean;
  /** Seconds elapsed within the chosen excerpt. */
  position: number;
  /** Length of the chosen excerpt, or null while unknown. */
  span: number | null;
  /** Loads a song and tries to play it. Pass null to fall back to the global track. */
  setSong: (song: SongConfig | null, options?: { temporary?: boolean }) => void;
  /** Returns to the global track after a memory's own song has finished its turn. */
  restoreGlobal: () => void;
  toggle: () => void;
  setMuted: (muted: boolean) => void;
  available: boolean;
}

const MusicContext = createContext<MusicApi | null>(null);

export function useMusic(): MusicApi {
  const context = useContext(MusicContext);
  if (!context) throw new Error('useMusic must be used inside <MusicProvider>');
  return context;
}

const TARGET_VOLUME = 0.55;

export function MusicProvider({
  globalSong,
  children,
}: {
  globalSong: SongConfig | null;
  children: ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<number | null>(null);
  const wantsPlay = useRef(false);

  const [current, setCurrent] = useState<SongConfig | null>(globalSong);
  const [playing, setPlaying] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);

  // One audio element for the whole visit, so switching songs never restarts the graph.
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.loop = false;
    audio.volume = 0;
    // Kept in the document (hidden) rather than detached: browsers treat an
    // attached element more kindly for background playback and media keys.
    audio.hidden = true;
    audio.setAttribute('aria-hidden', 'true');
    document.body.appendChild(audio);
    audioRef.current = audio;

    const onPlay = () => {
      setPlaying(true);
      setNeedsGesture(false);
    };
    const onPause = () => setPlaying(false);
    const onTime = () => {
      const song = songRef.current;
      if (!song) return;
      const start = song.start_seconds ?? 0;
      const end = song.end_seconds;
      // Loop the chosen excerpt rather than running on into the rest of the track.
      if (end !== null && end > start && audio.currentTime >= end) {
        audio.currentTime = start;
      }
      setPosition(Math.max(0, audio.currentTime - start));
    };
    const onLoaded = () => {
      const song = songRef.current;
      if (!song) return;
      const start = song.start_seconds ?? 0;
      if (start > 0 && Math.abs(audio.currentTime - start) > 0.4) {
        audio.currentTime = start;
      }
      setDuration(Number.isFinite(audio.duration) ? audio.duration : null);
    };
    const onEnded = () => {
      const song = songRef.current;
      if (!song) return;
      audio.currentTime = song.start_seconds ?? 0;
      void audio.play().catch(() => setPlaying(false));
    };
    const onError = () => {
      setPlaying(false);
      wantsPlay.current = false;
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
      audio.removeAttribute('src');
      audio.remove();
      if (fadeRef.current !== null) cancelAnimationFrame(fadeRef.current);
    };
  }, []);

  const songRef = useRef<SongConfig | null>(globalSong);
  useEffect(() => {
    songRef.current = current;
  }, [current]);

  const fadeTo = useCallback((target: number, ms: number, done?: () => void) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (fadeRef.current !== null) cancelAnimationFrame(fadeRef.current);

    const from = audio.volume;
    const startedAt = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / ms);
      audio.volume = Math.max(0, Math.min(1, from + (target - from) * t));
      if (t < 1) {
        fadeRef.current = requestAnimationFrame(step);
      } else {
        fadeRef.current = null;
        done?.();
      }
    };
    fadeRef.current = requestAnimationFrame(step);
  }, []);

  const load = useCallback(
    (song: SongConfig | null, autoplay: boolean) => {
      const audio = audioRef.current;
      if (!audio) return;

      setCurrent(song);
      songRef.current = song;
      setPosition(0);
      setDuration(null);

      if (!song?.url) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        return;
      }

      const swap = () => {
        audio.src = song.url as string;
        audio.currentTime = song.start_seconds ?? 0;
        if (!autoplay) return;
        void audio
          .play()
          .then(() => fadeTo(muted ? 0 : TARGET_VOLUME, 700))
          .catch(() => {
            // Autoplay policy: wait for the visitor to ask for it.
            setNeedsGesture(true);
            setPlaying(false);
          });
      };

      if (audio.src && !audio.paused) fadeTo(0, 350, swap);
      else swap();
    },
    [fadeTo, muted],
  );

  const previousGlobal = useRef<SongConfig | null>(globalSong);
  useEffect(() => {
    previousGlobal.current = globalSong;
  }, [globalSong]);

  const setSong = useCallback(
    (song: SongConfig | null) => {
      const next = song?.url ? song : globalSong;
      if (next?.url === songRef.current?.url) return;
      load(next, wantsPlay.current);
    },
    [globalSong, load],
  );

  const restoreGlobal = useCallback(() => {
    if (globalSong?.url === songRef.current?.url) return;
    load(globalSong, wantsPlay.current);
  }, [globalSong, load]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      wantsPlay.current = false;
      fadeTo(0, 400, () => audio.pause());
      return;
    }

    wantsPlay.current = true;
    if (!audio.src && songRef.current?.url) {
      load(songRef.current, true);
      return;
    }
    void audio
      .play()
      .then(() => fadeTo(muted ? 0 : TARGET_VOLUME, 700))
      .catch(() => setNeedsGesture(true));
  }, [playing, fadeTo, muted, load]);

  const setMuted = useCallback(
    (next: boolean) => {
      setMutedState(next);
      fadeTo(next ? 0 : TARGET_VOLUME, 350);
    },
    [fadeTo],
  );

  const span = useMemo(() => {
    const song = current;
    if (!song) return null;
    const start = song.start_seconds ?? 0;
    if (song.end_seconds !== null && song.end_seconds > start) return song.end_seconds - start;
    if (duration !== null) return Math.max(0, duration - start);
    return null;
  }, [current, duration]);

  const value = useMemo<MusicApi>(
    () => ({
      current,
      playing,
      needsGesture,
      muted,
      position,
      span,
      setSong,
      restoreGlobal,
      toggle,
      setMuted,
      available: Boolean(current?.url),
    }),
    [current, playing, needsGesture, muted, position, span, setSong, restoreGlobal, toggle, setMuted],
  );

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}
