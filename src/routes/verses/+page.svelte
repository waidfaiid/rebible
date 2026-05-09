<script lang="ts">
	import VerseItem from '$lib/components/VerseItem.svelte';
	import AddVerseForm from '$lib/components/AddVerseForm.svelte';
	import EditVerseModal from '$lib/components/EditVerseModal.svelte';
	import { verses, showEditModal, selectedVerse, toastMessage } from '$lib/stores';
	import { db } from '$lib/db';
	import type { Verse } from '$lib/db';
	import { onMount } from 'svelte';

	let currentVerses = $state<Verse[]>([]);
	let showModal = $state(false);
	let selected = $state<Verse | null>(null);
	let suchbegriff = $state('');

	verses.subscribe(v => currentVerses = v);
	showEditModal.subscribe(s => showModal = s);
	selectedVerse.subscribe(s => selected = s);

	let gefilterteVerse = $derived(() => {
		const q = suchbegriff.trim().toLowerCase();
		if (!q) return currentVerses;
		return currentVerses.filter(v => {
			const tags = Array.isArray(v.tags) ? v.tags : [v.tags].filter(Boolean);
			return (
				v.stelle.toLowerCase().includes(q) ||
				v.text.toLowerCase().includes(q) ||
				tags.some(t => t.toLowerCase().includes(q))
			);
		});
	});

	async function addVerse(stelle: string, text: string, tags: string) {
		const jetzt = new Date().toISOString();
		const heute = new Date();
		heute.setHours(0, 0, 0, 0);
		const newVerse: Verse = {
			stelle,
			text,
			tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
			interval: 1,
			easeFactor: 2.5,
			nextReview: heute.toISOString(),
			lastReview: undefined,
			reviewCount: 0
		};

		const id = await db.verse.add(newVerse);
		verses.update(v => [...v, { ...newVerse, id }]);
		toastMessage.set('✓ Vers gespeichert');
		setTimeout(() => toastMessage.set(null), 3000);
	}

	function editVerse(verse: Verse) {
		selectedVerse.set(verse);
		showEditModal.set(true);
	}

	async function deleteVerse(id: number) {
		if (!confirm('Willst du diesen Vers wirklich löschen?')) return;

		await db.verse.delete(id);
		verses.update(v => v.filter(verse => verse.id !== id));
		toastMessage.set('✓ Vers gelöscht');
		setTimeout(() => toastMessage.set(null), 3000);
	}

	async function saveEdit(id: number, stelle: string, text: string, tags: string) {
		const tagArray = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [];
		await db.verse.update(id, { stelle, text, tags: tagArray });
		verses.update(v => v.map(verse =>
			verse.id === id ? { ...verse, stelle, text, tags: tagArray } : verse
		));
		showEditModal.set(false);
		selectedVerse.set(null);
		toastMessage.set('✓ Vers aktualisiert');
		setTimeout(() => toastMessage.set(null), 3000);
	}

	function cancelEdit() {
		showEditModal.set(false);
		selectedVerse.set(null);
	}
</script>

<div class="h-screen bg-white flex flex-col overflow-hidden">
	<!-- Header - Compact -->
	<div class="px-4 py-3 border-b border-gray-100 shrink-0">
		<h2 class="text-2xl font-light text-black mb-1">Verse</h2>
		<p class="text-xs text-gray-500 font-light">Verwalte deine Bibelverse</p>
	</div>

	<!-- Add Verse Form - Compact -->
	<div class="px-4 py-3 border-b border-gray-100 shrink-0">
		<AddVerseForm onAdd={addVerse} />
	</div>

	<!-- Search Bar -->
	<div class="px-4 py-2 border-b border-gray-100 shrink-0">
		<div class="relative">
			<span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
			<input
				type="text"
				placeholder="Suche nach Stelle, Text oder Thema…"
				bind:value={suchbegriff}
				class="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-light text-black placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors duration-200"
			/>
			{#if suchbegriff}
				<button
					onclick={() => suchbegriff = ''}
					class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
				>
					<span class="material-icons text-lg">close</span>
				</button>
			{/if}
		</div>
		{#if suchbegriff}
			<p class="text-xs text-gray-500 font-light mt-1">{gefilterteVerse().length} Treffer</p>
		{/if}
	</div>

	<!-- Verses List - Scrollable -->
	<div class="flex-1 overflow-y-auto">
		<div class="px-4 py-3">
			<div class="space-y-3">
				{#each gefilterteVerse() as verse (verse.id)}
					<VerseItem
						{verse}
						onEdit={() => editVerse(verse)}
						onDelete={() => deleteVerse(verse.id!)}
					/>
				{:else}
					<div class="text-center py-8">
						{#if suchbegriff}
							<span class="material-icons text-3xl text-gray-300 mb-2">search_off</span>
							<p class="text-gray-500 font-light text-sm">Keine Verse gefunden für „{suchbegriff}"</p>
						{:else}
							<p class="text-gray-500 font-light text-sm">Noch keine Verse hinzugefügt</p>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>

	<EditVerseModal
		show={showModal}
		verse={selected}
		onSave={saveEdit}
		onCancel={cancelEdit}
	/>
</div>
