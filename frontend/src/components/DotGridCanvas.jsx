import { useEffect, useMemo, useRef, useState } from "react";

const PRIMARY_RGB = { r: 55, g: 120, b: 255 }; // hsl(217, 84%, 55%) converted to RGB

export default function DotGridCanvas({ className = "" }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const hoverRef = useRef({ x: 0, y: 0, inside: false });
  const [size, setSize] = useState({ w: 0, h: 0 });

  const dots = useMemo(() => {
    const { w, h } = size;
    if (!w || !h) return [];

    const step = 8;
    const margin = 8;

    const list = [];
    for (let y = margin; y <= h - margin; y += step) {
      for (let x = margin; x <= w - margin; x += step) {
        list.push({
          x0: x,
          y0: y,
          phase: Math.random() * Math.PI * 2,
          speed: 0.7 + Math.random() * 0.9,
        });
      }
    }
    return list;
  }, [size.w, size.h]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const cr = entry.contentRect;
      setSize({ w: Math.floor(cr.width), h: Math.floor(cr.height) });
    });

    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.width = Math.max(1, size.w * dpr);
    canvas.height = Math.max(1, size.h * dpr);
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const start = performance.now();

    const render = (now) => {
      const t = now - start;
      ctx.clearRect(0, 0, size.w, size.h);

      const hover = hoverRef.current;
      const hx = hover.x;
      const hy = hover.y;

      for (const d of dots) {
        const baseDrift = 1.25;
        let x = d.x0 + Math.sin(t * 0.0012 * d.speed + d.phase) * baseDrift;
        let y = d.y0 + Math.cos(t * 0.0011 * d.speed + d.phase) * baseDrift;

        let alpha = 0.85;
        const r = 1.2;

        if (hover.inside) {
          const dx = d.x0 - hx;
          const dy = d.y0 - hy;
          const dist = Math.hypot(dx, dy);

          const decay = Math.exp(-dist / 230);
          const ripple = Math.sin(dist * 0.16 - t * 0.006) * decay;

          const push = ripple * 10;
          const ang = Math.atan2(dy, dx);

          x += Math.cos(ang) * push;
          y += Math.sin(ang) * push;

          alpha = 0.45 + 0.55 * decay;
        }

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgb(${PRIMARY_RGB.r}, ${PRIMARY_RGB.g}, ${PRIMARY_RGB.b})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    // Window-based hover detection (works even with pointerEvents: "none")
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      hoverRef.current = { x, y, inside };
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [size.w, size.h, dots]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ pointerEvents: "none" }}
    />
  );
}