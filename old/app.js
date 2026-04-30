// ═══════════════════════════════════════════════════════
// DATENBANK
// ═══════════════════════════════════════════════════════
const db = new Dexie('ReBible');
db.version(1).stores({
  verse: '++id, stelle, text, tags, interval, easeFactor, nextReview, lastReview, reviewCount'
});

// ═══════════════════════════════════════════════════════
// BIBELBÜCHER
// ═══════════════════════════════════════════════════════
const BUECHER = [
  { name: 'Genesis',           kurz: ['Gen','1Mo','1.Mo','1Mose'] },
  { name: 'Exodus',            kurz: ['Ex','2Mo','2.Mo','2Mose'] },
  { name: 'Levitikus',         kurz: ['Lev','3Mo','3.Mo','3Mose'] },
  { name: 'Numeri',            kurz: ['Num','4Mo','4.Mo','4Mose'] },
  { name: 'Deuteronomium',     kurz: ['Dtn','5Mo','5.Mo','5Mose','Deut'] },
  { name: 'Josua',             kurz: ['Jos'] },
  { name: 'Richter',           kurz: ['Ri'] },
  { name: 'Rut',               kurz: ['Rut','Ruth','Ru'] },
  { name: '1. Samuel',         kurz: ['1Sam','1.Sam','1Sa'] },
  { name: '2. Samuel',         kurz: ['2Sam','2.Sam','2Sa'] },
  { name: '1. Könige',         kurz: ['1Kön','1Kon','1.Kön','1.Kon','1Kings'] },
  { name: '2. Könige',         kurz: ['2Kön','2Kon','2.Kön','2.Kon','2Kings'] },
  { name: '1. Chronik',        kurz: ['1Chr','1.Chr','1Chron'] },
  { name: '2. Chronik',        kurz: ['2Chr','2.Chr','2Chron'] },
  { name: 'Esra',              kurz: ['Esr','Esra'] },
  { name: 'Nehemia',           kurz: ['Neh'] },
  { name: 'Ester',             kurz: ['Est','Esth'] },
  { name: 'Hiob',              kurz: ['Hi','Hiob','Job'] },
  { name: 'Psalmen',           kurz: ['Ps','Psa','Psalm','Psalmen'] },
  { name: 'Sprüche',           kurz: ['Spr','Prov','Sprüche','Spruche'] },
  { name: 'Prediger',          kurz: ['Pred','Koh','Qoh'] },
  { name: 'Hoheslied',         kurz: ['Hld','Hoh','Song'] },
  { name: 'Jesaja',            kurz: ['Jes','Isa'] },
  { name: 'Jeremia',           kurz: ['Jer'] },
  { name: 'Klagelieder',       kurz: ['Kla','Lam'] },
  { name: 'Hesekiel',          kurz: ['Hes','Ez','Ezek'] },
  { name: 'Daniel',            kurz: ['Dan'] },
  { name: 'Hosea',             kurz: ['Hos'] },
  { name: 'Joel',              kurz: ['Joel'] },
  { name: 'Amos',              kurz: ['Am','Amos'] },
  { name: 'Obadja',            kurz: ['Ob'] },
  { name: 'Jona',              kurz: ['Jon','Jona'] },
  { name: 'Micha',             kurz: ['Mi','Micha'] },
  { name: 'Nahum',             kurz: ['Nah'] },
  { name: 'Habakuk',           kurz: ['Hab'] },
  { name: 'Zefanja',           kurz: ['Zef'] },
  { name: 'Haggai',            kurz: ['Hag'] },
  { name: 'Sacharja',          kurz: ['Sach'] },
  { name: 'Maleachi',          kurz: ['Mal'] },
  { name: 'Matthäus',          kurz: ['Mt','Matt','Matthew'] },
  { name: 'Markus',            kurz: ['Mk','Mark','Marcus'] },
  { name: 'Lukas',             kurz: ['Lk','Luke','Lukas'] },
  { name: 'Johannes',          kurz: ['Joh','Jn','John'] },
  { name: 'Apostelgeschichte', kurz: ['Apg','Acts'] },
  { name: 'Römer',             kurz: ['Röm','Rm','Romans'] },
  { name: '1. Korinther',      kurz: ['1Kor','1Cor'] },
  { name: '2. Korinther',      kurz: ['2Kor','2Cor'] },
  { name: 'Galater',           kurz: ['Gal','Galatians'] },
  { name: 'Epheser',           kurz: ['Eph','Ephesians'] },
  { name: 'Philipper',         kurz: ['Phil','Philippians'] },
  { name: 'Kolosser',          kurz: ['Kol','Col','Colossians'] },
  { name: '1. Thessalonicher', kurz: ['1Thess','1Th'] },
  { name: '2. Thessalonicher', kurz: ['2Thess','2Th'] },
  { name: '1. Timotheus',      kurz: ['1Tim','1Ti'] },
  { name: '2. Timotheus',      kurz: ['2Tim','2Ti'] },
  { name: 'Titus',             kurz: ['Tit'] },
  { name: 'Philemon',          kurz: ['Phlm'] },
  { name: 'Hebräer',           kurz: ['Heb','Hebrews'] },
  { name: 'Jakobus',           kurz: ['Jak','Jas','James'] },
  { name: '1. Petrus',         kurz: ['1Pet','1Pe'] },
  { name: '2. Petrus',         kurz: ['2Pet','2Pe'] },
  { name: '1. Johannes',       kurz: ['1Joh','1Jn'] },
  { name: '2. Johannes',       kurz: ['2Joh','2Jn'] },
  { name: '3. Johannes',       kurz: ['3Joh','3Jn'] },
  { name: 'Judas',             kurz: ['Jud'] },
  { name: 'Offenbarung',       kurz: ['Offb','Rev','Revelation'] }
];

