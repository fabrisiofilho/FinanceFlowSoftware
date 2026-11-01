import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeftOutlined';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRightOutlined';
import { Box, styled } from '@mui/material';

export const OpenIcon = styled(KeyboardArrowRightIcon)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

export const CloseIcon = styled(KeyboardArrowLeftIcon)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

export const Container = styled(Box)({
  position: 'absolute',
  right: '0.75rem',
});
