<script lang="ts">
	import LearningCard from '$lib/components/LearningCard.svelte';
	import LearningCardMode2 from '$lib/components/LearningCardMode2.svelte';
	import LearningCardMode3 from '$lib/components/LearningCardMode3.svelte';
	import LearningCardMode4 from '$lib/components/LearningCardMode4.svelte';
	import { learningMode, toastMessage } from '$lib/stores';

	function showToast(msg: string, durationMs = 3000) {
		toastMessage.set(msg);
		setTimeout(() => toastMessage.set(null), durationMs);
	}
	import { db } from '$lib/db';
	import { calculateSM2 } from '$lib/spacedRepetition';
	import { getPhase, werkstattAuffuellen, werkstattHeuteFaellig, werkstattBewerten, langzeitBewerten } from '$lib/werkstatt';
	import { buchGruppen } from '$lib/kontextGruppen';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import type { Verse } from '$lib/db';

	let queue = $state<Verse[]>([]);
	let index = $state(0);
	let currentVerse = $state<Verse | null>(null);
	let showTip = $state(false);
	let showText = $state(false);
	let mode = $state<'gemischt' | 'stelle' | 'vers' | 'buch' | 'thema' | 'werkstatt'>('stelle');
	let currentCardMode = $state<'stelle' | 'vers'>('stelle');

	// Buch-Modus
	let bookRanges = $state<{ range: string; verses: Verse[]; displayBook: string; displaySub: string }[]>([]);
	let currentBookRangeIndex = $state(0);

	// Werkstatt: erst Kontext-Runde (Kapitelbereiche der Werkstatt-Verse), dann Wortlaut
	let kontextAktiv = $state(false);
	let werkstattIds = $state(new Set<number>());

	// Thema-Modus
	let tagGroups = $state<{ tag: string; verses: Verse[] }[]>([]);
	let currentTagIndex = $state(0);

	// Gruppen-Bewertungen für Modus 3 & 4 (verseId → grade), werden beim Gruppenabschluss angewendet
	let currentGroupGrades = $state(new Map<number, number>());

	// Returns the capitalised suffix used for per-mode DB fields (e.g. 'Stelle', 'Vers').
	function getModeKey(m: 'stelle' | 'vers' | 'buch' | 'thema'): 'Stelle' | 'Vers' | 'Buch' | 'Thema' {
		return (m.charAt(0).toUpperCase() + m.slice(1)) as 'Stelle' | 'Vers' | 'Buch' | 'Thema';
	}

	// Reads the per-mode SR values from a verse, falling back to sensible defaults.
	function getModeValues(verse: Verse, modeKey: string) {
		const v = verse as Record<string, any>;
		return {
			easeFactor: v[`easeFactor${modeKey}`] ?? 2.0,
			interval:   v[`interval${modeKey}`]   ?? 1,
			reviewCount: v[`reviewCount${modeKey}`] ?? 0,
		};
	}

	// Returns the DB update object for a given mode after a review.
	function buildModeUpdate(
		modeKey: string,
		result: { easeFactor: number; interval: number; nextReview: string },
		reviewCount: number,
		failed: boolean
	): Record<string, unknown> {
		return {
			[`easeFactor${modeKey}`]:  result.easeFactor,
			[`interval${modeKey}`]:    failed ? 1 : result.interval,
			[`nextReview${modeKey}`]:  result.nextReview,
			[`lastReview${modeKey}`]:  new Date().toISOString(),
			[`reviewCount${modeKey}`]: failed ? 0 : reviewCount + 1,
		};
	}

	// For Gemischt-Modus: choose the direction that is actually due;
	// if both (or neither) are due, pick randomly.
	function pickCardModeForVerse(verse: Verse): 'stelle' | 'vers' {
		const morgen = new Date();
		morgen.setHours(23, 59, 59, 999);
		const stelleDue = !verse.nextReviewStelle || new Date(verse.nextReviewStelle) <= morgen;
		const versDue   = !verse.nextReviewVers   || new Date(verse.nextReviewVers)   <= morgen;
		if (stelleDue && !versDue) return 'stelle';
		if (versDue   && !stelleDue) return 'vers';
		return Math.random() < 0.5 ? 'stelle' : 'vers';
	}

	onMount(async () => {
		// Get mode from URL
		const modeParam = $page.url.searchParams.get('mode') as any;
		if (modeParam && ['gemischt', 'stelle', 'vers', 'buch', 'thema', 'werkstatt'].includes(modeParam)) {
			mode = modeParam;
			if (mode !== 'werkstatt') learningMode.set(mode);
		}
		
		await startLearning();
	});

	async function startLearning() {
		if (mode === 'werkstatt') await werkstattAuffuellen();
		const allVerses = await db.verse.toArray();
		// Nur Verse in der Langzeit-Phase werden in Modus 1, 2, 4 und Gemischt wiederholt.
		// Modus 3 (Buch/Kontext) bleibt für alle Verse offen, weil er beim Einprägen hilft.
		const langzeitVerse = allVerses.filter(v => getPhase(v) === 'langzeit');
		const morgen = new Date();
		morgen.setHours(23, 59, 59, 999);

		if (mode === 'werkstatt') {
			const heute = allVerses.filter(werkstattHeuteFaellig);
			if (heute.length === 0) {
				const leer = allVerses.every(v => getPhase(v) !== 'lernen');
				showToast(leer ? 'Die Werkstatt ist leer – füge neue Verse hinzu.' : 'Werkstatt für heute geschafft – morgen geht es weiter!');
				setTimeout(() => goto('/'), 2000);
				return;
			}
			queue = heute.sort((a, b) => a.id! - b.id!);
			werkstattIds = new Set(heute.map(v => v.id!));
			// Kontext: Kapitelbereiche, in denen ein heutiger Werkstatt-Vers steht – zusammen mit den
			// schon gelernten Nachbarversen (Verse der Warteliste bleiben außen vor)
			bookRanges = buchGruppen(allVerses.filter(v => getPhase(v) !== 'neu'))
				.filter(g => g.verses.some(v => werkstattIds.has(v.id!)));
			currentBookRangeIndex = 0;
			kontextAktiv = bookRanges.length > 0;
			index = 0;
			showTip = false;
			showText = false;
			currentVerse = queue[0];
		} else if (mode === 'buch') {
			// Gruppenlogik bestimmt intern welche Gruppen fällig sind (ohne Verse der Warteliste)
			prepareBookRanges(allVerses.filter(v => getPhase(v) !== 'neu'), morgen);
			if (bookRanges.length === 0) {
				showToast('Heute keine Buchbereiche fällig – super gemacht!');
				setTimeout(() => goto('/'), 2000);
				return;
			}
			// queue mit allen Versen der fälligen Gruppen befüllen
			queue = bookRanges.flatMap(g => g.verses);
		} else if (mode === 'thema') {
			await prepareTagGroups(langzeitVerse, morgen);
			if (tagGroups.length === 0) {
				showToast('Heute keine Themen fällig – super gemacht!');
				setTimeout(() => goto('/'), 2000);
				return;
			}
			queue = tagGroups.flatMap(g => g.verses);
		} else {
			// Modus 1, 2, Gemischt: pro Vers fällig prüfen
			const faellig = langzeitVerse.filter(v => {
				if (mode === 'gemischt') {
					const stelleDue = !v.nextReviewStelle || new Date(v.nextReviewStelle) <= morgen;
					const versDue   = !v.nextReviewVers   || new Date(v.nextReviewVers)   <= morgen;
					return stelleDue || versDue;
				}
				const modeKey = getModeKey(mode as 'stelle' | 'vers');
				const v2 = v as Record<string, any>;
				const nextDate = v2[`nextReview${modeKey}`];
				const next = nextDate ? new Date(nextDate) : new Date(0);
				return next <= morgen;
			});

			if (faellig.length === 0) {
				showToast('Heute keine Verse fällig – super gemacht!');
				setTimeout(() => goto('/'), 2000);
				return;
			}

			queue = faellig.sort(() => Math.random() - 0.5);
			index = 0;
			showTip = false;
			showText = false;
			currentVerse = queue[0];
			if (mode === 'gemischt') {
				currentCardMode = pickCardModeForVerse(queue[0]);
			}
		}
	}

	function prepareBookRanges(allVerses: Verse[], morgen: Date) {
		// Nur Gruppen aufnehmen, in denen mindestens ein Vers heute fällig ist
		bookRanges = buchGruppen(allVerses).filter(g =>
			g.verses.some(v => !v.nextReviewBuch || new Date(v.nextReviewBuch) <= morgen)
		);
		currentBookRangeIndex = 0;
	}

	async function prepareTagGroups(allVerses: Verse[], morgen: Date) {
		// Alle Verse nach Tags gruppieren
		const tagMap: { [tag: string]: Verse[] } = {};
		allVerses.forEach(verse => {
			const tags = Array.isArray(verse.tags) ? verse.tags : [verse.tags].filter(Boolean);
			tags.forEach(tag => {
				if (!tagMap[tag]) tagMap[tag] = [];
				tagMap[tag].push(verse);
			});
		});

		tagGroups = [];

		// Gruppen von max. 5 je Tag – nur wenn schwächster Vers fällig ist
		Object.entries(tagMap).forEach(([tag, tagVerses]) => {
			for (let i = 0; i < tagVerses.length; i += 5) {
				const chunk = tagVerses.slice(i, i + 5);
				const isDue = chunk.some(v => {
					const nextDate = (v as Record<string, any>).nextReviewThema;
					if (!nextDate) return true;
					return new Date(nextDate) <= morgen;
				});
				if (isDue) {
					tagGroups.push({ tag, verses: chunk });
				}
			}
		});

		currentTagIndex = 0;
	}

	function showTipp() {
		showTip = true;
	}

	function reveal() {
		showTip = false;
		showText = true;
	}

	async function rate(grade: number) {
		if (!currentVerse) return;

		const isRelearning = !!currentVerse.relearning;
		// For Gemischt-Modus, use the direction that was actually shown.
		const effectiveMode = mode === 'gemischt' ? currentCardMode : (mode as 'stelle' | 'vers' | 'buch' | 'thema' | 'werkstatt');

		if (effectiveMode === 'werkstatt') {
			// Werkstatt: so lange in dieser Session wiederholen, bis der Vers wortgetreu sitzt
			const bestanden = await werkstattBewerten(currentVerse.id!, grade);
			if (grade < 4) {
				const frisch = (await db.verse.get(currentVerse.id!)) ?? currentVerse;
				queue = [...queue, { ...frisch, relearning: true }];
			}
			if (bestanden) showToast('Gelernt! Der Vers wechselt in die Langzeit-Wiederholung.');
		} else if (effectiveMode === 'stelle') {
			// Langzeit Modus 1 (Anki-Plan): kein Wiederholen in derselben Session,
			// komplett Vergessenes geht zurück in die Werkstatt
			const zurueck = await langzeitBewerten(currentVerse, grade);
			if (zurueck) showToast('Zurück in die Werkstatt – dort lernst du ihn gezielt neu.');
		} else {
			await rateSM2(currentVerse, effectiveMode, grade, isRelearning);
		}

		nextCard();
	}

	async function rateSM2(currentVerse: Verse, effectiveMode: 'vers' | 'buch' | 'thema', grade: number, isRelearning: boolean) {
		const modeKey = getModeKey(effectiveMode);
		const vals = getModeValues(currentVerse, modeKey);

		if (grade < 2) {
			if (!isRelearning) {
				const result = calculateSM2(vals.easeFactor, vals.interval, vals.reviewCount, grade);
				await db.verse.update(currentVerse.id!, buildModeUpdate(modeKey, result, vals.reviewCount, true));
			}
			queue = [...queue, { ...currentVerse, relearning: true }];
		} else {
			if (!isRelearning) {
				const result = calculateSM2(vals.easeFactor, vals.interval, vals.reviewCount, grade);
				await db.verse.update(currentVerse.id!, buildModeUpdate(modeKey, result, vals.reviewCount, false));
			}
		}
	}

	function nextCard() {
		const newIndex = index + 1;
		index = newIndex;

		if (newIndex >= queue.length) {
			showToast('Lernsession abgeschlossen!');
			setTimeout(() => goto('/'), 1500);
			return;
		}

		currentVerse = queue[newIndex];
		if (mode === 'gemischt') {
			currentCardMode = pickCardModeForVerse(queue[newIndex]);
		}
		showTip = false;
		showText = false;
	}

	function rateGroupVerse(verseId: number, grade: number, relearning = false) {
		// Beim Relearning (Wiederholung innerhalb der Session) die bessere Note behalten,
		// damit ein zweiter Versuch belohnt wird.
		const existing = currentGroupGrades.get(verseId);
		if (relearning && existing !== undefined) {
			currentGroupGrades.set(verseId, Math.max(existing, grade));
		} else {
			currentGroupGrades.set(verseId, grade);
		}
	}

	async function applyGroupSM2(verses: Verse[], modeKey: 'Buch' | 'Thema') {
		if (verses.length === 0) return;

		// Schwächsten Vers finden: kleinster intervalBuch/Thema-Wert
		// Nie gelernter Vers (kein Wert) = Intervall 0 → immer schwächster
		const weakest = verses.reduce((prev, curr) => {
			const prevIvl = (prev as Record<string, any>)[`interval${modeKey}`] ?? 0;
			const currIvl = (curr as Record<string, any>)[`interval${modeKey}`] ?? 0;
			return currIvl < prevIvl ? curr : prev;
		}, verses[0]);

		const weakestVals = getModeValues(weakest, modeKey);

		// Schlechteste Note aus allen Bewertungen dieser Gruppe ermitteln
		const gradedVerseIds = verses.map(v => v.id!);
		const grades = gradedVerseIds
			.map(id => currentGroupGrades.get(id))
			.filter((g): g is number => g !== undefined);
		const worstGrade = grades.length > 0 ? Math.min(...grades) : 4;

		// Einmalige SM-2-Berechnung auf Basis des schwächsten Verses
		const result = calculateSM2(
			weakestVals.easeFactor,
			weakestVals.interval,
			weakestVals.reviewCount,
			worstGrade
		);

		// Ergebnis auf alle Verse der Gruppe schreiben
		await Promise.all(
			verses.map(v =>
				db.verse.update(v.id!, buildModeUpdate(modeKey, result, weakestVals.reviewCount, worstGrade < 2))
			)
		);

		currentGroupGrades = new Map();
	}

	async function nextBookRange() {
		if (mode === 'werkstatt') {
			// Kontext-Runde der Werkstatt ist reines Üben – beeinflusst den Buch-Plan nicht
			currentBookRangeIndex++;
			if (currentBookRangeIndex >= bookRanges.length) kontextAktiv = false;
			return;
		}
		await applyGroupSM2(bookRanges[currentBookRangeIndex].verses, 'Buch');
		currentBookRangeIndex++;
		if (currentBookRangeIndex >= bookRanges.length) {
			showToast('Alle Buchbereiche abgeschlossen!');
			setTimeout(() => goto('/'), 1500);
		}
	}

	async function nextTag() {
		await applyGroupSM2(tagGroups[currentTagIndex].verses, 'Thema');
		currentTagIndex++;
		if (currentTagIndex >= tagGroups.length) {
			showToast('Alle Themen abgeschlossen!');
			setTimeout(() => goto('/'), 1500);
		}
	}

	function goBack() {
		if (mode === 'werkstatt' && kontextAktiv) {
			if (currentBookRangeIndex > 0) currentBookRangeIndex--;
			else goto('/');
		} else if (mode === 'werkstatt' && index === 0 && bookRanges.length > 0) {
			// Vom ersten Vers zurück in die Kontext-Runde
			currentBookRangeIndex = bookRanges.length - 1;
			kontextAktiv = true;
		} else if (mode === 'stelle' || mode === 'vers' || mode === 'gemischt' || mode === 'werkstatt') {
			if (index > 0) {
				index--;
				currentVerse = queue[index];
				showTip = false;
				showText = false;
				if (mode === 'gemischt') {
					currentCardMode = Math.random() < 0.5 ? 'stelle' : 'vers';
				}
			} else {
				goto('/');
			}
		} else if (mode === 'buch') {
			if (currentBookRangeIndex > 0) {
				currentBookRangeIndex--;
			} else {
				goto('/');
			}
		} else if (mode === 'thema') {
			if (currentTagIndex > 0) {
				currentTagIndex--;
			} else {
				goto('/');
			}
		}
	}
