'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { StoryEvent } from '@/lib/types';
import { moodTheme } from '@/lib/moods';
import { cn, formatEventDate } from '@/lib/utils';
import { deleteEvent, reorderEvents, setPublished } from '@/lib/admin/actions';

/**
 * The memory list: drag to change the order the story is told in, flip a
 * switch to show or hide one, and nothing else competing for attention.
 */
export function MemoryManager({ events }: { events: StoryEvent[] }) {
  const [items, setItems] = useState(events);
  const [saving, startSaving] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => setItems(events), [events]);

  const sensors = useSensors(
    // A small distance keeps a tap on the card from being read as a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = useMemo(() => items.map((item) => item.id), [items]);

  const onDragEnd = (dragEvent: DragEndEvent) => {
    const { active, over } = dragEvent;
    if (!over || active.id === over.id) return;

    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    const next = arrayMove(items, from, to);
    setItems(next);

    startSaving(async () => {
      const result = await reorderEvents(next.map((item) => item.id));
      setNotice(result.ok ? 'New order saved.' : (result.message ?? 'Could not save the order.'));
    });
  };

  const move = (index: number, direction: -1 | 1) => {
    const to = index + direction;
    if (to < 0 || to >= items.length) return;
    const next = arrayMove(items, index, to);
    setItems(next);
    startSaving(async () => {
      const result = await reorderEvents(next.map((item) => item.id));
      setNotice(result.ok ? 'New order saved.' : (result.message ?? 'Could not save the order.'));
    });
  };

  if (items.length === 0) {
    return (
      <div className="frost rounded-2xl p-10 text-center">
        <p className="font-display text-2xl font-light text-cream">Nothing here yet.</p>
        <p className="mx-auto mt-3 max-w-sm font-serif leading-relaxed text-mauve-200">
          Add your first memory and the thread starts itself.
        </p>
        <Link href="/admin/memories/new" className="btn-primary mt-7">
          Add the first memory
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="font-sans text-xs leading-relaxed text-mauve-300">
          Drag a memory by its handle to change where it sits in the story. Or use the arrows.
        </p>
        <span
          aria-live="polite"
          className={cn(
            'font-sans text-xs transition-opacity',
            notice || saving ? 'opacity-100' : 'opacity-0',
          )}
        >
          {saving ? 'Saving…' : notice}
        </span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ol className="space-y-3">
            {items.map((event, index) => (
              <MemoryRow
                key={event.id}
                event={event}
                position={index + 1}
                total={items.length}
                onMove={(direction) => move(index, direction)}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function MemoryRow({
  event,
  position,
  total,
  onMove,
}: {
  event: StoryEvent;
  position: number;
  total: number;
  onMove: (direction: -1 | 1) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: event.id,
  });
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const theme = moodTheme(event.mood);
  const cover = event.media.find((m) => m.kind === 'photo') ?? event.media[0];

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'frost relative flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl p-3 sm:flex-nowrap sm:gap-4 sm:p-4',
        isDragging && 'z-10 opacity-90 shadow-keepsake-lift',
        pending && 'opacity-60',
      )}
    >
      <button
        type="button"
        aria-label={`Reorder ${event.title}`}
        className="flex h-11 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-mauve-300 transition-colors hover:text-cream active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <circle cx="9" cy="6" r="1.6" />
          <circle cx="15" cy="6" r="1.6" />
          <circle cx="9" cy="12" r="1.6" />
          <circle cx="15" cy="12" r="1.6" />
          <circle cx="9" cy="18" r="1.6" />
          <circle cx="15" cy="18" r="1.6" />
        </svg>
      </button>

      <span className="w-6 shrink-0 text-center font-display text-sm text-mauve-400">
        {position}
      </span>

      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-plum-800 sm:h-16 sm:w-16">
        {cover?.kind === 'photo' ? (
          <Image
            src={cover.url}
            alt=""
            fill
            sizes="64px"
            className="warm-grade object-cover"
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center text-lg"
            style={{ color: theme.accent }}
            aria-hidden="true"
          >
            {cover ? '▶' : '✎'}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1 basis-[45%]">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate font-display text-base font-light text-cream sm:text-lg">
            {event.title}
          </h2>
          {event.is_milestone && (
            <span className="font-sans text-[0.58rem] uppercase tracking-[0.18em] text-champagne-deep">
              ✦
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate font-sans text-xs text-mauve-300">
          {formatEventDate(event.event_date, event.date_label) || 'No date'}
          {event.chapter ? ` · ${event.chapter}` : ''}
          {event.media.length > 0 ? ` · ${event.media.length} item${event.media.length > 1 ? 's' : ''}` : ''}
          {event.reaction_k || event.reaction_r
            ? ` · ${event.reaction_k ?? ''}${event.reaction_r ?? ''}`
            : ''}
        </p>
      </div>

      <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
        <div className="hidden flex-col sm:flex">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={position === 1}
            aria-label={`Move ${event.title} earlier`}
            className="px-1.5 text-mauve-300 transition-colors hover:text-cream disabled:opacity-25"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={position === total}
            aria-label={`Move ${event.title} later`}
            className="px-1.5 text-mauve-300 transition-colors hover:text-cream disabled:opacity-25"
          >
            ▼
          </button>
        </div>

        <button
          type="button"
          onClick={() =>
            startTransition(async () => {
              await setPublished(event.id, !event.is_published);
            })
          }
          aria-pressed={event.is_published}
          className="chip"
          data-active={event.is_published}
        >
          {event.is_published ? 'Showing' : 'Hidden'}
        </button>

        <Link href={`/admin/memories/${event.id}`} className="chip">
          Edit
        </Link>

        {confirming ? (
          <span className="flex items-center gap-1.5">
            <button
              type="button"
              className="chip !border-rose-400/40 !text-rose-200"
              onClick={() =>
                startTransition(async () => {
                  await deleteEvent(event.id);
                })
              }
            >
              Delete for good
            </button>
            <button type="button" className="chip" onClick={() => setConfirming(false)}>
              Keep
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={`Delete ${event.title}`}
            className="chip !px-2.5 text-mauve-400 hover:!text-rose-200"
          >
            ✕
          </button>
        )}
      </div>
    </li>
  );
}
