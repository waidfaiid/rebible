<script lang="ts">
  import type { Verse } from '$lib/db';

  let { verse, onEdit, onDelete }: { verse: Verse; onEdit: () => void; onDelete: () => void } = $props();
</script>

<div class="bg-white rounded-lg shadow-md p-4 mb-4">
  <div class="flex justify-between items-start">
    <div class="flex-1">
      <div class="text-blue-600 font-semibold text-lg mb-2">{verse.stelle}</div>
      <div class="text-gray-800 mb-2">{verse.text}</div>
      {#if verse.tags && (Array.isArray(verse.tags) ? verse.tags.length > 0 : verse.tags.trim())}
        <div class="flex flex-wrap gap-1">
          {#each Array.isArray(verse.tags) ? verse.tags : verse.tags.split(',').map(t => t.trim()) as tag}
            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">{tag}</span>
          {/each}
        </div>
      {/if}
    </div>
    <div class="flex gap-2 ml-4">
      <button
        class="text-gray-500 hover:text-blue-600 p-2"
        onclick={onEdit}
        title="Bearbeiten"
      >
        <span class="material-icons text-sm">edit</span>
      </button>
      <button
        class="text-gray-500 hover:text-red-600 p-2"
        onclick={onDelete}
        title="Löschen"
      >
        <span class="material-icons text-sm">delete</span>
      </button>
    </div>
  </div>
</div>