import { fabric } from 'fabric';
import { Trapezoid } from '../../../types/shape';
import { ArrowOptions, createArrow, createGuideLine } from '../factory';
import CanvasManager from '../manager';
import { BeamPoints } from '../types';
import { getInsidePoints, intercectPoint, lerp, round, Vector, vX } from '../util';
import { BeamShape } from './BeamShape';

const TrapezoidColor = 'pink';
/**
 * 分布荷重の矢印の長さ
 */
const TrapezoidArrowBaseLength = 25;

const defaultTrapezoidArrowOptions: ArrowOptions = {
    stroke: TrapezoidColor,
    fill: TrapezoidColor,
    arrowWidth: 2,
    arrowEdgeSize: 8,
};
const defaultTrapezoidLineOptions: fabric.ILineOptions = {
    stroke: TrapezoidColor,
    strokeWidth: 2,
    hasControls: false,
    hasBorders: false,
};
const defaultTrapezoidLabelOptions: fabric.ITextboxOptions = {
    fill: TrapezoidColor,
    fontSize: 10,
    fontFamily: 'sans-serif',
    height: 10,
    selectable: false,
    evented: false,
};

export class TrapezoidShape {
    public data: Trapezoid;
    public forceI: fabric.Group;
    public forceJ: fabric.Group;
    public arrows: fabric.Group[];
    public line: fabric.Line;
    public labelI: fabric.Textbox;
    public labelJ: fabric.Textbox;
    public guide?: fabric.Group; // 寸法線

    private manager: CanvasManager;
    private longpressTimer: NodeJS.Timer | undefined;
    private dragging = false;
    private _readonly = false;

    // 選択中のオブジェクト
    private selectedShapes = new Set<string>();

    // 分布荷重 i端の位置
    private pi = new Vector(0, 0);
    // 分布荷重 j端の位置
    private pj = new Vector(0, 0);
    // 分布荷重の方向
    private direction = new Vector(0, 0);

    // ドラッグ中のi端/j端の矢印
    private draggingEdge: 'i' | 'j' | undefined;

    // ドラッグ中に梁要素の Shape を保持する
    // メモリリークを避けるため、ドラッグ完了後にクリアすること
    private beam: BeamShape | undefined;
    // 梁要素のi端
    private vi = new Vector(0, 0);
    // 梁要素のj端
    private vj = new Vector(0, 0);

    // rotate前の global な angle
    private originalAngle = 0;
    // ドラッグ中の角度・位置
    private draggingDirection = new Vector(0, 0);
    private draggingPosition = new Vector(0, 0);
    // ドラッグ可能な範囲
    private draggableMin = Number.MIN_SAFE_INTEGER;
    private draggableMax = Number.MAX_SAFE_INTEGER;

    constructor(manager: CanvasManager, params: Trapezoid) {
        this.manager = manager;
        this.data = params;
        this._readonly = this.manager.readonly;

        // fabricのオブジェクトを作成
        [this.forceI, this.forceJ, this.arrows, this.line, this.labelI, this.labelJ, this.guide] =
            this.create();

        // キャンバスに追加
        this.addToCanvas();
        // イベント割当
        this.attachEvents();
    }

    public get readonly(): boolean {
        return this._readonly;
    }
    public set readonly(value: boolean) {
        this._readonly = value;
        // readonly時はイベントに反応しない
        [
            this.forceI,
            this.forceJ,
            ...this.arrows,
            this.line,
            this.labelI,
            this.labelJ,
            this.guide,
        ].forEach((shape: fabric.Object | undefined) => {
            if (shape) {
                shape.evented = value;
            }
        });
    }

    public get visible(): boolean {
        return this.forceI.visible ?? true;
    }
    public set visible(value: boolean) {
        this.forceI.visible = value;
        this.forceJ.visible = value;
        this.arrows.forEach((arrow) => (arrow.visible = value));
        this.line.visible = value;
        this.labelI.visible = value;
        this.labelJ.visible = value;
        if (this.guide) {
            this.guide.visible = value;
        }
    }

