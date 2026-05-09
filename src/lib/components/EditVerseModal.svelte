<script lang="ts">
  import type { Verse } from '$lib/db';
  import { stelleNormalisieren } from '$lib/bible';

  let { show, verse, onSave, onCancel }: {
    show: boolean;
    verse: Verse | null;
    onSave: (id: number, stelle: string, text: string, tags: string) => void;
    onCancel: () => void;
  } = $props();

  let stelleInput = $state('');
  let textInput = $state('');
  let tagsInput = $state('');
  let erkannteStelle = $state<string | null>(null);
  let feedback = $state('');

  $effect(() => {
    if (verse) {
      stelleInput = verse.stelle;
      textInput = verse.text;
      tagsInput = Array.isArray(verse.tags) ? verse.tags.join(', ') : (verse.tags || '');
      erkannteStelle = null;
      feedback = '';
    }
  });

  function checkStelle() {
    if (!stelleInput.trim()) {
      feedback = '';
      erkannteStelle = null;
      return;
    }

    const erkannt = stelleNormalisieren(stelleInput);
    if (erkannt) {
      feedback = `✓ ${erkannt}`;
      erkannteStelle = erkannt;
    } else {
      feedback = '✗ Stelle nicht erkannt';
      erkannteStelle = null;
    }
  }

  function uebernehmen() {
    if (erkannteStelle) {
      stelleInput = erkannteStelle;
      feedback = '';
    }
  }

  function submit() {
    if (!verse) return;
    if (!stelleInput.trim() || !textInput.trim()) {
      alert('Stelle und Text sind Pflichtfelder');
      return;
    }

    const stelle = erkannteStelle || stelleNormalisieren(stelleInput) || stelleInput;
    onSave(verse.id!, stelle, textInput.trim(), tagsInput.trim());
  }
</script>

{#if show}
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-800 max-w-md w-full overflow-hidden">
      <div class="px-6 py-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
        <h2 class="text-xl font-bold text-white">Vers bearbeiten</h2>
        <button onclick={onCancel} class="text-zinc-500 hover:text-white active:scale-95 transition-all p-1 rounded-full hover:bg-zinc-800">
          <span class="material-icons">close</span>
        </button>
      </div>

      <div class="p-6 space-y-5">
        <div>
          <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1">Bibelstelle</label>
          <div class="flex gap-2">
            <input
              type="text"
              bind:value={stelleInput}
              oninput={checkStelle}
              class="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-all font-medium"
            />
            {#if erkannteStelle}
              <button
                onclick={uebernehmen}
                class="px-4 py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 active:scale-95 transition-all font-semibold shadow-sm"
              >
                <span class="material-icons text-lg">check</span>
              </button>
            {/if}
          </div>
          {#if feedback}
            <div class="mt-2 ml-1 text-xs {erkannteStelle ? 'text-green-500' : 'text-red-500'} font-medium flex items-center gap-1">
              <span class="material-icons text-[14px]">{erkannteStelle ? 'check_circle' : 'error'}</span>
              {feedback.replace('✓ ', '').replace('✗ ', '')}
            </div>
          {/if}
        </div>

        <div>
          <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1">Vers-Text</label>
          <textarea
            bind:value={textInput}
            rows="4"
            class="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-all font-medium resize-none"
          ></textarea>
        </div>

        <div>
          <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1">Themen</label>
          <input
            type="text"
            bind:value={tagsInput}
            class="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-all font-medium"
          />
        </div>
      </div>

      <div class="p-6 bg-zinc-900 border-t border-zinc-800 flex gap-3">
        <button
          onclick={onCancel}
          class="flex-1 px-4 py-3.5 bg-zinc-800 border border-zinc-700 text-white rounded-2xl hover:bg-zinc-700 active:scale-95 font-semibold transition-all shadow-sm"
        >
          Abbrechen
        </button>
        <button
          onclick={submit}
          class="flex-1 px-4 py-3.5 bg-red-600 text-white rounded-2xl hover:bg-red-700 active:scale-95 font-semibold transition-all shadow-sm shadow-red-900/20"
        >
          Speichern
        </button>
      </div>
    </div>
  </div>
{/if}