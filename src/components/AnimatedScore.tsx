import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AnimatedScoreProps {
  score: number;
  delay?: number;
  className?: string;
}

export function AnimatedScore({ score, delay = 0, className = '' }: AnimatedScoreProps) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let frame = 0;
    const steps = 8;
    const interval = setInterval(() => {
      frame++;
      setDisplayed(Math.round((score / steps) * frame));
      if (frame >= steps) {
        setDisplayed(score);
        clearInterval(interval);
      }
    }, 60);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setDisplayed(score);
    }, steps * 60 + delay);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [score, delay]);

  return (
    <motion.span
      className={className}
      animate={displayed === score && score > 0 ? { scale: [1, 1.25, 1] } : {}}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {displayed}
    </motion.span>
  );
}
