/**
 * Gibt die ersten N Wörter eines Textes zurück, mit " …" dahinter.
 */
export function getFirstWords(text: string, n: number): string {
	const words = text.trim().split(/\s+/);
	if (words.length <= n) return text;
	return words.slice(0, n).join(' ') + ' …';
}

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

// -------------------------------------------------------------------
// First-Chunk-Extraktion für deutsche Bibeltexte
// -------------------------------------------------------------------

/**
 * Finite Verbformen, die einen vollständigen Hauptsatzkern belegen.
 * Auxiliare + Modalverben + häufige Vollverben in Bibelsprache.
 */
const FINITE_VERBS = new Set<string>([
	// Hilfsverben
	'ist','sind','war','waren','bin','bist','seid','sei','seien',
	'wird','werden','wurde','wurden','wirst','werdet','werde',
	'hat','haben','hatte','hatten','habe','hast','habt',
	// Modalverben
	'soll','sollen','sollst','sollt','sollte','sollten',
	'kann','können','konnte','konnten','kannst','könnt','könnte','könnten',
	'muss','müssen','musste','mussten','musst','müsst','müsste',
	'darf','dürfen','durfte','durften','darfst','dürft',
	'mag','mögen','mochte','mochten','magst','mögt','möchte','möchten',
	'will','wollen','wollte','wollten','willst','wollt',
	// Häufige starke Vollverben
	'gibt','gab','gaben','gibst','gebt',
	'kommt','kommen','kam','kamen','kommst',
	'geht','gehen','ging','gingen','gehst',
	'liebt','lieben','liebte','liebten','liebst','liebet',
	'spricht','sprechen','sprach','sprachen','sprichst','sprecht',
	'kennt','kennen','kannte','kennst',
	'bringt','bringen','brachte','brachten','bringst',
	'tut','tun','tat','taten','tust',
	'macht','machen','machte','machten','machst',
	'lebt','leben','lebte','lebten','lebst',
	'stirbt','sterben','starb','starben',
	'findet','finden','fand','fanden','findest',
	'führt','führen','führte','führten','führst',
	'bleibt','bleiben','blieb','blieben','bleibst',
	'lässt','lassen','ließ','ließen',
	'trägt','tragen','trug','trugen','trägst',
	'hilft','helfen','half','halfen','hilfst',
	'rettet','retten','rettete','retteten',
	'schützt','schützen','schützte','schützten',
	'segnet','segnen','segnete','segneten',
	'schafft','schaffen','schuf','schufen','schaffst',
	'wohnt','wohnen','wohnte','wohnten','wohnst',
	'ruft','rufen','rief','riefen','rufst',
	'hört','hören','hörte','hörten','hörst',
	'sieht','sehen','sah','sahen','siehst',
	'weiß','wissen','wusste','wussten','weißt','wisst',
	'glaubt','glauben','glaubte','glaubten','glaubst',
	'schickt','schicken','schickte','schickten','schickst',
	'sendet','senden','sandte','sandten','sendest',
	'nimmt','nehmen','nahm','nahmen','nimmst',
	'heißt','heißen','hieß','hießen',
	'stärkt','stärken','stärkte','stärkten','stärkst',
	'legt','legen','legte','legten','legst',
	'wandelt','wandeln','wandelte','wandelten','wandelst',
	'vergibt','vergeben','vergab','vergaben','vergibst',
	'steht','stehen','stand','standen','stehst',
	'liegt','liegen','lag','lagen','liegst',
	'zieht','ziehen','zog','zogen','ziehst',
	'tritt','treten','trat','traten','trittst',
	'sitzt','sitzen','saß','saßen',
	'öffnet','öffnen','öffnete','öffneten','öffnest',
	'leitet','leiten','leitete','leiteten','leitest',
	'tröstet','trösten','tröstete','trösteten','tröstest',
	'erkauft','kauft','kaufen','kaufte','kauften','kaufst',
	'schreibt','schreiben','schrieb','schrieben','schreibst',
	'fällt','fallen','fiel','fielen','fällst',
	'wächst','wachsen','wuchs','wuchsen',
	'erbarmt','erbarmen','erbarmte','erbarmten',
	'errettet','erretten','errettete','erretteten',
	'befreit','befreien','befreite','befreiten',
	'bewahrt','bewahren','bewahrte','bewahrten',
	'verherrlicht','verherrlichen','verherrlichte','verherrlichten',
	'offenbart','offenbaren','offenbarte','offenbarten',
	'verheißt','verheißen','verhieß','verhießen',
	'heiligt','heiligen','heiligte','heiligten',
	'richtet','richten','richtete','richteten',
	'erleuchtet','erleuchten','erleuchtete','erleuchteten',
	'rechnet','rechnen','rechnete','rechneten',
	'lasst','lasset','habt','liebet',
	'stärke','weise','leite','behüte','vergib','schenke',
	'träumt','träumen','träumte','träumten',
	'ernährt','ernähren','ernährte','ernährten',
	// Häufige Imperative und Verben in Bibelsprache
	'trachtet','trachte','trachten',
	'sucht','suche','suchen','suchte','suchten',
	'freut','freue','freuen','freute','freuten',
	'fürchtet','fürchte','fürchten','fürchtete','fürchteten','fürchtest',
	'betet','bete','beten','betete','beteten',
	'bittet','bitte','bitten','bat','baten','bittest',
	'dankt','danke','danken','dankte','dankten','dankst',
	'lobt','lobe','loben','lobte','lobten','lobst',
	'preist','preise','preisen','pries','priesen',
	'hofft','hoffe','hoffen','hoffte','hofften','hoffst',
	'vertraut','vertraue','vertrauen','vertraute','vertrauten',
	'wartet','warte','warten','wartete','warteten','wartest',
	'dient','diene','dienen','diente','dienten','dienst',
	'sorgt','sorge','sorgen','sorgte','sorgten','sorgst',
	'glänzt','glänze','glänzen',
	'bezeugt','bezeuge','bezeugen','bezeugte','bezeugten',
	'trägt','tragen','trug','trugen','trägst',
	'führt','führen','führte','führten','führst',
	'tröst','tröstet','tröstest','tröstete','trösteten',
	'schützt','schütze','schützen','schützte','schützten','schützest',
	'öffnet','öffne','öffnen','öffnete','öffneten',
	'nähert','nähere','nähern','näherte','näherten',
	'richtet','richte','richten','richtete','richteten',
	'wächst','wachse','wachsen','wuchs','wuchsen',
	'fällt','falle','fallen','fiel','fielen',
	'lässt','lass','lasse','lassen','ließ','ließen',
]);

