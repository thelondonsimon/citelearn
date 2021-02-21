<template>
  <div id="app1">
    <b-navbar toggleable="sm" type="dark" variant="dark" fixed="top">
      <b-navbar-brand to="/" @click="resetUserInput"><img class="ml-2" src="assets/textlogo.png" alt="CiteLearn" title="CiteLearn" height="30"></b-navbar-brand>
      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item to="/" @click="resetUserInput" class="ml-2">Home</b-nav-item>
          <b-nav-item to="about" class="ml-2">About</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
    
    <main role="main" class="container">
      <router-view/>
    </main>
    <hr class="mt-5" />
    <footer class="footer">
      <div class="container">
        <p class="text-muted text-center"><small>CiteLearn is a project of the <a href="https://www.uts.edu.au/">University of Technology, Sydney</a>  &copy; 2021</small></p>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App',
  methods: {
    resetUserInput: function() {
      this.$store.commit('setPredictionData',{id: null,paragraphs:[]})
      this.$store.commit('setInputText','')
    }
  }
}
</script>

<style lang="scss">
#app1 {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 100px;
}
</style>
