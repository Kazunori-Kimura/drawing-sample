import { Box, Typography } from '@mui/material';
import { Meta } from '@storybook/react';
import React, { useState } from 'react';
import Canvas from '../components/Canvas';
import { Structure } from '../types/shape';
import sample from '../__test__/sample.json';
const data = sample as Structure;

const meta: Meta = {
    title: 'Canvas',
    component: Canvas,
};

export default meta;

// とりあえず表示する
export const Basic: React.VFC = () => {
    return (
        <Box sx={{ border: '1px solid black', width: 400, height: 400 }}>
            <Canvas structure={data} readonly />
        </Box>
    );
};

// 描画可能
export const Drawable: React.VFC = () => {
    const [structure, setStructure] = useState(data);
    return (
        <>
            <Typography variant="caption">ドラッグで線を引く</Typography>
            <Box sx={{ border: '1px solid black', width: 400, height: 400 }}>
                <Canvas tool="pen" structure={structure} setStructure={setStructure} />
            </Box>
        </>
    );
};

// 集中荷重の追加
export const Force: React.VFC = () => {
    const [structure, setStructure] = useState(data);
    return (
        <>
            <Typography variant="caption">梁要素のクリックで集中荷重を追加</Typography>
            <Box sx={{ border: '1px solid black', width: 400, height: 400 }}>
                <Canvas tool="force" structure={structure} setStructure={setStructure} />
            </Box>
        </>
    );
};
