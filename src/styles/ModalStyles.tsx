import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const useToonyzCutSubmitModalStyle = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery('(max-width:360px)');
    
    return {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: isMobile ? '95%' : 500, 
        maxHeight: isMobile ? '100%' : '100%', // Limit height on mobile
        overflowY: isMobile ? 'auto' : 'auto', // Enable scrolling on mobile if needed
        bgcolor: 'background.paper',
        border: '1px solid #e5e5e5',
        borderRadius: '12px',
        p: isMobile ? 2 : 4,  // Smaller padding on mobile
        color: theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.text.secondary,
    };
};

const useToonyzCutViewerModalStyle = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery('(max-width:360px)');
    
    return {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: isMobile ? '95%' : 500, 
        maxHeight: isMobile ? '100%' : '100%', 
        overflowY: isMobile ? 'auto' : 'auto', 
        bgcolor: 'background.paper',
        border: '1px solid #e5e5e5',
        borderRadius: '12px',
        p: isMobile ? 2 : 4,  // Smaller padding on mobile
        color: theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.text.secondary,
    };
};

const useModalStyle = () => {
    const theme = useTheme();
    
    return {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        border: '1px solid #e5e5e5',
        borderRadius: '12px',
        p: 4,
        color: theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.text.secondary,
    };
};


export const videoStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    bgcolor: 'background.paper',
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    p: 4,
}

const useViewSettingsStyle = () => {
    const theme = useTheme();
    const is360 = useMediaQuery('(max-width:360px)');
    const is370 = useMediaQuery('(min-width:361px) and (max-width:370px)');
    const is380 = useMediaQuery('(min-width:371px) and (max-width:380px)');
    const is400 = useMediaQuery('(min-width:381px) and (max-width:400px)');
    const isAbove400 = useMediaQuery('(min-width:401px)');
    const is420 = useMediaQuery(theme.breakpoints.up('lg'));
    const is500 = useMediaQuery(theme.breakpoints.up('xl'));
  
    return {
        position: 'absolute',
        bottom: is360 ? '-15%' : 
                is370 ? '-15%' : 
                is380 ? '-20%' : 
                is400 ? '-20%' : 
                '-10%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: isAbove400 ? 400 : '100%',
        bgcolor: '#ffffff',
        borderRadius: '25px 25px 25px 25px',
        p: 5,
        boxShadow: 'rgba(0, 0, 0, 0.1) 0px 20px 25px -5px, rgba(0, 0, 0, 0.04) 0px 10px 10px -5px',
    };
  };


  export { useModalStyle, useViewSettingsStyle, useToonyzCutSubmitModalStyle, useToonyzCutViewerModalStyle } 