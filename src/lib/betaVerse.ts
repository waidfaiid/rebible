import { db } from './db';
import type { Verse } from './db';

// Test data for development - remove this file when done testing
export const betaVerses: Omit<Verse, 'id'>[] = [
	{
		stelle: 'Psalm 1',
		text: 'Wohl dem, der nicht wandelt nach dem Rat der Gottlosen, noch tritt auf den Weg der Sünder, noch sitzt, wo die Spötter sitzen, sondern seine Lust hat am Gesetz des HERRN und über sein Gesetz nachsinnt Tag und Nacht. Der ist wie ein Baum, gepflanzt an Wasserbächen, der seine Frucht bringt zu seiner Zeit, und seine Blätter verwelken nicht, und alles, was er tut, gerät wohl. Nicht so die Gottlosen, sondern sie sind wie Spreu, die der Wind verweht. Darum werden die Gottlosen nicht bestehen im Gericht, noch die Sünder in der Gemeinde der Gerechten. Denn der HERR kennt den Weg der Gerechten; aber der Weg der Gottlosen führt ins Verderben.',
		tags: ['Weisheit'],
		interval: 1,
		easeFactor: 2.5,
		nextReview: (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); })(), // Due today at midnight
		lastReview: undefined,
		reviewCount: 0,
	},
	{
		stelle: 'Psalm 23',
		text: 'Ein Psalm Davids. Der HERR ist mein Hirte; mir wird nichts mangeln. Er weidet mich auf grünen Auen und führt mich zu stillen Wassern. Er erquickt meine Seele; er führt mich auf rechter Straße um seines Namens willen. Und wenn ich auch wanderte durchs Tal der Todesschatten, so fürchte ich kein Unglück, denn du bist bei mir; dein Stecken und dein Stab, die trösten mich. Du bereitest vor mir einen Tisch angesichts meiner Feinde; du hast mein Haupt mit Öl gesalbt, mein Becher fließt über. Nur Güte und Gnade werden mir folgen mein Leben lang, und ich werde bleiben im Haus des HERRN immerdar.',
		tags: [],
		interval: 1,
		easeFactor: 2.5,
		nextReview: (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); })(),
		lastReview: undefined,
		reviewCount: 0,
	},
	{
		stelle: 'Johannes 1,12',
		text: 'Allen aber, die ihn aufnahmen, denen gab er das Anrecht, Kinder Gottes zu werden, denen, die an seinen Namen glauben',
		tags: ['Rettung'],
		interval: 1,
		easeFactor: 2.5,
		nextReview: (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); })(),
		lastReview: undefined,
		reviewCount: 0,
	},
	{
		stelle: 'Johannes 3,16',
		text: 'Denn so hat Gott die Welt geliebt, dass er seinen eingeborenen Sohn gab, damit jeder, der an ihn glaubt, nicht verlorengeht, sondern ewiges Leben hat.',
		tags: ['Rettung', 'Liebe'],
		interval: 1,
		easeFactor: 2.5,
		nextReview: (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); })(),
		lastReview: undefined,
		reviewCount: 0,
	},
	{
		stelle: 'Johannes 14,21',
		text: 'Wer meine Gebote festhält und sie befolgt, der ist es, der mich liebt; wer aber mich liebt, der wird von meinem Vater geliebt werden, und ich werde ihn lieben und mich ihm offenbaren',
		tags: ['Gehorsam'],
		interval: 1,
		easeFactor: 2.5,
		nextReview: (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); })(),
		lastReview: undefined,
		reviewCount: 0,
	},
	{
		stelle: 'Johannes 14,23',
		text: 'Jesus antwortete und sprach zu ihm: Wenn jemand mich liebt, so wird er mein Wort befolgen, und mein Vater wird ihn lieben, und wir werden zu ihm kommen und Wohnung bei ihm machen.',
		tags: ['Gehorsam'],
		interval: 1,
		easeFactor: 2.5,
		nextReview: (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); })(),
		lastReview: undefined,
		reviewCount: 0,
	},
	{
		stelle: 'Jesaja 55,8-9',
		text: 'Denn meine Gedanken sind nicht eure Gedanken, und eure Wege sind nicht meine Wege, spricht der HERR; sondern so hoch der Himmel über der Erde ist, so viel höher sind meine Wege als eure Wege und meine Gedanken als eure Gedanken',
		tags: [],
		interval: 1,
		easeFactor: 2.5,
		nextReview: (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); })(),
		lastReview: undefined,
		reviewCount: 0,
	},
	{
		stelle: 'Jesaja 55,6-7',
		text: 'Sucht den HERRN, solange er zu finden ist; ruft ihn an, während er nahe ist! Der Gottlose verlasse seinen Weg und der Übeltäter seine Gedanken; und er kehre um zu dem HERRN, so wird er sich über ihn erbarmen, und zu unserem Gott, denn bei ihm ist viel Vergebung.',
		tags: [],
		interval: 1,
		easeFactor: 2.5,
		nextReview: (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); })(),
		lastReview: undefined,
		reviewCount: 0,
	}
];

// Load beta test data - call this in layout to reset DB on every app start
export async function loadBetaVerses() {
	try {
		// Clear existing data
		await db.verse.clear();

		// Add beta verses
		await db.verse.bulkAdd(betaVerses);

		console.log('✅ Beta test verses loaded successfully');
		return true;
	} catch (error) {
		console.error('❌ Error loading beta verses:', error);
		return false;
	}
}