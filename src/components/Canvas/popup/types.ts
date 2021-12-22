export const PopupTypes = ['forces'] as const;
export type PopupType = typeof PopupTypes[number];

export interface PopupPosition {
    top: number;
    left: number;
}

export type PopupParams = Record<string, unknown>;

export interface PopupBaseProps {
    open?: boolean;
    position?: PopupPosition;
    parameters?: PopupParams;
    onClose: VoidFunction;
}

export interface FormBaseProps {
    parameters?: PopupParams;
}
