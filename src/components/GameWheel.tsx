import React, { useEffect, useRef } from 'react';
import type { Player } from '../types';
import { translations } from '../i18n/translations';
import type { Language } from '../i18n/translations';
import './GameWheel.css';

interface GameWheelProps {
  players: Player[];
  phase: string;
  timer: number;
  roll: number;
  bettingDuration?: number;
  onSpinComplete: () => void;
  playTick: () => void;
  language: Language;
}

// EXACT colors from demo
const COLORS = ['#e91e8c','#ff6b35','#4caf50','#2196f3','#9c27b0','#00bcd4','#ffc107','#f44336'];

const GameWheel: React.FC<GameWheelProps> = (props) => {
  const canvasRef  = useRef<HTMLCanvasElement>(null);

  // Exact mirrors of demo globals
  const spinAngle  = useRef(0);            // demo: let spinAngle=0
  const spinRAF    = useRef<number|null>(null); // demo: let spinRAF=null
  const spinning   = useRef(false);        // demo: let spinning=false
  const imgCache   = useRef<Record<string,HTMLImageElement>>({});

  // Live refs — updated every render, no stale closures
  const playersRef = useRef<Player[]>(props.players);
  const rollRef    = useRef(props.roll);
  const onDoneRef  = useRef(props.onSpinComplete);
  const onTickRef  = useRef(props.playTick);
  
  playersRef.current = props.players;
  rollRef.current    = props.roll;
  onDoneRef.current  = props.onSpinComplete;
  onTickRef.current  = props.playTick;

  /* ─────────────────────────────────────────────────────────────────────────
     drawWheel — IDENTICAL to demo's drawWheel(), canvas 320×320
     ───────────────────────────────────────────────────────────────────────── */
  function drawWheel() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 320, 320);
    const cx = 160, cy = 160, r = 158, inner = 60; // exact from demo

    const pts = playersRef.current;
    if (pts.length === 0) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1f2e'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = '#2d3748'; ctx.lineWidth = 2; ctx.stroke();
      return;
    }

    const total = pts.reduce((s, p) => s + p.bet, 0);
    let startAngle = spinAngle.current;  // demo: let startAngle=spinAngle

    pts.forEach((p, i) => {
      const slice = (p.bet / total) * Math.PI * 2; // demo: const slice=...
      const end   = startAngle + slice;

      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, end); ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length]; ctx.fill();
      ctx.strokeStyle = '#0d1117'; ctx.lineWidth = 2; ctx.stroke();

      // avatar — demo uses SVG data-URL, we use preloaded Img
      const mid = startAngle + slice / 2;       // demo: const mid=...
      const ar  = r * 0.72;                     // demo: const ar=r*0.72
      const ax  = cx + Math.cos(mid) * ar;
      const ay  = cy + Math.sin(mid) * ar;

      let img = imgCache.current[p.avatar || ''];
      if (!img && p.avatar) {
        img = new window.Image();
        img.src = p.avatar;
        img.onload = drawWheel;
        imgCache.current[p.avatar] = img;
      }

      ctx.save();
      ctx.beginPath(); ctx.arc(ax, ay, 16, 0, Math.PI * 2); ctx.clip();
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, ax - 16, ay - 16, 32, 32);
      } else {
        ctx.fillStyle = COLORS[i % COLORS.length]; ctx.fill();
      }
      ctx.restore();

      ctx.beginPath(); ctx.arc(ax, ay, 16, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; ctx.stroke();

      startAngle = end;
    });

    // inner dark hub  — demo: ctx.beginPath();ctx.arc(cx,cy,inner+4,...
    ctx.beginPath(); ctx.arc(cx, cy, inner + 4, 0, Math.PI * 2);
    ctx.fillStyle = '#0d1117'; ctx.fill();
  }

  /* ─────────────────────────────────────────────────────────────────────────
     ease — IDENTICAL to demo
     demo: function ease(t){return t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
     ───────────────────────────────────────────────────────────────────────── */
  function ease(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     startSpin — IDENTICAL to demo's startSpin(), just server roll → rand
     ───────────────────────────────────────────────────────────────────────── */
  function startSpin() {
    if (spinRAF.current) cancelAnimationFrame(spinRAF.current);

    const pts   = playersRef.current;
    const total = pts.reduce((s, p) => s + p.bet, 0);
    if (!total || pts.length === 0) return;

    // demo uses Math.random()*total; we use server roll * total
    const rand = rollRef.current * total;

    // demo: let acc=0; let winnerIdx=0; for(...)
    let acc = 0, winnerIdx = 0;
    for (let i = 0; i < pts.length; i++) {
      acc += pts[i].bet;
      if (rand < acc) { winnerIdx = i; break; }
    }

    // demo: let sliceStart=0; for(let i=0;i<winnerIdx;i++)...
    let sliceStart = 0;
    for (let i = 0; i < winnerIdx; i++) sliceStart += pts[i].bet / total;

    // demo: const sliceMid=sliceStart+players[winnerIdx].bet/total/2;
    const sliceMid = sliceStart + pts[winnerIdx].bet / total / 2;

    // demo: const targetAngle=(-Math.PI/2)-sliceMid*Math.PI*2;
    const targetAngle = (-Math.PI / 2) - sliceMid * Math.PI * 2;

    // demo resets spinAngle to 0 in resetGame() before each new spin
    spinAngle.current = 0;

    // demo: const totalRotation=Math.PI*2*6+targetAngle-spinAngle; (spinAngle=0)
    const totalRotation = Math.PI * 2 * 10 + targetAngle; // 10 rotations for 12s

    let start: number | null = null;
    const dur = 12000; // 12 seconds
    let lastTickAngle = 0;

    function frame(ts: number) {
      if (!start) start = ts;
      const t = Math.min((ts - start) / dur, 1);
      
      spinAngle.current = totalRotation * ease(t); 
      
      // TICK SOUND LOGIC
      const currentAngle = spinAngle.current;
      const angleDiff = currentAngle - lastTickAngle;
      if (angleDiff > 0.4) { // Increased threshold to avoid annoying frequent ticks
        onTickRef.current();
        lastTickAngle = currentAngle;
      }

      drawWheel();
      if (t < 1) {
        spinRAF.current = requestAnimationFrame(frame);
      } else {
        spinning.current = false;
        onDoneRef.current();
      }
    }

    // demo: spinRAF=requestAnimationFrame(frame);
    spinRAF.current = requestAnimationFrame(frame);
  }

  /* ── React bridge: trigger spin / redraw on prop changes ─────────────────── */
  useEffect(() => {
    if (props.phase === 'spinning' && !spinning.current) {
      spinning.current = true;
      startSpin();
    } else if (props.phase !== 'spinning') {
      if (props.phase === 'waiting') spinAngle.current = 0; // reset like demo
      if (!spinning.current) drawWheel();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.phase, props.roll]);

  useEffect(() => {
    if (!spinning.current) drawWheel();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.players]);

  useEffect(() => {
    drawWheel();
    return () => { if (spinRAF.current) cancelAnimationFrame(spinRAF.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── JSX ─────────────────────────────────────────────────────────────────── */
  const t = translations[props.language];
  const formatTime = (s: number) => {
    const v = Math.ceil(s);
    return `00:${v < 10 ? '0' : ''}${v}`;
  };

  return (
    <div className={`wheel-v5 wheel-phase-${props.phase}`}>
      <div className="wheel-outer-container">
        {/* white triangle pointer — exact from demo */}
        <div className="wheel-pointer" />
        <div className="wheel-svg-wrap">
          {/* 320×320 canvas — exact from demo */}
          <canvas ref={canvasRef} width={320} height={320} className="wheel-canvas" />
          <div className="wheel-hub">
            {props.phase === 'spinning' ? (
              <span className="hub-spin">{t.spinning}</span>
            ) : props.phase === 'waiting' ? (
              <span className="hub-waiting">
                {props.language === 'ru' ? 'ИЩЕМ ИГРОКОВ' : 'FINDING PLAYERS'}
              </span>
            ) : (
              <span className="hub-timer">{formatTime(props.timer)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameWheel;
