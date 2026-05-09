<script lang="ts">
  import type { Verse } from '$lib/db';
  import { splitStelle, getLastWords } from '$lib/utils';
  import { tippWoerter } from '$lib/stores';
  import RatingButtons from './RatingButtons.svelte';
  import VorlesenButton from './VorlesenButton.svelte';

  let { verse, onRate, onShowTip, onReveal, showTip, showText, progress, onGoBack }: {
    verse: Verse;
    onRate: (grade: number) => void;
    onShowTip: () => void;
    onReveal: () => void;
    showTip: boolean;
    showText: boolean;
    progress: { current: number; total: number };
    onGoBack?: () => void;
  } = $props();

  let woerter = $state(5);
  tippWoerter.subscribe(v => woerter = v);

  let stelleParts = $derived(splitStelle(verse.stelle));
  let tipp = $derived(getLastWords(verse.text, woerter));
  let vorlesenText = $derived(`${verse.stelle} – ${verse.text}`);
</script>

<div class="h-full bg-black flex flex-col overflow-hidden relative">
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

  <!-- Header (Context) -->
  <div class="px-4 py-2 shrink-0 text-center border-b border-zinc-800">
    <h2 class="text-xl font-bold text-white truncate flex items-center justify-center gap-2">
      <span class="material-icons text-zinc-500 text-lg">format_quote</span>
      {stelleParts.book} {stelleParts.chapvers}
    </h2>
  </div>

  <!-- Scrollable Answer Area -->
  <div class="flex-1 overflow-y-auto p-4 flex flex-col">
    {#if !showText}
      {#if showTip}
        <div class="m-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center shadow-sm w-full max-w-md">
          <div class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Tipp</div>
          <div class="text-white font-medium text-xl">... {tipp}</div>
        </div>
      {/if}
    {:else}
      <div class="m-auto w-full max-w-md">
        <div class="text-center text-white leading-snug font-semibold" style="font-size: clamp(1.25rem, 5vw, 2rem);">
          {verse.text}
        </div>
      </div>
    {/if}
  </div>

  <!-- Fixed Bottom Buttons -->
  <div class="shrink-0 p-4 bg-black border-t border-zinc-900 space-y-3 pb-[calc(env(safe-area-inset-bottom)+5rem)]">
    <div class="max-w-md mx-auto w-full space-y-3">
      {#if !showText}
        {#if !showTip}
          <button
            onclick={onShowTip}
            class="w-full bg-zinc-900 text-white border border-zinc-800 px-6 py-4 rounded-2xl hover:bg-zinc-800 active:scale-95 font-bold text-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
          >
            <span class="material-icons text-zinc-400">lightbulb</span>
            Tipp anzeigen
          </button>
        {/if}
        <button
          onclick={onReveal}
          class="w-full bg-red-600 text-white px-6 py-5 rounded-2xl hover:bg-red-700 active:scale-95 font-bold text-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm shadow-red-900/20"
        >
          <span class="material-icons">visibility</span>
          Aufdecken
        </button>
      {:else}
        <RatingButtons {onRate} />
        <VorlesenButton text={vorlesenText} />
      {/if}
    </div>
  </div>
</div>
