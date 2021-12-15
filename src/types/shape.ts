/**
 * 単位: 力
 */
export const ForceUnitValues = ['N', 'kN'] as const;

/**
 * 単位: 長さ
 */
export const LengthUnitValues = ['mm', 'cm', 'm'] as const;

export type ForceUnitType = typeof ForceUnitValues[number];
export type LengthUnitType = typeof LengthUnitValues[number];

/**
 * 単位
 */
export interface Unit {
    force: ForceUnitType;
    length: LengthUnitType;
}

export interface Node {
    id: string;
    x: number;
    y: number;
}

export interface Beam {
    id: string;
    name: string;
    nodeI: string;
    nodeJ: string;
}

export interface Force {
    id: string;
    name: string;
    beam: string;
    force: number;
    // i端からの距離 (0 〜 1)
    distanceI: number;
}

export interface Trapezoid {
    id: string;
    name: string;
    beam: string;
    forceI: number;
    forceJ: number;
    // i端からの距離 (0 〜 1, distanceI + distanceJ <= 1)
    distanceI: number;
    // j端からの距離 (0 〜 1, distanceI + distanceJ <= 1)
    distanceJ: number;
}

export interface Structure {
    unit: Unit;
    nodes: Node[];
    beams: Beam[];
    forces: Force[];
    trapezoids: Trapezoid[];
}
