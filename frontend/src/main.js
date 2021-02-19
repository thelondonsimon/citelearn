import Vue from 'vue'
import { BootstrapVue, BIcon, BIconArrowLeftCircle, BIconArrowRightCircle,BIconArrowClockwise } from 'bootstrap-vue'
import App from './App.vue'
import './scss/main.scss'
import router from './router'
import store from './store'

Vue.use(BootstrapVue)
Vue.component('BIcon', BIcon)
Vue.component('BIconArrowLeftCircle', BIconArrowLeftCircle)
Vue.component('BIconArrowRightCircle', BIconArrowRightCircle)
Vue.component('BIconArrowClockwise', BIconArrowClockwise)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
