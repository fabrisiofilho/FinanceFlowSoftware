import path from 'node:path';
import { app, dialog } from 'electron';
import { BackupService } from '../services/backup/backup-service';
import { FinanceAuthService } from '../services/finance-auth-service';
import { BaseHandler } from './config/base-handler';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { wrap } from '@main/infrastructure/utils/try-catch';
export class BackupController extends BaseHandler {
  private service = new BackupService(
    path.join(app.getPath('userData'), 'attachments'),
  );
  private active = false;
  private authorize(): void {
    if (!FinanceAuthService.getInstance().getCurrentUserId())
      throw new Error('Entre na sua conta para continuar.');
  }
  @IpcMethod('backup:export') async export(password: string) {
    return wrap(async () => {
      this.authorize();
      if (this.active)
        throw new Error('Outra operação de backup está em andamento.');
      this.active = true;
      try {
        const file = await dialog.showSaveDialog({
          title: 'Backup criptografado de todos os perfis',
          defaultPath: 'contabily.ctbackup',
          filters: [{ name: 'Backup Contabily', extensions: ['ctbackup'] }],
        });
        if (file.canceled || !file.filePath) return false;
        await this.service.export(file.filePath, password);
        return true;
      } finally {
        this.active = false;
      }
    })();
  }
  @IpcMethod('backup:restore') async restore(password: string) {
    return wrap(async () => {
      this.authorize();
      if (this.active)
        throw new Error('Outra operação de backup está em andamento.');
      this.active = true;
      try {
        const file = await dialog.showOpenDialog({
          title: 'Restaurar backup Contabily',
          properties: ['openFile'],
          filters: [{ name: 'Backup Contabily', extensions: ['ctbackup'] }],
        });
        if (file.canceled || !file.filePaths[0]) return false;
        const confirmation = await dialog.showMessageBox({
          type: 'warning',
          title: 'Substituir todos os dados locais?',
          message:
            'Todas as contas e perfis locais serão substituídos pelo backup. O aplicativo será reiniciado. Uma cópia do banco anterior será mantida no computador.',
          buttons: ['Cancelar', 'Restaurar e reiniciar'],
          defaultId: 0,
          cancelId: 0,
        });
        if (confirmation.response !== 1) return false;
        await this.service.restore(file.filePaths[0], password);
        setTimeout(() => {
          app.relaunch();
          app.exit(0);
        }, 300);
        return true;
      } finally {
        this.active = false;
      }
    })();
  }
}
