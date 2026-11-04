'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { MediaItem } from '@/lib/types';
import { parseEmbed } from '@/lib/embeds';
import { cn } from '@/lib/utils';

interface MediaFrameProps {
  item: MediaItem;
  priority?: boolean;
  sizes?: string;
  className?: string;
  /** Detail view allows heavier players; cards stay as still frames. */
  interactive?: boolean;
  rounded?: string;
}

/** A single photo, video or linked clip, framed as a mounted print. */
export function MediaFrame({
  item,
  priority = false,
  sizes = '(max-width: 768px) 100vw, 640px',
  className,
  interactive = false,
  rounded = 'rounded-lg',
}: MediaFrameProps) {
  if (item.kind === 'photo') {
    return (
      <div className={cn('matte', rounded, className)}>
        <Image
          src={item.url}
          alt={item.caption ?? ''}
          fill
          sizes={sizes}
          priority={priority}
          className="warm-grade object-cover"
        />
      </div>
    );
  }

  if (item.kind === 'video') {
    return (
      <div className={cn('matte', rounded, className)}>
        {interactive ? (
          <video
            src={item.url}
            poster={item.poster_url ?? undefined}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
        ) : (
          <VideoStill item={item} sizes={sizes} />
        )}
      </div>
    );
  }

  return <EmbedFrame item={item} interactive={interactive} className={cn(rounded, className)} />;
}

function VideoStill({ item, sizes }: { item: MediaItem; sizes: string }) {
  return (
    <>
      {item.poster_url ? (
        <Image
          src={item.poster_url}
          alt={item.caption ?? ''}
          fill
          sizes={sizes}
          className="warm-grade object-cover"
        />
      ) : (
        <video
          src={item.url}
          preload="metadata"
          muted
          playsInline
          className="h-full w-full object-cover"
        />
      )}
      <PlayGlyph />
    </>
  );
}

function EmbedFrame({
  item,
  interactive,
  className,
}: {
  item: MediaItem;
  interactive: boolean;
  className?: string;
}) {
  const [active, setActive] = useState(false);
  const embed = parseEmbed(item.url);

  if (!embed.src) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'matte flex items-center justify-center bg-plum-800/70 p-6 text-center font-sans text-xs tracking-[0.14em] text-mauve-200 underline decoration-champagne/40 underline-offset-4',
          className,
        )}
      >
        Watch this one elsewhere ↗
      </a>
    );
  }

  if (!interactive || !active) {
    return (
      <button
        type="button"
        onClick={() => interactive && setActive(true)}
        disabled={!interactive}
        aria-label={interactive ? `Play ${embed.title}` : embed.title}
        className={cn('matte group block w-full', className)}
      >
        {embed.poster ? (
          <Image
            src={embed.poster}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            className="warm-grade object-cover"
          />
        ) : (
          <span className="absolute inset-0 bg-gradient-to-br from-plum-700 to-wine-900" />
        )}
        <PlayGlyph />
      </button>
    );
  }

  return (
    <div className={cn('matte', className)}>
      <iframe
        src={`${embed.src}${embed.src.includes('?') ? '&' : '?'}autoplay=1`}
        title={embed.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}

function PlayGlyph() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-champagne/40 bg-midnight-900/45 backdrop-blur-sm transition-transform duration-500 ease-silk group-hover:scale-110">
        <svg viewBox="0 0 24 24" className="ml-1 h-5 w-5 fill-champagne-light">
          <path d="M7 4.5v15l13-7.5z" />
        </svg>
      </span>
    </span>
  );
}
