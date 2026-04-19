import React from 'react';
import { motion } from 'framer-motion';
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
  bettingDuration: number;
  onSpinComplete: () => void;
  language: Language;
}

const SVG_SIZE = 400;
const CENTER = 200;
const R = 190;

const GameWheel: React.FC<GameWheelProps> = ({
  players,
  phase,
  timer,
  roll,
  onSpinComplete,
  language
}) => {
  const { playTick } = useAudio();
  const t = translations[language];
  const totalBets = players.reduce((sum, p) => sum + p.bet, 0);

  // Sound logic tracking
  const lastIndexRef = React.useRef<number>(-1);

  const getAngles = (index: number) => {
    let startAngle = 0;
    if (totalBets === 0) return { startAngle: 0, endAngle: 360 };
    for (let i = 0; i < index; i++) {
      startAngle += (players[i].bet / totalBets) * 360;
    }
    const sweepAngle = (players[index].bet / totalBets) * 360;
    return { startAngle, endAngle: startAngle + sweepAngle };
  };

  const polarToCartesian = (cx: number, cy: number, r: number, deg: number) => {
    const rad = (deg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeSlice = (startAngle: number, endAngle: number): string => {
    const sweep = endAngle - startAngle;
    if (sweep >= 359.9) {
      const p1 = polarToCartesian(CENTER, CENTER, R, 0);
      const p2 = polarToCartesian(CENTER, CENTER, R, 180);
      return `M ${p1.x} ${p1.y} A ${R} ${R} 0 1 1 ${p2.x} ${p2.y} A ${R} ${R} 0 1 1 ${p1.x} ${p1.y} Z`;
    }
    const s = polarToCartesian(CENTER, CENTER, R, startAngle);
    const e = polarToCartesian(CENTER, CENTER, R, endAngle);
    const large = sweep > 180 ? 1 : 0;
    return `M ${CENTER} ${CENTER} L ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y} Z`;
  };

  const getSliceCenter = (index: number) => {
    const { startAngle, endAngle } = getAngles(index);
    const mid = startAngle + (endAngle - startAngle) / 2;
    return polarToCartesian(CENTER, CENTER, R * 0.62, mid);
  };

  const hasBets = totalBets > 0;

  const formatTime = (s: number) => {
    const v = Math.ceil(s);
    return `00:${v < 10 ? '0' : ''}${v}`;
  };

  return (
    <div className={`wheel-v5 wheel-phase-${phase}`}>
      {/* Outer container: rim image is a CSS background */}
      <div className="wheel-outer-container">

        {/* Triangle ticker */}
        <div className="wheel-ticker">▼</div>

        {/* SVG wheel — slightly smaller than container so rim edges show */}
        <div className="wheel-svg-wrap">
          <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="wheel-svg">
            {/* Background circle covers rim's inner mechanical parts */}
            <circle cx={CENTER} cy={CENTER} r={R + 5} fill="#0d0d14" />

            <motion.g
              animate={{ rotate: phase === 'spinning' ? (3600 + (1 - roll) * 360) : 0 }}
              transition={{
                duration: phase === 'spinning' ? 8 : 0,
                ease: [0.12, 0, 0.39, 0], // Custom cubic-bezier for realistic slowing
              }}
              onAnimationComplete={() => {
                if (phase === 'spinning') {
                  onSpinComplete();
                }
              }}
              onUpdate={(latest: { rotate?: number }) => {
                if (phase === 'spinning' && latest.rotate !== undefined) {
                  const currentRotation = (latest.rotate % 360 + 360) % 360;
                  const targetAngle = (360 - currentRotation) % 360;

                  let accumulated = 0;
                  let currentIndex = -1;
                  for (let i = 0; i < players.length; i++) {
                    const sweep = (players[i].bet / totalBets) * 360;
                    if (targetAngle >= accumulated && targetAngle < accumulated + sweep) {
                      currentIndex = i;
                      break;
                    }
                    accumulated += sweep;
                  }

                  if (currentIndex !== lastIndexRef.current && currentIndex !== -1) {
                    playTick();
                    lastIndexRef.current = currentIndex;
                  }
                }
              }}
              style={{ originX: `${CENTER}px`, originY: `${CENTER}px` }}
            >
              {hasBets
                ? players.map((player, index) => {
                    const { startAngle, endAngle } = getAngles(index);
                    const segSize = endAngle - startAngle;
                    const pos = getSliceCenter(index);
                    const showAvatar = segSize > 15;

                    return (
                      <g key={player.id}>
                        <motion.path
                          d={describeSlice(startAngle, endAngle)}
                          fill={player.color}
                          stroke="rgba(0,0,0,0.25)"
                          strokeWidth="1"
                          initial={false}
                          animate={{ d: describeSlice(startAngle, endAngle) }}
                          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                        />
                        {showAvatar && (
                          <motion.foreignObject
                            animate={{ x: pos.x - 18, y: pos.y - 18 }}
                            transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                            width="36"
                            height="36"
                          >
                            <div className="wheel-segment-avatar">
                              <img src={player.avatar || '/avatars/default.png'} alt="" />
                            </div>
                          </motion.foreignObject>
                        )}
                      </g>
                    );
                  })
                : <circle cx={CENTER} cy={CENTER} r={R} fill="rgba(108,92,231,0.4)" />
              }
            </motion.g>
          </svg>

          {/* Center hub */}
          <div className="wheel-hub">
            {phase === 'spinning' ? (
              <span className="hub-spin">{t.spinning}</span>
            ) : phase === 'waiting' ? (
              <span className="hub-waiting">{language === 'ru' ? 'ИЩЕМ ИГРОКОВ' : 'FINDING PLAYERS'}</span>
            ) : (
              <span className="hub-timer">{formatTime(timer)}</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default React.memo(GameWheel, (prev, next) => {
  if (prev.phase !== next.phase) return false;
  if (prev.timer !== next.timer) return false;
  if (prev.roll !== next.roll) return false;
  if (prev.language !== next.language) return false;
  
  // Fast comparison for players array
  if (prev.players.length !== next.players.length) return false;
  for (let i = 0; i < prev.players.length; i++) {
    if (prev.players[i].id !== next.players[i].id || prev.players[i].bet !== next.players[i].bet) {
      return false;
    }
  }

  return true;
});
