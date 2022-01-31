import { fabric } from 'fabric';
import { v4 as uuid } from 'uuid';
import { CanvasTool, ShapePosition } from '../../types/common';
import { StructureCanvasProps } from '../../types/note';
import { Beam, Force, isForce, isNode, isTrapezoid, Node, Trapezoid } from '../../types/shape';
import { createGlobalGuideLine } from './factory';
import { OpenPopupFunction } from './popup/types';
import { BeamShape, ForceShape, NodeShape, TrapezoidShape } from './shape';
import { isPathEnd, isPathEvent, isPathStart, isSVGPath } from './types';
import { getPointerPosition, snap } from './util';

export interface CanvasManagerParameters extends StructureCanvasProps {
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

class CanvasManager {
    public canvas: fabric.Canvas;
    private _tool: CanvasTool = 'select';
    private _readonly = false;
    private pageWidth = 0;
    private pageHeight = 0;
    public snapSize = 25;
    public gridSize = 25;

    /**
     * ポップアップの表示
     */
    private openPopup: OpenPopupFunction;

    /**
     * キャンバスのパンの可否
     */
    private enablePan = false;
    /**
     * キャンバスのドラッグ中フラグ
     */
    private isCanvasDragging = false;
    /**
     * ドラッグ時のポインタ位置
     */
    private lastPos: ShapePosition = { x: 0, y: 0 };

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

    private _initialized = false;

    constructor(
        canvasDom: HTMLCanvasElement,
        {
            data,
            zoom,
            viewport,
            width,
            height,
            readonly = false,
            snapSize = 25,
            gridSize = 25,
        }: CanvasManagerParameters,
        open: OpenPopupFunction
    ) {
        this.canvas = new fabric.Canvas(canvasDom, {
            selection: true,
            isDrawingMode: false,
            stopContextMenu: true,
        });

        this.canvas.setZoom(zoom);
        this.canvas.setViewportTransform(viewport);

        this.setTool('select');
        this.pageHeight = height;
        this.pageWidth = width;
        this._readonly = readonly;
        this.snapSize = snapSize;
        this.gridSize = gridSize;

        this.openPopup = open;

        // 背景の描画
        this.drawBackgroundGrid();
        // 初期化処理
        const { nodes, beams, forces, trapezoids } = data;

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

        // 初期化完了
        this._initialized = true;
    }

    get tool(): CanvasTool {
        return this._tool;
    }

    get readonly(): boolean {
        return this._readonly;
    }

    get initialized(): boolean {
        return this._initialized;
    }

    /**
     * ツール選択に応じたモードの変更
     * @param tool
     */
    public setTool(tool: CanvasTool): void {
        this._tool = tool;

        // 選択を解除する
        this.canvas.discardActiveObject();

        // キャンバスの設定
        if (tool === 'select' || tool === 'force' || tool === 'delete') {
            this.canvas.isDrawingMode = false;
            this.canvas.selection = tool === 'select';
            this.enablePan = true;
        } else {
            // pen, trapezoid
            this.canvas.isDrawingMode = true;
            this.canvas.selection = false;
            this.enablePan = false;
        }

        // オブジェクトの設定
        this.setSelectableShapes();
    }

