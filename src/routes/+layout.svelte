<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { db } from '$lib/db';
	import { verses } from '$lib/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { loadBetaVerses } from '$lib/betaVerse';

	let { children } = $props();

	let dbStatus = $state('Lade...');

	onMount(async () => {
		try {
			// Load beta test data on every app start
			await loadBetaVerses();

			const count = await db.verse.count();
			dbStatus = `${count} Verse in der DB`;
			// Load verses into store
			const allVerses = await db.verse.toArray();
			verses.set(allVerses);
		} catch (error) {
			dbStatus = '❌ Fehler beim Laden';
			console.error(error);
		}
	});

	function navigate(path: string) {
		goto(path);
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="h-screen bg-gray-50 flex flex-col overflow-hidden">
	<!-- Header -->
	<header class="bg-white border-b border-gray-100 px-4 py-4 shrink-0 flex justify-between items-center sticky top-0 z-10">
		<h1 class="text-2xl font-light text-black tracking-wide">ReBible</h1>
		<div class="text-xs text-gray-500 font-light">{dbStatus}</div>
	</header>

	<!-- Main Content -->
	<main class="flex-1 bg-white overflow-hidden">
		{@render children()}
	</main>

	<!-- Bottom Navigation - Ultra Compact -->
	<nav class="fixed bottom-0 left-0 right-0 bg-white bg-opacity-95 backdrop-blur-md border-t border-gray-100 shrink-0">
		<div class="flex justify-around px-1 py-1">
			<button
				class="flex flex-col items-center p-1 text-gray-400 hover:text-black transition-colors duration-300"
				onclick={() => navigate('/')}
				title="Heute"
			>
				<span class="material-icons text-lg">home</span>
				<span class="text-xs font-light mt-0.5 text-gray-600">Heute</span>
			</button>
			<button
				class="flex flex-col items-center p-1 text-gray-400 hover:text-black transition-colors duration-300"
				onclick={() => navigate('/verses')}
				title="Verse"
			>
				<span class="material-icons text-lg">auto_stories</span>
				<span class="text-xs font-light mt-0.5 text-gray-600">Verse</span>
			</button>
			<button
				class="flex flex-col items-center p-1 text-gray-400 hover:text-black transition-colors duration-300"
				onclick={() => navigate('/learn')}
				title="Lernen"
			>
				<span class="material-icons text-lg">school</span>
				<span class="text-xs font-light mt-0.5 text-gray-600">Lernen</span>
			</button>
			<button
				class="flex flex-col items-center p-1 text-gray-400 hover:text-black transition-colors duration-300"
				onclick={() => navigate('/settings')}
				title="Einstellungen"
			>
				<span class="material-icons text-lg">settings</span>
				<span class="text-xs font-light mt-0.5 text-gray-600">Einstellungen</span>
			</button>
		</div>
	</nav>
</div>
