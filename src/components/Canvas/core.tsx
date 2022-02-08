import {
    forwardRef,
    useContext,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useRef,
} from 'react';
import { CanvasTool, DOMSize } from '../../types/common';
import { defaultCanvasProps, StructureCanvasProps } from '../../types/note';
import CanvasManager from './manager';
import { PopupContext } from './provider/PopupProvider';
import { CanvasCoreHandler } from './types';

interface Props extends StructureCanvasProps {
    canvasSize: DOMSize;
    readonly?: boolean;
    tool: CanvasTool;
    snapSize?: number;
    gridSize?: number;
}

const CanvasCore: React.ForwardRefRenderFunction<CanvasCoreHandler, Props> = (
    { tool, canvasSize, ...props },
    ref
) => {
    const { open } = useContext(PopupContext);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const managerRef = useRef<CanvasManager>();

    useImperativeHandle(ref, () => ({
        getStructure: () => {
            if (managerRef.current) {
                return managerRef.current.toCanvasProps();
            }
            return defaultCanvasProps;
        },
    }));

    // 初期化
    useLayoutEffect(() => {
        if (canvasRef.current && canvasSize.width !== 0 && canvasSize.height !== 0) {
            if (typeof managerRef.current === 'undefined') {
                managerRef.current = new CanvasManager(canvasRef.current, props, open);
            } else {
                managerRef.current.resize(canvasSize);
            }
        }
    }, [canvasSize, open, props]);

    // ツールが変更された場合
    useEffect(() => {
        if (managerRef.current && managerRef.current.tool !== tool) {
            managerRef.current.setTool(tool);
        }
    }, [tool]);

    return <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} />;
};

export default forwardRef(CanvasCore);
