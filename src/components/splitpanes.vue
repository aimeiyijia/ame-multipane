<script>
export default {
  name: 'Splitpanes',

  provide() {
    return {
      requestUpdate: this.requestUpdate,
      onPaneAdd: this.onPaneAdd,
      onPaneRemove: this.onPaneRemove,
      onPaneClick: this.onPaneClick
    }
  },
  props: {
    horizontal: { type: Boolean },
    fold: { type: Boolean, default: false },
    pushOtherPanes: { type: Boolean, default: false },
    dblClickSplitter: { type: Boolean, default: false },
    rtl: { type: Boolean, default: false }, // Right to left direction.
    firstSplitter: { type: Boolean }
  },

  data: () => ({
    container: null,
    ready: false,
    panes: [],
    touch: {
      mouseDown: false,
      dragging: false,
      activeSplitter: null
    },
    splitterTaps: {
      // Used to detect double click on touch devices.
      splitter: null,
      timeoutId: null
    }
  }),

  computed: {
    panesCount() {
      return this.panes.length
    },
    // Indexed panes by `_uid` of Pane components for fast lookup.
    // Every time a pane is destroyed this index is recomputed.
    indexedPanes() {
      const obj = {}
      this.panes.forEach((pane) => {
        obj[pane.id] = pane
      })
      return obj
      // return this.panes.reduce((obj, pane) => (obj[pane.id] = pane) && obj, {})
    }
  },

  watch: {
    panes: {
      // Every time a pane is updated, update the panes accordingly.
      deep: true,
      immediate: false,
      handler() {
        this.updatePaneComponents()
      }
    },
    horizontal() {
      this.updatePaneComponents()
    },
    firstSplitter() {
      this.redoSplitters()
    },
    dblClickSplitter(enable) {
      const splitters = [...this.container.querySelectorAll('.splitpanes__splitter')]
      splitters.forEach((splitter, i) => {
        splitter.ondblclick = enable ? (event) => this.onSplitterDblClick(event, i) : undefined
      })
    }
  },

  beforeDestroy() {
    // Prevent emitting console warnings on hot reloading.
    this.ready = false
  },

  mounted() {
    this.container = this.$refs.container
    this.checkSplitpanesNodes()
    this.redoSplitters()
    this.resetPaneSizes()
    this.$emit('ready')
    this.ready = true
  },

  methods: {
    updatePaneComponents() {
      // On update refresh the size of each pane through the registered `update` method (in onPaneAdd).
      this.panes.forEach((pane) => {
        if (pane.update) {
          pane.update({
            // Panes are indexed by Pane component uid, as they might be inserted at different index.
            [this.horizontal ? 'height' : 'width']: `${this.indexedPanes[pane.id].size}%`
          })
        }
      })
    },

    bindEvents() {
      document.addEventListener('mousemove', this.onMouseMove, {
        passive: false
      })
      document.addEventListener('mouseup', this.onMouseUp)

      // Passive: false to prevent scrolling while touch dragging.
      if ('ontouchstart' in window) {
        document.addEventListener('touchmove', this.onMouseMove, {
          passive: false
        })
        document.addEventListener('touchend', this.onMouseUp)
      }
    },

    unbindEvents() {
      document.removeEventListener('mousemove', this.onMouseMove, {
        passive: false
      })
      document.removeEventListener('mouseup', this.onMouseUp)

      if ('ontouchstart' in window) {
        document.removeEventListener('touchmove', this.onMouseMove, {
          passive: false
        })
        document.removeEventListener('touchend', this.onMouseUp)
      }
    },

    onMouseDown(event, splitterIndex) {
      this.bindEvents()
      this.touch.mouseDown = true
      this.touch.activeSplitter = splitterIndex
    },

    onMouseMove(event) {
      if (this.touch.mouseDown) {
        // Prevent scrolling while touch dragging (only works with an active event, eg. passive: false).
        event.preventDefault()
        this.touch.dragging = true
        this.calculatePanesSize(this.getCurrentMouseDrag(event))
        this.$emit(
          'resize',
          this.panes.map((pane) => ({
            min: pane.min,
            max: pane.max,
            size: pane.size
          }))
        )
      }
    },

    onMouseUp() {
      if (this.touch.dragging) {
        this.$emit(
          'resized',
          this.panes.map((pane) => ({
            min: pane.min,
            max: pane.max,
            size: pane.size
          }))
        )
      }
      this.touch.mouseDown = false
      // Keep dragging flag until click event is finished (click happens immediately after mouseup)
      // in order to prevent emitting `splitter-click` event if splitter was dragged.
      setTimeout(() => {
        this.touch.dragging = false
        this.unbindEvents()
      }, 100)
    },

    // If touch device, detect double tap manually (2 taps separated by less than 500ms).
    onSplitterClick(event, splitterIndex, splitterNextIndex) {
      if ('ontouchstart' in window) {
        event.preventDefault()

        // Detect splitter double taps if the option is on.
        if (this.dblClickSplitter) {
          if (this.splitterTaps.splitter === splitterNextIndex) {
            clearTimeout(this.splitterTaps.timeoutId)
            this.splitterTaps.timeoutId = null
            this.onSplitterDblClick(event, splitterNextIndex)
            this.splitterTaps.splitter = null // Reset for the next tap check.
          } else {
            this.splitterTaps.splitter = splitterNextIndex
            this.splitterTaps.timeoutId = setTimeout(() => {
              this.splitterTaps.splitter = null
            }, 500)
          }
        }
      }

      if (!this.touch.dragging) this.$emit('splitter-click', this.panes[splitterIndex], this.panes[splitterNextIndex])
    },

    // On splitter dbl click or dbl tap maximize this pane.
    onSplitterDblClick(event, splitterIndex) {
      console.log(this.panes, '双击')
      console.log(splitterIndex, '双击 splitterIndex')
      let totalMinSizes = 0
      this.panes = this.panes.map((pane, i) => {
        pane.size = i === splitterIndex ? pane.max : pane.min
        if (i !== splitterIndex) totalMinSizes += pane.min

        return pane
      })
      this.panes[splitterIndex].size -= totalMinSizes
      this.$emit('pane-maximize', this.panes[splitterIndex])
    },

    onPaneClick(event, paneId) {
      this.$emit('pane-click', this.indexedPanes[paneId])
    },

    // Get the cursor position relative to the splitpane container.
    getCurrentMouseDrag(event) {
      const rect = this.container.getBoundingClientRect()
      const { clientX, clientY } = 'ontouchstart' in window && event.touches ? event.touches[0] : event

      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      }
    },

    // Returns the drag percentage of the splitter relative to the 2 panes it's inbetween.
    // if the sum of size of the 2 cells is 60%, the dragPercentage range will be 0 to 100% of this 60%.
    getCurrentDragPercentage(drag) {
      drag = drag[this.horizontal ? 'y' : 'x']
      // In the code bellow 'size' refers to 'width' for vertical and 'height' for horizontal layout.
      const containerSize = this.container[this.horizontal ? 'clientHeight' : 'clientWidth']
      if (this.rtl && !this.horizontal) drag = containerSize - drag

      return (drag * 100) / containerSize
    },

    calculatePanesSize(drag) {
      const splitterIndex = this.touch.activeSplitter
      let sums = {
        prevPanesSize: this.sumPrevPanesSize(splitterIndex),
        nextPanesSize: this.sumNextPanesSize(splitterIndex),
        prevReachedMinPanes: 0,
        nextReachedMinPanes: 0
      }

      const minDrag = 0 + (this.pushOtherPanes ? 0 : sums.prevPanesSize)
      const maxDrag = 100 - (this.pushOtherPanes ? 0 : sums.nextPanesSize)
      const dragPercentage = Math.max(Math.min(this.getCurrentDragPercentage(drag), maxDrag), minDrag)

      // If not pushing other panes, panes to resize are right before and right after splitter.
      let panesToResize = [splitterIndex, splitterIndex + 1]
      let paneBefore = this.panes[panesToResize[0]] || null
      let paneAfter = this.panes[panesToResize[1]] || null

      const paneBeforeMaxReached = paneBefore.max < 100 && dragPercentage >= paneBefore.max + sums.prevPanesSize
      const paneAfterMaxReached =
        paneAfter.max < 100 && dragPercentage <= 100 - (paneAfter.max + this.sumNextPanesSize(splitterIndex + 1))
      // Prevent dragging beyond pane max.
      if (paneBeforeMaxReached || paneAfterMaxReached) {
        if (paneBeforeMaxReached) {
          paneBefore.size = paneBefore.max
          paneAfter.size = Math.max(100 - paneBefore.max - sums.prevPanesSize - sums.nextPanesSize, 0)
        } else {
          paneBefore.size = Math.max(
            100 - paneAfter.max - sums.prevPanesSize - this.sumNextPanesSize(splitterIndex + 1),
            0
          )
          paneAfter.size = paneAfter.max
        }
        return
      }

      // When pushOtherPanes = true, find the closest expanded pane on each side of the splitter.
      if (this.pushOtherPanes) {
        const vars = this.doPushOtherPanes(sums, dragPercentage)
        if (!vars) return // Prevent other calculation.
        ;({ sums, panesToResize } = vars)
        paneBefore = this.panes[panesToResize[0]] || null
        paneAfter = this.panes[panesToResize[1]] || null
      }

      if (paneBefore !== null) {
        paneBefore.size = Math.min(
          Math.max(dragPercentage - sums.prevPanesSize - sums.prevReachedMinPanes, paneBefore.min),
          paneBefore.max
        )
      }
      if (paneAfter !== null) {
        paneAfter.size = Math.min(
          Math.max(100 - dragPercentage - sums.nextPanesSize - sums.nextReachedMinPanes, paneAfter.min),
          paneAfter.max
        )
      }
    },

    doPushOtherPanes(sums, dragPercentage) {
      const splitterIndex = this.touch.activeSplitter
      const panesToResize = [splitterIndex, splitterIndex + 1]
      // Pushing Down.
      // Going smaller than the current pane min size: take the previous expanded pane.
      if (dragPercentage < sums.prevPanesSize + this.panes[panesToResize[0]].min) {
        panesToResize[0] = this.findPrevExpandedPane(splitterIndex).index

        sums.prevReachedMinPanes = 0
        // If pushing a n-2 or less pane, from splitter, then make sure all in between is at min size.
        if (panesToResize[0] < splitterIndex) {
          this.panes.forEach((pane, i) => {
            if (i > panesToResize[0] && i <= splitterIndex) {
              pane.size = pane.min
              sums.prevReachedMinPanes += pane.min
            }
          })
        }
        sums.prevPanesSize = this.sumPrevPanesSize(panesToResize[0])
        // If nothing else to push down, cancel dragging.
        if (panesToResize[0] === undefined) {
          sums.prevReachedMinPanes = 0
          this.panes[0].size = this.panes[0].min
          this.panes.forEach((pane, i) => {
            if (i > 0 && i <= splitterIndex) {
              pane.size = pane.min
              sums.prevReachedMinPanes += pane.min
            }
          })
          this.panes[panesToResize[1]].size =
            100 - sums.prevReachedMinPanes - this.panes[0].min - sums.prevPanesSize - sums.nextPanesSize
          return null
        }
      }
      // Pushing Up.
      // Pushing up beyond min size is reached: take the next expanded pane.
      if (dragPercentage > 100 - sums.nextPanesSize - this.panes[panesToResize[1]].min) {
        panesToResize[1] = this.findNextExpandedPane(splitterIndex).index
        sums.nextReachedMinPanes = 0
        // If pushing a n+2 or more pane, from splitter, then make sure all in between is at min size.
        if (panesToResize[1] > splitterIndex + 1) {
          this.panes.forEach((pane, i) => {
            if (i > splitterIndex && i < panesToResize[1]) {
              pane.size = pane.min
              sums.nextReachedMinPanes += pane.min
            }
          })
        }
        sums.nextPanesSize = this.sumNextPanesSize(panesToResize[1] - 1)
        // If nothing else to push up, cancel dragging.
        if (panesToResize[1] === undefined) {
          sums.nextReachedMinPanes = 0
          this.panes[this.panesCount - 1].size = this.panes[this.panesCount - 1].min
          this.panes.forEach((pane, i) => {
            if (i < this.panesCount - 1 && i >= splitterIndex + 1) {
              pane.size = pane.min
              sums.nextReachedMinPanes += pane.min
            }
          })
          this.panes[panesToResize[0]].size =
            100 -
            sums.prevPanesSize -
            sums.nextReachedMinPanes -
            this.panes[this.panesCount - 1].min -
            sums.nextPanesSize
          return null
        }
      }
      return { sums, panesToResize }
    },

    sumPrevPanesSize(splitterIndex) {
      return this.panes.reduce((total, pane, i) => total + (i < splitterIndex ? pane.size : 0), 0)
    },

    sumNextPanesSize(splitterIndex) {
      return this.panes.reduce((total, pane, i) => total + (i > splitterIndex + 1 ? pane.size : 0), 0)
    },

    // Return the previous pane from siblings which has a size (width for vert or height for horz) of more than 0.
    findPrevExpandedPane(splitterIndex) {
      const pane = [...this.panes].reverse().find((p) => p.index < splitterIndex && p.size > p.min)
      return pane || {}
    },

    // Return the next pane from siblings which has a size (width for vert or height for horz) of more than 0.
    findNextExpandedPane(splitterIndex) {
      const pane = this.panes.find((p) => p.index > splitterIndex + 1 && p.size > p.min)
      return pane || {}
    },

    checkSplitpanesNodes() {
      const children = Array.from(this.container.children)
      children.forEach((child) => {
        const isPane = child.classList.contains('splitpanes__pane')
        const isSplitter = child.classList.contains('splitpanes__splitter')

        // Node is not a Pane or a splitter: remove it.
        if (!isPane && !isSplitter) {
          child.parentNode.removeChild(child) // el.remove() doesn't work on IE11.
          // eslint-disable-next-line no-console
          console.warn(
            'Splitpanes: Only <pane> elements are allowed at the root of <splitpanes>. One of your DOM nodes was removed.'
          )
        }
      })
    },

    addSplitter(paneIndex, nextPaneNode, isVeryFirst = false) {
      const splitterIndex = paneIndex - 1
      // console.log(this.panes[splitterIndex], '左面板')
      // console.log(this.panes[paneIndex], '右面板')
      const { toLeft: leftPaneToLeft, toRight: leftPaneToRight } = this.panes[splitterIndex]
      const { toLeft: rightPaneToLeft, toRight: rightPaneToRight } = this.panes[paneIndex]
      const elm = document.createElement('div')
      elm.classList.add('splitpanes__splitter')

      const foldContainer = document.createElement('div')
      const foldLeftIcon = document.createElement('span')
      const foldRightIcon = document.createElement('span')
      if (leftPaneToRight) {
        foldLeftIcon.classList.add('splitpanes__splitter-fold--left')
        foldLeftIcon.onclick = () => {
          if (this.panes[splitterIndex].foldLeft && this.panes[paneIndex].foldLeft) return
          if (this.panes[paneIndex].size === 1) {
            this.panes[paneIndex].size = this.panes[paneIndex].prevSize
            this.panes[splitterIndex].size = this.panes[splitterIndex].prevSize

            this.panes[splitterIndex].foldLeft = false
            this.panes[paneIndex].foldLeft = false
            this.panes[splitterIndex].foldRight = false
            this.panes[paneIndex].foldRight = false
          } else {
            this.panes[splitterIndex].prevSize = this.panes[splitterIndex].size
            this.panes[paneIndex].prevSize = this.panes[paneIndex].size
            this.panes[paneIndex].size += this.panes[splitterIndex].size - 1
            this.panes[splitterIndex].size = 1

            this.panes[splitterIndex].foldLeft = true
            this.panes[paneIndex].foldLeft = true
            this.panes[splitterIndex].foldRight = false
            this.panes[paneIndex].foldRight = false
          }
          this.$emit('fold-to-left', {
            leftPane: this.panes[splitterIndex],
            rightPane: this.panes[paneIndex],
            panes: this.panes
          })
        }
      }
      if (rightPaneToLeft) {
        foldRightIcon.classList.add('splitpanes__splitter-fold--right')
        foldRightIcon.onclick = () => {
          if (this.panes[splitterIndex].foldRight && this.panes[paneIndex].foldRight) return
          console.log(this.panes[splitterIndex].size, '左面板')
          console.log(this.panes[paneIndex].size, '右面板')
          if (this.panes[splitterIndex].size === 1) {
            this.panes[paneIndex].size = this.panes[paneIndex].prevSize
            this.panes[splitterIndex].size = this.panes[splitterIndex].prevSize

            this.panes[splitterIndex].foldLeft = false
            this.panes[paneIndex].foldLeft = false
            this.panes[splitterIndex].foldRight = false
            this.panes[paneIndex].foldRight = false
          } else {
            const leftPaneSize = this.panes[splitterIndex].size
            const rightPaneSize = this.panes[paneIndex].size
            this.panes[splitterIndex].prevSize = this.panes[splitterIndex].size
            this.panes[paneIndex].prevSize = this.panes[paneIndex].size
            this.panes[splitterIndex].size = leftPaneSize + rightPaneSize - 1
            this.panes[paneIndex].size = 1

            this.panes[splitterIndex].foldLeft = false
            this.panes[paneIndex].foldLeft = false
            this.panes[splitterIndex].foldRight = true
            this.panes[paneIndex].foldRight = true
          }
        }
        this.$emit('fold-to-right', {
          leftPane: this.panes[splitterIndex],
          rightPane: this.panes[paneIndex],
          panes: this.panes
        })
      }
      foldContainer.classList.add('splitpanes__splitter-fold')
      foldContainer.appendChild(foldLeftIcon)
      foldContainer.appendChild(foldRightIcon)
      elm.appendChild(foldContainer)

      if (!isVeryFirst) {
        elm.onmousedown = (event) => this.onMouseDown(event, splitterIndex)

        if (typeof window !== 'undefined' && 'ontouchstart' in window) {
          elm.ontouchstart = (event) => this.onMouseDown(event, splitterIndex)
        }
        elm.onclick = (event) => this.onSplitterClick(event, splitterIndex, splitterIndex + 1)
      }

      if (this.dblClickSplitter) {
        elm.ondblclick = (event) => this.onSplitterDblClick(event, splitterIndex + 1)
      }

      nextPaneNode.parentNode.insertBefore(elm, nextPaneNode)
    },

    removeSplitter(node) {
      node.onmousedown = undefined
      node.onclick = undefined
      node.ondblclick = undefined
      node.parentNode.removeChild(node) // el.remove() doesn't work on IE11.
    },

    redoSplitters() {
      const children = Array.from(this.container.children)
      children.forEach((el) => {
        if (el.className.includes('splitpanes__splitter')) this.removeSplitter(el)
      })
      let paneIndex = 0
      children.forEach((el) => {
        if (el.className.includes('splitpanes__pane')) {
          if (!paneIndex && this.firstSplitter) this.addSplitter(paneIndex, el, true)
          else if (paneIndex) this.addSplitter(paneIndex, el)
          paneIndex++
        }
      })
    },

    // Called by Pane component on programmatic resize.
    requestUpdate({ target, ...args }) {
      const pane = this.indexedPanes[target._uid]
      Object.entries(args).forEach(([key, value]) => {
        pane[key] = value
      })
    },

    onPaneAdd(pane) {
      // 1. Add pane to array at the same index it was inserted in the <splitpanes> tag.
      let index = -1
      Array.from(pane.$el.parentNode.children).some((el) => {
        if (el.className.includes('splitpanes__pane')) index++
        return el === pane.$el
      })

      const min = parseFloat(pane.minSize)
      const max = parseFloat(pane.maxSize)
      this.panes.splice(index, 0, {
        id: pane._uid,
        index,
        min: Number.isNaN(min) ? 0 : min,
        max: Number.isNaN(max) ? 100 : max,
        prevSize: pane.prevSize,
        size: pane.size === null ? null : parseFloat(pane.size),
        givenSize: pane.size,
        toLeft: pane.foldToLeft,
        toRight: pane.foldToRight,
        update: pane.update
      })

      // Redo indexes after insertion for other shifted panes.
      this.panes.forEach((p, i) => {
        p.index = i
      })

      if (this.ready) {
        this.$nextTick(() => {
          // 2. Add the splitter.
          this.redoSplitters()

          // 3. Resize the panes.
          this.resetPaneSizes({ addedPane: this.panes[index] })

          // 4. Fire `pane-add` event.
          this.$emit('pane-add', {
            index,
            panes: this.panes.map((pane) => ({
              min: pane.min,
              max: pane.max,
              size: pane.size
            }))
          })
        })
      }
    },

    onPaneRemove(pane) {
      // 1. Remove the pane from array and redo indexes.
      const index = this.panes.findIndex((p) => p.id === pane._uid)
      const removed = this.panes.splice(index, 1)[0]
      this.panes.forEach((p, i) => {
        p.index = i
      })

      this.$nextTick(() => {
        // 2. Remove the splitter.
        this.redoSplitters()

        // 3. Resize the panes.
        this.resetPaneSizes({ removedPane: { ...removed, index } })

        // 4. Fire `pane-remove` event.
        this.$emit('pane-remove', {
          removed,
          panes: this.panes.map((pane) => ({
            min: pane.min,
            max: pane.max,
            size: pane.size
          }))
        })
      })
    },

    resetPaneSizes(changedPanes = {}) {
      if (!changedPanes.addedPane && !changedPanes.removedPane) this.initialPanesSizing()
      else if (this.panes.some((pane) => pane.givenSize !== null || pane.min || pane.max < 100))
        this.equalizeAfterAddOrRemove(changedPanes)
      else this.equalize()

      if (this.ready)
        this.$emit(
          'resized',
          this.panes.map((pane) => ({
            min: pane.min,
            max: pane.max,
            size: pane.size
          }))
        )
    },

    equalize() {
      const equalSpace = 100 / this.panesCount
      let leftToAllocate = 0
      const ungrowable = []
      const unshrinkable = []

      this.panes.forEach((pane) => {
        pane.size = Math.max(Math.min(equalSpace, pane.max), pane.min)

        leftToAllocate -= pane.size
        if (pane.size >= pane.max) ungrowable.push(pane.id)
        if (pane.size <= pane.min) unshrinkable.push(pane.id)
      })

      if (leftToAllocate > 0.1) this.readjustSizes(leftToAllocate, ungrowable, unshrinkable)
    },

    initialPanesSizing() {
      const equalSpace = 100 / this.panesCount
      let leftToAllocate = 100
      const ungrowable = []
      const unshrinkable = []
      let definedSizes = 0

      // Check if pre-allocated space is 100%.
      this.panes.forEach((pane) => {
        leftToAllocate -= pane.size
        if (pane.size !== null) definedSizes++
        if (pane.size >= pane.max) ungrowable.push(pane.id)
        if (pane.size <= pane.min) unshrinkable.push(pane.id)
      })

      // set pane sizes if not set.
      let leftToAllocate2 = 100
      if (leftToAllocate > 0.1) {
        this.panes.forEach((pane) => {
          if (pane.size === null) {
            pane.size = Math.max(Math.min(leftToAllocate / (this.panesCount - definedSizes), pane.max), pane.min)
          }
          leftToAllocate2 -= pane.size
        })

        if (leftToAllocate2 > 0.1) this.readjustSizes(leftToAllocate, ungrowable, unshrinkable)
      }
    },

    equalizeAfterAddOrRemove({ addedPane, removedPane } = {}) {
      let equalSpace = 100 / this.panesCount
      let leftToAllocate = 0
      const ungrowable = []
      const unshrinkable = []

      if (addedPane && addedPane.givenSize !== null) {
        equalSpace = (100 - addedPane.givenSize) / (this.panesCount - 1)
      }

      // Check if pre-allocated space is 100%.
      this.panes.forEach((pane) => {
        leftToAllocate -= pane.size
        if (pane.size >= pane.max) ungrowable.push(pane.id)
        if (pane.size <= pane.min) unshrinkable.push(pane.id)
      })

      if (Math.abs(leftToAllocate) < 0.1) return // Ok.

      this.panes.forEach((pane) => {
        if (addedPane && addedPane.givenSize !== null && addedPane.id === pane.id) {
        } else pane.size = Math.max(Math.min(equalSpace, pane.max), pane.min)

        leftToAllocate -= pane.size
        if (pane.size >= pane.max) ungrowable.push(pane.id)
        if (pane.size <= pane.min) unshrinkable.push(pane.id)
      })

      if (leftToAllocate > 0.1) this.readjustSizes(leftToAllocate, ungrowable, unshrinkable)
    },

    /* recalculatePaneSizes ({ addedPane, removedPane } = {}) {
      let leftToAllocate = 100
      let equalSpaceToAllocate = leftToAllocate / this.panesCount
      let ungrowable = []
      let unshrinkable = []

      // When adding a pane with no size, apply min-size if defined otherwise divide another pane
      // (next or prev) in 2.
      // if (addedPane && addedPane.size === null) {
      //   if (addedPane.min) addedPane.size = addedPane.min
      //   else {
      //     const paneToDivide = this.panes[addedPane.index + 1] || this.panes[addedPane.index - 1]
      //     if (paneToDivide) {
      //       // @todo: Dividing that pane in 2 could be incorrect if becoming lower than its min size.
      //       addedPane.size = paneToDivide.size / 2
      //       paneToDivide.size /= 2
      //     }
      //   }
      // }

      this.panes.forEach((pane, i) => {
        // Added pane - reduce the size of the next pane.
        if (addedPane && addedPane.index + 1 === i) {
          pane.size = Math.max(Math.min(100 - this.sumPrevPanesSize(i) - this.sumNextPanesSize(i + 1), pane.max), pane.min)
          // @todo: if could not allocate correctly, try to allocate in the next pane straight away,
          // then still do the second loop if not correct.
        }

        // Removed pane - increase the size of the next pane.
        else if (removedPane && removedPane.index === i) {
          pane.size = Math.max(Math.min(100 - this.sumPrevPanesSize(i) - this.sumNextPanesSize(i + 1), pane.max), pane.min)
          // @todo: if could not allocate correctly, try to allocate in the next pane straight away,
          // then still do the second loop if not correct.
        }

        // Initial load and on demand recalculation.
        else if (!addedPane && !removedPane && pane.size === null) {
          pane.size = Math.max(Math.min(equalSpaceToAllocate, pane.max), pane.min)
        }

        leftToAllocate -= pane.size

        if (pane.size >= pane.max) ungrowable.push(pane.id)
        if (pane.size <= pane.min) unshrinkable.push(pane.id)
      })

      // Do one more loop to adjust sizes if still wrong.
      // > 0.1: Prevent maths rounding issues due to bytes.
      if (Math.abs(leftToAllocate) > 0.1) this.readjustSizes(leftToAllocate, ungrowable, unshrinkable)
    }, */

    // Second loop to adjust sizes now that we know more about the panes constraints.
    readjustSizes(leftToAllocate, ungrowable, unshrinkable) {
      let equalSpaceToAllocate
      if (leftToAllocate > 0) equalSpaceToAllocate = leftToAllocate / (this.panesCount - ungrowable.length)
      else equalSpaceToAllocate = leftToAllocate / (this.panesCount - unshrinkable.length)

      this.panes.forEach((pane, i) => {
        if (leftToAllocate > 0 && !ungrowable.includes(pane.id)) {
          // Need to diff the size before and after to get the exact allocated space.
          const newPaneSize = Math.max(Math.min(pane.size + equalSpaceToAllocate, pane.max), pane.min)
          const allocated = newPaneSize - pane.size
          leftToAllocate -= allocated
          pane.size = newPaneSize
        } else if (!unshrinkable.includes(pane.id)) {
          // Need to diff the size before and after to get the exact allocated space.
          const newPaneSize = Math.max(Math.min(pane.size + equalSpaceToAllocate, pane.max), pane.min)
          const allocated = newPaneSize - pane.size
          leftToAllocate -= allocated
          pane.size = newPaneSize
        }

        // Update each pane through the registered `update` method.
        pane.update({
          [this.horizontal ? 'height' : 'width']: `${this.indexedPanes[pane.id].size}%`
        })
      })

      if (Math.abs(leftToAllocate) > 0.1) {
        // > 0.1: Prevent maths rounding issues due to bytes.
        // Don't emit on hot reload when Vue destroys panes.
        this.$nextTick(() => {
          if (this.ready) {
            // eslint-disable-next-line no-console
            console.warn('Splitpanes: Could not resize panes correctly due to their constraints.')
          }
        })
      }
    }

    /* distributeEmptySpace () {
      let growablePanes = []
      let collapsedPanesCount = 0
      let growableAmount = 0 // Total of how much the current panes can grow to fill blank space.
      let spaceToDistribute = 100 - this.panes.reduce((sum, pane) => (sum += pane.size) && sum, 0)
      // Do a first loop to determine if we can distribute the new blank space between all the
      // expandedPanes, without expanding the collapsed ones.
      this.panes.forEach(pane => {
        if (pane.size < pane.max) growablePanes.push(pane)

        if (!pane.size) collapsedPanesCount++
        else growableAmount += pane.max - pane.size
      })

      // If the blank space to distribute is too great for the expanded panes, also expand collapsed ones.
      let expandCollapsedPanes = growableAmount < spaceToDistribute

      // New space to distribute equally.
      let growablePanesCount = (growablePanes.length - (expandCollapsedPanes ? 0 : collapsedPanesCount))
      let equalSpaceToDistribute = spaceToDistribute / growablePanesCount
      // if (growablePanesCount === 1) equalSpace = 100 / this.panesCount
      let spaceLeftToDistribute = spaceToDistribute

      // Now add the equalSpaceToDistribute to each pane size accordingly.
      growablePanes.forEach(pane => {
        if (pane.size < pane.max && (pane.size || (!pane.size && expandCollapsedPanes))) {
          const newSize = Math.min(pane.size + equalSpaceToDistribute, pane.max)
          let allocatedSpace = (newSize - pane.size)
          spaceLeftToDistribute -= allocatedSpace
          pane.size = newSize
          // If the equalSpaceToDistribute is not fully added to the current pane, distribute the remainder
          // to the next panes.
          // Also fix decimal issue due to bites - E.g. calculating 8.33 and getting 8.3299999999999
          if (equalSpaceToDistribute - allocatedSpace > 0.1) equalSpaceToDistribute = spaceLeftToDistribute / (--growablePanesCount)
        }
      })

      /* Disabled otherwise will show up on hot reload.
      // if there is still space to allocate show warning message.
      if (this.panesCount && ~~spaceLeftToDistribute) {
        // eslint-disable-next-line no-console
        console.warn('Splitpanes: Could not distribute all the empty space between panes due to their constraints.')
      } *\/

      this.$emit('resized', this.panes.map(pane => ({ min: pane.min, max: pane.max, size: pane.size })))
    } */
  },

  render(h) {
    return h(
      'div',
      {
        ref: 'container',
        class: [
          'splitpanes',
          `splitpanes--${this.horizontal ? 'horizontal' : 'vertical'}`,
          {
            'splitpanes--dragging': this.touch.dragging
          }
        ]
      },
      this.$slots.default
    )
  }
}
</script>

