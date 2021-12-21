import { Dispatch, SetStateAction } from 'react';
import { Stage } from 'react-konva';
import { CanvasTool, DOMSize } from '../../types/common';
import { Structure } from '../../types/shape';
import { useDraw } from './hook/draw';
import DrawLayer from './layer/DrawLayer';
import GridLayer from './layer/GridLayer';
import GuideLayer from './layer/GuideLayer';
import ShapeLayer from './layer/ShapeLayer';
import SelectProvider from './provider/SelectProvider';
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
    const { points, ...handlers } = useDraw({
        disabled: readonly || tool !== 'pen',
        structure,
        setStructure,
    });

    return (
        <Stage width={size.width} height={size.height} {...handlers}>
            <StructureProvider
                size={size}
                structure={structure}
                tool={tool}
                setStructure={setStructure}
            >
                <SelectProvider>
                    <GridLayer />
                    <GuideLayer />
                    <ShapeLayer />
                    <DrawLayer points={points} />
                </SelectProvider>
            </StructureProvider>
        </Stage>
    );
};

export default CanvasCore;
