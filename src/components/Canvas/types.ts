import { Beam, Force, Structure, Trapezoid } from '../../types/shape';

export type BeamPoints = [number, number, number, number];

export interface BeamProps extends Beam {
    points: BeamPoints;
}

export interface ForceProps extends Force {
    points: BeamPoints;
}

export interface TrapezoidProps extends Trapezoid {
    points: BeamPoints;
}

export interface Shape {
    type: 'beams' | 'forces' | 'trapezoids';
    id: string;
}

export type Point = [number, number];

export interface CanvasCoreHandler {
    toDataURL: () => string | undefined;
    getStructure: () => Structure;
}
