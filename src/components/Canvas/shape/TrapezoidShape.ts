import { fabric } from 'fabric';
import { Trapezoid } from '../../../types/shape';
import { ArrowOptions, createArrow, createGuideLine } from '../factory';
import CanvasManager from '../manager';
import { BeamPoints } from '../types';
import { getInsidePoints, intercectPoint, Vector, vX } from '../util';

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
    public middle: fabric.Group;
    // public arrows: fabric.Group[];
    // public line: fabric.Line;
    public labelI: fabric.Textbox;
    public labelJ: fabric.Textbox;
    public guide?: fabric.Group; // 寸法線

    private manager: CanvasManager;
    private longpressTimer: NodeJS.Timer | undefined;
    private dragging = false;
    private _readonly = false;

    private selectedShapes = new Set<string>();

    constructor(manager: CanvasManager, params: Trapezoid) {
        this.manager = manager;
        this.data = params;
        this._readonly = this.manager.readonly;

        // fabricのオブジェクトを作成
        let arrows: fabric.Group[];
        let line: fabric.Line;
        [this.forceI, this.forceJ, arrows, line, this.labelI, this.labelJ, this.guide] =
            this.create();
        this.middle = this.createMiddle(arrows, line);

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
        // TODO: readonly時はイベントに反応しない
        [this.forceI, this.forceJ, this.middle, this.labelI, this.labelJ, this.guide].forEach(
            (shape: fabric.Object | undefined) => {
                if (shape) {
                    shape.evented = value;
                }
            }
        );
    }

    public get visible(): boolean {
        return this.forceI.visible ?? true;
    }
    public set visible(value: boolean) {
        this.forceI.visible = value;
        this.forceJ.visible = value;
        this.middle.visible = value;
        this.labelI.visible = value;
        this.labelJ.visible = value;
        if (this.guide) {
            this.guide.visible = value;
        }
    }

    private createMiddle(arrows: fabric.Group[], line: fabric.Line): fabric.Group {
        const group = new fabric.Group([...arrows, line], {
            selectable: !this.readonly,
            evented: !this.readonly,
            hasControls: false,
            lockMovementX: true,
            lockMovementY: true,
            name: `${this.data.id}/middle`,
        });
        return group;
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
            angle = 90,
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
                .rotateDeg(angle * -1)
                .normalize();
        } else {
            dir = beamShape.direction
                .clone()
                .rotateDeg(angle * -1)
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

        // 内側の矢印
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
                selectable: false,
                evented: false,
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
        const line = new fabric.Line([pi.x, pi.y, pj.x, pj.y], {
            ...defaultTrapezoidLineOptions,
            name: this.data.id,
            data: {
                type: 'trapezoid',
                ...this.data,
            },
        });

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

        return [arrowI, arrowJ, arrows, line, labelI, labelJ, guide];
    }

    public update(params?: Trapezoid): void {
        if (params) {
            this.data = params;
        }

        // キャンバスから削除
        this.removeFromCanvas();

        // fabricのオブジェクトを作成
        let arrows: fabric.Group[];
        let line: fabric.Line;
        [this.forceI, this.forceJ, arrows, line, this.labelI, this.labelJ, this.guide] =
            this.create();
        this.middle = this.createMiddle(arrows, line);

        // キャンバスに追加
        this.addToCanvas();
        // イベント割当
        this.attachEvents();
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
        this.manager.canvas.add(this.forceI, this.forceJ, this.middle, this.labelI, this.labelJ);
        if (this.guide) {
            this.manager.canvas.add(this.guide);
        }
        this.forceI.bringToFront();
        this.forceJ.bringToFront();
    }

    /**
     * キャンバスから分布荷重を削除する
     */
    private removeFromCanvas(): void {
        this.manager.canvas.remove(this.forceI, this.forceJ, this.middle, this.labelI, this.labelJ);
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

    // イベントハンドラ

    private attachEvents() {
        // TODO: 実装
        this.forceI.on('selected', this.onSelected.bind(this));
        this.forceJ.on('selected', this.onSelected.bind(this));
        this.middle.on('selected', this.onSelected.bind(this));
        this.forceI.on('deselected', this.onDeselected.bind(this));
        this.forceJ.on('deselected', this.onDeselected.bind(this));
        this.middle.on('deselected', this.onDeselected.bind(this));
    }

    private onSelected(event: fabric.IEvent<Event>): void {
        // 選択された項目を保持する
        const name = event.target?.name;
        if (name) {
            this.selectedShapes.add(name);
        }

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
        if (this.guide && this.selectedShapes.size === 0) {
            this.guide.visible = false;
        }
    }
}
