<script lang="ts">
  import type { Verse } from '$lib/db';
  import { splitStelle, getLastWords } from '$lib/utils';
  import { tippWoerter } from '$lib/stores';
  import RatingButtons from './RatingButtons.svelte';
  import VorlesenButton from './VorlesenButton.svelte';

  let { verses, bookRange, onRate, onShowNext, progress, onGoBack }: {
    verses: Verse[];
    bookRange: string;
    onRate: (verseId: number, grade: number) => void;
    onShowNext: () => void;
    progress: { current: number; total: number };
    onGoBack?: () => void;
  } = $props();

  let currentIndex = $state(0);
  let showTip = $state(false);
  let showText = $state(false);
  let woerter = $state(5);
  tippWoerter.subscribe(v => woerter = v);

  // Reset wenn neue Gruppe kommt
  let prevVersesId = $state<number | null>(null);
  $effect(() => {
    if (verses.length > 0 && verses[0]?.id !== prevVersesId) {
      prevVersesId = verses[0].id ?? null;
      currentIndex = 0;
      showTip = false;
      showText = false;
    }
  });

  function splitBookRange(range: string) {
    const parts = range.split(' ');
    return { book: parts[0], sub: parts.slice(1).join(' ') };
  }

  let rangeParts = $derived(splitBookRange(bookRange));
  let currentVerse = $derived(verses[currentIndex]);
  let stelleParts = $derived(currentVerse ? splitStelle(currentVerse.stelle) : { book: '', chapvers: '' });
  let tipp = $derived(currentVerse ? getLastWords(currentVerse.text, woerter) : '');
  let vorlesenText = $derived(
    currentVerse ? `${currentVerse.stelle} – ${currentVerse.text}` : ''
  );

  function reveal() {
    showTip = false;
    showText = true;
  }

  function rate(grade: number) {
    if (!currentVerse) return;
    onRate(currentVerse.id!, grade);
    showTip = false;
    showText = false;
    currentIndex++;
    if (currentIndex >= verses.length) {
      onShowNext();
    }
  }
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
      <span class="material-icons text-zinc-500 text-lg">auto_stories</span>
      {rangeParts.book} {rangeParts.sub}
      <span class="text-xs font-bold text-zinc-500 ml-2">{currentIndex + 1} / {verses.length}</span>
    </h2>
  </div>

  <!-- Scrollable Answer Area -->
  <div class="flex-1 overflow-y-auto p-4 flex flex-col">
    <div class="m-auto w-full max-w-md">
      {#if currentVerse && currentIndex < verses.length}
        {#if !showText}
          <!-- Tipp -->
          {#if showTip}
            <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center shadow-sm">
              <div class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Tipp – letzte {woerter} Wörter</div>
              <div class="text-white font-medium text-xl">... {tipp}</div>
            </div>
          {/if}
        {:else}
          <div class="text-center mb-6">
            <div class="text-2xl font-bold text-white mb-3">
              {stelleParts.book} {stelleParts.chapvers}
            </div>
            <div class="text-white leading-snug font-semibold" style="font-size: clamp(1.25rem, 5vw, 2rem);">
              {currentVerse.text}
            </div>
          </div>
        {/if}
      {:else}
        <!-- Alle Verse dieser Gruppe abgeschlossen -->
        <div class="bg-zinc-900 rounded-3xl shadow-sm border border-zinc-800 p-8 text-center">
          <div class="text-green-500 mb-4 flex justify-center">
            <span class="material-icons text-5xl">task_alt</span>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">Bereich abgeschlossen</h3>
          <p class="text-zinc-400 mb-6">Du hast alle Verse in diesem Bereich gelernt.</p>
          <button
            onclick={onShowNext}
            class="w-full bg-red-600 text-white px-6 py-4 rounded-2xl hover:bg-red-700 active:scale-95 font-bold transition-all duration-200 shadow-sm shadow-red-900/20"
          >
            Nächster Bereich
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Fixed Bottom Buttons -->
  {#if currentVerse && currentIndex < verses.length}
    <div class="shrink-0 p-4 bg-black border-t border-zinc-900 space-y-3 pb-[calc(env(safe-area-inset-bottom)+5rem)]">
      <div class="max-w-md mx-auto w-full space-y-3">
        {#if !showText}
          {#if !showTip}
            <button
              onclick={() => showTip = true}
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
            Vers aufdecken
          </button>
        {:else}
          <RatingButtons onRate={rate} />
          <VorlesenButton text={vorlesenText} />
        {/if}
      </div>
    </div>
  {/if}
</div>
