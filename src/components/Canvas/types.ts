import { Beam, Force, Node } from '../../types/shape';

export interface BeamProps extends Omit<Beam, 'nodeI' | 'nodeJ'> {
    nodeI: Node;
    nodeJ: Node;
}

export interface ForceProps extends Omit<Force, 'beam'> {
    beam: BeamProps;
    forceRatio: number;
}

export interface Shape {
    type: 'beams' | 'forces';
    id: string;
}
