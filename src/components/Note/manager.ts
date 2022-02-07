import { fabric } from 'fabric';
import { v4 as uuid } from 'uuid';
import { Point, ShapeCoordinates, ShapePosition } from '../../types/common';
import {
    defaultCanvasProps,
    defaultDrawSettings,
    DrawSettings,
    NoteMode,
    PageProps,
    PageSize,
    StructureCanvasProps,
    StructureCanvasState,
} from '../../types/note';
import { equalPoints } from '../../utils/coordinates';
import { debug } from '../../utils/logger';
import { clone, getPointerPosition } from '../Canvas/util';
import StructureRect from './shape/StructureRect';

interface Parameters extends PageProps {
    showCanvasNavigation: (props: StructureCanvasState) => void;
    closeCanvasNavigation: VoidFunction;
}

/**
 * 背景のグリッド線の設定
 */
const defaultGridLineProps: fabric.ILineOptions = {
    stroke: '#eee',
    strokeWidth: 1,
    // イベントに反応させない
    evented: false,
    hasControls: false,
    selectable: false,
    // 出力対象外
    excludeFromExport: true,
    // 消しゴムで消えないようにする
    erasable: false,
    data: {
        type: 'background',
        excludeExport: true,
    },
};

class PageManager {
    public canvas: fabric.Canvas;
    private _mode: NoteMode = 'edit';
    private _readonly = false;

    /**
     * ページサイズ
     */
    private pageWidth = 0;
    /**
     * ページサイズ
     */
    private pageHeight = 0;

    /**
     * 背景グリッド線の感覚
     */
    private gridSize = 25;

    /**
     * 描画設定
     */
    private _settings: DrawSettings = defaultDrawSettings;

    /**
     * パンの可否
     */
    private enablePan = true;
    /**
     * ドラッグ中フラグ
     */
    private dragging = false;
    /**
     * ドラッグ時のポインタ位置
     */
    private lastPos: ShapePosition = { x: 0, y: 0 };

    /**
     * ズーム開始時のscale
     */
    private zoomStartScale = 1;

    /**
     * 構造データ
     */
    private structures: Record<string, StructureRect> = {};
    /**
     * 選択中の構造データキャンバス
     */
    public selectedCanvasId: string | undefined;

    /**
     * 構造データのヘッダーメニュー表示メソッド
     */
    private showCanvasNavigation: (props: StructureCanvasState) => void;
    /**
     * 構造データのヘッダーメニューを閉じるメソッド
     */
    public closeCanvasNavigation: VoidFunction;

    constructor(
        canvasDom: HTMLCanvasElement,
        {
            size,
            zoom,
            viewport,
            drawData,
            structures,
            showCanvasNavigation,
            closeCanvasNavigation,
        }: Parameters
    ) {
        debug('::: initialize PageManager :::');
        this.canvas = new fabric.Canvas(canvasDom, {
            selection: true,
            isDrawingMode: false,
            stopContextMenu: true,
        });

        this.canvas.setZoom(zoom);
        this.canvas.setViewportTransform(viewport);

        this.readonly = false;
        this.mode = 'select';
        const pageSize = PageSize[size];
        this.pageHeight = pageSize.height;
        this.pageWidth = pageSize.width;
        this.gridSize = 25; // ひとまず固定で指定
        this.showCanvasNavigation = showCanvasNavigation;
        this.closeCanvasNavigation = closeCanvasNavigation;

        // 背景のグリッド線を描画する
        this.drawBackgroundGrid();

        if (drawData) {
            // 描画データが渡された場合は表示処理を行う
            this.canvas.loadFromJSON(drawData, this.canvas.renderAll.bind(this.canvas));
        }

        // 構造データの配置
        structures.forEach((structure) => {
            const rect = new StructureRect(this, structure);
            this.structures[structure.id] = rect;
        });

        // イベント割当
        this.attachEvents();
    }

    // --- public properties ---

    public get mode(): NoteMode {
        return this._mode;
    }

    public set mode(value: NoteMode) {
        this._mode = value;
        // モード変更時の処理
        this.canvas.selection = this._mode === 'select';
        this.canvas.isDrawingMode = this._mode === 'edit';
        this.enablePan = this._mode === 'select';
    }

    public get readonly(): boolean {
        return this._readonly;
    }

    public set readonly(value: boolean) {
        this._readonly = value;

        this.canvas.isDrawingMode = value ? false : this._mode === 'edit';
        this.canvas.selection = value ? false : this._mode === 'select';
        // TODO: 読み取り専用時は完全に操作できないようにしたい
    }

    public get drawSettings(): DrawSettings {
        return this._settings;
    }

