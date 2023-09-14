<template>
  <splitpanes class="default-theme">
    <pane min-size="20">横 1</pane>
    <pane min-size="20">横 2</pane>
    <pane>
      <splitpanes horizontal>
        <pane>竖 3</pane>
        <pane>竖 4</pane>
        <pane>竖 5</pane>
      </splitpanes>
    </pane>
    <pane>横 6</pane>
  </splitpanes>
</template>

<script>
import { Splitpanes, Pane } from '@/components/index'

export default {
  components: { Splitpanes, Pane },
  directives: {
    scroll: {
      inserted: (el, binding) => {
        const f = (evt) => {
          if (binding.value(evt, el)) window.removeEventListener('scroll', f)
        }
        window.addEventListener('scroll', f)
      }
    }
  },
  data: () => ({
    offsetTop: 0,
    goTopHidden: true
  }),
  methods: {
    onScroll() {
      this.offsetTop = window.pageYOffset || document.documentElement.scrollTop
      this.goTopHidden = this.offsetTop < 200
    },
    scrollToTop() {
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
}
</script>
<style lang="scss">
html,
body {
  width: 100%;
  height: 100%;
}
</style>
