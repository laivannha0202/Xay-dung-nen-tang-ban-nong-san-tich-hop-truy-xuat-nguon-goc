import { Container } from '@mantine/core';
import type { ContainerProps } from '@mantine/core';
import type { ReactNode } from 'react';

type AgriContainerProps = ContainerProps & {
  children: ReactNode;
};

export function AgriContainer({ children, ...props }: AgriContainerProps) {
  return (
    <Container size={1320} px={{ base: 'md', sm: 'xl' }} {...props}>
      {children}
    </Container>
  );
}
