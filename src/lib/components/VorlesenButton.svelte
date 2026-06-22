<script lang="ts">
  import { sprechRate } from '$lib/stores';

  let { text = '', segmente = [] }: {
    text?: string;
    segmente?: { stelle: string; text: string }[];
  } = $props();

  let spricht = $state(false);
  let rate = $state(1.0);
  sprechRate.subscribe(v => rate = v);

  const PAUSE_KURZ_MS = 350;
  const PAUSE_LANG_MS = 700;

  function bereinige(t: string): string {
    return t.replace(/,(\d)/g, ', $1');
  }

  function vorlesen() {
    if (typeof window === 'undefined') return;

    if (spricht) {
      window.speechSynthesis.cancel();
      spricht = false;
      return;
    }

    if (segmente.length > 0) {
      vorlesenMitPausen();
    } else {
      vorlesenEinfach();
    }
  }

  function vorlesenEinfach() {
    const utterance = new SpeechSynthesisUtterance(bereinige(text));
    utterance.lang = 'de-DE';
    utterance.rate = rate;
    utterance.onend = () => { spricht = false; };
    utterance.onerror = () => { spricht = false; };
    spricht = true;
    window.speechSynthesis.speak(utterance);
  }

  function vorlesenMitPausen() {
    spricht = true;
    let i = 0;

    function naechstes() {
      if (!spricht || i >= segmente.length) {
        spricht = false;
        return;
      }

      const seg = segmente[i];
      i++;

      // Bibelstelle vorlesen
      const stelleUtt = new SpeechSynthesisUtterance(bereinige(seg.stelle));
      stelleUtt.lang = 'de-DE';
      stelleUtt.rate = rate;
      stelleUtt.onerror = () => { spricht = false; };
      stelleUtt.onend = () => {
        // Kurze Pause nach der Stelle
        setTimeout(() => {
          if (!spricht) return;
          const textUtt = new SpeechSynthesisUtterance(bereinige(seg.text));
          textUtt.lang = 'de-DE';
          textUtt.rate = rate;
          textUtt.onerror = () => { spricht = false; };
          textUtt.onend = () => {
            // Doppelt kurze Pause nach dem Vers-Text, dann weiter
            setTimeout(naechstes, PAUSE_LANG_MS);
          };
          window.speechSynthesis.speak(textUtt);
        }, PAUSE_KURZ_MS);
      };

      window.speechSynthesis.speak(stelleUtt);
    }

    naechstes();
  }
</script>

<button
  onclick={vorlesen}
  class="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-xl transition-all duration-200 active:scale-95 shadow-sm
    {spricht
      ? 'bg-zinc-800 text-white hover:bg-zinc-700'
      : 'bg-red-600 text-white hover:bg-red-700 shadow-red-900/20'}"
>
  <span class="material-icons text-2xl">{spricht ? 'stop' : 'volume_up'}</span>
  {spricht ? 'Stopp' : 'Vorlesen'}
</button>
