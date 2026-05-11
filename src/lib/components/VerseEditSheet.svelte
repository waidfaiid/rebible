<script lang="ts">
	import type { Verse } from '$lib/db';
	import { calculateSM2 } from '$lib/spacedRepetition';

	let {
		verse,
		onclose,
		onsave
	}: {
		verse: Verse;
		onclose: () => void;
		onsave: (updated: Verse) => void;
	} = $props();

	let efValue = $state(2.5);
	let intervalValue = $state(1);
	let reviewCountValue = $state(0);
	let nextReviewValue = $state('');
	let lastReviewValue = $state('');

	$effect(() => {
		efValue = verse.easeFactor ?? 2.5;
		intervalValue = verse.interval ?? 1;
		reviewCountValue = verse.reviewCount ?? 0;
		nextReviewValue = verse.nextReview ? verse.nextReview.slice(0, 10) : new Date().toISOString().slice(0, 10);
		lastReviewValue = verse.lastReview ? verse.lastReview.slice(0, 10) : '';
	});

	let simVorschau = $state<{ easeFactor: number; interval: number; nextReview: string } | null>(null);

	function simGrade(grade: number) {
		simVorschau = calculateSM2(
			{ ...verse, easeFactor: efValue, interval: intervalValue, reviewCount: reviewCountValue },
			grade
		);
	}

	function simUebernehmen() {
		if (!simVorschau) return;
		efValue = Math.round(simVorschau.easeFactor * 100) / 100;
		intervalValue = simVorschau.interval;
		nextReviewValue = simVorschau.nextReview.slice(0, 10);
		reviewCountValue += 1;
		simVorschau = null;
	}

	function zuruecksetzen() {
		efValue = 2.5;
		intervalValue = 1;
		reviewCountValue = 0;
		const morgen = new Date();
		morgen.setDate(morgen.getDate() + 1);
		nextReviewValue = morgen.toISOString().slice(0, 10);
		lastReviewValue = '';
		simVorschau = null;
	}

	function speichern() {
		onsave({
			...verse,
			easeFactor: Math.round(efValue * 100) / 100,
			interval: intervalValue,
			reviewCount: reviewCountValue,
			nextReview: new Date(nextReviewValue + 'T12:00:00').toISOString(),
			lastReview: lastReviewValue ? new Date(lastReviewValue + 'T12:00:00').toISOString() : verse.lastReview
		});
	}

	const gradeLabels = ['Falsch', 'Knapp', 'Schwer', 'OK', 'Leicht'];
	const gradeColors = [
		'bg-red-700 hover:bg-red-600',
		'bg-orange-700 hover:bg-orange-600',
		'bg-yellow-700 hover:bg-yellow-600',
		'bg-blue-700 hover:bg-blue-600',
		'bg-green-700 hover:bg-green-600'
	];

	function efFarbe(ef: number) {
		if (ef < 1.8) return 'text-red-400';
		if (ef < 2.3) return 'text-yellow-400';
		return 'text-green-400';
	}

	function efBalkenBreite(ef: number) {
		return Math.round(((ef - 1.3) / (3.5 - 1.3)) * 100);
	}
</script>

<!-- Backdrop -->
<div
	class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
	onclick={onclose}
	role="button"
	tabindex="-1"
	onkeydown={(e) => e.key === 'Escape' && onclose()}
></div>

<!--
  Sheet: ein einziger overflow-y-auto-Container.
  Kein verschachtelter Scroll — header und footer kleben mit sticky top-0 / bottom-0.
  Das funktioniert zuverlässig auf iOS Safari.
