<template>
  <tr class="sentence">
      <td>{{sentence}}</td>
      <td>
        <b-form-select @change="updateReview" v-model="reviewSelected" :options="reviewOptions" size="sm" class="mt-3"></b-form-select>
        <b-form-input v-show="showOther" @change="updateReview" v-model="reviewOther" size="sm" class="mt-3" placeholder="Enter your reason..."></b-form-input>
      </td>
  </tr>
</template>

<script>
const axios = require('axios');
const apiBaseUrl = process.env.VUE_APP_API_BASE_URL

export default {
  name: 'CiteLearnReviewSentence',
  props: ['score','sentence','index'],
  data() {
    return {
        reviewSelected: null,
        reviewOther: '',
        reviewOptions: [
            { value: null, text: 'Please select an option'},
            { value: 'citation-needed', text: "CiteLearn's suggestion is correct - a citation is needed"},
            { value: 'not-detected', text: "There is already a citation in this sentence but it wasn't detected"},
            { value: 'common-knowledge', text: "No citation is needed - all claims are common knowledge"},
            { value: 'previously-cited', text: "No citation is needed - all claims are supported by citations in adjacent sentences"},
            { value: 'other', text: "No citation is needed - other reason (please specify)"}
        ]
    }
  },
  computed: {
    showOther: function() {
      return this.reviewSelected == 'other'
    }
  },
  methods: {
    updateReview: function() {
      this.reviewOther = (this.reviewSelected == 'other') ? this.reviewOther : null
      const json = {id: this.index, dtEvaluated: 'now()', userEvaluationCategory: this.reviewSelected, userEvaluationText: this.reviewOther }
      axios.patch(apiBaseUrl + '/analysis_sentence', json)
    }
  }
}
</script>