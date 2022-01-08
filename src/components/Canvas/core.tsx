import { KonvaEventObject } from 'konva/lib/Node';
import { Dispatch, SetStateAction, useCallback, useContext } from 'react';
import { Stage } from 'react-konva';
import { CanvasTool, DOMSize } from '../../types/common';
import { Structure } from '../../types/shape';
import DrawLayer from './layer/DrawLayer';
import GridLayer from './layer/GridLayer';
import GuideLayer from './layer/GuideLayer';
import ShapeLayer from './layer/ShapeLayer';
import Popup from './popup';
import DrawProvider, { DrawContext } from './provider/DrawProvider';
import PopupProvider, { PopupContext } from './provider/PopupProvider';
import SelectProvider, { SelectContext } from './provider/SelectProvider';
import StructureProvider from './provider/StructureProvider';

export interface CanvasProps {
    tool: CanvasTool;
    structure: Structure;
    size: DOMSize;
    readonly?: boolean;
    setStructure?: Dispatch<SetStateAction<Structure>>;
}

const CanvasCore: React.VFC<CanvasProps> = ({
    tool,
    structure,
    size,
    readonly = false,
    setStructure,
}) => {
    const { selected, setSelected } = useContext(SelectContext);
    const { popupType, setPopupType, popupPosition, setPopupPosition, close } =
        useContext(PopupContext);
    const { points, onPointerDown, onPointerMove, onPointerUp, ...drawContextValues } =
        useContext(DrawContext);

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
        <Stage
            width={size.width}
            height={size.height}
            onClick={handleClick}
            onTap={handleClick}
            {...{ onPointerDown, onPointerMove, onPointerUp }}
        >
            <StructureProvider
                size={size}
                structure={structure}
                tool={tool}
                setStructure={setStructure}
            >
                <PopupProvider value={{ popupType, setPopupType, popupPosition, setPopupPosition }}>
                    <SelectProvider value={{ selected, setSelected }}>
                        <DrawProvider value={{ points, ...drawContextValues }}>
                            <GridLayer />
                            <GuideLayer />
                            <ShapeLayer />
                            <DrawLayer />
                            {/* ポップアップ */}
                            <Popup />
                        </DrawProvider>
                    </SelectProvider>
                </PopupProvider>
            </StructureProvider>
        </Stage>
    );
};

export default CanvasCore;
