export const PopupTypes = ['forces', 'trapezoids', 'nodes'] as const;
export type PopupType = typeof PopupTypes[number];

export interface PopupPosition {
    top: number;
    left: number;
}

export type PopupParams = Record<string, unknown>;

export interface PopupBaseProps {
    values: PopupParams;
    onClose: VoidFunction;
    onChange?: (values: Record<string, unknown>) => void;
}

export interface FormBaseProps {
    parameters?: PopupParams;
}
