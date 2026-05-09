<script lang="ts">
  import type { Verse } from '$lib/db';
  import { splitStelle } from '$lib/utils';
  import RatingButtons from './RatingButtons.svelte';
  import VorlesenButton from './VorlesenButton.svelte';

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
</script>

<div class="h-screen bg-white flex flex-col overflow-hidden">
  <!-- Fortschrittsbalken + Zurück -->
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

  <!-- Karteninhalt -->
  <div class="flex-1 flex flex-col p-4 pb-32 overflow-y-auto">
    <div class="max-w-md w-full mx-auto flex-1 flex flex-col">
      <!-- Vers-Text (Frage) -->
      <div class="mb-6 text-center">
        <div class="text-base font-light text-black leading-relaxed max-w-2xl mx-auto" style="font-size: clamp(1rem, 2.2vw, 1.25rem);">
          {verse.text}
        </div>
      </div>

      {#if !showText}
        <!-- Tipp: nur Buchname -->
        {#if showTip}
          <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-center">
            <div class="text-xs text-amber-600 font-medium mb-1">Tipp – Buch</div>
            <div class="text-gray-800 font-medium">{stelleParts.book}</div>
          </div>
        {/if}

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
            Stelle anzeigen
          </button>
        </div>

      {:else}
        <!-- Antwort: Bibelstelle -->
        <div class="text-center mb-5">
          <div class="text-4xl font-light text-black mb-2">{stelleParts.book}</div>
          <div class="text-xl font-light text-gray-600">{stelleParts.chapvers}</div>
        </div>
        <div class="mb-2">
          <VorlesenButton text={vorlesenText} />
        </div>
      {/if}
    </div>
  </div>

  {#if showText}
    <RatingButtons {onRate} />
  {/if}
</div>
