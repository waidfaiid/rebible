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
  class="w-full flex items-center justify-center gap-3 py-4 px-4 rounded-xl font-light text-base transition-all duration-200
    {spricht
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'}"
>
  <span class="material-icons text-xl">{spricht ? 'stop' : 'volume_up'}</span>
  {spricht ? 'Stopp' : 'Vorlesen'}
</button>
