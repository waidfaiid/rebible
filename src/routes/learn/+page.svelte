<script lang="ts">
	import LearningCard from '$lib/components/LearningCard.svelte';
	import LearningCardMode2 from '$lib/components/LearningCardMode2.svelte';
	import LearningCardMode3 from '$lib/components/LearningCardMode3.svelte';
	import LearningCardMode4 from '$lib/components/LearningCardMode4.svelte';
	import { verses, learningQueue, currentLearningIndex, learningMode } from '$lib/stores';
	import { db } from '$lib/db';
	import { calculateSM2 } from '$lib/spacedRepetition';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import type { Verse } from '$lib/db';

	let queue = $state<Verse[]>([]);
	let index = $state(0);
	let currentVerse = $state<Verse | null>(null);
	let showTip = $state(false);
	let showText = $state(false);
	let mode = $state<'gemischt' | 'stelle' | 'vers' | 'buch' | 'thema'>('stelle');
	let currentCardMode = $state<'stelle' | 'vers'>('stelle'); // For gemischt mode

	// Mode 3: Book ranges
	let bookRanges = $state<{ range: string; verses: Verse[] }[]>([]);
	let currentBookRangeIndex = $state(0);

	// Mode 4: Tags
	let tagGroups = $state<{ tag: string; verses: Verse[] }[]>([]);
	let currentTagIndex = $state(0);

	// Subscribe to stores
	learningQueue.subscribe(q => queue = q);
	currentLearningIndex.subscribe(i => index = i);

	onMount(async () => {
		// Get mode from URL
		const modeParam = $page.url.searchParams.get('mode') as any;
		if (modeParam && ['gemischt', 'stelle', 'vers', 'buch', 'thema'].includes(modeParam)) {
			mode = modeParam;
			learningMode.set(mode);
		}
		
		await startLearning();
	});

	async function startLearning() {
		const allVerses = await db.verse.toArray();
		const heute = new Date();
		heute.setHours(0, 0, 0, 0);

		const faellig = allVerses.filter(v => {
			const next = v.nextReview ? new Date(v.nextReview) : new Date();
			return next <= heute;
		});

		if (faellig.length === 0) {
			alert('Keine fälligen Verse heute');
			goto('/');
			return;
		}

		if (mode === 'buch') {
			await prepareBookRanges(faellig);
			if (bookRanges.length === 0) {
				alert('Keine fälligen Verse für Buch-Modus gefunden');
				goto('/');
				return;
			}
		} else if (mode === 'thema') {
			await prepareTagGroups(faellig);
			if (tagGroups.length === 0) {
				alert('Keine fälligen Verse für Thema-Modus gefunden');
				goto('/');
				return;
			}
		} else {
			// For gemischt, stelle, vers: shuffle the verses
			queue = faellig.sort(() => Math.random() - 0.5);
			index = 0;
			showTip = false;
			showText = false;
			currentVerse = queue[0];
			if (mode === 'gemischt') {
				currentCardMode = Math.random() < 0.5 ? 'stelle' : 'vers'; // Randomly choose mode for first card
			}
		}
	}

	async function prepareBookRanges(faellig: Verse[]) {
		// Group verses by book
		const bookGroups: { [book: string]: Verse[] } = {};
		
		faellig.forEach(verse => {
			const book = verse.stelle.split(' ')[0];
			if (!bookGroups[book]) bookGroups[book] = [];
			bookGroups[book].push(verse);
		});

		bookRanges = [];
		
		// Create ranges for each book
		Object.entries(bookGroups).forEach(([book, bookVerses]) => {
			// Sort by chapter/verse
			bookVerses.sort((a, b) => {
				const aMatch = a.stelle.match(/(\d+)(?:[,:](\d+))?/);
				const bMatch = b.stelle.match(/(\d+)(?:[,:](\d+))?/);
				if (!aMatch || !bMatch) return 0;
				
				const aChap = parseInt(aMatch[1]);
				const bChap = parseInt(bMatch[1]);
				if (aChap !== bChap) return aChap - bChap;
				
				const aVers = aMatch[2] ? parseInt(aMatch[2]) : 0;
				const bVers = bMatch[2] ? parseInt(bMatch[2]) : 0;
				return aVers - bVers;
			});

			// Create ranges of max 5 verses
			const maxPerRange = 5;
			for (let i = 0; i < bookVerses.length; i += maxPerRange) {
				const rangeVerses = bookVerses.slice(i, i + maxPerRange);
				const firstVerse = rangeVerses[0];
				const lastVerse = rangeVerses[rangeVerses.length - 1];
				
				let rangeName = book;
				if (rangeVerses.length > 1) {
					const firstMatch = firstVerse.stelle.match(/(\d+)(?:[,:](\d+))?/);
					const lastMatch = lastVerse.stelle.match(/(\d+)(?:[,:](\d+))?/);
					if (firstMatch && lastMatch) {
						const firstChap = firstMatch[1];
						const lastChap = lastMatch[1];
						rangeName += ` ${firstChap}–${lastChap}`;
					}
				} else {
					rangeName += ` ${firstVerse.stelle.split(' ').slice(1).join(' ')}`;
				}
				
				bookRanges.push({ range: rangeName, verses: rangeVerses });
			}
		});

		currentBookRangeIndex = 0;
	}

	async function prepareTagGroups(faellig: Verse[]) {
		// Group verses by tags
		const tagMap: { [tag: string]: Verse[] } = {};
		
		faellig.forEach(verse => {
			const tags = Array.isArray(verse.tags) ? verse.tags : [verse.tags].filter(Boolean);
			tags.forEach(tag => {
				if (!tagMap[tag]) tagMap[tag] = [];
				tagMap[tag].push(verse);
			});
		});

		tagGroups = [];
		
		// Create groups of max 5 verses per tag
		Object.entries(tagMap).forEach(([tag, tagVerses]) => {
			for (let i = 0; i < tagVerses.length; i += 5) {
				const chunk = tagVerses.slice(i, i + 5);
				tagGroups.push({ tag, verses: chunk });
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

		const result = calculateSM2(currentVerse, grade);
		await db.verse.update(currentVerse.id!, {
			easeFactor: result.easeFactor,
			interval: result.interval,
			nextReview: result.nextReview,
			lastReview: new Date().toISOString(),
			reviewCount: (currentVerse.reviewCount || 0) + 1
		});

		// Next card
		const newIndex = index + 1;
		index = newIndex;

		if (newIndex >= queue.length) {
			// Finished
			alert('Lernen beendet!');
			goto('/');
			return;
		}

		currentVerse = queue[newIndex];
		if (mode === 'gemischt') {
			currentCardMode = Math.random() < 0.5 ? 'stelle' : 'vers'; // Randomly choose mode for next card
		}
		showTip = false;
		showText = false;
	}

	async function rateMode3(verseId: number, grade: number) {
		const verse = queue.find(v => v.id === verseId);
		if (!verse) return;
		
		const result = calculateSM2(verse, grade);
		await db.verse.update(verseId, {
			easeFactor: result.easeFactor,
			interval: result.interval,
			nextReview: result.nextReview,
			lastReview: new Date().toISOString(),
			reviewCount: (verse.reviewCount || 0) + 1
		});
	}

	async function rateMode4(verseId: number, grade: number) {
		const verse = queue.find(v => v.id === verseId);
		if (!verse) return;
		
		const result = calculateSM2(verse, grade);
		await db.verse.update(verseId, {
			easeFactor: result.easeFactor,
			interval: result.interval,
			nextReview: result.nextReview,
			lastReview: new Date().toISOString(),
			reviewCount: (verse.reviewCount || 0) + 1
		});
	}

	function nextBookRange() {
		currentBookRangeIndex++;
		if (currentBookRangeIndex >= bookRanges.length) {
			alert('Alle Buchbereiche bearbeitet!');
			goto('/');
		}
	}

	function nextTag() {
		currentTagIndex++;
		if (currentTagIndex >= tagGroups.length) {
			alert('Alle Themen bearbeitet!');
			goto('/');
		}
	}

	function goBack() {
		if (mode === 'stelle' || mode === 'vers' || mode === 'gemischt') {
			if (index > 0) {
				index--;
				currentVerse = queue[index];
				showTip = false;
				showText = false;
				if (mode === 'gemischt') {
					currentCardMode = Math.random() < 0.5 ? 'stelle' : 'vers';
				}
			}
		}
		// For mode 3 and 4, going back is more complex - maybe implement later
	}
</script>

{#if mode === 'stelle' && currentVerse}
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
			bookRange={bookRanges[currentBookRangeIndex].range}
			onRate={rateMode3}
			onShowNext={nextBookRange}
			progress={{ current: currentBookRangeIndex + 1, total: bookRanges.length }}
		/>
	{/key}
{:else if mode === 'thema' && tagGroups.length > 0}
	{#key tagGroups[currentTagIndex].tag}
		<LearningCardMode4
			verses={tagGroups[currentTagIndex].verses}
			tag={tagGroups[currentTagIndex].tag}
			onRate={rateMode4}
			onShowNext={nextTag}
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
	<div class="min-h-screen flex items-center justify-center">
		<div class="text-center">
			<p class="text-gray-600 mb-4">Lade Lernkarten...</p>
			<button
				class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
				onclick={startLearning}
			>
				Start Lernen
			</button>
		</div>
	</div>
{/if}