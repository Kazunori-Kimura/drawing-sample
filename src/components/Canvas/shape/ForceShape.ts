import { fabric } from 'fabric';
import { Force } from '../../../types/shape';
import { createArrow, labelBaseProps, unresponseShapeProps } from '../factory';
import CanvasManager from '../manager';
import { lerp, round, roundDegree, snapAngle, Vector } from '../util';
import { BeamShape } from './BeamShape';

/**
 * 集中荷重の基本の長さ
 */
const ForceBaseLength = 30;
const ForceColor = 'orange';

const defaultForceLabelProps: fabric.ITextOptions = {
    ...unresponseShapeProps,
    ...labelBaseProps,
    fill: ForceColor,
    textAlign: 'left',
};

export class ForceShape {
    public data: Force;
    public force: fabric.Group;
    public label: fabric.Textbox;

    private manager: CanvasManager;
    private longpressTimer: NodeJS.Timer | undefined;
    private dragging = false;
    private _readonly = false;

    private head: Vector = new Vector(0, 0);
    // private tail: Vector = new Vector(0, 0);
    private direction: Vector = new Vector(0, 1);
    private length = 0;

    // ドラッグ中に梁要素の Shape を保持する
    // メモリリークを避けるため、ドラッグ完了後にクリアすること
    private beam: BeamShape | undefined;
    private vi = new Vector(0, 0);
    private vj = new Vector(0, 0);

    // rotate前の global な angle
    private originalAngle = 0;
    // ドラッグ中の位置
    private position = new Vector(0, 0);
    // ドラッグ可能な範囲
    private draggableMin = Number.MIN_SAFE_INTEGER;
    private draggableMax = Number.MAX_SAFE_INTEGER;

    constructor(manager: CanvasManager, params: Force) {
        this.manager = manager;
        this.data = params;

        this._readonly = this.manager.readonly;

        // 矢印、ラベル生成
        [this.force, this.label] = this.create();
        this.manager.canvas.add(this.force, this.label);

        // イベント割当
        this.attachEvent();
    }

    public get readonly(): boolean {
        return this._readonly;
    }
    public set readonly(value: boolean) {
        this._readonly = value;
        // readonly時はイベントに反応しない
        this.force.selectable = !value;
        this.force.evented = !value;
    }

    public get visible(): boolean {
        return this.force.visible ?? true;
    }

    public set visible(value: boolean) {
        this.force.visible = value;
        this.label.visible = value;
    }

    /**
     * 矢印の長さから集中荷重の大きさを計算
     * @returns
     */
    private calcForce(): number {
        if (this.manager.forceAverage === 0) {
            return 10;
        }

        return Math.round((this.length / ForceBaseLength) * this.manager.forceAverage);
    }

    /**
     * 集中荷重の大きさと平均値から矢印の長さを計算
     * @returns
     */
    private calcLength(): number {
        if (this.manager.forceAverage === 0) {
            return ForceBaseLength;
        }
        const ratio = this.data.force / this.manager.forceAverage;
        return ForceBaseLength * ratio;
    }

    private create(): [fabric.Group, fabric.Textbox] {
        const { id, beam, distanceI, angle = 0 } = this.data;
        // 集中荷重の対象梁要素
        const beamShape = this.manager.beamMap[beam];
        const { points } = beamShape;

        // 梁要素の i端、j端
        const pi = new Vector(points[0], points[1]);
        const pj = new Vector(points[2], points[3]);
        // 集中荷重の始点
        const head = lerp(pi, pj, distanceI);
        // 集中荷重の方向
        const dir = beamShape.direction
            .clone()
            .rotateDeg(angle - 90)
            .normalize();
        // 大きさ
        const forceLength = this.calcLength();
        // 集中荷重の終点
        const tail = head.clone().add(dir.clone().multiplyScalar(forceLength));

        // 矢印
        const arrow = createArrow(head, tail, {
            fill: ForceColor,
            stroke: ForceColor,
            name: id,
            data: {
                ...this.data,
                type: 'force',
            },
            selectable: !this.readonly,
            evented: !this.readonly,
        });

        // ラベルの基準位置
        const labelPosition = head.clone().add(beamShape.direction.clone().multiplyScalar(5));
        const labelAngle = dir.angleDeg();

        const label = new fabric.Textbox(` ${this.data.force} kN`, {
            ...defaultForceLabelProps,
            top: labelPosition.y,
            left: labelPosition.x,
            width: Math.max(forceLength, 140),
            angle: labelAngle,
            // デフォルトで非表示
            visible: false,
        });

        // ドラッグ時に使用するので保持しておく
        this.head.copy(head);
        // this.tail.copy(tail);
        this.direction.copy(dir);
        this.length = forceLength;

        return [arrow, label];
    }

