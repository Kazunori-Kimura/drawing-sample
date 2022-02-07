declare namespace fabric {
    /**
     * 消しゴムブラシ
     * @see http://fabricjs.com/erasing
     */
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

    /**
     * タッチジェスチャーイベント
     * @see https://stackoverflow.com/questions/45110576/fabricjs-touch-pan-zoom-entire-canvas
     */
    interface IGestureEvent<E extends Event = Event> extends IEvent<E> {
        self?: {
            enabled: boolean;
            fingers: number;
            gesture: string;
            rotation: number;
            scale: number;
            state: string;
            target: HTMLElement;
            touches: Array<{ x: number; y: number }>;
            x: number;
            y: number;
        };
    }
}
