import { fabric } from 'fabric';
import { BeamPoints } from '../types';
import { Vector } from '../util';

/**
 * イベントに反応しない shape の共通設定
 */
export const unresponseShapeProps: fabric.IObjectOptions = {
    // イベントに反応させない
    evented: false,
    selectable: false,
};

/**
 * ラベルのフォント設定
 */
export const labelBaseProps: fabric.ITextboxOptions = {
    fontSize: 10,
    fontFamily: 'sans-serif',
    height: 10,
};

/**
 * 矢印の設定
 */
export interface ArrowOptions extends fabric.ILineOptions {
    arrowWidth?: number;
    arrowEdgeSize?: number;
    onRotating?: (event: fabric.IEvent<Event>) => void;
    onScaling?: (event: fabric.IEvent<Event>) => void;
    onModified?: (event: fabric.IEvent<Event>) => void;
}

// 矢印の生成
type CreateArrowFunction = {
    (points: BeamPoints, options?: ArrowOptions): fabric.Group;
    (v1: Vector, v2: Vector, options?: ArrowOptions): fabric.Group;
};

const defaultColor = 'black';
const defaultStrokeWidth = 2;
const defaultEdgeSize = 8;

const defaultLineOptions: fabric.ILineOptions = {
    stroke: defaultColor,
    strokeWidth: defaultStrokeWidth,
    originX: 'center',
    originY: 'bottom',
    centeredRotation: false,
};
const defaultEdgeOptions: fabric.ITriangleOptions = {
    width: defaultEdgeSize,
    height: defaultEdgeSize,
    stroke: defaultColor,
    strokeWidth: 1,
    fill: defaultColor,
    originX: 'center',
    originY: 'center',
    centeredRotation: true,
};

const createArrowByVectors = (
    v1: Vector,
    v2: Vector,
    { arrowWidth, arrowEdgeSize, onRotating, onScaling, onModified, ...options }: ArrowOptions = {}
): fabric.Group => {
    // 距離
    const distance = v1.distance(v2);
    // 方向
    const dir = v2.clone().subtract(v1).normalize();
    const angle = 180 - dir.verticalAngleDeg();

    const line = new fabric.Line([0, 0, 0, distance * -1], {
        strokeWidth: arrowWidth,
        ...defaultLineOptions,
        ...options,
    });

    const edgeSize = arrowEdgeSize ?? defaultEdgeSize;

    const edge = new fabric.Triangle({
        top: 0,
        left: 0,
        angle: -180,
        ...defaultEdgeOptions,
        width: edgeSize,
        height: edgeSize,
        stroke: options.stroke,
        fill: options.fill,
    });

    const arrow = new fabric.Group([line, edge], {
        top: v1.y,
        left: v1.x,
        originX: 'center',
        originY: 'bottom',
        centeredRotation: false,
        angle,
    });
    arrow.setControlsVisibility({
        bl: false,
        br: false,
        mb: false,
        ml: false,
        mr: false,
        mt: true,
        tl: false,
        tr: false,
        mtr: true,
    });

    return arrow;
};

const createArrowByPoints = (points: BeamPoints, options?: ArrowOptions): fabric.Group => {
    const p1 = new Vector(points[0], points[1]);
    const p2 = new Vector(points[2], points[3]);
    return createArrowByVectors(p1, p2, options);
};

/**
 * 矢印の作成 (始点を中心に回転・伸縮、始点に三角がくる)
 * @param arg1
 * @param arg2
 * @param arg3
 * @returns
 */
export const createArrow: CreateArrowFunction = (
    arg1: BeamPoints | Vector,
    arg2?: Vector | ArrowOptions,
    arg3?: ArrowOptions
): fabric.Group => {
    if (Array.isArray(arg1)) {
        return createArrowByPoints(arg1, arg2 as ArrowOptions);
    } else if (arg2) {
        return createArrowByVectors(arg1, arg2 as Vector, arg3);
    }
    throw new Error('invalid parameters');
};
