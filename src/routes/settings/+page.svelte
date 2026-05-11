<script lang="ts">
	import { db } from '$lib/db';
	import { verses, toastMessage, tippWoerter, sprechRate, frageFontSize, frageGroesse, showDaysOnButtons } from '$lib/stores';
	import { betaVerses } from '$lib/betaVerse';
	import type { Verse } from '$lib/db';
	import AnkiImportModal from '$lib/components/AnkiImportModal.svelte';

	let ankiFile = $state<File | null>(null);

	let loeschBestaetigung = $state(false);

	// Einstellungs-Werte aus Stores lesen
	let tippAnzahl = $state(5);
	let geschwindigkeit = $state(1.0);
	let maxWordsMode2 = $state(30);
	let fontSizeValue = $state(1.8);
	let frageGroesseValue = $state(1.5);
	let showDays = $state(true);
	tippWoerter.subscribe(v => tippAnzahl = v);
	sprechRate.subscribe(v => geschwindigkeit = v);
	frageFontSize.subscribe(v => fontSizeValue = v);
	frageGroesse.subscribe(v => frageGroesseValue = v);
	showDaysOnButtons.subscribe(v => showDays = v);

	import { onMount } from 'svelte';
	onMount(() => {
		const storedMaxWords = localStorage.getItem('rebible_max_words_mode2_v2');
		if (storedMaxWords) {
			maxWordsMode2 = parseInt(storedMaxWords, 10);
		}
	});

	function showToast(msg: string, durationMs = 3000) {
		toastMessage.set(msg);
		setTimeout(() => toastMessage.set(null), durationMs);
	}

	// --- Export ---
	async function exportDaten() {
		const allVerses = await db.verse.toArray();
		const json = JSON.stringify(allVerses, null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `rebible-export-${new Date().toISOString().slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(url);
		showToast(`${allVerses.length} Verse exportiert`);
	}

	// --- Import ---
	async function importDaten(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		try {
			const text = await file.text();
			const data = JSON.parse(text) as Verse[];
			if (!Array.isArray(data)) throw new Error('Ungültiges Format');

			// Strip IDs so Dexie creates new ones (avoids conflicts)
			const cleaned = data.map(({ id: _id, ...rest }) => ({
				...rest,
				reviewCount: rest.reviewCount ?? 0
			}));

			await db.verse.bulkAdd(cleaned as Verse[]);
			const allVerses = await db.verse.toArray();
			verses.set(allVerses);
			showToast(`${cleaned.length} Verse importiert`);
		} catch (e) {
			showToast('Fehler beim Import – Datei ungültig');
		}
		input.value = '';
	}

	// --- Anki Import ---
	function ankiImportGewaehlt(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) ankiFile = file;
		input.value = '';
	}

	function ankiImportFertig(result?: { imported: number; updated: number; skipped: number }) {
		ankiFile = null;
		if (result) {
			showToast(`${result.imported} neu, ${result.updated} aktualisiert, ${result.skipped} übersprungen`);
		}
	}

	// --- Alle Daten löschen ---
	async function alleDatenLoeschen() {
		await db.verse.clear();
		verses.set([]);
		loeschBestaetigung = false;
		showToast('Alle Verse gelöscht');
	}

	// --- Testdaten laden ---
	async function testdatenLaden() {
		await db.verse.clear();
		await db.verse.bulkAdd(betaVerses as Verse[]);
		const allVerses = await db.verse.toArray();
		verses.set(allVerses);
		showToast(`${betaVerses.length} Testverse geladen`);
	}
</script>

<div class="h-full bg-black flex flex-col overflow-hidden relative">
	<!-- Header -->
	<div class="px-5 pt-8 pb-4 shrink-0 bg-black z-10">
		<h2 class="text-3xl font-bold text-white tracking-tight">Einstellungen</h2>
	</div>

	<!-- Content -->
	<div class="flex-1 px-5 py-2 overflow-y-auto pb-40">
		<div class="max-w-md mx-auto space-y-4">

			<!-- Lern-Einstellungen -->
			<div class="bg-zinc-900 rounded-3xl shadow-sm border border-zinc-800 p-6 space-y-6">
				<div class="flex items-center gap-3 mb-2">
					<div class="bg-zinc-800 text-zinc-300 p-2 rounded-xl">
						<span class="material-icons text-xl">tune</span>
					</div>
					<h3 class="font-bold text-white text-lg">Lern-Einstellungen</h3>
				</div>

				<!-- Tipp-Wörter -->
				<div>
					<div class="flex justify-between items-center mb-3">
						<label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider" for="tipp-slider">Tipp-Länge (Wörter)</label>
						<span class="bg-zinc-800 text-white px-3 py-1 rounded-full text-sm font-bold">{tippAnzahl}</span>
					</div>
					<input
						id="tipp-slider"
						type="range"
						min="2"
						max="12"
						step="1"
						bind:value={tippAnzahl}
						oninput={() => tippWoerter.set(tippAnzahl)}
						class="w-full accent-red-600 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
					/>
					<div class="flex justify-between text-xs text-zinc-500 mt-2 font-medium">
						<span>Kurz (2)</span>
						<span>Lang (12)</span>
					</div>
				</div>

				<div class="h-px bg-zinc-800 w-full my-6"></div>

				<!-- Max Wörter Modus 2 -->
				<div>
					<div class="flex justify-between items-center mb-3">
						<label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider" for="max-words-slider">Max. Wörter (Modus Stelle)</label>
						<span class="bg-zinc-800 text-white px-3 py-1 rounded-full text-sm font-bold">{maxWordsMode2}</span>
					</div>
					<input
						id="max-words-slider"
						type="range"
						min="10"
						max="200"
						step="1"
						bind:value={maxWordsMode2}
						oninput={() => localStorage.setItem('rebible_max_words_mode2_v2', maxWordsMode2.toString())}
						class="w-full accent-red-600 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
					/>
					<div class="flex justify-between text-xs text-zinc-500 mt-2 font-medium">
						<span>Kurz (10)</span>
						<span>Lang (200)</span>
					</div>
					<p class="text-xs text-zinc-500 mt-3 font-medium">Kürzt lange Verse in der Frage-Ansicht nach dieser Anzahl an Wörtern.</p>
				</div>

				<div class="h-px bg-zinc-800 w-full my-6"></div>

				<!-- Schriftgröße der Vers-Texte (Antwort) -->
				<div>
					<div class="flex justify-between items-center mb-3">
						<label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider" for="font-size-slider">Schriftgröße Vers-Text (Antwort)</label>
						<span class="bg-zinc-800 text-white px-3 py-1 rounded-full text-sm font-bold">{fontSizeValue.toFixed(1)}</span>
					</div>
					<input
						id="font-size-slider"
						type="range"
						min="1.0"
						max="3.0"
						step="0.1"
						bind:value={fontSizeValue}
						oninput={() => frageFontSize.set(fontSizeValue)}
						class="w-full accent-red-600 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
					/>
					<div class="flex justify-between text-xs text-zinc-500 mt-2 font-medium">
						<span>Klein</span>
						<span>Groß</span>
					</div>
					<p class="text-xs text-zinc-500 mt-3 font-medium">Gilt für den aufgedeckten Vers-Text in allen Modi.</p>
				</div>

				<div class="h-px bg-zinc-800 w-full my-6"></div>

				<!-- Schriftgröße der Fragen (Modus 1, 3, 4) -->
				<div>
					<div class="flex justify-between items-center mb-3">
						<label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider" for="frage-size-slider">Schriftgröße Fragen (Modus 1, 3, 4)</label>
						<span class="bg-zinc-800 text-white px-3 py-1 rounded-full text-sm font-bold">{frageGroesseValue.toFixed(1)}</span>
					</div>
					<input
						id="frage-size-slider"
						type="range"
						min="1.0"
						max="3.0"
						step="0.1"
						bind:value={frageGroesseValue}
						oninput={() => frageGroesse.set(frageGroesseValue)}
						class="w-full accent-red-600 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
					/>
					<div class="flex justify-between text-xs text-zinc-500 mt-2 font-medium">
						<span>Klein</span>
						<span>Groß</span>
					</div>
					<p class="text-xs text-zinc-500 mt-3 font-medium">Gilt für die Frage-Anzeige in Modus 1 (Bibelstelle), 3 (Buch) und 4 (Thema) – also was du erkennen oder auswendig wissen musst.</p>
				</div>

				<div class="h-px bg-zinc-800 w-full my-6"></div>

				<!-- Tage-Anzeige auf Bewertungsbuttons -->
				<div class="flex items-center justify-between">
					<div>
						<div class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Tage auf Bewertungsbuttons</div>
						<p class="text-xs text-zinc-500 font-medium">Zeigt an, in wie viel Tagen ein Vers bei jeweiliger Bewertung erneut abgefragt wird.</p>
					</div>
					<button
						onclick={() => { showDays = !showDays; showDaysOnButtons.set(showDays); }}
						aria-label="Tage-Anzeige {showDays ? 'deaktivieren' : 'aktivieren'}"
						class="ml-4 shrink-0 w-12 h-6 rounded-full transition-all duration-200 relative {showDays ? 'bg-red-600' : 'bg-zinc-700'}"
					>
						<span class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 {showDays ? 'left-6' : 'left-0.5'}"></span>
					</button>
				</div>

				<!-- Sprechgeschwindigkeit -->
				<div>
					<div class="flex justify-between items-center mb-3">
						<label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider" for="speech-slider">Sprechgeschwindigkeit</label>
						<span class="bg-zinc-800 text-white px-3 py-1 rounded-full text-sm font-bold">
							{geschwindigkeit.toFixed(1)}×
						</span>
					</div>
					<input
						id="speech-slider"
						type="range"
						min="0.5"
						max="2.0"
						step="0.1"
						bind:value={geschwindigkeit}
						oninput={() => sprechRate.set(geschwindigkeit)}
						class="w-full accent-red-600 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
					/>
					<div class="flex justify-between text-xs text-zinc-500 mt-2 font-medium">
						<span>Langsam</span>
						<span>Schnell</span>
					</div>
				</div>
			</div>

			<!-- Datenverwaltung -->
			<div class="bg-zinc-900 rounded-3xl shadow-sm border border-zinc-800 p-6 space-y-4">
				<div class="flex items-center gap-3 mb-2">
					<div class="bg-zinc-800 text-zinc-300 p-2 rounded-xl">
						<span class="material-icons text-xl">storage</span>
					</div>
					<h3 class="font-bold text-white text-lg">Datenverwaltung</h3>
				</div>

				<!-- Daten exportieren -->
				<button
					onclick={exportDaten}
					class="w-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white py-4 px-4 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-between border border-zinc-700"
				>
					<div class="flex items-center gap-3">
						<span class="material-icons text-zinc-400">download</span>
						<div class="text-left">
							<div class="text-sm">Verse exportieren</div>
							<div class="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Als JSON-Datei speichern</div>
						</div>
					</div>
					<span class="material-icons text-zinc-600">chevron_right</span>
				</button>

				<!-- Daten importieren -->
				<label class="w-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white py-4 px-4 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-between border border-zinc-700 cursor-pointer">
					<div class="flex items-center gap-3">
						<span class="material-icons text-zinc-400">upload</span>
						<div class="text-left">
							<div class="text-sm">Verse importieren</div>
							<div class="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Aus JSON-Datei laden</div>
						</div>
					</div>
					<span class="material-icons text-zinc-600">chevron_right</span>
					<input
						type="file"
						accept=".json"
						onchange={importDaten}
						class="hidden"
					/>
				</label>

				<!-- Anki Import -->
				<label class="w-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white py-4 px-4 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-between border border-zinc-700 cursor-pointer">
					<div class="flex items-center gap-3">
						<span class="material-icons text-zinc-400">style</span>
						<div class="text-left">
							<div class="text-sm">Aus Anki importieren</div>
							<div class="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">.colpkg-Datei wählen</div>
						</div>
					</div>
					<span class="material-icons text-zinc-600">chevron_right</span>
					<input
						type="file"
						accept=".colpkg"
						onchange={ankiImportGewaehlt}
						class="hidden"
					/>
				</label>

			<!-- Testdaten -->
				<button
					onclick={testdatenLaden}
					class="w-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white py-4 px-4 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-between border border-zinc-700"
				>
					<div class="flex items-center gap-3">
						<span class="material-icons text-zinc-400">science</span>
						<div class="text-left">
							<div class="text-sm">Testdaten laden</div>
							<div class="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Ersetzt aktuelle Verse</div>
						</div>
					</div>
					<span class="material-icons text-zinc-600">chevron_right</span>
				</button>
			</div>

			<!-- Gefahrenzone -->
			<div class="bg-zinc-900 rounded-3xl shadow-sm border border-red-900/30 p-6">
				<div class="flex items-center gap-3 mb-4">
					<div class="bg-red-900/20 text-red-500 p-2 rounded-xl">
						<span class="material-icons text-xl">warning</span>
					</div>
					<h3 class="font-bold text-red-500 text-lg">Gefahrenzone</h3>
				</div>

				{#if !loeschBestaetigung}
					<button
						onclick={() => loeschBestaetigung = true}
						class="w-full bg-red-900/20 hover:bg-red-900/40 active:scale-95 text-red-500 border border-red-900/30 py-4 px-4 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
					>
						<span class="material-icons">delete_forever</span>
						Alle Verse löschen
					</button>
				{:else}
					<div class="bg-red-900/20 p-4 rounded-2xl border border-red-900/30">
						<p class="text-sm text-red-400 font-semibold text-center mb-4">Wirklich alle Verse unwiderruflich löschen?</p>
						<div class="grid grid-cols-2 gap-3">
							<button
								onclick={() => loeschBestaetigung = false}
								class="bg-zinc-800 hover:bg-zinc-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 border border-zinc-700"
							>
								Abbrechen
							</button>
							<button
								onclick={alleDatenLoeschen}
								class="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-sm shadow-red-900/20"
							>
								Löschen
							</button>
						</div>
					</div>
				{/if}
			</div>

		</div>
	</div>
</div>

{#if ankiFile}
	<AnkiImportModal file={ankiFile} onclose={ankiImportFertig} />
{/if}
