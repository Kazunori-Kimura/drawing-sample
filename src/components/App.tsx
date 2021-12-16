import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import React from 'react';
import ConfigurationProvider from '../providers/ConfigurationProvider';
import Layout from './Layout';

const theme = createTheme();

const App: React.VFC = () => {
    return (
        <ThemeProvider theme={theme}>
            <ConfigurationProvider>
                <CssBaseline />
                <Layout />
            </ConfigurationProvider>
        </ThemeProvider>
    );
};

export default App;
