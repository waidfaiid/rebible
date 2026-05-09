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

<div class="h-screen bg-black text-white flex flex-col overflow-hidden font-sans selection:bg-red-500/30">
	<!-- Main Content -->
	<main class="flex-1 bg-black overflow-y-auto">
		{@render children()}
	</main>

	<!-- Global Toast Notification -->
	{#if $toastMessage}
		<div class="fixed top-12 left-4 right-4 z-50 flex justify-center pointer-events-none">
			<div class="bg-zinc-800/95 backdrop-blur-md text-white border border-zinc-700 px-5 py-3 rounded-2xl text-sm font-medium shadow-2xl">
				{$toastMessage}
			</div>
		</div>
	{/if}

	<!-- Bottom Navigation - iOS Style -->
	<nav class="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 shrink-0 pb-[env(safe-area-inset-bottom)] z-50">
		<div class="flex justify-around px-2 py-1.5 max-w-md mx-auto">
			<button
				class="flex flex-col items-center p-1.5 w-16 transition-colors duration-200 {$page.url.pathname === '/' ? 'text-red-600' : 'text-zinc-500 hover:text-zinc-300'}"
				onclick={() => navigate('/')}
				title="Heute"
			>
				<span class="material-icons text-xl mb-0.5">{$page.url.pathname === '/' ? 'home' : 'home'}</span>
				<span class="text-[9px] font-medium">Heute</span>
			</button>
			<button
				class="flex flex-col items-center p-1.5 w-16 transition-colors duration-200 {$page.url.pathname.startsWith('/verses') ? 'text-red-600' : 'text-zinc-500 hover:text-zinc-300'}"
				onclick={() => navigate('/verses')}
				title="Verse"
			>
				<span class="material-icons text-xl mb-0.5">{$page.url.pathname.startsWith('/verses') ? 'menu_book' : 'menu_book'}</span>
				<span class="text-[9px] font-medium">Verse</span>
			</button>
			<button
				class="flex flex-col items-center p-1.5 w-16 transition-colors duration-200 {$page.url.pathname.startsWith('/learn') ? 'text-red-600' : 'text-zinc-500 hover:text-zinc-300'}"
				onclick={() => navigate('/learn')}
				title="Lernen"
			>
				<span class="material-icons text-xl mb-0.5">{$page.url.pathname.startsWith('/learn') ? 'school' : 'school'}</span>
				<span class="text-[9px] font-medium">Lernen</span>
			</button>
			<button
				class="flex flex-col items-center p-1.5 w-16 transition-colors duration-200 {$page.url.pathname.startsWith('/settings') ? 'text-red-600' : 'text-zinc-500 hover:text-zinc-300'}"
				onclick={() => navigate('/settings')}
				title="Einstellungen"
			>
				<span class="material-icons text-xl mb-0.5">{$page.url.pathname.startsWith('/settings') ? 'settings' : 'settings'}</span>
				<span class="text-[9px] font-medium">Optionen</span>
			</button>
		</div>
	</nav>
</div>
