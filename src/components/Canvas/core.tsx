import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { forwardRef, useCallback, useContext, useImperativeHandle, useRef } from 'react';
import { Stage } from 'react-konva';
import { useContextBridge } from '../../hooks/useContextBridge';
import { AppSettingsContext } from '../../providers/AppSettingsProvider';
import DrawLayer from './layer/DrawLayer';
import GridLayer from './layer/GridLayer';
import GuideLayer from './layer/GuideLayer';
import ShapeLayer from './layer/ShapeLayer';
import Popup from './popup';
import { CanvasContext } from './provider/CanvasProvider';
import { DrawContext } from './provider/DrawProvider';
import { PopupContext } from './provider/PopupProvider';
import { CanvasCoreHandler } from './types';

const CanvasCore: React.ForwardRefRenderFunction<CanvasCoreHandler> = (_, ref) => {
    const { mode } = useContext(AppSettingsContext);
    const { tool, size, getStructure, clearSelection } = useContext(CanvasContext);
    const { close } = useContext(PopupContext);
    const { onPointerDown, onPointerMove, onPointerUp } = useContext(DrawContext);

    const ContextBridge = useContextBridge(CanvasContext, PopupContext, DrawContext);

    const canvasRef = useRef<Konva.Stage>(null);

    useImperativeHandle(
        ref,
        () => ({
            toDataURL: () => {
                if (canvasRef.current) {
                    return canvasRef.current.toDataURL();
                }
            },
            getStructure,
        }),
        [getStructure]
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
                clearSelection();
            }
        },
        [clearSelection, close, tool]
    );

    return (
        <>
            <Stage
                ref={canvasRef}
                width={size.width}
                height={size.height}
                listening={mode === 'canvas'}
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
