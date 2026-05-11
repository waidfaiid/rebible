<script lang="ts">
	import VerseItem from '$lib/components/VerseItem.svelte';
	import AddVerseForm from '$lib/components/AddVerseForm.svelte';
	import EditVerseModal from '$lib/components/EditVerseModal.svelte';
	import { verses, showEditModal, selectedVerse, toastMessage } from '$lib/stores';
	import { db } from '$lib/db';
	import type { Verse } from '$lib/db';

	let currentVerses = $state<Verse[]>([]);
	let showModal = $state(false);
	let selected = $state<Verse | null>(null);
	let suchbegriff = $state('');
	let filterKategorie = $state('all');
	let filterPanelOffen = $state(false);
	let themaOffen = $state(false);
	let statistikOffen = $state(false);

	verses.subscribe(v => currentVerses = v);
	showEditModal.subscribe(s => showModal = s);
	selectedVerse.subscribe(s => selected = s);

	const ntBuecher = ['Matthäus', 'Markus', 'Lukas', 'Johannes', 'Apostelgeschichte', 'Römer',
		'1. Korinther', '2. Korinther', 'Galater', 'Epheser', 'Philipper', 'Kolosser',
		'1. Thessalonicher', '2. Thessalonicher', '1. Timotheus', '2. Timotheus', 'Titus',
		'Philemon', 'Hebräer', 'Jakobus', '1. Petrus', '2. Petrus', '1. Johannes',
		'2. Johannes', '3. Johannes', 'Judas', 'Offenbarung'];

	// Alle verfügbaren Tags alphabetisch
	const allTags = $derived.by(() => {
		const tags = new Set<string>();
		currentVerses.forEach(v => {
			const tArr = Array.isArray(v.tags) ? v.tags : (v.tags ? v.tags.split(',').map(t => t.trim()) : []);
			tArr.forEach(t => { if (t) tags.add(t); });
		});
		return [...tags].sort((a, b) => a.localeCompare(b, 'de'));
	});

	const isStatModus = $derived(filterKategorie.startsWith('stat:'));
	const themaAktiv = $derived(filterKategorie.startsWith('tag:'));
	const statAktiv = $derived(filterKategorie.startsWith('stat:'));

	// Gefilterte und ggf. sortierte Verse
	const gefilterteVerse = $derived.by(() => {
		let liste = currentVerses;

		if (filterKategorie === 'AT') {
			liste = liste.filter(v => !ntBuecher.some(b => v.stelle.startsWith(b)));
		} else if (filterKategorie === 'NT') {
			liste = liste.filter(v => ntBuecher.some(b => v.stelle.startsWith(b)));
		} else if (filterKategorie.startsWith('tag:')) {
			const tag = filterKategorie.slice(4);
			liste = liste.filter(v => {
				const tArr = Array.isArray(v.tags) ? v.tags : (v.tags ? v.tags.split(',').map(t => t.trim()) : []);
				return tArr.includes(tag);
			});
		} else if (filterKategorie.startsWith('stat:')) {
			const feld = filterKategorie.slice(5);
			liste = [...liste].sort((a, b) => {
				if (feld === 'nextReview') {
					return new Date(a.nextReview || 0).getTime() - new Date(b.nextReview || 0).getTime();
				}
				if (feld === 'easeFactor') {
					return (a.easeFactor ?? 2.5) - (b.easeFactor ?? 2.5);
				}
				if (feld === 'lastReview') {
					const aT = a.lastReview ? new Date(a.lastReview).getTime() : 0;
					const bT = b.lastReview ? new Date(b.lastReview).getTime() : 0;
					return bT - aT;
				}
				if (feld === 'reviewCount') {
					return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
				}
				return 0;
			});
		}

		const q = suchbegriff.trim().toLowerCase();
		if (!q) return liste;
		return liste.filter(v => {
			const tArr = Array.isArray(v.tags) ? v.tags : (v.tags ? v.tags.split(',').map(t => t.trim()) : []);
			return (
				v.stelle.toLowerCase().includes(q) ||
				v.text.toLowerCase().includes(q) ||
				tArr.some(t => t.toLowerCase().includes(q))
			);
		});
	});

	// Label für den Filter-Button
	const filterLabel = $derived.by(() => {
		if (filterKategorie === 'all') return 'Alle';
		if (filterKategorie === 'AT') return 'AT';
		if (filterKategorie === 'NT') return 'NT';
		if (filterKategorie.startsWith('tag:')) return filterKategorie.slice(4);
		if (filterKategorie === 'stat:nextReview') return 'Nächste Wdh.';
		if (filterKategorie === 'stat:easeFactor') return 'Schwierigkeit';
		if (filterKategorie === 'stat:lastReview') return 'Letzte Wdh.';
		if (filterKategorie === 'stat:reviewCount') return 'Anz. Wdh.';
		return 'Filter';
	});

	const statOptionen = [
		{ wert: 'stat:nextReview', label: 'Nächste Wiederholung', sub: 'Früheste Fälligkeit zuerst', icon: 'event' },
		{ wert: 'stat:easeFactor', label: 'Schwierigkeitsfaktor', sub: 'Schwierigste zuerst', icon: 'psychology' },
		{ wert: 'stat:lastReview', label: 'Letzte Wiederholung', sub: 'Zuletzt gelernt zuerst', icon: 'history' },
		{ wert: 'stat:reviewCount', label: 'Anzahl Wiederholungen', sub: 'Meistgelernte zuerst', icon: 'repeat' }
	];

	function setFilter(wert: string) {
		filterKategorie = wert;
		filterPanelOffen = false;
		themaOffen = false;
		statistikOffen = false;
	}

	async function addVerse(stelle: string, text: string, tags: string) {
		const heute = new Date();
		heute.setHours(0, 0, 0, 0);
		const newVerse: Verse = {
			stelle, text,
			tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
			interval: 1, easeFactor: 2.5,
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

	async function saveEdit(
		id: number, stelle: string, text: string, tags: string,
		sm2: { easeFactor: number; interval: number; reviewCount: number; nextReview: string; lastReview: string }
	) {
		const tagArray = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [];
		const updates = { stelle, text, tags: tagArray, ...sm2 };
		await db.verse.update(id, updates);
		verses.update(v => v.map(verse => verse.id === id ? { ...verse, ...updates } : verse));
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
	<!-- Sticky Header -->
	<div class="sticky top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-zinc-800 px-5 pt-8 pb-3 shrink-0">
		<div class="flex justify-between items-center mb-3">
			<h2 class="text-3xl font-bold text-white tracking-tight">Verse</h2>
			<button
				onclick={() => {
					const form = document.getElementById('add-verse-form');
					if (form) { form.scrollIntoView({ behavior: 'smooth' }); setTimeout(() => form.querySelector('input')?.focus(), 300); }
				}}
				class="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 active:scale-95 transition-all font-bold flex items-center gap-1"
			>
				<span class="material-icons text-xl">add</span>
				Neuer Vers
			</button>
		</div>

		<div class="flex gap-2">
			<!-- Suchfeld -->
			<div class="relative flex-1">
				<span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-lg pointer-events-none">search</span>
				<input
					type="text"
					placeholder="Suchen…"
					bind:value={suchbegriff}
					class="w-full pl-9 pr-8 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-base font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-all"
				/>
				{#if suchbegriff}
					<button onclick={() => suchbegriff = ''} class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
						<span class="material-icons text-lg">cancel</span>
					</button>
				{/if}
			</div>
			<!-- Filter-Button -->
			<button
				onclick={() => filterPanelOffen = true}
				class="flex items-center gap-1.5 bg-zinc-900 border {filterKategorie !== 'all' ? 'border-red-700 text-red-400' : 'border-zinc-800 text-zinc-400'} rounded-xl px-3 py-2 font-bold text-sm transition-colors hover:border-zinc-600 active:scale-95"
			>
				<span class="material-icons text-base">filter_list</span>
				<span class="max-w-[80px] truncate">{filterLabel}</span>
			</button>
		</div>

		{#if suchbegriff || filterKategorie !== 'all'}
			<p class="text-xs text-zinc-500 font-medium mt-2 px-1">{gefilterteVerse.length} Treffer</p>
		{/if}
	</div>

	<!-- Scrollbarer Inhalt -->
	<div class="flex-1 overflow-y-auto pb-40 scroll-smooth">
		<div class="px-5 py-4">
			<div id="add-verse-form" class="mb-6">
				<AddVerseForm onAdd={addVerse} />
			</div>

			<div class:space-y-3={!isStatModus}>
				{#each gefilterteVerse as verse (verse.id)}
					<VerseItem
						{verse}
						statModus={isStatModus}
						onEdit={() => editVerse(verse)}
						onDelete={() => deleteVerse(verse.id!)}
					/>
				{:else}
					<div class="text-center py-12 bg-zinc-900 rounded-2xl border border-zinc-800 mt-4">
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

	<EditVerseModal show={showModal} verse={selected} onSave={saveEdit} onCancel={cancelEdit} />
</div>

<!-- Filter-Panel Backdrop -->
{#if filterPanelOffen}
	<div
		class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
		onclick={() => filterPanelOffen = false}
		role="button" tabindex="-1" onkeydown={() => {}}
	></div>

	<!-- Filter-Panel (Top Sheet) -->
	<div
		class="fixed top-0 left-0 right-0 z-50 bg-zinc-900 rounded-b-3xl border-b border-zinc-800 shadow-2xl overflow-y-auto"
		style="max-height: 82vh; padding-top: max(1rem, env(safe-area-inset-top))"
	>
		<!-- Header -->
		<div class="flex justify-between items-center px-5 pt-2 pb-3 border-b border-zinc-800">
			<h3 class="font-bold text-white text-lg">Filter</h3>
			<button onclick={() => filterPanelOffen = false} class="text-zinc-500 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors">
				<span class="material-icons">close</span>
			</button>
		</div>

		<!-- Optionen -->
		<div class="px-4 py-3 pb-6">

			<!-- Alle -->
			<button
				onclick={() => setFilter('all')}
				class="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all mb-1 {filterKategorie === 'all' ? 'bg-red-950 text-white' : 'text-zinc-300 hover:bg-zinc-800'}"
			>
				<div class="flex items-center gap-3">
					<span class="material-icons text-base {filterKategorie === 'all' ? 'text-red-400' : 'text-zinc-500'}">library_books</span>
					<span class="font-semibold">Alle Verse</span>
				</div>
				{#if filterKategorie === 'all'}<span class="material-icons text-red-400 text-base">check</span>{/if}
			</button>

			<!-- Testament -->
			<div class="text-[10px] font-bold text-zinc-600 uppercase tracking-wider px-4 mt-4 mb-1.5">Testament</div>
			{#each [{ wert: 'AT', label: 'Altes Testament', icon: 'history_edu' }, { wert: 'NT', label: 'Neues Testament', icon: 'auto_stories' }] as opt}
				<button
					onclick={() => setFilter(opt.wert)}
					class="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all mb-1 {filterKategorie === opt.wert ? 'bg-red-950 text-white' : 'text-zinc-300 hover:bg-zinc-800'}"
				>
					<div class="flex items-center gap-3">
						<span class="material-icons text-base {filterKategorie === opt.wert ? 'text-red-400' : 'text-zinc-500'}">{opt.icon}</span>
						<span class="font-semibold">{opt.label}</span>
					</div>
					{#if filterKategorie === opt.wert}<span class="material-icons text-red-400 text-base">check</span>{/if}
				</button>
			{/each}

			<!-- Thema (eingeklappt) -->
			{#if allTags.length > 0}
				<button
					onclick={() => themaOffen = !themaOffen}
					class="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all mt-1 {themaAktiv ? 'bg-red-950' : 'hover:bg-zinc-800'}"
				>
					<div class="flex items-center gap-3">
						<span class="material-icons text-base {themaAktiv ? 'text-red-400' : 'text-zinc-500'}">label</span>
						<span class="font-semibold {themaAktiv ? 'text-white' : 'text-zinc-300'}">Thema</span>
						{#if themaAktiv}
							<span class="text-[10px] font-bold text-red-400 bg-red-950 px-2 py-0.5 rounded-full border border-red-900">
								{filterKategorie.slice(4)}
							</span>
						{/if}
					</div>
					<span
						class="material-icons text-base transition-transform duration-200 {themaAktiv ? 'text-red-400' : 'text-zinc-500'}"
						style="transform: rotate({themaOffen ? 90 : 0}deg)"
					>chevron_right</span>
				</button>
				{#if themaOffen}
					<div class="ml-4 mt-1 space-y-0.5 border-l-2 border-zinc-800 pl-3">
						{#each allTags as tag}
							{@const aktiv = filterKategorie === 'tag:' + tag}
							<button
								onclick={() => setFilter('tag:' + tag)}
								class="w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all {aktiv ? 'bg-red-950 text-white' : 'text-zinc-300 hover:bg-zinc-800'}"
							>
								<div class="flex items-center gap-2.5">
									<span class="material-icons text-sm {aktiv ? 'text-red-400' : 'text-zinc-600'}">label_outline</span>
									<span class="font-medium text-sm">{tag}</span>
								</div>
								{#if aktiv}<span class="material-icons text-red-400 text-sm">check</span>{/if}
							</button>
						{/each}
					</div>
				{/if}
			{/if}

			<!-- Statistik (eingeklappt) -->
			<button
				onclick={() => statistikOffen = !statistikOffen}
				class="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all mt-1 {statAktiv ? 'bg-red-950' : 'hover:bg-zinc-800'}"
			>
				<div class="flex items-center gap-3">
					<span class="material-icons text-base {statAktiv ? 'text-red-400' : 'text-zinc-500'}">bar_chart</span>
					<span class="font-semibold {statAktiv ? 'text-white' : 'text-zinc-300'}">Statistik</span>
					{#if statAktiv}
						<span class="text-[10px] font-bold text-red-400 bg-red-950 px-2 py-0.5 rounded-full border border-red-900">
							{statOptionen.find(o => o.wert === filterKategorie)?.label ?? ''}
						</span>
					{/if}
				</div>
				<span
					class="material-icons text-base transition-transform duration-200 {statAktiv ? 'text-red-400' : 'text-zinc-500'}"
					style="transform: rotate({statistikOffen ? 90 : 0}deg)"
				>chevron_right</span>
			</button>
			{#if statistikOffen}
				<div class="ml-4 mt-1 space-y-0.5 border-l-2 border-zinc-800 pl-3">
					{#each statOptionen as opt}
						{@const aktiv = filterKategorie === opt.wert}
						<button
							onclick={() => setFilter(opt.wert)}
							class="w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all {aktiv ? 'bg-red-950 text-white' : 'text-zinc-300 hover:bg-zinc-800'}"
						>
							<div class="flex items-center gap-2.5">
								<span class="material-icons text-sm {aktiv ? 'text-red-400' : 'text-zinc-600'}">{opt.icon}</span>
								<div class="text-left">
									<div class="font-medium text-sm leading-tight">{opt.label}</div>
									<div class="text-[10px] {aktiv ? 'text-red-300/60' : 'text-zinc-600'} mt-0.5">{opt.sub}</div>
								</div>
							</div>
							{#if aktiv}<span class="material-icons text-red-400 text-sm shrink-0">check</span>{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