    private create(): [
        fabric.Group,
        fabric.Group,
        fabric.Group[],
        fabric.Line,
        fabric.Textbox,
        fabric.Textbox,
        fabric.Group
    ] {
        const {
            beam,
            forceI,
            forceJ,
            distanceI,
            distanceJ,
            angle = 0,
            isGlobal = false,
        } = this.data;
        const average = this.manager.trapezoidAverage;
        const beamShape = this.manager.beamMap[beam];

        // 梁要素のi端
        const vI = new Vector(beamShape.points[0], beamShape.points[1]);

        // 分布荷重の方向
        let dir: Vector;
        if (isGlobal) {
            dir = vX
                .clone()
                .rotateDeg(angle - 90)
                .normalize();
        } else {
            dir = beamShape.direction
                .clone()
                .rotateDeg(angle - 90)
                .normalize();
        }

        // 分布荷重の下端の位置
        const bi = vI
            .clone()
            .add(beamShape.direction.clone().multiplyScalar(beamShape.length * distanceI));
        const bj = vI
            .clone()
            .add(beamShape.direction.clone().multiplyScalar(beamShape.length * (1 - distanceJ)));
        // 分布荷重の上端の位置
        const pi = bi.clone().add(dir.clone().multiplyScalar(this.calcLength(forceI, average)));
        const pj = bj.clone().add(dir.clone().multiplyScalar(this.calcLength(forceJ, average)));

        // 下端を等間隔に分割する点を取得
        const points = getInsidePoints(bi, bj, beamShape.direction);
        // 上端の傾き
        const slope = pj.x - pi.x !== 0 ? (pj.y - pi.y) / (pj.x - pi.x) : NaN;
        // 上端の切片
        const intercept = isNaN(slope) ? NaN : pi.y - slope * pi.x;

        // 内側の矢印位置
        const insideArrows: BeamPoints[] = [];
        points.forEach((point) => {
            // 下端の点から上端に線を伸ばして交差する点
            const pu = intercectPoint([pi, pj, slope, intercept], point, dir);
            if (pu) {
                const arrow: BeamPoints = [point.x, point.y, pu[0], pu[1]];
                insideArrows.push(arrow);
            }
        });

        // 矢印
        const arrows = insideArrows.map((arrow) => {
            const shape = createArrow(arrow, {
                ...defaultTrapezoidArrowOptions,
                hasControls: false,
                hasBorders: false,
                selectable: !this.readonly,
                evented: !this.readonly,
            });
            return shape;
        });
        // i端
        const arrowI = createArrow([bi.x, bi.y, pi.x, pi.y], {
            ...defaultTrapezoidArrowOptions,
            name: `${this.data.id}/i`,
            data: {
                type: 'trapezoid/i',
                ...this.data,
            },
            selectable: !this.readonly,
            evented: !this.readonly,
        });
        // j端
        const arrowJ = createArrow([bj.x, bj.y, pj.x, pj.y], {
            ...defaultTrapezoidArrowOptions,
            name: `${this.data.id}/j`,
            data: {
                type: 'trapezoid/j',
                ...this.data,
            },
            selectable: !this.readonly,
            evented: !this.readonly,
        });

        // 上端
        const line = this.createLine([pi.x, pi.y, pj.x, pj.y]);

        // 寸法線
        const guide = createGuideLine([bi.x, bi.y, bj.x, bj.y], 50);
        guide.visible = false;

        // i端側ラベル
        const li = bi.clone().add(beamShape.direction.clone().multiplyScalar(5));
        // j端側ラベル
        const lj = bj.clone().add(beamShape.direction.clone().multiplyScalar(5));
        // ラベルの角度
        const labelAngle = dir.angleDeg();

        const labelI = this.createTrapezoidLabel(`  ${forceI} kN/m`, li, labelAngle);
        labelI.visible = false;
        const labelJ = this.createTrapezoidLabel(`  ${forceJ} kN/m`, lj, labelAngle);
        labelJ.visible = false;

        // ドラッグ時に使用するデータを保持する
        this.pi.copy(bi);
        this.pj.copy(bj);
        this.direction.copy(dir);

        return [arrowI, arrowJ, arrows, line, labelI, labelJ, guide];
    }

    public update(params?: Trapezoid): void {
        if (params) {
            this.data = params;
        }

        // キャンバスから削除
        this.removeFromCanvas();

        // fabricのオブジェクトを作成
        [this.forceI, this.forceJ, this.arrows, this.line, this.labelI, this.labelJ, this.guide] =
            this.create();

        // キャンバスに追加
        this.addToCanvas();
        // イベント割当
        this.attachEvents();
    }

