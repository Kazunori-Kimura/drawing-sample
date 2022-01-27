import { fabric } from 'fabric';
import { Force } from '../../../types/shape';
import { createArrow, labelBaseProps, unresponseShapeProps } from '../factory';
import CanvasManager from '../manager';
import { lerp, Vector, verticalNormalizeVector } from '../util';

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

    private create(): [fabric.Group, fabric.Textbox] {
        // 集中荷重の対象梁要素
        const beamShape = this.manager.beamMap[this.data.beam];
        const { points } = beamShape;

        // 梁要素の i端、j端
        const pi = new Vector(points[0], points[1]);
        const pj = new Vector(points[2], points[3]);
        // 集中荷重の始点
        const head = lerp(pi, pj, this.data.distanceI);
        // 集中荷重の方向
        const dir = verticalNormalizeVector(pi, pj);
        // 大きさ
        const ratio = this.data.force / this.manager.forceAverage;
        const forceLength = isNaN(ratio) ? ForceBaseLength : ForceBaseLength * ratio;
        // 集中荷重の終点
        const tail = head.clone().add(dir.clone().multiplyScalar(forceLength));

        // 矢印
        const arrow = createArrow(head, tail, {
            fill: ForceColor,
            stroke: ForceColor,
            name: this.data.id,
            data: {
                ...this.data,
                type: 'force',
            },
            selectable: !this.readonly,
            evented: !this.readonly,
        });

        // ラベルの基準位置
        const beamDir = pj.clone().subtract(pi).normalize();
        const labelPosition = head.clone().add(beamDir.clone().multiplyScalar(5));
        const angle = dir.angleDeg();

        const label = new fabric.Textbox(` ${this.data.force} kN`, {
            ...defaultForceLabelProps,
            top: labelPosition.y,
            left: labelPosition.x,
            width: Math.max(forceLength, 140),
            angle,
            // デフォルトで非表示
            visible: false,
        });

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
        // TODO: 実装
    }

    private onRotated(event: fabric.IEvent<Event>): void {
        // TODO: 実装
    }

    private onScaling(event: fabric.IEvent<Event>): void {
        // TODO: 実装
    }

    private onScaled(event: fabric.IEvent<Event>): void {
        // TODO: 実装
    }

    private onMoving(event: fabric.IEvent<Event>): void {
        // TODO: 実装
    }

    private onMoved(event: fabric.IEvent<Event>): void {
        // TODO: 実装
    }
}
