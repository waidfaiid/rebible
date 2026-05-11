import { writable } from 'svelte/store';
import type { Verse } from './db';

export const verses = writable<Verse[]>([]);
export const showEditModal = writable(false);
export const selectedVerse = writable<Verse | null>(null);
export const toastMessage = writable<string | null>(null);
export const learningMode = writable<'gemischt' | 'stelle' | 'vers' | 'buch' | 'thema'>('gemischt');

// Einstellungen – werden im Browser-LocalStorage gespeichert
function localStore<T>(key: string, defaultValue: T) {
	const initial =
		typeof window !== 'undefined' && localStorage.getItem(key) !== null
			? (JSON.parse(localStorage.getItem(key)!) as T)
			: defaultValue;
	const store = writable<T>(initial);
	if (typeof window !== 'undefined') {
		store.subscribe(v => localStorage.setItem(key, JSON.stringify(v)));
	}
	return store;
}

// Anzahl der letzten Wörter die als Tipp angezeigt werden (Standard: 5)
export const tippWoerter = localStore('tippWoerter', 5);

// Sprechgeschwindigkeit für Text-to-Speech (0.5 = langsam, 2.0 = schnell, Standard: 1.0)
export const sprechRate = localStore('sprechRate', 1.0);

// Schriftgröße der Fragen/Versetexte in rem (Standard: 1.8)
export const frageFontSize = localStore('frageFontSize', 1.8);

// Schriftgröße der Fragen-Überschrift in Modus 1, 3, 4 (Bibelstelle/Buch/Thema) in rem (Standard: 1.5)
export const frageGroesse = localStore('frageGroesse', 1.5);

// Tage-Anzeige auf Bewertungsbuttons ein/ausblenden (Standard: an)
export const showDaysOnButtons = localStore('showDaysOnButtons', true);
