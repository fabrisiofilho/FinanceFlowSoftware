import { useEffect, useRef } from 'react';
import { useMediaQuery } from '@mui/material';
import styled from 'styled-components';
const Plot = styled.svg`
  width: 100%;
  display: block;
  overflow: hidden;
`;
const line =
  'M0 245 L90 245 L130 218 L170 229 L225 187 L270 205 L325 158 L365 174 L425 132 L470 147 L530 102 L575 116 L635 70 L680 83 L735 40 L800 40';
const lengths = [0.25, 0.13, 0.055];
/** Ponto e rastro usam a mesma posição normalizada e o mesmo relógio. */
export function FinancialTrace({ animated = false }: { animated?: boolean }) {
  const guide = useRef<SVGPathElement>(null),
    point = useRef<SVGCircleElement>(null),
    trails = useRef<(SVGPathElement | null)[]>([]);
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  useEffect(() => {
    if (!guide.current) return;
    const path = guide.current,
      total = path.getTotalLength();
    let frame = 0;
    let started = performance.now();
    const paint = (progress: number, opacity: number): void => {
      const position = path.getPointAtLength(total * progress);
      point.current?.setAttribute('cx', String(position.x));
      point.current?.setAttribute('cy', String(position.y));
      point.current?.setAttribute('opacity', String(opacity));
      trails.current.forEach((trail, index) => {
        trail?.setAttribute(
          'stroke-dashoffset',
          String(lengths[index] - progress),
        );
        trail?.setAttribute('opacity', String(opacity));
      });
    };
    if (reduced) {
      paint(0.72, 1);
      return;
    }
    const tick = (now: number): void => {
      const progress = Math.min(1, (now - started) / (animated ? 1900 : 5200));
      const opacity = Math.min(1, progress / 0.06, (1 - progress) / 0.12);
      paint(progress, Math.max(0, opacity));
      if (progress === 1) {
        if (animated) return;
        started = now;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animated, reduced]);
  return (
    <Plot
      viewBox="0 0 800 300"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {[75, 150, 225].map((y) => (
        <path
          key={y}
          d={'M0 ' + y + ' H800'}
          stroke="#ffffff"
          strokeOpacity=".04"
          strokeDasharray="2 10"
        />
      ))}
      <path
        ref={guide}
        d={line}
        stroke="#a9dfbf"
        strokeOpacity={animated ? 0 : 0.06}
        strokeWidth="1.5"
      />
      {lengths.map((length, index) => (
        <path
          ref={(node) => {
            trails.current[index] = node;
          }}
          key={length}
          d={line}
          pathLength="1"
          stroke="#9bd9b5"
          strokeWidth="2.5"
          strokeOpacity={[0.14, 0.4, 0.8][index]}
          strokeDasharray={length + ' 1'}
          strokeDashoffset={length}
          strokeLinecap="round"
          opacity="0"
        />
      ))}
      <circle
        ref={point}
        r="3.5"
        fill="#e1ffec"
        opacity="0"
        style={{ filter: 'drop-shadow(0 0 7px #83e3aa)' }}
      />
    </Plot>
  );
}
