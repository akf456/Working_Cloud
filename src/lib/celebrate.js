import confetti from 'canvas-confetti';

const MSGS = [
  'Amazing work! Keep that streak alive! 🌸',
  'One down — you’re on a roll! ✨',
  'Crushed it! So proud of you! 💖',
  'Look at you getting things done! 🎉',
  'Another win in the books! 🌷',
  'You’re unstoppable today! ⭐',
  'Small steps, big progress! 🌈',
  'Done and dusted — beautiful! 🦋',
];

const PASTEL = ['#f9a8d4', '#a78bfa', '#fcd34b', '#86efac', '#7dd3fc', '#fda4af'];

export function celebrate() {
  try {
    confetti({
      particleCount: 90,
      spread: 78,
      startVelocity: 38,
      origin: { y: 0.78 },
      colors: PASTEL,
      scalar: 0.9,
      ticks: 220,
    });
  } catch (e) { /* no-op */ }
  return MSGS[Math.floor(Math.random() * MSGS.length)];
}