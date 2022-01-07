import { AutoFixNormal, Edit, PanToolAlt } from '@mui/icons-material';
import {
    Slider,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import {
    ChangeEvent,
    Dispatch,
    MouseEvent,
    ReactElement,
    SetStateAction,
    useCallback,
    useContext,
} from 'react';
import { NoteSettingsContext } from '../../providers/NoteSettingsProvider';
import { DrawSettings, isNoteMode, NoteMode } from '../../types/note';

interface Props {
    mode: NoteMode;
    settings: DrawSettings;
    onChangeMode: Dispatch<SetStateAction<NoteMode>>;
    onChangeDrawSettings: Dispatch<SetStateAction<DrawSettings>>;
}

const DrawModes = ['pen', 'eraser'] as const;
type DrawMode = typeof DrawModes[number];
const isDrawMode = (item: unknown): item is DrawMode => {
    if (typeof item === 'string') {
        return DrawModes.some((mode) => mode === item);
    }
    return false;
};

interface ButtonProps {
    mode: NoteMode | DrawMode;
    icon: ReactElement;
    label: string;
}

const NoteModeButtons: Readonly<Record<NoteMode, ButtonProps>> = {
    select: {
        mode: 'select',
        icon: <PanToolAlt />,
        label: '選択',
    },
    edit: {
        mode: 'edit',
        icon: <Edit />,
        label: '描画',
    },
};

const DrawModeButtons: Readonly<Record<DrawMode, ButtonProps>> = {
    pen: {
        mode: 'pen',
        icon: <Edit />,
        label: 'ペンツール',
    },
    eraser: {
        mode: 'eraser',
        icon: <AutoFixNormal />,
        label: '消しゴム',
    },
};

const MinStrokeWidth = 4;
const MaxStrokeWidth = 20;
const StrokeWidthStep = 4;

const NoteToolboxCore: React.VFC<Props> = ({
    mode,
    settings,
    onChangeMode,
    onChangeDrawSettings,
}) => {
    /**
     * モードの変更
     */
    const handleChangeMode = useCallback(
        (_: MouseEvent<HTMLElement>, newValue: string | null) => {
            if (newValue !== null && isNoteMode(newValue)) {
                onChangeMode(newValue);
            }
        },
        [onChangeMode]
    );

    /**
     * 描画ツールの選択
     */
    const handleChangeTool = useCallback(
        (_: MouseEvent<HTMLElement>, newValue: string | null) => {
            if (newValue !== null && isDrawMode(newValue)) {
                onChangeDrawSettings((state) => ({
                    ...state,
                    eraser: newValue === 'eraser',
                }));
            }
        },
        [onChangeDrawSettings]
    );

    const handleChangeStrokeWidth = useCallback(
        (_: Event, value: number | number[]) => {
            if (typeof value === 'number') {
                onChangeDrawSettings((state) => ({
                    ...state,
                    strokeWidth: value,
                }));
            }
        },
        [onChangeDrawSettings]
    );

    const handleChangeStroke = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            if (event.target.checkValidity()) {
                const { value } = event.target;
                onChangeDrawSettings((state) => ({
                    ...state,
                    stroke: value,
                }));
            }
        },
        [onChangeDrawSettings]
    );

    return (
        <Stack sx={{ width: 160 }} alignItems="flex-start">
            <Typography variant="caption">Toolbox</Typography>
            {/* 選択 / 編集の切り替え */}
            <ToggleButtonGroup
                orientation="vertical"
                value={mode}
                exclusive
                fullWidth
                onChange={handleChangeMode}
            >
                {Object.entries(NoteModeButtons).map(([key, { icon, label }]) => (
                    <ToggleButton
                        key={key}
                        value={key}
                        sx={{ justifyContent: 'flex-start', alignItems: 'center' }}
                    >
                        {icon}
                        <Typography variant="caption" sx={{ ml: 1 }}>
                            {label}
                        </Typography>
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
            <Typography variant="caption" sx={{ mt: 1 }}>
                描画ツール
            </Typography>
            {/* eraser */}
            <ToggleButtonGroup
                orientation="vertical"
                value={settings.eraser ? 'eraser' : 'pen'}
                exclusive
                fullWidth
                disabled={mode === 'select'}
                onChange={handleChangeTool}
            >
                {Object.entries(DrawModeButtons).map(([key, { icon, label }]) => (
                    <ToggleButton
                        key={key}
                        value={key}
                        sx={{ justifyContent: 'flex-start', alignItems: 'center' }}
                    >
                        {icon}
                        <Typography variant="caption" sx={{ ml: 1 }}>
                            {label}
                        </Typography>
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
            {/* strokeWidth */}
            <Typography variant="caption" sx={{ mt: 1 }}>
                太さ
            </Typography>
            <Slider
                sx={{ ml: 1, mb: 2, boxSizing: 'border-box', width: 140 }}
                value={settings.strokeWidth}
                min={MinStrokeWidth}
                max={MaxStrokeWidth}
                step={StrokeWidthStep}
                marks
                valueLabelDisplay="auto"
                disabled={mode === 'select'}
                onChange={handleChangeStrokeWidth}
            />
            {/* stroke */}
            <TextField
                type="color"
                label="ペンの色"
                value={settings.stroke}
                disabled={mode === 'select' || settings.eraser}
                fullWidth
                margin="dense"
                size="small"
                onChange={handleChangeStroke}
            />
        </Stack>
    );
};

const NoteToolbox: React.VFC = () => {
    const props = useContext(NoteSettingsContext);
    return <NoteToolboxCore {...props} />;
};

export default NoteToolbox;
