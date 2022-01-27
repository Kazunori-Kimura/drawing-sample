import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useCallback,
    useRef,
    useState,
} from 'react';
import {
    OpenPopupFunction,
    PopupCallbackFunction,
    PopupParams,
    PopupPosition,
    PopupType,
} from '../popup/types';

interface IPopupContext {
    popupType?: PopupType;
    setPopupType: Dispatch<SetStateAction<PopupType | undefined>>;
    popupPosition: PopupPosition;
    setPopupPosition: Dispatch<SetStateAction<PopupPosition>>;
    open: OpenPopupFunction;
    close: VoidFunction;
    popupParams?: PopupParams;
    callback?: PopupCallbackFunction;
}

interface Props {
    children: ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const PopupContext = createContext<IPopupContext>(undefined!);

const PopupProvider: React.VFC<Props> = ({ children }) => {
    // ポップアップの種類
    const [popupType, setPopupType] = useState<PopupType>();
    // ポップアップの位置
    const [popupPosition, setPopupPosition] = useState<PopupPosition>({ top: 0, left: 0 });
    // パラメータ
    const [popupParams, setPopupParams] = useState<PopupParams>({});
    // コールバック
    const callbackFunc = useRef<PopupCallbackFunction>();

    const open = useCallback(
        (
            type: PopupType,
            position: PopupPosition,
            params?: PopupParams,
            callback?: PopupCallbackFunction
        ) => {
            setPopupType(type);
            setPopupPosition(position);
            setPopupParams(params ?? {});
            callbackFunc.current = callback;
        },
        []
    );

    const close = useCallback(() => {
        setPopupType(undefined);
        setPopupPosition({ top: 0, left: 0 });
        setPopupParams({});
        callbackFunc.current = undefined;
    }, []);

    const callback = useCallback((values: Record<string, unknown>) => {
        if (callbackFunc.current) {
            callbackFunc.current(values);
        }
    }, []);

    return (
        <PopupContext.Provider
            value={{
                popupType,
                setPopupType,
                popupPosition,
                setPopupPosition,
                open,
                close,
                popupParams,
                callback,
            }}
        >
            {children}
        </PopupContext.Provider>
    );
};

export default PopupProvider;
