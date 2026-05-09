<script lang="ts">
	import { db } from '$lib/db';
	import { verses } from '$lib/stores';
	import { parseAnkiFile } from '$lib/ankiImport';
	import BibelstellenEingabe from './BibelstellenEingabe.svelte';
	import type { Verse } from '$lib/db';

	interface Props {
		file: File;
		onclose: (result?: { imported: number; updated: number; skipped: number }) => void;
	}

	let { file, onclose }: Props = $props();

	// ── Phasen ────────────────────────────────────────────────────────────────
	type Phase = 'choose' | 'loading' | 'resolving' | 'done';
	type Mode  = 'auto' | 'manual';

	let phase        = $state<Phase>('choose');
	let mode         = $state<Mode>('auto');
	let progressText = $state('Starte Import...');
	let errorText    = $state('');

	// ── Review-Warteschlange ──────────────────────────────────────────────────
	interface ReviewCard {
		stelle: string | null;      // bereits erkannte Stelle (oder null)
		rawStelle: string;          // Original aus Anki
		partialVerse: Omit<Verse, 'stelle' | 'id'>;
	}

	let reviewQueue    = $state<ReviewCard[]>([]);
	let currentIndex   = $state(0);
	let confirmedStelle = $state<string | null>(null);  // vom BibelstellenEingabe
	let stelleError    = $state('');
	let resolvedCards  = $state<Omit<Verse, 'id'>[]>([]);
	let skippedCount   = $state(0);

	// ── Fertig-Phase ──────────────────────────────────────────────────────────
	let importedCount = $state(0);
	let updatedCount  = $state(0);

	// ── Import starten (nach Modusauswahl) ────────────────────────────────────
	async function startImport() {
		phase = 'loading';
		try {
			const result = await parseAnkiFile(file, (msg) => {
				progressText = msg;
			});

			if (mode === 'manual') {
				// Alle Karten manuell prüfen
				const all: ReviewCard[] = [
					...result.recognized.map(v => ({
						stelle: v.stelle,
						rawStelle: v.stelle,
						partialVerse: (({ stelle: _s, ...rest }) => rest)(v) as Omit<Verse, 'stelle' | 'id'>
					})),
					...result.unrecognized.map(u => ({
						stelle: null,
						rawStelle: u.rawStelle,
						partialVerse: u.partialVerse
					}))
				];
				if (all.length === 0) {
					await saveAllSafe();
					return;
				}
				reviewQueue  = all;
				currentIndex = 0;
				confirmedStelle = all[0].stelle;
				stelleError  = '';
				phase = 'resolving';
			} else {
				// Auto: erkannte direkt übernehmen, nur unklare prüfen
				resolvedCards = [...result.recognized];
				if (result.unrecognized.length === 0) {
					await saveAllSafe();
					return;
				}
				reviewQueue  = result.unrecognized.map(u => ({
					stelle: null,
					rawStelle: u.rawStelle,
					partialVerse: u.partialVerse
				}));
				currentIndex = 0;
				confirmedStelle = null;
				stelleError  = '';
				phase = 'resolving';
			}
		} catch (e) {
			errorText = e instanceof Error ? e.message : 'Unbekannter Fehler';
			phase = 'done';
		}
	}

	// ── Review-Aktionen ───────────────────────────────────────────────────────
	async function acceptCard() {
		if (!confirmedStelle) {
			stelleError = 'Bitte zuerst Buch und Kapitel wählen.';
			return;
		}
		stelleError = '';
		const card = reviewQueue[currentIndex];
		resolvedCards = [...resolvedCards, { stelle: confirmedStelle, ...card.partialVerse }];
		await nextCard();
	}

	async function skipCard() {
		skippedCount += 1;
		await nextCard();
	}

	async function nextCard() {
		if (currentIndex + 1 < reviewQueue.length) {
			currentIndex += 1;
			confirmedStelle = reviewQueue[currentIndex].stelle;
			stelleError = '';
		} else {
			await saveAllSafe();
		}
	}

	// ── Speichern ─────────────────────────────────────────────────────────────
	async function saveAllSafe() {
		try {
			await saveAll();
		} catch (e) {
			errorText = e instanceof Error ? e.message : 'Fehler beim Speichern';
			phase = 'done';
		}
	}

	// Svelte 5 $state-Proxies können nicht direkt in IndexedDB gespeichert werden.
	// Diese Funktion baut ein reines Plain-Objekt ohne Proxy-Wrapper.
	function ohneProxy(card: Partial<Verse>): Omit<Verse, 'id'> {
		return {
			stelle:      String(card.stelle ?? ''),
			text:        String(card.text ?? ''),
			tags:        Array.isArray(card.tags) ? [...(card.tags as string[])] : String(card.tags ?? ''),
			interval:    Number(card.interval ?? 0),
			easeFactor:  Number(card.easeFactor ?? 2.5),
			nextReview:  String(card.nextReview ?? new Date().toISOString()),
			lastReview:  card.lastReview ? String(card.lastReview) : undefined,
			reviewCount: Number(card.reviewCount ?? 0),
		};
	}

	async function saveAll() {
		phase = 'loading';
		progressText = 'Speichere Karten...';

		// Browser kurz rendern lassen bevor die DB-Arbeit beginnt
		await new Promise(r => setTimeout(r, 30));

		// Alle vorhandenen Verse in EINEM Scan holen – schneller als anyOf für viele Werte
		const alleVorhanden = await db.verse.toArray();
		const vorhandeneMap = new Map(alleVorhanden.map(v => [v.stelle, v.id!]));

		const neueKarten: Omit<Verse, 'id'>[] = [];
		const updateKarten: Verse[]            = [];

		for (const card of resolvedCards) {
			const plain = ohneProxy(card);
			const existingId = vorhandeneMap.get(plain.stelle);
			if (existingId !== undefined) {
				updateKarten.push({ ...plain, id: existingId });
			} else {
				neueKarten.push(plain);
			}
		}

		// Alles in einer einzigen Dexie-Transaktion – minimaler IndexedDB-Overhead
		await db.transaction('rw', db.verse, async () => {
			if (neueKarten.length > 0)   await db.verse.bulkAdd(neueKarten as Verse[]);
			if (updateKarten.length > 0) await db.verse.bulkPut(updateKarten);
		});

		const allVerses = await db.verse.toArray();
		verses.set(allVerses);

		importedCount = neueKarten.length;
		updatedCount  = updateKarten.length;
		phase = 'done';
	}

	let currentCard   = $derived(reviewQueue[currentIndex]);
	let isUnrecognized = $derived(currentCard?.stelle === null);
