import Multipane from "./components/multipane"
import Resizer from "./components/resizer"
import Paner from "./components/paner"

import _Vue, { PluginFunction, VueConstructor } from "vue"

interface InstallFunction extends PluginFunction<any> {
  installed?: boolean
}

const Components: { [key: string]: VueConstructor } = {
  Multipane: Multipane,
  Resizer: Resizer,
  Paner: Paner
}

const install: InstallFunction = (Vue: typeof _Vue) => {
  if (install.installed) return

  Object.keys(Components).forEach((name: any) => {
    Vue.component(name, Components[name])
  })

  install.installed = true
}

export default install
