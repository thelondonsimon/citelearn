<template>
  <div v-if="this.$store.getters.sentenceToReview.length > 0">
      <h3 class="mt-5">Review CiteLearn's Recommendations</h3>
      <p>Citelearn detected that the following sentences require citations. You may disagree! Review and provide feedback for each sentence.</p>
      
        <table class="table table-hover">
          <thead>
              <tr>
                  <th scope="col">Sentence</th>
                  <th scope="col">Review</th>
              </tr>
          </thead>
          <tbody>
            <cite-learn-review-sentence
            v-for="sentence in this.$store.getters.sentenceToReview"
                :score="sentence.predictionScore"
                :sentence="sentence.rawInput"
                :index="sentence.uuid"
                :key="sentence.uuid">
            </cite-learn-review-sentence>
          </tbody>
      </table>
  </div>
</template>

<script>

import CiteLearnReviewSentence from './CiteLearnReviewSentence.vue'

export default {
  components: { CiteLearnReviewSentence },
  name: 'CiteLearnReview',
  created: function() {
    if (this.$store.state.predictionData.length == 0) {
      this.$router.push('/')
    }
  }
}
</script>