import { fabric } from 'fabric';
import { StructureCanvasProps } from '../../../types/note';
import PageManager from '../manager';

const defaultLayerOptions: fabric.IRectOptions = {
    lockRotation: true,
    fill: '#fff',
    stroke: '#000',
    strokeWidth: 1,
    hasRotatingPoint: false,
};
const defaultImageOptions: fabric.IObjectOptions = {
    // イベントに反応させない
    selectable: false,
    evented: false,
};

class StructureRect {
    private manager: PageManager;
    private data: StructureCanvasProps;
    private layer: fabric.Rect;
    private image?: fabric.Object;

    constructor(manager: PageManager, props: StructureCanvasProps) {
        this.manager = manager;
        this.data = props;

        // レイヤーの作成
        this.layer = this.createLayer();
        this.manager.canvas.add(this.layer);

        // イメージの読み込み
        this.loadImage();

        // イベントの割当
        this.attachEvents();
    }

    // --- public methods ---

    /**
     * 削除処理
     */
    public remove(): void {
        this.manager.canvas.remove(this.layer);
        if (this.image) {
            this.manager.canvas.remove(this.image);
        }
    }

    // --- private methods ---

    private createLayer(): fabric.Rect {
        const rect = new fabric.Rect({
            top: this.data.y,
            left: this.data.x,
            height: this.data.height,
            width: this.data.width,
            ...defaultLayerOptions,
        });
        rect.setControlsVisibility({
            bl: true,
            br: true,
            mb: true,
            ml: true,
            mr: true,
            mt: true,
            tl: true,
            tr: true,
            mtr: false,
        });

        return rect;
    }

    private loadImage(): void {
        if (this.image) {
            this.manager.canvas.remove(this.image);
            this.image = undefined;
        }

        if (this.data.image) {
            fabric.loadSVGFromString(this.data.image, (objects, options) => {
                this.image = fabric.util.groupSVGElements(objects, options);
                // プロパティ設定
                this.image.setOptions({ ...defaultImageOptions });

                // キャンバスに追加
                this.manager.canvas.add(this.image);
                // レイヤーを透明にする
                this.layer.opacity = 0;
                // レイヤーを最前面に持ってくる
                this.layer.bringToFront();
            });
        }
    }

    // --- events ---

    /**
     * イベントの割当
     */
    private attachEvents() {
        this.layer.on('selected', this.onSelected.bind(this));
        this.layer.on('deselected', this.onDeselected.bind(this));
    }

    private onSelected(event: fabric.IEvent<Event>): void {
        const coords = this.layer.calcCoords();
        this.manager.openCanvasNavigation(this.data, coords);
    }

    private onDeselected(event: fabric.IEvent<Event>): void {
        this.manager.closeCanvasNavigation();
    }
}

export default StructureRect;
