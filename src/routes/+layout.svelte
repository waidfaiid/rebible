<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { db } from '$lib/db';
	import { verses, toastMessage } from '$lib/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { children } = $props();

	let dbStatus = $state('Lade...');

	onMount(async () => {
		try {
			const count = await db.verse.count();
			dbStatus = `${count} Verse`;
			const allVerses = await db.verse.toArray();
			verses.set(allVerses);
		} catch (error) {
			dbStatus = '❌ Fehler';
			console.error(error);
		}
	});

	function navigate(path: string) {
		goto(path);
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<!-- Full-screen fixed container – covers the entire viewport including safe areas -->
<div
	class="fixed inset-0 bg-black text-white flex flex-col font-sans selection:bg-red-500/30"
	style="padding-top: env(safe-area-inset-top);"
>
	<!-- Main Content – centered column for desktop, full-width on mobile -->
	<main class="flex-1 overflow-y-auto flex flex-col">
		<div class="max-w-lg mx-auto w-full flex-1 flex flex-col">
			{@render children()}
		</div>
	</main>

	<!-- Global Toast Notification -->
	{#if $toastMessage}
		<div class="fixed left-4 right-4 z-50 flex justify-center pointer-events-none" style="top: calc(env(safe-area-inset-top) + 3rem)">
			<div class="bg-zinc-800/95 backdrop-blur-md text-white border border-zinc-700 px-5 py-3 rounded-2xl text-sm font-medium shadow-2xl">
				{$toastMessage}
			</div>
		</div>
	{/if}

	<!-- Bottom Navigation - iOS Style -->
	<nav class="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 shrink-0 pb-[env(safe-area-inset-bottom)] z-50">
		<div class="flex justify-around px-2 py-1.5 max-w-lg mx-auto">
			<button
				class="flex flex-col items-center p-1.5 w-16 transition-colors duration-200 {$page.url.pathname === '/' ? 'text-red-600' : 'text-zinc-500 hover:text-zinc-300'}"
				onclick={() => navigate('/')}
				title="Heute"
			>
				<span class="material-icons text-xl mb-0.5">home</span>
				<span class="text-[9px] font-medium">Heute</span>
			</button>
			<button
				class="flex flex-col items-center p-1.5 w-16 transition-colors duration-200 {$page.url.pathname.startsWith('/verses') ? 'text-red-600' : 'text-zinc-500 hover:text-zinc-300'}"
				onclick={() => navigate('/verses')}
				title="Verse"
			>
				<span class="material-icons text-xl mb-0.5">menu_book</span>
				<span class="text-[9px] font-medium">Verse</span>
			</button>
			<button
				class="flex flex-col items-center p-1.5 w-16 transition-colors duration-200 {$page.url.pathname.startsWith('/learn') ? 'text-red-600' : 'text-zinc-500 hover:text-zinc-300'}"
				onclick={() => navigate('/learn')}
				title="Lernen"
			>
				<span class="material-icons text-xl mb-0.5">school</span>
				<span class="text-[9px] font-medium">Lernen</span>
			</button>
			<button
				class="flex flex-col items-center p-1.5 w-16 transition-colors duration-200 {$page.url.pathname.startsWith('/settings') ? 'text-red-600' : 'text-zinc-500 hover:text-zinc-300'}"
				onclick={() => navigate('/settings')}
				title="Einstellungen"
			>
				<span class="material-icons text-xl mb-0.5">settings</span>
				<span class="text-[9px] font-medium">Optionen</span>
			</button>
		</div>
	</nav>
</div>
