import { Vue, Component, Prop, Emit } from "vue-property-decorator"
import { VNode, CreateElement } from "vue"
@Component({
  name: "MultipanePane"
})
export default class extends Vue {
  render(h: CreateElement): VNode {
    return (
      <div class="multipane-paner">
        {this.$scopedSlots.default && this.$scopedSlots.default(0)}
      </div>
    )
  }
}