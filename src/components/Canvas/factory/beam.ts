import { fabric } from 'fabric';
import { Beam, isBeam } from '../../../types/shape';
import { BeamPoints } from '../types';
import { snap, Vector } from '../util';
import { ForceShape } from './force';
import { createBeamGuideLine } from './guide';
import { TrapezoidShape } from './trapezoid';

export type BeamShape = {
    data: Beam;
    beam: fabric.Line;
    points: BeamPoints;
    direction: Vector;
    length: number;
    angle: number;
    guide?: fabric.Group;
};

type CreateBeamFunction = {
    (points: BeamPoints, data: Beam, options?: fabric.ILineOptions): BeamShape;
    (vi: Vector, vj: Vector, data: Beam, options?: fabric.ILineOptions): BeamShape;
};

const createBeamByVectors = (
    vi: Vector,
    vj: Vector,
    data: Beam,
    options: fabric.ILineOptions
): BeamShape => {
    // 方向
    const direction = vj.clone().subtract(vi).normalize();
    // 長さ
    const length = vi.distance(vj);
    // 角度 (Vector では Y軸が上方向なので 上下反転させる)
    const angle = 180 - direction.verticalAngleDeg();

    const beam = new fabric.Line([0, 0, 0, length], {
        top: vi.y,
        left: vi.x,
        angle,
        // 始点を基準に回転させる
        originX: 'center',
        originY: 'bottom',
        centeredRotation: false,
        // 描画設定
        stroke: 'black',
        strokeWidth: 4,
        ...options,
        name: data.id,
        data: {
            type: 'beam',
            ...data,
        },
    });
    beam.setControlsVisibility({
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

    const points: BeamPoints = [vi.x, vi.y, vj.x, vj.y];

    return { data, beam, direction, length, angle, points };
};

const createBeamByPoints = (
    points: BeamPoints,
    data: Beam,
    options: fabric.ILineOptions
): BeamShape => {
    const p1 = new Vector(points[0], points[1]);
    const p2 = new Vector(points[2], points[3]);
    return createBeamByVectors(p1, p2, data, options);
};

export const createBeam: CreateBeamFunction = (
    arg1: BeamPoints | Vector,
    arg2: Vector | Beam,
    arg3?: Beam | fabric.ILineOptions,
    arg4?: fabric.ILineOptions
) => {
    if (Array.isArray(arg1) && isBeam(arg2)) {
        return createBeamByPoints(arg1, arg2, arg3 ?? {});
    } else if (isBeam(arg3)) {
        return createBeamByVectors(arg1 as Vector, arg2 as Vector, arg3, arg4 ?? {});
    }
    throw new Error('invalid parameters');
};

type UpdateBeamFunction = {
    (beam: BeamShape, points: BeamPoints): void;
    (beam: BeamShape, vi: Vector, vj: Vector): void;
};

const updateBeamByVectors = (shape: BeamShape, vi: Vector, vj: Vector): void => {
    // 方向
    const direction = vj.clone().subtract(vi).normalize();
    // 長さ
    const length = vi.distance(vj);
    // 角度 (Vector では Y軸が上方向なので 上下反転させる)
    const angle = 180 - direction.verticalAngleDeg();

    const points: BeamPoints = [vi.x, vi.y, vj.x, vj.y];

    shape.beam.scaleX = 1;
    shape.beam.scaleY = 1;
    // dirty=true を指定していないと、一定の長さ以下の梁要素が描画できない
    shape.beam.dirty = true;
    shape.beam.top = vi.y;
    shape.beam.left = vi.x;
    shape.beam.height = length;
    shape.beam.rotate(angle);
    shape.direction = direction;
    shape.length = length;
    shape.angle = angle;
    shape.points = points;
};

const updateBeamByPoints = (shape: BeamShape, points: BeamPoints): void => {
    const p1 = new Vector(points[0], points[1]);
    const p2 = new Vector(points[2], points[3]);
    updateBeamByVectors(shape, p1, p2);
};

/**
 * 梁要素の更新
 * @param arg1
 * @param arg2
 * @param arg3
 * @returns
 */
export const updateBeam: UpdateBeamFunction = (
    arg1: BeamShape,
    arg2: BeamPoints | Vector,
    arg3?: Vector
): void => {
    if (Array.isArray(arg2)) {
        updateBeamByPoints(arg1, arg2);
        return;
    } else if (arg3) {
        updateBeamByVectors(arg1, arg2, arg3);
        return;
    }
    throw new Error('invalid parameters');
};

/**
 * i端/j端の位置を計算（ドラッグ中）
 * @param shape
 * @param vi
 * @param vj
 * @returns
 */
export const calcBeamPoints = (shape: BeamShape, vi: Vector, vj: Vector): BeamPoints => {
    const { top, left } = shape.beam;
    const { direction, length } = shape;
    // 梁要素の origin は i端
    vi.x = left ?? 0;
    vi.y = top ?? 0;
    // j端の位置を計算
    vj.x = left ?? 0;
    vj.y = top ?? 0;
    vj.add(direction.clone().multiplyScalar(length ?? 1));

    return [vi.x, vi.y, vj.x, vj.y];
};

/**
 * i端/j端の位置を計算（ドラッグ中）
 * @param shape
 * @param vi
 * @param vj
 * @param snapSize
 * @returns
 */
export const calcSnapedBeamPoints = (
    shape: BeamShape,
    vi: Vector,
    vj: Vector,
    snapSize: number
): BeamPoints => {
    const { top, left } = shape.beam;
    const { direction, length } = shape;

    const [ix, iy] = snap([left ?? 0, top ?? 0], snapSize);
    vi.x = ix;
    vi.y = iy;
    vj.x = ix;
    vj.y = iy;
    vj.add(direction.clone().multiplyScalar(length ?? 1));

    return [vi.x, vi.y, vj.x, vj.y];
};

/**
 * 寸法線を再作成
 * @param canvas
 * @param shape
 */
export const recreateBeamGuideLine = (canvas: fabric.Canvas, shape: BeamShape): void => {
    if (shape.guide) {
        canvas.remove(shape.guide);
    }
    shape.guide = createBeamGuideLine(shape.points);
    shape.guide.visible = false;
    canvas.add(shape.guide);
};

/**
 * 梁要素を削除する
 * (NOTE: removeBeam 後、集中荷重と分布荷重の平均値を更新すること)
 * @param canvas
 * @param beamId
 * @param beamMap
 * @param nodeBeamMap
 * @param forceMap
 * @param trapezoidMap
 */
export const removeBeam = (
    canvas: fabric.Canvas,
    beamId: string,
    beamMap: Record<string, BeamShape>,
    nodeBeamMap: Record<string, BeamShape[]>,
    forceMap: Record<string, ForceShape[]>,
    trapezoidMap: Record<string, TrapezoidShape[]>
): void => {
    // 集中荷重を削除
    const forces = forceMap[beamId];
    if (forces) {
        forces.forEach((shape) => {
            canvas.remove(shape.force, shape.label);
        });
        delete forceMap[beamId];
    }
    // 分布荷重を削除
    const trapezoids = trapezoidMap[beamId];
    if (trapezoids) {
        trapezoids.forEach((shape) => {
            canvas.remove(...shape.arrows, shape.line, ...shape.labels);
            if (shape.guide) {
                canvas.remove(shape.guide);
            }
        });
        delete trapezoidMap[beamId];
    }
    // nodeBeamMap から梁要素を削除
    const beamShape = beamMap[beamId];
    if (beamShape) {
        [beamShape.data.nodeI, beamShape.data.nodeJ].forEach((nodeId) => {
            const beams = nodeBeamMap[nodeId];
            if (beams) {
                // 削除対象の梁要素を除外
                const list = beams.filter((shape) => shape.data.id !== beamId);
                nodeBeamMap[nodeId] = list;
            }
        });
        // 梁要素を削除
        canvas.remove(beamShape.beam);
        if (beamShape.guide) {
            canvas.remove(beamShape.guide);
        }
        delete beamMap[beamId];
    }
};