    public set drawSettings(value: DrawSettings) {
        // ブラシの設定を更新する
        let brush = this.canvas.freeDrawingBrush;
        if (!Boolean(brush) || this._settings.eraser !== value.eraser) {
            // ブラシ未定義 あるいは 鉛筆と消しゴムを切り替えた場合は生成
            if (value.eraser) {
                // 消しゴム
                brush = new fabric.EraserBrush(this.canvas);
            } else {
                // 鉛筆
                brush = new fabric.PencilBrush(this.canvas);
            }
            this.canvas.freeDrawingBrush = brush;
        }

        const { stroke: color, strokeWidth: width } = value;
        brush.color = color;
        brush.width = width;

        this._settings = { ...value };
    }

    /**
     * 現在選択されている構造データを取得する
     */
    public get activeStructure(): StructureCanvasProps {
        if (this.selectedCanvasId) {
            return this.structures[this.selectedCanvasId].getCanvasProps();
        }
        return defaultCanvasProps;
    }

    /**
     * 構造データを更新する
     */
    public set activeStructure(props: StructureCanvasProps) {
        const structure = this.structures[props.id];
        if (structure) {
            // 更新・再描画
            structure.update(props);
        }
    }

    /**
     * 現在選択されているキャンバスを取得する
     */
    public get activeCanvas(): StructureRect | undefined {
        if (this.selectedCanvasId) {
            return this.structures[this.selectedCanvasId];
        }
    }

    // --- public methods ---

    public save(): void {
        // TODO: 描画内容を保存する
    }

    public load(): void {
        // TODO: 描画内容を読み込む
    }

    public clear(): void {
        // TODO: ノートの全クリア
    }

    public undo(): void {
        // TODO: 実装
    }

    public redo(): void {
        // TODO: 実装
    }

    /**
     * 構造データキャンバスのメニューを表示する
     * @param canvasProps
     * @param coordinates
     */
    public openCanvasNavigation(
        canvasProps: StructureCanvasProps,
        coordinates: ShapeCoordinates
    ): void {
        // ID を保持
        this.selectedCanvasId = canvasProps.id;

        const params: StructureCanvasState = {
            ...canvasProps,
            coordinates,
        };

        this.showCanvasNavigation(params);
    }

    /**
     * キャンバスのリサイズ
     * @param view
     */
    public resize(view: DOMRect): void {
        const { width, height } = view;
        const zoom = this.canvas.getZoom();
        this.canvas.setWidth(width * zoom);
        this.canvas.setHeight(height * zoom);
    }

    /**
     * 構造データの追加/コピー
     * @param props
     */
    public addCanvas(props?: StructureCanvasProps): void {
        const canvasProps = clone(props ?? defaultCanvasProps);
        canvasProps.id = uuid();

        // 位置が重ならないように調整
        const items = Object.values(this.structures);
        const pos: Point = {
            x: canvasProps.x,
            y: canvasProps.y,
        };
        while (items.some((rect) => equalPoints(pos, rect.coordinates.tl))) {
            // 左上の座標が一致する要素が存在する場合、すこし位置をずらす
            pos.x += 20;
            pos.y += 20;
        }

        canvasProps.x = pos.x;
        canvasProps.y = pos.y;

        const rect = new StructureRect(this, canvasProps);
        this.structures[canvasProps.id] = rect;

        rect.select();
    }

    /**
     * 構造データの削除
     * @param props
     */
    public removeCanvas(props: string | StructureCanvasProps): void {
        let canvasId: string;
        if (typeof props === 'string') {
            canvasId = props;
        } else {
            canvasId = props.id;
        }

        const structure = this.structures[canvasId];
        if (structure) {
            structure.remove();
            delete this.structures[canvasId];
            this.selectedCanvasId = undefined;
        }
    }

    // --- private methods ---

    /**
     * 背景の描画
     */
    private drawBackgroundGrid() {
        const lines: fabric.Line[] = [];

        for (let y = 0; y <= this.pageHeight; y += this.gridSize) {
            const hl = new fabric.Line([0, y, this.pageWidth, y], { ...defaultGridLineProps });
            lines.push(hl);
        }

        // 最下部
        const h = new fabric.Line([0, this.pageHeight, this.pageWidth, this.pageHeight], {
            ...defaultGridLineProps,
        });
        lines.push(h);

        for (let x = 0; x <= this.pageWidth; x += this.gridSize) {
            const vl = new fabric.Line([x, 0, x, this.pageHeight], { ...defaultGridLineProps });
            lines.push(vl);
        }

        // 右端
        const v = new fabric.Line([this.pageWidth, 0, this.pageWidth, this.pageHeight], {
            ...defaultGridLineProps,
        });
        lines.push(v);

        this.canvas.add(...lines);
    }

