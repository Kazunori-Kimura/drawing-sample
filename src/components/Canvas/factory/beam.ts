import { fabric } from 'fabric';
import { Beam, isBeam } from '../../../types/shape';
import { BeamPoints } from '../types';
import { Vector } from '../util';

export type BeamShape = {
    data: Beam;
    beam: fabric.Line;
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
    const dir = vj.clone().subtract(vi).normalize();
    // 長さ
    const distance = vi.distance(vj);
    // 角度 (Vector では Y軸が上方向なので 上下反転させる)
    const angle = 180 - dir.verticalAngleDeg();

    const beam = new fabric.Line([0, 0, 0, distance], {
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

    return { data, beam };
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
    (beam: fabric.Line, points: BeamPoints): void;
    (beam: fabric.Line, vi: Vector, vj: Vector): void;
};

const updateBeamByVectors = (beam: fabric.Line, vi: Vector, vj: Vector): void => {
    // 方向
    const dir = vj.clone().subtract(vi).normalize();
    // 長さ
    const distance = vi.distance(vj);
    // 角度 (Vector では Y軸が上方向なので 上下反転させる)
    const angle = 180 - dir.verticalAngleDeg();

    // dirty=true を指定していないと、一定の長さ以下の梁要素が描画できない
    beam.dirty = true;
    beam.top = vi.y;
    beam.left = vi.x;
    beam.height = distance;
    beam.rotate(angle);
};

const updateBeamByPoints = (beam: fabric.Line, points: BeamPoints): void => {
    const p1 = new Vector(points[0], points[1]);
    const p2 = new Vector(points[2], points[3]);
    updateBeamByVectors(beam, p1, p2);
};

export const updateBeam: UpdateBeamFunction = (
    arg1: fabric.Line,
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
