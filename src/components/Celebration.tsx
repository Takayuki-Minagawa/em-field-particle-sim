import { useEffect, useMemo, useState, type CSSProperties } from 'react';

type CelebrationProps = {
  message: string;
  token: number;
};

const COLORS = ['#28b9ff', '#ffb84d', '#ff6b57', '#63c132', '#ff6ec7', '#8e9bff'];
const PIECES = 42;

export function Celebration({ message, token }: CelebrationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (token === 0) {
      return;
    }

    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 2600);
    return () => window.clearTimeout(timer);
  }, [token]);

  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, index) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.35,
        duration: 1.4 + Math.random() * 1,
        rotate: Math.random() * 720 - 360,
        drift: Math.random() * 160 - 80,
        color: COLORS[index % COLORS.length],
      })),
    // Re-roll the confetti for each celebration.
    [token],
  );

  if (!visible) {
    return null;
  }

  return (
    <div className="celebration" aria-live="assertive">
      <div className="celebration__confetti" aria-hidden="true">
        {pieces.map((piece, index) => (
          <span
            key={`${token}-${index}`}
            style={
              {
                left: `${piece.left}%`,
                background: piece.color,
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
                '--confetti-rotate': `${piece.rotate}deg`,
                '--confetti-drift': `${piece.drift}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="celebration__toast" role="status">
        {message}
      </div>
    </div>
  );
}
