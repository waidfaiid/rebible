<script lang="ts">
  import type { Verse } from '$lib/db';

  let { verse, onRate, onShowTip, onReveal, showTip, showText, progress }: {
    verse: Verse;
    onRate: (grade: number) => void;
    onShowTip: () => void;
    onReveal: () => void;
    showTip: boolean;
    showText: boolean;
    progress: { current: number; total: number };
  } = $props();

  // Split stelle into book and chapter:verse
  function splitStelle(stelle: string) {
    const regex = /^(.+?)\s+(\d+)(?:[,:](\d+))?$/;
    const m = stelle.match(regex);
    if (m) {
      return {
        book: m[1],
        chapvers: m[2] + (m[3] ? ',' + m[3] : '')
      };
    }
    return { book: stelle, chapvers: '' };
  }

  // Tipp: last 5 words
  function getTipp(text: string): string {
    const words = text.trim().split(/\s+/);
    return words.length > 5 ? '… ' + words.slice(-5).join(' ') : text;
  }

  let stelleParts = $derived(splitStelle(verse.stelle));
  let tipp = $derived(getTipp(verse.text));
</script>

<div class="min-h-screen bg-gray-50 flex flex-col">
  <!-- Progress -->
  <div class="bg-white shadow-sm p-4">
    <div class="flex justify-between items-center mb-2">
      <button class="text-gray-600 hover:text-gray-800" onclick={() => history.back()}>
        ← Zurück
      </button>
      <span class="text-sm text-gray-600">{progress.current} / {progress.total}</span>
    </div>
    <div class="w-full bg-gray-200 rounded-full h-2">
      <div
        class="bg-blue-600 h-2 rounded-full transition-all"
        style="width: {progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%"
      ></div>
    </div>
  </div>

  <!-- Card Content -->
  <div class="flex-1 flex items-center justify-center p-6">
    <div class="bg-white rounded-lg shadow-lg max-w-md w-full p-8 text-center">
      <!-- Stelle -->
      <div class="mb-6">
        <div class="text-3xl font-bold text-gray-800 mb-2">{stelleParts.book}</div>
        <div class="text-xl text-gray-600">{stelleParts.chapvers}</div>
      </div>

      <!-- Tipp -->
      {#if !showText}
        <div class="mb-6">
          {#if showTip}
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div class="text-gray-700 italic">{tipp}</div>
            </div>
          {:else}
            <button
              onclick={onShowTip}
              class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-medium"
            >
              Tipp anzeigen
            </button>
          {/if}
        </div>

        <!-- Aufdecken -->
        <button
          onclick={onReveal}
          class="bg-green-500 text-white px-8 py-4 rounded-lg hover:bg-green-600 font-medium text-lg"
        >
          Aufdecken
        </button>
      {:else}
        <!-- Vers Text -->
        <div class="mb-6">
          <div class="text-lg text-gray-800 leading-relaxed">{verse.text}</div>
        </div>

        <!-- Bewertung -->
        <div class="space-y-3">
          <div class="text-sm text-gray-600 mb-4">Wie gut kanntest du den Vers?</div>
          <div class="grid grid-cols-2 gap-3">
            <button
              onclick={() => onRate(0)}
              class="bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 font-medium"
            >
              Vergessen
            </button>
            <button
              onclick={() => onRate(1)}
              class="bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 font-medium"
            >
              Lückenhaft
            </button>
            <button
              onclick={() => onRate(3)}
              class="bg-yellow-500 text-white py-3 px-4 rounded-lg hover:bg-yellow-600 font-medium"
            >
              Gut
            </button>
            <button
              onclick={() => onRate(4)}
              class="bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 font-medium"
            >
              Perfekt
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>