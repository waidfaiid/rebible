<script lang="ts">
  import BibelstellenEingabe from './BibelstellenEingabe.svelte';

  let { onAdd }: { onAdd: (stelle: string, text: string, tags: string) => void } = $props();

  let erkannteStelle = $state<string | null>(null);
  let textInput      = $state('');
  let tagsInput      = $state('');
  let resetKey       = $state(0);

  function submit() {
    if (!erkannteStelle) {
      alert('Bitte eine vollständige Bibelstelle eingeben (Buch + Kapitel)');
      return;
    }
    if (!textInput.trim()) {
      alert('Bitte den Vers-Text eingeben');
      return;
    }
    onAdd(erkannteStelle, textInput.trim(), tagsInput.trim());
    textInput      = '';
    tagsInput      = '';
    erkannteStelle = null;
    resetKey++;
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
      {#key resetKey}
        <BibelstellenEingabe onAktualisiert={(s) => erkannteStelle = s} />
      {/key}
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
