import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import React from 'react';
import ConfigurationProvider from '../providers/ConfigurationProvider';
import NoteSettingsProvider from '../providers/NoteSettingsProvider';
import Layout from './Layout';

const theme = createTheme();

const App: React.VFC = () => {
    return (
        <ThemeProvider theme={theme}>
            <ConfigurationProvider>
                <NoteSettingsProvider>
                    <CssBaseline />
                    <Layout />
                </NoteSettingsProvider>
            </ConfigurationProvider>
        </ThemeProvider>
    );
};

export default App;
