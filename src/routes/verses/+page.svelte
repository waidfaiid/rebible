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

	// Subscribe to stores
	verses.subscribe(v => currentVerses = v);
	showEditModal.subscribe(s => showModal = s);
	selectedVerse.subscribe(s => selected = s);

	onMount(() => {
		// Already loaded in layout
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
			nextReview: heute.toISOString(), // Set to today 00:00 so it's due
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

<div class="p-4">
	<h2 class="text-2xl font-bold mb-6">Verse verwalten</h2>

	<AddVerseForm onAdd={addVerse} />

	<div class="space-y-4">
		{#each currentVerses as verse (verse.id)}
			<VerseItem
				{verse}
				onEdit={() => editVerse(verse)}
				onDelete={() => deleteVerse(verse.id!)}
			/>
		{:else}
			<p class="text-center text-gray-500 py-8">Noch keine Verse hinzugefügt</p>
		{/each}
	</div>

	<EditVerseModal
		show={showModal}
		verse={selected}
		onSave={saveEdit}
		onCancel={cancelEdit}
	/>
</div>

{#if $toastMessage}
	<div class="fixed bottom-24 left-4 right-4 bg-black text-white px-4 py-2 rounded-lg text-center">
		{$toastMessage}
	</div>
{/if}