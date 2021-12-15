export interface DOMSize {
    width: number;
    height: number;
}

export const CanvasTools = ['select', 'pen', 'force', 'trapezoid'] as const;
export type CanvasTool = typeof CanvasTools[number];
