<template>
  <div>
      <b-alert show>Citelearn detected that the following sentences require citations. You may disagree! Review and provide feedback for each sentence.</b-alert>
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
    <hr />
    <p class="text-center">
        <b-button type="submit" variant="danger" class="mr-2" to="/">
            <b-icon class="mr-2" icon="arrow-left-circle"></b-icon>
            Edit Text
        </b-button>
        <b-button type="submit" variant="success" class="mr-2" to="feedback">
            Continue
            <b-icon class="ml-2" icon="arrow-right-circle"></b-icon>
        </b-button>
    </p>
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