/** Prüft, ob ein Textabschnitt ein finites Verb enthält. */
function hasFiniteVerb(text: string): boolean {
	// match() statt split() damit deutsche Umlaute (ä, ö, ü, ß) nicht als Trennzeichen wirken
	const words = text.toLowerCase().match(/[a-zA-ZäöüÄÖÜß]+/g) ?? [];
	return words.some(w => FINITE_VERBS.has(w));
}

/**
 * Prüft, ob ein Textabschnitt einen vollständigen Hauptsatzkern bildet:
 * mindestens 3 Wörter + finites Verb vorhanden.
 */
function isCompleteCore(text: string): boolean {
	if (text.trim().split(/\s+/).filter(w => w).length < 3) return false;
	return hasFiniteVerb(text);
}

/**
 * Sucht die erste sinnvolle Schnittgrenze im bereinigten Text
 * gemäß Prioritätsreihenfolge.
 */
function findFirstChunk(text: string): string {
	// Priorität 1: Semikolon
	{
		let idx = 0;
		while ((idx = text.indexOf(';', idx)) !== -1) {
			const before = text.slice(0, idx);
			if (isCompleteCore(before)) return before;
			idx++;
		}
	}

	// Priorität 2: Satzende mit Leerzeichen danach (. ! ? + Leerzeichen)
	{
		const re = /[.!?](?=\s)/g;
		let m: RegExpExecArray | null;
		while ((m = re.exec(text)) !== null) {
			const before = text.slice(0, m.index + 1);
			if (isCompleteCore(before)) return before;
		}
	}

	// Priorität 3: Komma + nebenordnende/begründende Konjunktion
	{
		const re = /,\s*(?=(?:sondern|aber|denn|und|sodass|sowie|oder|jedoch|doch|dennoch|trotzdem)\b)/gi;
		let m: RegExpExecArray | null;
		while ((m = re.exec(text)) !== null) {
			const before = text.slice(0, m.index);
			if (isCompleteCore(before)) return before;
		}
	}

	// Priorität 4: Komma + einleitendes Nebensatz-/Relativwort
	{
		const re = /,\s*(?=(?:der|die|das|welche[rns]?|wer|wenn|so\b|dass|damit|weil|als\b|wie\b|ob\b|obwohl|während|wo\b|denen|dessen|deren)\b)/gi;
		let m: RegExpExecArray | null;
		while ((m = re.exec(text)) !== null) {
			const before = text.slice(0, m.index);
			if (isCompleteCore(before)) return before;
		}
	}

	// Priorität 5: erstes Komma (Fallback), alle Vorkommen prüfen
	{
		let idx = 0;
		while ((idx = text.indexOf(',', idx)) !== -1) {
			const before = text.slice(0, idx);
			if (isCompleteCore(before)) return before;
			idx++;
		}
	}

	// Keine passende Grenze → ganzen Text zurückgeben
	return text;
}

/**
 * Extrahiert den ersten sinnvoll abgeschlossenen Teil eines deutschen
 * Bibeltextes (beliebige Übersetzung). Das Ergebnis eignet sich als
 * Kurzfassung auf Übersichtskarten (Modus 3 / Modus 4).
 *
 * Speicherempfehlung: Einmalig beim Anlegen/Bearbeiten berechnen und
 * im Feld `firstChunk` ablegen. Manuelle Korrekturen in `firstChunkManual`.
 */
export function extractFirstChunk(text: string): string {
	let s = text;

	// Stellenangabe am Ende entfernen: z.B. "1. Korinther 7, 29-31" oder "Römer 3,16"
	s = s.replace(/\s+(?:\d\.\s+)?[A-ZÄÖÜ][a-zA-ZäöüÄÖÜ.-]*(?:\s+[A-ZÄÖÜ][a-zA-ZäöüÄÖÜ.-]*)?\s+\d+[,.:]\s*\d+(?:\s*[-–]\s*\d+)?\s*$/, '').trim();

	// Psalm-/Kapitelüberschrift am Anfang entfernen: "Ein Psalm Davids." o.ä.
	s = s.replace(/^(?:Ein\s+(?:Psalm|Lied|Gebet|Klagelied)[^.]*\.|Psalm\s+\d+[^.]*\.)\s*/i, '');

	// Redeeinführung am Anfang entfernen (endet mit Doppelpunkt):
	// "Jesus antwortete:", "Er sprach zu ihnen:", "Und er sprach aber:"
	s = s.replace(/^[A-ZÄÖÜ][^:\n]{0,100}:\s*/, '');

	// Mehrfache Leerzeichen + Zeilenumbrüche normalisieren
	s = s.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();

	if (!s) return text.trim();

	const result = findFirstChunk(s);

	// Abschließende Satzzeichen (Semikolon, Komma) und Leerzeichen trimmen
	return result.trim().replace(/[;,]\s*$/, '').trim();
}
