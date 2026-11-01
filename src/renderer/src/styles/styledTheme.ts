const darkColors = {
  primary: '#9bd9b5',
  primary_100: '#22262e',
  primary_200: '#343c49',
  primary_300: '#9bd9b5',
  primary_400: '#b5e7ca',
  primary_gradient: 'linear-gradient(135deg, #252e2b 0%, #d7dce5 100%)',

  secondary: '#9bd9b5',
  secondary_100: '#202c29',
  secondary_200: '#30423a',
  secondary_300: '#8dceaa',
  secondary_400: '#ccecd8',
  secondary_gradient: 'linear-gradient(135deg, #30423a 0%, #8dceaa 100%)',

  info: '#8fc9db',
  info_100: '#061820',
  info_200: '#006C9C',
  info_300: '#8fc9db',
  info_400: '#CDF2FD',

  success: '#9DEDBB',
  success_100: '#061812',
  success_200: '#1B806A',
  success_300: '#9DEDBB',
  success_400: '#D8FBDE',
  success_gradient: 'linear-gradient(135deg, #36b37e 0%, #86e8ab 100%)',

  warn: '#FFD666',
  warn_100: '#1a1505',
  warn_200: '#CB7220',
  warn_300: '#FFD666',
  warn_400: '#FFF5CC',

  error: '#FFAC82',
  error_100: '#1a0906',
  error_200: '#C21434',
  error_300: '#FFAC82',
  error_400: '#FFE9D5',

  white: '#191c22',

  grey_100: '#101216',
  grey_200: '#191c22',
  grey_300: '#22262e',
  grey_400: '#30353f',
  grey_500: '#6e7681',
  grey_600: '#a2a8b4',
  grey_700: '#c9d1d9',
  grey_800: '#e6edf3',
  grey_900: '#f0f6fc',

  purple_100: '#500fd7',
  purple_400: '#ad0af8',

  background: '#101216',
  surface: '#191c22',
  surfaceAlt: '#22262e',
  text: '#f0f6fc',
  textSecondary: '#aeb6c3',
  border: '#30353f',
  borderLight: '#454c59',
  divider: '#30353f',
};

const darkShadows = {
  z_01: '0rem 0.063rem 0.125rem 0rem rgba(0, 0, 0, 0.3)',
  z_04: '0rem 0.25rem 0.5rem 0rem rgba(0, 0, 0, 0.3)',
  z_08: '0rem 0.5rem 1rem 0rem rgba(0, 0, 0, 0.3)',
  z_12: '0rem 0.75rem 1.5rem -0.25rem rgba(0, 0, 0, 0.4)',
  z_16: '0rem 1rem 2rem -0.25rem rgba(0, 0, 0, 0.4)',
  z_20: '0rem 1.25rem 2.5rem -0.25rem rgba(0, 0, 0, 0.4)',
  z_24: '0rem 1.5rem 3rem 0rem rgba(0, 0, 0, 0.4)',
  cards: '0rem 0.25rem 1rem -0.25rem rgba(0, 0, 0, 0.3)',
  dialogs: '-2.5rem 2.5rem 5rem -0.5rem rgba(0, 0, 0, 0.5)',
  dropdown: '0rem 0.5rem 1.5rem -0.25rem rgba(0, 0, 0, 0.4)',
  circle_button: '0 0 0.15rem rgba(0, 0, 0, 0.4)',
};

export const styledTheme = {
  COLORS: darkColors,
  SHADOWS: darkShadows,
  BORDERS: {
    b_01: `0.063rem solid ${darkColors.border}`,
  },
  FONTS: {
    montserrat: 'Segoe UI',
    manrope: 'Segoe UI',
    sansSerif: 'sans-serif',
  },
  SIZES: {
    xs: '(max-width: 600px)',
    sm: '(max-width: 900px)',
    md: '(max-width: 1200px)',
    lg: '(max-width: 1536px)',
    xl: '(min-width: 1536px)',
  },
};

export enum ColorsEnum {
  primary = 'primary',
  primary_100 = 'primary_100',
  primary_200 = 'primary_200',
  primary_300 = 'primary_300',
  primary_400 = 'primary_400',
  secondary = 'secondary',
  secondary_100 = 'secondary_100',
  secondary_200 = 'secondary_200',
  secondary_300 = 'secondary_300',
  secondary_400 = 'secondary_400',
  info = 'info',
  info_100 = 'info_100',
  info_200 = 'info_200',
  info_300 = 'info_300',
  info_400 = 'info_400',
  success = 'success',
  success_100 = 'success_100',
  success_200 = 'success_200',
  success_300 = 'success_300',
  success_400 = 'success_400',
  warn = 'warn',
  warn_100 = 'warn_100',
  warn_200 = 'warn_200',
  warn_300 = 'warn_300',
  warn_400 = 'warn_400',
  error = 'error',
  error_100 = 'error_100',
  error_200 = 'error_200',
  error_300 = 'error_300',
  error_400 = 'error_400',
  white = 'white',
  grey_100 = 'grey_100',
  grey_200 = 'grey_200',
  grey_300 = 'grey_300',
  grey_400 = 'grey_400',
  grey_500 = 'grey_500',
  grey_600 = 'grey_600',
  grey_700 = 'grey_700',
  grey_800 = 'grey_800',
  grey_900 = 'grey_900',
}

export type ColorsType = `${ColorsEnum}`;

export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ThemeMode = 'dark';

export const styledThemeDark = styledTheme;
export function getStyledTheme(_mode: ThemeMode) {
  return styledTheme;
}
