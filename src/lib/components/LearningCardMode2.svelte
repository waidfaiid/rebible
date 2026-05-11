<script lang="ts">
  import type { Verse } from '$lib/db';
  import { splitStelle } from '$lib/utils';
  import RatingButtons from './RatingButtons.svelte';
  import VorlesenButton from './VorlesenButton.svelte';
  import { frageFontSize, frageGroesse } from '$lib/stores';

  let { verse, onRate, progress, onGoBack, showTip = false, showText = false, onShowTip, onReveal }: {
    verse: Verse;
    onRate: (grade: number) => void;
    progress: { current: number; total: number };
    onGoBack?: () => void;
    showTip?: boolean;
    showText?: boolean;
    onShowTip?: () => void;
    onReveal?: () => void;
  } = $props();

  function showTipp() {
    if (onShowTip) { onShowTip(); } else { showTip = true; }
  }

  function reveal() {
    if (onReveal) { onReveal(); } else { showTip = false; showText = true; }
  }

  // Tipp für Modus 2 (Text→Stelle): zeige nur das Buch als Hinweis
  let stelleParts = $derived(splitStelle(verse.stelle));
  let vorlesenText = $derived(`${verse.stelle} – ${verse.text}`);

  let fontSize = $state(1.8);
  frageFontSize.subscribe(v => fontSize = v);

  let frageSize = $state(1.5);
  frageGroesse.subscribe(v => frageSize = v);

  let maxWordsMode2 = $state(30);
  $effect(() => {
    const stored = localStorage.getItem('rebible_max_words_mode2_v2');
    if (stored) {
      maxWordsMode2 = parseInt(stored, 10);
    }
  });

  let displayedQuestionText = $derived(() => {
    const words = verse.text.split(/\s+/);
    if (words.length > maxWordsMode2) {
      const firstPart = words.slice(0, maxWordsMode2).join(' ');
      const lastPart = words.slice(-8).join(' ');
      return `${firstPart} ... ${lastPart}`;
    }
    return verse.text;
  });
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
      <span class="material-icons text-zinc-500 text-lg">explore</span>
      Referenz finden
    </h2>
  </div>

  <!-- Scrollable Answer Area -->
  <div class="flex-1 overflow-y-auto p-4 flex flex-col">
    <div class="m-auto w-full max-w-md">
      <div class="text-center text-white leading-snug font-semibold mb-6" style="font-size: {fontSize}rem;">
        {displayedQuestionText()}
      </div>

      {#if !showText}
        <!-- Tipp -->
        {#if showTip}
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center shadow-sm mt-6">
            <div class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Tipp – Buch</div>
            <div class="text-white font-bold text-2xl">{stelleParts.book}</div>
          </div>
        {/if}
      {:else}
        <div class="w-full h-px bg-zinc-800 my-6"></div>
        <div class="text-center">
          <div class="font-bold text-white leading-tight" style="font-size: {frageSize}rem;">{stelleParts.book}</div>
          <div class="font-semibold text-zinc-400 mt-1" style="font-size: {frageSize * 0.75}rem;">{stelleParts.chapvers}</div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Fixed Bottom Buttons -->
  <div class="shrink-0 p-4 bg-black border-t border-zinc-900 space-y-3 pb-[calc(env(safe-area-inset-bottom)+5rem)]">
    <div class="max-w-md mx-auto w-full space-y-3">
      {#if !showText}
        {#if !showTip}
          <button
            onclick={showTipp}
            class="w-full bg-zinc-900 text-white border border-zinc-800 px-6 py-4 rounded-2xl hover:bg-zinc-800 active:scale-95 font-bold text-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
          >
            <span class="material-icons text-zinc-400">lightbulb</span>
            Tipp anzeigen
          </button>
        {/if}
        <button
          onclick={reveal}
          class="w-full bg-red-600 text-white px-6 py-5 rounded-2xl hover:bg-red-700 active:scale-95 font-bold text-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm shadow-red-900/20"
        >
          <span class="material-icons">visibility</span>
          Stelle anzeigen
        </button>
      {:else}
        <RatingButtons {onRate} {verse} dreierModus={true} />
        <VorlesenButton text={vorlesenText} />
      {/if}
    </div>
  </div>
</div>