    /**
     * viewport の補正
     */
    private fitViewport(diffX?: number, diffY?: number): void {
        const vpt = this.canvas.viewportTransform;
        const zoom = this.canvas.getZoom();
        const canvasWidth = this.canvas.getWidth();
        const canvasHeight = this.canvas.getHeight();
        if (vpt) {
            let px = vpt[4];
            let py = vpt[5];

            // ページ幅がキャンバス幅に収まる
            if (canvasWidth >= this.pageWidth * zoom) {
                px = canvasWidth / 2 - (this.pageWidth * zoom) / 2;
            } else {
                if (typeof diffX === 'number') {
                    px += diffX;
                }

                if (px >= 0) {
                    px = 0;
                } else if (px < canvasWidth - this.pageWidth * zoom) {
                    px = canvasWidth - this.pageWidth * zoom;
                }
            }
            // ページ高がキャンバス高に収まる
            if (canvasHeight >= this.pageHeight * zoom) {
                py = canvasHeight / 2 - (this.pageHeight * zoom) / 2;
            } else {
                if (typeof diffY === 'number') {
                    py += diffY;
                }

                if (py >= 0) {
                    py = 0;
                } else if (py < canvasHeight - this.pageHeight * zoom) {
                    py = canvasHeight - this.pageHeight * zoom;
                }
            }

            vpt[4] = px;
            vpt[5] = py;

            this.canvas.requestRenderAll();
        }
    }

    // --- events ---

    private attachEvents(): void {
        // イベント割当
        this.canvas.on('mouse:down', this.onMouseDown.bind(this));
        this.canvas.on('mouse:move', this.onMouseMove.bind(this));
        this.canvas.on('mouse:up', this.onMouseUp.bind(this));
        this.canvas.on('selection:created', this.onSelect.bind(this));
        this.canvas.on('selection:updated', this.onSelect.bind(this));
        this.canvas.on('selection:cleared', this.onDeselect.bind(this));
        this.canvas.on('object:added', this.onCreateObject.bind(this));
        this.canvas.on('touch:gesture', this.onTouchGesture.bind(this));
        this.canvas.on('mouse:wheel', this.onMouseWheel.bind(this));
    }

    private onSelect(): void {
        this.enablePan = false;
    }

    private onDeselect(): void {
        this.enablePan = this.mode === 'select';
        // キャンバスが選択されている場合
        if (this.selectedCanvasId) {
            // キャンバスのヘッダーメニューを閉じる
            this.closeCanvasNavigation();
            this.selectedCanvasId = undefined;
        }
    }

    /**
     * ピンチイン・ピンチアウト
     * @param event
     */
    private onTouchGesture(event: fabric.IGestureEvent<Event>): void {
        if (!this.readonly && event.e.type.indexOf('touch') === 0) {
            const { touches } = event.e as TouchEvent;
            if (touches && touches.length === 2 && event.self) {
                const point = new fabric.Point(event.self.x, event.self.y);
                if (event.self.state === 'start') {
                    // イベント開始時の scale を保持
                    this.zoomStartScale = this.canvas.getZoom();
                }
                const delta = this.zoomStartScale * event.self.scale;
                this.canvas.zoomToPoint(point, delta);

                this.fitViewport();
            }
        }
    }

    /**
     * マウスホイールによるズームイン・ズームアウト
     * @param event
     */
    private onMouseWheel(event: fabric.IEvent<Event>): void {
        if (!this.readonly && event.e.type.indexOf('wheel') === 0 && event.pointer) {
            const evt = event.e as WheelEvent;
            const { deltaY } = evt;
            let zoom = this.canvas.getZoom();
            zoom *= 0.999 ** deltaY;

            const point = event.pointer;
            this.canvas.zoomToPoint(point, zoom);

            evt.preventDefault();
            evt.stopPropagation();

            this.fitViewport();
        }
    }

    private onMouseDown(event: fabric.IEvent<Event>): void {
        if (this.enablePan) {
            // ポインタ位置
            const { clientX: x, clientY: y } = getPointerPosition(event);
            // ドラッグ開始
            this.canvas.selection = false; // 選択範囲の矩形を出さない
            this.dragging = true;
            this.lastPos = { x, y };
        }
    }

    private onMouseMove(event: fabric.IEvent<Event>): void {
        if (this.dragging) {
            // ポインタ位置
            const { clientX: x, clientY: y } = getPointerPosition(event);

            const diffX = x - this.lastPos.x;
            const diffY = y - this.lastPos.y;
            this.fitViewport(diffX, diffY);

            this.lastPos = { x, y };
        }
    }

    private onMouseUp(): void {
        if (this.dragging) {
            const vpt = this.canvas.viewportTransform;
            if (vpt) {
                this.canvas.setViewportTransform(vpt);
            }
        }

        // ドラッグ終了
        this.dragging = false;
        // 複数選択を可能にする
        this.canvas.selection = this.mode === 'select';
    }

    /**
     * 要素が追加されたとき
     * @param event
     */
    private onCreateObject(event: fabric.IEvent<Event>): void {
        // TODO: UNDO/REDO のための履歴管理
    }

    // --- dispose ---

    /**
     * 保持しているデータを破棄する
     */
    public dispose(): void {
        debug('::: dispose PageManager :::');
        this.canvas.clear();
        this.canvas.dispose();
    }
}

export default PageManager;
