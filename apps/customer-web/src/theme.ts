import { THUONG_HIEU_AGRIMARKET } from '@agrimarket/api-client';
import { createTheme } from '@mantine/core';

const agrimarket = [
  '#F1FAF5',
  '#E0F5E9',
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
  '#FFFCF7',
  '#F8F2E8',
  '#EEE2D0',
  '#DEC9AA',
  '#CCA66F',
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
      styles: {
        root: {
          fontWeight: 750,
        },
      },
    },
    Card: {
      defaultProps: {
        radius: 'lg',
      },
    },
    Paper: {
      defaultProps: {
        radius: 'lg',
      },
    },
    Badge: {
      defaultProps: {
        radius: 'xl',
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
    NumberInput: {
      defaultProps: {
        radius: 'md',
      },
    },
    Select: {
      defaultProps: {
        radius: 'md',
      },
    },
    Textarea: {
      defaultProps: {
        radius: 'md',
      },
    },
    Alert: {
      defaultProps: {
        radius: 'lg',
      },
    },
  },
});