</script>

<!-- Backdrop -->
<div
	class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4"
	role="dialog"
	aria-modal="true"
>
	<div class="bg-zinc-900 w-full max-w-md rounded-3xl border border-zinc-800 p-6 space-y-5">

		<!-- ── Phase: Modus wählen ── -->
		{#if phase === 'choose'}
			<div class="flex items-center gap-3">
				<div class="bg-zinc-800 text-zinc-300 p-2 rounded-xl">
					<span class="material-icons text-xl">style</span>
				</div>
				<h3 class="text-white font-bold text-lg">Anki importieren</h3>
			</div>

			<p class="text-zinc-400 text-sm">Wie sollen die Karten aus <span class="text-white font-medium">{file.name}</span> importiert werden?</p>

			<!-- Option: Automatisch -->
			<button
				onclick={() => mode = 'auto'}
				class="w-full text-left p-4 rounded-2xl border-2 transition-all {mode === 'auto' ? 'border-red-500 bg-red-950/20' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'}"
			>
				<div class="flex items-center gap-3">
					<span class="material-icons {mode === 'auto' ? 'text-red-500' : 'text-zinc-500'}">bolt</span>
					<div>
						<p class="text-white font-semibold text-sm">Automatisch</p>
						<p class="text-zinc-400 text-xs mt-0.5">Erkannte Bibelstellen direkt übernehmen – nur unklare Verse manuell prüfen</p>
					</div>
				</div>
			</button>

			<!-- Option: Manuell -->
			<button
				onclick={() => mode = 'manual'}
				class="w-full text-left p-4 rounded-2xl border-2 transition-all {mode === 'manual' ? 'border-red-500 bg-red-950/20' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'}"
			>
				<div class="flex items-center gap-3">
					<span class="material-icons {mode === 'manual' ? 'text-red-500' : 'text-zinc-500'}">fact_check</span>
					<div>
						<p class="text-white font-semibold text-sm">Manuell prüfen</p>
						<p class="text-zinc-400 text-xs mt-0.5">Jeden Vers einzeln bestätigen oder korrigieren bevor er gespeichert wird</p>
					</div>
				</div>
			</button>

			<button
				onclick={startImport}
				class="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 px-4 rounded-2xl font-semibold text-sm transition-all shadow-sm shadow-red-900/30 flex items-center justify-center gap-2"
			>
				<span class="material-icons text-[18px]">arrow_forward</span>
				Weiter
			</button>

		<!-- ── Phase: Laden ── -->
		{:else if phase === 'loading'}
			<div class="flex flex-col items-center gap-5 py-6">
				<div class="w-12 h-12 border-4 border-zinc-700 border-t-red-500 rounded-full animate-spin"></div>
				<p class="text-white font-semibold text-center">{progressText}</p>
			</div>

		<!-- ── Phase: Verse prüfen ── -->
		{:else if phase === 'resolving' && currentCard}
			<!-- Header mit Fortschritt -->
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-white font-bold text-lg">
						{isUnrecognized ? 'Bibelstelle unklar' : 'Vers bestätigen'}
					</h3>
					{#if isUnrecognized}
						<p class="text-xs text-yellow-400 font-medium mt-0.5 flex items-center gap-1">
							<span class="material-icons text-[13px]">warning</span>
							Stelle konnte nicht erkannt werden
						</p>
					{/if}
				</div>
				<span class="text-xs text-zinc-500 font-medium bg-zinc-800 px-3 py-1 rounded-full shrink-0">
					{currentIndex + 1} / {reviewQueue.length}
				</span>
			</div>

			<!-- Bibeltext-Vorschau -->
			<div>
				<p class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Bibeltext</p>
				<p class="text-zinc-300 text-sm leading-relaxed bg-zinc-800 rounded-2xl px-4 py-3 line-clamp-4">
					{currentCard.partialVerse.text || '(kein Text)'}
				</p>
			</div>

			<!-- BibelstellenEingabe -->
			<div>
				<p class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
					Bibelstelle {isUnrecognized ? 'eingeben' : 'prüfen'}
				</p>
				{#key currentIndex}
					<BibelstellenEingabe
						initialStelle={currentCard.rawStelle}
						onAktualisiert={(s) => {
							confirmedStelle = s;
							if (s) stelleError = '';
						}}
					/>
				{/key}
				{#if stelleError}
					<p class="text-red-400 text-xs mt-2 flex items-center gap-1">
						<span class="material-icons text-[13px]">error</span>
						{stelleError}
					</p>
				{/if}
			</div>

			<!-- Aktions-Buttons -->
			<div class="grid grid-cols-2 gap-3 pt-1">
				<button
					onclick={skipCard}
					class="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 py-3 px-4 rounded-2xl font-semibold text-sm transition-all border border-zinc-700"
				>
					Verwerfen
				</button>
				<button
					onclick={acceptCard}
					class="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-2xl font-semibold text-sm transition-all shadow-sm shadow-red-900/30"
				>
					Übernehmen
				</button>
			</div>

		<!-- ── Phase: Fertig ── -->
		{:else if phase === 'done'}
			{#if errorText}
				<div class="flex flex-col items-center gap-4 py-4">
					<div class="bg-red-900/20 text-red-500 p-3 rounded-2xl">
						<span class="material-icons text-3xl">error_outline</span>
					</div>
					<h3 class="text-white font-bold text-lg">Import fehlgeschlagen</h3>
					<p class="text-zinc-400 text-sm text-center">{errorText}</p>
					<button
						onclick={() => onclose()}
						class="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 px-4 rounded-2xl font-semibold text-sm transition-all border border-zinc-700"
					>
						Schließen
					</button>
				</div>
			{:else}
				<div class="flex flex-col items-center gap-4 py-4">
					<div class="bg-green-900/20 text-green-500 p-3 rounded-2xl">
						<span class="material-icons text-3xl">check_circle</span>
					</div>
					<h3 class="text-white font-bold text-lg">Import abgeschlossen</h3>

					<div class="w-full grid grid-cols-3 gap-3">
						<div class="bg-zinc-800 rounded-2xl p-3 text-center border border-zinc-700">
							<p class="text-2xl font-bold text-green-400">{importedCount}</p>
							<p class="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mt-1">Neu</p>
						</div>
						<div class="bg-zinc-800 rounded-2xl p-3 text-center border border-zinc-700">
							<p class="text-2xl font-bold text-blue-400">{updatedCount}</p>
							<p class="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mt-1">Aktualisiert</p>
						</div>
						<div class="bg-zinc-800 rounded-2xl p-3 text-center border border-zinc-700">
							<p class="text-2xl font-bold text-zinc-500">{skippedCount}</p>
							<p class="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mt-1">Verworfen</p>
						</div>
					</div>

					<button
						onclick={() => onclose({ imported: importedCount, updated: updatedCount, skipped: skippedCount })}
						class="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 px-4 rounded-2xl font-semibold text-sm transition-all shadow-sm shadow-red-900/30"
					>
						Fertig
					</button>
				</div>
			{/if}
		{/if}

	</div>
</div>
