<script lang="ts">
	import StatsGrid from '$lib/components/StatsGrid.svelte';
	import { verses } from '$lib/stores';
	import { derived } from 'svelte/store';
	import { goto } from '$app/navigation';

	function berechneSerie(verses: { lastReview?: string }[]): number {
		// Sammle alle einzigartigen Tage an denen gelernt wurde
		const tageSet = new Set<string>();
		for (const v of verses) {
			if (v.lastReview) {
				const d = new Date(v.lastReview);
				d.setHours(0, 0, 0, 0);
				tageSet.add(d.toISOString());
			}
		}
		if (tageSet.size === 0) return 0;

		// Sortiere absteigend
		const tage = [...tageSet].map(s => new Date(s)).sort((a, b) => b.getTime() - a.getTime());

		const heute = new Date();
		heute.setHours(0, 0, 0, 0);
		const gestern = new Date(heute);
		gestern.setDate(gestern.getDate() - 1);

		// Serie startet nur wenn heute oder gestern gelernt wurde
		if (tage[0].getTime() !== heute.getTime() && tage[0].getTime() !== gestern.getTime()) {
			return 0;
		}

		let serie = 1;
		for (let i = 1; i < tage.length; i++) {
			const erwartet = new Date(tage[i - 1]);
			erwartet.setDate(erwartet.getDate() - 1);
			if (tage[i].getTime() === erwartet.getTime()) {
				serie++;
			} else {
				break;
			}
		}
		return serie;
	}

	const stats = derived(verses, $verses => {
		const heute = new Date();
		heute.setHours(0, 0, 0, 0);
		const tagesende = new Date();
		tagesende.setHours(23, 59, 59, 999);

		const faellig = $verses.filter(v => {
			const next = v.nextReview ? new Date(v.nextReview) : new Date();
			return next <= tagesende;
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
			serie: berechneSerie($verses)
		};
	});

	function startLearning(mode: 'gemischt' | 'stelle' | 'vers' | 'buch' | 'thema') {
		goto(`/learn?mode=${mode}`);
	}
</script>

<div class="min-h-screen bg-black flex flex-col pb-20 pt-[env(safe-area-inset-top)]">
	<!-- Header Section -->
	<div class="px-5 pt-8 pb-2">
		<h1 class="text-4xl font-black text-red-600 tracking-tighter">ReBible</h1>
	</div>

	<!-- Stats Section -->
	<div class="px-4 mt-2 mb-4">
		<StatsGrid stats={$stats} />
	</div>

	<!-- Main learning button -->
	<div class="px-4 mb-4">
		<button
			onclick={() => startLearning('gemischt')}
			class="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-4 px-5 rounded-2xl shadow-sm transition-all duration-200 flex items-center justify-between group"
		>
			<div class="flex items-center gap-3">
				<div class="bg-black/20 p-2 rounded-xl">
					<span class="material-icons text-white">play_arrow</span>
				</div>
				<div class="text-left">
					<div class="text-lg">Tägliches Training</div>
					<div class="text-red-100 text-xs font-normal">Dein personalisierter Lernplan</div>
				</div>
			</div>
			<span class="material-icons text-white/70 group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
		</button>
	</div>

	<!-- Learning mode buttons -->
	<div class="px-4 flex-1">
		<h3 class="text-xs font-semibold text-zinc-500 mb-3 px-1 uppercase tracking-wider">Gezieltes Lernen</h3>
		<div class="grid grid-cols-2 gap-3">
			<button
				onclick={() => startLearning('stelle')}
				class="bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-800 hover:border-zinc-700 active:scale-95 transition-all duration-200 flex flex-col items-start text-left"
			>
				<div class="text-white mb-2">
					<span class="material-icons">format_quote</span>
				</div>
				<div class="font-bold text-white mb-1 text-lg">Text</div>
				<div class="text-[11px] text-zinc-400 font-medium leading-snug">Trainiere den Verstext zur Bibelstelle</div>
			</button>

			<button
				onclick={() => startLearning('vers')}
				class="bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-800 hover:border-zinc-700 active:scale-95 transition-all duration-200 flex flex-col items-start text-left"
			>
				<div class="text-white mb-2">
					<span class="material-icons">explore</span>
				</div>
				<div class="font-bold text-white mb-1 text-lg">Stelle</div>
				<div class="text-[11px] text-zinc-400 font-medium leading-snug">Trainiere die Bibelstelle zum Verstext</div>
			</button>

			<button
				onclick={() => startLearning('buch')}
				class="bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-800 hover:border-zinc-700 active:scale-95 transition-all duration-200 flex flex-col items-start text-left"
			>
				<div class="text-white mb-2">
					<span class="material-icons">auto_stories</span>
				</div>
				<div class="font-bold text-white mb-1 text-lg">Buch</div>
				<div class="text-[11px] text-zinc-400 font-medium leading-snug">Vertiefe die Verse im Kontext des Bibelbuchs</div>
			</button>

			<button
				onclick={() => startLearning('thema')}
				class="bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-800 hover:border-zinc-700 active:scale-95 transition-all duration-200 flex flex-col items-start text-left"
			>
				<div class="text-white mb-2">
					<span class="material-icons">category</span>
				</div>
				<div class="font-bold text-white mb-1 text-lg">Thema</div>
				<div class="text-[11px] text-zinc-400 font-medium leading-snug">Vertiefe gezielt Verse zu einem bestimmten Thema</div>
			</button>
		</div>
	</div>
</div>