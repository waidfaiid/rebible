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

<div class="h-screen bg-white flex flex-col overflow-hidden">
  <!-- Fortschrittsbalken + Zurück -->
  <div class="bg-white border-b border-gray-100 px-4 py-3 shrink-0">
    <div class="flex justify-between items-center mb-2">
      <button
        onclick={onGoBack}
        class="text-gray-400 hover:text-black p-2 rounded-lg transition-colors duration-200"
        disabled={!onGoBack}
      >
        <span class="material-icons">arrow_back</span>
      </button>
      <span class="text-sm font-light text-gray-500">{progress.current} von {progress.total}</span>
    </div>
    <div class="w-full bg-gray-100 rounded-full h-1">
      <div
        class="bg-black h-1 rounded-full transition-all duration-500"
        style="width: {progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%"
      ></div>
    </div>
  </div>

  <div class="flex-1 flex flex-col p-4 overflow-y-auto pb-32">
    <div class="max-w-md w-full mx-auto flex-1 flex flex-col">

      {#if currentVerse && currentIndex < verses.length}
        <!-- Frage: nur Buch(bereich) anzeigen -->
        <div class="text-center mb-6">
          <div class="text-4xl font-light text-black mb-1">{rangeParts.book}</div>
          {#if rangeParts.sub}
            <div class="text-xl font-light text-gray-500">{rangeParts.sub}</div>
          {/if}
          <div class="text-xs text-gray-400 font-light mt-2">
            Vers {currentIndex + 1} von {verses.length}
          </div>
        </div>

        {#if !showText}
          <!-- Tipp -->
          {#if showTip}
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-center">
              <div class="text-xs text-amber-600 font-medium mb-1">Tipp – letzte {woerter} Wörter</div>
              <div class="text-gray-800 font-light italic">{tipp}</div>
            </div>
          {/if}

          <!-- Aktions-Buttons -->
          <div class="space-y-3">
            {#if !showTip}
              <button
                onclick={() => showTip = true}
                class="w-full bg-gray-100 text-black px-4 py-3 rounded-lg hover:bg-gray-200 font-light transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <span class="material-icons text-lg">lightbulb</span>
                Tipp anzeigen
              </button>
            {/if}
            <button
              onclick={reveal}
              class="w-full bg-black text-white px-4 py-3 rounded-lg hover:bg-gray-800 font-light transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <span class="material-icons text-lg">visibility</span>
              Vers aufdecken
            </button>
          </div>

        {:else}
          <!-- Antwort: volle Stelle + Text -->
          <div class="text-center mb-5">
            <div class="text-lg font-semibold text-black mb-1">
              {stelleParts.book} {stelleParts.chapvers}
            </div>
            <div class="text-base font-light text-gray-800 leading-relaxed" style="font-size: clamp(0.95rem, 2.2vw, 1.15rem);">
              {currentVerse.text}
            </div>
          </div>
          <div class="mb-2">
            <VorlesenButton text={vorlesenText} />
          </div>
        {/if}

      {:else}
        <!-- Alle Verse dieser Gruppe abgeschlossen -->
        <div class="text-center mt-8">
          <div class="text-sm font-light text-gray-600 mb-3">Alle Verse in diesem Bereich abgeschlossen.</div>
          <button
            onclick={onShowNext}
            class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-light"
          >
            Nächster Bereich
          </button>
        </div>
      {/if}
    </div>
  </div>

  {#if showText && currentVerse && currentIndex < verses.length}
    <RatingButtons onRate={rate} />
  {/if}
</div>
