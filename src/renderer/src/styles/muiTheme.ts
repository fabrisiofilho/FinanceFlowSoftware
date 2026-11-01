import { feedbackStyle } from '@renderer/components/Feedback';
import { createTheme, Theme } from '@mui/material';
import { rgba } from 'polished';
import formAlertIcon from '../assets/form-alert.svg';
import { styledTheme, getStyledTheme, ThemeMode } from './styledTheme';

function createMuiTheme(colors: typeof styledTheme): Theme {
  const isDark = true;

  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: colors.COLORS.primary,
        light: colors.COLORS.primary_200,
        dark: colors.COLORS.primary_400,
        contrastText: '#102219',
      },
      secondary: {
        main: colors.COLORS.secondary,
        light: colors.COLORS.secondary_200,
        dark: colors.COLORS.secondary_400,
        contrastText: '#102219',
      },
      grey: {
        100: colors.COLORS.grey_100,
        200: colors.COLORS.grey_200,
        300: colors.COLORS.grey_300,
        400: colors.COLORS.grey_400,
        500: colors.COLORS.grey_500,
        600: colors.COLORS.grey_600,
        700: colors.COLORS.grey_700,
        800: colors.COLORS.grey_800,
        900: colors.COLORS.grey_900,
      },
      info: {
        main: colors.COLORS.info,
        light: colors.COLORS.info_200,
        dark: colors.COLORS.info_400,
        contrastText: '#FFFFFF',
      },
      success: {
        main: colors.COLORS.success,
        light: colors.COLORS.success_200,
        dark: colors.COLORS.success_400,
        contrastText: '#FFFFFF',
      },
      warning: {
        main: colors.COLORS.warn,
        light: colors.COLORS.warn_200,
        dark: colors.COLORS.warn_400,
        contrastText: colors.COLORS.grey_800,
      },
      error: {
        main: colors.COLORS.error,
        light: colors.COLORS.error_200,
        dark: colors.COLORS.error_400,
        contrastText: '#FFFFFF',
      },
      background: {
        default: colors.COLORS.background,
        paper: colors.COLORS.surface,
      },
      text: {
        primary: colors.COLORS.text,
        secondary: colors.COLORS.textSecondary,
        disabled: colors.COLORS.grey_500,
      },
      divider: colors.COLORS.divider,
      action: {
        selected: colors.COLORS.secondary_100,
        hover: colors.COLORS.surfaceAlt,
      },
    },
    shape: { borderRadius: 8 },
    components: {
      MuiTab: {
        defaultProps: { iconPosition: 'start' },
        styleOverrides: {
          root: {
            minHeight: 44,
            textTransform: 'none',
            flexDirection: 'row',
            gap: 8,
            '& .MuiTab-iconWrapper': { margin: 0 },
          },
        },
      },

      MuiAlert: {
        styleOverrides: {
          root: ({ theme, ownerState }) => ({
            ...feedbackStyle(theme, ownerState.severity || 'info'),
            alignItems: 'center',
            padding: '10px 16px',
          }),
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            border: '1px solid ' + colors.COLORS.border,
            boxShadow: colors.SHADOWS.dropdown,
          },
        },
      },
      MuiTextField: { defaultProps: { variant: 'outlined', size: 'small' } },
      MuiFormControl: { defaultProps: { size: 'small' } },
      MuiCardContent: {
        styleOverrides: {
          root: { padding: 24, '&:last-child': { paddingBottom: 24 } },
        },
      },
      MuiSkeleton: {
        defaultProps: { animation: 'wave' },
        styleOverrides: {
          root: { backgroundColor: colors.COLORS.surfaceAlt },
          rounded: { borderRadius: 20 },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: colors.COLORS.border, padding: '16px 20px' },
          head: {
            backgroundColor: colors.COLORS.surfaceAlt,
            color: colors.COLORS.textSecondary,
            fontSize: '0.75rem',
            fontWeight: 600,
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: colors.COLORS.background,
            color: colors.COLORS.text,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          sizeSmall: {
            fontSize: '0.813rem',
            lineHeight: '1.375rem',
            minHeight: '2rem',
            paddingLeft: '1rem',
            paddingRight: '1rem',
          },
          sizeMedium: {
            fontSize: '0.875rem',
            lineHeight: '1.5rem',
            minHeight: '2.5rem',
            paddingLeft: '1.25rem',
            paddingRight: '1.25rem',
          },
          sizeLarge: {
            fontSize: '0.938rem',
            lineHeight: '1.625rem',
            minHeight: '3rem',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
          },
          containedPrimary: {
            backgroundColor: colors.COLORS.primary,
            color: '#102219',
            '&:hover': {
              backgroundColor: colors.COLORS.primary_400,
            },
            '&:disabled': {
              backgroundColor: '#2c3933',
              color: '#a5b9ad',
            },
          },
          containedSecondary: {
            backgroundColor: colors.COLORS.secondary,
            color: '#102219',
            '&:hover': {
              backgroundColor: colors.COLORS.primary_400,
              color: '#102219',
            },
            '&:disabled': { backgroundColor: '#2c3933', color: '#a5b9ad' },
          },
          outlinedPrimary: {
            borderColor: colors.COLORS.borderLight,
            color: colors.COLORS.primary,
            '&:hover': {
              backgroundColor: colors.COLORS.surfaceAlt,
              borderColor: colors.COLORS.borderLight,
            },
            '&:disabled': {
              borderColor: rgba(colors.COLORS.grey_500, 0.24),
              color: rgba(colors.COLORS.grey_500, 0.8),
            },
          },
          textPrimary: {
            color: colors.COLORS.primary,
            '&:hover': {
              backgroundColor: rgba(colors.COLORS.primary, 0.08),
            },
            '&:disabled': {
              color: rgba(colors.COLORS.grey_500, 0.8),
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: '1.5rem',
            backgroundColor: colors.COLORS.surface,
            backgroundImage: 'none',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: colors.COLORS.textSecondary,
            '&:hover': {
              backgroundColor: colors.COLORS.surfaceAlt,
            },
            '&:disabled': {
              opacity: 0.5,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: '0.5rem',
            minHeight: 44,
            '& input': {
              padding: '12px 14px',
              height: '20px',
              lineHeight: '20px',
            },
            '&.MuiInputBase-multiline': { padding: '12px 14px' },
            backgroundColor: colors.COLORS.surface,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.COLORS.border,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.COLORS.borderLight,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.COLORS.primary,
              borderWidth: '1px',
            },
            '&.Mui-disabled': {
              backgroundColor: colors.COLORS.surfaceAlt,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: colors.COLORS.border,
              },
            },
            '&.Mui-error .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.COLORS.error,
            },
            'input::placeholder': {
              color: colors.COLORS.textSecondary,
              opacity: 1,
            },
          },
          input: {
            color: colors.COLORS.text,
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: 14,
            lineHeight: '20px',
            '&.MuiInputLabel-sizeSmall:not(.MuiInputLabel-shrink)': {
              transform: 'translate(14px,12px) scale(1)',
            },
            color: colors.COLORS.textSecondary,
            '&.Mui-focused': {
              color: colors.COLORS.primary,
            },
            '&.Mui-error': {
              color: colors.COLORS.error,
            },
            '&.Mui-disabled': {
              color: colors.COLORS.grey_500,
            },
          },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            color: colors.COLORS.border,
            '&.Mui-checked': {
              color: colors.COLORS.primary,
            },
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            fontWeight: 400,
            color: colors.COLORS.textSecondary,
          },
          contained: {
            '&.Mui-error': {
              display: 'flex',
              alignItems: 'center',
              fontWeight: 600,
              marginLeft: '1.875rem',
            },
            '&.Mui-error:before': {
              content: '""',
              position: 'absolute',
              display: 'inline-block',
              background: `url("${formAlertIcon}")`,
              left: '0.6rem',
              width: '1rem',
              height: '1rem',
            },
          },
        },
      },
      MuiFormControlLabel: {
        styleOverrides: {
          root: {
            '& .MuiTypography-root': {
              fontSize: '0.875rem',
              lineHeight: '1.25rem',
              color: colors.COLORS.textSecondary,
            },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: '0.75rem',
            backgroundColor: colors.COLORS.surface,
            backgroundImage: 'none',
            border: `1px solid ${colors.COLORS.border}`,
            boxShadow: colors.SHADOWS.dropdown,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            margin: '0.125rem 0.5rem',
            borderRadius: '0.375rem',
            color: colors.COLORS.text,
            '&:hover': {
              backgroundColor: colors.COLORS.surfaceAlt,
            },
            '&.Mui-selected': {
              backgroundColor: rgba(colors.COLORS.primary, 0.12),
              '&:hover': {
                backgroundColor: rgba(colors.COLORS.primary, 0.16),
              },
            },
          },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          paper: {
            backgroundColor: colors.COLORS.surface,
            backgroundImage: 'none',
            border: `1px solid ${colors.COLORS.border}`,
          },
          listbox: {
            '.MuiAutocomplete-option': {
              '&:hover': {
                backgroundColor: colors.COLORS.surfaceAlt,
              },
              '&[aria-selected="true"]': {
                backgroundColor: rgba(colors.COLORS.primary, 0.12),
              },
            },
          },
        },
      },
      MuiSvgIcon: {
        styleOverrides: {
          colorDisabled: {
            color: colors.COLORS.grey_500,
          },
          colorPrimary: {
            color: colors.COLORS.primary,
          },
          colorSecondary: {
            color: colors.COLORS.secondary,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderRadius: '1.5rem',
            backgroundColor: colors.COLORS.surface,
            backgroundImage: 'none',
            border: `1px solid ${colors.COLORS.border}`,
            [`@media ${colors.SIZES.xs}`]: {},
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiTable: {
        styleOverrides: {
          root: {
            backgroundColor: 'transparent',
            borderCollapse: 'separate',
            borderSpacing: '0rem 0.5rem',
            padding: '0 0.5rem',
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: 'transparent',
            '& .MuiTableRow-root': {
              backgroundColor: 'transparent',
              '& .MuiTableCell-root': {
                border: 'none',
                color: colors.COLORS.textSecondary,
                fontWeight: 600,
                '& p': {
                  fontSize: '0.813rem',
                },
              },
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            backgroundColor: colors.COLORS.surface,
            overflow: 'hidden',
            '&:hover': {
              backgroundColor: colors.COLORS.surfaceAlt,
            },
            '& .MuiTableCell-root': {
              maxWidth: '20vw',
              borderBottom: `1px solid ${colors.COLORS.border}`,
              color: colors.COLORS.text,
              [`@media (${colors.SIZES.xs})`]: {
                maxWidth: '20rem',
                padding: '0.25rem 1rem',
              },
            },
            '& .MuiTableCell-root:first-of-type': {
              borderTopLeftRadius: '0.5rem',
              borderBottomLeftRadius: '0.5rem',
            },
            '& .MuiTableCell-root:last-of-type': {
              borderTopRightRadius: '0.5rem',
              borderBottomRightRadius: '0.5rem',
            },
          },
        },
      },
      MuiTablePagination: {
        styleOverrides: {
          root: {
            color: colors.COLORS.text,
          },
          actions: {
            button: {
              color: colors.COLORS.textSecondary,
            },
            'button.Mui-disabled': {
              svg: {
                color: colors.COLORS.grey_500,
              },
            },
          },
          selectLabel: {
            color: colors.COLORS.textSecondary,
            [`@media (${colors.SIZES.xs})`]: {
              display: 'none',
            },
          },
          input: {
            [`@media (${colors.SIZES.xs})`]: {
              display: 'none',
            },
          },
        },
      },
      MuiStepLabel: {
        styleOverrides: {
          root: {
            hyphens: 'auto',
            '& .MuiStepLabel-label': {
              color: colors.COLORS.textSecondary,
            },
            '& .MuiStepLabel-label.Mui-active': {
              fontWeight: 700,
              color: colors.COLORS.text,
            },
            '& .MuiStepLabel-label.Mui-disabled': {
              color: colors.COLORS.grey_500,
            },
          },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            boxShadow: colors.SHADOWS.cards,
            borderRadius: '1rem',
            backgroundColor: colors.COLORS.surface,
            '&:before': {
              display: 'none',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: '0.5rem',
          },
          outlined: {
            borderColor: colors.COLORS.border,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: colors.COLORS.grey_800,
            color: isDark ? colors.COLORS.grey_100 : '#FFFFFF',
            fontSize: '0.75rem',
            borderRadius: '0.375rem',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: colors.COLORS.surface,
            backgroundImage: 'none',
            borderRight: `1px solid ${colors.COLORS.border}`,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: colors.COLORS.surface,
            backgroundImage: 'none',
            borderBottom: `1px solid ${colors.COLORS.border}`,
            boxShadow: 'none',
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          icon: {
            color: colors.COLORS.textSecondary,
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: colors.COLORS.primary,
              '& + .MuiSwitch-track': {
                backgroundColor: colors.COLORS.primary,
              },
            },
          },
          track: {
            backgroundColor: colors.COLORS.grey_400,
          },
        },
      },
      MuiCircularProgress: {
        styleOverrides: {
          root: {
            color: colors.COLORS.primary,
          },
        },
      },
    },
    typography: {
      fontFamily: [colors.FONTS.montserrat, colors.FONTS.sansSerif].join(','),
      fontWeightBold: 700,
      fontWeightMedium: 500,
      fontWeightRegular: 400,
      allVariants: {
        color: colors.COLORS.text,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
      h1: {
        fontSize: '3rem',
        lineHeight: '3.75rem',
        fontWeight: 800,
      },
      h2: {
        fontSize: '2.25rem',
        lineHeight: '3rem',
        fontWeight: 700,
      },
      h3: {
        fontSize: '1.875rem',
        lineHeight: '2.5rem',
        fontWeight: 700,
      },
      h4: {
        fontSize: '1.5rem',
        lineHeight: '2rem',
        fontWeight: 700,
      },
      h5: {
        fontSize: '1.25rem',
        lineHeight: '1.75rem',
        fontWeight: 600,
      },
      h6: {
        fontSize: '1.125rem',
        lineHeight: '1.5rem',
        fontWeight: 600,
      },
      subtitle1: {
        fontSize: '1rem',
        lineHeight: '1.5rem',
        fontWeight: 500,
      },
      subtitle2: {
        fontSize: '0.875rem',
        lineHeight: '1.375rem',
        fontWeight: 500,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: '1.5rem',
        fontWeight: 400,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: '1.375rem',
        fontWeight: 400,
      },
      caption: {
        fontSize: '0.75rem',
        lineHeight: '1.125rem',
        fontWeight: 500,
      },
      overline: {
        fontSize: '0.75rem',
        lineHeight: '1.125rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      },
    },
  });
}

export const muiTheme = createMuiTheme(styledTheme);

export function getMuiTheme(mode: ThemeMode): Theme {
  return createMuiTheme(getStyledTheme(mode));
}
