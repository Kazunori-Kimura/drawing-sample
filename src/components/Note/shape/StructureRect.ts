import { fabric } from 'fabric';
import { isShapeCoordinates, ShapeCoordinates } from '../../../types/common';
import { StructureCanvasProps } from '../../../types/note';
import PageManager from '../manager';

const defaultLayerOptions: fabric.IRectOptions = {
    lockRotation: true,
    fill: '#fff',
    stroke: '#000',
    strokeWidth: 1,
    hasRotatingPoint: false,
    erasable: false,
};
const defaultImageOptions: fabric.IObjectOptions = {
    // イベントに反応させない
    selectable: false,
    evented: false,
    // 消しゴムで消せない
    erasable: false,
};

class StructureRect {
    private manager: PageManager;
    private data: StructureCanvasProps;
    private layer: fabric.Rect;
    private image?: fabric.Object;

    private dragging = false;

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

    // --- public properties ---

    /**
     * 座標を返す
     */
    public get coordinates(): ShapeCoordinates {
        return this.layer.calcCoords(true);
    }

    // --- public methods ---

    public update(): void;
    public update(data: StructureCanvasProps): void;

    /**
     * 更新処理
     * @param data
     */
    public update(data?: StructureCanvasProps): void {
        if (data) {
            this.data = data;
        }

        // キャンバスから除去
        this.remove();

        // レイヤーの作成
        this.layer = this.createLayer();
        this.manager.canvas.add(this.layer);

        // イメージの読み込み
        this.loadImage();

        // イベントの割当
        this.attachEvents();
    }

    /**
     * 削除処理
     */
    public remove(): void {
        this.layer.off(); // イベント割当を全削除
        this.manager.canvas.remove(this.layer);
        if (this.image) {
            this.manager.canvas.remove(this.image);
        }
    }

    public getCanvasProps(): StructureCanvasProps {
        return this.data;
    }

    /**
     * リサイズのコントロールを非表示にする
     */
    public hideControls(): void {
        this.layer.hasControls = false;
        // 強制的に再描画
        this.manager.canvas.renderAll();
    }

    public select(): void {
        this.manager.canvas.setActiveObject(this.layer);
        this.manager.selectedCanvasId = this.data.id;
    }

    // --- private methods ---

    private createLayer(): fabric.Rect {
        const rect = new fabric.Rect({
            top: this.data.y,
            left: this.data.x,
            height: this.data.height,
            width: this.data.width,
            ...defaultLayerOptions,
            name: this.data.id,
            data: {
                type: 'layer',
            },
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
                this.image.setOptions({
                    ...defaultImageOptions,
                    top: this.layer.top,
                    left: this.layer.left,
                });

                // キャンバスに追加
                this.manager.canvas.add(this.image);
                // 節点が一つでも存在すればレイヤーを透明にする
                this.layer.opacity = this.data.data.nodes.length > 0 ? 0 : 1;
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
        // 伸縮
        this.layer.on('scaling', this.onScaling.bind(this));
        this.layer.on('scaled', this.onScaled.bind(this));
        // 移動
        this.layer.on('moving', this.onMoving.bind(this));
        this.layer.on('moved', this.onMoved.bind(this));
    }

    /**
     * 選択されたらナビゲーションを表示する
     * @param event
     */
    private onSelected(event: fabric.IEvent<Event>): void {
        const coords = this.layer.calcCoords();
        this.manager.selectedCanvasId = this.data.id;
        this.manager.openCanvasNavigation(this.data, coords);
    }

    /**
     * 選択が解除されたらナビゲーションを閉じる
     * @param event
     */
    private onDeselected(event: fabric.IEvent<Event>): void {
        // NOTE: ナビゲーションを閉じる処理は PageManager で実施
    }

    private onScaling(event: fabric.IEvent<Event>): void {
        if (!this.dragging) {
            // レイヤーを半透明にする (画像がなければそのまま)
            this.layer.opacity = this.image ? 0.1 : 1;

            this.dragging = true;
        }
    }

    private onScaled(event: fabric.IEvent<Event>): void {
        if (this.dragging) {
            // TODO: ズームの考慮が必要
            const scaleX = this.layer.scaleX ?? 1;
            const scaleY = this.layer.scaleY ?? 1;
            const width = this.data.width * scaleX;
            const height = this.data.height * scaleY;

            // scale をリセット
            this.layer.scaleX = 1;
            this.layer.scaleY = 1;
            this.layer.width = width;
            this.layer.height = height;

            // 構造データを更新
            this.data.width = width;
            this.data.height = height;

            // TODO: 画像を再生成する?

            // 透明度を戻す
            this.layer.opacity = this.image ? 0 : 1;

            // ドラッグ終了
            this.dragging = false;
            // ナビゲーションの更新
            this.onSelected(event);
        }
    }

    private onMoving(event: fabric.IEvent<Event>): void {
        if (!this.dragging) {
            // ナビゲーションを閉じる
            this.manager.closeCanvasNavigation();

            this.dragging = true;
        }

        // レイヤーの位置に画像を移動する
        if (this.image) {
            this.image.top = this.layer.top;
            this.image.left = this.layer.left;
        }
    }

    private onMoved(event: fabric.IEvent<Event>): void {
        if (this.dragging) {
            // ノート上での絶対座標を取得
            const coords = this.layer.calcCoords(true);
            if (isShapeCoordinates(coords)) {
                this.data.x = coords.tl.x;
                this.data.y = coords.tl.y;
            }

            // ナビゲーションを再表示
            this.onSelected(event);

            // ドラッグ終了
            this.dragging = false;
        }
    }
}

export default StructureRect;
