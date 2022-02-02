// 消しゴム対応のため fabric の型定義を拡張
// http://fabricjs.com/erasing
declare namespace fabric {
    class EraserBrush extends BaseBrush {
        /**
         * Constructor
         * @param {Canvas} canvas
         */
        constructor(canvas: Canvas);
        /**
         * Constructor
         * @param {Canvas} canvas
         * @return {EraserBrush} Instance of a eraser brush
         */
        initialize(canvas: Canvas): EraserBrush;

        /**
         * Converts points to SVG path
         * @param points Array of points
         */
        convertPointsToSVGPath(
            points: Array<{ x: number; y: number }>,
            minX?: number,
            minY?: number
        ): string[];

        /**
         * Creates fabric.Path object to add on canvas
         * @param pathData Path data
         */
        createPath(pathData: string): Path;
    }

    interface IObjectOptions {
        /**
         * The object’s erasable property (boolean | 'deep') is used to determine if it is erasable or not. By default it is set to true.
         */
        erasable?: boolean | 'deep';
    }
}
