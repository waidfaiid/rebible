<script lang="ts">
  import type { Verse } from '$lib/db';
  import { stelleNormalisieren } from '$lib/bible';

  let { show, verse, onSave, onCancel }: {
    show: boolean;
    verse: Verse | null;
    onSave: (
      id: number, stelle: string, text: string, tags: string,
      sm2: { easeFactor: number; interval: number; reviewCount: number; nextReview: string; lastReview: string }
    ) => void;
    onCancel: () => void;
  } = $props();

  let stelleInput = $state('');
  let textInput = $state('');
  let tagsInput = $state('');
  let erkannteStelle = $state<string | null>(null);
  let feedback = $state('');

  let efInput = $state(2.5);
  let intervalInput = $state(1);
  let reviewCountInput = $state(0);
  let nextReviewInput = $state('');
  let lastReviewInput = $state('');

  $effect(() => {
    if (verse) {
      stelleInput = verse.stelle;
      textInput = verse.text;
      tagsInput = Array.isArray(verse.tags) ? verse.tags.join(', ') : (verse.tags || '');
      erkannteStelle = null;
      feedback = '';
      efInput = verse.easeFactor ?? 2.5;
      intervalInput = verse.interval ?? 1;
      reviewCountInput = verse.reviewCount ?? 0;
      nextReviewInput = verse.nextReview ? verse.nextReview.slice(0, 10) : '';
      lastReviewInput = verse.lastReview ? verse.lastReview.slice(0, 10) : '';
    }
  });

  function checkStelle() {
    if (!stelleInput.trim()) { feedback = ''; erkannteStelle = null; return; }
    const erkannt = stelleNormalisieren(stelleInput);
    if (erkannt) { feedback = erkannt; erkannteStelle = erkannt; }
    else { feedback = '✗'; erkannteStelle = null; }
  }

  function uebernehmen() {
    if (erkannteStelle) { stelleInput = erkannteStelle; feedback = ''; }
  }

  function submit() {
    if (!verse) return;
    if (!stelleInput.trim() || !textInput.trim()) { alert('Stelle und Text sind Pflichtfelder'); return; }
    const stelle = erkannteStelle || stelleNormalisieren(stelleInput) || stelleInput;
    onSave(verse.id!, stelle, textInput.trim(), tagsInput.trim(), {
      easeFactor: Math.round(efInput * 100) / 100,
      interval: intervalInput,
      reviewCount: reviewCountInput,
      nextReview: nextReviewInput ? new Date(nextReviewInput + 'T12:00:00').toISOString() : (verse.nextReview || new Date().toISOString()),
      lastReview: lastReviewInput ? new Date(lastReviewInput + 'T12:00:00').toISOString() : (verse.lastReview || '')
    });
  }
</script>

