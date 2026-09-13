'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import type { SiteSettings } from '@/lib/types';
import { Monogram } from './Monogram';
import { useReducedMotion } from '@/lib/hooks/useDeviceTier';

/** The opening frame: their names, the title, and an invitation downward. */
export function Hero({ settings, memoryCount }: { settings: SiteSettings; memoryCount: number }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  // Gentle parallax — the title drifts up a little slower than the page.
  const y = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '22%']);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, reduced ? 1 : 0.15]);

  return (
    <header
      ref={ref}
      className="relative flex min-h-[88svh] flex-col items-center justify-center overflow-hidden px-5 pb-20 pt-24 text-center sm:min-h-[92svh]"
    >
      <motion.div style={{ y, opacity }} className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.15, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <Monogram initials={settings.initials} size="md" />
        </motion.div>

        {settings.hero_kicker && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="kicker mt-9 text-mauve-300"
          >
            {settings.hero_kicker}
          </motion.p>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
          className="display-xl mt-5 text-balance bg-gradient-to-b from-cream via-blush to-mauve-200 bg-clip-text text-transparent"
        >
          {settings.hero_title}
        </motion.h1>

        {settings.hero_subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.75, ease: [0.22, 0.61, 0.36, 1] }}
            className="mt-8 max-w-xl text-balance font-serif text-[1.02rem] leading-relaxed text-mauve-200 sm:text-lg"
          >
            {settings.hero_subtitle}
          </motion.p>
        )}

        <motion.a
          href="#story"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.95 }}
          className="btn-primary mt-11"
        >
          {settings.enter_label}
        </motion.a>

        {memoryCount > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.15 }}
            className="mt-7 font-sans text-[0.64rem] uppercase tracking-[0.24em] text-mauve-300/65"
          >
            {memoryCount} memories, tied together
          </motion.p>
        )}
      </motion.div>

      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.4 }}
        className="absolute bottom-7 left-1/2 -translate-x-1/2"
      >
        <span className="block h-12 w-px bg-gradient-to-b from-transparent via-champagne/40 to-transparent" />
      </motion.div>
    </header>
  );
}
