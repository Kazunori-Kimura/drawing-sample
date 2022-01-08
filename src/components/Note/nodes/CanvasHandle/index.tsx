import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { Box } from 'konva/lib/shapes/Transformer';
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Rect, Transformer } from 'react-konva';
import {
    MinCanvasSize,
    PageProps,
    PageSize,
    PageSizeType,
    StructureCanvasProps,
} from '../../../../types/note';
import { clone } from '../../../Canvas/util';
import HeaderMenu from './HeaderMenu';

interface Props extends StructureCanvasProps {
    // ページ情報
    size: PageSizeType;
    draggable?: boolean;
    // キャンバス情報
    index: number;
    onChange: Dispatch<SetStateAction<PageProps>>;
    // 選択状態
    selected?: boolean;
    onSelect: VoidFunction;
}

interface HandleProps {
    x: number;
    y: number;
    width: number;
    height: number;
}
const defaultHandleProps: HandleProps = {
    x: 0,
    y: 0,
    ...MinCanvasSize,
};
const equalsProps = (a: HandleProps, b: HandleProps): boolean => {
    return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
};

const CanvasHandle: React.VFC<Props> = ({
    size,
    draggable = false,
    index,
    onChange,
    selected = false,
    onSelect,
    data,
    ...props
}) => {
    const rectRef = useRef<Konva.Rect>(null);
    const tfRef = useRef<Konva.Transformer>(null);

    const [rectProps, setRectProps] = useState<HandleProps>(defaultHandleProps);
    const [isDragging, setDragging] = useState(false);

    const pageSize = useMemo(() => {
        return PageSize[size];
    }, [size]);

    // 位置/サイズの初期化
    useEffect(() => {
        if (!equalsProps(props, rectProps)) {
            setRectProps({ ...props });
        }
    }, [props, rectProps]);

    // 選択時にサイズ変更を可能にする
    useEffect(() => {
        if (selected && tfRef.current && rectRef.current) {
            tfRef.current.nodes([rectRef.current]);
            // 強制描画
            tfRef.current.getLayer()?.batchDraw();
        }
    }, [selected]);

    /**
     * 位置/サイズ変更の確定
     */
    const handleChange = useCallback(
        (rect: HandleProps) => {
            onChange((page) => {
                const newPage = clone(page);
                const d = newPage.structures[index].data;
                newPage.structures[index] = {
                    data: d,
                    ...rect,
                };

                return newPage;
            });
        },
        [index, onChange]
    );

    /**
     * ドラッグ開始
     */
    const handleDragStart = useCallback(() => {
        setDragging(true);
    }, []);

    /**
     * 移動
     */
    const handleDragMove = useCallback(
        (event: KonvaEventObject<Event>) => {
            // イベントを伝播させない
            event.cancelBubble = true;

            if (rectRef.current) {
                // ドラッグした位置
                const { x, y } = event.target.attrs;
                if (typeof x === 'number' && typeof y === 'number') {
                    // 位置がページサイズの範囲内になるように x, y を補正
                    const { width, height } = rectRef.current.getSize();
                    let [newX, newY] = [x, y];

                    if (newX < 0) {
                        newX = 0;
                    } else if (newX > pageSize.width - width) {
                        newX = pageSize.width - width;
                    }
                    if (newY < 0) {
                        newY = 0;
                    } else if (newY > pageSize.height - height) {
                        newY = pageSize.height - height;
                    }

                    if (x !== newX || y !== newY) {
                        rectRef.current.setPosition({ x: newX, y: newY });
                    }
                }
            }
        },
        [pageSize.height, pageSize.width]
    );

    /**
     * 移動の確定
     */
    const handleDragEnd = useCallback(
        (_: KonvaEventObject<Event>) => {
            if (rectRef.current) {
                // 現在位置を取得
                const { x, y } = rectRef.current.getPosition();
                const { width, height } = rectRef.current.getSize();
                const newRectProps: HandleProps = {
                    x,
                    y,
                    width,
                    height,
                };
                // 更新
                handleChange(newRectProps);
                // ドラッグ終了
                setDragging(false);
            }
        },
        [handleChange]
    );

    /**
     * サイズを最小値以下にできないように制限
     */
    const handleChangeBoundBox = useCallback((oldBox: Box, newBox: Box) => {
        if (newBox.width < MinCanvasSize.width || newBox.height < MinCanvasSize.height) {
            return oldBox;
        }
        return newBox;
    }, []);

    /**
     * サイズ変更の確定
     */
    const handleTransformEnd = useCallback(() => {
        if (rectRef.current) {
            const rect = rectRef.current;
            const { x: scaleX, y: scaleY } = rect.scale();
            // reset scale
            rect.scale({ x: 1, y: 1 });
            const newRectProps: HandleProps = {
                x: rect.x(),
                y: rect.y(),
                width: Math.max(MinCanvasSize.width, rect.width() * scaleX),
                height: Math.max(MinCanvasSize.height, rect.height() * scaleY),
            };

            handleChange(newRectProps);
        }
    }, [handleChange]);

    return (
        <>
            <Rect
                ref={rectRef}
                fill="orange"
                stroke="black"
                strokeWidth={2}
                draggable={draggable}
                {...rectProps}
                onClick={onSelect}
                onTap={onSelect}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                onTransformEnd={handleTransformEnd}
            />
            {selected && (
                <>
                    {!isDragging && <HeaderMenu {...rectProps} />}
                    <Transformer
                        ref={tfRef}
                        rotateEnabled={false}
                        boundBoxFunc={handleChangeBoundBox}
                    />
                </>
            )}
        </>
    );
};

export default CanvasHandle;
