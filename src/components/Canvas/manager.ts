import { fabric } from 'fabric';
import { v4 as uuid } from 'uuid';
import { CanvasTool, DOMSize, EventType, ShapePosition } from '../../types/common';
import { StructureCanvasProps } from '../../types/note';
import {
    Beam,
    Force,
    isForce,
    isMoment,
    isNode,
    isTrapezoid,
    Node,
    Structure,
    Trapezoid,
} from '../../types/shape';
import { debug } from '../../utils/logger';
import { createGlobalGuideLine } from './factory';
import { OpenPopupFunction } from './popup/types';
import { BeamShape, ForceShape, NodeShape, TrapezoidShape } from './shape';
import { MomentShape } from './shape/MomentShape';
import { isPathEnd, isPathEvent, isPathStart, isSVGPath } from './types';
import { getPointerPosition, snap, Vector } from './util';

export interface CanvasManagerParameters extends StructureCanvasProps {
    tool: CanvasTool;
    readonly?: boolean;
    snapSize?: number;
    gridSize?: number;
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
    data: {
        type: 'background',
        excludeExport: true,
    },
};

/**
 * 梁要素追加時の色
 */
const StrokeBeam = '#0000ff';
/**
 * 分布荷重追加時の色
 */
const StrokeTrapezoid = '#ff0000';

class CanvasManager {
    public canvas: fabric.Canvas;
    private _tool: CanvasTool = 'pen';
    private _readonly = false;
    public snapSize = 25;
    public gridSize = 25;

    private _props: StructureCanvasProps;
    private _data: Structure;

    /**
     * ポップアップの表示
     */
    private openPopup: OpenPopupFunction;

    /**
     * イベント種類 (mouse | touch)
     */
    private eventType: EventType | undefined;

    /**
     * 要素選択の有無 (要素選択中はパン不可)
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
     * 集中荷重の平均値
     */
    public forceAverage = 0;
    /**
     * 分布荷重の平均値
     */
    public trapezoidAverage = 0;
    /**
     * 節点
     */
    public nodeMap: Record<string, NodeShape> = {};
    /**
     * 梁要素
     */
    public beamMap: Record<string, BeamShape> = {};
    /**
     * 節点に紐づく梁要素
     * key: 節点ID, value: 梁要素の配列
     */
    public nodeBeamMap: Record<string, BeamShape[]> = {};
    /**
     * beamId と force の矢印・ラベルの組み合わせ
     */
    public forceMap: Record<string, ForceShape[]> = {};
    /**
     * beamId と Moment の矢印・ラベルの組み合わせ
     */
    public momentMap: Record<string, MomentShape[]> = {};
    /**
     * beamId と trapezoid の矢印・ラベルの組み合わせ
     */
    public trapezoidMap: Record<string, TrapezoidShape[]> = {};
    /**
     * 全体の寸法線
     */
    public globalGuideLines: fabric.Group[] = [];

    /**
     * 長押しと判定する時間 (ms)
     */
    public static LongpressInterval: Readonly<number> = 1000;

    /**
     * ズーム開始時のscale
     */
    private zoomStartScale = 1;

    private _initialized = false;

    /**
     * 分布荷重を追加する梁要素ID
     * (追加後にクリアすること)
     */
    public currentBeam: string | undefined;