    /**
     * ツール選択に応じたオブジェクトの設定
     */
    private setSelectableShapes(): void {
        // 節点
        const selectableNode = this.tool === 'select';
        const eventedNode = ['select', 'delete'].includes(this.tool);
        // 梁要素
        const selectableBeam = this.tool === 'select';
        const eventedBeam = true; // 梁要素は常にイベントに反応する
        // 集中荷重
        const selectableForce = ['select', 'force'].includes(this.tool);
        const eventedForce = ['select', 'force', 'delete'].includes(this.tool);
        // 分布荷重
        const selectableTrapezoid = ['select', 'trapezoid'].includes(this.tool);
        const eventedTrapezoid = ['select', 'trapezoid', 'delete'].includes(this.tool);

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

    // ポップアップの表示

    public openNodeDialog(event: fabric.IEvent<Event>, shape: NodeShape): void {
        // ポインタの位置を取得する
        const { clientX: left, clientY: top } = getPointerPosition(event);
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

    public openForceDialog(event: fabric.IEvent<Event>, shape: ForceShape): void {
        // ポインタの位置を取得する
        const { clientX: left, clientY: top } = getPointerPosition(event);
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

    public openTrapezoidDialog(event: fabric.IEvent<Event>, shape: TrapezoidShape): void {
        // ポインタの位置を取得する
        const { clientX: left, clientY: top } = getPointerPosition(event);
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
     * 背景の描画
     */
    private drawBackgroundGrid() {
        const lines: fabric.Line[] = [];

        for (let y = 0; y <= this.pageHeight; y += this.gridSize) {
            const hl = new fabric.Line([0, y, this.pageWidth, y], { ...defaultGridLineProps });
            lines.push(hl);
        }
        for (let x = 0; x <= this.pageWidth; x += this.gridSize) {
            const vl = new fabric.Line([x, 0, x, this.pageHeight], { ...defaultGridLineProps });
            lines.push(vl);
        }

        this.canvas.add(...lines);
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
        const lines = createGlobalGuideLine(nodes, this.pageHeight);

        this.globalGuideLines.push(...lines);
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

    // イベント

    private attachEvent() {
        this.canvas.on('mouse:down', this.onMouseDown.bind(this));
        this.canvas.on('mouse:move', this.onMouseMove.bind(this));
        this.canvas.on('mouse:up', this.onMouseUp.bind(this));
        this.canvas.on('selection:created', this.onSelect.bind(this));
        this.canvas.on('selection:updated', this.onSelect.bind(this));
        this.canvas.on('selection:cleared', this.onDeselect.bind(this));
        this.canvas.on('path:created', this.onCreatePath.bind(this));
        this.canvas.on('object:added', this.onCreateObject.bind(this));
    }

    private onMouseDown(event: fabric.IEvent<Event>): void {
        if (this.enablePan) {
            // ポインタ位置
            const { clientX: x, clientY: y } = getPointerPosition(event);
            // ドラッグ開始
            this.canvas.selection = false; // 選択範囲の矩形を出さない
            this.isCanvasDragging = true;
            this.lastPos = { x, y };
        }
    }

    private onMouseMove(event: fabric.IEvent<Event>): void {
        if (this.isCanvasDragging) {
            // ポインタ位置
            const { clientX: x, clientY: y } = getPointerPosition(event);

            const vpt = this.canvas.viewportTransform;
            const zoom = this.canvas.getZoom();
            const canvasWidth = this.canvas.getWidth();
            const canvasHeight = this.canvas.getHeight();
            if (vpt) {
                let px = vpt[4];
                let py = vpt[5];

                // ページ幅がキャンバス幅に収まる
                if (canvasWidth >= this.pageWidth * zoom) {
                    px = canvasWidth / 2 - (this.pageHeight * zoom) / 2;
                } else {
                    px += x - this.lastPos.x;
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
                    py += y - this.lastPos.y;
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

            this.lastPos = { x, y };
        }
    }

    private onMouseUp(): void {
        if (this.isCanvasDragging) {
            const vpt = this.canvas.viewportTransform;
            if (vpt) {
                this.canvas.setViewportTransform(vpt);
            }
        }

        // ドラッグ終了
        this.isCanvasDragging = false;
        // 複数選択を可能にする
        this.canvas.selection = true;
    }

    // 要素選択
    private onSelect(): void {
        this.enablePan = false;
    }
    // 要素選択解除
    private onDeselect(): void {
        if (['select', 'force', 'delete'].includes(this.tool)) {
            this.enablePan = true;
        }
    }

    private onCreatePath(event: fabric.IEvent<Event>): void {
        // パスが描かれたときのイベント
        if (isPathEvent(event)) {
            const { path } = event.path;
            if (path && isSVGPath(path) && path.length >= 2) {
                // 始点と終点
                const s = path[0];
                const e = path[path.length - 1];
                if (isPathStart(s) && isPathEnd(e)) {
                    let [, ix, iy] = s;
                    let [, jx, jy] = e;

                    if (this.tool === 'pen') {
                        // スナップする
                        [ix, iy] = snap([ix, iy], this.snapSize);
                        [jx, jy] = snap([jx, jy], this.snapSize);

                        if (ix === jx && iy === jy) {
                            // 同一座標の場合は何もしない
                            return;
                        }

                        if (ix > jx || (ix === jx && iy > jy)) {
                            // 始点と終点を入れ替え
                            [ix, jx] = [jx, ix];
                            [iy, jy] = [jy, iy];
                        }

                        // 節点の作成
                        const nodeI = this.addNodeIfNotExists(ix, iy);
                        const nodeJ = this.addNodeIfNotExists(jx, jy);
                        // 梁要素の作成
                        this.addBeamIfNotExists(nodeI, nodeJ);
                    }
                }
            }
        }
    }
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
        console.log('dispose canvas.');
        if (this._initialized) {
            this.canvas.clear();
            this.canvas.dispose();
        }
    }
}

export default CanvasManager;
