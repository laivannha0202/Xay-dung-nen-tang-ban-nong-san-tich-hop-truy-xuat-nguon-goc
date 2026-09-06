import { createTheme } from '@mantine/core';

const agrimarket = [
  '#f4f8f2',
  '#e5eee2',
  '#cadcc6',
  '#a5c4a2',
  '#78a779',
  '#558d5d',
  '#3d7048',
  '#2f5d3a',
  '#244b2c',
  '#19371f',
] as const;

const earth = [
  '#fbf7ef',
  '#f3ead8',
  '#e7d5b8',
  '#d7bc8d',
  '#c69f5e',
  '#b9863f',
  '#95682f',
  '#725027',
  '#573e22',
  '#3e2d1b',
] as const;

export const theme = createTheme({
  primaryColor: 'agrimarket',
  primaryShade: 8,
  colors: {
    agrimarket,
    earth,
  },
  defaultRadius: 'sm',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  headings: {
    fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
    fontWeight: '800',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'sm',
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
        radius: 'xs',
      },
    },
  },
});