    constructor(
        canvasDom: HTMLCanvasElement,
        params: CanvasManagerParameters,
        open: OpenPopupFunction
    ) {
        debug('::: initialize CanvasManager :::', params);
        const {
            data,
            zoom,
            viewport,
            tool,
            readonly = false,
            snapSize = 25,
            gridSize = 25,
        } = params;

        const { width, height } = canvasDom.getBoundingClientRect();

        // IDなどを確保
        this._props = params;
        this._data = data;

        this.canvas = new fabric.Canvas(canvasDom, {
            selection: true,
            isDrawingMode: false,
            fireRightClick: true, // 右クリックを有効にする
            stopContextMenu: true, // 右クリックメニューを表示しない
        });

        this.canvas.setZoom(zoom);
        if (viewport) {
            this.canvas.setViewportTransform(viewport);
        }
        // キャンバスのサイズを設定
        this.resize({ width, height });

        this.snapSize = snapSize;
        this.gridSize = gridSize;

        this.openPopup = open;

        // 背景の描画
        this.drawBackgroundGrid();
        // 初期化処理
        const { nodes, beams, forces, moments, trapezoids } = data;

        // 平均値
        this.calcForceAverage(forces);
        this.calcTrapezoidAverage(trapezoids);

        // 節点の作成
        nodes.forEach((node) => {
            const shape = new NodeShape(this, node);
            this.nodeMap[node.id] = shape;
        });

        // 梁要素の作成
        beams.forEach((beam) => {
            const shape = new BeamShape(this, beam);
            // 参照を保持する
            this.beamMap[beam.id] = shape;
            if (typeof this.nodeBeamMap[beam.nodeI] === 'undefined') {
                this.nodeBeamMap[beam.nodeI] = [shape];
            } else {
                this.nodeBeamMap[beam.nodeI].push(shape);
            }
            if (typeof this.nodeBeamMap[beam.nodeJ] === 'undefined') {
                this.nodeBeamMap[beam.nodeJ] = [shape];
            } else {
                this.nodeBeamMap[beam.nodeJ].push(shape);
            }
        });

        // 集中荷重の作成
        forces.forEach((force) => {
            const shape = new ForceShape(this, force);
            // 参照を保持する
            if (typeof this.forceMap[force.beam] === 'undefined') {
                this.forceMap[force.beam] = [shape];
            } else {
                this.forceMap[force.beam].push(shape);
            }
        });

        // モーメント荷重の作成
        moments.forEach((moment) => {
            const shape = new MomentShape(this, moment);
            // 参照を保持する
            if (typeof this.momentMap[moment.beam] === 'undefined') {
                this.momentMap[moment.beam] = [shape];
            } else {
                this.momentMap[moment.beam].push(shape);
            }
        });

        // 分布荷重の作成
        trapezoids.forEach((trapezoid) => {
            const shape = new TrapezoidShape(this, trapezoid);
            // 参照を保持する
            if (typeof this.trapezoidMap[trapezoid.beam] === 'undefined') {
                this.trapezoidMap[trapezoid.beam] = [shape];
            } else {
                this.trapezoidMap[trapezoid.beam].push(shape);
            }
        });

        // 寸法線の作成
        this.updateGlobalGuidelines();

        // キャンバスイベント設定
        this.attachEvent();

        this.tool = tool;
        this.readonly = readonly;

        this.canvas.renderAll();
        // 初期化完了
        this._initialized = true;
    } // end constructor

    // --- properties ---

    get tool(): CanvasTool {
        return this._tool;
    }

    /**
     * ツール選択に応じたモードの変更
     * @param value
     */
    set tool(value: CanvasTool) {
        this._tool = value;

        // 選択を解除する
        this.canvas.discardActiveObject();

        // キャンバスの設定
        if (value === 'select' || value === 'force' || value === 'delete') {
            this.canvas.selection = value === 'select';
        } else {
            // pen, trapezoid
            this.canvas.selection = false;
            // ブラシの生成・更新
            this.setBrush();
        }

        // オブジェクトの設定
        this.setSelectableShapes();
    }

    get readonly(): boolean {
        return this._readonly;
    }

    set readonly(value: boolean) {
        this._readonly = value;
        // 各オブジェクトの設定変更
        this.setSelectableShapes();
    }

    get initialized(): boolean {
        return this._initialized;
    }

    // --- public methods ---

    /**
     * canvas のリサイズ
     * @param size
     */
    public resize(size: DOMSize): void {
        const { width, height } = size;
        this.canvas.setWidth(width);
        this.canvas.setHeight(height);
    }

