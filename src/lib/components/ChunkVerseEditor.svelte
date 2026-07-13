<script lang="ts">
  import { extractFirstChunk } from '$lib/utils';

  let {
    value = $bindable(''),
    manualChunk = $bindable<string | null>(null),
    rows = 7,
    placeholder = ''
  }: {
    value: string;
    manualChunk: string | null;
    rows?: number;
    placeholder?: string;
  } = $props();

  let textareaEl = $state<HTMLTextAreaElement | undefined>(undefined);
  let backdropEl = $state<HTMLDivElement | undefined>(undefined);
  let hasSelection = $state(false);

  function norm(w: string): string {
    return w.toLowerCase().replace(/[^a-zäöüß0-9]/g, '');
  }

  // Auto-erkannter Chunk (Vorschlag) und der aktuell gültige Chunk (manuell hat Vorrang)
  let autoChunk = $derived(value.trim() ? extractFirstChunk(value) : '');
  let displayChunk = $derived(manualChunk ?? autoChunk);
  let isManualOverride = $derived(manualChunk !== null);

  // Wörter des Originaltextes für die Hervorhebung und die +/--Steuerung
  let textWords = $derived(value.trim().split(/\s+/).filter((w: string) => w));

  /**
   * Findet den Wort-Bereich [start, end) des aktuellen Chunks innerhalb des
   * Originaltextes. Der Chunk kann (durch eine freie Textauswahl) an
   * beliebiger Stelle im Text beginnen, nicht nur am Anfang.
   */
  let chunkRange = $derived.by(() => {
    if (!displayChunk.trim()) return { start: 0, end: 0 };
    const chunkWords = displayChunk.trim().split(/\s+/).filter((w: string) => w);
    const normText = textWords.map(norm);
    const normChunk = chunkWords.map(norm);

    for (let i = 0; i <= normText.length - normChunk.length; i++) {
      let match = true;
      for (let j = 0; j < normChunk.length; j++) {
        if (normText[i + j] !== normChunk[j]) { match = false; break; }
      }
      if (match) return { start: i, end: i + normChunk.length };
    }
    // Fallback: als Präfix behandeln
    return { start: 0, end: Math.min(chunkWords.length, textWords.length) };
  });

  let chunkStart = $derived(chunkRange.start);
  let chunkEnd = $derived(chunkRange.end);

  /**
   * Zerlegt den Originaltext (inkl. Leerraum) in Segmente, damit die
   * Hervorhebung exakt über dem echten Textarea-Inhalt liegt.
   */
  let segments = $derived.by(() => {
    const tokens = value.split(/(\s+)/).filter((t: string) => t !== '');
    const out: { text: string; hl: boolean }[] = [];
    let wordIdx = 0;

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      if (/^\s+$/.test(tok)) {
        const prevHl = out.length > 0 && out[out.length - 1].hl;
        let nextHl = false;
        for (let k = i + 1; k < tokens.length; k++) {
          if (!/^\s+$/.test(tokens[k])) {
            nextHl = wordIdx >= chunkStart && wordIdx < chunkEnd;
            break;
          }
        }
        out.push({ text: tok, hl: prevHl && nextHl });
      } else {
        out.push({ text: tok, hl: wordIdx >= chunkStart && wordIdx < chunkEnd });
        wordIdx++;
      }
    }
    return out;
  });

  function extendChunk() {
    if (chunkEnd < textWords.length) {
      manualChunk = textWords.slice(chunkStart, chunkEnd + 1).join(' ');
    }
  }

  function shrinkChunk() {
    if (chunkEnd > chunkStart + 1) {
      manualChunk = textWords.slice(chunkStart, chunkEnd - 1).join(' ');
    }
  }

  function resetChunk() {
    manualChunk = null;
  }

  function updateSelectionState() {
    hasSelection = !!textareaEl && textareaEl.selectionStart !== textareaEl.selectionEnd;
  }

  function setSelectionAsChunk() {
    if (!textareaEl) return;
    const { selectionStart: start, selectionEnd: end } = textareaEl;
    if (start === end) return;
    const selected = value.slice(start, end).trim();
    if (selected) manualChunk = selected;
  }

  function syncScroll() {
    if (backdropEl && textareaEl) backdropEl.scrollTop = textareaEl.scrollTop;
  }
</script>

<div class="relative rounded-2xl border {isManualOverride ? 'border-amber-700/50' : 'border-zinc-700'} bg-zinc-800 focus-within:border-zinc-500 transition-all">
  <!-- Hervorhebungs-Ebene: liegt über dem Textarea, Text selbst ist unsichtbar,
       nur der markierte Chunk-Bereich bekommt einen farbigen Hintergrund. -->
  <div
    bind:this={backdropEl}
    aria-hidden="true"
    class="absolute inset-0 px-4 py-3 font-medium leading-relaxed whitespace-pre-wrap break-words overflow-hidden pointer-events-none text-transparent"
  >{#each segments as seg}{#if seg.hl}<mark class="bg-amber-400/30 text-transparent rounded-[2px]">{seg.text}</mark>{:else}{seg.text}{/if}{/each}</div>

  <textarea
    bind:this={textareaEl}
    bind:value={value}
    {rows}
    {placeholder}
    onscroll={syncScroll}
    onselect={updateSelectionState}
    onmouseup={updateSelectionState}
    onkeyup={updateSelectionState}
    onblur={updateSelectionState}
    class="relative w-full px-4 py-3 bg-transparent text-white placeholder-zinc-500 focus:outline-none transition-all font-medium resize-none leading-relaxed"
  ></textarea>
</div>

{#if textWords.length > 0}
  <div class="mt-3">
    <button
      type="button"
      onclick={setSelectionAsChunk}
      disabled={!hasSelection}
      class="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl hover:bg-amber-500/20 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm font-semibold"
    >
      <span class="material-icons text-base">format_color_text</span>
      Auswahl als Chunk setzen
    </button>

    <div class="flex items-center gap-2 mt-2">
      <button
        type="button"
        onclick={shrinkChunk}
        disabled={chunkEnd <= chunkStart + 1}
        class="flex items-center gap-1 px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-700 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium"
      >
        <span class="material-icons text-base">remove</span>
        Wort
      </button>

      <div class="flex-1 text-center">
        {#if isManualOverride}
          <span class="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Manuell</span>
        {:else}
          <span class="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Automatisch</span>
        {/if}
      </div>

      <button
        type="button"
        onclick={resetChunk}
        disabled={!isManualOverride}
        class="px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-xl hover:bg-zinc-700 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        title="Zurück zur automatischen Erkennung"
      >
        <span class="material-icons text-base">restart_alt</span>
      </button>

      <button
        type="button"
        onclick={extendChunk}
        disabled={chunkEnd >= textWords.length}
        class="flex items-center gap-1 px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-700 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium"
      >
        Wort
        <span class="material-icons text-base">add</span>
      </button>
    </div>

    <p class="text-[10px] text-zinc-600 mt-2 ml-1 leading-snug">
      Markiere im Text den gewünschten Abschnitt und tippe auf „Auswahl als Chunk setzen“, oder passe den hervorgehobenen Bereich mit den Wort-Buttons an. Der markierte Teil wird in Modus 3 (Buch) als Antwort angezeigt.
    </p>
  </div>
{/if}
