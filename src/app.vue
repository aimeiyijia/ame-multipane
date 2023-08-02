<template>
  <div id="app">
    <multipane class="custom-resizer" layout="vertical">
      <paner>
        <div class="pane pane1">第一个面板</div>
      </paner>
      <resizer></resizer>
      <paner>
        <div class="pane pane2">第二个面板</div>
      </paner>
    </multipane>
  </div>
</template>

<script type="ts">
import Vue, { VNode, CreateElement } from 'vue'
import { Component, Prop, Emit, Watch } from 'vue-property-decorator'
@Component({
  name: 'App',
})
export default class extends Vue {}
</script>
<style lang="scss">
html,
body,
#app {
  height: 100%;
}
body {
  overflow: hidden;
}
.layout-v > .pane {
  width: 50%;
}
.layout-h > .pane {
  height: 200px;
}
.pane {
  font-size: 36px;
}
.pane1 {
  background-color: aquamarine;
}
.pane2 {
  background-color: bisque;
}
.pane3 {
  background-color: chocolate;
}
</style>
