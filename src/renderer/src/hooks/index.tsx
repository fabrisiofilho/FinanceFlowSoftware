import { PropsWithChildren } from 'react';
import { ConfirmModalProvider } from './confirmModal';
import { LogoutLoadingProvider } from './logoutLoading';
import { UpdateModalProvider } from './updateModal';
import { useIpcToastHandler } from './ipcToastHandler';

function IpcToastHandler({ children }: PropsWithChildren) {
  useIpcToastHandler();
  return <>{children}</>;
}

export function WithHooks({ children }: PropsWithChildren) {
  return (
    <UpdateModalProvider>
      <ConfirmModalProvider>
        <LogoutLoadingProvider>
          <IpcToastHandler>{children}</IpcToastHandler>
        </LogoutLoadingProvider>
      </ConfirmModalProvider>
    </UpdateModalProvider>
  );
}
