import type { Verse } from '$lib/db';
import { splitStelle } from '$lib/utils';
import { BUECHER } from '$lib/bible';

// Kontext-Gruppen für Modus 3 (Buch) und die Kontext-Runde der Werkstatt:
// Verse eines Buchs nach Kapiteln zu Karten mit max. 5 Versen zusammengefasst.
export interface BuchGruppe {
	range: string;
	verses: Verse[];
	displayBook: string;
	displaySub: string;
}

// Gibt einen Familienschlüssel zurück, der gleichnamige Bücher zusammenfasst.
// "1. Korinther" und "2. Korinther" → "Korinther"
// "1. Johannes", "2. Johannes", "3. Johannes" → "Johannes-Briefe" (getrennt vom Evangelium)
// Alle anderen Bücher behalten ihren eigenen Schlüssel.
function getBookFamilyKey(book: string): string {
	const m = book.match(/^(\d+)\.\s+(.+)$/);
	if (m) {
		const baseName = m[2];
		if (baseName === 'Johannes') return 'Johannes-Briefe';
		return baseName;
	}
	return book;
}

function getBookOrderIndex(book: string): number {
	const idx = BUECHER.findIndex(b => b.name === book);
	return idx >= 0 ? idx : 999;
}

export function buchGruppen(allVerses: Verse[]): BuchGruppe[] {
	// Verse nach Buchfamilie gruppieren (gleichnamige Bücher zusammen)
	const familyGroups: { [familyKey: string]: Verse[] } = {};
	allVerses.forEach(verse => {
		const { book } = splitStelle(verse.stelle);
		const familyKey = getBookFamilyKey(book);
		if (!familyGroups[familyKey]) familyGroups[familyKey] = [];
		familyGroups[familyKey].push(verse);
	});

	const gruppen: BuchGruppe[] = [];

	Object.entries(familyGroups).forEach(([familyKey, familyVerses]) => {
		// Mindestens 2 Verse nötig – einzelne Verse werden in Modus 3 nicht abgefragt
		if (familyVerses.length < 2) return;

		// Nach Buchreihenfolge (BUECHER-Index), dann Kapitel/Vers sortieren
		familyVerses.sort((a, b) => {
			const aBook = splitStelle(a.stelle).book;
			const bBook = splitStelle(b.stelle).book;
			const aOrder = getBookOrderIndex(aBook);
			const bOrder = getBookOrderIndex(bBook);
			if (aOrder !== bOrder) return aOrder - bOrder;
			const aCV = splitStelle(a.stelle).chapvers;
			const bCV = splitStelle(b.stelle).chapvers;
			const aMatch = aCV.match(/^(\d+)(?:[,:](\d+))?/);
			const bMatch = bCV.match(/^(\d+)(?:[,:](\d+))?/);
			if (!aMatch || !bMatch) return 0;
			const aChap = parseInt(aMatch[1]);
			const bChap = parseInt(bMatch[1]);
			if (aChap !== bChap) return aChap - bChap;
			const aVers = aMatch[2] ? parseInt(aMatch[2]) : 0;
			const bVers = bMatch[2] ? parseInt(bMatch[2]) : 0;
			return aVers - bVers;
		});

		// Erst nach Kapitel gruppieren (Verse sind bereits nach Buch/Kapitel/Vers sortiert),
		// damit ein Kapitel möglichst nicht auf mehrere Karten aufgeteilt wird
		const chapterGroups: Verse[][] = [];
		let currentChapterKey: string | null = null;
		familyVerses.forEach(v => {
			const { book, chapvers } = splitStelle(v.stelle);
			const chapter = chapvers.match(/^(\d+)/)?.[1] ?? '';
			const key = `${book}|${chapter}`;
			if (key !== currentChapterKey) {
				chapterGroups.push([]);
				currentChapterKey = key;
			}
			chapterGroups[chapterGroups.length - 1].push(v);
		});

		// Kapitelgruppen zu Karten von max. 5 Versen zusammenfassen, ohne ein Kapitel
		// aufzuteilen (außer ein einzelnes Kapitel hat selbst mehr als 5 Verse)
		const MAX_GROUP_SIZE = 5;
		const chunks: Verse[][] = [];
		let currentChunk: Verse[] = [];
		chapterGroups.forEach(chapterVerses => {
			if (currentChunk.length > 0 && currentChunk.length + chapterVerses.length > MAX_GROUP_SIZE) {
				chunks.push(currentChunk);
				currentChunk = [];
			}
			currentChunk.push(...chapterVerses);
		});
		if (currentChunk.length > 0) {
			chunks.push(currentChunk);
		}

		// Einzelne Verse dürfen nicht als eigene Karte übrig bleiben – mit Nachbarkarte zusammenlegen
		for (let i = chunks.length - 1; i >= 0; i--) {
			if (chunks[i].length === 1 && chunks.length > 1) {
				if (i > 0) {
					chunks[i - 1].push(...chunks[i]);
				} else {
					chunks[i + 1].unshift(...chunks[i]);
				}
				chunks.splice(i, 1);
			}
		}

		chunks.forEach(rangeVerses => {
			const firstVerse = rangeVerses[0];
			const lastVerse = rangeVerses[rangeVerses.length - 1];
			const firstBook = splitStelle(firstVerse.stelle).book;
			const lastBook = splitStelle(lastVerse.stelle).book;
			const isMultiBook = firstBook !== lastBook;

			let displayBook: string;
			let displaySub: string;

			if (isMultiBook) {
				// Mehrere Bücher in der Gruppe: Familienname als Haupttitel
				displayBook = familyKey;
				const firstChap = splitStelle(firstVerse.stelle).chapvers.match(/^(\d+)/)?.[1] ?? '';
				const lastChap = splitStelle(lastVerse.stelle).chapvers.match(/^(\d+)/)?.[1] ?? '';
				displaySub = `${firstBook} ${firstChap} – ${lastBook} ${lastChap}`;
			} else {
				// Alle Verse aus demselben Buch
				displayBook = firstBook;
				if (rangeVerses.length > 1) {
					const firstChap = splitStelle(firstVerse.stelle).chapvers.match(/^(\d+)/)?.[1] ?? '';
					const lastChap = splitStelle(lastVerse.stelle).chapvers.match(/^(\d+)/)?.[1] ?? '';
					displaySub = firstChap === lastChap ? firstChap : `${firstChap}–${lastChap}`;
				} else {
					displaySub = splitStelle(firstVerse.stelle).chapvers;
				}
			}

			gruppen.push({
				range: `${displayBook}${displaySub ? ' ' + displaySub : ''}`,
				verses: rangeVerses,
				displayBook,
				displaySub
			});
		});
	});

	return gruppen;
}