{#if show}
  <!--
    Vollbild-Modal: füllt den Bildschirm von ganz oben bis zur Unterkante
    der Bottom-Navigationsleiste. z-[45] damit die Nav (z-50) sichtbar bleibt.
  -->
  <div
    class="fixed top-0 inset-x-0 z-[45] bg-zinc-900 flex flex-col"
    style="bottom: calc(56px + env(safe-area-inset-bottom))"
  >
    <!-- Header -->
    <div
      class="shrink-0 bg-zinc-900 border-b border-zinc-800 px-5 flex items-center justify-between"
      style="padding-top: max(2rem, env(safe-area-inset-top)); padding-bottom: 0.875rem"
    >
      <h2 class="text-xl font-bold text-white">Vers bearbeiten</h2>
      <button
        onclick={onCancel}
        class="text-zinc-500 hover:text-white p-1.5 rounded-full hover:bg-zinc-800 transition-all active:scale-95"
      >
        <span class="material-icons">close</span>
      </button>
    </div>

    <!-- Scrollbarer Inhalt -->
    <div class="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-5">

      <!-- Bibelstelle -->
      <div>
        <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">Bibelstelle</label>
        <div class="flex gap-2">
          <input
            type="text"
            bind:value={stelleInput}
            oninput={checkStelle}
            class="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-all font-medium"
          />
          {#if erkannteStelle}
            <button onclick={uebernehmen} class="px-4 py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 active:scale-95 transition-all">
              <span class="material-icons">check</span>
            </button>
          {/if}
        </div>
        {#if feedback}
          <div class="mt-1.5 ml-1 text-xs {erkannteStelle ? 'text-green-500' : 'text-red-500'} font-medium flex items-center gap-1">
            <span class="material-icons text-[13px]">{erkannteStelle ? 'check_circle' : 'error'}</span>
            {feedback.replace('✓ ', '').replace('✗ ', '')}
          </div>
        {/if}
      </div>

      <!-- Vers-Text (groß, viel Platz) -->
      <div>
        <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">Vers-Text</label>
        <textarea
          bind:value={textInput}
          rows="7"
          class="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-all font-medium resize-none leading-relaxed"
        ></textarea>
      </div>

      <!-- Themen -->
      <div>
        <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">Themen</label>
        <input
          type="text"
          bind:value={tagsInput}
          placeholder="z.B. Glaube, Hoffnung"
          class="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-all font-medium"
        />
      </div>

      <!-- SM-2 Lernwerte -->
      <div>
        <div class="flex items-center gap-2 mb-3">
          <div class="h-px flex-1 bg-zinc-800"></div>
          <span class="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">SM-2 Lernwerte</span>
          <div class="h-px flex-1 bg-zinc-800"></div>
        </div>

        <!-- Zeile 1: EF, Intervall, Anzahl -->
        <div class="grid grid-cols-3 gap-2 mb-2">
          <div class="bg-zinc-800 rounded-xl p-3 text-center">
            <input
              type="number"
              bind:value={efInput}
              min="1.3" max="3.5" step="0.01"
              class="w-full bg-transparent text-white font-bold text-base text-center focus:outline-none"
            />
            <div class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Ease Factor</div>
          </div>
          <div class="bg-zinc-800 rounded-xl p-3 text-center">
            <div class="flex items-center justify-center gap-1">
              <input
                type="number"
                bind:value={intervalInput}
                min="1" max="365" step="1"
                class="w-12 bg-transparent text-white font-bold text-base text-center focus:outline-none"
              />
              <span class="text-zinc-500 text-sm font-medium">d</span>
            </div>
            <div class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Intervall</div>
          </div>
          <div class="bg-zinc-800 rounded-xl p-3 text-center">
            <div class="flex items-center justify-center gap-2">
              <button
                onclick={() => reviewCountInput = Math.max(0, reviewCountInput - 1)}
                class="text-zinc-400 hover:text-white active:scale-95 transition-all"
              >
                <span class="material-icons text-base">remove</span>
              </button>
              <span class="text-white font-bold text-base w-6 text-center">{reviewCountInput}</span>
              <button
                onclick={() => reviewCountInput += 1}
                class="text-zinc-400 hover:text-white active:scale-95 transition-all"
              >
                <span class="material-icons text-base">add</span>
              </button>
            </div>
            <div class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Anz. Wdh.</div>
          </div>
        </div>

        <!-- Zeile 2: Nächste + Letzte -->
        <div class="grid grid-cols-2 gap-2">
          <div class="bg-zinc-800 rounded-xl p-3">
            <input
              type="date"
              bind:value={nextReviewInput}
              class="w-full bg-transparent text-white text-sm font-medium focus:outline-none"
            />
            <div class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Nächste Wdh.</div>
          </div>
          <div class="bg-zinc-800 rounded-xl p-3">
            <input
              type="date"
              bind:value={lastReviewInput}
              class="w-full bg-transparent text-white text-sm font-medium focus:outline-none"
            />
            <div class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Letzte Wdh.</div>
          </div>
        </div>
      </div>

    </div>

    <!-- Footer-Buttons -->
    <div class="shrink-0 bg-zinc-900 border-t border-zinc-800 px-5 py-4 flex gap-3">
      <button
        onclick={onCancel}
        class="flex-1 py-3.5 bg-zinc-800 border border-zinc-700 text-white rounded-2xl hover:bg-zinc-700 active:scale-95 font-semibold transition-all"
      >
        Abbrechen
      </button>
      <button
        onclick={submit}
        class="flex-1 py-3.5 bg-red-600 text-white rounded-2xl hover:bg-red-700 active:scale-95 font-bold transition-all shadow-sm"
      >
        Speichern
      </button>
    </div>

  </div>

  <!-- Abdunklung hinter dem Modal (vor der Nav, die darüber bleibt) -->
  <div class="fixed inset-0 z-[44] bg-black/60 backdrop-blur-sm" onclick={onCancel}></div>
{/if}
