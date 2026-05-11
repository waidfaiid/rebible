<script lang="ts">
  import type { Verse } from '$lib/db';

  let { verse, onEdit, onDelete, statModus = false }: {
    verse: Verse;
    onEdit: () => void;
    onDelete: () => void;
    statModus?: boolean;
  } = $props();

  const tags = $derived(
    Array.isArray(verse.tags)
      ? verse.tags.filter(t => t)
      : (verse.tags ? verse.tags.split(',').map(t => t.trim()).filter(t => t) : [])
  );

  // Erste 20 Wörter des Textes
  const kurzText = $derived(() => {
    const worte = verse.text.split(/\s+/);
    if (worte.length <= 20) return { text: verse.text, gekuerzt: false };
    return { text: worte.slice(0, 20).join(' '), gekuerzt: true };
  });

  // Health-Farbe basierend auf SM-2
  const hf = $derived(() => {
    if (!verse.reviewCount || verse.reviewCount === 0) return 'rot';
    if (verse.easeFactor < 1.8) return 'rot';
    if (verse.easeFactor < 2.3) return 'gelb';
    return 'gruen';
  });

  function formatDatum(iso: string | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
</script>

{#if statModus}
  <!-- Kompakte Statistik-Ansicht -->
  <div class="bg-zinc-900 rounded-2xl border border-zinc-800 mb-2 flex overflow-hidden">
    <!-- Health-Indikator links -->
    <div class="w-1 shrink-0"
      class:bg-red-500={hf() === 'rot'}
      class:bg-yellow-500={hf() === 'gelb'}
      class:bg-green-500={hf() === 'gruen'}
    ></div>

    <div class="flex-1 min-w-0 p-3">
      <!-- Kopfzeile: Stelle + Buttons -->
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <div class="bg-zinc-800 text-zinc-400 p-1 rounded-lg shrink-0">
            <span class="material-icons text-[13px]">menu_book</span>
          </div>
          <span class="text-white font-bold text-sm truncate">{verse.stelle}</span>
        </div>
        <div class="flex gap-1.5 shrink-0">
          <button onclick={onEdit} class="bg-zinc-800 text-zinc-400 hover:text-white p-1.5 rounded-lg transition-all active:scale-95">
            <span class="material-icons text-[14px]">edit</span>
          </button>
          <button onclick={onDelete} class="bg-zinc-800 text-zinc-400 hover:text-red-400 p-1.5 rounded-lg transition-all active:scale-95">
            <span class="material-icons text-[14px]">delete</span>
          </button>
        </div>
      </div>

      <!-- Kurztext -->
      <p class="text-zinc-400 text-xs mt-1.5 pl-7 leading-relaxed">
        {kurzText().text}{kurzText().gekuerzt ? ' …' : ''}
      </p>

      <!-- Tags -->
      {#if tags.length > 0}
        <div class="flex flex-wrap gap-1 mt-1.5 pl-7">
          {#each tags as tag}
            <span class="bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">{tag}</span>
          {/each}
        </div>
      {/if}

      <!-- Statistik-Leiste -->
      <div class="mt-2.5 pt-2 border-t border-zinc-800 flex items-start">
        <div class="flex-1 text-center px-1">
          <div class="text-white text-[11px] font-bold leading-tight">{formatDatum(verse.nextReview)}</div>
          <div class="text-zinc-600 text-[8px] font-bold uppercase tracking-wide mt-0.5">Nächste Wdh.</div>
        </div>
        <div class="w-px bg-zinc-800 self-stretch mx-0.5"></div>
        <div class="flex-1 text-center px-1">
          <div class="text-[11px] font-bold leading-tight"
            class:text-red-400={verse.easeFactor < 1.8}
            class:text-yellow-400={verse.easeFactor >= 1.8 && verse.easeFactor < 2.3}
            class:text-green-400={verse.easeFactor >= 2.3}
          >{(verse.easeFactor ?? 2.5).toFixed(2)}</div>
          <div class="text-zinc-600 text-[8px] font-bold uppercase tracking-wide mt-0.5">Faktor</div>
        </div>
        <div class="w-px bg-zinc-800 self-stretch mx-0.5"></div>
        <div class="flex-1 text-center px-1">
          <div class="text-white text-[11px] font-bold leading-tight">{verse.interval ?? 1}d</div>
          <div class="text-zinc-600 text-[8px] font-bold uppercase tracking-wide mt-0.5">Intervall</div>
        </div>
        <div class="w-px bg-zinc-800 self-stretch mx-0.5"></div>
        <div class="flex-1 text-center px-1">
          <div class="text-white text-[11px] font-bold leading-tight">{formatDatum(verse.lastReview)}</div>
          <div class="text-zinc-600 text-[8px] font-bold uppercase tracking-wide mt-0.5">Letzte Wdh.</div>
        </div>
        <div class="w-px bg-zinc-800 self-stretch mx-0.5"></div>
        <div class="flex-1 text-center px-1">
          <div class="text-white text-[11px] font-bold leading-tight">{verse.reviewCount ?? 0}×</div>
          <div class="text-zinc-600 text-[8px] font-bold uppercase tracking-wide mt-0.5">Anzahl</div>
        </div>
      </div>
    </div>
  </div>

{:else}
  <!-- Normale Ansicht -->
  <div class="bg-zinc-900 rounded-3xl p-4 shadow-sm border border-zinc-800 mb-3">
    <div class="flex justify-between items-start gap-3">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-2">
          <div class="bg-zinc-800 text-zinc-400 p-1.5 rounded-lg flex-shrink-0">
            <span class="material-icons text-[16px]">menu_book</span>
          </div>
          <span class="text-white font-bold text-lg truncate">{verse.stelle}</span>
        </div>
        <div class="text-zinc-300 leading-relaxed text-sm font-medium mb-3 pl-9">{verse.text}</div>
        {#if tags.length > 0}
          <div class="flex flex-wrap gap-1.5 pl-9">
            {#each tags as tag}
              <span class="bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{tag}</span>
            {/each}
          </div>
        {/if}
      </div>
      <div class="flex flex-col gap-2 flex-shrink-0">
        <button
          class="bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 p-2.5 rounded-xl transition-all active:scale-95"
          onclick={onEdit}
        >
          <span class="material-icons text-[18px]">edit</span>
        </button>
        <button
          class="bg-zinc-800 text-zinc-400 hover:text-red-500 hover:bg-red-900/30 p-2.5 rounded-xl transition-all active:scale-95"
          onclick={onDelete}
        >
          <span class="material-icons text-[18px]">delete</span>
        </button>
      </div>
    </div>
  </div>
{/if}
