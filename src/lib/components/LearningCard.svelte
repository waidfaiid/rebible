<script lang="ts">
  import type { Verse } from '$lib/db';
  import { splitStelle } from '$lib/utils';
  import RatingButtons from './RatingButtons.svelte';

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

  // Tipp: last 5 words
  function getTipp(text: string): string {
    const words = text.trim().split(/\s+/);
    return words.length > 5 ? '… ' + words.slice(-5).join(' ') : text;
  }

  let stelleParts = $derived(splitStelle(verse.stelle));
  let tipp = $derived(getTipp(verse.text));
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
      <!-- Stelle -->
      <div class="mb-4 text-center">
        <div class="text-4xl font-light text-black mb-2">{stelleParts.book}</div>
        <div class="text-xl font-light text-gray-600">{stelleParts.chapvers}</div>
      </div>

      <!-- Content - Scrollable if needed -->
      <div class="flex-1 overflow-y-auto">
        {#if !showText}
          <!-- Tipp Section -->
          {#if showTip}
            <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
              <div class="text-gray-700 font-light leading-relaxed">{tipp}</div>
            </div>
          {/if}

          <!-- Buttons -->
          <div class="space-y-3">
            {#if !showTip}
              <button
                onclick={onShowTip}
                class="w-full bg-gray-100 text-black px-4 py-3 rounded-lg hover:bg-gray-200 font-light transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <span class="material-icons text-lg">lightbulb</span>
                Tipp anzeigen
              </button>
            {/if}

            <button
              onclick={onReveal}
              class="w-full bg-black text-white px-4 py-3 rounded-lg hover:bg-gray-800 font-light transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <span class="material-icons text-lg">visibility</span>
              Aufdecken
            </button>
          </div>
        {:else}
          <!-- Vers Text -->
          <div class="text-center">
            <div class="text-lg font-light text-black leading-relaxed max-w-2xl mx-auto" style="font-size: clamp(1rem, 2.2vw, 1.25rem);">
              {verse.text}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>

  {#if showText}
    <RatingButtons {onRate} />
  {/if}
</div>