    /**
     * 保持しているデータを整形して返す
     * @returns
     */
    public toCanvasProps(): StructureCanvasProps {
        const nodes = Object.values(this.nodeMap).map(({ data }) => data);
        const beams = Object.values(this.beamMap).map(({ data }) => data);
        const forces = Object.values(this.forceMap).flatMap((shapes) =>
            shapes.map(({ data }) => data)
        );
        const moments = Object.values(this.momentMap).flatMap((shapes) =>
            shapes.map(({ data }) => data)
        );
        const trapezoids = Object.values(this.trapezoidMap).flatMap((shapes) =>
            shapes.map(({ data }) => data)
        );

        // 現在表示されている内容を SVG にする
        const image = this.canvas.toSVG({ suppressPreamble: true });

        // viewport, zoom
        const viewport = this.canvas.viewportTransform ?? this._props.viewport;
        const zoom = this.canvas.getZoom();

        const data: StructureCanvasProps = {
            ...this._props,
            data: {
                ...this._data,
                nodes,
                beams,
                forces,
                moments,
                trapezoids,
            },
            image,
            zoom,
            viewport,
        };

        return data;
    }

    /**
     * ポップアップの表示
     * @param event
     * @param shape
     */
    public openNodeDialog(event: fabric.IEvent<Event>, shape: NodeShape): void {
        // ポインタの位置を取得する
        const point = getPointerPosition(event);
        if (point) {
            const { x: left, y: top } = point;
            // ダイアログを表示
            this.openPopup(
                'nodes',
                { top, left },
                shape.data as unknown as Record<string, unknown>,
                (values: Record<string, unknown>) => {
                    if (isNode(values)) {
                        // 節点を更新
                        shape.update(values);
                    }
                }
            );
        }
    }

    /**
     * ポップアップの表示
     * @param event
     * @param shape
     */
    public openForceDialog(event: fabric.IEvent<Event>, shape: ForceShape): void {
        const point = getPointerPosition(event);
        if (point) {
            const { x: left, y: top } = point;
            // ダイアログを表示
            this.openPopup(
                'forces',
                { top, left },
                shape.data as unknown as Record<string, unknown>,
                (values: Record<string, unknown>) => {
                    if (isForce(values)) {
                        // 集中荷重を更新
                        shape.update(values);
                    }
                }
            );
        }
    }

    /**
     * ポップアップの表示
     * @param event
     * @param shape
     */
    public openTrapezoidDialog(event: fabric.IEvent<Event>, shape: TrapezoidShape): void {
        const point = getPointerPosition(event);
        if (point) {
            const { x: left, y: top } = point;
            // ダイアログを表示
            this.openPopup(
                'trapezoids',
                { top, left },
                shape.data as unknown as Record<string, unknown>,
                (values: Record<string, unknown>) => {
                    if (isTrapezoid(values)) {
                        // 分布荷重を更新
                        shape.update(values);
                    }
                }
            );
        }
    }

    public openMomentDialog(event: fabric.IEvent<Event>, shape: MomentShape): void {
        const point = getPointerPosition(event);
        if (point) {
            const { x: left, y: top } = point;
            // ダイアログを表示
            this.openPopup(
                'moments',
                { top, left },
                shape.data as unknown as Record<string, unknown>,
                (values: Record<string, unknown>) => {
                    if (isMoment(values)) {
                        // モーメント荷重を更新
                        shape.update(values);
                    }
                }
            );
        }
    }

    /**
     * 集中荷重の平均値
     * @param forces
     */
    public calcForceAverage(forces?: Force[]): void {
        let list = forces ?? [];
        if (typeof forces === 'undefined') {
            list = Object.values(this.forceMap).flatMap((shapes) =>
                shapes.map((shape) => shape.data)
            );
        }

        let forceAverage = 0;
        if (list.length > 0) {
            const { force: total } = list.reduce((prev, current) => {
                const item: Force = {
                    ...prev,
                    force: prev.force + current.force,
                };
                return item;
            });
            forceAverage = total / list.length;
        }

        this.forceAverage = forceAverage;
    }

