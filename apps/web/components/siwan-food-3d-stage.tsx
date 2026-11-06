'use client';
import { LocalizedCopy } from '@/components/localized-copy';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';

type FoodStageItem = {
  name: string;
  category: string;
  image: string;
  imageAlt: string;
};

type PointerDrag = {
  pointerId: number;
  startX: number;
  startAngle: number;
};

function wrapIndex(value: number, length: number) {
  return ((value % length) + length) % length;
}

function activeIndexForAngle(angle: number, count: number) {
  const step = 360 / count;
  return wrapIndex(Math.round(-angle / step), count);
}

/**
 * A lightweight, touch-draggable CSS 3D food carousel. It uses the exact
 * illustrative image assigned to each food record; no third-party 3D runtime
 * or network-loaded model is required.
 */
export function SiwanFood3DStage({
  items,
  eyebrow = 'THE SIWAN FOOD ATLAS',
  title = 'Flavours in focus',
  ariaLabel = 'Interactive three-dimensional food showcase',
  variant = 'default',
}: {
  items: FoodStageItem[];
  eyebrow?: string;
  title?: string;
  ariaLabel?: string;
  variant?: 'default' | 'cinematic';
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const angleRef = useRef(0);
  const dragRef = useRef<PointerDrag | null>(null);
  const activeRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);

  const setAngle = useCallback((angle: number, updateSelection = true) => {
    angleRef.current = angle;
    stageRef.current?.style.setProperty('--food-rotation', `${angle}deg`);
    if (updateSelection && items.length > 0) {
      const next = activeIndexForAngle(angle, items.length);
      if (next !== activeRef.current) {
        activeRef.current = next;
        setActiveIndex(next);
      }
    }
  }, [items.length]);

  const goTo = useCallback((index: number) => {
    if (!items.length) return;
    const next = wrapIndex(index, items.length);
    activeRef.current = next;
    setActiveIndex(next);
    setAngle(-next * (360 / items.length), false);
  }, [items.length, setAngle]);

  useEffect(() => {
    if (items.length < 2) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let previous = 0;
    const tick = (now: number) => {
      if (previous === 0) previous = now;
      const elapsed = Math.min(now - previous, 40);
      previous = now;
      if (!preference.matches && !paused && !dragRef.current) {
        setAngle(angleRef.current - elapsed * 0.006);
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    const onPreferenceChange = () => {
      if (preference.matches) setPaused(true);
    };
    preference.addEventListener?.('change', onPreferenceChange);
    return () => {
      window.cancelAnimationFrame(frame);
      preference.removeEventListener?.('change', onPreferenceChange);
    };
  }, [items.length, paused, setAngle]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startAngle: angleRef.current };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setAngle(drag.startAngle + (event.clientX - drag.startX) * 0.42);
  };

  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(activeIndex + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(activeIndex - 1);
    } else if (event.key === ' ') {
      event.preventDefault();
      setPaused((value) => !value);
    }
  };

  if (!items.length) return null;
  const active = items[activeIndex] ?? items[0];
  const step = 360 / items.length;

  return (
    <LocalizedCopy>
    <section className={`siwan-food-3d-stage${variant === 'cinematic' ? ' siwan-food-3d-stage-cinematic' : ''}`} aria-label={ariaLabel}>
      <div className="siwan-food-3d-heading">
        <span>{eyebrow}</span>
        <strong>{title}</strong>
      </div>
      <div
        className={`siwan-food-3d-viewport${dragging ? ' is-dragging' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="group"
        aria-label={`Drag to rotate the food carousel. Use left and right arrow keys to select a food item. ${items.length} items available.`}
      >
        <div className="siwan-food-3d-halo" aria-hidden="true" />
        <div className="siwan-food-3d-plinth" aria-hidden="true" />
        <div ref={stageRef} className="siwan-food-3d-carousel" style={{ '--food-card-count': items.length } as CSSProperties}>
          {items.map((item, index) => (
            <button
              type="button"
              className={`siwan-food-3d-card${index === activeIndex ? ' is-active' : ''}`}
              key={item.name}
              style={{ '--food-angle': `${index * step}deg` } as CSSProperties}
              onClick={() => goTo(index)}
              aria-pressed={index === activeIndex}
              aria-label={`Show ${item.name}`}
            >
              <span className="siwan-food-3d-image">
                <Image src={item.image} alt={item.imageAlt} fill sizes="(max-width: 650px) 160px, 230px" priority={index === 0} />
              </span>
              <span className="siwan-food-3d-card-shade" aria-hidden="true" />
              <span className="siwan-food-3d-card-copy"><small>{item.category}</small><strong>{item.name}</strong></span>
            </button>
          ))}
        </div>
        <div className="siwan-food-3d-vignette" aria-hidden="true" />
      </div>
      <div className="siwan-food-3d-footer">
        <div className="siwan-food-3d-current" aria-live="polite" aria-atomic="true">
          <small>NOW IN VIEW</small>
          <strong>{active.name}</strong>
          <span>{active.category} · Illustrative food artwork</span>
        </div>
        <div className="siwan-food-3d-controls" aria-label="Food carousel controls">
          <button type="button" onClick={() => goTo(activeIndex - 1)} aria-label="Previous food">←</button>
          <button type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused}>{paused ? 'Resume rotation' : 'Pause rotation'}</button>
          <button type="button" onClick={() => goTo(activeIndex + 1)} aria-label="Next food">→</button>
        </div>
      </div>
      <div className="siwan-food-3d-hint">DRAG TO EXPLORE <span aria-hidden="true">✳</span> {items.length} FOOD ITEMS</div>
    </section>
  </LocalizedCopy>
  );
}
