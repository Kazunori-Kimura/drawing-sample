import { Box, Typography } from '@mui/material';
import { Meta } from '@storybook/react';
import React from 'react';
import Canvas from '../components/Canvas';
import { defaultCanvasProps, StructureCanvasProps } from '../types/note';
import { Structure } from '../types/shape';
import sample from '../__test__/sample.json';

const data: StructureCanvasProps = {
    ...defaultCanvasProps,
    data: sample as Structure,
    width: 400,
    height: 400,
};

const meta: Meta = {
    title: 'Canvas',
    component: Canvas,
};

export default meta;

// 読み取り専用で表示
export const Readonly: React.VFC = () => {
    return (
        <Box sx={{ border: '1px solid black', width: 400, height: 400 }}>
            <Canvas {...data} readonly />
        </Box>
    );
};

// 選択可能
export const Selectable: React.VFC = () => {
    return (
        <Box sx={{ border: '1px solid black', width: 400, height: 400 }}>
            <Canvas tool="select" {...data} />
        </Box>
    );
};

// 描画可能
export const Drawable: React.VFC = () => {
    return (
        <>
            <Typography variant="caption">ドラッグで線を引く</Typography>
            <Box sx={{ border: '1px solid black', width: 400, height: 400 }}>
                <Canvas tool="pen" {...data} />
            </Box>
        </>
    );
};

// 集中荷重の追加
export const Force: React.VFC = () => {
    return (
        <>
            <Typography variant="caption">梁要素のクリックで集中荷重を追加</Typography>
            <Box sx={{ border: '1px solid black', width: 400, height: 400 }}>
                <Canvas tool="force" {...data} />
            </Box>
        </>
    );
};

export const Trapezoid: React.VFC = () => {
    return (
        <>
            <Typography variant="caption">梁要素に分布荷重を追加</Typography>
            <Box sx={{ border: '1px solid black', width: 400, height: 400 }}>
                <Canvas tool="trapezoid" {...data} />
            </Box>
        </>
    );
};

export const Delete: React.VFC = () => {
    return (
        <>
            <Typography variant="caption">クリックで要素を削除</Typography>
            <Box sx={{ border: '1px solid black', width: 400, height: 400 }}>
                <Canvas tool="delete" {...data} />
            </Box>
        </>
    );
};
