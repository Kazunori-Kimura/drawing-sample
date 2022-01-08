import { Beam, Force, Node, Trapezoid } from '../../types/shape';

export interface BeamProps extends Omit<Beam, 'nodeI' | 'nodeJ'> {
    nodeI: Node;
    nodeJ: Node;
}

export interface ForceProps extends Omit<Force, 'beam'> {
    beam: BeamProps;
    forceRatio: number;
}

export interface TrapezoidProps extends Omit<Trapezoid, 'beam'> {
    beam: BeamProps;
}

export interface Shape {
    type: 'beams' | 'forces' | 'trapezoids';
    id: string;
}

export type Point = [number, number];

export interface CanvasCoreHandler {
    toDataURL: () => string | undefined;
}
