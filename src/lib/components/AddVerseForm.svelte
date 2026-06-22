<script lang="ts">
  import { onMount } from 'svelte';
  import { db } from '$lib/db';
  import { extractFirstChunk } from '$lib/utils';
  import BibelstellenEingabe from './BibelstellenEingabe.svelte';

  let { onAdd }: { onAdd: (stelle: string, text: string, tags: string, firstChunkManual?: string) => void } = $props();

  let erkannteStelle = $state<string | null>(null);
  let textInput      = $state('');
  let tagsInput      = $state('');
  let resetKey       = $state(0);

  // Chunk-Editor-Zustand
  let manualChunk = $state<string | null>(null);

  // Tags dropdown
  let alleTags = $state<string[]>([]);
  let dropdownOffen = $state(false);
  let ausgewaehlteTags = $state<Set<string>>(new Set());

  onMount(async () => {
    const alleVerse = await db.verse.toArray();
    const tagSet = new Set<string>();
    alleVerse.forEach(v => {
      const tags = Array.isArray(v.tags) ? v.tags : (v.tags ? [v.tags] : []);
      tags.forEach(t => { if (t.trim()) tagSet.add(t.trim()); });
    });
    alleTags = [...tagSet].sort();
  });

  // Auto-erkannter Chunk
  let autoChunk = $derived(textInput.trim() ? extractFirstChunk(textInput) : '');

  // Aktuell gültiger Chunk (manuell hat Vorrang)
  let displayChunk = $derived(manualChunk ?? autoChunk);

  // Wörter des Originaltextes
  let textWords = $derived(textInput.trim().split(/\s+/).filter((w: string) => w));

  // Anzahl Wörter im Chunk (als Präfix-Länge im Originaltext)
  let chunkWordCount = $derived.by(() => {
    if (!displayChunk.trim()) return 0;
    const chunkWords = displayChunk.trim().split(/\s+/).filter((w: string) => w);
    const normText = textWords.map((w: string) => w.toLowerCase().replace(/[^a-zäöüß0-9]/g, ''));
    const normChunk = chunkWords.map((w: string) => w.toLowerCase().replace(/[^a-zäöüß0-9]/g, ''));

    for (let i = 0; i <= normText.length - normChunk.length; i++) {
      let match = true;
      for (let j = 0; j < normChunk.length; j++) {
        if (normText[i + j] !== normChunk[j]) { match = false; break; }
      }
      if (match) return i + normChunk.length;
    }
    return Math.min(chunkWords.length, textWords.length);
  });

  let isManualOverride = $derived(manualChunk !== null);
  let showChunkEditor = $derived(textWords.length >= 3);

  function extendChunk() {
    if (chunkWordCount < textWords.length) {
      manualChunk = textWords.slice(0, chunkWordCount + 1).join(' ');
    }
  }

  function shrinkChunk() {
    if (chunkWordCount > 1) {
      manualChunk = textWords.slice(0, chunkWordCount - 1).join(' ');
    }
  }

  function resetChunk() {
    manualChunk = null;
  }

  function toggleTag(tag: string) {
    const neu = new Set(ausgewaehlteTags);
    if (neu.has(tag)) {
      neu.delete(tag);
    } else {
      neu.add(tag);
    }
    ausgewaehlteTags = neu;
    const manuelleTeile = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t && !alleTags.includes(t));
    const alle = [...ausgewaehlteTags, ...manuelleTeile];
    tagsInput = alle.join(', ');
  }

  function submit() {
    if (!erkannteStelle) {
      alert('Bitte eine vollständige Bibelstelle eingeben (Buch + Kapitel)');
      return;
    }
    if (!textInput.trim()) {
      alert('Bitte den Vers-Text eingeben');
      return;
    }
    onAdd(erkannteStelle, textInput.trim(), tagsInput.trim(), manualChunk ?? undefined);
    textInput      = '';
    tagsInput      = '';
    erkannteStelle = null;
    ausgewaehlteTags = new Set();
    dropdownOffen = false;
    manualChunk = null;
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

    <!-- Erster Chunk Vorschau (erscheint sobald genug Text vorhanden) -->
    {#if showChunkEditor}
      <div class="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-3">
        <div class="flex items-center gap-2 mb-2">
          <span class="material-icons text-amber-500 text-sm">auto_awesome</span>
          <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Erster Chunk · Buch-Modus</span>
          {#if isManualOverride}
            <span class="ml-auto text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Manuell</span>
          {/if}
        </div>

        <!-- Vorschau -->
        <div class="text-sm leading-relaxed mb-2 px-1">
          {#if chunkWordCount > 0}
            <span class="text-amber-300 font-medium">{textWords.slice(0, chunkWordCount).join(' ')}</span><!--
            -->{#if chunkWordCount < textWords.length}<span class="text-zinc-600"> {textWords.slice(chunkWordCount).join(' ')}</span>{/if}
          {/if}
        </div>

        <!-- Steuerbuttons -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            onclick={shrinkChunk}
            disabled={chunkWordCount <= 1}
            class="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-700 border border-zinc-600 text-zinc-300 rounded-xl hover:bg-zinc-600 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xs font-medium"
          >
            <span class="material-icons text-sm">remove</span>
            Wort
          </button>

          <div class="flex-1"></div>

          {#if isManualOverride}
            <button
              type="button"
              onclick={resetChunk}
              class="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-700 border border-zinc-600 text-zinc-400 rounded-xl hover:bg-zinc-600 active:scale-95 transition-all text-xs"
              title="Zurück zur automatischen Erkennung"
            >
              <span class="material-icons text-sm">restart_alt</span>
              Auto
            </button>
          {/if}

          <button
            type="button"
            onclick={extendChunk}
            disabled={chunkWordCount >= textWords.length}
            class="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-700 border border-zinc-600 text-zinc-300 rounded-xl hover:bg-zinc-600 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xs font-medium"
          >
            Wort
            <span class="material-icons text-sm">add</span>
          </button>
        </div>
      </div>
    {/if}

    <div>
      <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1">Themen (optional)</label>
      <div class="flex gap-2">
        <!-- Dropdown-Button (1/4) -->
        <div class="w-1/4">
          <button
            type="button"
            onclick={() => dropdownOffen = !dropdownOffen}
            class="w-full min-h-[48px] px-2 py-2.5 bg-zinc-800 border border-zinc-700 rounded-2xl text-white focus:outline-none transition-all font-medium flex items-center justify-between gap-1 {dropdownOffen ? 'border-zinc-500' : ''}"
          >
            <span class="truncate text-left text-xs leading-tight {ausgewaehlteTags.size > 0 ? 'text-white' : 'text-zinc-500'}">
              {#if ausgewaehlteTags.size > 0}
                {ausgewaehlteTags.size} gewählt
              {:else}
                Wählen
              {/if}
            </span>
            <span class="material-icons text-zinc-400 text-lg shrink-0 transition-transform duration-200 {dropdownOffen ? 'rotate-180' : ''}">expand_more</span>
          </button>
        </div>

        <!-- Themen-Eingabe (3/4) -->
        <input
          type="text"
          bind:value={tagsInput}
          placeholder="z.B. Gnade, Hoffnung"
          class="w-3/4 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-all font-medium"
        />
      </div>
      <p class="text-[10px] text-zinc-500 mt-2 ml-1 leading-snug">
        Ein Thema vergeben, wenn du Verse gezielt nach Thema lernen möchtest. Modus 4 gruppiert dann alle Verse desselben Themas für eine gezielte Lerneinheit.
      </p>
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

<!-- Dropdown-Overlay: zentriert, füllt Bildschirm zwischen Header und Menüleiste -->
{#if dropdownOffen}
  <!-- Backdrop: Klick außerhalb schließt -->
  <div
    class="fixed inset-0 z-40"
    onclick={() => dropdownOffen = false}
    role="presentation"
  ></div>

  <!-- Panel -->
  <div
    class="fixed left-3 right-3 z-50 bg-zinc-800 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
    style="top: calc(env(safe-area-inset-top) + 3.75rem); bottom: calc(env(safe-area-inset-bottom) + 4.75rem);"
    role="dialog"
    aria-modal="true"
    aria-label="Themen auswählen"
  >
    <!-- Header -->
    <div class="px-5 pt-4 pb-3 border-b border-zinc-700 shrink-0 flex items-center justify-between">
      <p class="text-sm font-bold text-white">Thema auswählen</p>
      <button
        type="button"
        onclick={() => dropdownOffen = false}
        class="text-zinc-400 active:text-white"
        aria-label="Schließen"
      >
        <span class="material-icons text-xl">close</span>
      </button>
    </div>

    <!-- Liste -->
    {#if alleTags.length > 0}
      <div class="overflow-y-auto flex-1">
        {#each alleTags as tag}
          <button
            type="button"
            onclick={() => toggleTag(tag)}
            class="w-full px-5 py-4 flex items-center gap-4 active:bg-zinc-700 transition-colors text-left border-b border-zinc-700/50 last:border-0"
          >
            <span class="w-6 h-6 rounded-md border-2 shrink-0 flex items-center justify-center transition-all {ausgewaehlteTags.has(tag) ? 'bg-red-600 border-red-600' : 'border-zinc-500'}">
              {#if ausgewaehlteTags.has(tag)}
                <span class="material-icons text-white" style="font-size: 16px;">check</span>
              {/if}
            </span>
            <span class="text-base text-white font-medium">{tag}</span>
          </button>
        {/each}
      </div>
    {:else}
      <div class="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <span class="material-icons text-zinc-600 text-4xl mb-3">label_off</span>
        <p class="text-sm text-zinc-500">Noch keine Themen vorhanden.<br>Tipp das erste Thema direkt in die Eingabeleiste.</p>
      </div>
    {/if}

    <!-- Footer: gewählte Tags -->
    {#if ausgewaehlteTags.size > 0}
      <div class="px-5 py-3 border-t border-zinc-700 shrink-0 flex items-center justify-between gap-3">
        <p class="text-sm text-zinc-400 font-medium truncate">{[...ausgewaehlteTags].join(', ')}</p>
        <button
          type="button"
          onclick={() => dropdownOffen = false}
          class="shrink-0 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-all"
        >
          Fertig
        </button>
      </div>
    {/if}
  </div>
{/if}
