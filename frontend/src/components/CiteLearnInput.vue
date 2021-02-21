<template>
  <div>
    <b-overlay :show="showOverlay" rounded="sm">
      <h1>CiteLearn</h1>
      <p>CiteLearn uses <a href="https://github.com/mirrys/citation-needed-paper" target="_blank">machine learning models</a> to analyse text and predict if citations are needed.</p>
      <b-form @submit="onSubmit">
      <b-form-group id="input-group-2" label-for="citelearn-inputtext">
          <b-form-textarea
            id="citelearn-inputtext"
            v-model="inputText"
            required
            placeholder="Enter text to analyse"
          ></b-form-textarea>
        </b-form-group>
        <b-button type="submit" variant="success">
          Submit
          <b-icon class="ml-3" icon="arrow-right-circle"></b-icon>
        </b-button>
      </b-form>
    </b-overlay>
    <b-modal v-model="showErrorModal" ref="error-modal" hide-footer title="CiteLearn: Unexpected Error" header-text-variant="danger">
      <div class="d-block">
        <p>An error was encountered while generating predictions.</p>
        <p>Please try again later.</p>
        <p class="text-center"><b-button @click="showErrorModal = false">Close</b-button></p>
      </div>
    </b-modal>
    <b-tooltip target="input-group-2" variant="danger" triggers="manual" :show="showEmptyTooltip">
      No text was detected for analysing
  </b-tooltip>
  </div>
</template>

<script>
import router from '@/router'
const axios = require('axios');
const apiBaseUrl = process.env.VUE_APP_API_BASE_URL

export default {
  name: 'CiteLearnInput',
  data () {
    return {
      showOverlay: false,
      showErrorModal: false,
      showEmptyTooltip: false
    }
  },
  methods: {
    onSubmit: function(e) {
      e.preventDefault();
      const that = this

      if (this.$store.state.inputText.trim() == '') {
        this.showEmptyTooltip = true
        setTimeout(function() {
          that.showEmptyTooltip = false
        },2500)
        return false;
      }

      this.showOverlay = true
      const json = { text: this.$store.state.inputText, originalRequestId: this.$store.state.originalRequestId }
      
      axios.post(apiBaseUrl + '/predict',json, { timeout: 4000})
        .then(function(response) {
          that.$store.commit('setPredictionData',response.data)
          that.showOverlay = false
          router.push('analyse')
        })
        .catch(function() {
          that.showOverlay = false
          that.showErrorModal = true
        })
    }
  },
  computed: {
    inputText: {
      get(){
        return this.$store.state.inputText
      },
      set(value) {
        this.$store.commit('setInputText',value)
      }
    }
  }
}
</script>

<style scoped>
#citelearn-inputtext {
  height:200px;
}
</style>