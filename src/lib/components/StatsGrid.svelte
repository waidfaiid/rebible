<script lang="ts">
  let { stats }: { stats: { gesamt: number; faellig: number; gelerntHeute: number; serie: number } } = $props();
</script>

<div class="grid grid-cols-2 gap-3 mb-4">
  <div class="bg-white border border-gray-100 rounded-lg p-4 text-center hover:border-gray-200 transition-colors duration-300">
    <div class="flex justify-center mb-2 text-gray-400">
      <span class="material-icons text-xl">library_books</span>
    </div>
    <div class="text-2xl font-light text-black">{stats.gesamt}</div>
    <div class="text-xs text-gray-500 mt-1 font-light">Verse gesamt</div>
  </div>

  <div class="bg-white border border-gray-100 rounded-lg p-4 text-center hover:border-gray-200 transition-colors duration-300">
    <div class="flex justify-center mb-2 text-gray-400">
      <span class="material-icons text-xl">schedule</span>
    </div>
    <div class="text-2xl font-light text-black">{stats.faellig}</div>
    <div class="text-xs text-gray-500 mt-1 font-light">Fällig heute</div>
  </div>

  <div class="bg-white border border-gray-100 rounded-lg p-4 text-center hover:border-gray-200 transition-colors duration-300">
    <div class="flex justify-center mb-2 text-gray-400">
      <span class="material-icons text-xl">today</span>
    </div>
    <div class="text-2xl font-light text-black">{stats.gelerntHeute}</div>
    <div class="text-xs text-gray-500 mt-1 font-light">Heute gelernt</div>
  </div>

  <div class="bg-white border border-gray-100 rounded-lg p-4 text-center hover:border-gray-200 transition-colors duration-300">
    <div class="flex justify-center mb-2 {stats.serie > 0 ? 'text-orange-400' : 'text-gray-400'}">
      <span class="material-icons text-xl">local_fire_department</span>
    </div>
    <div class="text-2xl font-light text-black">{stats.serie}</div>
    <div class="text-xs text-gray-500 mt-1 font-light">{stats.serie === 1 ? 'Tag Serie' : 'Tage Serie'}</div>
  </div>
</div>