-->
<div class="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 rounded-t-3xl border-t border-zinc-800 shadow-2xl overflow-y-auto" style="max-height: 90vh">

	<!-- Sticky Header -->
	<div class="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 flex flex-col items-center pt-3 pb-4 px-5">
		<div class="w-10 h-1 bg-zinc-700 rounded-full mb-4"></div>
		<div class="flex items-start justify-between w-full gap-3">
			<button
				onclick={onclose}
				class="text-zinc-400 hover:text-white active:scale-95 transition-all p-1.5 rounded-xl hover:bg-zinc-800 shrink-0"
			>
				<span class="material-icons">arrow_back</span>
			</button>
			<div class="flex-1 min-w-0">
				<div class="text-white font-bold text-xl leading-tight">{verse.stelle}</div>
				<div class="text-zinc-400 text-sm mt-1 line-clamp-2">{verse.text}</div>
			</div>
			<button
				onclick={onclose}
				class="text-zinc-500 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors shrink-0"
			>
				<span class="material-icons">close</span>
			</button>
		</div>
	</div>

	<!-- Scrollbarer Inhalt -->
	<div class="px-5 py-4 space-y-5">

		<!-- EaseFactor -->
		<div class="bg-zinc-800 rounded-2xl p-4 space-y-3">
			<div class="flex justify-between items-center">
				<div>
					<div class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Ease Factor (SM-2)</div>
					<div class="text-xs text-zinc-500 mt-0.5">1.3 = schwer · 2.5 = normal · 3.5 = leicht</div>
				</div>
				<span class="text-xl font-bold {efFarbe(efValue)}">{efValue.toFixed(2)}</span>
			</div>
			<div class="relative h-2.5 bg-zinc-700 rounded-full overflow-hidden">
				<div
					class="absolute left-0 top-0 h-full rounded-full transition-all duration-200"
					class:bg-red-500={efValue < 1.8}
					class:bg-yellow-500={efValue >= 1.8 && efValue < 2.3}
					class:bg-green-500={efValue >= 2.3}
					style="width: {efBalkenBreite(efValue)}%"
				></div>
			</div>
			<input
				type="range" min="1.3" max="3.5" step="0.01"
				bind:value={efValue}
				class="w-full accent-red-600 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
			/>
			<div class="flex justify-between text-[10px] text-zinc-600 font-medium">
				<span>1.30</span><span>2.50</span><span>3.50</span>
			</div>
		</div>

		<!-- Intervall -->
		<div class="bg-zinc-800 rounded-2xl p-4 space-y-3">
			<div class="flex justify-between items-center">
				<div>
					<div class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Intervall</div>
					<div class="text-xs text-zinc-500 mt-0.5">Tage bis zur nächsten Wiederholung</div>
				</div>
				<span class="text-xl font-bold text-white">{intervalValue}d</span>
			</div>
			<input
				type="range" min="1" max="365" step="1"
				bind:value={intervalValue}
				class="w-full accent-red-600 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
			/>
			<div class="flex justify-between text-[10px] text-zinc-600 font-medium">
				<span>1 Tag</span><span>30 Tage</span><span>365 Tage</span>
			</div>
		</div>

		<!-- Wiederholungen + Daten -->
		<div class="bg-zinc-800 rounded-2xl p-4 space-y-4">
			<div class="flex justify-between items-center">
				<div>
					<div class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Wiederholungen</div>
					<div class="text-xs text-zinc-500 mt-0.5">reviewCount</div>
				</div>
				<div class="flex items-center gap-3">
					<button
						onclick={() => reviewCountValue = Math.max(0, reviewCountValue - 1)}
						class="w-9 h-9 bg-zinc-700 hover:bg-zinc-600 active:scale-95 rounded-xl text-white font-bold transition-all flex items-center justify-center"
					>
						<span class="material-icons text-base">remove</span>
					</button>
					<span class="text-white font-bold text-lg w-8 text-center">{reviewCountValue}</span>
					<button
						onclick={() => reviewCountValue += 1}
						class="w-9 h-9 bg-zinc-700 hover:bg-zinc-600 active:scale-95 rounded-xl text-white font-bold transition-all flex items-center justify-center"
					>
						<span class="material-icons text-base">add</span>
					</button>
				</div>
			</div>

			<div class="h-px bg-zinc-700"></div>

			<div>
				<label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">Nächste Wiederholung</label>
				<input
					type="date" bind:value={nextReviewValue}
					class="w-full bg-zinc-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium border border-zinc-600 focus:outline-none focus:border-zinc-400 transition-colors"
				/>
			</div>

			<div>
				<label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">Letzte Wiederholung</label>
				<input
					type="date" bind:value={lastReviewValue}
					class="w-full bg-zinc-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium border border-zinc-600 focus:outline-none focus:border-zinc-400 transition-colors"
				/>
			</div>
		</div>

		<!-- SM-2 Simulator -->
		<div class="bg-zinc-800 rounded-2xl p-4 space-y-3">
			<div class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">SM-2 Schritt simulieren</div>
			<div class="text-xs text-zinc-500">Wie würde sich ein Bewertungsklick auf die Werte auswirken?</div>
			<div class="grid grid-cols-5 gap-1.5">
				{#each gradeLabels as label, i}
					<button
						onclick={() => simGrade(i)}
						class="py-2 px-1 rounded-xl text-white text-xs font-bold transition-all active:scale-95 {gradeColors[i]}"
					>
						{i}<br/><span class="text-[10px] font-normal opacity-80">{label}</span>
					</button>
				{/each}
			</div>

			{#if simVorschau}
				<div class="bg-zinc-700 rounded-xl p-3 space-y-2">
					<div class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Vorschau nach diesem Schritt:</div>
					<div class="grid grid-cols-3 gap-2 text-center">
						<div>
							<div class="text-[10px] text-zinc-500 uppercase">EF</div>
							<div class="text-sm font-bold {efFarbe(simVorschau.easeFactor)}">{simVorschau.easeFactor.toFixed(2)}</div>
						</div>
						<div>
							<div class="text-[10px] text-zinc-500 uppercase">Intervall</div>
							<div class="text-sm font-bold text-white">{simVorschau.interval}d</div>
						</div>
						<div>
							<div class="text-[10px] text-zinc-500 uppercase">Nächste</div>
							<div class="text-sm font-bold text-white">{new Date(simVorschau.nextReview).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</div>
						</div>
					</div>
					<button
						onclick={simUebernehmen}
						class="w-full bg-red-700 hover:bg-red-600 active:scale-95 text-white py-2 rounded-xl text-sm font-bold transition-all"
					>
						Übernehmen
					</button>
				</div>
			{/if}
		</div>

		<!-- Abstand damit der sticky Footer den Inhalt nicht überdeckt -->
		<div class="h-24"></div>
	</div>

	<!-- Sticky Footer -->
	<div class="sticky bottom-0 z-10 bg-zinc-900 border-t border-zinc-800 px-5 pt-3 pb-5">
		<div class="grid grid-cols-2 gap-3">
			<button
				onclick={zuruecksetzen}
				class="py-3.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 rounded-2xl font-semibold transition-all text-sm border border-zinc-700 flex items-center justify-center gap-2"
			>
				<span class="material-icons text-base">restart_alt</span>
				Zurücksetzen
			</button>
			<button
				onclick={speichern}
				class="py-3.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-2xl font-bold transition-all text-sm"
			>
				Speichern
			</button>
		</div>
	</div>

</div>
