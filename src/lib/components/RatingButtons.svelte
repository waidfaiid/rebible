<script lang="ts">
  import type { Verse } from '$lib/db';
  import { calculateSM2 } from '$lib/spacedRepetition';
  import { showDaysOnButtons } from '$lib/stores';

  let { onRate, verse = null, dreierModus = false }: {
    onRate: (grade: number) => void;
    verse?: Verse | null;
    dreierModus?: boolean;
  } = $props();

  let showDays = $state(true);
  showDaysOnButtons.subscribe(v => showDays = v);

  function getDays(grade: number): number | null {
    if (!verse || !showDays) return null;
    return calculateSM2(verse, grade).interval;
  }

  function daysLabel(grade: number): string {
    const d = getDays(grade);
    if (d === null) return '';
    return d === 1 ? '1 Tag' : `${d} Tage`;
  }
</script>

{#if dreierModus}
  <!-- Modus 2: 3 Buttons nebeneinander -->
  <div class="grid grid-cols-3 gap-2 w-full">
    <button
      onclick={() => onRate(0)}
      class="bg-red-600 text-white py-2 px-2 rounded-2xl shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5"
    >
      <div class="font-bold text-lg leading-tight">Vergessen</div>
      {#if showDays && verse}
        <div class="text-sm font-semibold opacity-90">{daysLabel(0)}</div>
      {/if}
    </button>

    <button
      onclick={() => onRate(2)}
      class="bg-orange-500 text-white py-2 px-2 rounded-2xl shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5"
    >
      <div class="font-bold text-lg leading-tight">Teilweise</div>
      {#if showDays && verse}
        <div class="text-sm font-semibold opacity-90">{daysLabel(2)}</div>
      {/if}
    </button>

    <button
      onclick={() => onRate(4)}
      class="bg-green-600 text-white py-2 px-2 rounded-2xl shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5"
    >
      <div class="font-bold text-lg leading-tight">Komplett</div>
      {#if showDays && verse}
        <div class="text-sm font-semibold opacity-90">{daysLabel(4)}</div>
      {/if}
    </button>
  </div>

{:else}
  <!-- Standard: 4 Buttons (2×2) -->
  <div class="grid grid-cols-2 gap-2 w-full">
    <button
      onclick={() => onRate(0)}
      class="bg-red-600 text-white py-2 px-3 rounded-2xl shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5"
    >
      <div class="font-bold text-xl leading-tight">Vergessen</div>
      <div class="text-sm font-medium opacity-80">Komplett weg</div>
      {#if showDays && verse}
        <div class="text-sm font-semibold opacity-90">{daysLabel(0)}</div>
      {/if}
    </button>
    <button
      onclick={() => onRate(1)}
      class="bg-orange-500 text-white py-2 px-3 rounded-2xl shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5"
    >
      <div class="font-bold text-xl leading-tight">Lückenhaft</div>
      <div class="text-sm font-medium opacity-80">Nur Brocken</div>
      {#if showDays && verse}
        <div class="text-sm font-semibold opacity-90">{daysLabel(1)}</div>
      {/if}
    </button>
    <button
      onclick={() => onRate(3)}
      class="bg-blue-600 text-white py-2 px-3 rounded-2xl shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5"
    >
      <div class="font-bold text-xl leading-tight">Inhaltlich gut</div>
      <div class="text-sm font-medium opacity-80">Kleine Fehler</div>
      {#if showDays && verse}
        <div class="text-sm font-semibold opacity-90">{daysLabel(3)}</div>
      {/if}
    </button>
    <button
      onclick={() => onRate(4)}
      class="bg-green-600 text-white py-2 px-3 rounded-2xl shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5"
    >
      <div class="font-bold text-xl leading-tight">Wortgetreu</div>
      <div class="text-sm font-medium opacity-80">Fehlerfrei</div>
      {#if showDays && verse}
        <div class="text-sm font-semibold opacity-90">{daysLabel(4)}</div>
      {/if}
    </button>
  </div>
{/if}
