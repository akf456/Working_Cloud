import { motion } from 'framer-motion';
import { Sun, Cloud, Pencil } from 'lucide-react';

// "Working Cloud" with the pencil standing in for the "i" (null entry).
const LETTERS = ['W', 'o', 'r', 'k', null, 'n', 'g', ' ', 'C', 'l', 'o', 'u', 'd'];

export default function SplashOverlay({ onClose }) {
  const base = 1.0; // when the writing reveal begins
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background cursor-pointer"
      onClick={onClose}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="inline-flex items-center gap-1 font-heading font-bold leading-none text-5xl md:text-7xl text-foreground select-none"
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ delay: 1.8, duration: 0.45, ease: 'easeInOut' }}
      >
        {/* Sun revealed once the cloud clears */}
        <motion.span
          className="shrink-0"
          initial={{ opacity: 0, scale: 0, rotate: -30 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }}
        >
          <Sun className="w-10 h-10 md:w-14 md:h-14 text-amber-400" />
        </motion.span>

        {/* Letters + pencil "written" left to right */}
        {LETTERS.map((ch, i) => {
          const d = base + i * 0.055;
          if (ch === null) {
            return (
              <motion.span
                key="pencil"
                className="shrink-0"
                initial={{ opacity: 0, x: -24, rotate: 0 }}
                animate={{ opacity: 1, x: [-24, -8, 2, 0], rotate: -12 }}
                transition={{ delay: d, duration: 0.5, ease: 'easeOut' }}
              >
                <Pencil className="w-9 h-9 md:w-12 md:h-12 text-foreground" />
              </motion.span>
            );
          }
          return (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: d, duration: 0.3, ease: 'easeOut' }}
            >
              {ch === ' ' ? '\u00A0' : ch}
            </motion.span>
          );
        })}

        {/* Cloud starts big over the sun, then drifts right into place */}
        <motion.span
          className="shrink-0 text-sky-400"
          initial={{ opacity: 1, scale: 2.8, x: -240, y: -4 }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          transition={{ delay: 0, duration: 0.85, ease: 'easeInOut' }}
        >
          <Cloud className="w-10 h-10 md:w-14 md:h-14" />
        </motion.span>
      </motion.div>
    </motion.div>
  );
}