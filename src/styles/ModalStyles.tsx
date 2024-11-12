import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';


export const style = () => {
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
        color: theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.text.secondary, // {{ edit_1 }}
    }
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

export const useViewSettingsStyle = () => {
    const theme = useTheme();
    const is360 = useMediaQuery('(max-width:360px)');
    const is370 = useMediaQuery('(min-width:361px) and (max-width:370px)');
    const is380 = useMediaQuery('(min-width:371px) and (max-width:380px)');
    const is400 = useMediaQuery('(min-width:381px) and (max-width:400px)');
    const isAbove400 = useMediaQuery('(min-width:401px)');
    // const is360 = useMediaQuery(theme.breakpoints.up('sm'));
    // const is400 = useMediaQuery(theme.breakpoints.up('md'));
    const is420 = useMediaQuery(theme.breakpoints.up('lg'));
    const is500 = useMediaQuery(theme.breakpoints.up('xl'));
  
    return {
        position: 'absolute',
        bottom: is360 ? '-25%' : 
                is370 ? '-15%' : 
                is380 ? '-20%' : 
                is400 ? '-20%' : 
                '-15%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: isAbove400 ? 400 : '100%',
        bgcolor: '#ffffff',
        borderRadius: '25px 25px 25px 25px',
        p: 5,
        boxShadow: 'rgba(0, 0, 0, 0.1) 0px 20px 25px -5px, rgba(0, 0, 0, 0.04) 0px 10px 10px -5px',
    };
  };