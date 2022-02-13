import { fabric } from 'fabric';
import { Moment } from '../../../types/shape';
import { labelBaseProps, unresponseShapeProps } from '../factory';
import CanvasManager from '../manager';
import { compareCoords, lerp, round, Vector, vY } from '../util';
import { BeamShape } from './BeamShape';

const MomentColor = 'red';
const MomentIconURL = '/assets/images/moment.svg';
const IconSize = 24;

const defaultMomentProps: fabric.ICircleOptions = {
    fill: 'transparent',
    originX: 'center',
    originY: 'center',
    lockRotation: true,
    lockScalingX: true,
    lockScalingY: true,
    hasBorders: false,
    hasControls: false,
};

const defaultMomentImageProps: fabric.IObjectOptions = {
    originX: 'center',
    originY: 'center',
    selectable: false,
    evented: false,
};

/**
 * ラベルの設定
 */
const defaultMomentLabelProps: fabric.ITextOptions = {
    ...unresponseShapeProps,
    ...labelBaseProps,
    fill: MomentColor,
    originX: 'center',
    originY: 'top',
    textAlign: 'center',
};

export class MomentShape {
    public data: Moment;
    public moment: fabric.Circle;
    public image: fabric.Object | undefined;
    public label: fabric.Textbox;

    private manager: CanvasManager;
    private longpressTimer: NodeJS.Timer | undefined;
    private dragging = false;
    private _readonly = false;

    // ドラッグ中に梁要素の Shape を保持する
    // メモリリークを避けるため、ドラッグ完了後にクリアすること
    private beam: BeamShape | undefined;
    private vi = new Vector(0, 0);
    private vj = new Vector(0, 0);

    // ドラッグ中の位置
    private position = new Vector(0, 0);
    private dragPoint = new Vector(0, 0);
    // ドラッグ可能な範囲
    private draggableMin = Number.MIN_SAFE_INTEGER;
    private draggableMax = Number.MAX_SAFE_INTEGER;

    constructor(manager: CanvasManager, params: Moment) {
        this.manager = manager;
        this.data = params;

        this._readonly = this.manager.readonly;

        // 矢印、ラベル生成
        [this.moment, this.label] = this.create();
        this.manager.canvas.add(this.moment, this.label);

        // イベント割当
        this.attachEvent();
    }

    public get readonly(): boolean {
        return this._readonly;
    }
    public set readonly(value: boolean) {
        this._readonly = value;
        // readonly時はイベントに反応しない
        this.moment.selectable = !value;
        this.moment.evented = !value;
    }

    public get visible(): boolean {
        return this.moment.visible ?? true;
    }

    public set visible(value: boolean) {
        this.moment.visible = value;
        this.label.visible = value;
    }

    private create(): [fabric.Circle, fabric.Textbox] {
        const { id, beam, distanceI } = this.data;
        // 集中荷重の対象梁要素
        const beamShape = this.manager.beamMap[beam];
        const { points } = beamShape;

        // 梁要素の i端、j端
        const pi = new Vector(points[0], points[1]);
        const pj = new Vector(points[2], points[3]);
        // モーメント荷重の位置
        const position = lerp(pi, pj, distanceI);

        // アイコンと同サイズの円
        const moment = new fabric.Circle({
            ...defaultMomentProps,
            name: id,
            data: {
                type: 'moment',
                ...this.data,
            },
            top: position.y,
            left: position.x,
            radius: IconSize / 2,
            selectable: !this.readonly,
            evented: !this.readonly,
        });

        // アイコンを配置
        fabric.loadSVGFromURL(`${process.env.PUBLIC_URL}${MomentIconURL}`, (results, options) => {
            const svg = fabric.util.groupSVGElements(results, options);
            svg.set({ stroke: MomentColor });
            if (svg.type === 'path') {
                this.image = new fabric.Group([svg]);
            } else {
                this.image = svg;
            }

            // プロパティの設定
            this.image.set({
                ...defaultMomentImageProps,
                name: `image/${this.data.id}`,
                data: {
                    type: 'moment/image',
                    ...this.data,
                },
                top: position.y,
                left: position.x,
                scaleX: IconSize / 64,
                scaleY: IconSize / 64,
                flipY: this.data.moment < 0, // マイナス値なら反転させる
            });
            // 表示
            this.manager.canvas.add(this.image);
        });

        // ラベルの基準位置
        const labelPosition = position.clone().add(vY.clone().multiplyScalar(IconSize / 2 + 5));

        const label = new fabric.Textbox(`${this.data.moment} kN`, {
            ...defaultMomentLabelProps,
            top: labelPosition.y,
            left: labelPosition.x,
            // デフォルトで非表示
            visible: false,
        });

        // ドラッグ時に使用するので位置を保持する
        this.position.copy(position);

        return [moment, label];
    }

    public update(params?: Moment): void {
        if (params) {
            this.data = params;
        }

        // ラベルが表示されていた場合、選択されていたとみなす
        const selected = this.label.visible ?? false;

        // キャンバスから削除
        this.manager.canvas.remove(this.moment, this.label);
        // 再作成
        [this.moment, this.label] = this.create();
        this.manager.canvas.add(this.moment, this.label);

        // イベント割当
        this.attachEvent();

        if (selected) {
            // 選択状態を復元する
            this.select();
        }
    }

