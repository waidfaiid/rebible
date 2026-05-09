<script lang="ts">
  import type { Verse } from '$lib/db';
  import { splitStelle } from '$lib/utils';
  import RatingButtons from './RatingButtons.svelte';

  let { verses, tag, onRate, onShowNext, progress, onGoBack }: {
    verses: Verse[];
    tag: string;
    onRate: (verseId: number, grade: number) => void;
    onShowNext: () => void;
    progress: { current: number; total: number };
    onGoBack?: () => void;
  } = $props();

  let currentIndex = $state(0);
  let showTip = $state(false);
  let showText = $state(false);

  // Reset state when the verse group changes (detected by first verse id)
  let prevVersesId = $state<number | null>(null);
  $effect(() => {
    if (verses.length > 0 && verses[0]?.id !== prevVersesId) {
      prevVersesId = verses[0].id ?? null;
      currentIndex = 0;
      showTip = false;
      showText = false;
    }
  });

  let currentVerse = $derived(verses[currentIndex]);
  let stelleParts = $derived(currentVerse ? splitStelle(currentVerse.stelle) : { book: '', chapvers: '' });

  function showTipp() {
    showTip = true;
  }

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
  <!-- Progress Bar and Back Button -->
  <div class="bg-white border-b border-gray-100 px-4 py-3 shrink-0">
    <div class="flex justify-between items-center mb-2">
      <button
        onclick={onGoBack}
        class="text-gray-400 hover:text-black p-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
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

  <!-- Card Content -->
  <div class="flex-1 flex flex-col p-4 pb-24 overflow-hidden">
    <div class="max-w-md w-full mx-auto flex-1 flex flex-col">
      <!-- Tag -->
      <div class="mb-3 text-center">
        <div class="text-3xl font-light text-black">{tag}</div>
        {#if currentIndex === 0}
          <div class="text-xs font-light text-gray-600 mt-1">Erster Vers</div>
        {/if}
      </div>

      {#if currentVerse && currentIndex < verses.length}
        <!-- Content - Scrollable if needed -->
        <div class="flex-1 overflow-y-auto">
          {#if !showText}
            <!-- Vers Text (Frage) -->
            <div class="mb-6 text-center">
              <div class="text-lg font-light text-black leading-relaxed max-w-2xl mx-auto" style="font-size: clamp(1rem, 2.2vw, 1.25rem);">
                {currentVerse.text}
              </div>
            </div>

            <!-- Tipp Section -->
            {#if showTip}
              <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                <div class="text-gray-700 font-light">{stelleParts.book}</div>
              </div>
            {/if}

            <!-- Buttons -->
            <div class="space-y-3">
              {#if !showTip}
                <button
                  onclick={showTipp}
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
                Vers anzeigen
              </button>
            </div>
          {:else}
            <!-- Stelle + Vers zusammen auf einer Zeile -->
            <div class="text-center">
              <div class="text-lg font-light text-black leading-relaxed max-w-2xl mx-auto" style="font-size: clamp(1rem, 2.2vw, 1.25rem);">
                <span class="font-semibold">{stelleParts.book} {stelleParts.chapvers}</span>
                {' '}
                {currentVerse.text}
              </div>
            </div>
          {/if}
        </div>
      {:else}
        <!-- Finished -->
        <div class="text-center">
          <div class="text-sm font-light text-gray-600 mb-3">Alle Verse zu diesem Thema wurden bearbeitet.</div>
          <button
            onclick={onShowNext}
            class="bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 font-light transition-colors duration-200"
          >
            Nächstes Thema
          </button>
        </div>
      {/if}
    </div>
  </div>

  {#if showText && currentVerse && currentIndex < verses.length}
    <RatingButtons onRate={rate} />
  {/if}
</div>