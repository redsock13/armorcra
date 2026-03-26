"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Network() {
  const groupRef = useRef<THREE.Group>(null!);
  const mouse = useRef({ x: 0, y: 0 });

  const { nodePositions, linePositions, nodeColors } = useMemo(() => {
    const N = 60;
    const nodes: [number, number, number][] = [];
    const cols: number[] = [];

    for (let i = 0; i < N; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.8 + Math.random() * 1.4;
      nodes.push([
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      ]);
      // color: red or orange based on risk
      const t = Math.random();
      cols.push(t, t < 0.5 ? 0.2 : 0.45, 0.05); // RGB
    }

    // Connect nearby nodes
    const lines: number[] = [];
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = nodes[i][0] - nodes[j][0];
        const dy = nodes[i][1] - nodes[j][1];
        const dz = nodes[i][2] - nodes[j][2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < 1.6) {
          lines.push(...nodes[i], ...nodes[j]);
        }
      }
    }

    const nodePos = new Float32Array(nodes.flat());
    const linePos = new Float32Array(lines);
    const nodeCol = new Float32Array(cols);

    return { nodePositions: nodePos, linePositions: linePos, nodeColors: nodeCol };
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, []);

  const targetRot = useRef({ x: 0, y: 0 });

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    targetRot.current.x += (mouse.current.y * 0.3 - targetRot.current.x) * 0.03;
    targetRot.current.y += (mouse.current.x * 0.3 - targetRot.current.y) * 0.03;
    groupRef.current.rotation.y = t * 0.05 + targetRot.current.y;
    groupRef.current.rotation.x = targetRot.current.x * 0.5;
  });

  const nodeGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(nodeColors, 3));
    return g;
  }, [nodePositions, nodeColors]);

  const lineGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    return g;
  }, [linePositions]);

  return (
    <group ref={groupRef}>
      {/* Network lines */}
      <lineSegments geometry={lineGeom}>
        <lineBasicMaterial color="#ef4444" transparent opacity={0.12} />
      </lineSegments>

      {/* Nodes */}
      <points geometry={nodeGeom}>
        <pointsMaterial size={0.08} vertexColors transparent opacity={0.9} sizeAttenuation />
      </points>

      {/* Central sphere — "the threat" */}
      <mesh>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.15} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.08} wireframe />
      </mesh>
    </group>
  );
}

function Particles() {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const N = 800;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.getElapsedTime() * 0.01;
  });

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial size={0.015} color="#ef4444" transparent opacity={0.2} sizeAttenuation />
    </points>
  );
}

export default function ThreatNetwork() {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 55 }} style={{ background: "transparent" }} dpr={[1, 2]}>
        <Network />
        <Particles />
      </Canvas>
    </div>
  );
}