    public update(params?: Force): void {
        if (params) {
            this.data = params;
        }

        // キャンバスから集中荷重を削除
        this.manager.canvas.remove(this.force, this.label);
        // 集中荷重を再作成
        [this.force, this.label] = this.create();
        this.manager.canvas.add(this.force, this.label);

        // イベント割当
        this.attachEvent();
    }

    /**
     * 集中荷重の削除
     * (NOTE: 集中荷重の平均値を再計算すること)
     */
    public remove(): void {
        // キャンバスから集中荷重を削除
        this.manager.canvas.remove(this.force, this.label);

        const forces = this.manager.forceMap[this.data.beam];
        if (forces) {
            // 自身を配列から除去
            const list = forces.filter((shape) => shape.data.id !== this.data.id);
            this.manager.forceMap[this.data.beam] = list;
        }
    }

    /**
     * 選択
     */
    public select(): void {
        this.manager.canvas.setActiveObject(this.force);
    }

    // イベントハンドラ

    private attachEvent() {
        this.force.on('selected', this.onSelect.bind(this));
        this.force.on('deselected', this.onDeselect.bind(this));
        // クリック・長押し
        this.force.on('mousedown', this.onMouseDown.bind(this));
        this.force.on('mouseup', this.onMouseUp.bind(this));
        this.force.on('mousedblclick', this.onDblClick.bind(this));
        // ドラッグ
        this.force.on('moving', this.onMoving.bind(this));
        this.force.on('moved', this.onMoved.bind(this));
        // 回転
        this.force.on('rotating', this.onRotating.bind(this));
        this.force.on('rotated', this.onRotated.bind(this));
        // 伸縮
        this.force.on('scaling', this.onScaling.bind(this));
        this.force.on('scaled', this.onScaled.bind(this));
    }

    private onSelect(): void {
        this.label.visible = true;
    }

