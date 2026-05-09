import { writable } from 'svelte/store';
import type { Verse } from './db';

export const verses = writable<Verse[]>([]);
export const showEditModal = writable(false);
export const selectedVerse = writable<Verse | null>(null);
export const toastMessage = writable<string | null>(null);
export const learningMode = writable<'gemischt' | 'stelle' | 'vers' | 'buch' | 'thema'>('gemischt');