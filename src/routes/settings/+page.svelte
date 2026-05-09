<script lang="ts">
	import { db } from '$lib/db';
	import { verses, toastMessage } from '$lib/stores';
	import { betaVerses } from '$lib/betaVerse';
	import type { Verse } from '$lib/db';

	let tagliches_ziel = $state(10);
	let loeschBestaetigung = $state(false);

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

<div class="h-screen bg-white flex flex-col overflow-hidden">
	<!-- Header -->
	<div class="px-4 py-3 border-b border-gray-100 shrink-0">
		<h2 class="text-2xl font-light text-black mb-1">Einstellungen</h2>
		<p class="text-xs text-gray-500 font-light">Daten & App-Konfiguration</p>
	</div>

	<!-- Content -->
	<div class="flex-1 px-4 py-4 overflow-y-auto pb-20">
		<div class="max-w-md mx-auto space-y-5">

			<!-- Daten exportieren -->
			<div class="border border-gray-200 rounded-xl p-4">
				<div class="flex items-center gap-3 mb-3">
					<span class="material-icons text-blue-600">download</span>
					<div>
						<div class="font-medium text-sm text-black">Verse exportieren</div>
						<div class="text-xs text-gray-500 font-light">Alle Verse als JSON-Datei speichern</div>
					</div>
				</div>
				<button
					onclick={exportDaten}
					class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-light text-sm transition-colors duration-200"
				>
					Als Datei exportieren
				</button>
			</div>

			<!-- Daten importieren -->
			<div class="border border-gray-200 rounded-xl p-4">
				<div class="flex items-center gap-3 mb-3">
					<span class="material-icons text-green-600">upload</span>
					<div>
						<div class="font-medium text-sm text-black">Verse importieren</div>
						<div class="text-xs text-gray-500 font-light">Verse aus einer JSON-Datei hinzufügen</div>
					</div>
				</div>
				<label class="block">
					<span class="sr-only">JSON-Datei auswählen</span>
					<input
						type="file"
						accept=".json"
						onchange={importDaten}
						class="block w-full text-sm text-gray-600 font-light
							file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0
							file:text-sm file:font-medium file:bg-green-50 file:text-green-700
							hover:file:bg-green-100 cursor-pointer"
					/>
				</label>
			</div>

			<!-- Testdaten -->
			<div class="border border-gray-200 rounded-xl p-4">
				<div class="flex items-center gap-3 mb-3">
					<span class="material-icons text-purple-600">science</span>
					<div>
						<div class="font-medium text-sm text-black">Testdaten laden</div>
						<div class="text-xs text-gray-500 font-light">8 Beispielverse laden (ersetzt alle vorhandenen Verse)</div>
					</div>
				</div>
				<button
					onclick={testdatenLaden}
					class="w-full bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 py-2.5 px-4 rounded-lg font-light text-sm transition-colors duration-200"
				>
					Beispielverse laden
				</button>
			</div>

			<!-- Trennlinie -->
			<div class="border-t border-gray-100"></div>

			<!-- Alle Daten löschen -->
			<div class="border border-red-200 rounded-xl p-4">
				<div class="flex items-center gap-3 mb-3">
					<span class="material-icons text-red-500">delete_forever</span>
					<div>
						<div class="font-medium text-sm text-black">Alle Verse löschen</div>
						<div class="text-xs text-gray-500 font-light">Diese Aktion kann nicht rückgängig gemacht werden</div>
					</div>
				</div>
				{#if !loeschBestaetigung}
					<button
						onclick={() => loeschBestaetigung = true}
						class="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-2.5 px-4 rounded-lg font-light text-sm transition-colors duration-200"
					>
						Alle Daten löschen
					</button>
				{:else}
					<div class="space-y-2">
						<p class="text-xs text-red-600 font-medium text-center">Wirklich alle Verse unwiderruflich löschen?</p>
						<div class="grid grid-cols-2 gap-2">
							<button
								onclick={() => loeschBestaetigung = false}
								class="bg-gray-100 hover:bg-gray-200 text-black py-2.5 px-4 rounded-lg font-light text-sm transition-colors duration-200"
							>
								Abbrechen
							</button>
							<button
								onclick={alleDatenLoeschen}
								class="bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg font-light text-sm transition-colors duration-200"
							>
								Ja, löschen
							</button>
						</div>
					</div>
				{/if}
			</div>

		</div>
	</div>
</div>
