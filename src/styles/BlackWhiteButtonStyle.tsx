import { Button } from '@mui/material';
import { createTheme, styled, ThemeProvider } from '@mui/material/styles';

declare module '@mui/material/styles' {
    interface Palette {
        bw: Palette['primary'];
        wb: Palette['primary'];
        gray: Palette['primary'];
    }

    interface PaletteOptions {
        bw?: PaletteOptions['primary'];
        wb?: PaletteOptions['primary'];
        gray?: PaletteOptions['primary'];
    }
}

export const bwTheme = createTheme({
    palette: {
        bw: {
            main: '#ffffff',
            light: '#ffffff',
            dark: '#ffffff',
            contrastText: '#000000',
        },
    },
});

export const wbTheme = createTheme({
    palette: {
        wb: {
            main: '#000000',
            light: '#000000',
            dark: '#000000',
            contrastText: '#ffffff',
        },
    },
});

export const grayTheme = createTheme({
    palette: {
        gray: {
            main: '#1e293b',
            light: '#A9A9A9',
            dark: '#696969',
            contrastText: '#000000'
        },
    },
});

declare module '@mui/material/Button' {
    interface ButtonPropsColorOverrides {
        bw: true;
        wb: true;
        gray: true; 
    }
}

export const NoCapsButton = styled(Button)({
    textTransform: 'none',
});
