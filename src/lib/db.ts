import Dexie, { type Table } from 'dexie';

export interface Verse {
  id?: number;
  stelle: string;
  text: string;
  tags: string[] | string;
  interval: number;
  easeFactor: number;
  nextReview: string;
  lastReview?: string;
  reviewCount: number;
}

export class ReBibleDB extends Dexie {
  verse!: Table<Verse>;

  constructor() {
    super('ReBible');
    this.version(1).stores({
      verse: '++id, stelle, text, tags, interval, easeFactor, nextReview, lastReview, reviewCount'
    });
  }
}

export const db = new ReBibleDB();