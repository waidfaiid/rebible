<script lang="ts">
	import StatsGrid from '$lib/components/StatsGrid.svelte';
	import { verses } from '$lib/stores';
	import { derived } from 'svelte/store';

	// Calculate stats
	const stats = derived(verses, $verses => {
		const heute = new Date();
		heute.setHours(0, 0, 0, 0);

		const faellig = $verses.filter(v => {
			const next = v.nextReview ? new Date(v.nextReview) : new Date();
			return next <= heute;
		});

		const gelerntHeute = $verses.filter(v => {
			if (!v.lastReview) return false;
			const lastDate = new Date(v.lastReview);
			lastDate.setHours(0, 0, 0, 0);
			return lastDate.getTime() === heute.getTime();
		}).length;

		return {
			gesamt: $verses.length,
			faellig: faellig.length,
			gelerntHeute,
			serie: 0 // Placeholder, could be calculated from consecutive days
		};
	});
</script>

<div class="p-4">
	<h2 class="text-2xl font-bold mb-6">Heute</h2>
	<StatsGrid stats={$stats} />
</div>
