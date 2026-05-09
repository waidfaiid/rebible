<script lang="ts">
	import StatsGrid from '$lib/components/StatsGrid.svelte';
	import { verses } from '$lib/stores';
	import { derived } from 'svelte/store';
	import { goto } from '$app/navigation';

	// Calculate stats
	const stats = derived(verses, $verses => {
		const heute = new Date();
		heute.setHours(0, 0, 0, 0);

		const faellig = $verses.filter(v => {
			const next = v.nextReview ? new Date(v.nextReview) : new Date();
			return next <= heute;
		});

		const gelerntHeute = $verses.filter(v => {
			if (!v.lastReview) return false;
			const lastDate = new Date(v.lastReview);
			lastDate.setHours(0, 0, 0, 0);
			return lastDate.getTime() === heute.getTime();
		}).length;

		return {
			gesamt: $verses.length,
			faellig: faellig.length,
			gelerntHeute,
			serie: 0 // Placeholder, could be calculated from consecutive days
		};
	});

	function startLearning(mode: 'gemischt' | 'stelle' | 'vers' | 'buch' | 'thema') {
		goto(`/learn?mode=${mode}`);
	}
</script>

<div class="min-h-screen bg-white flex flex-col">
	<!-- Header Section - Compact -->
	<div class="px-4 py-3">
		<h2 class="text-2xl font-light text-black mb-1">Heute</h2>
		<p class="text-xs text-gray-500 font-light">Dein Lernfortschritt</p>
	</div>

	<!-- Stats Section - Compact -->
	<div class="px-4 mb-3">
		<StatsGrid stats={$stats} />
	</div>

	<!-- Main learning button - Compact -->
	<div class="px-4 mb-3">
		<button
			onclick={() => startLearning('gemischt')}
			class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-4 rounded-xl transition-colors duration-300 flex items-center justify-center gap-2 text-base"
		>
			<span class="material-icons text-xl">play_arrow</span>
			Lernen Starten
		</button>
	</div>

	<!-- Learning mode buttons - Fill remaining space -->
	<div class="flex-1 px-4 pb-2">
		<div class="grid grid-cols-2 gap-3 h-full">
			<button
				onclick={() => startLearning('stelle')}
				class="bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-black py-3 px-3 rounded-lg transition-colors duration-300 flex flex-col justify-center items-center"
			>
				<div class="flex justify-center mb-2 text-blue-600">
					<span class="material-icons text-xl">bookmark</span>
				</div>
				<div class="font-medium text-xs text-center leading-tight">Was steht geschrieben?</div>
				<div class="text-xs text-gray-500 mt-1 text-center">Stellen zu Versen</div>
			</button>

			<button
				onclick={() => startLearning('vers')}
				class="bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-black py-3 px-3 rounded-lg transition-colors duration-300 flex flex-col justify-center items-center"
			>
				<div class="flex justify-center mb-2 text-blue-600">
					<span class="material-icons text-xl">location_on</span>
				</div>
				<div class="font-medium text-xs text-center leading-tight">Wo steht geschrieben?</div>
				<div class="text-xs text-gray-500 mt-1 text-center">Verse zu Stellen</div>
			</button>

			<button
				onclick={() => startLearning('buch')}
				class="bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-black py-3 px-3 rounded-lg transition-colors duration-300 flex flex-col justify-center items-center"
			>
				<div class="flex justify-center mb-2 text-blue-600">
					<span class="material-icons text-xl">library_books</span>
				</div>
				<div class="font-medium text-xs text-center leading-tight">Was steht in…?</div>
				<div class="text-xs text-gray-500 mt-1 text-center">Verse in Büchern</div>
			</button>

			<button
				onclick={() => startLearning('thema')}
				class="bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-black py-3 px-3 rounded-lg transition-colors duration-300 flex flex-col justify-center items-center"
			>
				<div class="flex justify-center mb-2 text-blue-600">
					<span class="material-icons text-xl">label</span>
				</div>
				<div class="font-medium text-xs text-center leading-tight">Was sagt die Schrift zu…?</div>
				<div class="text-xs text-gray-500 mt-1 text-center">Verse zu Themen</div>
			</button>
		</div>
	</div>
</div>