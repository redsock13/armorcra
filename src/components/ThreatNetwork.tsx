"use client";

import { useEffect, useRef } from "react";

export default function ThreatNetwork() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const mouse = { x: W / 2, y: H / 2 };
    const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener("mousemove", onMove);

    /* Nodes */
    const N = 70;
    type Node = { x: number; y: number; vx: number; vy: number; r: number; color: string; pulse: number };
    const nodes: Node[] = Array.from({ length: N }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2.5 + 1,
      color: Math.random() > 0.4 ? "#ef4444" : "#f97316",
      pulse: Math.random() * Math.PI * 2,
    }));

    let raf: number;
    let t = 0;

    const draw = () => {
      t += 0.01;
      ctx.clearRect(0, 0, W, H);

      /* Mouse influence */
      nodes.forEach(n => {
        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const d = Math.hypot(dx, dy);
        if (d < 200) {
          n.vx += dx / d * 0.015;
          n.vy += dy / d * 0.015;
        }
        n.vx *= 0.98;
        n.vy *= 0.98;
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });

      /* Lines */
      nodes.forEach((a, i) => {
        nodes.slice(i + 1).forEach(b => {
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 160) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(239,68,68,${0.15 * (1 - d / 160)})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        });
      });

      /* Nodes */
      nodes.forEach(n => {
        const glow = Math.sin(t * 1.5 + n.pulse) * 0.5 + 0.5;
        /* glow */
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 6);
        grad.addColorStop(0, n.color.replace(")", `,${0.3 * glow})`).replace("rgb", "rgba"));
        grad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 6, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        /* core */
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.globalAlpha = 0.7 + glow * 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      /* Central threat orb */
      const cx = W / 2, cy = H / 2;
      const orbR = 28 + Math.sin(t * 0.8) * 5;
      const orbGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbR * 3);
      orbGrad.addColorStop(0, "rgba(239,68,68,0.15)");
      orbGrad.addColorStop(0.5, "rgba(239,68,68,0.05)");
      orbGrad.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(cx, cy, orbR * 3, 0, Math.PI * 2);
      ctx.fillStyle = orbGrad;
      ctx.fill();

      /* Orbit ring */
      ctx.beginPath();
      ctx.arc(cx, cy, orbR * 1.8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(239,68,68,0.1)";
      ctx.lineWidth = 1;
      ctx.stroke();

      /* Pulsing dot center */
      const pulse = Math.abs(Math.sin(t * 1.2));
      ctx.beginPath();
      ctx.arc(cx, cy, orbR * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(239,68,68,${0.6 + pulse * 0.4})`;
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;

      /* Lines from center to nearest nodes */
      nodes.forEach(n => {
        const d = Math.hypot(n.x - cx, n.y - cy);
        if (d < 200) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(n.x, n.y);
          ctx.strokeStyle = `rgba(239,68,68,${0.08 * (1 - d / 200)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.7 }}
    />
  );
}
