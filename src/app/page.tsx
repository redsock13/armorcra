"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";

gsap.registerPlugin(ScrollTrigger);

const ThreatNetwork = dynamic(() => import("@/components/ThreatNetwork"), { ssr: false });

/* ── SCRAMBLE ── */
const CHARS = "0123456789ABCDEF!@#$%&*<>[]{}";
function scramble(el: HTMLElement, target: string, ms = 1000) {
  const frames = Math.round(ms / 30);
  let f = 0;
  const run = () => {
    el.textContent = target.split("").map((c, i) =>
      c === " " ? " " : f / frames > i / target.length ? c : CHARS[Math.floor(Math.random() * CHARS.length)]
    ).join("");
    if (f++ < frames) requestAnimationFrame(run);
    else el.textContent = target;
  };
  run();
}

/* ── SCORE CIRCLE ── */
function ScoreCircle({ score }: { score: number }) {
  const r = 70;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score < 40 ? "#ef4444" : score < 70 ? "#f97316" : "#22c55e";

  return (
    <div style={{ position: "relative", width: 180, height: 180, margin: "0 auto" }}>
      <svg viewBox="0 0 180 180" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
        <circle cx="90" cy="90" r={r} fill="none" stroke="rgba(239,68,68,0.1)" strokeWidth="10" />
        <circle cx="90" cy="90" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 2s ease-out", filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 44, fontWeight: 900, color, letterSpacing: "-2px", fontFamily: "monospace" }}>{score}</div>
        <div style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>/100</div>
      </div>
      <div style={{ position: "absolute", top: -8, right: -8, background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 800, padding: "4px 8px", borderRadius: 99, fontFamily: "monospace", letterSpacing: 1, boxShadow: "0 0 14px rgba(239,68,68,0.5)" }}
        className="pulse-red">CRITICAL</div>
    </div>
  );
}

/* ── TERMINAL LINE ── */
function TermLine({ text, delay, color = "#64748b" }: { text: string; delay: number; color?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div ref={ref} style={{ fontFamily: "monospace", fontSize: 13, color, opacity: visible ? 1 : 0, transition: "opacity 0.3s", display: "flex", gap: 8, alignItems: "center" }}>
      <span style={{ color: "#ef4444" }}>{">"}</span>
      {text}
      {visible && text.includes("...") && <span className="blink" style={{ color: "#ef4444" }}>█</span>}
    </div>
  );
}

/* ── DATA ── */
const VULNS = [
  { article: "FTC Act §5", label: "Vulnerability Disclosure Policy", status: "critical", detail: "Missing or unpublished — FTC Act violation" },
  { article: "SOC2 CC7.2", label: "Security Update Management", status: "critical", detail: "No documented update process detected" },
  { article: "NIST CSF PR.PT", label: "SSL/TLS Certificate", status: "warning", detail: "TLS 1.1 detected — weak configuration" },
  { article: "FTC Act §5", label: "Security Technical Documentation", status: "critical", detail: "No public documentation available" },
  { article: "CCPA §1798.150", label: "Privacy Policy", status: "warning", detail: "Missing CCPA disclosure — right to opt-out not implemented" },
  { article: "SOC2 CC6.1", label: "Authentication & Access Control", status: "critical", detail: "No 2FA detected on admin interface" },
];

const SCAN_LINES = [
  { text: "Initializing CCPA/SOC2 compliance scanner...", delay: 200, color: "#64748b" },
  { text: "DNS resolution + exposed port scan...", delay: 700, color: "#64748b" },
  { text: "Checking SSL/TLS certificates...", delay: 1200, color: "#64748b" },
  { text: "Checking disclosure policy...", delay: 1800, color: "#f97316" },
  { text: "ALERT — CCPA §1798.100 non-compliant", delay: 2400, color: "#ef4444" },
  { text: "Analyzing CCPA/SOC2/FTC compliance checks...", delay: 2900, color: "#64748b" },
  { text: "CRITICAL — 4 major violations detected", delay: 3500, color: "#ef4444" },
  { text: "Calculating financial risk score...", delay: 4100, color: "#64748b" },
  { text: "Report generated ✓", delay: 4600, color: "#22c55e" },
];

