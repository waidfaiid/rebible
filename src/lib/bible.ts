export const BUECHER = [
  { name: 'Genesis', kurz: ['Gen', '1Mo', '1.Mo', '1Mose'] },
  { name: 'Exodus', kurz: ['Ex', '2Mo', '2.Mo', '2Mose'] },
  { name: 'Levitikus', kurz: ['Lev', '3Mo', '3.Mo', '3Mose'] },
  { name: 'Numeri', kurz: ['Num', '4Mo', '4.Mo', '4Mose'] },
  { name: 'Deuteronomium', kurz: ['Dtn', '5Mo', '5.Mo', '5Mose', 'Deut'] },
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
  { name: 'Hoheslied', kurz: ['Hld', 'Hoh', 'Song'] },
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

export function stelleNormalisieren(input: string): string | null {
  const regex = /^([A-Za-z0-9äöüÄÖÜß\.\-\s]+?)\s+(\d+)\s*[,:]?\s*(\d+)?$/;
  const match = input.match(regex);

  if (!match) return null;

  const buchTeil = match[1].trim();
  const kapitel = match[2];
  const vers = match[3] || '';

  // Exakte Übereinstimmung suchen
  const buch = BUECHER.find(b =>
    b.name.toLowerCase() === buchTeil.toLowerCase() ||
    b.kurz.some(k => k.toLowerCase() === buchTeil.toLowerCase())
  );

  if (!buch) return null;

  return vers ? `${buch.name} ${kapitel},${vers}` : `${buch.name} ${kapitel}`;
}