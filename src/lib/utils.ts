/**
 * Gibt die letzten N Wörter eines Textes zurück, mit "… " davor.
 */
export function getLastWords(text: string, n: number): string {
	const words = text.trim().split(/\s+/);
	if (words.length <= n) return text;
	return '… ' + words.slice(-n).join(' ');
}

/**
 * Zerlegt eine Bibelstelle wie "Johannes 3,16" in Buch und Kapitel:Vers.
 */
export function splitStelle(stelle: string): { book: string; chapvers: string } {
	const regex = /^(.+?)\s+(\d+)(?:[,:](\d+))?$/;
	const m = stelle.match(regex);
	if (m) {
		return {
			book: m[1],
			chapvers: m[2] + (m[3] ? ',' + m[3] : '')
		};
	}
	return { book: stelle, chapvers: '' };
}
