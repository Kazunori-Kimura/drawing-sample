import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { AppMode } from '../../types/common';
import {
    CommitStructureFunction,
    DrawSettings,
    NoteMode,
    PageProps,
    StructureCanvasProps,
    StructureCanvasState,
} from '../../types/note';
import PageManager from './manager';
import CanvasNavigation from './nav/CanvasNavigation';

interface Props extends PageProps {
    mode: AppMode;
    tool: NoteMode;
    viewSize: DOMRect;
    drawSettings: DrawSettings;
    onEditCanvas?: (props: StructureCanvasState, callback: CommitStructureFunction) => void;
    onCloseCanvas?: VoidFunction;
}

export interface PageHandler {
    getActiveStructure: () => StructureCanvasProps | undefined;
    setActiveStructure: (props: StructureCanvasProps) => void;
    addStructureCanvas: (props?: StructureCanvasProps) => void;
    removeStructureCanvas: (props: StructureCanvasProps) => void;
}

const Page: React.ForwardRefRenderFunction<PageHandler, Props> = (
    { mode, tool, viewSize, drawSettings, onEditCanvas, onCloseCanvas, ...props },
    ref
) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const managerRef = useRef<PageManager>();

    const [canvasProps, setCanvasProps] = useState<StructureCanvasState>();

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
        addStructureCanvas: (props?: StructureCanvasProps) => {
            if (managerRef.current) {
                managerRef.current.addCanvas(props);
            }
        },
        removeStructureCanvas: (props: StructureCanvasProps) => {
            if (managerRef.current) {
                managerRef.current.removeCanvas(props.id);
            }
        },
    }));

    /**
     * ??????????????????????????????????????????????????????????????????
     */
    const setCanvasState = useCallback((params: StructureCanvasState) => {
        setCanvasProps(params);
    }, []);

    /**
     * ??????????????????????????????
     */
    const clearCanvasState = useCallback(
        (closingCanvas = true) => {
            setCanvasProps(undefined);
            if (closingCanvas) {
                onCloseCanvas && onCloseCanvas();
            }
        },
        [onCloseCanvas]
    );

    /**
     * ???????????????????????????????????????
     */
    const handleEdit = useCallback(() => {
        if (onEditCanvas && canvasProps) {
            if (managerRef.current) {
                // ??????????????????????????????????????????????????????
                managerRef.current.activeCanvas?.hideControls();
            }

            onEditCanvas(canvasProps, (data) => {
                if (managerRef.current) {
                    managerRef.current.activeStructure = data;
                }
            });
        }
    }, [canvasProps, onEditCanvas]);

    const handleCopy = useCallback(() => {
        if (managerRef.current) {
            const data = managerRef.current.activeCanvas;
            if (data) {
                managerRef.current.addCanvas(data.getCanvasProps());
            }
        }
    }, []);

    const handleDelete = useCallback(() => {
        if (managerRef.current) {
            const data = managerRef.current.activeCanvas;
            if (data) {
                managerRef.current.removeCanvas(data.getCanvasProps());
            }
            setCanvasProps(undefined);
        }
    }, []);

    // ?????????
    useLayoutEffect(() => {
        if (canvasRef.current && viewSize.width !== 0 && viewSize.height !== 0) {
            if (typeof managerRef.current === 'undefined') {
                managerRef.current = new PageManager(canvasRef.current, {
                    ...props,
                    setCanvasState,
                    clearCanvasState,
                });
            }
        }
    }, [clearCanvasState, props, setCanvasState, viewSize.height, viewSize.width]);

    // AppMode ????????????????????????
    useEffect(() => {
        if (managerRef.current) {
            // ?????????????????????????????? readonly ?????????
            managerRef.current.readonly = mode === 'canvas';
        }
    }, [mode]);

    // NoteMode (?????????) ????????????????????????
    useEffect(() => {
        if (managerRef.current) {
            managerRef.current.mode = tool;
        }
    }, [tool]);

    // ???????????????????????????????????????
    useEffect(() => {
        if (managerRef.current) {
            managerRef.current.drawSettings = drawSettings;
        }
    }, [drawSettings]);

    // DOM??????????????????????????????????????????
    useEffect(() => {
        if (managerRef.current) {
            managerRef.current.resize(viewSize);
        }
    }, [viewSize]);

    return (
        <>
            <canvas ref={canvasRef} width={viewSize.width} height={viewSize.height} />
            {canvasProps && (
                <CanvasNavigation
                    mode={mode}
                    {...canvasProps}
                    onEdit={handleEdit}
                    onCopy={handleCopy}
                    onDelete={handleDelete}
                    onCancel={clearCanvasState}
                />
            )}
        </>
    );
};

export default forwardRef(Page);
