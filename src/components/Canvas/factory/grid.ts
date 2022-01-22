import { fabric } from 'fabric';

const defaultGridLineProps: fabric.ILineOptions = {
    stroke: '#eee',
    strokeWidth: 1,
    // イベントに反応させない
    evented: false,
    hasControls: false,
    selectable: false,
    // 出力対象外
    excludeFromExport: true,
    data: {
        type: 'background',
        excludeExport: true,
    },
};

/**
 * 背景のグリッド線を描画する
 * @param width
 * @param height
 * @param gridSize
 * @returns
 */
export const createGrid = (width: number, height: number, gridSize: number): fabric.Line[] => {
    const lines: fabric.Line[] = [];

    for (let y = 0; y <= height; y += 25) {
        const hl = new fabric.Line([0, y, width, y], { ...defaultGridLineProps });
        lines.push(hl);
    }
    for (let x = 0; x <= width; x += 25) {
        const vl = new fabric.Line([x, 0, x, height], { ...defaultGridLineProps });
        lines.push(vl);
    }

    return lines;
};