    /**
     * 分布荷重の平均値
     * @param trapezoids
     */
    public calcTrapezoidAverage(trapezoids?: Trapezoid[]): void {
        let list = trapezoids ?? [];
        if (typeof trapezoids === 'undefined') {
            list = Object.values(this.trapezoidMap).flatMap((shapes) =>
                shapes.map((shape) => shape.data)
            );
        }

        let trapezoidAverage = 0;
        if (list.length > 0) {
            const total = list
                .map(({ forceI, forceJ }) => forceI + forceJ)
                .reduce((prev, current) => prev + current);
            trapezoidAverage = total / (list.length * 2);
        }

        this.trapezoidAverage = trapezoidAverage;
    }

    /**
     * 全体の寸法線の更新
     */
    public updateGlobalGuidelines(): void {
        if (this.globalGuideLines.length > 0) {
            // 表示済みの寸法線を削除
            this.canvas.remove(...this.globalGuideLines);
            // 念の為配列を初期化
            this.globalGuideLines.length = 0;
        }

        // 全体の寸法線の作成
        const nodes = Object.values(this.nodeMap).map((shape) => shape.data);
        const lines = createGlobalGuideLine(nodes, this._props.height);

        this.globalGuideLines.push(...lines);
        this.canvas.add(...lines);
    }

    /**
     * 梁要素に紐付かない節点を削除
     */
    public removeUnconnectedNodes(): void {
        Object.entries(this.nodeBeamMap).forEach(([nodeId, beams]) => {
            if (typeof beams === 'undefined' || beams.length === 0) {
                // 節点に紐づく梁要素が存在しない
                const node = this.nodeMap[nodeId];
                if (node) {
                    node.remove();
                }
                delete this.nodeBeamMap[nodeId];
            }
        });
    }

    // --- private methods ---
    /**
     * 背景の描画
     */
    private drawBackgroundGrid() {
        const lines: fabric.Line[] = [];
        const { height, width } = this._props;

        for (let y = 0; y <= height; y += this.gridSize) {
            const hl = new fabric.Line([0, y, width, y], { ...defaultGridLineProps });
            lines.push(hl);
        }

        // 最下部
        const h = new fabric.Line([0, height, width, height], { ...defaultGridLineProps });
        lines.push(h);

        for (let x = 0; x <= width; x += this.gridSize) {
            const vl = new fabric.Line([x, 0, x, height], { ...defaultGridLineProps });
            lines.push(vl);
        }

        // 右端
        const v = new fabric.Line([width, 0, width, height], { ...defaultGridLineProps });
        lines.push(v);

        this.canvas.add(...lines);
    }

    /**
     * 節点の追加
     * @param x
     * @param y
     * @returns
     */
    private addNodeIfNotExists(x: number, y: number): string {
        // 同一座標にすでに節点が存在する場合はその節点を使用
        const entry = Object.entries(this.nodeMap).find(
            ([, node]) => node.data.x === x && node.data.y === y
        );
        if (entry) {
            const [nodeId] = entry;
            return nodeId;
        }

        // 新しい節点を追加
        const nodeId = uuid();
        const node: Node = {
            id: nodeId,
            name: nodeId,
            x,
            y,
        };

        // 節点の作成
        const shape = new NodeShape(this, node);
        this.nodeMap[nodeId] = shape;

        return nodeId;
    }

