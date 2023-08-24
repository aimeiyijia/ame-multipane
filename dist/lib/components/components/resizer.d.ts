import { Vue } from 'vue-property-decorator';
import { VNode, CreateElement } from 'vue';
export default class extends Vue {
    private readonly opera;
    originStyle: {
        width: number;
        height: number;
    };
    leftIcon: any;
    rightIcon: any;
    direction: string;
    onLeftClick(): void;
    onRightClick(): void;
    render(h: CreateElement): VNode;
}
