<template>
  <div class="hello">
    <b-overlay :show="showOverlay" rounded="sm">
      <h1>CiteLearn Analyser</h1>
      <b-form @submit="onSubmit" @reset="onReset" v-if="showForm">
      <b-form-group id="input-group-2" label="Text to analyse:" label-for="citelearn-inputtext">
          <b-form-textarea
            id="citelearn-inputtext"
            v-model="form.text"
            required
            placeholder="Enter text to analyse"
          ></b-form-textarea>
        </b-form-group>
        <b-button type="submit" variant="primary">Submit</b-button>
        &nbsp;
        <b-button type="reset" variant="danger">Reset</b-button>
      </b-form>
      <hr />
      <CiteLearnOutput v-bind:predictions="predictions" />
    </b-overlay>
  </div>
</template>

<script>
const axios = require('axios');
const apiBaseUrl = process.env.VUE_APP_API_BASE_URL

import CiteLearnOutput from './CiteLearnOutput.vue'

export default {
  name: 'CiteLearnInput',
  components: {
    CiteLearnOutput
  },
  data () {
    return {
      form: {
        text: ''
      },
      predictions: [],
      showForm: true,
      showOverlay: false
    }
  },
  methods: {
    onSubmit: function(e) {
      e.preventDefault();
      this.showOverlay = true 
      const that = this
      const json = { text: this.form.text }
      axios.post(apiBaseUrl + '/predict',json)
        .then(function(response) {
          let predictions = []
          for(let i = 0; i < response.data.scores.length; i++) {
            predictions.push({
              sentence: response.data.sentences[i],
              score: Math.round(response.data.scores[i] * 10000)/10000,
            })
          }
          that.predictions = predictions
          that.showOverlay = false
        })
    },
    onReset: function() {
      this.form.text = ''
      this.predictions = []
    }
  }
}
</script>

