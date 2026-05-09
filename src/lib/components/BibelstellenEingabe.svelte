<script lang="ts">
  import { onMount } from 'svelte';
  import { BUECHER, parseStelleLive } from '$lib/bible';
  import { KAPITEL_VERSE } from '$lib/bibelDaten';

  let { onAktualisiert, initialStelle = '' }: {
    onAktualisiert: (stelle: string | null) => void;
    initialStelle?: string;
  } = $props();

  // ── Dropdown-Zustand ─────────────────────────────────────────────────────
  let gewaehlterTeil  = $state<'AT' | 'NT' | ''>('');
  let gewaehltesBuch  = $state('');
  let gewaehltesKap   = $state('');
  let gewaehltesVon   = $state('');
  let gewaehltesBis   = $state('');

  // ── Texteingabe-Zustand ───────────────────────────────────────────────────
  let textInput = $state(initialStelle);

  // Populate dropdowns once on mount – onMount avoids $effect tracking textInput
  onMount(() => {
    if (initialStelle) textGeaendert();
  });

  // ── Grün-Flags (werden direkt aus den Dropdown-Werten gelesen) ────────────
  let teilGruen  = $derived(gewaehlterTeil  !== '');
  let buchGruen  = $derived(gewaehltesBuch  !== '');
  let kapGruen   = $derived(gewaehltesKap   !== '');
  let vonGruen   = $derived(gewaehltesVon   !== '');
  let bisGruen   = $derived(gewaehltesBis   !== '');
  let textGruen  = $derived(buchGruen && kapGruen);
  let textOrange = $derived(buchGruen && !kapGruen);

  // ── Abgeleitete Listen für Dropdowns ─────────────────────────────────────
  let buchListe = $derived(
    gewaehlterTeil
      ? BUECHER.filter((_, i) => (gewaehlterTeil === 'AT' ? i < 39 : i >= 39))
      : BUECHER
  );

  let maxKapitel = $derived(
    gewaehltesBuch ? (KAPITEL_VERSE[gewaehltesBuch]?.length ?? 0) : 0
  );

  let maxVon = $derived(
    gewaehltesBuch && gewaehltesKap
      ? (KAPITEL_VERSE[gewaehltesBuch]?.[parseInt(gewaehltesKap) - 1] ?? 0)
      : 0
  );

  let bisListe = $derived(
    gewaehltesVon && maxVon > 0
      ? Array.from({ length: maxVon - parseInt(gewaehltesVon) }, (_, i) => i + parseInt(gewaehltesVon) + 1)
      : []
  );

  // ── Hilfsfunktion: Stelle aus Dropdown-Werten bauen ──────────────────────
  function stelleAusDropdowns(): string | null {
    if (!gewaehltesBuch || !gewaehltesKap) return null;
    let s = `${gewaehltesBuch} ${gewaehltesKap}`;
    if (gewaehltesVon) {
      s += `,${gewaehltesVon}`;
      if (gewaehltesBis) s += `-${gewaehltesBis}`;
    }
    return s;
  }

  // ── Text → Dropdowns (Eingabe in der Texleiste) ───────────────────────────
  function textGeaendert() {
    const p = parseStelleLive(textInput);
    if (p.buch) {
      gewaehlterTeil = p.buchTeil ?? '';
      gewaehltesBuch = p.buch.name;
      gewaehltesKap  = p.kapitel   ? String(p.kapitel)   : '';
      gewaehltesVon  = p.startVers ? String(p.startVers) : '';
      gewaehltesBis  = p.endVers   ? String(p.endVers)   : '';
    } else if (!textInput.trim()) {
      allesZuruecksetzen(false);
    }
    onAktualisiert(p.normalisiert);
  }

  // ── Dropdowns → Text ──────────────────────────────────────────────────────
  function dropdownGeaendert() {
    const s = stelleAusDropdowns();
    textInput = s ?? '';
    onAktualisiert(s);
  }

  function teilGeaendert() {
    // Buch zurücksetzen wenn es nicht zum neuen AT/NT passt
    if (gewaehltesBuch && gewaehlterTeil) {
      const idx = BUECHER.findIndex(b => b.name === gewaehltesBuch);
      const buchTeil = idx < 39 ? 'AT' : 'NT';
      if (buchTeil !== gewaehlterTeil) {
        gewaehltesBuch = '';
        gewaehltesKap  = '';
        gewaehltesVon  = '';
        gewaehltesBis  = '';
      }
    }
    dropdownGeaendert();
  }

  function buchGeaendert() {
    gewaehltesKap = '';
    gewaehltesVon = '';
    gewaehltesBis = '';
    // AT/NT automatisch setzen
    if (gewaehltesBuch) {
      const idx = BUECHER.findIndex(b => b.name === gewaehltesBuch);
      gewaehlterTeil = idx < 39 ? 'AT' : 'NT';
    }
    dropdownGeaendert();
  }

  function kapGeaendert() {
    gewaehltesVon = '';
    gewaehltesBis = '';
    dropdownGeaendert();
  }

  function vonGeaendert() {
    gewaehltesBis = '';
    dropdownGeaendert();
  }

  function allesZuruecksetzen(updateText = true) {
    gewaehlterTeil = '';
    gewaehltesBuch = '';
    gewaehltesKap  = '';
    gewaehltesVon  = '';
    gewaehltesBis  = '';
    if (updateText) {
      textInput = '';
      onAktualisiert(null);
    }
  }

  // ── CSS-Helfer ────────────────────────────────────────────────────────────
  const selectBase = 'bg-zinc-800 text-white text-sm rounded-xl border focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';
  const gruen  = 'border-green-500';
  const normal = 'border-zinc-700';
