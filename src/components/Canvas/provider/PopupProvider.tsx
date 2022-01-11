import { createContext, Dispatch, ReactNode, SetStateAction, useCallback, useState } from 'react';
import { PopupParams, PopupPosition, PopupType } from '../popup/types';

interface IPopupContext {
    popupType?: PopupType;
    setPopupType: Dispatch<SetStateAction<PopupType | undefined>>;
    popupPosition: PopupPosition;
    setPopupPosition: Dispatch<SetStateAction<PopupPosition>>;
    open: (popup: PopupType, position: PopupPosition, popupParams?: PopupParams) => void;
    close: VoidFunction;
    popupParams?: PopupParams;
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

    const open = useCallback(
        (type: PopupType, position: PopupPosition, params?: PopupParams) => {
            setPopupType(type);
            setPopupPosition(position);
            if (params) {
                setPopupParams(params);
            }
        },
        [setPopupPosition, setPopupType]
    );

    const close = useCallback(() => {
        setPopupType(undefined);
        setPopupPosition({ top: 0, left: 0 });
        setPopupParams({});
    }, [setPopupPosition, setPopupType]);

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
            }}
        >
            {children}
        </PopupContext.Provider>
    );
};

export default PopupProvider;
