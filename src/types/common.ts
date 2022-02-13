// --- app 共通 ---
export interface DOMSize {
    width: number;
    height: number;
}
export interface DOMPosition {
    top: number;
    left: number;
}

export interface ShapePosition {
    x: number;
    y: number;
}

export type SizePosition = DOMSize & ShapePosition;

export const EventTypes = ['touch', 'mouse'] as const;
export type EventType = typeof EventTypes[number];

export const AppModes = ['note', 'canvas'] as const;
export type AppMode = typeof AppModes[number];

// --- canvas関係 ---

export const CanvasTools = ['select', 'pen', 'force', 'moment', 'trapezoid', 'delete'] as const;
export type CanvasTool = typeof CanvasTools[number];
export const isCanvasTool = (item: unknown): item is CanvasTool => {
    if (typeof item === 'string') {
        return CanvasTools.some((tool) => tool === item);
    }
    return false;
};

export const isNumberArray = (item: unknown): item is number[] => {
    if (Array.isArray(item)) {
        if (item.length === 0) {
            return true;
        }

        return item.every((value) => typeof value === 'number');
    }
    return false;
};

export const isLinePoints = (item: unknown): item is [number, number, number, number] => {
    if (isNumberArray(item)) {
        return item.length === 4;
    }
    return false;
};

// fabric の座標
export type Point = {
    x: number;
    y: number;
};

export interface ShapeCoordinates {
    tl: Point;
    tr: Point;
    bl: Point;
    br: Point;
}

export const isPoint = (item: unknown): item is Point => {
    if (item && typeof item === 'object') {
        const value = item as Record<string, unknown>;
        return typeof value.x === 'number' && typeof value.y === 'number';
    }
    return false;
};

export const isShapeCoordinates = (item: unknown): item is ShapeCoordinates => {
    if (item && typeof item === 'object') {
        const value = item as Record<string, unknown>;
        return isPoint(value.tl) && isPoint(value.tr) && isPoint(value.bl) && isPoint(value.br);
    }
    return false;
};