<style lang="scss">
.splitpanes {
  display: flex;
  width: 100%;
  height: 100%;

  &--vertical {
    flex-direction: row;
  }

  &--horizontal {
    flex-direction: column;
  }

  &--dragging * {
    user-select: none;
  }

  &__pane {
    width: 100%;
    height: 100%;
    overflow: hidden;

    .splitpanes--vertical & {
      transition: width 0.2s ease-out;
    }

    .splitpanes--horizontal & {
      transition: height 0.2s ease-out;
    }

    .splitpanes--dragging & {
      transition: none;
    }
  }

  // Disable default zoom behavior on touch device when double tapping splitter.
  &__splitter {
    touch-action: none;
  }

  &--vertical > .splitpanes__splitter {
    min-width: 1.5px;
    cursor: col-resize;
  }

  &--horizontal > .splitpanes__splitter {
    min-height: 1.5px;
    cursor: row-resize;
  }
}

.splitpanes.default-theme {
  .splitpanes__pane {
    background-color: #fff;
  }

  .splitpanes__splitter {
    position: relative;
    box-sizing: border-box;
    flex-shrink: 0;
    background-color: #e4e4e4;
  }

  .splitpanes__splitter-fold {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 14px;
    height: 18px;
    display: flex;
    justify-content: center;
    align-items: center;
    .splitpanes__splitter-fold--left,
    .splitpanes__splitter-fold--right {
      display: inline-block;
      flex: 0 0 49%;
      height: 100%;
      background-color: transparent;
      background-repeat: no-repeat;
      background-position: center;
      background-size: contain;
      cursor: pointer;
    }
    .splitpanes__splitter-fold--left {
      background-image: url('./icons/icon_left.png');
    }
    .splitpanes__splitter-fold--right {
      background-image: url('./icons/icon_right.png');
    }
  }
}

.default-theme {
  &.splitpanes .splitpanes .splitpanes__splitter {
    z-index: 1;
  }

  &.splitpanes--vertical > .splitpanes__splitter,
  .splitpanes--vertical > .splitpanes__splitter {
    /* width: 7px;
    margin-left: -1px;
    border-left: 1px solid #eee; */
  }

  &.splitpanes--horizontal > .splitpanes__splitter,
  .splitpanes--horizontal > .splitpanes__splitter {
    /* height: 7px;
    margin-top: -1px;
    border-top: 1px solid #eee; */

    .splitpanes__splitter-fold {
      transform: translate(-50%, -50%) rotateZ(90deg);
      /* transform-origin: -7px 14px; */
      .splitpanes__splitter-fold--left,
      .splitpanes__splitter-fold--right {
      }
      .splitpanes__splitter-fold--left {
      }
      .splitpanes__splitter-fold--right {
      }
    }
  }
}
</style>
