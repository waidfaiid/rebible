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

<div class="bg-white rounded-lg shadow-md p-6 mb-6">
  <h2 class="text-xl font-semibold mb-4">Neue Verse hinzufügen</h2>

  <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Bibelstelle</label>
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
        <div class="mt-1 text-sm {erkannteStelle ? 'text-green-600' : 'text-red-600'}">
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
      class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium"
    >
      Vers speichern
    </button>
  </div>
</div>