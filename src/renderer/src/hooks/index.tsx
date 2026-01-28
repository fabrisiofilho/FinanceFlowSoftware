import { PropsWithChildren } from 'react';
import { ConfirmModalProvider } from './confirmModal';
import { LogoutLoadingProvider } from './logoutLoading';
import { UpdateModalProvider } from './updateModal';

export function WithHooks({ children }: PropsWithChildren) {
  return (
    <UpdateModalProvider>
      <ConfirmModalProvider>
        <LogoutLoadingProvider>{children}</LogoutLoadingProvider>
      </ConfirmModalProvider>
    </UpdateModalProvider>
  );
}
