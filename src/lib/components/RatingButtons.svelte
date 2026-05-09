<script lang="ts">
  let { onRate }: {
    onRate: (grade: number) => void;
  } = $props();
</script>

<div class="grid grid-cols-2 gap-2 w-full">
  <button
    onclick={() => onRate(0)}
    class="bg-red-600 text-white py-3 px-2 rounded-2xl shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center gap-1"
  >
    <span class="material-icons text-2xl mb-0.5">sentiment_very_dissatisfied</span>
    <div class="text-center">
      <div class="font-bold text-base leading-tight">Vergessen</div>
      <div class="text-[10px] font-medium opacity-80 mt-0.5">Komplett weg</div>
    </div>
  </button>
  <button
    onclick={() => onRate(1)}
    class="bg-orange-500 text-white py-3 px-2 rounded-2xl shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center gap-1"
  >
    <span class="material-icons text-2xl mb-0.5">sentiment_dissatisfied</span>
    <div class="text-center">
      <div class="font-bold text-base leading-tight">Lückenhaft</div>
      <div class="text-[10px] font-medium opacity-80 mt-0.5">Nur Brocken</div>
    </div>
  </button>
  <button
    onclick={() => onRate(3)}
    class="bg-blue-600 text-white py-3 px-2 rounded-2xl shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center gap-1"
  >
    <span class="material-icons text-2xl mb-0.5">sentiment_satisfied</span>
    <div class="text-center">
      <div class="font-bold text-base leading-tight">Inhaltlich gut</div>
      <div class="text-[10px] font-medium opacity-80 mt-0.5">Kleine Fehler</div>
    </div>
  </button>
  <button
    onclick={() => onRate(4)}
    class="bg-green-600 text-white py-3 px-2 rounded-2xl shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center gap-1"
  >
    <span class="material-icons text-2xl mb-0.5">sentiment_very_satisfied</span>
    <div class="text-center">
      <div class="font-bold text-base leading-tight">Wortgetreu</div>
      <div class="text-[10px] font-medium opacity-80 mt-0.5">Fehlerfrei</div>
    </div>
  </button>
</div>