    public remove(): void {
        // イベントを削除
        this.moment.off();
        // キャンバスから削除
        this.manager.canvas.remove(this.moment, this.label);
        if (this.image) {
            this.manager.canvas.remove(this.image);
        }

        // const forces = this.manager.forceMap[this.data.beam];
        // if (forces) {
        //     // 自身を配列から除去
        //     const list = forces.filter((shape) => shape.data.id !== this.data.id);
        //     this.manager.forceMap[this.data.beam] = list;
        // }
    }

    /**
     * 選択
     */
    public select(): void {
        this.manager.canvas.setActiveObject(this.moment);
    }

    // イベントハンドラ

    private attachEvent() {
        this.moment.on('selected', this.onSelected.bind(this));
        this.moment.on('deselected', this.onDeselected.bind(this));
        // クリック・長押し
        this.moment.on('mousedown', this.onMouseDown.bind(this));
        this.moment.on('mouseup', this.onMouseUp.bind(this));
        this.moment.on('mousedblclick', this.onDblClick.bind(this));
        // ドラッグ
        this.moment.on('moving', this.onMoving.bind(this));
        this.moment.on('moved', this.onMoved.bind(this));
    }

    private onSelected(): void {
        this.label.visible = true;
    }

    private onDeselected(): void {
        this.label.visible = false;
    }

    private onMouseDown(event: fabric.IEvent<Event>): void {
        if (this.readonly) {
            // 読み取り専用時は何もしない
            return;
        }

        if (this.manager.tool === 'delete') {
            this.remove();
            return;
        }

        if (['select', 'moment'].includes(this.manager.tool) && event.target) {
            // すでに長押しを実行中ならタイマーキャンセル
            if (this.longpressTimer) {
                clearTimeout(this.longpressTimer);
                this.longpressTimer = undefined;
            }

            const shape = this.moment;
            // 長押し前の現在位置を保持する
            const { top: beforeTop, left: beforeLeft } = shape.getBoundingRect(true, true);

            // 長押し判定
            this.longpressTimer = setTimeout(() => {
                // 長押し後の現在位置
                const { top: afterTop, left: afterLeft } = shape.getBoundingRect(true, true);
                // 位置が変わっていなければ longpress とする
                if (compareCoords([beforeLeft, beforeTop], [afterLeft, afterTop])) {
                    // TODO: ダイアログの表示
                    // this.manager.openForceDialog(event, this);
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
            // TODO: ダイアログの表示
            // this.manager.openForceDialog(event, this);
        }
    }

    private calcMovedPosition() {
        if (this.beam) {
            // ドラッグ位置
            this.dragPoint.x = this.moment.left ?? 0;
            this.dragPoint.y = this.moment.top ?? 0;

            // 元の位置から現在位置までの長さ
            const dragDis = this.position.distance(this.dragPoint);
            // ドラッグの方向
            const dragDir = this.dragPoint.clone().subtract(this.position).normalize();
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

            // 新しい位置
            this.position.copy(this.position).add(this.beam.direction.clone().multiplyScalar(dist));
        }
    }

    private onMoving(event: fabric.IEvent<Event>): void {
        if (['select', 'moment'].includes(this.manager.tool)) {
            if (!this.dragging) {
                // ラベルを非表示
                this.label.visible = false;
                // 対象の梁要素を取得
                this.beam = this.manager.beamMap[this.data.beam];

                // ドラッグ可能範囲を計算
                [this.vi.x, this.vi.y] = [this.beam.points[0], this.beam.points[1]];
                [this.vj.x, this.vj.y] = [this.beam.points[2], this.beam.points[3]];

                this.draggableMin = this.vi.distance(this.position) * -1;
                this.draggableMax = this.vj.distance(this.position);

                // 初期位置を初期化
                this.dragPoint.copy(this.position);

                this.dragging = true;
            }

            // 位置の計算
            this.calcMovedPosition();
            // 移動
            this.moment.left = this.position.x;
            this.moment.top = this.position.y;
            if (this.image) {
                this.image.left = this.position.x;
                this.image.top = this.position.y;
            }
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
            this.position.copy(
                this.vi
                    .clone()
                    .add(
                        this.beam.direction
                            .clone()
                            .multiplyScalar(this.beam.length * this.data.distanceI)
                    )
            );
            this.moment.left = this.position.x;
            this.moment.top = this.position.y;
            if (this.image) {
                this.image.left = this.position.x;
                this.image.top = this.position.y;
            }

            // ラベル位置を更新
            const lp = this.position.clone().add(vY.multiplyScalar(IconSize / 2 + 5));
            this.label.left = lp.x;
            this.label.top = lp.y;
            this.label.visible = true;
        }

        // ドラッグ終了
        this.beam = undefined;
        this.draggableMin = Number.MIN_SAFE_INTEGER;
        this.draggableMax = Number.MAX_SAFE_INTEGER;
        this.dragging = false;
    }
}
