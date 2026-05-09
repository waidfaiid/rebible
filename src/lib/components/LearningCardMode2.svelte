<script lang="ts">
  import type { Verse } from '$lib/db';

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
    if (onShowTip) {
      onShowTip();
    } else {
      showTip = true;
    }
  }

  function reveal() {
    if (onReveal) {
      onReveal();
    } else {
      showTip = false;
      showText = true;
    }
  }

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

  // Tipp: only the book
  let stelleParts = $derived(splitStelle(verse.stelle));
  let tipp = $derived(stelleParts.book);
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
      <!-- Vers Text -->
      <div class="mb-4 text-center">
        <div class="text-lg font-light text-black leading-relaxed max-w-2xl mx-auto" style="font-size: clamp(1rem, 2.2vw, 1.25rem);">
          {verse.text}
        </div>
      </div>

      <!-- Content - Scrollable if needed -->
      <div class="flex-1 overflow-y-auto">
        {#if !showText}
          <!-- Tipp Section -->
          {#if showTip}
            <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
              <div class="text-gray-700 font-light">{tipp}</div>
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
          <!-- Stelle Answer -->
          <div class="text-center">
            <div class="text-4xl font-light text-black mb-2">{stelleParts.book}</div>
            <div class="text-xl font-light text-gray-600">{stelleParts.chapvers}</div>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Rating Buttons - Fixed at bottom above navigation -->
  {#if showText}
    <div class="fixed bottom-12 left-4 right-4 z-10">
      <div class="max-w-md mx-auto">
        <div class="grid grid-cols-2 gap-2">
          <button
            onclick={() => onRate(0)}
            class="bg-red-50 text-black py-3 px-4 rounded-lg hover:bg-red-100 font-light text-sm transition-colors duration-200 flex items-center justify-center gap-1 border border-red-200"
            title="Vergessen"
          >
            <span class="material-icons text-sm">close</span>
          </button>
          <button
            onclick={() => onRate(1)}
            class="bg-orange-50 text-black py-3 px-4 rounded-lg hover:bg-orange-100 font-light text-sm transition-colors duration-200 flex items-center justify-center gap-1 border border-orange-200"
            title="Lückenhaft"
          >
            <span class="material-icons text-sm">warning</span>
          </button>
          <button
            onclick={() => onRate(3)}
            class="bg-yellow-50 text-black py-3 px-4 rounded-lg hover:bg-yellow-100 font-light text-sm transition-colors duration-200 flex items-center justify-center gap-1 border border-yellow-200"
            title="Gut"
          >
            <span class="material-icons text-sm">thumb_up</span>
          </button>
          <button
            onclick={() => onRate(4)}
            class="bg-green-50 text-black py-3 px-4 rounded-lg hover:bg-green-100 font-light text-sm transition-colors duration-200 flex items-center justify-center gap-1 border border-green-200"
            title="Perfekt"
          >
            <span class="material-icons text-sm">star</span>
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>