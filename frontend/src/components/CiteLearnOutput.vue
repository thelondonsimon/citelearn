<template>
  <div v-if=predictions.length>
    <h3>Results</h3>
    <b-table hover :items="predictions" :fields="tblFields"></b-table>
  </div>
</template>

<script>

export default {
  name: 'CiteLearnOutput',
  props: ['predictions'],
  data() {
    return {
      tblFields: ['sentence','score']
    }
  }
}
</script>

