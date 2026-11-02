import { alpha, type Theme, Stack, styled, Typography } from '@mui/material';
import { AlertBoxVariantsEnum, type AlertBoxVariants } from '.';

type ElementWithVariant = {
  variant: AlertBoxVariants;
  $noMargin?: boolean;
};

const getVariantColors = (theme: Theme, variant: AlertBoxVariants) => {
  const key =
    variant === AlertBoxVariantsEnum.success
      ? 'success'
      : variant === AlertBoxVariantsEnum.danger
        ? 'error'
        : variant === AlertBoxVariantsEnum.warn
          ? 'warning'
          : variant === AlertBoxVariantsEnum.primary
            ? 'primary'
            : 'info';
  const color = theme.palette[key].main;
  return { bg: alpha(color, 0.12), text: color };
};

export const AlertBoxContainer = styled(Stack, {
  shouldForwardProp: (prop) => prop !== 'variant' && prop !== '$noMargin',
})<ElementWithVariant>(({ theme, variant, $noMargin }) => {
  const colors = getVariantColors(theme, variant);
  return {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: $noMargin ? '0' : '1.5rem',
    padding: '1rem 1.25rem',
    borderRadius: '0.75rem',
    backgroundColor: colors.bg,
    color: theme.palette.text.secondary,
    '& > div > div > h2': {
      color: colors.text,
    },
  };
});

export const IconWrapper = styled('div', {
  shouldForwardProp: (prop) => prop !== 'variant',
})<ElementWithVariant>(({ theme, variant }) => {
  const colors = getVariantColors(theme, variant);
  return {
    display: 'flex',
    alignItems: 'flex-start',
    paddingTop: '0.125rem',
    '& > *': {
      fontSize: '1.25rem',
      color: colors.text,
    },
  };
});

export const TypographyDescription = styled(Typography)(({ theme }) => ({
  wordBreak: 'break-word',
  whiteSpace: 'pre-wrap',
  color: theme.palette.text.primary,
  fontSize: '0.875rem',
  lineHeight: 1.43,
}));
