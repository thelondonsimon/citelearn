<template>
  <div id="app">
    <CiteLearnInput />
  </div>
</template>

<script>
import CiteLearnInput from './components/CiteLearnInput.vue'

export default {
  name: 'App',
  components: {
    CiteLearnInput
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
