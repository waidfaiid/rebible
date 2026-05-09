<script lang="ts">
  let { stats }: { stats: { gesamt: number; faellig: number; gelerntHeute: number; serie: number } } = $props();
</script>

<div class="grid grid-cols-2 gap-2 mb-2">
  <div class="bg-zinc-900 rounded-2xl p-3 shadow-sm border border-zinc-800 flex items-center gap-3">
    <div class="text-zinc-500 flex-shrink-0">
      <span class="material-icons text-xl">library_books</span>
    </div>
    <div>
      <div class="text-xl font-bold text-white leading-none">{stats.gesamt}</div>
      <div class="text-[10px] text-zinc-400 mt-1 font-medium uppercase tracking-wider">Verse</div>
    </div>
  </div>

  <div class="bg-zinc-900 rounded-2xl p-3 shadow-sm border border-zinc-800 flex items-center gap-3">
    <div class="text-red-500 flex-shrink-0">
      <span class="material-icons text-xl">schedule</span>
    </div>
    <div>
      <div class="text-xl font-bold text-white leading-none">{stats.faellig}</div>
      <div class="text-[10px] text-zinc-400 mt-1 font-medium uppercase tracking-wider">Fällig</div>
    </div>
  </div>

  <div class="bg-zinc-900 rounded-2xl p-3 shadow-sm border border-zinc-800 flex items-center gap-3">
    <div class="text-zinc-300 flex-shrink-0">
      <span class="material-icons text-xl">task_alt</span>
    </div>
    <div>
      <div class="text-xl font-bold text-white leading-none">{stats.gelerntHeute}</div>
      <div class="text-[10px] text-zinc-400 mt-1 font-medium uppercase tracking-wider">Erledigt</div>
    </div>
  </div>

  <div class="bg-zinc-900 rounded-2xl p-3 shadow-sm border border-zinc-800 flex items-center gap-3">
    <div class="{stats.serie > 0 ? 'text-red-500' : 'text-zinc-600'} flex-shrink-0">
      <span class="material-icons text-xl">local_fire_department</span>
    </div>
    <div>
      <div class="text-xl font-bold text-white leading-none">{stats.serie}</div>
      <div class="text-[10px] text-zinc-400 mt-1 font-medium uppercase tracking-wider">Serie</div>
    </div>
  </div>
</div>
