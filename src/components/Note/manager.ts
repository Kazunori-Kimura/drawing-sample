import { fabric } from 'fabric';
import { v4 as uuid } from 'uuid';
import { EventType, Point, ShapePosition } from '../../types/common';
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
    setCanvasState: (props: StructureCanvasState) => void;
    clearCanvasState: (closingCanvas?: boolean) => void;
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
     * イベント種類 (mouse or touch)
     */
    private eventType: EventType | undefined;

    /**
     * 選択要素の有無（要素選択中はパン不可）
     */
    private hasSelected = false;

    /**
     * ピンチ中フラグ
     */
    private pinching = false;

    /**
     * パン中フラグ
     */
    private panning = false;

    /**
     * ドラッグ時のポインタ位置
     */
    private lastPos: ShapePosition | undefined;

    /**
     * 再描画タイマー
     */
    private forceRenderTimer: NodeJS.Timeout | undefined;

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
     * 構造データの情報を返す
     */
    private setCanvasState: (props: StructureCanvasState) => void;
    /**
     * 構造データの情報をクリアする
     */
    public clearCanvasState: (closingCanvas?: boolean) => void;

    constructor(
        canvasDom: HTMLCanvasElement,
        { size, zoom, viewport, drawData, structures, setCanvasState, clearCanvasState }: Parameters
    ) {
        debug('::: initialize PageManager :::');

        this.canvas = new fabric.Canvas(canvasDom, {
            selection: true,
            isDrawingMode: false,
            fireRightClick: true, // 右クリックを有効にする
            stopContextMenu: true, // 右クリックメニューを表示しない
        });

        this.canvas.setZoom(zoom);
        this.canvas.setViewportTransform(viewport);

        this.readonly = false;
        this.mode = 'select';
        const pageSize = PageSize[size];
        this.pageHeight = pageSize.height;
        this.pageWidth = pageSize.width;
        this.gridSize = 25; // ひとまず固定で指定
        this.setCanvasState = setCanvasState;
        this.clearCanvasState = clearCanvasState;

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
    }

    public get readonly(): boolean {
        return this._readonly;
    }

    public set readonly(value: boolean) {
        this._readonly = value;
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
            // zoom の値を補正する
            const pageZoom = this.canvas.getZoom();
            const state = clone(props);
            state.zoom = state.zoom / pageZoom;
            // 更新・再描画
            structure.update(state);
            // Page.tsx の CanvasState を更新する
            this.updateCanvasState();
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
    public updateCanvasState(canvasId?: string): void {
        if (canvasId) {
            // ID を保持
            this.selectedCanvasId = canvasId;
        }

        if (this.selectedCanvasId) {
            const canvasProps = this.structures[this.selectedCanvasId].getCanvasProps();
            const coordinates = this.structures[this.selectedCanvasId].coordinates;

            // ズーム
            const pageZoom = this.canvas.getZoom();

            const params: StructureCanvasState = {
                ...canvasProps,
                coordinates,
                pageZoom,
            };

            this.setCanvasState(params);
        }
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
        this.canvas.on('mouse:down:before', this.onMouseDownBefore.bind(this));
        this.canvas.on('mouse:move', this.onMouseMove.bind(this));
        this.canvas.on('mouse:up', this.onMouseUp.bind(this));
        this.canvas.on('selection:created', this.onSelect.bind(this));
        this.canvas.on('selection:updated', this.onSelect.bind(this));
        this.canvas.on('selection:cleared', this.onDeselect.bind(this));
        this.canvas.on('object:added', this.onCreateObject.bind(this));
        this.canvas.on('touch:gesture', this.onTouchGesture.bind(this));
        this.canvas.on('mouse:wheel', this.onMouseWheel.bind(this));
        this.canvas.on('touch:drag', this.onTouchDrag.bind(this));
    }

    private onSelect(): void {
        this.hasSelected = true;
    }

    private onDeselect(): void {
        this.hasSelected = false;

        // キャンバスが選択されている場合
        if (this.selectedCanvasId) {
            // キャンバスのヘッダーメニューを閉じる
            this.clearCanvasState(false); // onCloseCanvas は呼ばない
            this.selectedCanvasId = undefined;
        }
    }

    /**
     * mouse down 前にタッチ本数などを元にフラグをセット
     * @param event
     */
    private onMouseDownBefore(event: fabric.IEvent<Event>): void {
        debug('mouse:down:before', event);

        if (event.e.type.indexOf('touch') === 0) {
            this.eventType = 'touch';

            const { touches } = event.e as TouchEvent;
            debug('- fingers=', touches.length);

            if (touches.length === 1) {
                if (this.mode === 'edit') {
                    this.canvas.isDrawingMode = true;
                }
                if (this.mode === 'select' && !this.hasSelected && !Boolean(event.target)) {
                    this.panning = true;
                }
            } else {
                this.canvas.isDrawingMode = false;

                if (this.forceRenderTimer) {
                    clearTimeout(this.forceRenderTimer);
                }
                // 100ms 後に再描画する
                this.forceRenderTimer = setTimeout(() => {
                    console.log('here!');
                    this.canvas.renderAll();
                    this.forceRenderTimer = undefined;
                }, 100);
            }

            if (touches.length === 2) {
                // ピンチ
                this.pinching = true;
            }
            if (touches.length > 2) {
                // 3本指以上でタッチ -> パン
                this.panning = true;
            }
        } else if (event.e.type.indexOf('mouse') === 0) {
            this.eventType = 'mouse';

            const { button } = event.e as MouseEvent;
            if (button === 0) {
                // 左クリック時
                if (this.mode === 'edit') {
                    this.canvas.isDrawingMode = true;
                }
                if (this.mode === 'select' && !this.hasSelected && !Boolean(event.target)) {
                    this.panning = true;
                }
            }
            if (button === 2) {
                // 右クリック時
                this.panning = true;
            }
        }

        if (this.panning) {
            // パンの際は範囲選択の矩形を表示しない
            this.canvas.selection = false;
            // CanvasNavigation を非表示にする
            this.clearCanvasState();
        }
    }

    private onMouseDown(event: fabric.IEvent<Event>): void {
        // ポインタ位置を保持する
        this.lastPos = getPointerPosition(event);
    }

    /**
     * ピンチイン・ピンチアウト
     * @param event
     */
    private onTouchGesture(event: fabric.IGestureEvent<Event>): void {
        if (this.pinching && event.e.type.indexOf('touch') === 0) {
            const { touches } = event.e as TouchEvent;
            if (touches && touches.length === 2 && event.self) {
                if (event.self.state === 'start') {
                    // イベント開始時の scale を保持
                    this.zoomStartScale = this.canvas.getZoom();
                }
                let zoom = this.zoomStartScale * event.self.scale;
                if (zoom > 20) {
                    zoom = 20;
                }
                if (zoom < 0.1) {
                    zoom = 0.1;
                }

                const point = new fabric.Point(event.self.x, event.self.y);
                this.canvas.zoomToPoint(point, zoom);

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

            if (zoom > 20) {
                zoom = 20;
            }
            if (zoom < 0.1) {
                zoom = 0.1;
            }

            const point = event.pointer;
            this.canvas.zoomToPoint(point, zoom);

            evt.preventDefault();
            evt.stopPropagation();

            this.fitViewport();

            // ナビゲーションの更新
            this.updateCanvasState();
        }
    }

    private onTouchDrag(event: fabric.IEvent<Event>): void {
        if (this.eventType === 'touch' && this.panning) {
            const point = getPointerPosition(event);
            if (point && this.lastPos) {
                const { x, y } = point;
                const diffX = x - this.lastPos.x;
                const diffY = y - this.lastPos.y;
                this.fitViewport(diffX, diffY);
                this.lastPos = point;
            }
        }
    }

    private onMouseMove(event: fabric.IEvent<Event>): void {
        if (this.eventType === 'mouse' && this.panning) {
            const point = getPointerPosition(event);
            if (point && this.lastPos) {
                const { x, y } = point;
                const diffX = x - this.lastPos.x;
                const diffY = y - this.lastPos.y;
                this.fitViewport(diffX, diffY);
                this.lastPos = point;
            }
        }
    }

    private onMouseUp(event: fabric.IEvent<Event>): void {
        debug('mouse:up', event);

        if (this.panning || this.pinching) {
            const vpt = this.canvas.viewportTransform;
            if (vpt) {
                this.canvas.setViewportTransform(vpt);
            }

            // CanvasNavigationを再表示
            this.updateCanvasState();
        }

        // selectモード時は複数選択を可能にする
        this.canvas.selection = this.mode === 'select';
        // 描画フラグをoff
        this.canvas.isDrawingMode = false;
        // ドラッグ中のフラグなどをクリア
        this.panning = false;
        this.pinching = false;
        this.lastPos = undefined;
    }

    /**
     * 要素が追加されたとき
     * @param event
     */
    private onCreateObject(event: fabric.IEvent<Event>): void {
        debug('object:added', event);
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
