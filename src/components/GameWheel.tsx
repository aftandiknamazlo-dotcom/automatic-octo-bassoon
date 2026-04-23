import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { Player } from '../types';
import { translations } from '../i18n/translations';
import type { Language } from '../i18n/translations';
import './GameWheel.css';

interface GameWheelProps {
  players: Player[];
  rolling: boolean;
  roll: number;
  timer: number;
  phase: string;
  onSpinComplete: () => void;
  playTick?: () => void;
  language: Language;
}

/* ── Color palette with gradient pairs (Premium Neon) ── */
const SEGMENT_COLORS: [string, string][] = [
  ['#FF3B8E', '#D61B6D'], // Pink Neon
  ['#0099FF', '#0066CC'], // Electric Blue
  ['#FFD700', '#FF8C00'], // Golden Glow
  ['#00FFD1', '#00A88A'], // Mint Crystal
  ['#FF5E3A', '#D13415'], // Sunset Orange
  ['#AD00FF', '#7A00B3'], // Cyber Purple
  ['#8FFF00', '#6BB300'], // Radioactive Green
  ['#00E5FF', '#0097A7'], // Cyan Blast
  ['#FF0000', '#B30000'], // Blood Red
  ['#FF00FF', '#B300B3'], // Magenta Edge
];

/* ── Avatar image cache ── */
const avatarCache = new Map<string, HTMLImageElement>();

function loadImage(src: string): Promise<HTMLImageElement> {
  if (avatarCache.has(src)) {
    return Promise.resolve(avatarCache.get(src)!);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      avatarCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => {
      // Return a blank image on error — fallback will draw initials
      resolve(img);
    };
    img.src = src;
  });
}

/* ── Smooth animated values hook ── */
function useAnimatedValues(targetValues: number[], duration: number = 500) {
  const [animatedValues, setAnimatedValues] = useState<number[]>(targetValues);
  const animationRef = useRef<number | null>(null);
  const startValuesRef = useRef<number[]>(targetValues);
  const startTimeRef = useRef<number>(0);
  const prevTargetRef = useRef<string>('');

  useEffect(() => {
    const key = targetValues.join(',');
    if (key === prevTargetRef.current) return;
    prevTargetRef.current = key;

    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    startValuesRef.current = [...animatedValues];
    startTimeRef.current = performance.now();

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Quintic ease-out for ultra-smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 5);

      const newValues = targetValues.map((target, index) => {
        const start = startValuesRef.current[index] ?? 0;
        return start + (target - start) * eased;
      });

      setAnimatedValues(newValues);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetValues, duration]);

  return animatedValues;
}

