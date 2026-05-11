<script lang="ts">
	import StatsGrid from '$lib/components/StatsGrid.svelte';
	import { verses } from '$lib/stores';
	import { BUECHER } from '$lib/bible';
	import { derived } from 'svelte/store';
	import { goto } from '$app/navigation';

	function berechneSerie(verses: { lastReview?: string }[]): number {
		const tageSet = new Set<string>();
		for (const v of verses) {
			if (v.lastReview) {
				const d = new Date(v.lastReview);
				d.setHours(0, 0, 0, 0);
				tageSet.add(d.toISOString());
			}
		}
		if (tageSet.size === 0) return 0;
		const tage = [...tageSet].map(s => new Date(s)).sort((a, b) => b.getTime() - a.getTime());
		const heute = new Date(); heute.setHours(0, 0, 0, 0);
		const gestern = new Date(heute); gestern.setDate(gestern.getDate() - 1);
		if (tage[0].getTime() !== heute.getTime() && tage[0].getTime() !== gestern.getTime()) return 0;
		let serie = 1;
		for (let i = 1; i < tage.length; i++) {
			const erwartet = new Date(tage[i - 1]);
			erwartet.setDate(erwartet.getDate() - 1);
			if (tage[i].getTime() === erwartet.getTime()) serie++;
			else break;
		}
		return serie;
	}

	const stats = derived(verses, $verses => {
		const heute = new Date(); heute.setHours(0, 0, 0, 0);
		const tagesende = new Date(); tagesende.setHours(23, 59, 59, 999);
		const faellig = $verses.filter(v => {
			const next = v.nextReview ? new Date(v.nextReview) : new Date();
			return next <= tagesende;
		});
		const gelerntHeute = $verses.filter(v => {
			if (!v.lastReview) return false;
			const lastDate = new Date(v.lastReview); lastDate.setHours(0, 0, 0, 0);
			return lastDate.getTime() === heute.getTime();
		}).length;
		return { gesamt: $verses.length, faellig: faellig.length, gelerntHeute, serie: berechneSerie($verses) };
	});

	// Vers-Anzahl pro Bibelbuch
	const buchDaten = derived(verses, $verses => {
		const daten = BUECHER.map((buch, i) => {
			const count = $verses.filter(v => {
				// Stelle beginnt mit Buchname gefolgt von Leerzeichen oder Komma
				const rest = v.stelle.slice(buch.name.length);
				return v.stelle.startsWith(buch.name) && (rest === '' || /^[\s,:]/.test(rest));
			}).length;
			return { name: buch.name, kurz: buch.kurz[0], count, istNT: i >= 39 };
		});
		const maxCount = Math.max(1, ...daten.map(d => d.count));
		return { daten, maxCount };
	});

	function startLearning(mode: 'gemischt' | 'stelle' | 'vers' | 'buch' | 'thema') {
		goto(`/learn?mode=${mode}`);
	}

	// SVG-Konstanten für das Diagramm
	const BAR_W = 7;      // Balkenbreite
	const GAP = 1;        // Abstand
	const SLOT = BAR_W + GAP;  // 8 Einheiten pro Buch
	const CHART_W = 66 * SLOT; // 528 Einheiten gesamt
	const BAR_MAX = 55;   // Max Balkenhöhe in Einheiten
	const BAR_BASE = 60;  // Y-Position der Basis-Linie
	const LABEL_H = 32;   // Höhe für Beschriftung (Einheiten)
	const TOTAL_H = BAR_BASE + LABEL_H;  // 92
</script>

