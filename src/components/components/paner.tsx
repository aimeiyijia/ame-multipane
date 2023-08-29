import { Vue, Component, Prop, Emit, Watch } from 'vue-property-decorator'
import { VNode, CreateElement } from 'vue'
@Component({
  name: 'MultipanePane'
})
export default class extends Vue {
  @Prop({ default: () => ({}) }) private readonly panerStyle!: object

  @Watch('panerStyle')
  panerStyleChange() {
    const resizeEvent = new Event('resize')
    window.dispatchEvent(resizeEvent)
  }
  render(h: CreateElement): VNode {
    const style: any = this.panerStyle
    return (
      <div class="multipane-paner" style={style}>
        {this.$scopedSlots.default && this.$scopedSlots.default(0)}
      </div>
    )
  }
}
