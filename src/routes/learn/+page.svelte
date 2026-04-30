<script lang="ts">
	import LearningCard from '$lib/components/LearningCard.svelte';
	import { verses, learningQueue, currentLearningIndex } from '$lib/stores';
	import { db } from '$lib/db';
	import { calculateSM2 } from '$lib/spacedRepetition';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { Verse } from '$lib/db';

	let queue = $state<Verse[]>([]);
	let index = $state(0);
	let currentVerse = $state<Verse | null>(null);
	let showTip = $state(false);
	let showText = $state(false);

	// Subscribe to stores
	learningQueue.subscribe(q => queue = q);
	currentLearningIndex.subscribe(i => index = i);

	onMount(async () => {
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

		queue = faellig;
		index = 0;
		showTip = false;
		showText = false;
		currentVerse = faellig[0];
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
		showTip = false;
		showText = false;
	}
</script>

{#if currentVerse}
	<LearningCard
		verse={currentVerse}
		onRate={rate}
		onShowTip={showTipp}
		onReveal={reveal}
		showTip={showTip}
		showText={showText}
		progress={{ current: index + 1, total: queue.length }}
	/>
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