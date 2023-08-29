import { Vue } from 'vue-property-decorator';
import { VNode, CreateElement } from 'vue';
export default class extends Vue {
    private readonly panerStyle;
    panerStyleChange(): void;
    render(h: CreateElement): VNode;
}
