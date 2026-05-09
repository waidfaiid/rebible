<script lang="ts">
  import type { Verse } from '$lib/db';

  let { verse, onEdit, onDelete }: { verse: Verse; onEdit: () => void; onDelete: () => void } = $props();
</script>

<div class="bg-white border border-gray-100 rounded-2xl p-6 mb-4 hover:border-gray-200 transition-colors duration-300">
  <div class="flex justify-between items-start">
    <div class="flex-1">
      <div class="flex items-center gap-3 mb-3">
        <span class="material-icons text-gray-400 text-xl">bookmark</span>
        <span class="text-black font-light text-lg">{verse.stelle}</span>
      </div>
      <div class="text-gray-700 leading-relaxed text-base font-light mb-4 ml-8">{verse.text}</div>
      {#if verse.tags && (Array.isArray(verse.tags) ? verse.tags.length > 0 : verse.tags.trim())}
        <div class="flex flex-wrap gap-2 ml-8">
          {#each Array.isArray(verse.tags) ? verse.tags : verse.tags.split(',').map(t => t.trim()) as tag}
            <span class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-light border border-gray-200">{tag}</span>
          {/each}
        </div>
      {/if}
    </div>
    <div class="flex gap-1 ml-4">
      <button
        class="text-gray-400 hover:text-black p-2 rounded-lg transition-colors duration-200"
        onclick={onEdit}
        title="Bearbeiten"
      >
        <span class="material-icons">edit</span>
      </button>
      <button
        class="text-gray-400 hover:text-red-600 p-2 rounded-lg transition-colors duration-200"
        onclick={onDelete}
        title="Löschen"
      >
        <span class="material-icons">delete</span>
      </button>
    </div>
  </div>
</div>