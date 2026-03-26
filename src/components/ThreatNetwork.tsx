"use client";

import { useEffect, useRef } from "react";

interface Node3D {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  r: number; pulse: number; type: "normal" | "threat" | "core";
}

export default function ThreatNetwork() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    window.addEventListener("resize", () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });

    const mouse = { x: W / 2, y: H / 2 };
    window.addEventListener("mousemove", e => { mouse.x = e.clientX; mouse.y = e.clientY; });

    // Camera / rotation state
    const cam = { rotX: 0.3, rotY: 0, targetX: 0.3, targetY: 0 };

    // 3D nodes distributed in a sphere
    const N = 80;
    const nodes: Node3D[] = Array.from({ length: N }, (_, i) => {
      const type: Node3D["type"] = i === 0 ? "core" : i < 8 ? "threat" : "normal";
      const r = type === "core" ? 0 : type === "threat" ? 180 + Math.random() * 80 : 260 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      return {
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        vx: (Math.random() - .5) * .25,
        vy: (Math.random() - .5) * .25,
        vz: (Math.random() - .5) * .25,
        r: type === "core" ? 12 : type === "threat" ? 3.5 + Math.random() * 2 : 1.5 + Math.random() * 1.5,
        pulse: Math.random() * Math.PI * 2,
        type,
      };
    });

    // Project 3D → 2D with perspective
    const project = (x: number, y: number, z: number, rX: number, rY: number) => {
      // Rotate Y
      const cosY = Math.cos(rY), sinY = Math.sin(rY);
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;
      // Rotate X
      const cosX = Math.cos(rX), sinX = Math.sin(rX);
      const y1 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;
      // Perspective
      const fov = 700;
      const depth = fov / (fov + z2 + 400);
      return { sx: W / 2 + x1 * depth, sy: H / 2 + y1 * depth, depth, z: z2 };
    };

    let raf: number, t = 0;

    const draw = () => {
      t += 0.012;

      // Update camera rotation based on mouse
      cam.targetY = ((mouse.x / W) - 0.5) * 1.2;
      cam.targetX = 0.3 + ((mouse.y / H) - 0.5) * 0.5;
      cam.rotY += (cam.targetY - cam.rotY) * 0.03;
      cam.rotX += (cam.targetX - cam.rotX) * 0.03;

      // Auto-rotate slowly
      cam.rotY += 0.003;

      ctx.clearRect(0, 0, W, H);

      // Update node positions
      nodes.forEach(n => {
        if (n.type === "core") return;
        n.x += n.vx; n.y += n.vy; n.z += n.vz;
        n.vx *= 0.998; n.vy *= 0.998; n.vz *= 0.998;
        const d = Math.hypot(n.x, n.y, n.z);
        const maxR = n.type === "threat" ? 280 : 400;
        if (d > maxR) { n.vx -= n.x * 0.001; n.vy -= n.y * 0.001; n.vz -= n.z * 0.001; }
      });

      // Project all nodes
      const projected = nodes.map(n => ({ ...project(n.x, n.y, n.z, cam.rotX, cam.rotY), node: n }));
      const sorted = [...projected].sort((a, b) => a.z - b.z);

      // Draw connections
      sorted.forEach((a, i) => {
        sorted.slice(i + 1).forEach(b => {
          const dist = Math.hypot(a.node.x - b.node.x, a.node.y - b.node.y, a.node.z - b.node.z);
          const limit = a.node.type === "core" || b.node.type === "core" ? 350 :
                        a.node.type === "threat" || b.node.type === "threat" ? 200 : 160;
          if (dist > limit) return;
          const opacity = (1 - dist / limit) * 0.18 * Math.min(a.depth, b.depth) * 2;
          const color = (a.node.type === "threat" || b.node.type === "threat") ? `rgba(239,68,68,${opacity})` : `rgba(100,116,139,${opacity * 0.5})`;
          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy);
          ctx.lineTo(b.sx, b.sy);
          ctx.strokeStyle = color;
          ctx.lineWidth = a.node.type === "core" || b.node.type === "core" ? 0.8 : 0.4;
          ctx.stroke();
        });
      });

      // Draw nodes
      sorted.forEach(({ sx, sy, depth, node }) => {
        const pulse = Math.sin(t * 1.4 + node.pulse) * 0.5 + 0.5;
        const r = node.r * depth * 1.8;

        if (node.type === "core") {
          // Pulsing red orb
          const g1 = ctx.createRadialGradient(sx, sy, 0, sx, sy, 70 * depth);
          g1.addColorStop(0, `rgba(239,68,68,${0.15 + pulse * 0.08})`);
          g1.addColorStop(1, "transparent");
          ctx.beginPath(); ctx.arc(sx, sy, 70 * depth, 0, Math.PI * 2); ctx.fillStyle = g1; ctx.fill();

          // Core glow
          const g2 = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 2.5);
          g2.addColorStop(0, "#ef4444"); g2.addColorStop(0.5, "rgba(239,68,68,0.6)"); g2.addColorStop(1, "transparent");
          ctx.beginPath(); ctx.arc(sx, sy, r * 2.5, 0, Math.PI * 2); ctx.fillStyle = g2; ctx.fill();

          ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.fillStyle = "#fff"; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;

          // Orbit ring
          ctx.beginPath(); ctx.arc(sx, sy, 30 * depth, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(239,68,68,${0.3 + pulse * 0.15})`; ctx.lineWidth = 0.8; ctx.stroke();
          return;
        }

        const color = node.type === "threat" ? "#ef4444" : "#64748b";
        const glowColor = node.type === "threat" ? `rgba(239,68,68,${0.3 * depth})` : `rgba(100,116,139,${0.15 * depth})`;

        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 4);
        glow.addColorStop(0, glowColor); glow.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(sx, sy, r * 4, 0, Math.PI * 2); ctx.fillStyle = glow; ctx.fill();

        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.globalAlpha = 0.5 + depth * 0.4; ctx.fill(); ctx.globalAlpha = 1;

        if (node.type === "threat" && pulse > 0.7) {
          ctx.beginPath(); ctx.arc(sx, sy, r * (1.5 + pulse), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(239,68,68,${(pulse - 0.7) * 0.5 * depth})`; ctx.lineWidth = 0.6; ctx.stroke();
        }
      });

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(raf); };
  }, []);

  return (
    <canvas ref={ref} style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }} />
  );
}
