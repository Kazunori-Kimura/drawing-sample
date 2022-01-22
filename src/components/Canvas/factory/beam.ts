import { fabric } from 'fabric';
import { BeamPoints } from '../types';
import { Vector } from '../util';

type CreateBeamFunction = {
    (points: BeamPoints, options?: fabric.ILineOptions): fabric.Line;
    (vi: Vector, vj: Vector, options?: fabric.ILineOptions): fabric.Line;
};

const createBeamByVectors = (vi: Vector, vj: Vector, options: fabric.ILineOptions): fabric.Line => {
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

    return beam;
};

const createBeamByPoints = (points: BeamPoints, options: fabric.ILineOptions): fabric.Line => {
    const p1 = new Vector(points[0], points[1]);
    const p2 = new Vector(points[2], points[3]);
    return createBeamByVectors(p1, p2, options);
};

export const createBeam: CreateBeamFunction = (
    arg1: BeamPoints | Vector,
    arg2?: Vector | fabric.ILineOptions,
    arg3?: fabric.ILineOptions
) => {
    if (Array.isArray(arg1)) {
        return createBeamByPoints(arg1, (arg2 as fabric.ILineOptions) ?? {});
    } else if (arg2) {
        return createBeamByVectors(arg1, arg2 as Vector, arg3 ?? {});
    }
    throw new Error('invalid parameters');
};
