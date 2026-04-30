<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { db } from '$lib/db';
	import { verses } from '$lib/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let { children } = $props();

	let dbStatus = $state('Lade...');

	onMount(async () => {
		try {
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

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow-sm px-4 py-3 flex justify-between items-center">
		<h1 class="text-xl font-bold text-gray-800">ReBible</h1>
		<div class="text-sm text-gray-600">{dbStatus}</div>
	</header>

	<!-- Main Content -->
	<main class="pb-20">
		{@render children()}
	</main>

	<!-- Bottom Navigation -->
	<nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
		<div class="flex justify-around">
			<button
				class="flex flex-col items-center p-2 text-gray-600 hover:text-blue-600"
				onclick={() => navigate('/')}
			>
				<span class="material-icons">home</span>
				<span class="text-xs">Heute</span>
			</button>
			<button
				class="flex flex-col items-center p-2 text-gray-600 hover:text-blue-600"
				onclick={() => navigate('/verses')}
			>
				<span class="material-icons">auto_stories</span>
				<span class="text-xs">Verse</span>
			</button>
			<button
				class="flex flex-col items-center p-2 text-gray-600 hover:text-blue-600"
				onclick={() => navigate('/learn')}
			>
				<span class="material-icons">school</span>
				<span class="text-xs">Lernen</span>
			</button>
			<button
				class="flex flex-col items-center p-2 text-gray-600 hover:text-blue-600"
				onclick={() => navigate('/settings')}
			>
				<span class="material-icons">settings</span>
				<span class="text-xs">Einstellungen</span>
			</button>
		</div>
	</nav>
</div>