// ═══════════════════════════════════════════════════════
// GLOBALE VARIABLEN
// ═══════════════════════════════════════════════════════
let lernQueue = [];
let lernIndex = 0;
let erkannteStelle = null;
let editErkannteStelle = null;

// ═══════════════════════════════════════════════════════
// INITIALISIERUNG
// ═══════════════════════════════════════════════════════
async function appInit() {
  console.log('App wird initialisiert...');
  
  try {
    // DB Status
    const count = await db.verse.count();
    document.getElementById('db-status').textContent = `${count} Verse in der DB`;
    
    // Views initialisieren
    const verseView = document.getElementById('view-verse');
    if (verseView && !verseView.innerHTML.includes('input-stelle')) {
      verseView.innerHTML = `
        <div class="card">
          <h2>Neue Verse hinzufügen</h2>
          <div class="form-group">
            <label>Bibelstelle</label>
            <div class="stelle-row">
              <input type="text" id="input-stelle" placeholder="z.B. Römer 5,4" oninput="stelleCheck()" />
              <button id="btn-uebernehmen" onclick="stelleUebernehmen()" style="display:none;">Übernehmen</button>
            </div>
            <div id="stelle-feedback"></div>
          </div>
          <div class="form-group">
            <label>Vers-Text</label>
            <textarea id="input-text" placeholder="Gib hier den Vers-Text ein…" style="min-height:120px;"></textarea>
          </div>
          <div class="form-group">
            <label>Tags (kommagetrennt, optional)</label>
            <input type="text" id="input-tags" placeholder="z.B. Gnade, Hoffnung, Mut" />
          </div>
          <button class="btn btn-primary" onclick="versHinzufuegen()">Vers speichern</button>
        </div>
        <div id="vers-liste"></div>
      `;
    }

    // Vers-Liste laden
    await versListeAktualisieren();
    await statsAktualisieren();
    
    console.log('✓ App erfolgreich initialisiert');
  } catch (error) {
    console.error('Fehler bei Initialisierung:', error);
    document.getElementById('db-status').textContent = '❌ Fehler beim Laden';
  }
}

