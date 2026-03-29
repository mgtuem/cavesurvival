import { useRef, useCallback, useEffect } from 'react';

export default function Joystick({ onMove }) {
  const zoneRef = useRef(null);
  const baseRef = useRef(null);
  const thumbRef = useRef(null);
  const activeTouch = useRef(null);
  const basePos = useRef({ x: 0, y: 0 });

  const handleStart = useCallback((e) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    activeTouch.current = touch.identifier;

    const zone = zoneRef.current.getBoundingClientRect();
    const cx = touch.clientX - zone.left;
    const cy = touch.clientY - zone.top;

    basePos.current = { x: cx, y: cy };

    if (baseRef.current) {
      baseRef.current.style.display = 'block';
      baseRef.current.style.left = `${cx - 60}px`;
      baseRef.current.style.top = `${cy - 60}px`;
    }
    if (thumbRef.current) {
      thumbRef.current.style.left = '50%';
      thumbRef.current.style.top = '50%';
    }
  }, []);

  const handleMove = useCallback((e) => {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      if (touch.identifier !== activeTouch.current) continue;

      const zone = zoneRef.current.getBoundingClientRect();
      const cx = touch.clientX - zone.left;
      const cy = touch.clientY - zone.top;

      let dx = cx - basePos.current.x;
      let dy = cy - basePos.current.y;

      const maxR = 50;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > maxR) {
        dx = (dx / dist) * maxR;
        dy = (dy / dist) * maxR;
      }

      if (thumbRef.current) {
        thumbRef.current.style.left = `calc(50% + ${dx}px)`;
        thumbRef.current.style.top = `calc(50% + ${dy}px)`;
      }

      const nx = dx / maxR;
      const ny = dy / maxR;
      onMove(nx, ny);
    }
  }, [onMove]);

  const handleEnd = useCallback((e) => {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      if (touch.identifier !== activeTouch.current) continue;
      activeTouch.current = null;
      if (baseRef.current) baseRef.current.style.display = 'none';
      onMove(0, 0);
    }
  }, [onMove]);

  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone) return;
    const opts = { passive: false };
    zone.addEventListener('touchstart', handleStart, opts);
    zone.addEventListener('touchmove', handleMove, opts);
    zone.addEventListener('touchend', handleEnd, opts);
    zone.addEventListener('touchcancel', handleEnd, opts);
    return () => {
      zone.removeEventListener('touchstart', handleStart);
      zone.removeEventListener('touchmove', handleMove);
      zone.removeEventListener('touchend', handleEnd);
      zone.removeEventListener('touchcancel', handleEnd);
    };
  }, [handleStart, handleMove, handleEnd]);

  return (
    <div ref={zoneRef} className="joystick-zone">
      <div ref={baseRef} className="joystick-base absolute hidden">
        <div ref={thumbRef} className="joystick-thumb" />
      </div>
    </div>
  );
}
