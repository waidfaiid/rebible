export const BUECHER = [
  { name: 'Genesis', kurz: ['Gen', '1Mo', '1.Mo', '1Mose', '1. Mose', '1 Mose'] },
  { name: 'Exodus', kurz: ['Ex', '2Mo', '2.Mo', '2Mose', '2. Mose', '2 Mose'] },
  { name: 'Levitikus', kurz: ['Lev', '3Mo', '3.Mo', '3Mose', '3. Mose', '3 Mose'] },
  { name: 'Numeri', kurz: ['Num', '4Mo', '4.Mo', '4Mose', '4. Mose', '4 Mose'] },
  { name: 'Deuteronomium', kurz: ['Dtn', '5Mo', '5.Mo', '5Mose', '5. Mose', '5 Mose', 'Deut'] },
  { name: 'Josua', kurz: ['Jos'] },
  { name: 'Richter', kurz: ['Ri'] },
  { name: 'Rut', kurz: ['Rut', 'Ruth', 'Ru'] },
  { name: '1. Samuel', kurz: ['1Sam', '1.Sam', '1Sa'] },
  { name: '2. Samuel', kurz: ['2Sam', '2.Sam', '2Sa'] },
  { name: '1. Könige', kurz: ['1Kön', '1Kon', '1.Kön', '1.Kon', '1Kings'] },
  { name: '2. Könige', kurz: ['2Kön', '2Kon', '2.Kön', '2.Kon', '2Kings'] },
  { name: '1. Chronik', kurz: ['1Chr', '1.Chr', '1Chron'] },
  { name: '2. Chronik', kurz: ['2Chr', '2.Chr', '2Chron'] },
  { name: 'Esra', kurz: ['Esr', 'Esra'] },
  { name: 'Nehemia', kurz: ['Neh'] },
  { name: 'Ester', kurz: ['Est', 'Esth'] },
  { name: 'Hiob', kurz: ['Hi', 'Hiob', 'Job'] },
  { name: 'Psalmen', kurz: ['Ps', 'Psa', 'Psalm', 'Psalmen'] },
  { name: 'Sprüche', kurz: ['Spr', 'Prov', 'Sprüche', 'Spruche'] },
  { name: 'Prediger', kurz: ['Pred', 'Koh', 'Qoh'] },
  { name: 'Hoheslied', kurz: ['Hld', 'Hoh', 'Song', 'Hohelied', 'Hoheslied'] },
  { name: 'Jesaja', kurz: ['Jes', 'Isa'] },
  { name: 'Jeremia', kurz: ['Jer'] },
  { name: 'Klagelieder', kurz: ['Kla', 'Lam'] },
  { name: 'Hesekiel', kurz: ['Hes', 'Ez', 'Ezek'] },
  { name: 'Daniel', kurz: ['Dan'] },
  { name: 'Hosea', kurz: ['Hos'] },
  { name: 'Joel', kurz: ['Joel'] },
  { name: 'Amos', kurz: ['Am', 'Amos'] },
  { name: 'Obadja', kurz: ['Ob'] },
  { name: 'Jona', kurz: ['Jon', 'Jona'] },
  { name: 'Micha', kurz: ['Mi', 'Micha'] },
  { name: 'Nahum', kurz: ['Nah'] },
  { name: 'Habakuk', kurz: ['Hab'] },
  { name: 'Zefanja', kurz: ['Zef'] },
  { name: 'Haggai', kurz: ['Hag'] },
  { name: 'Sacharja', kurz: ['Sach'] },
  { name: 'Maleachi', kurz: ['Mal'] },
  { name: 'Matthäus', kurz: ['Mt', 'Matt', 'Matthew'] },
  { name: 'Markus', kurz: ['Mk', 'Mark', 'Marcus'] },
  { name: 'Lukas', kurz: ['Lk', 'Luke', 'Lukas'] },
  { name: 'Johannes', kurz: ['Joh', 'Jn', 'John'] },
  { name: 'Apostelgeschichte', kurz: ['Apg', 'Acts'] },
  { name: 'Römer', kurz: ['Röm', 'Rm', 'Romans'] },
  { name: '1. Korinther', kurz: ['1Kor', '1Cor'] },
  { name: '2. Korinther', kurz: ['2Kor', '2Cor'] },
  { name: 'Galater', kurz: ['Gal', 'Galatians'] },
  { name: 'Epheser', kurz: ['Eph', 'Ephesians'] },
  { name: 'Philipper', kurz: ['Phil', 'Philippians'] },
  { name: 'Kolosser', kurz: ['Kol', 'Col', 'Colossians'] },
  { name: '1. Thessalonicher', kurz: ['1Thess', '1Th'] },
  { name: '2. Thessalonicher', kurz: ['2Thess', '2Th'] },
  { name: '1. Timotheus', kurz: ['1Tim', '1Ti'] },
  { name: '2. Timotheus', kurz: ['2Tim', '2Ti'] },
  { name: 'Titus', kurz: ['Tit'] },
  { name: 'Philemon', kurz: ['Phlm'] },
  { name: 'Hebräer', kurz: ['Heb', 'Hebrews'] },
  { name: 'Jakobus', kurz: ['Jak', 'Jas', 'James'] },
  { name: '1. Petrus', kurz: ['1Pet', '1Pe'] },
  { name: '2. Petrus', kurz: ['2Pet', '2Pe'] },
  { name: '1. Johannes', kurz: ['1Joh', '1Jn'] },
  { name: '2. Johannes', kurz: ['2Joh', '2Jn'] },
  { name: '3. Johannes', kurz: ['3Joh', '3Jn'] },
  { name: 'Judas', kurz: ['Jud'] },
  { name: 'Offenbarung', kurz: ['Offb', 'Rev', 'Revelation'] }
];