</script>

<div class="space-y-1.5">
  <!-- Dropdown-Leiste -->
  <div class="flex gap-1.5">

    <!-- AT / NT — sehr schmal, zeigt nur Auswahl -->
    <select
      bind:value={gewaehlterTeil}
      onchange={teilGeaendert}
      class="{selectBase} px-1 py-2.5 shrink-0 w-[50px] {teilGruen ? gruen : normal}"
    >
      <option value="">⊕</option>
      <option value="AT">AT</option>
      <option value="NT">NT</option>
    </select>

    <!-- Buch — flex, damit genug Platz für Buchnamen -->
    <select
      bind:value={gewaehltesBuch}
      onchange={buchGeaendert}
      class="{selectBase} px-2 py-2.5 flex-1 min-w-[72px] {buchGruen ? gruen : normal}"
    >
      <option value="">Buch</option>
      {#each buchListe as buch}
        <option value={buch.name}>{buch.name}</option>
      {/each}
    </select>

    <!-- Kapitel -->
    <select
      bind:value={gewaehltesKap}
      onchange={kapGeaendert}
      disabled={!gewaehltesBuch}
      class="{selectBase} px-1 py-2.5 w-[62px] shrink-0 {kapGruen ? gruen : normal}"
    >
      <option value="">Kap.</option>
      {#each Array.from({ length: maxKapitel }, (_, i) => i + 1) as kap}
        <option value={String(kap)}>{kap}</option>
      {/each}
    </select>

    <!-- Von-Vers -->
    <select
      bind:value={gewaehltesVon}
      onchange={vonGeaendert}
      disabled={!gewaehltesKap}
      class="{selectBase} px-1 py-2.5 w-[54px] shrink-0 {vonGruen ? gruen : normal}"
    >
      <option value="">Vs.</option>
      {#each Array.from({ length: maxVon }, (_, i) => i + 1) as v}
        <option value={String(v)}>{v}</option>
      {/each}
    </select>

    <!-- Bis-Vers -->
    <select
      bind:value={gewaehltesBis}
      onchange={dropdownGeaendert}
      disabled={!gewaehltesVon}
      class="{selectBase} px-1 py-2.5 w-[54px] shrink-0 {bisGruen ? gruen : normal}"
    >
      <option value="">–</option>
      {#each bisListe as v}
        <option value={String(v)}>{v}</option>
      {/each}
    </select>

  </div>

  <!-- Schnell-Eingabe -->
  <div class="relative">
    <span class="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-[18px] pointer-events-none">search</span>
    <input
      type="text"
      bind:value={textInput}
      oninput={textGeaendert}
      placeholder="z.B. Dan3.4-5  oder  Röm 5,4"
      spellcheck="false"
      autocomplete="off"
      class="w-full pl-9 pr-9 py-2.5 bg-zinc-800 text-white text-sm placeholder-zinc-500 rounded-xl border focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-colors font-medium
             {textGruen ? 'border-green-500' : textOrange ? 'border-yellow-500' : 'border-zinc-700'}"
    />
    {#if textInput}
      <button
        onclick={() => allesZuruecksetzen()}
        class="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
        aria-label="Eingabe löschen"
      >
        <span class="material-icons text-[18px]">close</span>
      </button>
    {/if}
  </div>

  <!-- Status-Zeile -->
  {#if buchGruen}
    <div class="flex items-center gap-1 ml-1 text-xs font-medium
                {kapGruen ? 'text-green-400' : 'text-yellow-400'}">
      <span class="material-icons text-[13px]">{kapGruen ? 'check_circle' : 'info'}</span>
      {#if kapGruen}
        {stelleAusDropdowns()}
      {:else}
        {gewaehltesBuch} – bitte noch Kapitel wählen
      {/if}
    </div>
  {/if}
</div>
