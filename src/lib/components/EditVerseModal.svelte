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
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
      <h2 class="text-xl font-semibold mb-4">Vers bearbeiten</h2>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Bibelstelle</label>
          <div class="flex gap-2">
            <input
              type="text"
              bind:value={stelleInput}
              oninput={checkStelle}
              class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {#if erkannteStelle}
              <button
                onclick={uebernehmen}
                class="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
              >
                Übernehmen
              </button>
            {/if}
          </div>
          {#if feedback}
            <div class="mt-1 text-sm {erkannteStelle ? 'text-green-600' : 'text-red-600'}">
              {feedback}
            </div>
          {/if}
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Vers-Text</label>
          <textarea
            bind:value={textInput}
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <input
            type="text"
            bind:value={tagsInput}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div class="flex gap-3 mt-6">
        <button
          onclick={onCancel}
          class="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Abbrechen
        </button>
        <button
          onclick={submit}
          class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Speichern
        </button>
      </div>
    </div>
  </div>
{/if}