<div class="min-h-screen bg-black flex flex-col pb-20 pt-[env(safe-area-inset-top)]">
	<!-- Header -->
	<div class="px-5 pt-8 pb-2">
		<h1 class="text-4xl font-black text-red-600 tracking-tighter">ReBible</h1>
	</div>

	<!-- Stats -->
	<div class="px-4 mt-2 mb-4">
		<StatsGrid stats={$stats} />
	</div>

	<!-- Bibelbücher-Diagramm -->
	<div class="px-4 mb-4">
		<div class="bg-zinc-900 border border-zinc-800 rounded-2xl px-3 pt-3 pb-2 overflow-hidden">
			<div class="flex items-center justify-between mb-2">
				<span class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Abdeckung der Bibelbücher</span>
				<span class="text-[10px] font-bold text-zinc-600">{$buchDaten.daten.filter(d => d.count > 0).length}/66</span>
			</div>
			<svg
				viewBox="0 0 {CHART_W} {TOTAL_H}"
				class="w-full"
				xmlns="http://www.w3.org/2000/svg"
				style="display: block"
			>
				<!-- AT/NT Trennlinie -->
				<line
					x1={39 * SLOT - 0.5} y1="0"
					x2={39 * SLOT - 0.5} y2={BAR_BASE}
					stroke="#3f3f46" stroke-width="0.5" stroke-dasharray="2,2"
				/>
				<!-- AT Label -->
				<text x={19 * SLOT} y="5" text-anchor="middle" font-size="4" fill="#52525b" font-weight="700" font-family="system-ui">AT</text>
				<!-- NT Label -->
				<text x={(39 + 13) * SLOT} y="5" text-anchor="middle" font-size="4" fill="#52525b" font-weight="700" font-family="system-ui">NT</text>

				{#each $buchDaten.daten as buch, i}
					{@const x = i * SLOT}
					{@const barH = buch.count > 0 ? Math.max(3, Math.round((buch.count / $buchDaten.maxCount) * BAR_MAX)) : 2}
					{@const barY = BAR_BASE - barH}
					{@const cx = x + BAR_W / 2}

					<!-- Balken -->
					<rect
						x={x}
						y={barY}
						width={BAR_W}
						height={barH}
						rx="1"
						fill={buch.count > 0 ? (buch.istNT ? '#16a34a' : '#22c55e') : '#27272a'}
					/>

					<!-- Anzahl-Badge (nur wenn Verse vorhanden) -->
					{#if buch.count > 0}
						<text
							x={cx}
							y={barY - 1}
							text-anchor="middle"
							font-size="3.5"
							fill="#a1a1aa"
							font-family="system-ui"
							font-weight="600"
						>{buch.count}</text>
					{/if}

					<!-- Buchkürzel (vertikal, von oben nach unten) -->
					<text
						transform="translate({cx}, {BAR_BASE + 2}) rotate(90)"
						text-anchor="start"
						font-size="4.5"
						fill={buch.count > 0 ? '#71717a' : '#3f3f46'}
						font-family="system-ui"
						font-weight={buch.count > 0 ? '700' : '400'}
					>{buch.kurz}</text>
				{/each}

				<!-- Basislinie -->
				<line x1="0" y1={BAR_BASE} x2={CHART_W} y2={BAR_BASE} stroke="#3f3f46" stroke-width="0.5" />
			</svg>
		</div>
	</div>

	<!-- Hauptlern-Button -->
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

	<!-- Lernmodi -->
	<div class="px-4 flex-1">
		<h3 class="text-xs font-semibold text-zinc-500 mb-3 px-1 uppercase tracking-wider">Gezieltes Lernen</h3>
		<div class="grid grid-cols-2 gap-3">
			<button onclick={() => startLearning('stelle')} class="bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-800 hover:border-zinc-700 active:scale-95 transition-all duration-200 flex flex-col items-start text-left">
				<div class="text-white mb-2"><span class="material-icons">format_quote</span></div>
				<div class="font-bold text-white mb-1 text-lg">Text</div>
				<div class="text-[11px] text-zinc-400 font-medium leading-snug">Trainiere den Verstext zur Bibelstelle</div>
			</button>
			<button onclick={() => startLearning('vers')} class="bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-800 hover:border-zinc-700 active:scale-95 transition-all duration-200 flex flex-col items-start text-left">
				<div class="text-white mb-2"><span class="material-icons">explore</span></div>
				<div class="font-bold text-white mb-1 text-lg">Stelle</div>
				<div class="text-[11px] text-zinc-400 font-medium leading-snug">Trainiere die Bibelstelle zum Verstext</div>
			</button>
			<button onclick={() => startLearning('buch')} class="bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-800 hover:border-zinc-700 active:scale-95 transition-all duration-200 flex flex-col items-start text-left">
				<div class="text-white mb-2"><span class="material-icons">auto_stories</span></div>
				<div class="font-bold text-white mb-1 text-lg">Buch</div>
				<div class="text-[11px] text-zinc-400 font-medium leading-snug">Vertiefe die Verse im Kontext des Bibelbuchs</div>
			</button>
			<button onclick={() => startLearning('thema')} class="bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-800 hover:border-zinc-700 active:scale-95 transition-all duration-200 flex flex-col items-start text-left">
				<div class="text-white mb-2"><span class="material-icons">category</span></div>
				<div class="font-bold text-white mb-1 text-lg">Thema</div>
				<div class="text-[11px] text-zinc-400 font-medium leading-snug">Vertiefe gezielt Verse zu einem bestimmten Thema</div>
			</button>
		</div>
	</div>
</div>
