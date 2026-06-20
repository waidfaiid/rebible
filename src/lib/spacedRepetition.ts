export function calculateSM2(
  easeFactor: number,
  interval: number,
  reviewCount: number,
  grade: number
): { easeFactor: number; interval: number; nextReview: string } {
  // Startwert 2.0 → erste Wiederholungen verdoppeln sich sauber (~1→2→4→8...)
  let ef = Math.max(1.3, easeFactor || 2.0);
  let ivl = interval || 1;

  // Easefaktor anpassen (Standard-SM2-Formel)
  ef = Math.max(1.3, ef + 0.1 - (4 - grade) * (0.08 + (4 - grade) * 0.02));

  // Intervall berechnen – SM2 greift sofort ab der ersten Bewertung
  if (grade < 2) {
    // Vergessen: auf 1 Tag zurücksetzen
    ivl = 1;
  } else if (!reviewCount || reviewCount === 0) {
    // Allererste Bewertung: immer 1 Tag als Startpunkt
    ivl = 1;
  } else {
    // Ab zweiter Bewertung: Easefaktor anwenden (min. 2 Tage)
    ivl = Math.max(2, Math.round(ivl * ef));
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + ivl);

  return {
    easeFactor: ef,
    interval: ivl,
    nextReview: nextReview.toISOString()
  };
}
