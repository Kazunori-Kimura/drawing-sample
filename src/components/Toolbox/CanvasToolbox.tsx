import { ArrowDownward, Delete, Edit, PanToolAlt, Refresh, Texture } from '@mui/icons-material';
import { Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { MouseEvent, ReactElement, useCallback, useContext } from 'react';
import { ConfigurationContext } from '../../providers/ConfigurationProvider';
import { CanvasTool, isCanvasTool } from '../../types/common';

interface Props {
    tool: CanvasTool;
    onChange: (tool: CanvasTool) => void;
}

interface ButtonProps {
    tool: CanvasTool;
    icon: ReactElement;
    label: string;
}

const ToolboxButtons: Readonly<Record<CanvasTool, ButtonProps>> = {
    select: {
        tool: 'select',
        icon: <PanToolAlt />,
        label: '選択',
    },
    pen: {
        tool: 'pen',
        icon: <Edit />,
        label: '梁要素の描画',
    },
    force: {
        tool: 'force',
        icon: <ArrowDownward />,
        label: '集中荷重の追加',
    },
    moment: {
        tool: 'moment',
        icon: <Refresh />,
        label: 'モーメント荷重',
    },
    trapezoid: {
        tool: 'trapezoid',
        icon: <Texture />,
        label: '分布荷重の追加',
    },
    delete: {
        tool: 'delete',
        icon: <Delete />,
        label: '要素の削除',
    },
};

const CanvasToolboxCore: React.VFC<Props> = ({ tool, onChange }) => {
    /**
     * ツールの変更
     */
    const handleChange = useCallback(
        (_: MouseEvent<HTMLElement>, newValue: string | null) => {
            if (newValue !== null && isCanvasTool(newValue)) {
                onChange(newValue);
            }
        },
        [onChange]
    );

    return (
        <Stack sx={{ width: 160 }} alignItems="flex-start">
            <Typography variant="caption">Toolbox</Typography>
            <ToggleButtonGroup
                orientation="vertical"
                value={tool}
                exclusive
                fullWidth
                onChange={handleChange}
            >
                {Object.entries(ToolboxButtons).map(([key, { icon, label }]) => (
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
        </Stack>
    );
};

const CanvasToolbox: React.VFC = () => {
    const { tool, setTool } = useContext(ConfigurationContext);
    return <CanvasToolboxCore tool={tool} onChange={setTool} />;
};

export default CanvasToolbox;
