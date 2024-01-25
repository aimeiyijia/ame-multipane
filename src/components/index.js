import SplitPanes from './splitpanes.vue'
import Pane from './pane.vue'

const Splitpanes = {
  install(Vue) {
    Vue.component(SplitPanes.name, SplitPanes)
    Vue.component(Pane.name, Pane)
  }
}

export default Splitpanes
export { SplitPanes, Pane }
