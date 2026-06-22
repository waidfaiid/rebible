import Dexie, { type Table } from 'dexie';
import { extractFirstChunk } from '$lib/utils';

export interface Verse {
  id?: number;
  stelle: string;
  text: string;
  tags: string[] | string;
  // Erster sinnvoller Abschnitt des Verses (automatisch berechnet)
  firstChunk?: string;
  // Manuell korrigierter erster Abschnitt (hat Vorrang vor firstChunk)
  firstChunkManual?: string;
  // Legacy fields (kept for backward compatibility when adding new verses)
  interval: number;
  easeFactor: number;
  nextReview: string;
  lastReview?: string;
  reviewCount: number;
  relearning?: boolean;
  // Modus 1: Stelle → Text (Bibelstelle anzeigen, Verstext wiederholen)
  intervalStelle?: number;
  easeFactorStelle?: number;
  nextReviewStelle?: string;
  lastReviewStelle?: string;
  reviewCountStelle?: number;
  // Modus 2: Text → Stelle (Verstext anzeigen, Bibelstelle wiederholen)
  intervalVers?: number;
  easeFactorVers?: number;
  nextReviewVers?: string;
  lastReviewVers?: string;
  reviewCountVers?: number;
  // Modus 3: Buch-Modus → Bibelbuch (Bibelbuch Bereich anzeigen, Kapitelnummer, Versnummer und ersten Chunk der Verstexte wiederholen)
  intervalBuch?: number;
  easeFactorBuch?: number;
  nextReviewBuch?: string;
  lastReviewBuch?: string;
  reviewCountBuch?: number;
  // Modus 4: Thema-Modus → Thema (Thema anzeigen, Bibelstelle und ersten Chunk der Verstexte wiederholen)
  intervalThema?: number;
  easeFactorThema?: number;
  nextReviewThema?: string;
  lastReviewThema?: string;
  reviewCountThema?: number;
}

export class ReBibleDB extends Dexie {
  verse!: Table<Verse>;

  constructor() {
    super('ReBible');
    this.version(1).stores({
      verse: '++id, stelle, text, tags, interval, easeFactor, nextReview, lastReview, reviewCount'
    });
    // Version 2: per-mode spaced repetition fields.
    // Migration copies the existing (legacy) fields into the Stelle-mode fields
    // so that no learning progress is lost.
    this.version(2).stores({
      verse: '++id, stelle, text, tags, interval, easeFactor, nextReview, lastReview, reviewCount, nextReviewStelle, nextReviewVers, nextReviewBuch, nextReviewThema'
    }).upgrade(tx => {
      return tx.table('verse').toCollection().modify((verse: Verse) => {
        if (!verse.nextReviewStelle) {
          verse.nextReviewStelle = verse.nextReview;
          verse.intervalStelle = verse.interval;
          verse.easeFactorStelle = verse.easeFactor;
          verse.lastReviewStelle = verse.lastReview;
          verse.reviewCountStelle = verse.reviewCount;
        }
      });
    });

    // Version 3: firstChunk für alle bestehenden Verse berechnen.
    this.version(3).stores({
      verse: '++id, stelle, text, tags, interval, easeFactor, nextReview, lastReview, reviewCount, nextReviewStelle, nextReviewVers, nextReviewBuch, nextReviewThema'
    }).upgrade(tx => {
      return tx.table('verse').toCollection().modify((verse: Verse) => {
        if (!verse.firstChunk && verse.text) {
          verse.firstChunk = extractFirstChunk(verse.text);
        }
      });
    });

    // Version 4: firstChunk für Verse nachberechnen, die über Anki-Import ohne firstChunk gespeichert wurden.
    this.version(4).stores({
      verse: '++id, stelle, text, tags, interval, easeFactor, nextReview, lastReview, reviewCount, nextReviewStelle, nextReviewVers, nextReviewBuch, nextReviewThema'
    }).upgrade(tx => {
      return tx.table('verse').toCollection().modify((verse: Verse) => {
        if (!verse.firstChunk && verse.text) {
          verse.firstChunk = extractFirstChunk(verse.text);
        }
      });
    });
  }
}

export const db = new ReBibleDB();
