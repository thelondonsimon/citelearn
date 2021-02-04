<template>
  <div id="app">
    <b-overlay :show="showOverlay" rounded="sm">
      <b-container fluid>
        <h1>CiteLearn Analyser</h1>
        <b-row align-v="start">
          <b-col>
            <CiteLearnInput @inputSubmitted="handleInputSubmission" @inputReset="handleInputReset" />
          </b-col>
        </b-row>
        <hr />
        <b-row align-v="start">
          <b-col>
            <CiteLearnOutput v-bind:predictions="predictions" />
          </b-col>
        </b-row>
      </b-container>
    </b-overlay>
  </div>
</template>

<script>
import CiteLearnInput from './components/CiteLearnInput.vue'
import CiteLearnOutput from './components/CiteLearnOutput.vue'

const axios = require('axios');
const apiBaseUrl = process.env.VUE_APP_API_BASE_URL

export default {
  name: 'App',
  components: {
    CiteLearnInput,
    CiteLearnOutput
  },
  data () {
    return {
      predictions: [],
      showOverlay: false
    }
  },
  methods: {
    handleInputSubmission(text) {
      this.showOverlay = true 
      const that = this
      const json = { text: text }
      axios.post(apiBaseUrl + '/predict',json)
        .then(function(response) {
          that.predictions = response.data
          that.showOverlay = false
        })
    },
    handleInputReset() {
      this.predictions = []
    }
  }
}
</script>

<style>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 100px;
}
</style>
