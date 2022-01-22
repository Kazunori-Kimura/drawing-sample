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

/**
 * 節点ピン
 */
export const NodePinTypes = ['free', 'pin', 'pinX', 'pinZ', 'fixX', 'fix'] as const;
export type NodePinType = typeof NodePinTypes[number];

export const isNodePinType = (item: unknown): item is NodePinType => {
    if (typeof item === 'string') {
        return NodePinTypes.some((type) => type === item);
    }
    return false;
};

export interface ShapeBase {
    id: string;
    name: string;
}
export const isShape = (item: unknown): item is ShapeBase => {
    if (item && typeof item === 'object') {
        const value = item as Record<string, unknown>;
        return typeof value.id === 'string' && typeof value.name === 'string';
    }
    return false;
};

export interface Node extends ShapeBase {
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

export interface Beam extends ShapeBase {
    nodeI: string;
    nodeJ: string;
}

export const isBeam = (item: unknown): item is Beam => {
    if (item && typeof item === 'object') {
        const value = item as Record<string, unknown>;
        return (
            typeof value.id === 'string' &&
            typeof value.name === 'string' &&
            typeof value.nodeI === 'string' &&
            typeof value.nodeJ === 'string'
        );
    }
    return false;
};

export interface Force extends ShapeBase {
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

export interface Trapezoid extends ShapeBase {
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
    version: string;
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
    version: '0.0.0',
    unit: defaultUnit,
    nodes: [],
    beams: [],
    forces: [],
    trapezoids: [],
};

export const ShapeTypes = ['node', 'beam', 'force', 'trapezoid', 'background'] as const;
export type ShapeType = typeof ShapeTypes[number];
export interface IShapeData extends ShapeBase {
    type: ShapeType;
    // SVGに変換する際に shape を対象外とする（背景グリッドなどに設定）
    excludeExport?: boolean;
}
