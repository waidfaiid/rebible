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

	let filterKategorie = $state('all');
	let allTags = $derived(() => {
		const tags = new Set<string>();
		currentVerses.forEach(v => {
			const tArray = Array.isArray(v.tags) ? v.tags : (v.tags ? v.tags.split(',').map(t=>t.trim()) : []);
			tArray.forEach(t => { if(t) tags.add(t) });
		});
		return Array.from(tags).sort();
	});

	const ntBooks = ['Matthäus', 'Markus', 'Lukas', 'Johannes', 'Apostelgeschichte', 'Römer', '1. Korinther', '2. Korinther', 'Galater', 'Epheser', 'Philipper', 'Kolosser', '1. Thessalonicher', '2. Thessalonicher', '1. Timotheus', '2. Timotheus', 'Titus', 'Philemon', 'Hebräer', 'Jakobus', '1. Petrus', '2. Petrus', '1. Johannes', '2. Johannes', '3. Johannes', 'Judas', 'Offenbarung'];

	let gefilterteVerse = $derived(() => {
		let filtered = currentVerses;

		if (filterKategorie === 'AT') {
			filtered = filtered.filter(v => !ntBooks.some(b => v.stelle.startsWith(b)));
		} else if (filterKategorie === 'NT') {
			filtered = filtered.filter(v => ntBooks.some(b => v.stelle.startsWith(b)));
		} else if (filterKategorie !== 'all') {
			filtered = filtered.filter(v => {
				const tags = Array.isArray(v.tags) ? v.tags : (v.tags ? v.tags.split(',').map(t=>t.trim()) : []);
				return tags.includes(filterKategorie);
			});
		}

		const q = suchbegriff.trim().toLowerCase();
		if (!q) return filtered;
		return filtered.filter(v => {
			const tags = Array.isArray(v.tags) ? v.tags : (v.tags ? v.tags.split(',').map(t=>t.trim()) : []);
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

<div class="h-full bg-black flex flex-col overflow-hidden relative">
	<!-- Sticky Header: Title + Add Button + Filter/Search -->
	<div class="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-zinc-800 px-5 pt-8 pb-3 shrink-0">
		<div class="flex justify-between items-center mb-3">
			<h2 class="text-3xl font-bold text-white tracking-tight">Verse</h2>
			<button
				onclick={() => {
					const form = document.getElementById('add-verse-form');
					if (form) {
						form.scrollIntoView({ behavior: 'smooth' });
						setTimeout(() => form.querySelector('input')?.focus(), 300);
					}
				}}
				class="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 active:scale-95 transition-all shadow-sm shadow-red-900/20 font-bold flex items-center gap-1"
			>
				<span class="material-icons text-xl">add</span>
				Neuer Vers
			</button>
		</div>

		<div class="flex gap-2">
			<div class="relative flex-1">
				<span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-lg">search</span>
				<input
					type="text"
					placeholder="Suchen…"
					bind:value={suchbegriff}
					class="w-full pl-9 pr-8 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-base font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-all shadow-sm"
				/>
				{#if suchbegriff}
					<button
						onclick={() => suchbegriff = ''}
						class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white active:scale-95 transition-transform"
					>
						<span class="material-icons text-lg">cancel</span>
					</button>
				{/if}
			</div>
			<select
				bind:value={filterKategorie}
				class="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-base font-bold text-white focus:outline-none focus:border-zinc-600 max-w-[140px] appearance-none shadow-sm"
			>
				<option value="all">Alle</option>
				<option value="AT">Altes Testament</option>
				<option value="NT">Neues Testament</option>
				{#each allTags() as tag}
					<option value={tag}>{tag}</option>
				{/each}
			</select>
		</div>
		{#if suchbegriff || filterKategorie !== 'all'}
			<p class="text-xs text-zinc-500 font-medium mt-2 px-1">{gefilterteVerse().length} Treffer</p>
		{/if}
	</div>

	<!-- Scrollable Content: Add Form + Verses List -->
	<div class="flex-1 overflow-y-auto pb-40 scroll-smooth">
		<div class="px-5 py-4">
			<!-- Add Verse Form -->
			<div id="add-verse-form" class="mb-6">
				<AddVerseForm onAdd={addVerse} />
			</div>

			<div class="space-y-3">
				{#each gefilterteVerse() as verse (verse.id)}
					<VerseItem
						{verse}
						onEdit={() => editVerse(verse)}
						onDelete={() => deleteVerse(verse.id!)}
					/>
				{:else}
					<div class="text-center py-12 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-sm mt-4">
						{#if suchbegriff || filterKategorie !== 'all'}
							<span class="material-icons text-4xl text-zinc-700 mb-3 block">search_off</span>
							<p class="text-zinc-500 font-medium">Keine Verse gefunden</p>
						{:else}
							<span class="material-icons text-4xl text-zinc-700 mb-3 block">menu_book</span>
							<p class="text-zinc-500 font-medium">Noch keine Verse hinzugefügt</p>
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