export function stelleNormalisieren(raw: string): string | null {
  const input = stripUnsichtbar(raw);
  // \d+[a-z]? allows verse suffixes like "10b"; range separators: - und bis & _ .
  const regex = /^([A-Za-z0-9äöüÄÖÜß\.\-\s]+?)\s+(\d+)\s*[,:]?\s*(\d+)[a-z]?(?:\s*(?:-|und|bis|[&_.'])\s*(\d+)[a-z]?)?$/i;
  const match = input.match(regex);

  if (!match) return null;

  const buchTeil = match[1].trim();
  const kapitel  = match[2];
  const vers     = match[3] || '';
  const endVers  = match[4] || '';

  // Use prefix-aware search so "1. Thess" → "1. Thessalonicher" etc.
  const buch = buchSuchen(buchTeil);
  if (!buch) return null;

  if (vers && endVers) return `${buch.name} ${kapitel},${vers}-${endVers}`;
  if (vers) return `${buch.name} ${kapitel},${vers}`;
  return `${buch.name} ${kapitel}`;
}

export interface ParseErgebnis {
  buch: (typeof BUECHER)[0] | null;
  buchTeil: 'AT' | 'NT' | null;
  kapitel: number | null;
  startVers: number | null;
  endVers: number | null;
  komplett: boolean;
  normalisiert: string | null;
}

// Entfernt unsichtbare Unicode-Steuerzeichen (kommen aus Bible-Apps wie YouVersion).
// U+202A-202E: direktionale Embeddings/Overrides  U+200B-200F: Null-Breiten-Zeichen
// U+2066-2069: direktionale Isolates              U+FEFF: BOM
export function stripUnsichtbar(s: string): string {
  return s.replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '').trim();
}

// Sucht ein Buch anhand exaktem Match, eindeutigem Präfix oder progressiv
// verkürztem Präfix (Tippfehler am Ende: "Apt" → "Ap" → Apostelgeschichte).
function buchSuchen(prefix: string): (typeof BUECHER)[0] | null {
  const p = stripUnsichtbar(prefix)
    .toLowerCase()
    // "1.Kor" → "1. Kor"  (kein Leerzeichen nach Zahl+Punkt – kommt häufig vor)
    .replace(/^(\d+)\.(?=[a-z])/, '$1. ');
  if (!p) return null;

  // 1. Exakter Match (Name oder Kürzel)
  const exakt = BUECHER.find(
    b => b.name.toLowerCase() === p || b.kurz.some(k => k.toLowerCase() === p)
  );
  if (exakt) return exakt;

  // 2. Präfix-Match, progressiv kürzer werdend.
  //    Bei 0 Treffern: nächste Länge versuchen.
  //    Bei >1 Treffern: stoppen (kürzer würde nur mehr Treffer liefern).
  for (let len = p.length; len >= 2; len--) {
    const sub = p.slice(0, len);
    const treffer = BUECHER.filter(
      b => b.name.toLowerCase().startsWith(sub) || b.kurz.some(k => k.toLowerCase().startsWith(sub))
    );
    if (treffer.length === 1) return treffer[0];
    if (treffer.length > 1) break;
  }

  return null;
}

// Parst eine Eingabe live (auch unvollständig) und gibt erkannte Teile zurück.
// Unterstützte Formate: dan3.4-5  |  Röm5,4  |  1Kor3:16  |  Daniel 4,31-32
export function parseStelleLive(raw: string): ParseErgebnis {
  const leer: ParseErgebnis = {
    buch: null, buchTeil: null, kapitel: null,
    startVers: null, endVers: null, komplett: false, normalisiert: null,
  };

  const s = stripUnsichtbar(raw);
  if (!s) return leer;

  // Gruppe 1: Buchpräfix  (optionale Zahl + Buchstaben, z.B. "1.Mo", "dan", "Johannes")
  // Gruppe 2: Kapitel
  // Gruppe 3: Startvers  (nach Trennzeichen , . : oder Leerzeichen)
  // Gruppe 4: Endvers    (nach -)
  const regex = /^((?:[1-9]\.?\s*)?[A-Za-zäöüÄÖÜß][A-Za-zäöüÄÖÜß\s\.]*?)\s*(\d+)?(?:[,\.:\s]\s*(\d+)[a-z]?(?:\s*(?:-|und|bis|[&_.])\s*(\d+)[a-z]?)?)?$/i;
  const match = s.match(regex);
  if (!match) return leer;

  const buchPart  = match[1]?.trim() ?? '';
  const kapStr    = match[2];
  const vonStr    = match[3];
  const bisStr    = match[4];

  const buch = buchSuchen(buchPart);
  if (!buch) return leer;

  const buchIdx  = BUECHER.indexOf(buch);
  const buchTeil = buchIdx < 39 ? 'AT' : 'NT';

  const kapitel   = kapStr  ? parseInt(kapStr)  : null;
  const startVers = vonStr  ? parseInt(vonStr)  : null;
  const endVers   = bisStr  ? parseInt(bisStr)  : null;
  const komplett  = kapitel !== null;

  let normalisiert: string | null = null;
  if (komplett) {
    normalisiert = `${buch.name} ${kapitel}`;
    if (startVers !== null) {
      normalisiert += `,${startVers}`;
      if (endVers !== null) normalisiert += `-${endVers}`;
    }
  }

  return { buch, buchTeil, kapitel, startVers, endVers, komplett, normalisiert };
}