import { Vue, Component, Prop, Emit } from 'vue-property-decorator'
import { VNode, CreateElement } from 'vue'
import { generateUUID } from '../utils/uuid'
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

  setResizeListener() {
    window.addEventListener('resize', () => this.initLayout(true))
  }

  setElId() {
    const id = 'multipane' + generateUUID()
    this.$el.id = id
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

  initLayout(resize: boolean) {
    const el = this.$el
    // 先将整体的布局完成（确定paner元素的位置）
    const panerEls = document.querySelectorAll(`#${el.id} > .multipane-paner`)
    for (const key in panerEls) {
      if (Object.prototype.hasOwnProperty.call(panerEls, key)) {
        const element = panerEls[key] as HTMLElement
        // 是否水平
        let isV = true
        if (element.parentElement?.classList.contains('layout-h')) {
          isV = false
        }
        let leftResizer = element.previousElementSibling as HTMLElement
        let rightResizer = element.nextElementSibling as HTMLElement
        if (!resize) {
          // 两条分割线
          if (leftResizer && rightResizer) {
            if (isV) {
              element.style.width = `calc(${element.style.width} - 10px)`
            } else {
              element.style.height = `calc(${element.style.height} - 10px)`
            }
          } else {
            if (isV) {
              element.style.width = `calc(${element.style.width} - 5px)`
            } else {
              element.style.height = `calc(${element.style.height} - 5px)`
            }
          }
        }

        if (leftResizer) {
          let prePane = leftResizer.previousElementSibling as HTMLElement
          if (isV) {
            const { left, width } = prePane.getBoundingClientRect()
            element.style.left = left + width + 10 + 'px'
          } else {
            const { top, height } = prePane.getBoundingClientRect()
            element.style.top = top + height + 10 + 'px'
          }
        }
      }
    }

    // 确定resizer与paner的位置
    const resizerEls = document.querySelectorAll(
      `#${el.id} > .multipane-resizer`
    )
    for (const key in resizerEls) {
      if (Object.prototype.hasOwnProperty.call(resizerEls, key)) {
        const element = resizerEls[key] as HTMLElement
        let isV = true
        if (element.parentElement?.classList.contains('layout-h')) {
          isV = false
        }
        let prePane = element.previousElementSibling as HTMLElement
        let nextPane = element.nextElementSibling as HTMLElement
        // prePane.style.width = `calc(${prePane.style.width} - 5px)`
        // nextPane.style.width = `calc(${nextPane.style.width} - 5px)`
        // if (prePane && !nextPane) {
        //   console.log('只有左paner的分割线')
        // }
        // if (prePane && nextPane) {
        //   console.log('中间的分割线')
        // }
        // if (!prePane && nextPane) {
        //   console.log('只有右paner的分割线')
        // }

        if (isV) {
          const { left, width } = prePane.getBoundingClientRect()
          element.style.left = left + width + 'px'
        } else {
          const { top, height } = prePane.getBoundingClientRect()
          console.log(prePane.offsetHeight)
          element.style.top = top + height + 'px'
        }
      }
    }
  }

  onMouseDown(e: MouseEvent) {
    const { target: resizer, pageX: initialPageX, pageY: initialPageY } = e
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

      let prePaneWidthUsePercentage = !!(prePane.style.width + '').match('%')
      let prePaneHeightUsePercentage = !!(prePane.style.height + '').match('%')
      let nextPaneWidthUsePercentage = !!(nextPane.style.width + '').match('%')
      let nextPaneHeightUsePercentage = !!(nextPane.style.height + '').match(
        '%'
      )

      console.log(resizer, '触发元素')

      const resize = (offset = 0): any => {
        // 水平
        if (layout == LAYOUT_VERTICAL) {
          let containerWidth = container.clientWidth
          let initPrePaneWidth = prePaneWidth + offset
          let initNextPaneWidth = nextPaneWidth - offset

          prePane.style.width = prePaneWidthUsePercentage
            ? (initPrePaneWidth / containerWidth) * 100 + '%'
            : initPrePaneWidth + 'px'

          const { left, width } = prePane.getBoundingClientRect()
          resizer.style.left = left + width + 'px'

          nextPane.style.width = nextPaneWidthUsePercentage
            ? (initNextPaneWidth / containerWidth) * 100 + '%'
            : initNextPaneWidth + 'px'

          nextPane.style.left = left + 10 + width + 'px'
        }
        // 垂直
        if (layout == LAYOUT_HORIZONTAL) {
          let containerHeight = container.clientHeight
          let initPrePaneHeight = prePaneHeight + offset
          let initNextPaneHeight = nextPaneHeight - offset

          prePane.style.height = prePaneHeightUsePercentage
            ? (initPrePaneHeight / containerHeight) * 100 + '%'
            : initPrePaneHeight + 'px'

          const { top, height } = prePane.getBoundingClientRect()
          resizer.style.top = top + height + 'px'

          nextPane.style.height = nextPaneHeightUsePercentage
            ? (initNextPaneHeight / containerHeight) * 100 + '%'
            : initNextPaneHeight + 'px'

          nextPane.style.top = top + 10 + height + 'px'
        }
      }

      const { addEventListener, removeEventListener } = window

      // This adds is-resizing class to container
      self.isResizing = true

      // Resize once to get current computed size
      let size = resize()

      // Trigger paneResizeStart event
      self.$emit('paneResizeStart', prePane, resizer, size)

      const onMouseMove = (e: MouseEvent) => {
        const { pageX, pageY } = e
        size =
          layout == LAYOUT_VERTICAL
            ? resize(pageX - initialPageX)
            : resize(pageY - initialPageY)

        self.$emit('paneResize', prePane, resizer, nextPane, size)
        e.stopPropagation()
      }

      const onMouseUp = (e: MouseEvent) => {
        const { pageX, pageY } = e
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

      e.stopPropagation()
    }
  }

  mounted() {
    this.setElId()
    this.setResizeListener()
    this.initLayout(false)
  }
  beforeDestory() {
    window.removeEventListener('resize', () => this.initLayout(true))
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