// ═══════════════════════════════════════════════════════
// STELLE NORMALISIEREN
// ═══════════════════════════════════════════════════════
function stelleNormalisieren(input) {
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

// ═══════════════════════════════════════════════════════
// STELLE CHECK (Eingabe)
// ═══════════════════════════════════════════════════════
function stelleCheck() {
  const input = document.getElementById('input-stelle').value.trim();
  const feedback = document.getElementById('stelle-feedback');
  const btn = document.getElementById('btn-uebernehmen');

  if (!input) {
    feedback.textContent = '';
    btn.style.display = 'none';
    erkannteStelle = null;
    return;
  }

  const erkannt = stelleNormalisieren(input);

  if (erkannt) {
    feedback.textContent = `✓ ${erkannt}`;
    feedback.style.color = 'var(--success)';
    btn.style.display = 'inline-block';
    erkannteStelle = erkannt;
  } else {
    feedback.textContent = '✗ Stelle nicht erkannt. Format: "Römer 5,4"';
    feedback.style.color = 'var(--error)';
    btn.style.display = 'none';
    erkannteStelle = null;
  }
}

// ═══════════════════════════════════════════════════════
// STELLE ÜBERNEHMEN
// ═══════════════════════════════════════════════════════
function stelleUebernehmen() {
  if (erkannteStelle) {
    document.getElementById('input-stelle').value = erkannteStelle;
    document.getElementById('btn-uebernehmen').style.display = 'none';
  }
}

// ═══════════════════════════════════════════════════════
// VERS HINZUFÜGEN
// ═══════════════════════════════════════════════════════
async function versHinzufuegen() {
  const stelleInput = document.getElementById('input-stelle').value.trim();
  const text        = document.getElementById('input-text').value.trim();
  const tagsInput   = document.getElementById('input-tags').value.trim();

  if (!stelleInput) { toast('Bitte eine Bibelstelle eingeben'); return; }
  if (!text)        { toast('Bitte den Vers-Text eingeben');    return; }

  const stelle = stelleNormalisieren(stelleInput) || stelleInput;

  const jetzt = new Date().toISOString();
  await db.verse.add({
    stelle: stelle,
    text: text,
    tags: tagsInput,
    interval: 1,
    easeFactor: 2.5,
    nextReview: jetzt,
    lastReview: null,
    reviewCount: 0
  });

  // Felder leeren
  document.getElementById('input-stelle').value = '';
  document.getElementById('input-text').value = '';
  document.getElementById('input-tags').value = '';
  document.getElementById('stelle-feedback').textContent = '';
  erkannteStelle = null;

  toast('✓ Vers gespeichert');
  await versListeAktualisieren();
  await statsAktualisieren();
}

// ═══════════════════════════════════════════════════════
// VERS-LISTE AKTUALISIEREN
// ═══════════════════════════════════════════════════════
async function versListeAktualisieren() {
  const alle = await db.verse.toArray();
  const container = document.getElementById('vers-liste');
  
  if (!container) return;

  if (alle.length === 0) {
    container.innerHTML = '<p style="color:var(--muted); padding:20px; text-align:center;">Noch keine Verse hinzugefügt</p>';
    return;
  }

  let versHTML = '';
  
  alle.forEach(v => {
    // Tags verarbeiten
    let tagsHTML = '';
    if (v.tags && v.tags.length > 0) {
      const tagsArray = Array.isArray(v.tags) ? v.tags : v.tags.split(',').map(t => t.trim());
      tagsHTML = tagsArray
        .map(t => `<span class="tag-badge">${t.trim()}</span>`)
        .join('');
    }

    versHTML += `
      <div class="vers-item">
        <div class="vers-item-info">
          <div class="vers-stelle">${v.stelle || 'Unbekannt'}</div>
          <div class="vers-text">${v.text || '(Kein Text)'}</div>
          ${tagsHTML ? `<div class="vers-tags">${tagsHTML}</div>` : ''}
        </div>
        <div class="vers-item-actions">
          <button class="btn-edit" onclick="versBearbeiten(${v.id})" title="Bearbeiten">✎</button>
          <button class="btn-del" onclick="versLoeschen(${v.id})" title="Löschen">🗑</button>
        </div>
      </div>
    `;
  });

  container.innerHTML = versHTML;
}


// ═══════════════════════════════════════════════════════
// VERS-LISTE AKTUALISIEREN
// ═══════════════════════════════════════════════════════
async function versListeAktualisieren() {
  const alle = await db.verse.toArray();
  const container = document.getElementById('vers-liste');
  
  if (!container) return;

  if (alle.length === 0) {
    container.innerHTML = '<p style="color:var(--muted); padding:20px; text-align:center;">Noch keine Verse hinzugefügt</p>';
    return;
  }

  let versHTML = '';
  
  alle.forEach(v => {
    // Tags verarbeiten
    let tagsHTML = '';
    if (v.tags && v.tags.length > 0) {
      const tagsArray = Array.isArray(v.tags) ? v.tags : v.tags.split(',').map(t => t.trim());
      tagsHTML = tagsArray
        .map(t => `<span class="tag-badge">${t.trim()}</span>`)
        .join('');
    }

    versHTML += `
      <div class="vers-item">
        <div class="vers-item-info">
          <div class="vers-stelle">${v.stelle || 'Unbekannt'}</div>
          <div class="vers-text">${v.text || '(Kein Text)'}</div>
          ${tagsHTML ? `<div class="vers-tags">${tagsHTML}</div>` : ''}
        </div>
        <div class="vers-item-actions">
          <button class="btn-edit" onclick="versBearbeiten(${v.id})" title="Bearbeiten">✎</button>
          <button class="btn-del" onclick="versLoeschen(${v.id})" title="Löschen">🗑</button>
        </div>
      </div>
    `;
  });

  container.innerHTML = versHTML;
}


// ═══════════════════════════════════════════════════════
// VERS FILTERN
// ═══════════════════════════════════════════════════════
function filterVerse() {
  const searchText = document.getElementById('filter-input').value.toLowerCase();
  const cards = document.querySelectorAll('.vers-card');

  cards.forEach(card => {
    const stelle = card.dataset.stelle.toLowerCase();
    const text = card.dataset.text.toLowerCase();

    if (stelle.includes(searchText) || text.includes(searchText)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// ═══════════════════════════════════════════════════════
// VERS BEARBEITEN
// ═══════════════════════════════════════════════════════
async function versBearbeiten(id) {
  const vers = await db.verse.get(id);
  
  if (!vers) {
    alert('Vers nicht gefunden');
    return;
  }

  // Formular mit den Daten füllen
  document.getElementById('stelle-input').value = vers.stelle || '';
  document.getElementById('text-input').value = vers.text || '';
  document.getElementById('tags-input').value = Array.isArray(vers.tags) 
    ? vers.tags.join(', ') 
    : (vers.tags || '');

  // Speichern-Button ändern
  const speichernBtn = document.querySelector('button[onclick="versHinzufuegen()"]');
  speichernBtn.textContent = 'Änderungen speichern';
  speichernBtn.onclick = () => versAendern(id);

  // Scroll zum Formular
  document.getElementById('stelle-input').scrollIntoView({ behavior: 'smooth' });
  document.getElementById('stelle-input').focus();
}

// ═══════════════════════════════════════════════════════
// VERS ÄNDERN (SPEICHERN)
// ═══════════════════════════════════════════════════════
async function versAendern(id) {
  const stelle = document.getElementById('stelle-input').value.trim();
  const text = document.getElementById('text-input').value.trim();
  const tagsInput = document.getElementById('tags-input').value.trim();

  if (!stelle || !text) {
    alert('Stelle und Text sind erforderlich');
    return;
  }

  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

  await db.verse.update(id, {
    stelle,
    text,
    tags,
    geaendert: new Date()
  });

  // Formular zurücksetzen
  document.getElementById('vers-form').reset();
  
  // Button zurücksetzen
  const speichernBtn = document.querySelector('button[onclick="versHinzufuegen()"]');
  speichernBtn.textContent = 'Übernehmen';
  speichernBtn.onclick = () => versHinzufuegen();

  // Liste aktualisieren
  versListeAktualisieren();
  alert('Vers aktualisiert! ✓');
}


// ═══════════════════════════════════════════════════════
// EDIT STELLE CHECK
// ═══════════════════════════════════════════════════════
function editStelleCheck() {
  const input = document.getElementById('edit-stelle').value.trim();
  const feedback = document.getElementById('edit-stelle-feedback');
  const btn = document.getElementById('btn-edit-uebernehmen');

  if (!input) {
    feedback.textContent = '';
    btn.style.display = 'none';
    editErkannteStelle = null;
    return;
  }

  const erkannt = stelleNormalisieren(input);

  if (erkannt) {
    feedback.textContent = `✓ ${erkannt}`;
    feedback.style.color = 'var(--success)';
    btn.style.display = 'inline-block';
    editErkannteStelle = erkannt;
  } else {
    feedback.textContent = '✗ Stelle nicht erkannt';
    feedback.style.color = 'var(--error)';
    btn.style.display = 'none';
    editErkannteStelle = null;
  }
}

// ═══════════════════════════════════════════════════════
// EDIT STELLE ÜBERNEHMEN
// ═══════════════════════════════════════════════════════
function editStelleUebernehmen() {
  if (editErkannteStelle) {
    document.getElementById('edit-stelle').value = editErkannteStelle;
    document.getElementById('btn-edit-uebernehmen').style.display = 'none';
  }
}

// ═══════════════════════════════════════════════════════
// EDIT SPEICHERN
// ═══════════════════════════════════════════════════════
async function editSpeichern() {
  const id = parseInt(document.getElementById('edit-id').value);
  const stelle = editErkannteStelle || document.getElementById('edit-stelle').value.trim();
  const text = document.getElementById('edit-text').value.trim();
  const tags = document.getElementById('edit-tags').value.trim();

  if (!stelle || !text) { 
    toast('Stelle und Text sind Pflichtfelder'); 
    return; 
  }

  await db.verse.update(id, { stelle, text, tags });
  editAbbrechen();
  toast('✓ Vers aktualisiert');
  await versListeAktualisieren();
  await statsAktualisieren();
}

// ═══════════════════════════════════════════════════════
// EDIT ABBRECHEN
// ═══════════════════════════════════════════════════════
function editAbbrechen() {
  document.getElementById('edit-modal').classList.remove('sichtbar');
  editErkannteStelle = null;
}

// ═══════════════════════════════════════════════════════
// VERS LÖSCHEN
// ═══════════════════════════════════════════════════════
async function versLoeschen(id) {
  if (!confirm('Willst du diesen Vers wirklich löschen?')) return;

  await db.verse.delete(id);
  toast('✓ Vers gelöscht');
  await versListeAktualisieren();
  await statsAktualisieren();
}

// ═══════════════════════════════════════════════════════
// STATS AKTUALISIEREN
// ═══════════════════════════════════════════════════════
async function statsAktualisieren() {
  const alle = await db.verse.toArray();
  const heute = new Date();
  heute.setHours(0, 0, 0, 0);

  const faellig = alle.filter(v => {
    const next = v.nextReview ? new Date(v.nextReview) : new Date();
    return next <= heute;
  });

  document.getElementById('stat-gesamt').textContent = alle.length;
  document.getElementById('stat-faellig').textContent = faellig.length;

  // Gelernt heute (vereinfacht: Verse mit lastReview von heute)
  const gelerntHeute = alle.filter(v => {
    if (!v.lastReview) return false;
    const lastDate = new Date(v.lastReview);
    lastDate.setHours(0, 0, 0, 0);
    return lastDate.getTime() === heute.getTime();
  }).length;

  document.getElementById('stat-gelernt').textContent = gelerntHeute;
  document.getElementById('stat-serie').textContent = '0';
}

// ═══════════════════════════════════════════════════════
// LERNEN STARTEN
// ═══════════════════════════════════════════════════════
async function lernenStarten() {
  const alle = await db.verse.toArray();
  const heute = new Date();
  heute.setHours(0, 0, 0, 0);

  lernQueue = alle.filter(v => {
    const next = v.nextReview ? new Date(v.nextReview) : new Date();
    return next <= heute;
  });

  if (lernQueue.length === 0) {
    toast('Keine fälligen Verse heute');
    return;
  }

  lernIndex = 0;
  showView('lernen');
  lernKarteZeigen();
}

// ═══════════════════════════════════════════════════════
// LERN-KARTE ZEIGEN
// ═══════════════════════════════════════════════════════
function lernKarteZeigen() {
  if (lernIndex >= lernQueue.length) {
    lernFertig();
    return;
  }

  const v = lernQueue[lernIndex];

  // Fortschritt
  document.getElementById('lern-fortschritt-text').textContent = `${lernIndex + 1} / ${lernQueue.length}`;
  const progress = ((lernIndex + 1) / lernQueue.length) * 100;
  document.getElementById('lern-bar').style.width = progress + '%';

  // Stelle in Buch und Kapitel/Vers aufspalten
  const regex = /^(.+?)\s+(\d+)(?:[,:](\d+))?$/;
  const m = v.stelle.match(regex);

  if (m) {
    document.getElementById('lern-stelle-buch').textContent = m[1];
    document.getElementById('lern-stelle-kapvers').textContent = m[2] + (m[3] ? ',' + m[3] : '');
  } else {
    document.getElementById('lern-stelle-buch').textContent = v.stelle;
    document.getElementById('lern-stelle-kapvers').textContent = '';
  }

  // Tipp: letzte 5 Wörter
  const woerter = v.text.trim().split(/\s+/);
  const tipp = woerter.length > 5
    ? '… ' + woerter.slice(-5).join(' ')
    : v.text;
  document.getElementById('tipp-inhalt').textContent = tipp;

  // Reset UI
  document.getElementById('tipp-inhalt').classList.remove('sichtbar');
  document.getElementById('btn-tipp').style.display = 'block';
  document.getElementById('btn-aufdecken').style.display = 'block';

  const textEl = document.getElementById('lern-text');
  textEl.textContent = v.text;
  textEl.classList.remove('sichtbar');

  document.getElementById('bewertung-grid').classList.remove('sichtbar');
  document.getElementById('lern-fertig').classList.remove('sichtbar');
  document.getElementById('lern-inhalt').style.display = 'block';
}

// ═══════════════════════════════════════════════════════
// TIPP ANZEIGEN
// ═══════════════════════════════════════════════════════
function tippAnzeigen() {
  document.getElementById('tipp-inhalt').classList.add('sichtbar');
  document.getElementById('btn-tipp').style.display = 'none';
}

// ═══════════════════════════════════════════════════════
// AUFDECKEN
// ═══════════════════════════════════════════════════════
function aufdecken() {
  document.getElementById('btn-tipp').style.display = 'none';
  document.getElementById('tipp-inhalt').classList.remove('sichtbar');
  document.getElementById('btn-aufdecken').style.display = 'none';

  document.getElementById('lern-text').classList.add('sichtbar');
  document.getElementById('bewertung-grid').classList.add('sichtbar');
}

// ═══════════════════════════════════════════════════════
// BEWERTEN (SM-2 Algorithmus)
// ═══════════════════════════════════════════════════════
async function bewerten(grad) {
  const v = lernQueue[lernIndex];
  let ef = v.easeFactor || 2.5;
  let ivl = v.interval || 1;

  ef = Math.max(1.3, ef + 0.1 - (4 - grad) * (0.08 + (4 - grad) * 0.02));

  if (grad < 2) {
    ivl = 1;
  } else if (!v.reviewCount || v.reviewCount === 0) {
    ivl = 1;
  } else if (v.reviewCount === 1) {
    ivl = 6;
  } else {
    ivl = Math.round(ivl * ef);
  }

  const naechstes = new Date();
  naechstes.setDate(naechstes.getDate() + ivl);

  await db.verse.update(v.id, {
    easeFactor: ef,
    interval: ivl,
    nextReview: naechstes.toISOString(),
    lastReview: new Date().toISOString(),
    reviewCount: (v.reviewCount || 0) + 1
  });

  lernIndex++;
  lernKarteZeigen();
}

// ═══════════════════════════════════════════════════════
// LERN FERTIG
// ═══════════════════════════════════════════════════════
function lernFertig() {
  document.getElementById('lern-inhalt').style.display = 'none';
  document.getElementById('lern-fertig').classList.add('sichtbar');
  document.getElementById('bewertung-grid').classList.remove('sichtbar');
  statsAktualisieren();
}

// ═══════════════════════════════════════════════════════
// LERNEN ABBRECHEN
// ═══════════════════════════════════════════════════════
function lernAbbrechen() {
  if (confirm('Willst du das Lernen wirklich abbrechen?')) {
    lernQueue = [];
    lernIndex = 0;
    showView('heute');
  }
}

// ═══════════════════════════════════════════════════════
// VIEW WECHSELN
// ═══════════════════════════════════════════════════════
function showView(name) {
  // Alle Views ausblenden
  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active');
  });

  // Target View anzeigen
  const target = document.getElementById('view-' + name);
  if (target) {
    target.classList.add('active');
  }

  // Nav-Button Styling
  document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
  event?.target?.classList.add('active');
}

// ═══════════════════════════════════════════════════════
// TOAST MELDUNG
// ═══════════════════════════════════════════════════════
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('sichtbar');

  setTimeout(() => {
    el.classList.remove('sichtbar');
  }, 3000);
}

// ═══════════════════════════════════════════════════════
// APP STARTEN
// ═══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', appInit)
