<template>
  <splitpanes
    class="default-theme"
    @fold-to-left="handleFoldLeft"
    @fold-to-right="handleFoldRight"
    @resize="handleResize"
    @resized="handleResized"
    @splitter-click="handleSplitter"
  >
    <pane size="25" :fold-to-left="true" :fold-to-right="true">横 1</pane>
    <pane size="25" :fold-to-left="true" :fold-to-right="true">横 2</pane>
    <pane size="50" :fold-to-left="true" :fold-to-right="true">
      <splitpanes horizontal>
        <pane>竖 3</pane>
        <pane :fold-to-left="true" :fold-to-right="true">竖 4</pane>
        <pane>竖 5</pane>
      </splitpanes>
    </pane>
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
    goTopHidden: true,
    size: 10
  }),
  methods: {
    onScroll() {
      this.offsetTop = window.pageYOffset || document.documentElement.scrollTop
      this.goTopHidden = this.offsetTop < 200
    },
    scrollToTop() {
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' })
    },
    handleResize(e) {
      // console.log('resize：', e)
    },
    handleResized(e) {
      console.log('resized：', e)
    },
    handleSplitter(left, right) {
      // this.size = 20
      console.log('splitter left：', left)
      console.log('splitter right：', right)
    },
    handleFoldLeft(e) {
      console.log(e, '向左折叠')
    },
    handleFoldRight() {}
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
