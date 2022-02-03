import { v4 as uuid } from 'uuid';
import { Beam, Force, Node, Structure, Trapezoid } from '../../../types/shape';
import { round } from './common';
import { Vector } from './vector';

/**
 * 節点の作成
 * @param x
 * @param y
 * @returns
 */
export const createNode = (x: number, y: number): Node => {
    return {
        id: uuid(),
        name: 'node',
        x,
        y,
    };
};

export const createBeam = (name: string, nodeI: string, nodeJ: string): Omit<Beam, 'id'> => {
    return {
        name,
        nodeI,
        nodeJ,
    };
};

// type CreateForceParams = Omit<Force, 'id'>;

// export const createForce = (params: CreateForceParams): Force => {
//     return {
//         ...params,
//         id: uuid(),
//     };
// };

export const createForceParams = (
    beam: string,
    vi: Vector,
    vj: Vector,
    vp: Vector
): Omit<Force, 'id' | 'name'> => {
    const beamLength = vi.distance(vj);
    // クリック位置までの距離
    const distance = vi.distance(vp);

    return {
        beam,
        force: 10,
        distanceI: round(distance / beamLength),
    };
};

export const replaceNode = (structure: Structure, targetId: string, newId: string): Structure => {
    structure.beams.forEach((beam) => {
        if (beam.nodeI === targetId) {
            beam.nodeI = newId;
        }
        if (beam.nodeJ === targetId) {
            beam.nodeJ = newId;
        }
    });
    return structure;
};

export const createTrapezoid = (
    start: number[],
    end: number[],
    beamId: string,
    beamPoints: number[]
): Trapezoid => {
    // 梁要素の情報
    const pi = beamPoints.slice(0, 2);
    const pj = beamPoints.slice(-2);
    const bi = new Vector(pi[0], pi[1]);
    const bj = new Vector(pj[0], pj[1]);
    const beamLength = bi.distance(bj);
    const beamDirection = bj.clone().subtract(bi).normalize();

    // ドラッグ開始点/終了点
    let ps = new Vector(start[0], start[1]);
    let pe = new Vector(end[0], end[1]);
    // 開始点と終了点のどちらが i端に近い？
    let disStart = bi.distance(ps);
    let disEnd = bi.distance(pe);
    if (disStart > disEnd) {
        // 終了点の方が i端に近ければ入れ替える
        [ps, pe] = [pe, ps];
        [disStart, disEnd] = [disEnd, disStart];
    }

    // 分布荷重の開始点を梁要素上の座標に取り直す
    const ti = bi.clone().add(beamDirection.clone().multiplyScalar(disStart));
    // ドラッグ方向
    const dir = pe.clone().subtract(ti).normalize();
    // 梁要素とドラッグ方向が成す角度
    const angle = beamDirection.angle() - dir.angle();
    // 開始点からドラッグ終了点までの長さ
    const dragLength = ti.distance(pe);
    // 角度と長さから分布荷重の終了点を計算する
    const r = dragLength * Math.cos(angle);
    const tj = ti.clone().add(beamDirection.clone().multiplyScalar(r));
    // j端から分布荷重の終了点までの距離を取り直す
    disEnd = bj.distance(tj);

    // i端から開始点までの比率
    const distanceI = round(disStart / beamLength, 3);
    const distanceJ = round(disEnd / beamLength, 3);

    const trapezoid: Trapezoid = {
        id: uuid(),
        name: 'Trapezoid_N', //仮に名前を設定
        beam: beamId,
        forceI: 10,
        forceJ: 10,
        distanceI,
        distanceJ,
        angle: 90,
        isGlobal: false,
    };

    return trapezoid;
};
