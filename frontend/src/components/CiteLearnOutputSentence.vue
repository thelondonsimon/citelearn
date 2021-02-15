<template>
  <div class="sentence">
    <span
        :id="'sentence_' + index"
        :class="spanClass"
        @click="showPopover">
        {{sentence}}
    </span>

    <b-popover
      :show.sync="show"
      :target="'sentence_' + index"
      triggers=""
      placement="top"
      :variant="(citationNeeded && !citationDetected) ? 'danger' : 'success'">
      <template #title>Citation {{ (!citationNeeded) ? 'Not' : '' }} Needed</template>
      {{sentence}}
      <hr />
      <p><strong>Score</strong>: {{ roundedScore }}</p>
      <p><strong>Citation Detected</strong>: {{ (citationDetected) ? 'Yes' : 'No' }}</p>
      <hr />
      <div class="text-center">
        <b-button
          :variant="(citationNeeded && !citationDetected) ? 'outline-danger' : 'outline-success'"
          size="sm"
          @click="show = !show">
          Close
        </b-button></div>
    </b-popover>
  </div>
</template>

<script>

const citationThreshold = process.env.VUE_APP_CITATION_REQ_THRESHOLD

export default {
  name: 'CiteLearnOutputSentence',
  props: ['score','sentence','citationDetected','index'],
  data() {
      return {
          citationThreshold: citationThreshold,
          show: false
      }
  },
  computed: {
    roundedScore: function() {
      return Math.round(parseFloat(this.score) * 100) + '%'
    },
    citationNeeded : function() {
      return this.score >= citationThreshold
    },
    spanClass: function() {
      return {
        citationPresent: (this.citationDetected),
        citationMissing: (!this.citationDetected),
        citationNeeded: this.citationNeeded,
        citationNotNeeded: !this.citationNotNeeded
      }
    }
  },
  methods: {
      showPopover: function() {
          this.$root.$emit('bv::hide::popover')
          this.show = true
      }
  }
}
</script>

<style scoped>
div.sentence {
  display: inline;
}
div.sentence span {
    cursor: zoom-in;
}
span.citationMissing.citationNeeded {
    color:red;
}
span.citationMissing.citationNeeded:hover {
    border-bottom:1px solid darkred
}
span.citationPresent {
    color:green;
}
span.citationPresent:hover {
    border-bottom:1px solid darkgreen
}
span.citationNotNeeded:hover {
    border-bottom:1px solid darkgray
}
</style>