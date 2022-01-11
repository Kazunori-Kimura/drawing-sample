import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { Box } from 'konva/lib/shapes/Transformer';
import {
    Dispatch,
    MouseEvent,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Image, Rect, Transformer } from 'react-konva';
import useImage from 'use-image';
import { AppSettingsContext } from '../../../../providers/AppSettingsProvider';
import { NoteSettingsContext } from '../../../../providers/NoteSettingsProvider';
import { ShapeBaseProps } from '../../../../types/common';
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

const CanvasHandle: React.VFC<Props> = ({
    size,
    draggable = false,
    index,
    onChange,
    selected = false,
    onSelect,
    data,
    image: dataURL,
    ...props
}) => {
    const rectRef = useRef<Konva.Rect>(null);
    const tfRef = useRef<Konva.Transformer>(null);
    const [isDragging, setDragging] = useState(false);
    const [image] = useImage(dataURL ?? '');

    const { mode: noteMode } = useContext(NoteSettingsContext);
    const { mode: appMode, editCanvas, closeCanvas } = useContext(AppSettingsContext);

    const pageSize = useMemo(() => {
        return PageSize[size];
    }, [size]);

    const visibleMenu = useMemo(() => {
        return selected && !isDragging && noteMode === 'select';
    }, [isDragging, noteMode, selected]);

    const visibleTransformer = useMemo(() => {
        return draggable && selected;
    }, [draggable, selected]);

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
        (rect: ShapeBaseProps) => {
            onChange((page) => {
                const newPage = clone(page);
                const structure = newPage.structures[index];
                newPage.structures[index] = {
                    ...structure,
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
                const newRectProps: ShapeBaseProps = {
                    x,
                    y,
                    width,
                    height,
                };
                // ドラッグ終了
                setDragging(false);
                // 更新
                handleChange(newRectProps);
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
            const newRectProps: ShapeBaseProps = {
                x: rect.x(),
                y: rect.y(),
                width: Math.max(MinCanvasSize.width, rect.width() * scaleX),
                height: Math.max(MinCanvasSize.height, rect.height() * scaleY),
            };

            handleChange(newRectProps);
        }
    }, [handleChange]);

    const handleEdit = useCallback(
        (event: MouseEvent<HTMLButtonElement>) => {
            // ボタンの位置
            const { top, left } = event.currentTarget.getBoundingClientRect();

            // 編集開始
            const canvasProps: ShapeBaseProps = {
                x: left,
                y: top + 42,
                width: props.width,
                height: props.height,
            };
            editCanvas(canvasProps);
        },
        [editCanvas, props.height, props.width]
    );

    return (
        <>
            <Rect {...props} fill="white" />
            {image && <Image {...props} image={image} />}
            <Rect
                ref={rectRef}
                stroke="black"
                strokeWidth={2}
                draggable={draggable}
                {...props}
                onClick={onSelect}
                onTap={onSelect}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                onTransformEnd={handleTransformEnd}
            />
            <HeaderMenu
                visible={visibleMenu}
                mode={appMode}
                {...props}
                onEdit={handleEdit}
                onCancel={closeCanvas}
            />
            <Transformer
                ref={tfRef}
                visible={visibleTransformer}
                rotateEnabled={false}
                boundBoxFunc={handleChangeBoundBox}
            />
        </>
    );
};

export default CanvasHandle;
