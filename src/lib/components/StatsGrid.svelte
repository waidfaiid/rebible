<script lang="ts">
  let { stats }: { stats: { gesamt: number; faellig: number; gelerntHeute: number; serie: number } } = $props();
</script>

<div class="grid grid-cols-2 gap-4 mb-6">
  <div class="bg-white rounded-lg shadow-md p-4 text-center">
    <div class="text-2xl font-bold text-blue-600">{stats.gesamt}</div>
    <div class="text-sm text-gray-600">Verse gesamt</div>
  </div>

  <div class="bg-white rounded-lg shadow-md p-4 text-center">
    <div class="text-2xl font-bold text-orange-600">{stats.faellig}</div>
    <div class="text-sm text-gray-600">Fällig heute</div>
  </div>

  <div class="bg-white rounded-lg shadow-md p-4 text-center">
    <div class="text-2xl font-bold text-green-600">{stats.gelerntHeute}</div>
    <div class="text-sm text-gray-600">Heute gelernt</div>
  </div>

  <div class="bg-white rounded-lg shadow-md p-4 text-center">
    <div class="text-2xl font-bold text-purple-600">{stats.serie}</div>
    <div class="text-sm text-gray-600">Tage in Serie</div>
  </div>
</div>