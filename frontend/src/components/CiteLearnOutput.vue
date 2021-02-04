<template>
  <div v-if=predictions.length>
    <cite-learn-output-sentence
      v-for="prediction in predictions"
      :score="prediction.score"
      :sentence="prediction.sentence"
      :citationDetected="prediction.citationDetected"
      :index="prediction.key"
      :key="prediction.key">
    </cite-learn-output-sentence>&nbsp;
  </div>
</template>

<script>

import CiteLearnOutputSentence from './CiteLearnOutputSentence.vue'

export default {
  components: { CiteLearnOutputSentence },
  name: 'CiteLearnOutput',
  props: ['predictions']
}
</script>