    /**
     * 梁要素の追加
     * @param nodeI
     * @param nodeJ
     * @returns
     */
    private addBeamIfNotExists(nodeI: string, nodeJ: string): string {
        const nodes = [nodeI, nodeJ];
        // i端, j端を同じくする梁要素が存在する？
        const entry = Object.entries(this.beamMap).find(([, beam]) => {
            return nodes.includes(beam.data.nodeI) && nodes.includes(beam.data.nodeJ);
        });
        if (entry) {
            const [beamId] = entry;
            return beamId;
        }

        const beamId = uuid();
        const beam: Beam = {
            id: beamId,
            name: beamId,
            nodeI,
            nodeJ,
        };

        // 梁要素の作成
        const shape = new BeamShape(this, beam);
        this.beamMap[beamId] = shape;
        nodes.forEach((node) => {
            if (typeof this.nodeBeamMap[node] === 'undefined') {
                this.nodeBeamMap[node] = [];
            }
            this.nodeBeamMap[node].push(shape);
        });

        return beamId;
    }

    /**
     * ツール選択に応じたオブジェクトの設定
     */
    private setSelectableShapes(): void {
        const editable = !this.readonly;

        // 節点
        const selectableNode = this.tool === 'select';
        const eventedNode = editable && ['select', 'delete'].includes(this.tool);
        // 梁要素
        const selectableBeam = this.tool === 'select';
        const eventedBeam = editable;
        // 集中荷重
        const selectableForce = ['select', 'force'].includes(this.tool);
        const eventedForce = editable && ['select', 'force', 'delete'].includes(this.tool);
        // モーメント荷重
        const selectableMoment = ['select', 'moment'].includes(this.tool);
        const eventedMoment = editable && ['select', 'moment', 'delete'].includes(this.tool);
        // 分布荷重
        const selectableTrapezoid = ['select', 'trapezoid'].includes(this.tool);
        const eventedTrapezoid = editable && ['select', 'trapezoid', 'delete'].includes(this.tool);

        // 節点
        Object.values(this.nodeMap).forEach((shape) => {
            shape.node.selectable = selectableNode;
            shape.node.evented = eventedNode;
        });
        Object.entries(this.beamMap).forEach(([beamId, shape]) => {
            // 梁要素
            shape.beam.selectable = selectableBeam;
            shape.beam.evented = eventedBeam;
            // 集中荷重
            const forces = this.forceMap[beamId];
            if (forces) {
                forces.forEach((shape) => {
                    shape.force.selectable = selectableForce;
                    shape.force.evented = eventedForce;
                });
            }
            // モーメント荷重
            const moments = this.momentMap[beamId];
            if (moments) {
                moments.forEach((shape) => {
                    shape.moment.selectable = selectableMoment;
                    shape.moment.evented = eventedMoment;
                });
            }
            // 分布荷重
            const trapezoids = this.trapezoidMap[beamId];
            if (trapezoids) {
                trapezoids.forEach((shape) => {
                    shape.evented = eventedTrapezoid;
                    shape.selectable = selectableTrapezoid;
                });
            }
        });
    }

    /**
     * 選択ツールに応じたペン設定
     */
    private setBrush(): void {
        let brush = this.canvas.freeDrawingBrush;
        if (!Boolean(brush)) {
            // ブラシ未定義の場合は生成
            brush = new fabric.PencilBrush(this.canvas);
            this.canvas.freeDrawingBrush = brush;
        }

        // ツールに応じた色の設定
        switch (this.tool) {
            case 'pen':
                brush.color = StrokeBeam;
                break;
            case 'trapezoid':
                brush.color = StrokeTrapezoid;
                break;
            default:
                brush.color = '#000'; // とりあえず黒
                break;
        }
        // 線の太さ
        brush.width = 2;
    }

