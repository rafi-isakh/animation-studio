import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';


export const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    p: 4,
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
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
    return {
      position: 'absolute',
      bottom: '-15%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: isMobile ? '100%' : 400,
      bgcolor: '#ffffff',
      borderRadius: '25px 25px 0px 0px',
      p: 5,
    };
  };