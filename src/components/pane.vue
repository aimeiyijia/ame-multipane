<template>
  <div class="splitpanes__pane" :style="style" @click="onPaneClick($event, _uid)">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'Pane',
  inject: ['requestUpdate', 'onPaneAdd', 'onPaneRemove', 'onPaneClick'],

  props: {
    size: { type: [Number, String], default: null },
    prevSize: { type: [Number, String], default: null },
    minSize: { type: [Number, String], default: 0 },
    maxSize: { type: [Number, String], default: 100 },
    foldToLeft: { type: Boolean, default: false },
    foldToRight: { type: Boolean, default: false }
  },

  data: () => ({
    style: {}
  }),

  computed: {
    sizeNumber() {
      return this.size || this.size === 0 ? parseFloat(this.size) : null
    },
    minSizeNumber() {
      return parseFloat(this.minSize)
    },
    maxSizeNumber() {
      return parseFloat(this.maxSize)
    }
  },

  watch: {
    sizeNumber(size) {
      this.requestUpdate({ target: this, size })
    },
    minSizeNumber(min) {
      this.requestUpdate({ target: this, min })
    },
    maxSizeNumber(max) {
      this.requestUpdate({ target: this, max })
    }
  },

  mounted() {
    this.onPaneAdd(this)
  },

  beforeDestroy() {
    this.onPaneRemove(this)
  },

  methods: {
    // Called from the splitpanes component.
    update(style) {
      this.style = style
    }
  }
}
</script>
