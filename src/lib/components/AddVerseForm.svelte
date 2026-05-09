<script lang="ts">
  import { stelleNormalisieren } from '$lib/bible';

  let { onAdd }: { onAdd: (stelle: string, text: string, tags: string) => void } = $props();

  let stelleInput = $state('');
  let textInput = $state('');
  let tagsInput = $state('');
  let erkannteStelle = $state<string | null>(null);
  let feedback = $state('');

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
      feedback = '✗ Stelle nicht erkannt. Format: "Römer 5,4"';
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
    if (!stelleInput.trim()) {
      alert('Bitte eine Bibelstelle eingeben');
      return;
    }
    if (!textInput.trim()) {
      alert('Bitte den Vers-Text eingeben');
      return;
    }

    const stelle = erkannteStelle || stelleNormalisieren(stelleInput) || stelleInput;
    onAdd(stelle, textInput.trim(), tagsInput.trim());

    // Reset
    stelleInput = '';
    textInput = '';
    tagsInput = '';
    erkannteStelle = null;
    feedback = '';
  }
</script>

<div class="bg-white border border-gray-100 rounded-2xl p-8 mb-8">
  <div class="flex items-center gap-3 mb-8">
    <span class="material-icons text-gray-400 text-2xl">add_circle</span>
    <h2 class="text-2xl font-light text-black">Neuer Vers</h2>
  </div>

  <div class="space-y-6">
    <div>
      <label class="block text-sm font-light text-gray-700 mb-2">Bibelstelle</label>
      <div class="flex gap-2">
        <input
          type="text"
          bind:value={stelleInput}
          oninput={checkStelle}
          placeholder="z.B. Römer 5,4"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {#if erkannteStelle}
          <button
            onclick={uebernehmen}
            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Übernehmen
          </button>
        {/if}
      </div>
      {#if feedback}
        <div class="mt-1 text-xs {erkannteStelle ? 'text-green-600' : 'text-red-600'} font-light">
          {feedback}
        </div>
      {/if}
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Vers-Text</label>
      <textarea
        bind:value={textInput}
        placeholder="Gib hier den Vers-Text ein…"
        rows="4"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      ></textarea>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Tags (kommagetrennt, optional)</label>
      <input
        type="text"
        bind:value={tagsInput}
        placeholder="z.B. Gnade, Hoffnung, Mut"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <button
      onclick={submit}
      class="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl hover:shadow-lg font-bold transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
    >
      <span class="material-icons">save</span>
      Vers speichern
    </button>
  </div>
</div>