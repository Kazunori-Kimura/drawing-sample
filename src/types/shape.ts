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

export const NodePinTypes = ['free', 'pin', 'pinX', 'pinZ', 'fixX', 'fix'] as const;
export type NodePinType = typeof NodePinTypes[number];

export const isNodePinType = (item: unknown): item is NodePinType => {
    if (typeof item === 'string') {
        return NodePinTypes.some((type) => type === item);
    }
    return false;
};

export interface Node {
    id: string;
    x: number;
    y: number;
    pin?: NodePinType;
}

export const isNode = (item: unknown): item is Node => {
    if (item && typeof item === 'object') {
        const value = item as Record<string, unknown>;
        return (
            typeof value.id === 'string' &&
            typeof value.x === 'number' &&
            typeof value.y === 'number'
        );
    }
    return false;
};

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

export const isTrapezoid = (item: unknown): item is Trapezoid => {
    if (item && typeof item === 'object') {
        const value = item as Record<string, unknown>;
        return (
            typeof value.id === 'string' &&
            typeof value.name === 'string' &&
            typeof value.beam === 'string' &&
            typeof value.forceI === 'number' &&
            typeof value.distanceI === 'number' &&
            typeof value.forceJ === 'number' &&
            typeof value.distanceJ === 'number'
        );
    }
    return false;
};

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
