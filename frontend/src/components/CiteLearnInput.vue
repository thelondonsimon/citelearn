<template>
  <div>
      <b-form @submit="onSubmit" @reset="onReset" v-if="showForm">
      <b-form-group id="input-group-2" label-for="citelearn-inputtext">
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
  </div>
</template>

<script>

export default {
  name: 'CiteLearnInput',
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
      this.$emit('inputSubmitted',this.form.text)
    },
    onReset: function() {
      this.form.text = ''
      this.$emit('inputReset')
    }
  }
}
</script>

<style scoped>
#citelearn-inputtext {
  height:200px;
}
</style>