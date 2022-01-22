import { StructureCanvasProps } from '../../types/note';

export type BeamPoints = [number, number, number, number];

export interface Shape {
    type: 'beams' | 'forces' | 'trapezoids';
    id: string;
}

export type Point = [number, number];

export interface CanvasCoreHandler {
    toDataURL: () => string | undefined;
    getStructure: () => StructureCanvasProps;
}
