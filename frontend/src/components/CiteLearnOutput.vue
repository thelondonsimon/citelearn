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
    <cite-learn-review></cite-learn-review>
    <p class="text-center">
    
        <b-button type="submit" variant="danger" class="mr-2 mb-2" to="/">
          <b-icon class="mr-3" icon="arrow-left-circle"></b-icon>
          Edit Text
        </b-button>
    
        <b-button type="submit" variant="success" class="ml-2 mb-2" to="/" @click="resetUserInput">
          Submit New Text
          <b-icon class="ml-3" icon="arrow-clockwise"></b-icon>
        </b-button>
    </p>
  </div>
</template>

<script>

import CiteLearnOutputSentenceSimple from './CiteLearnOutputSentenceSimple'
import CiteLearnReview from './CiteLearnReview'

export default {
  components: { CiteLearnOutputSentenceSimple, CiteLearnReview },
  name: 'CiteLearnOutput',
  created: function() {
    if (this.$store.state.predictionData.length == 0) {
      this.$router.push('/')
    }
  },
  methods: {
    resetUserInput: function() {
      this.$store.commit('setPredictionData',{id: null,paragraphs:[]})
      this.$store.commit('setInputText','')
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