    private createLine(points: BeamPoints): fabric.Line {
        return new fabric.Line(points, {
            ...defaultTrapezoidLineOptions,
            selectable: !this.readonly,
            evented: !this.readonly,
            name: this.data.id,
            data: {
                type: 'trapezoid',
                ...this.data,
            },
        });
    }

    private updateLine(): void {
        const average = this.manager.trapezoidAverage;
        let li: Vector;
        let lj: Vector;

        if (this.draggingEdge === 'i') {
            li = this.draggingPosition
                .clone()
                .add(
                    this.direction
                        .clone()
                        .multiplyScalar(this.calcLength(this.data.forceI, average))
                );
            lj = this.pj
                .clone()
                .add(
                    this.direction
                        .clone()
                        .multiplyScalar(this.calcLength(this.data.forceJ, average))
                );
        } else if (this.draggingEdge === 'j') {
            li = this.pi
                .clone()
                .add(
                    this.direction
                        .clone()
                        .multiplyScalar(this.calcLength(this.data.forceI, average))
                );
            lj = this.draggingPosition
                .clone()
                .add(
                    this.direction
                        .clone()
                        .multiplyScalar(this.calcLength(this.data.forceJ, average))
                );
        } else {
            li = this.pi
                .clone()
                .add(
                    this.direction
                        .clone()
                        .multiplyScalar(this.calcLength(this.data.forceI, average))
                );
            lj = this.pj
                .clone()
                .add(
                    this.direction
                        .clone()
                        .multiplyScalar(this.calcLength(this.data.forceJ, average))
                );
        }

        this.manager.canvas.remove(this.line);
        this.line = this.createLine([li.x, li.y, lj.x, lj.y]);
        // ドラッグ中のみの描画、ドラッグ完了後に再作成されるので
        // イベント割当は割愛
        this.manager.canvas.add(this.line);
    }

    public remove(): void {
        // キャンバスから削除
        this.removeFromCanvas();

        const trapezoids = this.manager.trapezoidMap[this.data.beam];
        if (trapezoids) {
            const list = trapezoids.filter((shape) => shape.data.id !== this.data.id);
            this.manager.trapezoidMap[this.data.beam] = list;
        }
    }

    private addToCanvas(): void {
        this.manager.canvas.add(
            this.forceI,
            this.forceJ,
            ...this.arrows,
            this.line,
            this.labelI,
            this.labelJ
        );
        if (this.guide) {
            this.manager.canvas.add(this.guide);
        }
        // 選択しやすいように i端、j端の矢印を最前面に持ってくる
        this.forceI.bringToFront();
        this.forceJ.bringToFront();
    }

    /**
     * キャンバスから分布荷重を削除する
     */
    private removeFromCanvas(): void {
        this.manager.canvas.remove(
            this.forceI,
            this.forceJ,
            ...this.arrows,
            this.line,
            this.labelI,
            this.labelJ
        );
        if (this.guide) {
            this.manager.canvas.remove(this.guide);
        }
    }

    private calcLength(force: number, average: number): number {
        if (isNaN(average) || average === 0) {
            return TrapezoidArrowBaseLength;
        }
        return (force / average) * TrapezoidArrowBaseLength;
    }

    private createTrapezoidLabel(label: string, position: Vector, angle: number): fabric.Textbox {
        return new fabric.Textbox(label, {
            ...defaultTrapezoidLabelOptions,
            top: position.y,
            left: position.x,
            angle,
            width: 140,
        });
    }

    /**
     * ラベル、寸法線、中央の矢印の表示・非表示を切り替える
     */
    private setVisibleParts(visible = true) {
        const shapes = [this.labelI, this.labelJ, ...this.arrows];
        shapes.forEach((shape) => (shape.visible = visible));

        if (this.guide) {
            this.guide.visible = visible;
        }
    }

    // イベントハンドラ

