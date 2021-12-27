export interface DOMSize {
    width: number;
    height: number;
}

export const CanvasTools = ['select', 'pen', 'force', 'trapezoid', 'delete'] as const;
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
