import JSZip from 'jszip';
import type { Verse } from '$lib/db';
import { stelleNormalisieren, stripUnsichtbar } from '$lib/bible';
import type { SqlJsStatic } from 'sql.js';
import { decompress as zstdEntpacken } from 'fzstd';

export interface UnresolvedCard {
	rawStelle: string;
	text: string;
	partialVerse: Omit<Verse, 'stelle' | 'id'>;
}

export interface AnkiParseResult {
	recognized: Omit<Verse, 'id'>[];
	unrecognized: UnresolvedCard[];
}

function stripHtml(html: string): string {
	return html
		.replace(/<[^>]*>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.trim();
}

interface AnkiKarte {
	type: number;   // 0 = neu, 1 = lernen, 2 = wiederholen, 3 = neu lernen
	queue: number;  // -1 = ausgesetzt
	due: number;    // bei Wiederholungskarten: Tage seit Erstellung der Sammlung
	ivl: number;    // Abstand in Tagen
	factor: number; // Faktor in Promille (2500 = 2,5)
	reps: number;   // Anzahl Wiederholungen
	letzteWdh: number | null; // Zeitpunkt der letzten Wiederholung (ms, aus dem Wiederholungsprotokoll)
}

// Lernstand einer Anki-Karte in die Felder eines Modus übersetzen (Suffix z. B. 'Stelle').
function ankiFortschritt(k: AnkiKarte, colCrt: number, suffix: string): Record<string, unknown> {
	const jetzt = new Date().toISOString();
	const istWiederholung = k.type === 2 && k.ivl > 0;
	return {
		[`easeFactor${suffix}`]: Math.max(1.3, (k.factor > 0 ? k.factor : 2500) / 1000),
		[`interval${suffix}`]: Math.max(0, k.ivl),
		[`nextReview${suffix}`]: istWiederholung ? new Date((colCrt + Math.max(0, k.due) * 86400) * 1000).toISOString() : jetzt,
		[`lastReview${suffix}`]: k.letzteWdh ? new Date(k.letzteWdh).toISOString() : undefined,
		[`reviewCount${suffix}`]: k.reps
	};
}

// Anki-Zustand → Lernphase: ausgesetzt/neu → Warteliste, (neu) lernen → Werkstatt, wiederholen → Langzeit
function ankiPhase(k: AnkiKarte): 'neu' | 'lernen' | 'langzeit' {
	if (k.queue === -1 || k.type === 0) return 'neu';
	if (k.type === 2 && k.ivl > 0) return 'langzeit';
	return 'lernen';
}

type InitSqlJs = (config: object) => Promise<SqlJsStatic>;

let sqlJsCache: SqlJsStatic | null = null;

async function loadSqlJs(): Promise<SqlJsStatic> {
	if (sqlJsCache) return sqlJsCache;

	// Load sql.js UMD bundle as a plain <script> tag – avoids all Vite/CJS bundler issues
	await new Promise<void>((resolve, reject) => {
		if (document.querySelector('script[data-sqljsloaded]')) return resolve();
		const script = document.createElement('script');
		script.src = '/sql-wasm.js';
		script.dataset.sqljsloaded = '1';
		script.onload = () => resolve();
		script.onerror = () => reject(new Error('sql.js konnte nicht geladen werden'));
		document.head.appendChild(script);
	});

	const initFn = (window as unknown as { initSqlJs: InitSqlJs }).initSqlJs;
	sqlJsCache = await initFn({ locateFile: () => '/sql-wasm.wasm' });
	return sqlJsCache;
}

export async function parseAnkiFile(
	file: File,
	onProgress: (msg: string) => void
): Promise<AnkiParseResult> {
	onProgress('Entpacke Datei...');
	const arrayBuffer = await file.arrayBuffer();
	const zip = await JSZip.loadAsync(arrayBuffer);

	onProgress('Lese Datenbank...');
	// Neuere Exporte (.anki21b) sind zstd-komprimiert; ältere liegen als .anki21/.anki2 vor
	const neuesFormat = zip.file('collection.anki21b');
	const altesFormat = zip.file('collection.anki21') ?? zip.file('collection.anki2');
	let dbBytes: Uint8Array;
	if (neuesFormat) {
		dbBytes = zstdEntpacken(new Uint8Array(await neuesFormat.async('arraybuffer')));
	} else if (altesFormat) {
		dbBytes = new Uint8Array(await altesFormat.async('arraybuffer'));
	} else {
		throw new Error('Keine gültige Anki-Datenbank in der Datei gefunden.');
	}

	// Load sql.js from static/ as a plain script tag to bypass bundler issues
	const SQL = await loadSqlJs();

	const db = new SQL.Database(dbBytes);

	// Read collection creation timestamp (Anki-Epoch)
	const colResult = db.exec('SELECT crt FROM col LIMIT 1');
	const colCrt: number = colResult[0]?.values[0]?.[0] as number ?? 0;

	onProgress('Lese Karten...');

	// Alle Karten je Notiz: Karte 0 = Stelle → Text (Modus 1), Karte 1 = Text → Stelle (Modus 2)
	const result = db.exec(`
		SELECT
			n.id, n.flds, n.tags,
			c.ord, c.type, c.queue, c.due, c.ivl, c.factor, c.reps,
			(SELECT MAX(r.id) FROM revlog r WHERE r.cid = c.id)
		FROM notes n
		JOIN cards c ON c.nid = n.id
		ORDER BY n.id, c.ord
	`);

	db.close();

	if (!result[0]) {
		return { recognized: [], unrecognized: [] };
	}

	// Zeilen nach Notiz zusammenfassen
	const notizen = new Map<number, { flds: string; tags: string; karten: Map<number, AnkiKarte> }>();
	for (const row of result[0].values) {
		const [nid, flds, tags, ord, type, queue, due, ivl, factor, reps, letzteWdh] = row as [
			number, string, string, number, number, number, number, number, number, number, number | null
		];
		if (!notizen.has(nid)) notizen.set(nid, { flds, tags, karten: new Map() });
		notizen.get(nid)!.karten.set(ord, { type, queue, due, ivl, factor, reps, letzteWdh });
	}

	onProgress(`${notizen.size} Karten gefunden – verarbeite...`);

	const recognized: Omit<Verse, 'id'>[] = [];
	const unrecognized: UnresolvedCard[] = [];

	for (const { flds, tags: tagsRaw, karten } of notizen.values()) {
		const fields = flds.split('\x1f');
		const rawStelle = stripUnsichtbar(stripHtml(fields[0] ?? ''));
		const text = stripHtml(fields[1] ?? '');
		const tags = (tagsRaw ?? '')
			.split(' ')
			.map((t: string) => t.trim())
			.filter((t: string) => t.length > 0);

		// Hauptkarte (Stelle → Text); fehlt sie, die erste vorhandene Karte nehmen
		const haupt = karten.get(0) ?? karten.values().next().value!;
		const umgekehrt = karten.get(1);
		const stelleFelder = ankiFortschritt(haupt, colCrt, 'Stelle');

		const srs = {
			// Alte Felder als Spiegel von Modus 1
			interval: stelleFelder.intervalStelle as number,
			easeFactor: stelleFelder.easeFactorStelle as number,
			nextReview: stelleFelder.nextReviewStelle as string,
			lastReview: stelleFelder.lastReviewStelle as string | undefined,
			reviewCount: stelleFelder.reviewCountStelle as number,
			...stelleFelder,
			...(umgekehrt ? ankiFortschritt(umgekehrt, colCrt, 'Vers') : {}),
			phase: ankiPhase(haupt),
			lernErfolge: 0
		} as Omit<Verse, 'stelle' | 'id' | 'text' | 'tags'>;

		const normalizedStelle = stelleNormalisieren(rawStelle);

		if (normalizedStelle) {
			recognized.push({ stelle: normalizedStelle, text, tags, ...srs });
		} else {
			unrecognized.push({
				rawStelle,
				text,
				partialVerse: { text, tags, ...srs }
			});
		}
	}

	return { recognized, unrecognized };
}
