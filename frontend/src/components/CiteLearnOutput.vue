<template>
  <div>
    <b-alert show>The results of CiteLearn's analysis of your text are shown below. Hover over each sentence to get feedback.</b-alert>
    <div
      v-for="paragraph in this.$store.state.predictionData"
      :key="paragraph.uuid">
      <h4 v-if="paragraph.heading">{{paragraph.heading}}</h4>
      <div class="paragraph">
        <cite-learn-output-sentence-simple
          v-for="sentence in paragraph.sentences"
          :score="sentence.predictionScore"
          :sentence="sentence.rawInput"
          :citationDetected="sentence.citationDetected"
          :index="sentence.uuid"
          :key="sentence.uuid">
        </cite-learn-output-sentence-simple>&nbsp;
      </div>
    </div>
    <hr />
    <p class="text-center">
    
        <b-button type="submit" variant="danger" class="mr-2" to="/">
          <b-icon class="mr-3" icon="arrow-left-circle"></b-icon>
          Edit Text
        </b-button>
    
        <b-button type="submit" variant="success" class="ml-2" to="review">
          Review Detailed Results
          <b-icon class="ml-3" icon="arrow-right-circle"></b-icon>
        </b-button>
    </p>
  </div>
</template>

<script>

import CiteLearnOutputSentenceSimple from './CiteLearnOutputSentenceSimple.vue'

export default {
  components: { CiteLearnOutputSentenceSimple },
  name: 'CiteLearnOutput',
  created: function() {
    if (this.$store.state.predictionData.length == 0) {
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
div.paragraph {
  margin-bottom:20px;
}
h4 {
  margin-top:20px;
}
</style>