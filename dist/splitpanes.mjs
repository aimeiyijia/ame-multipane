function m(e, i, s, t, n, a, o, l) {
  var h = typeof e == "function" ? e.options : e;
  i && (h.render = i, h.staticRenderFns = s, h._compiled = !0), t && (h.functional = !0), a && (h._scopeId = "data-v-" + a);
  var d;
  if (o ? (d = function(r) {
    r = r || // cached call
    this.$vnode && this.$vnode.ssrContext || // stateful
    this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext, !r && typeof __VUE_SSR_CONTEXT__ < "u" && (r = __VUE_SSR_CONTEXT__), n && n.call(this, r), r && r._registeredComponents && r._registeredComponents.add(o);
  }, h._ssrRegister = d) : n && (d = l ? function() {
    n.call(
      this,
      (h.functional ? this.parent : this).$root.$options.shadowRoot
    );
  } : n), d)
    if (h.functional) {
      h._injectStyles = d;
      var u = h.render;
      h.render = function(c, f) {
        return d.call(f), u(c, f);
      };
    } else {
      var p = h.beforeCreate;
      h.beforeCreate = p ? [].concat(p, d) : [d];
    }
  return {
    exports: e,
    options: h
  };
}
const z = {
  name: "Splitpanes",
  provide() {
    return {
      requestUpdate: this.requestUpdate,
      onPaneAdd: this.onPaneAdd,
      onPaneRemove: this.onPaneRemove,
      onPaneClick: this.onPaneClick
    };
  },
  props: {
    horizontal: { type: Boolean },
    fold: { type: Boolean, default: !1 },
    pushOtherPanes: { type: Boolean, default: !1 },
    dblClickSplitter: { type: Boolean, default: !1 },
    rtl: { type: Boolean, default: !1 },
    // Right to left direction.
    firstSplitter: { type: Boolean }
  },
  data: () => ({
    container: null,
    ready: !1,
    panes: [],
    touch: {
      mouseDown: !1,
      dragging: !1,
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
      return this.panes.length;
    },
    // Indexed panes by `_uid` of Pane components for fast lookup.
    // Every time a pane is destroyed this index is recomputed.
    indexedPanes() {
      const e = {};
      return this.panes.forEach((i) => {
        e[i.id] = i;
      }), e;
    }
  },
  watch: {
    panes: {
      // Every time a pane is updated, update the panes accordingly.
      deep: !0,
      immediate: !1,
      handler() {
        this.updatePaneComponents();
      }
    },
    horizontal() {
      this.updatePaneComponents();
    },
    firstSplitter() {
      this.redoSplitters();
    },
    dblClickSplitter(e) {
      [...this.container.querySelectorAll(".splitpanes__splitter")].forEach((s, t) => {
        s.ondblclick = e ? (n) => this.onSplitterDblClick(n, t) : void 0;
      });
    }
  },
  beforeDestroy() {
    this.ready = !1;
  },
  mounted() {
    this.container = this.$refs.container, this.checkSplitpanesNodes(), this.redoSplitters(), this.resetPaneSizes(), this.$emit("ready"), this.ready = !0;
  },
  methods: {
    updatePaneComponents() {
      this.panes.forEach((e) => {
        e.update && e.update({
          // Panes are indexed by Pane component uid, as they might be inserted at different index.
          [this.horizontal ? "height" : "width"]: `${this.indexedPanes[e.id].size}%`
        });
      });
    },
    bindEvents() {
      document.addEventListener("mousemove", this.onMouseMove, {
        passive: !1
      }), document.addEventListener("mouseup", this.onMouseUp), "ontouchstart" in window && (document.addEventListener("touchmove", this.onMouseMove, {
        passive: !1
      }), document.addEventListener("touchend", this.onMouseUp));
    },
    unbindEvents() {
      document.removeEventListener("mousemove", this.onMouseMove, {
        passive: !1
      }), document.removeEventListener("mouseup", this.onMouseUp), "ontouchstart" in window && (document.removeEventListener("touchmove", this.onMouseMove, {
        passive: !1
      }), document.removeEventListener("touchend", this.onMouseUp));
    },
    onMouseDown(e, i) {
      this.bindEvents(), this.touch.mouseDown = !0, this.touch.activeSplitter = i;
    },
    onMouseMove(e) {
      this.touch.mouseDown && (e.preventDefault(), this.touch.dragging = !0, this.calculatePanesSize(this.getCurrentMouseDrag(e)), this.$emit(
        "resize",
        this.panes.map((i) => ({
          min: i.min,
          max: i.max,
          size: i.size
        }))
      ));
    },
    onMouseUp() {
      this.touch.dragging && this.$emit(
        "resized",
        this.panes.map((e) => ({
          min: e.min,
          max: e.max,
          size: e.size
        }))
      ), this.touch.mouseDown = !1, setTimeout(() => {
        this.touch.dragging = !1, this.unbindEvents();
      }, 100);
    },
    // If touch device, detect double tap manually (2 taps separated by less than 500ms).
    onSplitterClick(e, i, s) {
      "ontouchstart" in window && (e.preventDefault(), this.dblClickSplitter && (this.splitterTaps.splitter === s ? (clearTimeout(this.splitterTaps.timeoutId), this.splitterTaps.timeoutId = null, this.onSplitterDblClick(e, s), this.splitterTaps.splitter = null) : (this.splitterTaps.splitter = s, this.splitterTaps.timeoutId = setTimeout(() => {
        this.splitterTaps.splitter = null;
      }, 500)))), this.touch.dragging || this.$emit("splitter-click", this.panes[i], this.panes[s]);
    },
    // On splitter dbl click or dbl tap maximize this pane.
    onSplitterDblClick(e, i) {
      console.log(this.panes, "双击"), console.log(i, "双击 splitterIndex");
      let s = 0;
      this.panes = this.panes.map((t, n) => (t.size = n === i ? t.max : t.min, n !== i && (s += t.min), t)), this.panes[i].size -= s, this.$emit("pane-maximize", this.panes[i]);
    },
    onPaneClick(e, i) {
      this.$emit("pane-click", this.indexedPanes[i]);
    },
    // Get the cursor position relative to the splitpane container.
    getCurrentMouseDrag(e) {
      const i = this.container.getBoundingClientRect(), { clientX: s, clientY: t } = "ontouchstart" in window && e.touches ? e.touches[0] : e;
      return {
        x: s - i.left,
        y: t - i.top
      };
    },
    // Returns the drag percentage of the splitter relative to the 2 panes it's inbetween.
    // if the sum of size of the 2 cells is 60%, the dragPercentage range will be 0 to 100% of this 60%.
    getCurrentDragPercentage(e) {
      e = e[this.horizontal ? "y" : "x"];
      const i = this.container[this.horizontal ? "clientHeight" : "clientWidth"];
      return this.rtl && !this.horizontal && (e = i - e), e * 100 / i;
    },
    calculatePanesSize(e) {
      const i = this.touch.activeSplitter;
      let s = {
        prevPanesSize: this.sumPrevPanesSize(i),
        nextPanesSize: this.sumNextPanesSize(i),
        prevReachedMinPanes: 0,
        nextReachedMinPanes: 0
      };
      const t = 0 + (this.pushOtherPanes ? 0 : s.prevPanesSize), n = 100 - (this.pushOtherPanes ? 0 : s.nextPanesSize), a = Math.max(Math.min(this.getCurrentDragPercentage(e), n), t);
      let o = [i, i + 1], l = this.panes[o[0]] || null, h = this.panes[o[1]] || null;
      const d = l.max < 100 && a >= l.max + s.prevPanesSize, u = h.max < 100 && a <= 100 - (h.max + this.sumNextPanesSize(i + 1));
      if (d || u) {
        d ? (l.size = l.max, h.size = Math.max(100 - l.max - s.prevPanesSize - s.nextPanesSize, 0)) : (l.size = Math.max(
          100 - h.max - s.prevPanesSize - this.sumNextPanesSize(i + 1),
          0
        ), h.size = h.max);
        return;
      }
      if (this.pushOtherPanes) {
        const p = this.doPushOtherPanes(s, a);
        if (!p)
          return;
        ({ sums: s, panesToResize: o } = p), l = this.panes[o[0]] || null, h = this.panes[o[1]] || null;
      }
      l !== null && (l.size = Math.min(
        Math.max(a - s.prevPanesSize - s.prevReachedMinPanes, l.min),
        l.max
      )), h !== null && (h.size = Math.min(
        Math.max(100 - a - s.nextPanesSize - s.nextReachedMinPanes, h.min),
        h.max
      ));
    },
    doPushOtherPanes(e, i) {
      const s = this.touch.activeSplitter, t = [s, s + 1];
      return i < e.prevPanesSize + this.panes[t[0]].min && (t[0] = this.findPrevExpandedPane(s).index, e.prevReachedMinPanes = 0, t[0] < s && this.panes.forEach((n, a) => {
        a > t[0] && a <= s && (n.size = n.min, e.prevReachedMinPanes += n.min);
      }), e.prevPanesSize = this.sumPrevPanesSize(t[0]), t[0] === void 0) ? (e.prevReachedMinPanes = 0, this.panes[0].size = this.panes[0].min, this.panes.forEach((n, a) => {
        a > 0 && a <= s && (n.size = n.min, e.prevReachedMinPanes += n.min);
      }), this.panes[t[1]].size = 100 - e.prevReachedMinPanes - this.panes[0].min - e.prevPanesSize - e.nextPanesSize, null) : i > 100 - e.nextPanesSize - this.panes[t[1]].min && (t[1] = this.findNextExpandedPane(s).index, e.nextReachedMinPanes = 0, t[1] > s + 1 && this.panes.forEach((n, a) => {
        a > s && a < t[1] && (n.size = n.min, e.nextReachedMinPanes += n.min);
      }), e.nextPanesSize = this.sumNextPanesSize(t[1] - 1), t[1] === void 0) ? (e.nextReachedMinPanes = 0, this.panes[this.panesCount - 1].size = this.panes[this.panesCount - 1].min, this.panes.forEach((n, a) => {
        a < this.panesCount - 1 && a >= s + 1 && (n.size = n.min, e.nextReachedMinPanes += n.min);
      }), this.panes[t[0]].size = 100 - e.prevPanesSize - e.nextReachedMinPanes - this.panes[this.panesCount - 1].min - e.nextPanesSize, null) : { sums: e, panesToResize: t };
    },
    sumPrevPanesSize(e) {
      return this.panes.reduce((i, s, t) => i + (t < e ? s.size : 0), 0);
    },
    sumNextPanesSize(e) {
      return this.panes.reduce((i, s, t) => i + (t > e + 1 ? s.size : 0), 0);
    },
    // Return the previous pane from siblings which has a size (width for vert or height for horz) of more than 0.
    findPrevExpandedPane(e) {
      return [...this.panes].reverse().find((s) => s.index < e && s.size > s.min) || {};
    },
    // Return the next pane from siblings which has a size (width for vert or height for horz) of more than 0.
    findNextExpandedPane(e) {
      return this.panes.find((s) => s.index > e + 1 && s.size > s.min) || {};
    },
    checkSplitpanesNodes() {
      Array.from(this.container.children).forEach((i) => {
        const s = i.classList.contains("splitpanes__pane"), t = i.classList.contains("splitpanes__splitter");
        !s && !t && (i.parentNode.removeChild(i), console.warn(
          "Splitpanes: Only <pane> elements are allowed at the root of <splitpanes>. One of your DOM nodes was removed."
        ));
      });
    },
    addSplitter(e, i, s = !1) {
      const t = e - 1, { toLeft: n, toRight: a } = this.panes[t], { toLeft: o, toRight: l } = this.panes[e], h = document.createElement("div");
      h.classList.add("splitpanes__splitter");
      const d = document.createElement("div"), u = document.createElement("span"), p = document.createElement("span");
      a && (u.classList.add("splitpanes__splitter-fold--left"), u.onclick = () => {
        this.panes[t].foldLeft && this.panes[e].foldLeft || (this.panes[e].size === 1 ? (this.panes[e].size = this.panes[e].prevSize, this.panes[t].size = this.panes[t].prevSize, this.panes[t].foldLeft = !1, this.panes[e].foldLeft = !1, this.panes[t].foldRight = !1, this.panes[e].foldRight = !1) : (this.panes[t].prevSize = this.panes[t].size, this.panes[e].prevSize = this.panes[e].size, this.panes[e].size += this.panes[t].size - 1, this.panes[t].size = 1, this.panes[t].foldLeft = !0, this.panes[e].foldLeft = !0, this.panes[t].foldRight = !1, this.panes[e].foldRight = !1), this.$emit("fold-to-left", {
          leftPane: this.panes[t],
          rightPane: this.panes[e],
          panes: this.panes
        }));
      }), o && (p.classList.add("splitpanes__splitter-fold--right"), p.onclick = () => {
        if (!(this.panes[t].foldRight && this.panes[e].foldRight))
          if (console.log(this.panes[t].size, "左面板"), console.log(this.panes[e].size, "右面板"), this.panes[t].size === 1)
            this.panes[e].size = this.panes[e].prevSize, this.panes[t].size = this.panes[t].prevSize, this.panes[t].foldLeft = !1, this.panes[e].foldLeft = !1, this.panes[t].foldRight = !1, this.panes[e].foldRight = !1;
          else {
            const r = this.panes[t].size, c = this.panes[e].size;
            this.panes[t].prevSize = this.panes[t].size, this.panes[e].prevSize = this.panes[e].size, this.panes[t].size = r + c - 1, this.panes[e].size = 1, this.panes[t].foldLeft = !1, this.panes[e].foldLeft = !1, this.panes[t].foldRight = !0, this.panes[e].foldRight = !0;
          }
      }, this.$emit("fold-to-right", {
        leftPane: this.panes[t],
        rightPane: this.panes[e],
        panes: this.panes
      })), d.classList.add("splitpanes__splitter-fold"), d.appendChild(u), d.appendChild(p), h.appendChild(d), s || (h.onmousedown = (r) => this.onMouseDown(r, t), typeof window < "u" && "ontouchstart" in window && (h.ontouchstart = (r) => this.onMouseDown(r, t)), h.onclick = (r) => this.onSplitterClick(r, t, t + 1)), this.dblClickSplitter && (h.ondblclick = (r) => this.onSplitterDblClick(r, t + 1)), i.parentNode.insertBefore(h, i);
    },
    removeSplitter(e) {
      e.onmousedown = void 0, e.onclick = void 0, e.ondblclick = void 0, e.parentNode.removeChild(e);
    },
    redoSplitters() {
      const e = Array.from(this.container.children);
      e.forEach((s) => {
        s.className.includes("splitpanes__splitter") && this.removeSplitter(s);
      });
      let i = 0;
      e.forEach((s) => {
        s.className.includes("splitpanes__pane") && (!i && this.firstSplitter ? this.addSplitter(i, s, !0) : i && this.addSplitter(i, s), i++);
      });
    },
    // Called by Pane component on programmatic resize.
    requestUpdate({ target: e, ...i }) {
      const s = this.indexedPanes[e._uid];
      Object.entries(i).forEach(([t, n]) => {
        s[t] = n;
      });
    },
    onPaneAdd(e) {
      let i = -1;
      Array.from(e.$el.parentNode.children).some((n) => (n.className.includes("splitpanes__pane") && i++, n === e.$el));
      const s = parseFloat(e.minSize), t = parseFloat(e.maxSize);
      this.panes.splice(i, 0, {
        id: e._uid,
        index: i,
        min: Number.isNaN(s) ? 0 : s,
        max: Number.isNaN(t) ? 100 : t,
        prevSize: e.prevSize,
        size: e.size === null ? null : parseFloat(e.size),
        givenSize: e.size,
        toLeft: e.foldToLeft,
        toRight: e.foldToRight,
        update: e.update
      }), this.panes.forEach((n, a) => {
        n.index = a;
      }), this.ready && this.$nextTick(() => {
        this.redoSplitters(), this.resetPaneSizes({ addedPane: this.panes[i] }), this.$emit("pane-add", {
          index: i,
          panes: this.panes.map((n) => ({
            min: n.min,
            max: n.max,
            size: n.size
          }))
        });
      });
    },
    onPaneRemove(e) {
      const i = this.panes.findIndex((t) => t.id === e._uid), s = this.panes.splice(i, 1)[0];
      this.panes.forEach((t, n) => {
        t.index = n;
      }), this.$nextTick(() => {
        this.redoSplitters(), this.resetPaneSizes({ removedPane: { ...s, index: i } }), this.$emit("pane-remove", {
          removed: s,
          panes: this.panes.map((t) => ({
            min: t.min,
            max: t.max,
            size: t.size
          }))
        });
      });
    },
    resetPaneSizes(e = {}) {
      !e.addedPane && !e.removedPane ? this.initialPanesSizing() : this.panes.some((i) => i.givenSize !== null || i.min || i.max < 100) ? this.equalizeAfterAddOrRemove(e) : this.equalize(), this.ready && this.$emit(
        "resized",
        this.panes.map((i) => ({
          min: i.min,
          max: i.max,
          size: i.size
        }))
      );
    },
    equalize() {
      const e = 100 / this.panesCount;
      let i = 0;
      const s = [], t = [];
      this.panes.forEach((n) => {
        n.size = Math.max(Math.min(e, n.max), n.min), i -= n.size, n.size >= n.max && s.push(n.id), n.size <= n.min && t.push(n.id);
      }), i > 0.1 && this.readjustSizes(i, s, t);
    },
    initialPanesSizing() {
      100 / this.panesCount;
      let e = 100;
      const i = [], s = [];
      let t = 0;
      this.panes.forEach((a) => {
        e -= a.size, a.size !== null && t++, a.size >= a.max && i.push(a.id), a.size <= a.min && s.push(a.id);
      });
      let n = 100;
      e > 0.1 && (this.panes.forEach((a) => {
        a.size === null && (a.size = Math.max(Math.min(e / (this.panesCount - t), a.max), a.min)), n -= a.size;
      }), n > 0.1 && this.readjustSizes(e, i, s));
    },
    equalizeAfterAddOrRemove({ addedPane: e, removedPane: i } = {}) {
      let s = 100 / this.panesCount, t = 0;
      const n = [], a = [];
      e && e.givenSize !== null && (s = (100 - e.givenSize) / (this.panesCount - 1)), this.panes.forEach((o) => {
        t -= o.size, o.size >= o.max && n.push(o.id), o.size <= o.min && a.push(o.id);
      }), !(Math.abs(t) < 0.1) && (this.panes.forEach((o) => {
        e && e.givenSize !== null && e.id === o.id || (o.size = Math.max(Math.min(s, o.max), o.min)), t -= o.size, o.size >= o.max && n.push(o.id), o.size <= o.min && a.push(o.id);
      }), t > 0.1 && this.readjustSizes(t, n, a));
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
    readjustSizes(e, i, s) {
      let t;
      e > 0 ? t = e / (this.panesCount - i.length) : t = e / (this.panesCount - s.length), this.panes.forEach((n, a) => {
        if (e > 0 && !i.includes(n.id)) {
          const o = Math.max(Math.min(n.size + t, n.max), n.min), l = o - n.size;
          e -= l, n.size = o;
        } else if (!s.includes(n.id)) {
          const o = Math.max(Math.min(n.size + t, n.max), n.min), l = o - n.size;
          e -= l, n.size = o;
        }
        n.update({
          [this.horizontal ? "height" : "width"]: `${this.indexedPanes[n.id].size}%`
        });
      }), Math.abs(e) > 0.1 && this.$nextTick(() => {
        this.ready && console.warn("Splitpanes: Could not resize panes correctly due to their constraints.");
      });
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
  render(e) {
    return e(
      "div",
      {
        ref: "container",
        class: [
          "splitpanes",
          `splitpanes--${this.horizontal ? "horizontal" : "vertical"}`,
          {
            "splitpanes--dragging": this.touch.dragging
          }
        ]
      },
      this.$slots.default
    );
  }
}, S = null, v = null;
var P = /* @__PURE__ */ m(
  z,
  S,
  v,
  !1,
  null,
  null,
  null,
  null
);
const C = P.exports, g = {
  name: "Pane",
  inject: ["requestUpdate", "onPaneAdd", "onPaneRemove", "onPaneClick"],
  props: {
    size: { type: [Number, String], default: null },
    prevSize: { type: [Number, String], default: null },
    minSize: { type: [Number, String], default: 0 },
    maxSize: { type: [Number, String], default: 100 },
    foldToLeft: { type: Boolean, default: !1 },
    foldToRight: { type: Boolean, default: !1 }
  },
  data: () => ({
    style: {}
  }),
  computed: {
    sizeNumber() {
      return this.size || this.size === 0 ? parseFloat(this.size) : null;
    },
    minSizeNumber() {
      return parseFloat(this.minSize);
    },
    maxSizeNumber() {
      return parseFloat(this.maxSize);
    }
  },
  watch: {
    sizeNumber(e) {
      this.requestUpdate({ target: this, size: e });
    },
    minSizeNumber(e) {
      this.requestUpdate({ target: this, min: e });
    },
    maxSizeNumber(e) {
      this.requestUpdate({ target: this, max: e });
    }
  },
  mounted() {
    this.onPaneAdd(this);
  },
  beforeDestroy() {
    this.onPaneRemove(this);
  },
  methods: {
    // Called from the splitpanes component.
    update(e) {
      this.style = e;
    }
  }
};
var _ = function() {
  var i = this, s = i._self._c;
  return s("div", { staticClass: "splitpanes__pane", style: i.style, on: { click: function(t) {
    return i.onPaneClick(t, i._uid);
  } } }, [i._t("default")], 2);
}, x = [], M = /* @__PURE__ */ m(
  g,
  _,
  x,
  !1,
  null,
  null,
  null,
  null
);
const R = M.exports;
export {
  R as Pane,
  C as Splitpanes
};
