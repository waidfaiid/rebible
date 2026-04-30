import type { Verse } from './db';

export function calculateSM2(verse: Verse, grade: number): { easeFactor: number; interval: number; nextReview: string } {
  let ef = verse.easeFactor || 2.5;
  let ivl = verse.interval || 1;

  // Ease factor calculation
  ef = Math.max(1.3, ef + 0.1 - (4 - grade) * (0.08 + (4 - grade) * 0.02));

  // Interval calculation
  if (grade < 2) {
    ivl = 1;
  } else if (!verse.reviewCount || verse.reviewCount === 0) {
    ivl = 1;
  } else if (verse.reviewCount === 1) {
    ivl = 6;
  } else {
    ivl = Math.round(ivl * ef);
  }

  // Next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + ivl);

  return {
    easeFactor: ef,
    interval: ivl,
    nextReview: nextReview.toISOString()
  };
}