    private attachEvents() {
        const edges = [this.forceI, this.forceJ];
        const shapes = [this.forceI, this.forceJ, ...this.arrows, this.line];

        shapes.forEach((shape) => {
            // 選択・選択解除
            shape.on('selected', this.onSelected.bind(this));
            shape.on('deselected', this.onDeselected.bind(this));
            // クリック・長押し
            shape.on('mousedown', this.onMouseDown.bind(this));
            shape.on('mouseup', this.onMouseUp.bind(this));
            shape.on('mousedblclick', this.onDblClick.bind(this));
        });

        edges.forEach((edge) => {
            // ドラッグ
            edge.on('moving', this.onMoving.bind(this));
            edge.on('moved', this.onMoved.bind(this));
            // TODO: 回転
            // TODO: 伸縮
        });
    }

    private onSelected(event: fabric.IEvent<Event>): void {
        // 選択された項目を保持する
        const name = event.target?.name;
        if (name) {
            this.selectedShapes.add(name);
        }

        this.labelI.visible = true;
        this.labelJ.visible = true;
        if (this.guide) {
            this.guide.visible = true;
        }
    }

    private onDeselected(event: fabric.IEvent<Event>): void {
        // 選択解除
        const name = event.target?.name;
        if (name) {
            this.selectedShapes.delete(name);
        }
        // すべての選択が解除されたら寸法線を隠す
        if (this.selectedShapes.size === 0) {
            this.labelI.visible = false;
            this.labelJ.visible = false;
            if (this.guide) {
                this.guide.visible = false;
            }
        }
    }

    private onMouseDown(event: fabric.IEvent<Event>): void {
        if (this.readonly) {
            // 読み取り専用時は何もしない
            return;
        }

        if (this.manager.tool === 'select' && event.target) {
            // すでに長押しを実行中ならタイマーキャンセル
            if (this.longpressTimer) {
                clearTimeout(this.longpressTimer);
                this.longpressTimer = undefined;
            }

            const shape = event.target;
            // 長押し前の現在位置を保持する
            const { top: beforeTop, left: beforeLeft } = shape.getBoundingRect(true, true);

            // 長押し判定
            this.longpressTimer = setTimeout(() => {
                // 長押し後の現在位置
                const { top: afterTop, left: afterLeft } = shape.getBoundingRect(true, true);
                // 位置が変わっていなければ longpress とする
                if (beforeTop === afterTop && beforeLeft === afterLeft && !this.dragging) {
                    // ダイアログの表示
                    this.manager.openTrapezoidDialog(event, this);
                }
                this.longpressTimer = undefined;
            }, CanvasManager.LongpressInterval);
        }
    } // end onMouseDown

    private onMouseUp(event: fabric.IEvent<Event>): void {
        if (this.longpressTimer) {
            clearTimeout(this.longpressTimer);
            this.longpressTimer = undefined;
        }
    }

    private onDblClick(event: fabric.IEvent<Event>): void {
        if (!this.readonly) {
            // ダイアログの表示
            this.manager.openTrapezoidDialog(event, this);
        }
    }

    /**
     * ドラッグ可能範囲を計算
     */
    private calcDraggableRange() {
        if (this.beam && this.draggingEdge) {
            // 梁要素のi端、j端
            [this.vi.x, this.vi.y] = [this.beam.points[0], this.beam.points[1]];
            [this.vj.x, this.vj.y] = [this.beam.points[2], this.beam.points[3]];

            if (this.draggingEdge === 'i') {
                // i端の移動可能範囲
                // 最小値: 現在位置から i端側
                this.draggableMin = this.vi.distance(this.pi) * -1;

                // 最大値: 現在位置から j方向、distanceJ + 5% の地点まで
                // (梁要素の長さに対して 5% を分布荷重の最小幅とする)
                if (1 - (this.data.distanceJ + 0.05) < this.data.distanceI) {
                    // j端側へは移動不可
                    this.draggableMax = 0;
                } else {
                    const ratio = 1 - (this.data.distanceJ + 0.05);
                    const dj = lerp(this.vi, this.vj, ratio);
                    this.draggableMax = this.pi.distance(dj);
                }
            } else if (this.draggingEdge === 'j') {
                // j端の移動可能範囲
                // 最大値: 現在位置から j端側
                this.draggableMax = this.vj.distance(this.pj);

                // 最小値: 現在位置から i方向、distanceI + 5% の地点まで
                if (1 - this.data.distanceJ < this.data.distanceI + 0.05) {
                    // i端側へは移動不可
                    this.draggableMin = 0;
                } else {
                    const di = lerp(this.vi, this.vj, this.data.distanceI + 0.05);
                    this.draggableMin = this.pj.distance(di) * -1;
                }
            }
        }
    }

