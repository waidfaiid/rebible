import { db, type Verse } from '$lib/db';
import { ankiLangzeit, START_FAKTOR } from '$lib/spacedRepetition';

// Werkstatt = gebündeltes Lernen neuer Verse, getrennt vom Langzeit-Wiederholen.
export const WERKSTATT_MAX = 3;           // höchstens so viele Verse gleichzeitig in der Werkstatt
export const ERFOLGSTAGE_NOETIG = 2;      // an so vielen verschiedenen Tagen wortgetreu → gelernt
export const ERSTER_LANGZEIT_ABSTAND = 3; // Tage bis zur ersten Langzeit-Wiederholung

export type Phase = 'neu' | 'lernen' | 'langzeit';

// Phase eines Verses; ältere Datensätze ohne Phase werden anhand ihres Fortschritts eingeordnet.
export function getPhase(v: Verse): Phase {
	if (v.phase) return v.phase;
	return (v.reviewCountStelle ?? v.reviewCount ?? 0) > 0 ? 'langzeit' : 'neu';
}

// Heutiges Datum als 'JJJJ-MM-TT' (lokale Zeit)
export function heuteTag(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Werkstatt-Vers heute noch zu üben? (Heute noch nicht wortgetreu gekonnt)
export function werkstattHeuteFaellig(v: Verse): boolean {
	return getPhase(v) === 'lernen' && v.lernErfolgTag !== heuteTag();
}

// Freie Werkstatt-Plätze mit den ältesten Versen der Warteliste auffüllen.
export async function werkstattAuffuellen(): Promise<void> {
	const alle = await db.verse.toArray();
	const frei = WERKSTATT_MAX - alle.filter(v => getPhase(v) === 'lernen').length;
	if (frei <= 0) return;
	const nachruecker = alle
		.filter(v => getPhase(v) === 'neu')
		.sort((a, b) => a.id! - b.id!)
		.slice(0, frei);
	await Promise.all(
		nachruecker.map(v => db.verse.update(v.id!, { phase: 'lernen', lernErfolge: 0, lernErfolgTag: undefined }))
	);
}

// Felder für Modus 1 – die alten Felder werden als Spiegel mitgeschrieben (Versliste, Startseite).
function modus1Felder(werte: { easeFactor: number; interval: number; nextReview: string; reviewCount: number }) {
	const jetzt = new Date().toISOString();
	return {
		easeFactorStelle: werte.easeFactor, easeFactor: werte.easeFactor,
		intervalStelle: werte.interval, interval: werte.interval,
		nextReviewStelle: werte.nextReview, nextReview: werte.nextReview,
		reviewCountStelle: werte.reviewCount, reviewCount: werte.reviewCount,
		lastReviewStelle: jetzt, lastReview: jetzt
	};
}

// Bewertung in der Werkstatt. Gibt true zurück, wenn der Vers damit in die Langzeit wechselt.
export async function werkstattBewerten(id: number, grade: number): Promise<boolean> {
	// Frisch aus der DB lesen – der Vers kann in dieser Session schon bewertet worden sein
	const v = await db.verse.get(id);
	if (!v) return false;

	if (grade === 0) {
		await db.verse.update(id, { lernErfolge: 0, lastReviewStelle: new Date().toISOString() });
		return false;
	}
	if (grade < 4 || v.lernErfolgTag === heuteTag()) {
		await db.verse.update(id, { lastReviewStelle: new Date().toISOString() });
		return false;
	}

	const erfolge = (v.lernErfolge ?? 0) + 1;
	if (erfolge < ERFOLGSTAGE_NOETIG) {
		await db.verse.update(id, { lernErfolge: erfolge, lernErfolgTag: heuteTag(), lastReviewStelle: new Date().toISOString() });
		return false;
	}

	// Gelernt → Langzeit
	const naechste = new Date();
	naechste.setDate(naechste.getDate() + ERSTER_LANGZEIT_ABSTAND);
	await db.verse.update(id, {
		phase: 'langzeit',
		lernErfolge: erfolge,
		lernErfolgTag: heuteTag(),
		...modus1Felder({
			easeFactor: v.easeFactorStelle ?? START_FAKTOR,
			interval: ERSTER_LANGZEIT_ABSTAND,
			nextReview: naechste.toISOString(),
			reviewCount: (v.reviewCountStelle ?? 0) + 1
		})
	});
	return true;
}

// Bewertung eines Langzeit-Verses in Modus 1. Gibt true zurück, wenn er zurück in die Werkstatt geht.
export async function langzeitBewerten(v: Verse, grade: number): Promise<boolean> {
	const erg = ankiLangzeit(v.easeFactorStelle, v.intervalStelle, v.nextReviewStelle, grade);
	await db.verse.update(v.id!, {
		...modus1Felder({ ...erg, reviewCount: (v.reviewCountStelle ?? 0) + 1 }),
		...(erg.zurueckInWerkstatt ? { phase: 'lernen' as const, lernErfolge: 0, lernErfolgTag: undefined } : {})
	});
	return erg.zurueckInWerkstatt;
}

// Zeitpunkt der letzten Wiederholung über alle Modi hinweg
export function letzteWiederholung(v: Verse): string | undefined {
	const daten = [v.lastReview, v.lastReviewStelle, v.lastReviewVers, v.lastReviewBuch, v.lastReviewThema]
		.filter((d): d is string => !!d)
		.sort();
	return daten[daten.length - 1];
}
