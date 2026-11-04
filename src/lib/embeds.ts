export interface EmbedInfo {
  provider: 'youtube' | 'vimeo' | 'unknown';
  /** iframe src, already privacy-friendly where the provider offers it. */
  src: string | null;
  /** Thumbnail we can show before the iframe is mounted. */
  poster: string | null;
  title: string;
}

/**
 * Turns whatever link the owner pasted — a share URL, a watch URL, a short
 * link — into something embeddable. Unknown providers fall back to a plain
 * outbound link rather than an iframe we cannot vouch for.
 */
export function parseEmbed(rawUrl: string): EmbedInfo {
  const url = rawUrl.trim();
  if (!url) return { provider: 'unknown', src: null, poster: null, title: 'Video' };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { provider: 'unknown', src: null, poster: null, title: 'Video' };
  }

  const host = parsed.hostname.replace(/^www\./, '');

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    const id = parsed.searchParams.get('v') ?? parsed.pathname.split('/').filter(Boolean).pop();
    if (id && /^[\w-]{6,}$/.test(id)) return youtube(id, parsed);
  }
  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1);
    if (id && /^[\w-]{6,}$/.test(id)) return youtube(id, parsed);
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = parsed.pathname.split('/').filter((p) => /^\d+$/.test(p))[0];
    if (id) {
      return {
        provider: 'vimeo',
        src: `https://player.vimeo.com/video/${id}?dnt=1`,
        poster: null,
        title: 'Vimeo video',
      };
    }
  }

  return { provider: 'unknown', src: null, poster: null, title: 'Video' };
}

function youtube(id: string, parsed: URL): EmbedInfo {
  const start = parsed.searchParams.get('t') ?? parsed.searchParams.get('start');
  const seconds = start ? parseTimeToken(start) : null;
  const params = new URLSearchParams({ rel: '0', modestbranding: '1' });
  if (seconds) params.set('start', String(seconds));

  return {
    provider: 'youtube',
    src: `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`,
    poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    title: 'YouTube video',
  };
}

/** "90", "1m30s", "1h2m3s" -> seconds */
function parseTimeToken(token: string): number | null {
  if (/^\d+$/.test(token)) return Number(token);
  const match = token.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!match) return null;
  const [, h, m, s] = match;
  const total = Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0);
  return total > 0 ? total : null;
}

export function isLikelyAudioUrl(url: string): boolean {
  return /\.(mp3|m4a|aac|ogg|oga|wav|flac|opus|weba)(\?|#|$)/i.test(url);
}
