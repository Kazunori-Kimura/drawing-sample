import { Box, Typography } from '@mui/material';
import { Meta } from '@storybook/react';
import React, { useState } from 'react';
import CanvasCore from '../components/Canvas/core';
import { Structure } from '../types/shape';
import sample from '../__test__/sample.json';
const data = sample as Structure;

const meta: Meta = {
    title: 'Canvas',
    component: CanvasCore,
};

export default meta;

// とりあえず表示する
export const Basic: React.VFC = () => {
    return (
        <Box sx={{ border: '1px solid black', width: 'max-content' }}>
            <CanvasCore structure={data} size={{ width: 400, height: 400 }} readonly />
        </Box>
    );
};

// 描画可能
export const Drawable: React.VFC = () => {
    const [structure, setStructure] = useState(data);
    return (
        <>
            <Typography variant="caption">ドラッグで線を引く</Typography>
            <Box sx={{ border: '1px solid black', width: 'max-content' }}>
                <CanvasCore
                    structure={structure}
                    onChange={setStructure}
                    size={{ width: 400, height: 400 }}
                />
            </Box>
        </>
    );
};
