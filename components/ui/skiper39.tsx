"use client";

/**
 * Adapted from Skiper UI 39 by Gurvinder Singh (@gurvinder-singh02).
 * Inspired by https://codepen.io/zadvorsky/pen/xxwbBQV.
 * Illustration: Pablo Stanley, Open Peeps. See assets/hero/credits.txt.
 */
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface CrowdCanvasProps {
  src: string;
  /** The supplied sheet uses rows for horizontal cells and cols for vertical cells. */
  rows?: number;
  cols?: number;
  paused?: boolean;
}
interface Walker {
  cell: number;
  x: number;
  y: number;
  floor: number;
  direction: number;
  width: number;
  height: number;
  walk: gsap.core.Timeline;
}
export function CrowdCanvas({src, rows = 15, cols = 7, paused = false}: CrowdCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const syncRef = useRef<() => void>(() => {});
  useEffect(() => {
    pausedRef.current = paused;
    syncRef.current();
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || rows < 1 || cols < 1) return;
    const sheet = new Image();
    let walkers: Walker[] = [];
    let cellWidth = 0, cellHeight = 0;
    let width = 0, height = 0, ratio = 1;
    let onScreen = true, ticking = false, ready = false, disposed = false;

    function render() {
      if (!ctx || !ready) return;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);
      for (const w of walkers) {
        ctx.save();
        ctx.translate(w.x + (w.direction < 0 ? w.width : 0), w.y);
        ctx.scale(w.direction, 1);
        ctx.drawImage(sheet, (w.cell % rows) * cellWidth, Math.floor(w.cell / rows) * cellHeight,
          cellWidth, cellHeight, 0, 0, w.width, w.height);
        ctx.restore();
      }
    }
    function sync() {
      if (!ready || disposed) return;
      const active = onScreen && !document.hidden && !pausedRef.current;
      for (const w of walkers) w.walk.paused(!active);
      if (active && !ticking) gsap.ticker.add(render);
      if (!active && ticking) gsap.ticker.remove(render);
      ticking = active;
      render();
    }
    function resize() {
      if (!canvas || !ready || disposed) return;
      const w = canvas.clientWidth, h = canvas.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (!w || !h || (w === width && h === height && ratio === dpr)) return;
      width = w; height = h; ratio = dpr;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      walkers.forEach(person => person.walk.kill());
      walkers = [];
      const total = rows * cols;
      const cells = Array.from({length: total}, (_, i) => i);
      const count = Math.min(total, Math.max(6, Math.ceil(w / 58)));
      for (let i = 0; i < count; i++) {
        const scale = gsap.utils.random(.77, 1);
        const artHeight = h * .94 * scale;
        const artWidth = artHeight * cellWidth / cellHeight;
        const direction = Math.random() > .5 ? 1 : -1;
        const startX = direction > 0 ? -artWidth : w;
        const endX = direction > 0 ? w : -artWidth;
        const floor = h - (1 - scale) * h * .46;
        const y = floor - artHeight;
        const duration = (width + artWidth) / gsap.utils.random(22, 43);
        const person: Walker = {cell: cells.splice(Math.floor(Math.random() * cells.length), 1)[0],
          x: startX, y, floor, width: artWidth, height: artHeight, direction, walk: gsap.timeline({paused:true, repeat:-1})};
        const steps = Math.max(2, Math.round(duration / .32 / 2) * 2);
        person.walk.to(person, {x: endX, duration, ease: 'none'}, 0)
          .to(person, {y: y - 2.6 * scale, duration: duration / steps, yoyo:true, repeat:steps - 1, ease:'sine.inOut'}, 0);
        const slot = (i + Math.random() * .7) / count;
        person.walk.progress(direction > 0 ? slot : 1 - slot);
        walkers.push(person);
      }
      walkers.sort((a,b) => a.floor - b.floor);
      sync();
    }
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(canvas);
    const viewObserver = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; sync(); });
    viewObserver.observe(canvas);
    syncRef.current = sync;
    document.addEventListener('visibilitychange', sync);
    sheet.onload = () => {
      if (disposed) return;
      cellWidth = sheet.naturalWidth / rows;
      cellHeight = sheet.naturalHeight / cols;
      ready = true; resize();
    };
    sheet.src = src;
    return () => {
      disposed = true; sheet.onload = null; syncRef.current = () => {};
      document.removeEventListener('visibilitychange', sync);
      sizeObserver.disconnect(); viewObserver.disconnect();
      gsap.ticker.remove(render);
      walkers.forEach(w => w.walk.kill());
    };
  }, [src, rows, cols]);
  return <canvas aria-hidden="true" ref={canvasRef} className="block size-full pointer-events-none" />;
}
export function Skiper39({paused}: {paused?: boolean}) {
  return <CrowdCanvas src="./assets/hero/crowd.webp" paused={paused} />;
}
export default Skiper39;
