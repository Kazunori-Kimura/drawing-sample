import { Meta } from '@storybook/react';
import React from 'react';
import CanvasCore from '../components/Canvas/core';
import { Structure } from '../types/shape';
import data from '../__test__/sample.json';

const meta: Meta = {
    title: 'Canvas',
    component: CanvasCore,
};

export default meta;

// とりあえず表示する
export const Basic: React.VFC = () => {
    const structure = data as Structure;
    return <CanvasCore structure={structure} size={{ width: 400, height: 400 }} />;
};