    private onDeselect(): void {
        this.label.visible = false;
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

            const shape = this.force;
            // 長押し前の現在位置を保持する
            const { top: beforeTop, left: beforeLeft } = shape.getBoundingRect(true, true);

            // 長押し判定
            this.longpressTimer = setTimeout(() => {
                // 長押し後の現在位置
                const { top: afterTop, left: afterLeft } = shape.getBoundingRect(true, true);
                // 位置が変わっていなければ longpress とする
                if (beforeTop === afterTop && beforeLeft === afterLeft) {
                    // ダイアログの表示
                    this.manager.openForceDialog(event, this);
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
            this.manager.openForceDialog(event, this);
        }
    }

    private onRotating(event: fabric.IEvent<Event>): void {
        if (this.manager.tool === 'select') {
            if (!this.dragging) {
                // ラベルを非表示にする
                this.label.visible = false;
                // 現在の角度を保持
                this.originalAngle = this.force.angle ?? 0;
            }

            this.dragging = true;
        }
    }

    private onRotated(event: fabric.IEvent<Event>): void {
        const currentAngle = this.force.angle ?? 0;

        let deg = 0;
        if (this.originalAngle === currentAngle) {
            return;
        } else if (this.originalAngle < currentAngle) {
            deg = currentAngle - this.originalAngle;
        } else if (this.originalAngle > currentAngle) {
            deg = 360 - this.originalAngle + currentAngle;
        }
        // 0 <= deg < 360 に変換
        deg = roundDegree(deg);
        // 5° にスナップする
        deg = snapAngle(deg, 5);

        let angle = this.originalAngle + deg;
        angle = roundDegree(angle);

        // 矢印、ラベルを回す
        this.force.angle = angle;
        this.label.angle = angle - 90;
        this.label.visible = true;

        // 角度を保持
        let value = (this.data.angle ?? 0) + deg;
        value = roundDegree(value);
        this.data.angle = value;

        this.dragging = false;
    }

    private onScaling(event: fabric.IEvent<Event>): void {
        if (this.manager.tool === 'select') {
            this.dragging = true;
        }
    }

    private onScaled(event: fabric.IEvent<Event>): void {
        if (this.dragging) {
            const scale = this.force.scaleY ?? 1;
            const length = this.length * scale;

            // 長さから集中荷重の大きさを計算
            this.length = length;
            const f = this.calcForce();
            this.data.force = f;

            // 矢印を作成しなおす
            this.update();

            // 選択
            this.select();
        }
        this.dragging = false;
    }

    private calcMovedPosition() {
        if (this.beam) {
            // ドラッグ位置
            this.position.x = this.force.left ?? 0;
            this.position.y = this.force.top ?? 0;

            // 元の位置から現在位置までの長さ
            const dragDis = this.head.distance(this.position);
            // ドラッグの方向
            const dragDir = this.position.clone().subtract(this.head).normalize();
            // ドラッグの角度
            const angle = 180 - dragDir.verticalAngleDeg();
            // ドラッグ方向と梁要素のなす角度
            const deg = this.beam.angle - angle;
            const rad = (deg * Math.PI) / 180;
            // ドラッグされた長さを梁要素上の長さに変換
            let dist = dragDis * Math.cos(rad);

            if (this.draggableMin > dist) {
                dist = this.draggableMin;
            } else if (this.draggableMax < dist) {
                dist = this.draggableMax;
            }

            // 集中荷重の位置
            this.position.copy(this.head).add(this.beam.direction.clone().multiplyScalar(dist));
        }
    }

    private onMoving(event: fabric.IEvent<Event>): void {
        if (this.manager.tool === 'select') {
            if (!this.dragging) {
                // ラベルを非表示
                this.label.visible = false;
                // 対象の梁要素を取得
                this.beam = this.manager.beamMap[this.data.beam];

                // ドラッグ可能範囲を計算
                [this.vi.x, this.vi.y] = [this.beam.points[0], this.beam.points[1]];
                [this.vj.x, this.vj.y] = [this.beam.points[2], this.beam.points[3]];

                this.draggableMin = this.vi.distance(this.head) * -1;
                this.draggableMax = this.vj.distance(this.head);

                // 初期位置を初期化
                this.position.copy(this.head);

                this.dragging = true;
            }

            // 位置の計算
            this.calcMovedPosition();
            // 集中荷重を移動
            this.force.left = this.position.x;
            this.force.top = this.position.y;
        }
    }

    private onMoved(event: fabric.IEvent<Event>): void {
        if (this.beam) {
            // ドラッグ位置を計算
            this.calcMovedPosition();
            // i端からの距離を更新
            const distI = this.vi.distance(this.position);
            this.data.distanceI = round(distI / this.beam.length, 2);

            // 位置を再計算
            this.head.copy(
                this.vi
                    .clone()
                    .add(
                        this.beam.direction
                            .clone()
                            .multiplyScalar(this.beam.length * this.data.distanceI)
                    )
            );
            this.force.left = this.head.x;
            this.force.top = this.head.y;

            // ラベル位置を更新
            this.label.left = this.head.x;
            this.label.top = this.head.y;
            this.label.visible = true;
        }
        // ドラッグ終了
        this.beam = undefined;
        this.draggableMin = Number.MIN_SAFE_INTEGER;
        this.draggableMax = Number.MAX_SAFE_INTEGER;
        this.dragging = false;
    }
}
