import { Vue, Component, Prop, Emit } from "vue-property-decorator"
import { VNode, CreateElement } from "vue"
import "../styles/index.scss"
const LAYOUT_HORIZONTAL = "horizontal"
const LAYOUT_VERTICAL = "vertical"
@Component({
  name: "Multipane"
})
export default class extends Vue {
  @Prop({ default: LAYOUT_VERTICAL }) private readonly layout!: string

  isResizing = false

  get classnames() {
    return [
      "multipane",
      "layout-" + this.layout.slice(0, 1),
      this.isResizing ? "is-resizing" : ""
    ]
  }
  get cursor() {
    return this.isResizing
      ? this.layout == LAYOUT_VERTICAL
        ? "col-resize"
        : "row-resize"
      : ""
  }
  get userSelect() {
    return this.isResizing ? "none" : ""
  }

  onMouseDown({
    target: resizer,
    pageX: initialPageX,
    pageY: initialPageY
  }: MouseEvent) {
    if (
      resizer &&
      resizer instanceof HTMLElement &&
      resizer.classList &&
      resizer.classList.contains("multipane-resizer")
    ) {
      let self = this
      let { $el: container, layout } = self

      let pane = resizer.previousElementSibling as HTMLElement
      if (!pane) return
      let { offsetWidth: initialPaneWidth, offsetHeight: initialPaneHeight } =
        pane

      let usePercentage = !!(pane.style.width + "").match("%")

      const { addEventListener, removeEventListener } = window

      const resize = (initialSize: number = 0, offset = 0): any => {
        if (layout == LAYOUT_VERTICAL) {
          let containerWidth = container.clientWidth
          let paneWidth = initialSize + offset

          return (pane.style.width = usePercentage
            ? (paneWidth / containerWidth) * 100 + "%"
            : paneWidth + "px")
        }

        if (layout == LAYOUT_HORIZONTAL) {
          let containerHeight = container.clientHeight
          let paneHeight = initialSize + offset

          return (pane.style.height = usePercentage
            ? (paneHeight / containerHeight) * 100 + "%"
            : paneHeight + "px")
        }
      }

      // This adds is-resizing class to container
      self.isResizing = true

      // Resize once to get current computed size
      let size = resize(
        layout == LAYOUT_VERTICAL ? initialPaneWidth : initialPaneHeight
      )

      // Trigger paneResizeStart event
      self.$emit("paneResizeStart", pane, resizer, size)

      const onMouseMove = function ({ pageX, pageY }: MouseEvent) {
        size =
          layout == LAYOUT_VERTICAL
            ? resize(initialPaneWidth, pageX - initialPageX)
            : resize(initialPaneHeight, pageY - initialPageY)

        self.$emit("paneResize", pane, resizer, size)
      }

      const onMouseUp = function () {
        // Run resize one more time to set computed width/height.
        size =
          layout == LAYOUT_VERTICAL
            ? resize(pane.clientWidth)
            : resize(pane.clientHeight)

        // This removes is-resizing class to container
        self.isResizing = false

        removeEventListener("mousemove", onMouseMove)
        removeEventListener("mouseup", onMouseUp)

        self.$emit("paneResizeStop", pane, resizer, size)
      }

      addEventListener("mousemove", onMouseMove)
      addEventListener("mouseup", onMouseUp)
    }
  }

  render(h: CreateElement): VNode {
    const style: any = { cursor: this.cursor, userSelect: this.userSelect }
    return (
      <div
        class={this.classnames}
        style={style}
        {...{
          on: {
            mousedown: this.onMouseDown
          }
        }}
      >
        {this.$scopedSlots.default && this.$scopedSlots.default(0)}
      </div>
    )
  }
}
