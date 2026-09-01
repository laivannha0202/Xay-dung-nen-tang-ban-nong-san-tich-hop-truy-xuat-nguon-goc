import { createTheme } from '@mantine/core';

const mauAgriMarket = [
  '#f1fbf4',
  '#dff5e5',
  '#bce9c9',
  '#95dcaa',
  '#74d191',
  '#5fc981',
  '#53c579',
  '#42ad67',
  '#369a5a',
  '#27864b',
] as const;

export const theme = createTheme({
  primaryColor: 'agrimarket',
  primaryShade: 7,
  colors: {
    agrimarket: mauAgriMarket,
  },
  defaultRadius: 'md',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  headings: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight: '700',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'xl',
      },
    },
    Card: {
      defaultProps: {
        radius: 'lg',
      },
    },
  },
});
