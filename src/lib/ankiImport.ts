import JSZip from 'jszip';
import type { Verse } from '$lib/db';
import { stelleNormalisieren, stripUnsichtbar } from '$lib/bible';
import type { SqlJsStatic } from 'sql.js';

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

function computeSrs(
	type: number,
	due: number,
	ivl: number,
	factor: number,
	reps: number,
	mod: number,
	colCrt: number
): Pick<Verse, 'interval' | 'easeFactor' | 'nextReview' | 'lastReview' | 'reviewCount'> {
	const today = new Date().toISOString().slice(0, 10);
	const rawFactor = factor === 0 ? 2500 : factor;
	const easeFactor = Math.max(1.3, rawFactor / 1000.0);
	const reviewCount = reps;
	const lastReview = mod > 0 ? new Date(mod * 1000).toISOString().slice(0, 10) : today;

	if (type === 2 && ivl > 0) {
		// Review card with positive interval: use Anki's due relative to col.crt
		const effectiveDue = due < 0 ? 0 : due;
		const nextReviewDate = new Date((colCrt + effectiveDue * 86400) * 1000);
		const nextReview = nextReviewDate.toISOString().slice(0, 10);
		return { interval: ivl, easeFactor, nextReview, lastReview, reviewCount };
	}

	// New (0), learning (1), relearning (3), or review with negative ivl
	const interval = type === 2 && ivl < 0 ? 0 : type === 3 ? 1 : 0;
	return { interval, easeFactor, nextReview: today, lastReview, reviewCount };
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

	// Prefer .anki21 over .anki2
	const dbFile =
		zip.file('collection.anki21') ?? zip.file('collection.anki2');
	if (!dbFile) {
		throw new Error('Keine gültige Anki-Datenbank in der Datei gefunden.');
	}

	onProgress('Lese Datenbank...');
	const dbBuffer = await dbFile.async('arraybuffer');

	// Load sql.js from static/ as a plain script tag to bypass bundler issues
	const SQL = await loadSqlJs();

	const db = new SQL.Database(new Uint8Array(dbBuffer));

	// Read collection creation timestamp (Anki-Epoch)
	const colResult = db.exec('SELECT crt FROM col LIMIT 1');
	const colCrt: number = colResult[0]?.values[0]?.[0] as number ?? 0;

	onProgress('Lese Karten...');

	// Join notes with their first card (GROUP BY notes.id picks one card per note)
	const result = db.exec(`
		SELECT
			n.flds,
			n.tags,
			n.mod,
			c.type,
			c.due,
			c.ivl,
			c.factor,
			c.reps,
			c.lapses
		FROM notes n
		JOIN cards c ON c.nid = n.id
		GROUP BY n.id
	`);

	db.close();

	if (!result[0]) {
		return { recognized: [], unrecognized: [] };
	}

	const rows = result[0].values;
	onProgress(`${rows.length} Karten gefunden – verarbeite...`);

	const recognized: Omit<Verse, 'id'>[] = [];
	const unrecognized: UnresolvedCard[] = [];

	for (const row of rows) {
		const [flds, tagsRaw, mod, type, due, ivl, factor, reps] = row as [
			string, string, number, number, number, number, number, number
		];

		const fields = flds.split('\x1f');
		const rawStelle = stripUnsichtbar(stripHtml(fields[0] ?? ''));
		const text = stripHtml(fields[1] ?? '');
		const tags = (tagsRaw ?? '')
			.split(' ')
			.map((t: string) => t.trim())
			.filter((t: string) => t.length > 0);

		const srs = computeSrs(type, due, ivl, factor, reps, mod, colCrt);

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
