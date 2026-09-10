import { THUONG_HIEU_AGRIMARKET } from '@agrimarket/api-client';
import { createTheme } from '@mantine/core';

const agrimarket = [
  THUONG_HIEU_AGRIMARKET.softest,
  THUONG_HIEU_AGRIMARKET.soft,
  '#BDE9CF',
  '#8FD9AC',
  '#5AC287',
  '#2FAA68',
  THUONG_HIEU_AGRIMARKET.primary,
  THUONG_HIEU_AGRIMARKET.primaryDark,
  THUONG_HIEU_AGRIMARKET.primaryDarker,
  '#043F2A',
] as const;

const earth = [
  '#FBF7EF',
  '#F3EAD8',
  '#E7D5B8',
  '#D7BC8D',
  '#C69F5E',
  '#B9863F',
  '#95682F',
  '#725027',
  '#573E22',
  '#3E2D1B',
] as const;

const FONT_SANS =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export const theme = createTheme({
  primaryColor: 'agrimarket',
  primaryShade: 6,
  colors: {
    agrimarket,
    earth,
  },
  defaultRadius: 'md',
  fontFamily: FONT_SANS,
  headings: {
    fontFamily: FONT_SANS,
    fontWeight: '800',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
      },
    },
    Paper: {
      defaultProps: {
        radius: 'md',
      },
    },
    Badge: {
      defaultProps: {
        radius: 'sm',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
    },
    PasswordInput: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
});
