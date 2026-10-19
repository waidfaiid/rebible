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

// ── Langzeit-Plan für Modus 1 (nach dem Vorbild von Anki) ──────────────────
// Bewertungen: 0 = Vergessen (Anki „Nochmal“), 1 = Lückenhaft („Schwer“),
// 3 = Inhaltlich gut („Gut“), 4 = Wortgetreu („Leicht“).

export const START_FAKTOR = 2.5;
const MIN_FAKTOR = 1.3;
const MAX_ABSTAND = 36500;
const TAG_MS = 24 * 60 * 60 * 1000;

export function ankiLangzeit(
  easeFactor: number | undefined,
  interval: number | undefined,
  nextReview: string | undefined,
  grade: number,
  mitStreuung = true
): { easeFactor: number; interval: number; nextReview: string; zurueckInWerkstatt: boolean } {
  let ef = easeFactor || START_FAKTOR;
  const ivl = Math.max(1, interval || 1);
  // Wie viele Tage zu spät wird wiederholt? (Anki rechnet das als Bonus an)
  const verspaetung = nextReview
    ? Math.max(0, Math.floor((Date.now() - new Date(nextReview).getTime()) / TAG_MS))
    : 0;

  let neu: number;
  let zurueckInWerkstatt = false;

  if (grade === 0) {
    // Komplett vergessen: zurück in die Werkstatt
    ef -= 0.2;
    neu = 1;
    zurueckInWerkstatt = true;
  } else if (grade === 1) {
    // Lückenhaft: etwas länger als bisher, kein Rückfall auf 1 Tag
    ef -= 0.15;
    neu = Math.max(ivl + 1, (ivl + verspaetung / 4) * 1.2);
  } else if (grade === 3) {
    // Inhaltlich gut: Abstand × Faktor
    const schwer = Math.max(ivl + 1, (ivl + verspaetung / 4) * 1.2);
    neu = Math.max(schwer + 1, (ivl + verspaetung / 2) * ef);
  } else {
    // Wortgetreu: Abstand × Faktor × 1,3 und Faktor steigt
    const gut = Math.max(ivl + 2, (ivl + verspaetung / 2) * ef);
    neu = Math.max(gut + 1, (ivl + verspaetung) * ef * 1.3);
    ef += 0.15;
  }

  ef = Math.max(MIN_FAKTOR, ef);
  neu = Math.min(MAX_ABSTAND, Math.round(neu));

  // Kleine Zufallsstreuung, damit sich Verse nicht alle auf einen Tag ballen
  if (mitStreuung && !zurueckInWerkstatt && neu >= 3) {
    const streuung = Math.max(1, Math.round(neu * 0.05));
    neu += Math.floor(Math.random() * (2 * streuung + 1)) - streuung;
  }

  const naechste = new Date();
  naechste.setDate(naechste.getDate() + neu);

  return { easeFactor: ef, interval: neu, nextReview: naechste.toISOString(), zurueckInWerkstatt };
}
