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

<div class="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-sm">
  <div class="flex items-center gap-3 mb-4">
    <div class="bg-zinc-800 text-zinc-300 p-2 rounded-xl">
      <span class="material-icons text-xl">add</span>
    </div>
    <h2 class="text-xl font-bold text-white">Neuer Vers</h2>
  </div>

  <div class="space-y-3">
    <div>
      <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1">Bibelstelle</label>
      <div class="flex gap-2">
        <input
          type="text"
          bind:value={stelleInput}
          oninput={checkStelle}
          placeholder="z.B. Römer 5,4"
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
        <div class="mt-1.5 ml-1 text-xs {erkannteStelle ? 'text-green-500' : 'text-red-500'} font-medium flex items-center gap-1">
          <span class="material-icons text-[14px]">{erkannteStelle ? 'check_circle' : 'error'}</span>
          {feedback.replace('✓ ', '').replace('✗ ', '')}
        </div>
      {/if}
    </div>

    <div>
      <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1">Vers-Text</label>
      <textarea
        bind:value={textInput}
        placeholder="Gib hier den Vers-Text ein…"
        rows="2"
        class="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-all font-medium resize-none"
      ></textarea>
    </div>

    <div>
      <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1">Themen (optional)</label>
      <input
        type="text"
        bind:value={tagsInput}
        placeholder="z.B. Gnade, Hoffnung, Mut"
        class="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-all font-medium"
      />
    </div>

    <button
      onclick={submit}
      class="w-full bg-red-600 text-white py-3.5 px-4 rounded-2xl hover:bg-red-700 active:scale-95 font-semibold transition-all duration-200 shadow-sm shadow-red-900/20 flex items-center justify-center gap-2 mt-2"
    >
      <span class="material-icons">save</span>
      Vers speichern
    </button>
  </div>
</div>