const CLIENTS = ["Coalition", "At-Bay", "Cowbell", "Resilience", "Chubb", "AIG", "Corvus", "Beazley"];

/* ────────── PAGE ────────── */
export default function Home() {
  const [company, setCompany] = useState("");
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"form" | "scanning" | "result">("form");
  const [animScore, setAnimScore] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);

  /* Cursor */
  useEffect(() => {
    const dot = document.getElementById("cur");
    const ring = document.getElementById("cur-ring");
    if (!dot || !ring) return;
    const fn = (e: MouseEvent) => {
      gsap.to(dot, { x: e.clientX, y: e.clientY, duration: 0.04 });
      gsap.to(ring, { x: e.clientX, y: e.clientY, duration: 0.14 });
    };
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, []);

  /* Hero GSAP */
  useEffect(() => {
    if (state !== "form") return;
    const ctx = gsap.context(() => {
      gsap.set([".h-nav", ".h-badge", ".h-t1", ".h-t2", ".h-sub", ".h-stats", ".h-form"], { opacity: 0 });
      gsap.set([".h-t1", ".h-t2"], { y: 40 });
      gsap.set([".h-badge", ".h-sub", ".h-stats", ".h-form"], { y: 24 });

      const tl = gsap.timeline({ delay: 0.1 });
      tl.to(".h-nav", { opacity: 1, duration: 0.5 })
        .to(".h-badge", { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, "-=0.2")
        .to(".h-t1", { opacity: 1, y: 0, duration: 0.9, ease: "power4.out" }, "-=0.3")
        .to(".h-t2", { opacity: 1, y: 0, duration: 0.9, ease: "power4.out" }, "-=0.6")
        .to(".h-sub", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=0.4")
        .to(".h-stats", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=0.4")
        .to(".h-form", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=0.3");

      setTimeout(() => {
        const el = document.getElementById("sc-title");
        if (el) scramble(el, "CYBER RESILIENCE ACT", 1200);
      }, 600);

      gsap.utils.toArray<HTMLElement>(".sr").forEach(el => {
        gsap.set(el, { opacity: 0, y: 40 });
        gsap.to(el, {
          opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 82%", once: true },
        });
      });
    }, mainRef);
    return () => ctx.revert();
  }, [state]);

  /* Score animation */
  useEffect(() => {
    if (state === "result") {
      let v = 0;
      const iv = setInterval(() => {
        v += 1;
        setAnimScore(v);
        if (v >= 28) clearInterval(iv);
      }, 40);
    }
  }, [state]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setState("scanning");
    setTimeout(() => setState("result"), 5200);
  };

  const RED = { background: "linear-gradient(135deg,#ef4444,#dc2626)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" as const };

  return (
    <>
      <div id="cur" />
      <div id="cur-ring" />
      <div className="scanline" />

      <div ref={mainRef} style={{ minHeight: "100vh", background: "#030308" }}>

        {/* ── NAV ── */}
        <nav className="h-nav" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 clamp(20px,4vw,48px)", height: 60, background: "rgba(3,3,8,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(239,68,68,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#ef4444,#dc2626)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 0 16px rgba(239,68,68,0.4)" }}>🛡️</div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px", fontFamily: "monospace" }}>Armor<span style={{ color: "#ef4444" }}>CRA</span></span>
          </div>
          <div style={{ display: "flex", gap: 28, fontSize: 13, color: "#475569", fontFamily: "monospace" }}>
            {["How it works", "Compliance checks", "Partners"].map((n, i) => (
              <a key={i} href="#" style={{ color: "inherit", textDecoration: "none" }}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = "#ef4444")}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = "#475569")}>
                {n}
              </a>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#ef4444", fontFamily: "monospace", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 99, padding: "5px 14px", letterSpacing: 1 }}>
            ● LIVE — ENFORCEMENT ACTIVE
          </div>
        </nav>

        {/* ════════ STATE 1 — FORM ════════ */}
        {state === "form" && (
          <>
            {/* HERO */}
            <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "90px 24px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <ThreatNetwork />

              {/* Radial glow */}
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

              <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>

                <div className="h-badge" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 99, padding: "7px 18px", fontSize: 12, color: "#ef4444", marginBottom: 36, fontFamily: "monospace", letterSpacing: 1 }}
                  onClick={() => {}}>
                  <span style={{ width: 6, height: 6, background: "#ef4444", borderRadius: "50%", boxShadow: "0 0 8px #ef4444", display: "inline-block" }} className="pulse-red" />
                  ⚠️ FINES UP TO $7,500 PER RECORD · CCPA ENFORCEMENT NOW ACTIVE
                </div>

                <div style={{ maxWidth: 860, marginBottom: 20 }}>
                  <div className="h-t1" style={{ fontSize: "clamp(14px,1.5vw,18px)", fontFamily: "monospace", color: "#475569", letterSpacing: 3, marginBottom: 12, textTransform: "uppercase" }}>
                    <span id="sc-title">· · · · · · · · · · · ·</span>
                  </div>
                  <h1 className="h-t2" style={{ fontSize: "clamp(44px,7vw,86px)", fontWeight: 900, letterSpacing: "-2.5px", lineHeight: 1.0, marginBottom: 0 }}>
                    Is your business<br />CCPA compliant?<br />
                    <span style={{ ...RED, backgroundSize: "200% auto", animation: "shimmer 4s linear infinite" }}>Score in 60s.</span>
                  </h1>
                </div>

                <p className="h-sub" style={{ fontSize: "clamp(15px,1.8vw,18px)", color: "#64748b", maxWidth: 520, lineHeight: 1.7, marginBottom: 44 }}>
                  CCPA, SOC2, and FTC regulations impose strict obligations on US businesses. Check your exposure in 60 seconds.
                </p>

                {/* Stats */}
                <div className="h-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 44, maxWidth: 560, width: "100%" }}>
                  {[
                    { v: "89%", l: "US businesses at risk", c: "#ef4444" },
                    { v: "$7,500", l: "per record", c: "#f97316" },
                    { v: "Now", l: "enforcement active", c: "#eab308" },
                  ].map((s, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: s.c, letterSpacing: "-0.5px", fontFamily: "monospace" }}>{s.v}</div>
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 4, fontFamily: "monospace" }}>{s.l}</div>
                    </div>
                  ))}
                </div>

                {/* Form */}
                <div className="h-form" style={{ width: "100%", maxWidth: 520 }}>
                  <div style={{ padding: 2, borderRadius: 20, background: "linear-gradient(135deg,#ef4444,#dc2626,#b91c1c,#ef4444)", backgroundSize: "300%", animation: "gb 4s ease infinite" }}>
                    <form onSubmit={handleSubmit} style={{ background: "#0a0a12", borderRadius: 18, padding: "36px 32px" }}>
                      <div style={{ fontFamily: "monospace", fontSize: 12, color: "#ef4444", marginBottom: 20, letterSpacing: 2 }}>// GET MY COMPLIANCE SCORE — FREE</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {[
                          { ph: "Company name (e.g. Acme Corp)", val: company, set: setCompany, type: "text" },
                          { ph: "Website URL (e.g. https://acmecorp.com)", val: url, set: setUrl, type: "url" },
                          { ph: "Work email", val: email, set: setEmail, type: "email" },
                        ].map((f, i) => (
                          <input key={i} type={f.type} placeholder={f.ph} value={f.val}
                            onChange={e => f.set(e.target.value)} required
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "13px 16px", color: "#f1f5f9", fontSize: 14, outline: "none", fontFamily: "inherit", width: "100%" }}
                            onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "rgba(239,68,68,0.4)"; }}
                            onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
                          />
                        ))}
                      </div>
                      <button type="submit" style={{ width: "100%", marginTop: 20, background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", fontWeight: 800, padding: "15px", borderRadius: 12, border: "none", cursor: "none", fontSize: 15, fontFamily: "inherit", boxShadow: "0 8px 28px rgba(239,68,68,0.35)", letterSpacing: 0.5 }}>
                        🔍 Scan my compliance — Free
                      </button>
                      <p style={{ fontSize: 12, color: "#334155", marginTop: 12, fontFamily: "monospace", textAlign: "center" }}>60s scan · No commitment · Confidential</p>
                    </form>
                  </div>
                </div>
              </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section style={{ padding: "80px 24px" }}>
              <div style={{ maxWidth: 820, margin: "0 auto" }}>
                <div className="sr" style={{ marginBottom: 56 }}>
                  <div style={{ display: "inline-block", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 99, padding: "5px 16px", fontSize: 12, color: "#ef4444", fontFamily: "monospace", letterSpacing: 1, marginBottom: 16 }}>// HOW IT WORKS</div>
                  <h2 style={{ fontSize: "clamp(28px,4.5vw,52px)", fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1.08 }}>
                    60 seconds.<br /><span style={RED}>Zero hidden risk.</span>
                  </h2>
                </div>
                {[
                  { n: "01", i: "🔍", t: "Automated scan", d: "Enter your company URL. Our engine analyzes your public exposure in real time — ports, SSL, policies, documentation." },
                  { n: "02", i: "📊", t: "CCPA Compliance Score", d: "You get a score out of 100 with violations found, evidence detected, and estimated financial risk based on your revenue." },
                  { n: "03", i: "🛡️", t: "Remediation Plan", d: "Our certified compliance expert reaches out within 24h with a personalized action plan. Your cyber insurance stays valid." },
                ].map((s, i) => (
                  <div key={i} className="sr" style={{ display: "grid", gridTemplateColumns: "64px 1fr", gap: 24, padding: "32px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none", alignItems: "flex-start" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{s.i}</div>
                    <div>
                      <div style={{ fontSize: 10, color: "#ef4444", fontFamily: "monospace", letterSpacing: 2, marginBottom: 7 }}>STEP {s.n}</div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{s.t}</h3>
                      <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.65, maxWidth: 500 }}>{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── ARTICLES CRA ── */}
            <section style={{ padding: "60px 24px 80px", background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ maxWidth: 820, margin: "0 auto" }}>
                <div className="sr" style={{ marginBottom: 48 }}>
                  <div style={{ display: "inline-block", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 99, padding: "5px 16px", fontSize: 12, color: "#ef4444", fontFamily: "monospace", letterSpacing: 1, marginBottom: 16 }}>// WHAT WE CHECK</div>
                  <h2 style={{ fontSize: "clamp(28px,4.5vw,52px)", fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1.08 }}>6 compliance checks.<br /><span style={RED}>Zero tolerance.</span></h2>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
                  {VULNS.map((v, i) => (
                    <div key={i} className="sr" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${v.status === "critical" ? "rgba(239,68,68,0.12)" : "rgba(234,179,8,0.12)"}`, borderRadius: 16, padding: "22px 20px", transition: "background .2s", cursor: "none" }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = v.status === "critical" ? "rgba(239,68,68,0.05)" : "rgba(234,179,8,0.05)")}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)")}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontSize: 14 }}>{v.status === "critical" ? "🔴" : "🟡"}</span>
                        <span style={{ fontFamily: "monospace", fontSize: 10, color: "#475569", background: "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: 4 }}>{v.article}</span>
                      </div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: v.status === "critical" ? "#fca5a5" : "#fde68a" }}>{v.label}</h4>
                      <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>{v.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── PARTNERS MARQUEE ── */}
            <div style={{ padding: "24px 0", overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontSize: 11, color: "#334155", fontFamily: "monospace", textAlign: "center", marginBottom: 16, letterSpacing: 2 }}>INSURANCE PARTNERS & BROKERS</div>
              <div className="mq">
                {[...CLIENTS, ...CLIENTS].map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, paddingRight: 48, whiteSpace: "nowrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#334155", fontFamily: "monospace" }}>{c}</span>
                    <span style={{ color: "#1e293b", fontSize: 8 }}>◆</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── CTA PARTENAIRES ── */}
            <section style={{ padding: "80px 24px 100px", textAlign: "center" }}>
              <div style={{ maxWidth: 580, margin: "0 auto" }}>
                <div className="sr">
                  <div style={{ display: "inline-block", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 99, padding: "5px 16px", fontSize: 12, color: "#ef4444", fontFamily: "monospace", letterSpacing: 1, marginBottom: 20 }}>// REFERRAL PARTNERSHIP</div>
                  <h2 style={{ fontSize: "clamp(28px,4.5vw,52px)", fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1.08, marginBottom: 16 }}>
                    Become a referral<br /><span style={RED}>partner. Earn 15%.</span>
                  </h2>
                  <p style={{ color: "#64748b", fontSize: 17, lineHeight: 1.65, marginBottom: 36 }}>
                    Every client you refer = 10-15% commission. Zero operational overhead for you.
                  </p>
                  <a href="mailto:contact.zmimax@gmail.com" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", padding: "15px 36px", borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: "none", boxShadow: "0 8px 28px rgba(239,68,68,0.35)", fontFamily: "inherit" }}>
                    🤝 Become a partner →
                  </a>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ════════ STATE 2 — SCANNING ════════ */}
        {state === "scanning" && (
          <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px", position: "relative", overflow: "hidden" }}>
            <ThreatNetwork />
            <div style={{ position: "relative", zIndex: 1, maxWidth: 560, width: "100%" }}>
              <div style={{ background: "rgba(10,10,18,0.95)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 18, padding: "36px 32px", backdropFilter: "blur(20px)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, fontFamily: "monospace" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 10px #ef4444" }} className="pulse-red" />
                  <span style={{ fontSize: 12, color: "#ef4444", letterSpacing: 2 }}>SCANNING — {company.toUpperCase() || "YOUR COMPANY"}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {SCAN_LINES.map((l, i) => <TermLine key={i} {...l} />)}
                </div>
                <div style={{ marginTop: 24, height: 3, background: "rgba(239,68,68,0.1)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "linear-gradient(90deg,#ef4444,#f97316)", borderRadius: 99, animation: "none", width: "0%", transition: "width 4.8s linear" }}
                    ref={el => { if (el) setTimeout(() => el.style.width = "100%", 100); }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════ STATE 3 — RESULT ════════ */}
        {state === "result" && (
          <div style={{ padding: "100px 24px 80px" }}>
            <div style={{ maxWidth: 760, margin: "0 auto" }}>

              {/* Header result */}
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 99, padding: "7px 18px", fontSize: 12, color: "#ef4444", fontFamily: "monospace", letterSpacing: 1, marginBottom: 24 }}>
                  <span style={{ width: 6, height: 6, background: "#ef4444", borderRadius: "50%", boxShadow: "0 0 8px #ef4444", display: "inline-block" }} />
                  COMPLIANCE REPORT — {company.toUpperCase() || "YOUR COMPANY"}
                </div>
                <h1 style={{ fontSize: "clamp(32px,5vw,60px)", fontWeight: 900, letterSpacing: "-2px", lineHeight: 1.05, marginBottom: 8 }}>
                  Score: <span style={RED}>Critical.</span>
                </h1>
                <p style={{ color: "#64748b", fontSize: 16 }}>4 major violations detected · Immediate action required</p>
              </div>

              {/* Score + risk */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 20, padding: "32px 24px", textAlign: "center" }}>
                  <ScoreCircle score={animScore} />
                  <div style={{ marginTop: 20, fontFamily: "monospace", fontSize: 12, color: "#475569" }}>COMPLIANCE SCORE</div>
                </div>
                <div style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 20, padding: "32px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontSize: 12, fontFamily: "monospace", color: "#ef4444", letterSpacing: 1, marginBottom: 12 }}>💸 ESTIMATED FINANCIAL RISK</div>
                  <div style={{ fontSize: "clamp(24px,4vw,38px)", fontWeight: 900, color: "#ef4444", letterSpacing: "-1px", lineHeight: 1.1, marginBottom: 12 }}>$250K<br />— $4.5M</div>
                  <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>Calculated on estimated revenue $1M-$10M. CCPA allows up to <strong style={{ color: "#f1f5f9" }}>$7,500 per intentional violation</strong> — no cap.</p>
                </div>
              </div>

              {/* Vulnerabilities */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: "28px", marginBottom: 16 }}>
                <div style={{ fontFamily: "monospace", fontSize: 12, color: "#ef4444", letterSpacing: 1, marginBottom: 20 }}>🔴 4 CRITICAL · 🟡 2 WARNING</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {VULNS.map((v, i) => (
                    <div key={i} style={{ display: "flex", gap: 14, padding: "16px 0", borderBottom: i < VULNS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", alignItems: "flex-start" }}>
                      <span style={{ fontSize: 14, flexShrink: 0, marginTop: 2 }}>{v.status === "critical" ? "🔴" : "🟡"}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5 }}>
                          <span style={{ fontFamily: "monospace", fontSize: 10, color: "#475569", background: "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: 4 }}>{v.article}</span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: v.status === "critical" ? "#fca5a5" : "#fde68a" }}>{v.label}</span>
                        </div>
                        <p style={{ fontSize: 12, color: "#475569" }}>{v.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bars */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: "28px", marginBottom: 24 }}>
                <div style={{ fontFamily: "monospace", fontSize: 12, color: "#ef4444", letterSpacing: 1, marginBottom: 20 }}>📊 SECURITY DEBT</div>
                {[
                  { l: "Documentation compliance", v: 15, c: "#ef4444" },
                  { l: "Infrastructure security", v: 35, c: "#f97316" },
                  { l: "Vulnerability management", v: 20, c: "#ef4444" },
                  { l: "Update policy", v: 10, c: "#dc2626" },
                ].map((b, i) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 7 }}>
                      <span style={{ color: "#64748b" }}>{b.l}</span>
                      <span style={{ color: b.c, fontWeight: 700, fontFamily: "monospace" }}>{b.v}%</span>
                    </div>
                    <div style={{ height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: b.c, borderRadius: 99, width: `${b.v}%`, boxShadow: `0 0 8px ${b.c}` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div style={{ padding: 2, borderRadius: 20, background: "linear-gradient(135deg,#ef4444,#dc2626,#b91c1c,#ef4444)", backgroundSize: "300%", animation: "gb 4s ease infinite" }}>
                <div style={{ background: "#0a0a12", borderRadius: 18, padding: "36px 32px", textAlign: "center" }}>
                  <h3 style={{ fontSize: "clamp(20px,3vw,28px)", fontWeight: 800, marginBottom: 12, letterSpacing: "-0.5px" }}>
                    Download your remediation plan
                  </h3>
                  <p style={{ color: "#64748b", fontSize: 15, marginBottom: 28, maxWidth: 460, margin: "0 auto 28px" }}>
                    Our certified compliance expert reaches out within 24h with a personalized action plan. Your cyber insurance stays valid.
                  </p>
                  <a href="mailto:contact.zmimax@gmail.com" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", padding: "15px 36px", borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: "none", boxShadow: "0 8px 28px rgba(239,68,68,0.4)", fontFamily: "inherit" }}>
                    🛡️ Talk to a certified compliance expert →
                  </a>
                  <p style={{ fontSize: 11, color: "#334155", marginTop: 14, fontFamily: "monospace" }}>Free 30-min consultation · Quote within 24h · Certified expert</p>
                </div>
              </div>

              <p style={{ fontSize: 11, color: "#1e293b", textAlign: "center", marginTop: 24, fontFamily: "monospace" }}>
                Report based on passive analysis of publicly available information. Preliminary assessment only — not a full audit. ArmorCRA by Safwane.
              </p>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer style={{ padding: "24px clamp(20px,4vw,48px)", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, background: "rgba(0,0,0,0.4)" }}>
          <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 16 }}>Armor<span style={{ color: "#ef4444" }}>CRA</span></span>
          <span style={{ fontSize: 12, color: "#334155", fontFamily: "monospace" }}>© 2026 ArmorCRA</span>
          <a href="mailto:contact.zmimax@gmail.com" style={{ fontSize: 12, color: "#334155", textDecoration: "none", fontFamily: "monospace" }}>contact.zmimax@gmail.com</a>
        </footer>

      </div>
    </>
  );
}
