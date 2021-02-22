import Vue from 'vue'
import VueRouter from 'vue-router'
import CiteLearnInput from '@/components/CiteLearnInput.vue'
import CiteLearnOutput from '@/components/CiteLearnOutput.vue'
import CiteLearnFeedback from '@/components/CiteLearnFeedback.vue'
import About from '@/views/About.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    component: CiteLearnInput
  },
  {
    path: '/analyse',
    component: CiteLearnOutput
  },
  {
    path: '/feedback',
    component: CiteLearnFeedback
  },
  {
    path: '/about',
    component: About
  },
  {
    path: '*',
    redirect: '/'
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
