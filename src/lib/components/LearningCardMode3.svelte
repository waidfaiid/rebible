<script lang="ts">
  import type { Verse } from '$lib/db';
  import { splitStelle, extractFirstChunk } from '$lib/utils';
  import { frageFontSize, frageGroesse } from '$lib/stores';
  import RatingButtons from './RatingButtons.svelte';
  import VorlesenButton from './VorlesenButton.svelte';

  let { verses, displayBook, displaySub, onRate, onShowNext, progress, onGoBack }: {
    verses: Verse[];
    displayBook: string;
    displaySub: string;
    onRate: (verseId: number, grade: number, relearning?: boolean) => void;
    onShowNext: () => void;
    progress: { current: number; total: number };
    onGoBack?: () => void;
  } = $props();

  let showText = $state(false);

  let fontSize = $state(1.8);
  frageFontSize.subscribe(v => fontSize = v);

  let frageSize = $state(1.5);
  frageGroesse.subscribe(v => frageSize = v);

  // Reset wenn neue Gruppe geladen wird
  let prevFirstId = $state<number | null>(null);
  $effect(() => {
    const firstId = verses[0]?.id ?? null;
    if (firstId !== prevFirstId) {
      prevFirstId = firstId;
      showText = false;
    }
  });

  // Mehrere Bücher in der Gruppe → vollständige Stelle anzeigen
  let isMultiBook = $derived(
    verses.length > 1 &&
    verses.some(v => splitStelle(v.stelle).book !== splitStelle(verses[0].stelle).book)
  );

  function getVerseLabel(stelle: string): string {
    return isMultiBook ? stelle : splitStelle(stelle).chapvers;
  }

  let vorlesenSegmente = $derived(
    verses.map(v => ({
      stelle: v.stelle,
      text: v.firstChunkManual ?? v.firstChunk ?? extractFirstChunk(v.text)
    }))
  );

  function rateAll(grade: number) {
    for (const v of verses) {
      onRate(v.id!, grade, false);
    }
    onShowNext();
  }
</script>

<div class="flex-1 min-h-0 bg-black flex flex-col overflow-hidden">
  <!-- Top Bar (Progress) -->
  <div class="bg-black/90 px-3 py-2 shrink-0 flex items-center gap-3 pt-[env(safe-area-inset-top)]">
    <button
      onclick={onGoBack}
      class="text-zinc-400 hover:text-white p-1 rounded-full transition-colors duration-200 flex items-center justify-center active:scale-95"
      disabled={!onGoBack}
    >
      <span class="material-icons text-2xl">chevron_left</span>
    </button>
    <div class="flex-1">
      <div class="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
        <div
          class="bg-red-600 h-full rounded-full transition-all duration-500 ease-out"
          style="width: {progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%"
        ></div>
      </div>
    </div>
    <span class="text-[10px] font-bold text-zinc-500 tracking-wider w-8 text-right">{progress.current}/{progress.total}</span>
  </div>

  <!-- Scrollable Content -->
  <div class="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col">
    <div class="max-w-md mx-auto w-full flex flex-col gap-4">

      {#if !showText}
        <!-- Frage: nur Buchbereich anzeigen -->
        <div class="text-center py-8">
          <div class="flex items-center justify-center gap-2 mb-1">
            <span class="material-icons text-zinc-500 text-lg">auto_stories</span>
          </div>
          <div class="font-bold text-white leading-tight" style="font-size: {frageSize}rem;">{displayBook}</div>
          {#if displaySub}
            <div class="font-semibold text-zinc-400 mt-1" style="font-size: {frageSize * 0.65}rem;">{displaySub}</div>
          {/if}
        </div>

      {:else}
        <!-- Antwort: alle Verse mit erstem Chunk -->
        <div class="space-y-2">
          {#each verses as v}
            {@const chunk = v.firstChunkManual ?? v.firstChunk ?? extractFirstChunk(v.text)}
            <div class="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 leading-snug" style="font-size: {fontSize}rem;">
              <span class="font-bold text-white">{getVerseLabel(v.stelle)}</span>
              <span class="text-zinc-200 ml-2">{chunk}</span>
              {#if chunk !== v.text}
                <span class="text-zinc-600"> …</span>
              {/if}
            </div>
          {/each}
        </div>
      {/if}

    </div>
  </div>

  <!-- Platzhalter damit Content nicht hinter den fixen Buttons verschwindet -->
  <div class="shrink-0 {showText ? 'h-56' : 'h-24'} pb-[env(safe-area-inset-bottom)]"></div>
</div>

<!-- Buttons: fixed am unteren Bildschirmrand, immer sichtbar -->
<div class="fixed bottom-0 left-0 right-0 z-40 bg-black border-t border-zinc-900 p-4 pb-[calc(env(safe-area-inset-bottom)+5rem)]">
  <div class="max-w-lg mx-auto w-full space-y-3">
    {#if !showText}
      <button
        onclick={() => showText = true}
        class="w-full bg-red-600 text-white px-6 py-5 rounded-2xl hover:bg-red-700 active:scale-95 font-bold text-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm shadow-red-900/20"
      >
        <span class="material-icons">visibility</span>
        Aufdecken
      </button>
    {:else}
      <RatingButtons onRate={rateAll} dreierModus={true} />
      <VorlesenButton segmente={vorlesenSegmente} />
    {/if}
  </div>
</div>
