import React, { useEffect, useRef } from 'react';
import type { Player } from '../types';
import { useAudio } from '../hooks/useAudio';
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
  language: Language;
}

// ─── EXACT colors from demo file ───────────────────────────────────────────
const COLORS = ['#e91e8c','#ff6b35','#4caf50','#2196f3','#9c27b0','#00bcd4','#ffc107','#f44336'];

// ─── These are GLOBAL-style module-level refs (mirrors demo's global vars) ──
// We use a component-instance pattern via useRef to avoid global pollution

const GameWheel: React.FC<GameWheelProps> = (props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { playTick } = useAudio();

  // ── Mirrors demo's global vars ──────────────────────────────────────────
  const state = useRef({
    players:     props.players,
    phase:       props.phase,
    timer:       props.timer,
    roll:        props.roll,
    spinAngle:   0,          // demo: let spinAngle = 0
    spinning:    false,      // demo: let spinning = false
    spinRAF:     null as number | null,
    lastTick:    -1,
    onSpinComplete: props.onSpinComplete,
    language:    props.language,
  });

  // Keep state ref in sync with props
  state.current.players   = props.players;
  state.current.phase     = props.phase;
  state.current.timer     = props.timer;
  state.current.roll      = props.roll;
  state.current.onSpinComplete = props.onSpinComplete;
  state.current.language  = props.language;

  // ── EXACT drawWheel from demo ───────────────────────────────────────────
  function drawWheel() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const s = state.current;
    ctx.clearRect(0, 0, 320, 320);

    // demo: const cx=160,cy=160,r=158,inner=60;
    const cx = 160, cy = 160, r = 158, inner = 60;

    if (s.players.length === 0) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1f2e'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = '#2d3748'; ctx.lineWidth = 2; ctx.stroke();
      return;
    }

    // demo: const total = players.reduce((s,p)=>s+p.bet,0);
    const total = s.players.reduce((sum, p) => sum + p.bet, 0);

    // demo: let startAngle = spinAngle;
    let startAngle = s.spinAngle;

    s.players.forEach((p, i) => {
      // demo: const slice=(p.bet/total)*Math.PI*2;
      const slice = (p.bet / total) * Math.PI * 2;
      const end = startAngle + slice;

      // demo: ctx.beginPath();ctx.moveTo(cx,cy);
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, end); ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length]; ctx.fill();
      ctx.strokeStyle = '#0d1117'; ctx.lineWidth = 2; ctx.stroke();

      // demo: const mid=startAngle+slice/2;
      const mid = startAngle + slice / 2;
      // demo: const ar=r*0.72;
      const ar = r * 0.72;
      const ax = cx + Math.cos(mid) * ar;
      const ay = cy + Math.sin(mid) * ar;

      // Avatar initials circle
      ctx.save();
      ctx.beginPath(); ctx.arc(ax, ay, 16, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.beginPath(); ctx.arc(ax, ay, 16, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px -apple-system,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText((p.name || '?').slice(0, 2).toUpperCase(), ax, ay);
      ctx.restore();

      startAngle = end;
    });

    // Inner hub (dark circle) — demo: ctx.beginPath();ctx.arc(cx,cy,inner+4...
    ctx.beginPath(); ctx.arc(cx, cy, inner + 4, 0, Math.PI * 2);
    ctx.fillStyle = '#0d1117'; ctx.fill();
  }

  // ── EXACT ease function from demo ───────────────────────────────────────
  function ease(t: number) {
    // demo: function ease(t){return t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // ── EXACT startSpin from demo (adapted to use server roll) ──────────────
  function startSpin() {
    const s = state.current;
    if (s.spinRAF) cancelAnimationFrame(s.spinRAF);
    s.lastTick = -1;

    const total = s.players.reduce((sum, p) => sum + p.bet, 0);
    if (total === 0) return;

    // demo: const rand=Math.random()*total; — we use server roll instead
    const rand = s.roll * total;

    // demo: let acc=0; let winnerIdx=0; for(...)
    let acc = 0;
    let winnerIdx = 0;
    for (let i = 0; i < s.players.length; i++) {
      acc += s.players[i].bet;
      if (rand < acc) { winnerIdx = i; break; }
    }

    // demo: let sliceStart=0; for(let i=0;i<winnerIdx;i++) ...
    let sliceStart = 0;
    for (let i = 0; i < winnerIdx; i++) sliceStart += s.players[i].bet / total;
    const sliceMid   = sliceStart + s.players[winnerIdx].bet / total / 2;

    // demo: const targetAngle=(-Math.PI/2)-sliceMid*Math.PI*2;
    const targetAngle = (-Math.PI / 2) - sliceMid * Math.PI * 2;

    // demo: const totalRotation=Math.PI*2*6+targetAngle-spinAngle;
    const totalRotation = Math.PI * 2 * 6 + targetAngle - s.spinAngle;
    const startAngle    = s.spinAngle;

    // demo: let start=null; const dur=4500;
    let start: number | null = null;
    const dur = 4500;

    // demo: function frame(ts){...}
    function frame(ts: number) {
      if (!start) start = ts;
      // demo: const t=Math.min((ts-start)/dur,1);
      const t = Math.min((ts - start) / dur, 1);
      // demo: spinAngle=totalRotation*ease(t);
      s.spinAngle = startAngle + totalRotation * ease(t);
      drawWheel();

      if (t < 1) {
        s.spinRAF = requestAnimationFrame(frame);
      } else {
        // demo: showWinner(winnerIdx,total);
        s.spinning = false;
        s.onSpinComplete();
      }
    }

    // demo: spinRAF=requestAnimationFrame(frame);
    s.spinRAF = requestAnimationFrame(frame);
  }

  // ── Trigger spin on phase change ────────────────────────────────────────
  useEffect(() => {
    const s = state.current;

    if (props.phase === 'spinning' && !s.spinning) {
      s.spinning = true;
      startSpin();
    } else if (props.phase !== 'spinning') {
      // Not spinning — reset and redraw
      if (props.phase === 'waiting' || props.phase === 'betting') {
        // If coming back from spin, reset angle
        if (s.spinning) { s.spinning = false; s.spinAngle = 0; }
      }
      drawWheel();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.phase, props.roll]);

  // ── Redraw when players change (bet added) ──────────────────────────────
  useEffect(() => {
    if (props.phase !== 'spinning') {
      drawWheel();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.players]);

  // ── Initial draw on mount ───────────────────────────────────────────────
  useEffect(() => {
    drawWheel();
    return () => {
      if (state.current.spinRAF) cancelAnimationFrame(state.current.spinRAF);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer formatting
  const formatTime = (s: number) => {
    const v = Math.ceil(s);
    return `00:${v < 10 ? '0' : ''}${v}`;
  };

  const t = translations[props.language];

  return (
    <div className={`wheel-v5 wheel-phase-${props.phase}`}>
      <div className="wheel-outer-container">

        {/* Pointer — exact style from demo: border-top white triangle */}
        <div className="wheel-pointer" />

        <div className="wheel-svg-wrap">
          {/* Canvas — exact 320x320 from demo */}
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            className="wheel-canvas"
          />

          {/* Center label — mirrors demo's center-circle */}
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
