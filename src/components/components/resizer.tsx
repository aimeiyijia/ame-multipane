import { Vue, Component, Prop, Emit } from 'vue-property-decorator'
import { VNode, CreateElement } from 'vue'
import EventBus from '../utils/eventBus'
import InlineSvg from 'vue-inline-svg'
@Component({
  name: 'MultipaneResizer',
  components: {
    InlineSvg
  }
})
export default class extends Vue {
  @Prop({ default: '' }) private readonly opera!: string

  originStyle = {
    width: 0,
    height: 0
  }

  leftIcon = require('@/components/icons/icon_left.svg')
  rightIcon = require('@/components/icons/icon_right.svg')

  direction = 'left'

  onLeftClick() {
    const resizer = this.$el
    this.direction = this.direction === 'left' ? 'right' : 'left'
    EventBus.$emit(
      'fold-pane',
      resizer,
      this.direction === 'left' ? 'right' : 'left'
    )
  }
  onRightClick() {
    console.log(this, '向右点击')
  }

  render(h: CreateElement): VNode {
    return (
      <div class="multipane-resizer">
        <div class="multipane-resizer__opera">
          {this.opera === 'left' && (
            <inline-svg
              class="multipane-resizer-expand--left"
              src={this.direction === 'left' ? this.leftIcon : this.rightIcon}
              width="8"
              height="32"
              onClick={this.onLeftClick}
            ></inline-svg>
          )}
          {this.opera === 'right' && (
            <inline-svg
              class="multipane-resizer-expand--right"
              src={require('@/components/icons/icon_right.svg')}
              width="8"
              height="32"
              onClick={this.onRightClick}
            ></inline-svg>
          )}
        </div>

        {this.$scopedSlots.default && this.$scopedSlots.default(0)}
      </div>
    )
  }
}
