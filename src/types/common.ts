export interface DOMSize {
    width: number;
    height: number;
}

export const CanvasTools = ['select', 'pen', 'force', 'trapezoid'] as const;
export type CanvasTool = typeof CanvasTools[number];
export const isCanvasTool = (item: unknown): item is CanvasTool => {
    if (typeof item === 'string') {
        return CanvasTools.some((tool) => tool === item);
    }
    return false;
};
