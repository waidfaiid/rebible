<script lang="ts">
  import type { Verse } from '$lib/db';
  import { calculateSM2, ankiLangzeit } from '$lib/spacedRepetition';
  import { ERFOLGSTAGE_NOETIG, heuteTag } from '$lib/werkstatt';
  import { showDaysOnButtons } from '$lib/stores';

  let { onRate, verse = null, dreierModus = false, modeKey = '', werkstatt = false }: {
    onRate: (grade: number) => void;
    verse?: Verse | null;
    dreierModus?: boolean;
    modeKey?: string;
    werkstatt?: boolean;
  } = $props();

  let showDays = $state(true);
  showDaysOnButtons.subscribe(v => showDays = v);

  function getDays(grade: number): number | null {
    if (!verse || !showDays) return null;
    const v = verse as Record<string, any>;
    const ef  = (modeKey && v[`easeFactor${modeKey}`]  != null) ? v[`easeFactor${modeKey}`]  : (verse.easeFactor  ?? 2.0);
    const ivl = (modeKey && v[`interval${modeKey}`]    != null) ? v[`interval${modeKey}`]    : (verse.interval    ?? 1);
    const rc  = (modeKey && v[`reviewCount${modeKey}`] != null) ? v[`reviewCount${modeKey}`] : (verse.reviewCount ?? 0);
    return calculateSM2(ef, ivl, rc, grade).interval;
  }

  // Werkstatt: statt Tagen den Lernfortschritt anzeigen
  function werkstattLabel(grade: number): string {
    if (!verse) return '';
    if (grade < 4) return 'nochmal';
    if (verse.lernErfolgTag === heuteTag()) return 'heute geschafft';
    const tag = (verse.lernErfolge ?? 0) + 1;
    return tag >= ERFOLGSTAGE_NOETIG ? 'gelernt ✓' : `Tag ${tag}/${ERFOLGSTAGE_NOETIG}`;
  }

  function daysLabel(grade: number): string {
    if (werkstatt) return werkstattLabel(grade);
    if (modeKey === 'Stelle' && verse) {
      if (grade === 0) return 'Werkstatt';
      const d = ankiLangzeit(verse.easeFactorStelle, verse.intervalStelle, verse.nextReviewStelle, grade, false).interval;
      return d === 1 ? '1 Tag' : `${d} Tage`;
    }
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
  <!-- Standard: 4 Buttons (2×2), schlank ohne Unterbezeichnung -->
  <div class="grid grid-cols-2 gap-2 w-full">
    <button
      onclick={() => onRate(0)}
      class="bg-red-600 text-white py-2 px-3 rounded-2xl shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5"
    >
      <div class="font-bold text-lg leading-tight">Vergessen</div>
      {#if showDays && verse}
        <div class="text-sm font-semibold opacity-90">{daysLabel(0)}</div>
      {/if}
    </button>
    <button
      onclick={() => onRate(1)}
      class="bg-orange-500 text-white py-2 px-3 rounded-2xl shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5"
    >
      <div class="font-bold text-lg leading-tight">Lückenhaft</div>
      {#if showDays && verse}
        <div class="text-sm font-semibold opacity-90">{daysLabel(1)}</div>
      {/if}
    </button>
    <button
      onclick={() => onRate(3)}
      class="bg-blue-600 text-white py-2 px-3 rounded-2xl shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5"
    >
      <div class="font-bold text-lg leading-tight">Inhaltlich gut</div>
      {#if showDays && verse}
        <div class="text-sm font-semibold opacity-90">{daysLabel(3)}</div>
      {/if}
    </button>
    <button
      onclick={() => onRate(4)}
      class="bg-green-600 text-white py-2 px-3 rounded-2xl shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5"
    >
      <div class="font-bold text-lg leading-tight">Wortgetreu</div>
      {#if showDays && verse}
        <div class="text-sm font-semibold opacity-90">{daysLabel(4)}</div>
      {/if}
    </button>
  </div>
{/if}
