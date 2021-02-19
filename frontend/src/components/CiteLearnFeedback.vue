<template>
  <div>
    <h1>Feedack on CiteLearn</h1>
    <p>Potential survey content...</p>
    <hr />
    <p class="text-center">
        <b-button to="/" @click="resetUserInput" type="submit" variant="primary" class="mr-2">
            Restart
            <b-icon class="ml-2" icon="arrow-clockwise"></b-icon>
        </b-button>
    </p>
  </div>
</template>

<script>

export default {
  name: 'CiteLearnFeedback',
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