    /**
     * viewport の補正
     */
    private fitViewport(diffX?: number, diffY?: number): void {
        const vpt = this.canvas.viewportTransform;
        const zoom = this.canvas.getZoom();
        const canvasWidth = this.canvas.getWidth();
        const canvasHeight = this.canvas.getHeight();
        const { width: pageWidth, height: pageHeight } = this._props;

        if (vpt) {
            let px = vpt[4];
            let py = vpt[5];

            // ページ幅がキャンバス幅に収まる
            if (canvasWidth >= pageWidth * zoom) {
                px = canvasWidth / 2 - (pageWidth * zoom) / 2;
            } else {
                if (typeof diffX === 'number') {
                    px += diffX;
                }

                if (px >= 0) {
                    px = 0;
                } else if (px < canvasWidth - pageWidth * zoom) {
                    px = canvasWidth - pageWidth * zoom;
                }
            }
            // ページ高がキャンバス高に収まる
            if (canvasHeight >= pageHeight * zoom) {
                py = canvasHeight / 2 - (pageHeight * zoom) / 2;
            } else {
                if (typeof diffY === 'number') {
                    py += diffY;
                }

                if (py >= 0) {
                    py = 0;
                } else if (py < canvasHeight - pageHeight * zoom) {
                    py = canvasHeight - pageHeight * zoom;
                }
            }

            vpt[4] = px;
            vpt[5] = py;

            this.canvas.requestRenderAll();
        }
    }

    // --- events ---

    private attachEvent() {
        this.canvas.on('mouse:down:before', this.onMouseDownBefore.bind(this));
        this.canvas.on('mouse:down', this.onMouseDown.bind(this));
        this.canvas.on('mouse:move', this.onMouseMove.bind(this));
        this.canvas.on('mouse:up', this.onMouseUp.bind(this));
        this.canvas.on('selection:created', this.onSelect.bind(this));
        this.canvas.on('selection:updated', this.onSelect.bind(this));
        this.canvas.on('selection:cleared', this.onDeselect.bind(this));
        this.canvas.on('path:created', this.onCreatePath.bind(this));
        this.canvas.on('object:added', this.onCreateObject.bind(this));
        this.canvas.on('touch:drag', this.onTouchDrag.bind(this));
        this.canvas.on('touch:gesture', this.onTouchGesture.bind(this));
        this.canvas.on('mouse:wheel', this.onMouseWheel.bind(this));
    }

