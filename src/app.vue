<template>
  <div id="app">
    <multipane class="custom-resizer" layout="vertical">
      <paner :style="{ width: '30%' }">
        <div class="pane pane1">第一个面板</div>
      </paner>
      <resizer></resizer>
      <paner :style="{ width: '30%' }">
        <div class="pane pane2">第二个面板</div>
      </paner>
      <resizer></resizer>
      <paner :style="{ width: '40%' }">
        <div class="pane pane3">第三个面板</div>
      </paner>
      <!-- <multipane class="custom-resizer" layout="horizontal">
        <paner :style="{ height: '50%' }">
          <div class="pane pane1">第三个面板</div>
        </paner>
        <resizer></resizer>
        <paner :style="{ height: '50%' }">
          <div class="pane pane2">第四个面板</div>
        </paner>
      </multipane> -->
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
  width: 100%;
  overflow: auto;
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
