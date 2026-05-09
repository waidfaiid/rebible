<script lang="ts">
  let { onRate }: {
    onRate: (grade: number) => void;
  } = $props();
</script>

<div class="fixed bottom-12 left-4 right-4 z-10">
  <div class="max-w-md mx-auto">
    <div class="grid grid-cols-2 gap-2">
      <button
        onclick={() => onRate(0)}
        class="bg-red-50 text-black py-3 px-4 rounded-lg hover:bg-red-100 font-light text-sm transition-colors duration-200 flex items-center justify-center gap-1 border border-red-200"
        title="Vergessen"
      >
        <span class="material-icons text-sm">close</span>
      </button>
      <button
        onclick={() => onRate(1)}
        class="bg-orange-50 text-black py-3 px-4 rounded-lg hover:bg-orange-100 font-light text-sm transition-colors duration-200 flex items-center justify-center gap-1 border border-orange-200"
        title="Lückenhaft"
      >
        <span class="material-icons text-sm">warning</span>
      </button>
      <button
        onclick={() => onRate(3)}
        class="bg-yellow-50 text-black py-3 px-4 rounded-lg hover:bg-yellow-100 font-light text-sm transition-colors duration-200 flex items-center justify-center gap-1 border border-yellow-200"
        title="Gut"
      >
        <span class="material-icons text-sm">thumb_up</span>
      </button>
      <button
        onclick={() => onRate(4)}
        class="bg-green-50 text-black py-3 px-4 rounded-lg hover:bg-green-100 font-light text-sm transition-colors duration-200 flex items-center justify-center gap-1 border border-green-200"
        title="Perfekt"
      >
        <span class="material-icons text-sm">star</span>
      </button>
    </div>
  </div>
</div>
