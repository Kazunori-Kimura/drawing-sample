import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import {
    Button,
    Paper,
    Stack,
    SvgIcon,
    ToggleButton,
    ToggleButtonGroup,
    ToggleButtonProps,
    Typography,
} from '@mui/material';
import {
    FormEvent,
    MouseEvent,
    ReactElement,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { isNode, isNodePinType, Node, NodePinType } from '../../../types/shape';
import { ReactComponent as PinIcon1 } from './pins/pin_1.svg';
import { ReactComponent as PinIcon2 } from './pins/pin_2.svg';
import { ReactComponent as PinIcon3 } from './pins/pin_3.svg';
import { ReactComponent as PinIcon4 } from './pins/pin_4.svg';
import { PopupParams } from './types';

interface Props {
    values: PopupParams;
    onClose: VoidFunction;
    onChange: (node: Node) => void;
}

interface PinSelectorProps extends Omit<Props, 'values'> {
    node: Node;
}

interface PinButtonProps {
    type: NodePinType;
    icon: ReactElement;
    label: string;
}

const PinButtons: Readonly<Record<NodePinType, PinButtonProps>> = {
    free: {
        type: 'free',
        icon: <CircleOutlinedIcon />,
        label: '完全フリー',
    },
    pin: {
        type: 'pin',
        icon: (
            <SvgIcon sx={{ width: 24 }} viewBox="0 0 160 160">
                <PinIcon1 />
            </SvgIcon>
        ),
        label: '完全ピン',
    },
    pinX: {
        type: 'pinX',
        icon: (
            <SvgIcon sx={{ width: 24 }} viewBox="0 0 160 160">
                <PinIcon2 />
            </SvgIcon>
        ),
        label: 'ピンXローラー',
    },
    pinZ: {
        type: 'pinZ',
        icon: (
            <SvgIcon sx={{ width: 24, transform: 'rotate(-90deg)' }} viewBox="0 0 160 160">
                <PinIcon2 />
            </SvgIcon>
        ),
        label: 'ピンZローラー',
    },
    fixX: {
        type: 'fixX',
        icon: (
            <SvgIcon sx={{ width: 24 }} viewBox="0 0 160 160">
                <PinIcon3 />
            </SvgIcon>
        ),
        label: '固定Xローラー',
    },
    fix: {
        type: 'fix',
        icon: (
            <SvgIcon sx={{ width: 24 }} viewBox="0 0 160 160">
                <PinIcon4 />
            </SvgIcon>
        ),
        label: '完全固定',
    },
};

const defaultButtonProps: Partial<ToggleButtonProps> = {
    sx: { justifyContent: 'flex-start', alignItems: 'center' },
};

const PinSelector: React.VFC<PinSelectorProps> = ({ node, onChange, onClose }) => {
    const [pin, setPin] = useState<NodePinType>();

    const handleSubmit = useCallback(
        (event: FormEvent) => {
            event.preventDefault();

            const values: Node = {
                ...node,
                pin,
            };
            onChange(values);
            onClose();
        },
        [node, onChange, onClose, pin]
    );

    const handleChange = useCallback((_: MouseEvent<HTMLElement>, newValue: string | null) => {
        if (newValue !== null && isNodePinType(newValue)) {
            setPin(newValue);
        }
    }, []);

    useEffect(() => {
        setPin(node.pin ?? 'free');
    }, [node.pin]);

    return (
        <Paper>
            <Stack
                direction="column"
                spacing={1}
                sx={{ p: 1, width: 240 }}
                component="form"
                autoComplete="off"
                noValidate
                onSubmit={handleSubmit}
            >
                <ToggleButtonGroup
                    orientation="vertical"
                    value={pin}
                    size="small"
                    exclusive
                    fullWidth
                    onChange={handleChange}
                >
                    {Object.entries(PinButtons).map(([key, { icon, label }]) => (
                        <ToggleButton key={key} value={key} {...defaultButtonProps}>
                            {icon}
                            <Typography variant="caption" sx={{ ml: 1 }}>
                                {label}
                            </Typography>
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <Button size="small" onClick={onClose}>
                        キャンセル
                    </Button>
                    <Button type="submit" size="small" variant="contained">
                        OK
                    </Button>
                </Stack>
            </Stack>
        </Paper>
    );
};

const ConnectedPinSelector: React.VFC<Props> = ({ values, ...props }) => {
    const node = useMemo(() => {
        if (isNode(values)) {
            return values;
        }
        return {
            id: '',
            x: 0,
            y: 0,
        };
    }, [values]);

    return <PinSelector {...props} node={node} />;
};

export default ConnectedPinSelector;
