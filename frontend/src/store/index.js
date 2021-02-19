import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
      predictionData: [],
      originalRequestId: null,
      inputText: ''
    },
    mutations: {
      setPredictionData(state,data) {
        if (!state.originalRequestId || !data.id) {
          state.originalRequestId = data.id
        }
        state.predictionData = data.paragraphs
      },
      setInputText(state,text) {
        state.inputText = text
      }
    },
    getters: {
        sentenceToReview: state => {
            const sentences = state.predictionData.map(x => x.sentences).flat()
            return sentences.filter(s => s.citationDetected == false && s.predictionScore > process.env.VUE_APP_CITATION_REQ_THRESHOLD)
        }
    }
  })