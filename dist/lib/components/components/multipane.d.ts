import { Vue } from 'vue-property-decorator';
import { VNode, CreateElement } from 'vue';
import '../styles/index.scss';
export default class extends Vue {
    private readonly layout;
    private readonly resizerWidth;
    isResizing: boolean;
    get classnames(): string[];
    get cursor(): "" | "col-resize" | "row-resize";
    get userSelect(): "" | "none";
    setResizeListener(): void;
    setElId(): void;
    getChildPanerElements(el: HTMLElement): HTMLElement[];
    initLayout(resize: boolean): void;
    onMouseDown(e: MouseEvent): void;
    mounted(): void;
    beforeDestory(): void;
    render(h: CreateElement): VNode;
}
