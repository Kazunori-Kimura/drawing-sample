import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useRef,
} from 'react';
import { AppMode, DOMSize, SizePosition } from '../../types/common';
import { DrawSettings, NoteMode, PageProps, StructureCanvasProps } from '../../types/note';
import PageManager from './manager';

interface Props extends PageProps {
    mode: AppMode;
    tool: NoteMode;
    viewSize: DOMSize;
    drawSettings: DrawSettings;
}

interface PageHandler {
    getActiveStructure: () => StructureCanvasProps | undefined;
    setActiveStructure: (prosp: StructureCanvasProps) => void;
}

const Page: React.ForwardRefRenderFunction<PageHandler, Props> = (
    { mode, tool, viewSize, drawSettings, ...props },
    ref
) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const managerRef = useRef<PageManager>();

    useImperativeHandle(ref, () => ({
        getActiveStructure: () => {
            if (managerRef.current) {
                return managerRef.current.activeStructure;
            }
        },
        setActiveStructure: (props: StructureCanvasProps) => {
            if (managerRef.current) {
                managerRef.current.activeStructure = props;
            }
        },
    }));

    /**
     * 選択された構造データに編集メニューを表示する
     */
    const showCanvasNavigation = useCallback((params: SizePosition) => {
        console.log('showCanvasNavigation:', params);
    }, []);

    // 初期化
    useLayoutEffect(() => {
        if (canvasRef.current && viewSize.width !== 0 && viewSize.height !== 0) {
            if (typeof managerRef.current === 'undefined') {
                managerRef.current = new PageManager(canvasRef.current, {
                    ...props,
                    showCanvasNavigation,
                });
            }
        }
    }, [props, showCanvasNavigation, viewSize.height, viewSize.width]);

    // AppMode が変更された場合
    useEffect(() => {
        if (managerRef.current) {
            // キャンバスモード時は readonly とする
            managerRef.current.readonly = mode === 'canvas';
        }
    }, [mode]);

    // NoteMode (ツール) が変更された場合
    useEffect(() => {
        if (managerRef.current) {
            managerRef.current.mode = tool;
        }
    }, [tool]);

    // 描画ツールが変更された場合
    useEffect(() => {
        if (managerRef.current) {
            managerRef.current.drawSettings = drawSettings;
        }
    }, [drawSettings]);

    return <canvas ref={canvasRef} width={viewSize.width} height={viewSize.height} />;
};

export default forwardRef(Page);
