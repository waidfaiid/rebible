<script lang="ts">
  import type { Verse } from '$lib/db';

  let { verse, onEdit, onDelete }: { verse: Verse; onEdit: () => void; onDelete: () => void } = $props();
</script>

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
      {#if verse.tags && (Array.isArray(verse.tags) ? verse.tags.length > 0 : verse.tags.trim())}
        <div class="flex flex-wrap gap-1.5 pl-9">
          {#each Array.isArray(verse.tags) ? verse.tags : verse.tags.split(',').map(t => t.trim()) as tag}
            <span class="bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{tag}</span>
          {/each}
        </div>
      {/if}
    </div>
    <div class="flex flex-col gap-2 flex-shrink-0">
      <button
        class="bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 p-2.5 rounded-xl transition-all active:scale-95"
        onclick={onEdit}
        title="Bearbeiten"
      >
        <span class="material-icons text-[18px]">edit</span>
      </button>
      <button
        class="bg-zinc-800 text-zinc-400 hover:text-red-500 hover:bg-red-900/30 p-2.5 rounded-xl transition-all active:scale-95"
        onclick={onDelete}
        title="Löschen"
      >
        <span class="material-icons text-[18px]">delete</span>
      </button>
    </div>
  </div>
</div>