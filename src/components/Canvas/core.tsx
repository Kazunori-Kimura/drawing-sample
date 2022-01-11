import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { forwardRef, useCallback, useContext, useImperativeHandle, useRef } from 'react';
import { Stage } from 'react-konva';
import { useContextBridge } from '../../hooks/useContextBridge';
import DrawLayer from './layer/DrawLayer';
import GridLayer from './layer/GridLayer';
import GuideLayer from './layer/GuideLayer';
import ShapeLayer from './layer/ShapeLayer';
import Popup from './popup';
import { DrawContext } from './provider/DrawProvider';
import { PopupContext } from './provider/PopupProvider';
import { SelectContext } from './provider/SelectProvider';
import { StructureContext } from './provider/StructureProvider';
import { CanvasCoreHandler } from './types';

const CanvasCore: React.ForwardRefRenderFunction<CanvasCoreHandler> = (_, ref) => {
    const { structure, tool, size } = useContext(StructureContext);
    const { setSelected } = useContext(SelectContext);
    const { close } = useContext(PopupContext);
    const { onPointerDown, onPointerMove, onPointerUp } = useContext(DrawContext);

    const ContextBridge = useContextBridge(
        StructureContext,
        PopupContext,
        SelectContext,
        DrawContext
    );

    const canvasRef = useRef<Konva.Stage>(null);

    useImperativeHandle(
        ref,
        () => ({
            toDataURL: () => {
                if (canvasRef.current) {
                    return canvasRef.current.toDataURL();
                }
            },
            getStructure: () => structure,
        }),
        [structure]
    );

    /**
     * Stage のクリック
     */
    const handleClick = useCallback(
        (_: KonvaEventObject<PointerEvent>) => {
            // ポップオーバーを閉じる
            close();

            if (tool === 'select') {
                // 選択解除
                setSelected([]);
            }
        },
        [close, setSelected, tool]
    );

    return (
        <>
            <Stage
                ref={canvasRef}
                width={size.width}
                height={size.height}
                onClick={handleClick}
                onTap={handleClick}
                {...{ onPointerDown, onPointerMove, onPointerUp }}
            >
                <ContextBridge>
                    <GridLayer />
                    <GuideLayer />
                    <ShapeLayer />
                    <DrawLayer />
                </ContextBridge>
            </Stage>
            {/* ポップアップ */}
            <Popup />
        </>
    );
};

export default forwardRef(CanvasCore);