    /**
     * 梁要素に沿って移動する
     * @param shape
     */
    private moveArrow(shape: fabric.Object, position: Vector) {
        if (this.beam) {
            // ドラッグ位置
            this.draggingPosition.x = shape.left ?? 0;
            this.draggingPosition.y = shape.top ?? 0;

            // 元の位置から現在位置までの距離
            const dragLength = position.distance(this.draggingPosition);
            // ドラッグの方向
            this.draggingDirection.copy(
                this.draggingPosition.clone().subtract(position).normalize()
            );
            // ドラッグの角度
            const angle = 180 - this.draggingDirection.verticalAngleDeg();
            // ドラッグ方向と梁要素のなす角度
            const deg = this.beam.angle - angle;
            const rad = (deg * Math.PI) / 180;
            // ドラッグされた長さを梁要素上の長さに変換
            let dist = dragLength * Math.cos(rad);
            // ドラッグ可能な範囲に修正
            if (this.draggableMin > dist) {
                dist = this.draggableMin;
            } else if (this.draggableMax < dist) {
                dist = this.draggableMax;
            }

            // 矢印の位置を更新
            this.draggingPosition
                .copy(position)
                .add(this.beam.direction.clone().multiplyScalar(dist));
            shape.left = this.draggingPosition.x;
            shape.top = this.draggingPosition.y;

            // 上端の線を更新
            this.updateLine();
        }
    }

    private onMoving(event: fabric.IEvent<Event>): void {
        if (this.manager.tool === 'select' && event.transform) {
            if (!this.dragging) {
                // ラベル、寸法線、中央の矢印を非表示にする
                this.setVisibleParts(false);
                // 対象の梁要素を取得
                this.beam = this.manager.beamMap[this.data.beam];

                // NOTE: 型定義に transform.target が存在しないので
                // 強制的に変換する
                const eventTransform = event.transform as unknown as Record<string, unknown>;
                const eventTarget = eventTransform.target as fabric.Object;

                // 移動中の矢印が i端/j端のどちらか？
                switch (eventTarget.data?.type) {
                    case 'trapezoid/i':
                        this.draggingEdge = 'i';
                        break;
                    case 'trapezoid/j':
                        this.draggingEdge = 'j';
                        break;
                    default:
                        this.draggingEdge = undefined;
                }

                if (this.draggingEdge) {
                    // ドラッグ可能範囲を計算
                    this.calcDraggableRange();

                    this.dragging = true;
                }
            }

            // 矢印の移動
            if (this.draggingEdge === 'i') {
                this.moveArrow(this.forceI, this.pi);
            } else if (this.draggingEdge === 'j') {
                this.moveArrow(this.forceJ, this.pj);
            }
        }
    }
    private onMoved(event: fabric.IEvent<Event>): void {
        if (this.beam && this.dragging) {
            // 最終的なドラッグ位置を計算
            if (this.draggingEdge === 'i') {
                this.moveArrow(this.forceI, this.pi);

                // distanceI を更新
                const distance = this.vi.distance(this.draggingPosition);
                this.data.distanceI = round(distance / this.beam.length, 2);
            } else if (this.draggingEdge === 'j') {
                this.moveArrow(this.forceJ, this.pj);

                // distanceJ を更新
                const distance = this.vj.distance(this.draggingPosition);
                this.data.distanceJ = round(distance / this.beam.length, 2);
            }

            // 再描画
            this.update();

            // 移動した矢印を再選択する
            if (this.draggingEdge) {
                this.manager.canvas.setActiveObject(
                    this.draggingEdge === 'i' ? this.forceI : this.forceJ
                );
            }
        }
        // ドラッグ終了
        this.dragging = false;
        this.beam = undefined;
        this.draggableMin = Number.MIN_SAFE_INTEGER;
        this.draggableMax = Number.MAX_SAFE_INTEGER;
        this.draggingEdge = undefined;
    }

    private onScaling(event: fabric.IEvent<Event>): void {
        //
    }
    private onScaled(event: fabric.IEvent<Event>): void {
        //
    }
    private onRotating(event: fabric.IEvent<Event>): void {
        //
    }
    private onRotated(event: fabric.IEvent<Event>): void {
        //
    }
}
