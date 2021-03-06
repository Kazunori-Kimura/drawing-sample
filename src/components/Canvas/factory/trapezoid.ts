import { fabric } from 'fabric';
import { Trapezoid } from '../../../types/shape';
import { BeamPoints } from '../types';
import { getInsidePoints, intercectPoint, Vector, vX } from '../util';
import { BeamShape } from './beam';
import { ArrowOptions, createArrow } from './common';
import { createTrapezoidGuideLine } from './guide';

export type TrapezoidShape = {
    data: Trapezoid;
    arrows: fabric.Group[];
    line: fabric.Line;
    labels: fabric.Textbox[];
    guide?: fabric.Group; // 寸法線
};

type CreateTrapezoidFunction = (
    points: BeamPoints,
    // 平均値
    average: number,
    trapezoid: Trapezoid,
    readonly?: boolean
) => TrapezoidShape;

const TrapezoidColor = 'pink';
const defaultTrapezoidArrowOptions: ArrowOptions = {
    stroke: TrapezoidColor,
    fill: TrapezoidColor,
    arrowWidth: 2,
    arrowEdgeSize: 8,
};
const defaultTrapezoidLineOptions: fabric.ILineOptions = {
    stroke: TrapezoidColor,
    strokeWidth: 2,
    selectable: false,
    evented: false,
};
const defaultTrapezoidLabelOptions: fabric.ITextboxOptions = {
    fill: TrapezoidColor,
    fontSize: 10,
    fontFamily: 'sans-serif',
    height: 10,
    selectable: false,
    evented: false,
};

/**
 * 分布荷重の矢印の長さ
 */
const TrapezoidArrowBaseLength = 25;

const calcLength = (force: number, ave: number): number => {
    if (isNaN(ave) || ave === 0) {
        return TrapezoidArrowBaseLength;
    }
    return (force / ave) * TrapezoidArrowBaseLength;
};

const createTrapezoidLabel = (label: string, position: Vector, angle: number): fabric.Textbox => {
    return new fabric.Textbox(label, {
        ...defaultTrapezoidLabelOptions,
        top: position.y,
        left: position.x,
        angle,
        width: 140,
    });
};

/**
 * 分布荷重の生成
 */
export const createTrapezoid: CreateTrapezoidFunction = (
    beamPoints,
    average,
    trapezoid,
    readonly = false
): TrapezoidShape => {
    const { forceI, forceJ, distanceI, distanceJ, angle = 90, isGlobal = false } = trapezoid;

    const vI = new Vector(beamPoints[0], beamPoints[1]);
    const vJ = new Vector(beamPoints[2], beamPoints[3]);

    // 梁要素の方向
    const beamDir = vJ.clone().subtract(vI).normalize();
    // 分布荷重の方向
    let dir: Vector;
    if (isGlobal) {
        dir = vX
            .clone()
            .rotateDeg(angle * -1)
            .normalize();
    } else {
        dir = beamDir
            .clone()
            .rotateDeg(angle * -1)
            .normalize();
    }
    // 梁要素の長さ
    const beamLength = vI.distance(vJ);
    // 分布荷重の下端の位置
    const bi = vI.clone().add(beamDir.clone().multiplyScalar(beamLength * distanceI));
    const bj = vI.clone().add(beamDir.clone().multiplyScalar(beamLength * (1 - distanceJ)));
    // 分布荷重の上端の位置
    const pi = bi.clone().add(dir.clone().multiplyScalar(calcLength(forceI, average)));
    const pj = bj.clone().add(dir.clone().multiplyScalar(calcLength(forceJ, average)));

    // 下端を等間隔に分割する点を取得
    const points = getInsidePoints(bi, bj, beamDir);
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
        name: `${trapezoid.id}/i`,
        data: {
            type: 'trapezoid/i',
            ...trapezoid,
        },
        selectable: !readonly,
        evented: !readonly,
    });
    const arrowJ = createArrow([bj.x, bj.y, pj.x, pj.y], {
        ...defaultTrapezoidArrowOptions,
        name: `${trapezoid.id}/j`,
        data: {
            type: 'trapezoid/j',
            ...trapezoid,
        },
        selectable: !readonly,
        evented: !readonly,
    });
    arrows.push(arrowI, arrowJ);

    // 上端
    const line = new fabric.Line([pi.x, pi.y, pj.x, pj.y], {
        ...defaultTrapezoidLineOptions,
        name: trapezoid.id,
        data: {
            type: 'trapezoid',
            ...trapezoid,
        },
    });

    // i端側ラベル
    const li = bi.clone().add(beamDir.clone().multiplyScalar(5));
    // j端側ラベル
    const lj = bj.clone().add(beamDir.clone().multiplyScalar(5));
    // ラベルの角度
    const labelAngle = dir.angleDeg();

    const labelI = createTrapezoidLabel(`  ${forceI} kN/m`, li, labelAngle);
    labelI.visible = false;
    const labelJ = createTrapezoidLabel(`  ${forceJ} kN/m`, lj, labelAngle);
    labelJ.visible = false;

    return {
        data: trapezoid,
        arrows,
        line,
        labels: [labelI, labelJ],
    };
};

/**
 * 平均値の計算
 * @param trapezoids
 * @returns
 */
export const calcTrapezoidAverage = (trapezoids: Trapezoid[]): number => {
    let trapezoidAverage = 0;
    if (trapezoids.length > 0) {
        const total = trapezoids
            .map(({ forceI, forceJ }) => forceI + forceJ)
            .reduce((prev, current) => prev + current);
        trapezoidAverage = total / (trapezoids.length * 2);
    }
    return trapezoidAverage;
};

/**
 * 分布荷重の再作成
 * @param canvas
 * @param beamShape
 * @param trapezoidMap
 * @param trapezoidAverage
 */
export const recreateTrapezoids = (
    canvas: fabric.Canvas,
    beamShape: BeamShape,
    trapezoidMap: Record<string, TrapezoidShape[]>,
    trapezoidAverage: number
): void => {
    const trapezoids = trapezoidMap[beamShape.data.id];
    if (trapezoids) {
        const newTrapezoids: TrapezoidShape[] = [];
        trapezoids.forEach((shape) => {
            const data = shape.data;

            // キャンバスから分布荷重を削除
            canvas.remove(...shape.arrows, shape.line, ...shape.labels);

            if (shape.guide) {
                canvas.remove(shape.guide);
            }

            const ts = createTrapezoid(beamShape.points, trapezoidAverage, data);
            const guide = createTrapezoidGuideLine(
                beamShape.points,
                data.distanceI,
                data.distanceJ
            );
            guide.visible = false;
            ts.guide = guide;
            newTrapezoids.push(ts);

            canvas.add(...ts.arrows, ts.line, ...ts.labels, ts.guide);
        });
        trapezoidMap[beamShape.data.id] = newTrapezoids;
    }
};