    /**
     * mouse down 前にタッチ本数などを元にフラグをセット
     * @param event
     */
    private onMouseDownBefore(event: fabric.IEvent<Event>): void {
        debug('mouse:down:before', event);

        const clickedShapeType: string = event.target?.data?.type ?? 'canvas';

        if (event.e.type.indexOf('touch') === 0) {
            this.eventType = 'touch';

            const { touches } = event.e as TouchEvent;
            debug('- fingers=', touches.length);

            if (touches.length === 1) {
                if (this.tool === 'pen') {
                    // 梁要素の追加モード
                    this.canvas.isDrawingMode = true;
                } else if (this.tool === 'trapezoid' && clickedShapeType === 'beam') {
                    // 分布荷重の追加モードで梁要素にタッチした場合
                    this.canvas.isDrawingMode = true;
                } else {
                    // 上記以外の場合は描画不可
                    this.canvas.isDrawingMode = false;

                    if (!this.hasSelected && !Boolean(event.target)) {
                        // 要素未選択の場合はパン
                        this.panning = true;
                    }
                }
            } else {
                this.canvas.isDrawingMode = false;
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
                if (this.tool === 'pen') {
                    // 梁要素の追加モード
                    this.canvas.isDrawingMode = true;
                } else if (this.tool === 'trapezoid' && clickedShapeType === 'beam') {
                    // 分布荷重の追加モードで梁要素にタッチした場合
                    this.canvas.isDrawingMode = true;
                } else {
                    // 上記以外の場合は描画不可
                    this.canvas.isDrawingMode = false;

                    if (!this.hasSelected && !Boolean(event.target)) {
                        // 要素未選択の場合はパン
                        this.panning = true;
                    }
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
        }
    }

    private onMouseDown(event: fabric.IEvent<Event>): void {
        // ポインタ位置
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
        if (event.e.type.indexOf('wheel') === 0) {
            const evt = event.e as WheelEvent;

            const { deltaY, offsetX, offsetY } = evt;
            let zoom = this.canvas.getZoom();
            zoom *= 0.999 ** deltaY;

            if (zoom > 20) {
                zoom = 20;
            }
            if (zoom < 0.1) {
                zoom = 0.1;
            }

            const point = new fabric.Point(offsetX, offsetY);
            this.canvas.zoomToPoint(point, zoom);

            evt.preventDefault();
            evt.stopPropagation();

            this.fitViewport();
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
            // ポインタ位置
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
        }

        // 複数選択を可能にする
        this.canvas.selection = this.tool === 'select';
        // 描画フラグをoff
        this.canvas.isDrawingMode = false;
        // ドラッグ中のフラグなどをクリア
        this.panning = false;
        this.pinching = false;
        this.lastPos = undefined;
    }

    // 要素選択
    private onSelect(): void {
        this.hasSelected = true;
    }

    // 要素選択解除
    private onDeselect(): void {
        this.hasSelected = false;
    }

    /**
     * パスが描かれたとき
     * @param event
     * @returns
     */
    private onCreatePath(event: fabric.IEvent<Event>): void {
        if (isPathEvent(event)) {
            const { path } = event.path;
            if (path && isSVGPath(path) && path.length >= 2) {
                // 始点と終点
                const s = path[0];
                const e = path[path.length - 1];
                if (isPathStart(s) && isPathEnd(e)) {
                    let [, ix, iy] = s;
                    let [, jx, jy] = e;

                    if (ix === jx && iy === jy) {
                        // 同一座標の場合は何もしない
                        return;
                    }

                    if (ix > jx || (ix === jx && iy > jy)) {
                        // 始点と終点を入れ替え
                        [ix, jx] = [jx, ix];
                        [iy, jy] = [jy, iy];
                    }

                    if (this.tool === 'pen') {
                        // スナップする
                        [ix, iy] = snap([ix, iy], this.snapSize);
                        [jx, jy] = snap([jx, jy], this.snapSize);

                        // 節点の作成
                        const nodeI = this.addNodeIfNotExists(ix, iy);
                        const nodeJ = this.addNodeIfNotExists(jx, jy);
                        // 梁要素の作成
                        this.addBeamIfNotExists(nodeI, nodeJ);

                        // 全体の寸法線を更新
                        this.updateGlobalGuidelines();
                    } else if (this.tool === 'trapezoid' && this.currentBeam) {
                        // 梁要素を取得
                        const beam = this.beamMap[this.currentBeam];

                        if (beam) {
                            // 始点、終点から i端/j端からの距離比を取得
                            const vs = new Vector(ix, iy);
                            const ve = new Vector(jx, jy);
                            const distanceI = beam.calcRatio(vs);
                            const distanceJ = 1 - beam.calcRatio(ve);
                            // 分布荷重を作成
                            const trapezoidId = uuid();
                            const data: Trapezoid = {
                                id: trapezoidId,
                                name: trapezoidId,
                                beam: beam.data.id,
                                forceI: 10,
                                forceJ: 10,
                                distanceI,
                                distanceJ,
                            };
                            const shape = new TrapezoidShape(this, data);

                            if (typeof this.trapezoidMap[beam.data.id] === 'undefined') {
                                this.trapezoidMap[beam.data.id] = [];
                            }
                            this.trapezoidMap[beam.data.id].push(shape);

                            // 平均値を更新
                            this.calcTrapezoidAverage();
                        }

                        // 分布荷重の追加終了
                        this.canvas.isDrawingMode = false;
                        this.currentBeam = undefined;
                    }
                }
            }
        }
    }

    /**
     * 要素が追加されたとき
     * @param event
     */
    private onCreateObject(event: fabric.IEvent<Event>): void {
        // パスが追加されたら即削除する
        if (event.target?.type === 'path') {
            this.canvas.remove(event.target);
        }
    }

    /**
     * 保持しているデータを破棄する
     */
    public dispose(): void {
        debug('::: dispose CanvasManager :::');
        if (this._initialized) {
            this.canvas.clear();
            this.canvas.dispose();
        }
    }
}

export default CanvasManager;
