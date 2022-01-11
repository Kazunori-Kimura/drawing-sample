import { LineCap, LineJoin } from 'konva/lib/Shape';
import { DOMSize } from './common';
import { emptyStructure, Structure } from './shape';

const NoteModes = ['select', 'edit'] as const;
export type NoteMode = typeof NoteModes[number];
export const isNoteMode = (item: unknown): item is NoteMode => {
    if (typeof item === 'string') {
        return NoteModes.some((mode) => mode === item);
    }
    return false;
};

export const PageSizeTypes = ['A4', 'A3', 'B5', 'B4'] as const;
export type PageSizeType = typeof PageSizeTypes[number];

export const PageSize: Record<PageSizeType, DOMSize> = {
    A3: {
        width: 0,
        height: 0,
    },
    A4: {
        width: 2970,
        height: 2100,
    },
    B4: {
        width: 0,
        height: 0,
    },
    B5: {
        width: 0,
        height: 0,
    },
};

export interface StructureCanvasProps {
    data: Structure;
    image?: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export const MinCanvasSize: DOMSize = {
    width: 160,
    height: 90,
};

export interface DrawingProps {
    stroke: string;
    strokeWidth: number;
    eraser?: boolean;
    points: number[];
    lineJoin?: LineJoin;
    lineCap?: LineCap;
}
export type DrawSettings = Omit<DrawingProps, 'points'>;
export const defaultDrawSettings: DrawSettings = {
    stroke: '#000000',
    strokeWidth: 4,
    eraser: false,
    lineJoin: 'round',
    lineCap: 'round',
};

export interface PageProps {
    size: PageSizeType;
    drawings: DrawingProps[];
    structures: StructureCanvasProps[];
}

export const defaultPageProps: PageProps = {
    size: 'A4',
    drawings: [],
    structures: [
        {
            data: emptyStructure,
            x: 100,
            y: 100,
            ...MinCanvasSize,
        },
    ],
};