/* ── Helper: draw initials text ── */
function drawInitials(
  ctx: CanvasRenderingContext2D,
  name: string,
  cx: number,
  cy: number,
  radius: number
) {
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();

  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = `bold ${Math.max(10, radius * 0.65)}px "Inter", "SF Pro", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 3;
  ctx.fillText(initials, cx, cy);
  ctx.restore();
}

const GameWheel: React.FC<GameWheelProps> = ({
  players,
  rolling,
  roll,
  timer,
  phase,
  onSpinComplete,
  playTick,
  language,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const rotationRef = useRef(0);
  const lastTickSegRef = useRef(-1);
  const avatarImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const t = translations[language];

  // Use higher-res canvas for retina
  const CANVAS_SIZE = 640;

  const sortedPlayers = useMemo(
    () =>
      [...players].sort((left, right) =>
        String(left.id).localeCompare(String(right.id), undefined, { numeric: true })
      ),
    [players]
  );

  /* ── Preload avatars ── */
  useEffect(() => {
    const loadAll = async () => {
      const newMap = new Map<string, HTMLImageElement>();
      for (const player of sortedPlayers) {
        if (player.avatar) {
          try {
            const img = await loadImage(player.avatar);
            if (img.naturalWidth > 0) {
              newMap.set(player.id, img);
            }
          } catch {
            // skip
          }
        }
      }
      avatarImagesRef.current = newMap;
      // Trigger a redraw after images load
      drawWheel(rotationRef.current, animatedSegmentAngles);
    };
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedPlayers]);

  // Segment angles
  const segmentAngles = useMemo(() => {
    if (sortedPlayers.length === 0) return [];
    const total = sortedPlayers.reduce((sum, p) => sum + p.bet, 0);
    if (total === 0) return new Array(sortedPlayers.length).fill(0);
    return sortedPlayers.map((p) => (p.bet / total) * Math.PI * 2);
  }, [sortedPlayers]);

  const animatedSegmentAngles = useAnimatedValues(segmentAngles, 600);

  /* ── Main draw function ── */
  const drawWheel = useCallback(
    (rotation: number, animAngles?: number[]) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const s = CANVAS_SIZE;
      const center = s / 2;
      const radius = s / 2 - 10;

      ctx.clearRect(0, 0, s, s);

      /* ── Empty state ── */
      if (sortedPlayers.length === 0) {
        // Draw dark circle with subtle pattern
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        const emptyGrad = ctx.createRadialGradient(center, center, 0, center, center, radius);
        emptyGrad.addColorStop(0, '#1e2235');
        emptyGrad.addColorStop(1, '#0f1119');
        ctx.fillStyle = emptyGrad;
        ctx.fill();

        // Inner ring
        ctx.beginPath();
        ctx.arc(center, center, radius - 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.stroke();
        return;
      }

      const total = sortedPlayers.reduce((sum, p) => sum + p.bet, 0);
      let startAngle = rotation - Math.PI / 2;

      /* ── Draw segments ── */
      sortedPlayers.forEach((player, index) => {
        const angle =
          animAngles && animAngles[index] !== undefined
            ? animAngles[index]
            : (player.bet / total) * Math.PI * 2;

        if (angle <= 0) return;

        const endAngle = startAngle + angle;
        const [colorStart, colorEnd] = SEGMENT_COLORS[index % SEGMENT_COLORS.length];

        // Create gradient along the segment
        const midAngle = startAngle + angle / 2;
        const gx1 = center + Math.cos(startAngle) * radius * 0.5;
        const gy1 = center + Math.sin(startAngle) * radius * 0.5;
        const gx2 = center + Math.cos(endAngle) * radius * 0.5;
        const gy2 = center + Math.sin(endAngle) * radius * 0.5;

        const gradient = ctx.createLinearGradient(gx1, gy1, gx2, gy2);
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);

        // Draw segment
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Subtle inner shadow on segment
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.clip();

        // Inner glow edge
        const innerGrad = ctx.createRadialGradient(center, center, radius * 0.7, center, center, radius);
        innerGrad.addColorStop(0, 'transparent');
        innerGrad.addColorStop(1, 'rgba(0,0,0,0.25)');
        ctx.fillStyle = innerGrad;
        ctx.fill();
        ctx.restore();

        // Separator line between segments
        if (sortedPlayers.length > 1) {
          ctx.beginPath();
          ctx.moveTo(center, center);
          ctx.lineTo(center + Math.cos(startAngle) * radius, center + Math.sin(startAngle) * radius);
          ctx.strokeStyle = 'rgba(0,0,0,0.4)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        /* ── Draw avatar inside segment ── */
        const percentage = player.bet / total;
        // Avatar size proportional to percentage: min 18px, max 56px (in canvas coords)
        const minAvatarR = 22;
        const maxAvatarR = 60;
        const avatarR = Math.max(minAvatarR, Math.min(maxAvatarR, percentage * 180));

        // Position avatar in the middle of the segment arc
        const avatarDist = radius * 0.55;
        const avatarX = center + Math.cos(midAngle) * avatarDist;
        const avatarY = center + Math.sin(midAngle) * avatarDist;

        const avatarImg = avatarImagesRef.current.get(player.id);

        ctx.save();
        // Clip to circle for avatar
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
        ctx.closePath();

        // Avatar border glow
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 8;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.clip();

        if (avatarImg && avatarImg.naturalWidth > 0) {
          ctx.drawImage(
            avatarImg,
            avatarX - avatarR,
            avatarY - avatarR,
            avatarR * 2,
            avatarR * 2
          );
        } else {
          // Draw gradient circle with initials
          const fallbackGrad = ctx.createLinearGradient(
            avatarX - avatarR,
            avatarY - avatarR,
            avatarX + avatarR,
            avatarY + avatarR
          );
          fallbackGrad.addColorStop(0, colorStart);
          fallbackGrad.addColorStop(1, colorEnd);
          ctx.fillStyle = fallbackGrad;
          ctx.fillRect(avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
          drawInitials(ctx, player.name, avatarX, avatarY, avatarR);
        }

        ctx.restore();

        // Avatar border ring
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarR + 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        /* ── Percentage text below avatar ── */
        if (angle > 0.25) {
          // Only show text if segment is big enough
          const textDist = radius * 0.82;
          const textX = center + Math.cos(midAngle) * textDist;
          const textY = center + Math.sin(midAngle) * textDist;

          ctx.save();
          ctx.fillStyle = 'rgba(255,255,255,0.95)';
          ctx.font = `bold ${Math.max(12, avatarR * 0.45)}px "Inter", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0,0,0,0.7)';
          ctx.shadowBlur = 4;
          ctx.fillText(`${(percentage * 100).toFixed(1)}%`, textX, textY);
          ctx.restore();
        }

        startAngle = endAngle;
      });

      /* ── Center hub ── */
      const hubR = radius * 0.18;

      // Hub shadow
      ctx.beginPath();
      ctx.arc(center, center, hubR + 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fill();

      // Hub gradient
      ctx.beginPath();
      ctx.arc(center, center, hubR, 0, Math.PI * 2);
      const hubGrad = ctx.createRadialGradient(
        center - hubR * 0.3,
        center - hubR * 0.3,
        0,
        center,
        center,
        hubR
      );
      hubGrad.addColorStop(0, '#2a2d3e');
      hubGrad.addColorStop(1, '#0c0d16');
      ctx.fillStyle = hubGrad;
      ctx.fill();

      // Hub ring
      ctx.beginPath();
      ctx.arc(center, center, hubR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    [sortedPlayers, CANVAS_SIZE]
  );

  /* ── Redraw on segment change ── */
  useEffect(() => {
    drawWheel(rotationRef.current, animatedSegmentAngles);
  }, [drawWheel, animatedSegmentAngles]);

  /* ── Spin animation ── */
  useEffect(() => {
    if (!rolling) {
      if (phase === 'waiting') {
        rotationRef.current = 0;
        lastTickSegRef.current = -1;
      }
      drawWheel(rotationRef.current, animatedSegmentAngles);
      return;
    }

    const total = sortedPlayers.reduce((sum, p) => sum + p.bet, 0);
    if (total === 0) return;

    // Find winner index from roll
    let cumulative = 0;
    let winnerIndex = sortedPlayers.length - 1;
    const weightedRoll = roll * total;
    for (let i = 0; i < sortedPlayers.length; i++) {
      cumulative += sortedPlayers[i].bet;
      if (weightedRoll <= cumulative) {
        winnerIndex = i;
        break;
      }
    }

    // Calculate target angle
    let sliceStart = 0;
    for (let i = 0; i < winnerIndex; i++) {
      sliceStart += sortedPlayers[i].bet / total;
    }
    const sliceMid = sliceStart + sortedPlayers[winnerIndex].bet / total / 2;
    const fullRotations = Math.PI * 2 * 12; // 12 full rotations for drama
    const targetRotation = fullRotations + Math.PI * 2 * (1 - sliceMid);
    const startRotation = rotationRef.current;
    const startedAt = performance.now();
    const spinDuration = 8000; // 8 seconds

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startedAt;
      const progress = Math.min(elapsed / spinDuration, 1);

      // Custom easing: fast start, dramatic slowdown
      let eased: number;
      if (progress < 0.7) {
        // Fast phase
        const p = progress / 0.7;
        eased = 0.85 * (1 - Math.pow(1 - p, 3));
      } else {
        // Slow dramatic phase
        const p = (progress - 0.7) / 0.3;
        eased = 0.85 + 0.15 * (1 - Math.pow(1 - p, 5));
      }

      rotationRef.current = startRotation + (targetRotation - startRotation) * eased;
      drawWheel(rotationRef.current, animatedSegmentAngles);

      // Tick sound when crossing REAL segment boundaries
      if (playTick && sortedPlayers.length > 1) {
        const total = sortedPlayers.reduce((sum, p) => sum + p.bet, 0);
        const currentAngle = (rotationRef.current + Math.PI / 2) % (Math.PI * 2);
        
        let cumulativeAngle = 0;
        let currentSegIndex = 0;
        for (let i = 0; i < sortedPlayers.length; i++) {
          const angle = (sortedPlayers[i].bet / total) * Math.PI * 2;
          cumulativeAngle += angle;
          if (currentAngle < cumulativeAngle) {
            currentSegIndex = i;
            break;
          }
        }

        if (currentSegIndex !== lastTickSegRef.current) {
          lastTickSegRef.current = currentSegIndex;
          playTick();
        }
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
        onSpinComplete();
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [rolling, sortedPlayers, roll, phase, onSpinComplete, drawWheel, playTick, animatedSegmentAngles]);

  // Clean up avatar refs when phase resets to waiting
  useEffect(() => {
    if (phase === 'waiting') {
      avatarImagesRef.current.clear();
    }
  }, [phase]);

  return (
    <div className={`wheel-v5 wheel-phase-${phase}`}>
      <div className="wheel-outer-container">
        <div className="wheel-pointer" />
        <div className={`wheel-svg-wrap${sortedPlayers.length > 0 ? ' has-bets' : ''}${rolling ? ' is-spinning' : ''}`}>
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="wheel-canvas"
          />
          <div className="wheel-hub">
            {rolling ? (
              <span className="hub-spin">{t.spinning}</span>
            ) : phase === 'waiting' ? (
              <span className="hub-waiting">
                {language === 'ru' ? 'ОЖИДАНИЕ' : 'WAITING'}
              </span>
            ) : (
              <span className="hub-timer">{`00:${String(Math.max(0, Math.ceil(timer))).padStart(2, '0')}`}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameWheel;
