<script lang="ts">
  import { sprechRate } from '$lib/stores';

  let { text }: { text: string } = $props();

  let spricht = $state(false);
  let rate = $state(1.0);
  sprechRate.subscribe(v => rate = v);

  function vorlesen() {
    if (typeof window === 'undefined') return;

    if (spricht) {
      window.speechSynthesis.cancel();
      spricht = false;
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = rate;
    utterance.onend = () => { spricht = false; };
    utterance.onerror = () => { spricht = false; };
    spricht = true;
    window.speechSynthesis.speak(utterance);
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
