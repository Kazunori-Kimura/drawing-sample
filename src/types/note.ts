import { DOMSize, ShapeCoordinates, SizePosition } from './common';
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

export interface StructureCanvasProps extends SizePosition {
    id: string;
    data: Structure;
    /**
     * SVG文字列 fabric.loadSVGFromString でパースする
     */
    image?: string;
    zoom: number;
    viewport: number[];
}

export const MinCanvasSize: DOMSize = {
    width: 160,
    height: 90,
};

export const defaultCanvasProps: StructureCanvasProps = {
    id: 'Canvas_1',
    data: emptyStructure,
    x: 100,
    y: 100,
    ...MinCanvasSize,
    zoom: 1,
    viewport: [1, 0, 0, 1, 0, 0],
};

export interface DrawSettings {
    stroke: string;
    strokeWidth: number;
    eraser?: boolean;
}
export const defaultDrawSettings: DrawSettings = {
    stroke: '#000000',
    strokeWidth: 4,
    eraser: false,
};

export interface PageProps {
    size: PageSizeType;
    zoom: number;
    viewport: number[];
    /**
     * 構造データ
     */
    structures: StructureCanvasProps[];
    /**
     * 描画データ fabric.Canvas.toJSON() で取得した文字列
     * fabric.Canvas.loadFromJSON でパースする
     */
    drawData?: string;
}

export const defaultPageProps: PageProps = {
    size: 'A4',
    zoom: 1,
    viewport: [1, 0, 0, 1, 0, 0],
    structures: [
        {
            ...defaultCanvasProps,
        },
    ],
};

/**
 * キャンバスの更新完了時にノートに更新内容を引き渡すコールバック関数
 */
export type CommitStructureFunction = (structure: StructureCanvasProps) => void;

/**
 * キャンバスのデータ + ナビゲーションの表示位置情報
 */
export interface StructureCanvasState extends StructureCanvasProps {
    coordinates: ShapeCoordinates;
}
