import { forwardRef, useContext, useEffect, useImperativeHandle, useRef } from 'react';
import { CanvasTool } from '../../types/common';
import { defaultCanvasProps, StructureCanvasProps } from '../../types/note';
import CanvasManager from './manager';
import { PopupContext } from './provider/PopupProvider';
import { CanvasCoreHandler } from './types';

interface Props extends StructureCanvasProps {
    readonly?: boolean;
    tool: CanvasTool;
    snapSize?: number;
    gridSize?: number;
}

const CanvasCore: React.ForwardRefRenderFunction<CanvasCoreHandler, Props> = (
    { tool, ...props },
    ref
) => {
    const { open } = useContext(PopupContext);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const managerRef = useRef<CanvasManager>();

    useImperativeHandle(ref, () => ({
        // TODO: 実装
        toDataURL: () => 'hoge',
        getStructure: () => defaultCanvasProps,
    }));

    // 初期化
    useEffect(() => {
        let manager = managerRef.current;
        if (canvasRef.current) {
            if (typeof manager === 'undefined') {
                manager = new CanvasManager(canvasRef.current, props, open);
                managerRef.current = manager;
            }
        }
    }, [open, props]);

    // ツールが変更された場合
    useEffect(() => {
        if (managerRef.current && managerRef.current.tool !== tool) {
            managerRef.current.setTool(tool);
        }
    }, [tool]);

    return <canvas ref={canvasRef} width={props.width} height={props.height} />;
};

export default forwardRef(CanvasCore);
