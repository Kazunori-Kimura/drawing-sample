import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import React from 'react';
import AppSettingsProvider from '../providers/AppSettingsProvider';
import ConfigurationProvider from '../providers/ConfigurationProvider';
import NoteSettingsProvider from '../providers/NoteSettingsProvider';
import Layout from './Layout';

const theme = createTheme();

const App: React.VFC = () => {
    return (
        <ThemeProvider theme={theme}>
            <AppSettingsProvider>
                <ConfigurationProvider>
                    <NoteSettingsProvider>
                        <CssBaseline />
                        <Layout />
                    </NoteSettingsProvider>
                </ConfigurationProvider>
            </AppSettingsProvider>
        </ThemeProvider>
    );
};

export default App;