</script>

<!-- Scroll-Boundary: verhindert dass Karten-Komponenten über den Viewport wachsen -->
<div class="flex-1 overflow-hidden flex flex-col min-h-0">
{#if mode === 'werkstatt' && kontextAktiv && bookRanges[currentBookRangeIndex]}
	{#key bookRanges[currentBookRangeIndex].range}
		<LearningCardMode3
			verses={bookRanges[currentBookRangeIndex].verses}
			displayBook={bookRanges[currentBookRangeIndex].displayBook}
			displaySub={bookRanges[currentBookRangeIndex].displaySub}
			onRate={rateGroupVerse}
			onShowNext={nextBookRange}
			onGoBack={goBack}
			progress={{ current: currentBookRangeIndex + 1, total: bookRanges.length }}
			{werkstattIds}
		/>
	{/key}
{:else if (mode === 'stelle' || mode === 'werkstatt') && currentVerse}
	<LearningCard
		werkstatt={mode === 'werkstatt'}
		verse={currentVerse}
		onRate={rate}
		onShowTip={showTipp}
		onReveal={reveal}
		showTip={showTip}
		showText={showText}
		progress={{ current: index + 1, total: queue.length }}
		onGoBack={goBack}
	/>
{:else if mode === 'vers' && currentVerse}
	<LearningCardMode2
		verse={currentVerse}
		onRate={rate}
		onShowTip={showTipp}
		onReveal={reveal}
		showTip={showTip}
		showText={showText}
		progress={{ current: index + 1, total: queue.length }}
		onGoBack={goBack}
	/>
{:else if mode === 'buch' && bookRanges.length > 0}
	{#key bookRanges[currentBookRangeIndex].range}
		<LearningCardMode3
			verses={bookRanges[currentBookRangeIndex].verses}
			displayBook={bookRanges[currentBookRangeIndex].displayBook}
			displaySub={bookRanges[currentBookRangeIndex].displaySub}
			onRate={rateGroupVerse}
			onShowNext={nextBookRange}
			onGoBack={goBack}
			progress={{ current: currentBookRangeIndex + 1, total: bookRanges.length }}
		/>
	{/key}
{:else if mode === 'thema' && tagGroups.length > 0}
	{#key tagGroups[currentTagIndex].tag}
		<LearningCardMode4
			verses={tagGroups[currentTagIndex].verses}
			tag={tagGroups[currentTagIndex].tag}
			onRate={rateGroupVerse}
			onShowNext={nextTag}
			onGoBack={goBack}
			progress={{ current: currentTagIndex + 1, total: tagGroups.length }}
		/>
	{/key}
{:else if mode === 'gemischt' && currentVerse}
	{#if currentCardMode === 'stelle'}
		<LearningCard
			verse={currentVerse}
			onRate={rate}
			onShowTip={showTipp}
			onReveal={reveal}
			showTip={showTip}
			showText={showText}
			progress={{ current: index + 1, total: queue.length }}
			onGoBack={goBack}
		/>
	{:else}
		<LearningCardMode2
			verse={currentVerse}
			onRate={rate}
			onShowTip={showTipp}
			onReveal={reveal}
			showTip={showTip}
			showText={showText}
			progress={{ current: index + 1, total: queue.length }}
			onGoBack={goBack}
		/>
	{/if}
{:else}
	<div class="flex-1 bg-black flex items-center justify-center p-5">
		<div class="bg-zinc-900 rounded-3xl shadow-sm border border-zinc-800 p-8 text-center max-w-sm w-full">
			<div class="animate-pulse flex flex-col items-center">
				<div class="bg-zinc-800 text-zinc-400 p-4 rounded-2xl mb-4">
					<span class="material-icons text-4xl">school</span>
				</div>
				<h3 class="text-xl font-bold text-white mb-2">Lade Lernkarten...</h3>
				<p class="text-zinc-500 mb-6 text-sm">Bereite deine heutige Session vor.</p>
				<button
					class="w-full bg-red-600 text-white px-6 py-4 rounded-2xl hover:bg-red-700 active:scale-95 font-semibold transition-all duration-200 shadow-sm shadow-red-900/20"
					onclick={startLearning}
				>
					Manuell starten
				</button>
			</div>
		</div>
	</div>
{/if}
</div>