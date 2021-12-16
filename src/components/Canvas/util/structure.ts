import { v4 as uuid } from 'uuid';
import { Beam, Force, Node } from '../../../types/shape';

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
