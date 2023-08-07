import { Vue, Component, Prop, Emit } from 'vue-property-decorator'
import { VNode, CreateElement } from 'vue'
import '../styles/index.scss'
const LAYOUT_HORIZONTAL = 'horizontal'
const LAYOUT_VERTICAL = 'vertical'
@Component({
  name: 'Multipane'
})
export default class extends Vue {
  @Prop({ default: LAYOUT_VERTICAL }) private readonly layout!: string

  isResizing = false

  get classnames() {
    return [
      'multipane',
      'layout-' + this.layout.slice(0, 1),
      this.isResizing ? 'is-resizing' : ''
    ]
  }
  get cursor() {
    return this.isResizing
      ? this.layout == LAYOUT_VERTICAL
        ? 'col-resize'
        : 'row-resize'
      : ''
  }
  get userSelect() {
    return this.isResizing ? 'none' : ''
  }

  getChildPanerElements(el: HTMLElement) {
    let panerEls: HTMLElement[] = []
    let childs = el.children
    for (const key in childs) {
      if (Object.prototype.hasOwnProperty.call(childs, key)) {
        const element = childs[key] as HTMLElement
        if (element.classList.contains('multipane-paner')) {
          panerEls.push(element)
        }
      }
    }
    console.log(panerEls, 'panerEls')
    return panerEls
  }

  initLayout() {
    const panerEls = document.querySelectorAll('.multipane-paner')
    for (const key in panerEls) {
      if (Object.prototype.hasOwnProperty.call(panerEls, key)) {
        const element = panerEls[key] as HTMLElement

        let resizer = element.previousElementSibling as HTMLElement
        console.log(element, 'element')
        if (resizer) {
          const resizerWidth = resizer.offsetWidth
          let prePane = resizer.previousElementSibling as HTMLElement
          prePane.style.width = `calc(${prePane.style.width} - 5px)`
          const { left, width } = prePane.getBoundingClientRect()
          element.style.width = `calc(${element.style.width} - 5px)`
          element.style.left = left + width + 10 + 'px'
        }
      }
    }

    const resizerEls = document.querySelectorAll('.multipane-resizer')
    for (const key in resizerEls) {
      if (Object.prototype.hasOwnProperty.call(resizerEls, key)) {
        const element = resizerEls[key] as HTMLElement
        let prePane = element.previousElementSibling as HTMLElement
        const { left, width } = prePane.getBoundingClientRect()
        element.style.left = left + width + 'px'
      }
    }
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
      resizer.classList.contains('multipane-resizer')
    ) {
      let self = this
      let { $el: container, layout } = self

      this.getChildPanerElements(container as HTMLElement)

      let prePane = resizer.previousElementSibling as HTMLElement
      let nextPane = resizer.nextElementSibling as HTMLElement

      let { offsetWidth: prePaneWidth, offsetHeight: prePaneHeight } = prePane
      let { offsetWidth: nextPaneWidth, offsetHeight: nextPaneHeight } =
        nextPane

      let prePaneUsePercentage = !!(prePane.style.width + '').match('%')
      let nextPaneUsePercentage = !!(nextPane.style.width + '').match('%')

      const { addEventListener, removeEventListener } = window

      const resize = (initialSize: number = 0, offset = 0): any => {
        // 水平
        if (layout == LAYOUT_VERTICAL) {
          let containerWidth = container.clientWidth
          let initPrePaneWidth = prePaneWidth + offset
          let initNextPaneWidth = nextPaneWidth - offset

          prePane.style.width = prePaneUsePercentage
            ? (initPrePaneWidth / containerWidth) * 100 + '%'
            : initPrePaneWidth - 5 + 'px'

          const { left, width } = prePane.getBoundingClientRect()
          resizer.style.left = left + width + 'px'

          nextPane.style.width = nextPaneUsePercentage
            ? (initNextPaneWidth / containerWidth) * 100 + '%'
            : initNextPaneWidth - 5 + 'px'

          nextPane.style.left = left + 10 + width + 'px'
        }
        // 垂直
        // if (layout == LAYOUT_HORIZONTAL) {
        //   let containerHeight = container.clientHeight
        //   let paneHeight = initialSize + offset

        //   return (prePane.style.height = prePaneUsePercentage
        //     ? (paneHeight / containerHeight) * 100 + '%'
        //     : paneHeight + 'px')
        // }
      }

      // This adds is-resizing class to container
      self.isResizing = true

      // Resize once to get current computed size
      let size = resize()

      // Trigger paneResizeStart event
      self.$emit('paneResizeStart', prePane, resizer, size)

      const onMouseMove = ({ pageX, pageY }: MouseEvent) => {
        size =
          layout == LAYOUT_VERTICAL
            ? resize(prePaneWidth, pageX - initialPageX)
            : resize(prePaneHeight, pageY - initialPageY)

        self.$emit('paneResize', prePane, resizer, nextPane, size)
      }

      const onMouseUp = () => {
        // Run resize one more time to set computed width/height.
        // size = layout == LAYOUT_VERTICAL ? resize() : resize()

        // This removes is-resizing class to container
        self.isResizing = false

        removeEventListener('mousemove', onMouseMove)
        removeEventListener('mouseup', onMouseUp)

        self.$emit('paneResizeStop', prePane, resizer, nextPane, size)
      }

      addEventListener('mousemove', onMouseMove)
      addEventListener('mouseup', onMouseUp)
    }
  }

  mounted() {
    this.$nextTick(() => {
      this.initLayout()
    })
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
