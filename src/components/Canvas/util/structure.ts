import { v4 as uuid } from 'uuid';
import { Beam, Force, Node } from '../../../types/shape';
import { round } from './common';
import { Vector } from './vector';

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
