<template>
  <div class="sentence">
    <span
        :id="'sentence_' + index"
        :class="spanClass">
        {{sentence}}
    </span>

    <b-tooltip
      :show.sync="show"
      :target="'sentence_' + index"
      :variant="tooltipVariant"
      @click="showPopover">
      <span>{{tooltipText}}</span>
    </b-tooltip>
  </div>
</template>

<script>

const citationThreshold = process.env.VUE_APP_CITATION_REQ_THRESHOLD

export default {
  name: 'CiteLearnOutputSentenceSimple',
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
    },
    tooltipVariant: function() {
      if (this.citationNeeded) {
        return (this.citationDetected) ? 'success' : 'danger'
      }
      return 'info'
    },
    tooltipText: function() {
      if (this.citationNeeded) {
        return (this.citationDetected) ? 'Good use of citation as required!' : 'This sentence requires a citation, but none was found!'
      }
      return (this.citationDetected) ? 'Citation detected but not required' : 'Citation not required'
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
span.citationPresent.citationNeeded {
    color:green;
}
span.citationPresent.citationNeeded:hover {
    border-bottom:1px solid darkgreen
}
span.citationNotNeeded:hover {
    border-bottom:1px solid darkgray
}
</style>