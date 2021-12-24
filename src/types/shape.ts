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
export const isForce = (item: unknown): item is Force => {
    if (item && typeof item === 'object') {
        const value = item as Record<string, unknown>;
        return (
            typeof value.id === 'string' &&
            typeof value.name === 'string' &&
            typeof value.beam === 'string' &&
            typeof value.force === 'number' &&
            typeof value.distanceI === 'number'
        );
    }
    return false;
};

export interface Trapezoid {
    id: string;
    name: string;
    beam: string;
    // kN/m
    forceI: number;
    // kN/m
    forceJ: number;
    // i端からの距離 (0 〜 1, distanceI + distanceJ <= 1)
    distanceI: number;
    // j端からの距離 (0 〜 1, distanceI + distanceJ <= 1)
    distanceJ: number;
    // 角度、デフォルト 90度、-179 〜 180 度の間で指定 (-180 = 180)
    angle?: number;
    // 全体座標系に垂直か、部材に垂直か デフォルト false
    isGlobal?: boolean;
}

export interface Structure {
    unit: Unit;
    nodes: Node[];
    beams: Beam[];
    forces: Force[];
    trapezoids: Trapezoid[];
}

export type StructureFieldType = keyof Omit<Structure, 'unit'>;

export const defaultUnit: Unit = {
    force: 'kN',
    length: 'm',
};

export const emptyStructure: Structure = {
    unit: defaultUnit,
    nodes: [],
    beams: [],
    forces: [],
    trapezoids: [],
};
