import { v4 as uuid } from 'uuid';
import { Beam, Force, Node, Structure } from '../../../types/shape';
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
        x,
        y,
    };
};

export const createBeam = (name: string, nodeI: string, nodeJ: string): Beam => {
    return {
        id: uuid(),
        name,
        nodeI,
        nodeJ,
    };
};

type CreateForceParams = Omit<Force, 'id'>;

export const createForce = (params: CreateForceParams): Force => {
    return {
        ...params,
        id: uuid(),
    };
};

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
        force: 10, // TODO: どうやって指定する？
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
