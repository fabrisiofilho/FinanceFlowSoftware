import { AlertEntity } from '../entities/alert.entity';
import { logger } from '@main/infrastructure/log/logger';
import {
  Alert,
  AlertWithStatus,
  AlertStatus,
  CreateAlertInput,
  UpdateAlertInput,
} from '@shared/interfaces/types/alert.types';
import { repositoryCache } from '../repositories/repository-cache';
export class AlertService {
  constructor() {}
  private get alertRepository() {
    return repositoryCache.alertRepository;
  }
  private get transactionRepository() {
    return repositoryCache.transactionRepository;
  }
  calculateAlertStatus(currentSpent: number, limitAmount: number): AlertStatus {
    if (limitAmount <= 0) {
      return 'ok';
    }
    const percentage = (currentSpent / limitAmount) * 100;
    if (percentage >= 100) {
      return 'critical';
    }
    if (percentage >= 80) {
      return 'warning';
    }
    return 'ok';
  }
  private calculatePercentage(
    currentSpent: number,
    limitAmount: number,
  ): number {
    if (limitAmount <= 0) {
      return 0;
    }
    return (currentSpent / limitAmount) * 100;
  }
  private mapEntityToAlert(entity: AlertEntity): Alert {
    return {
      id: entity.id,
      categoryId: entity.categoryId,
      categoryName: entity.category?.name ?? '',
      limitAmount: Number(entity.limitAmount),
      isActive: entity.isActive,
      createdAt: entity.createdAt ?? new Date(),
      updatedAt: entity.updatedAt ?? new Date(),
    };
  }
  private validateCreateInput(data: CreateAlertInput): void {
    if (data.categoryId === undefined || data.categoryId === null) {
      throw new Error('Categoria é obrigatória');
    }
    if (data.limitAmount === undefined || data.limitAmount === null) {
      throw new Error('Valor limite é obrigatório');
    }
    if (data.limitAmount <= 0) {
      throw new Error('Valor limite deve ser maior que zero');
    }
  }
  private validateUpdateInput(data: UpdateAlertInput): void {
    if (data.limitAmount !== undefined && data.limitAmount <= 0) {
      throw new Error('Valor limite deve ser maior que zero');
    }
  }
  async create(userId: number, data: CreateAlertInput): Promise<Alert> {
    logger.info('Criando novo alerta para usuário:', userId);
    this.validateCreateInput(data);
    const existingAlert = await this.alertRepository.alertExistsForCategory(
      userId,
      data.categoryId,
    );
    if (existingAlert) {
      throw new Error('Já existe um alerta configurado para esta categoria');
    }
    const alertData: Partial<AlertEntity> = {
      categoryId: data.categoryId,
      limitAmount: data.limitAmount,
      isActive: true,
    };
    const alertEntity = await this.alertRepository.createAlert(
      userId,
      alertData,
    );
    const createdAlert = await this.alertRepository.findById(
      alertEntity.id,
      userId,
    );
    if (!createdAlert) {
      throw new Error('Erro ao criar alerta');
    }
    logger.success(
      'Alerta criado com sucesso para categoria:',
      createdAlert.category?.name,
    );
    return this.mapEntityToAlert(createdAlert);
  }
  async update(
    userId: number,
    id: number,
    data: UpdateAlertInput,
  ): Promise<Alert> {
    logger.info('Atualizando alerta:', id);
    const existingAlert = await this.alertRepository.findById(id, userId);
    if (!existingAlert) {
      throw new Error('Alerta não encontrado');
    }
    this.validateUpdateInput(data);
    if (
      data.categoryId !== undefined &&
      data.categoryId !== existingAlert.categoryId
    ) {
      const alertExists = await this.alertRepository.alertExistsForCategory(
        userId,
        data.categoryId,
        id,
      );
      if (alertExists) {
        throw new Error('Já existe um alerta configurado para esta categoria');
      }
    }
    const updateData: Partial<AlertEntity> = {};
    if (data.categoryId !== undefined) {
      updateData.categoryId = data.categoryId;
    }
    if (data.limitAmount !== undefined) {
      updateData.limitAmount = data.limitAmount;
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }
    const updatedEntity = await this.alertRepository.updateAlert(
      id,
      userId,
      updateData,
    );
    if (!updatedEntity) {
      throw new Error('Erro ao atualizar alerta');
    }
    logger.success(
      'Alerta atualizado com sucesso:',
      updatedEntity.category?.name,
    );
    return this.mapEntityToAlert(updatedEntity);
  }
  async delete(userId: number, id: number): Promise<void> {
    logger.info('Excluindo alerta:', id);
    const existingAlert = await this.alertRepository.findById(id, userId);
    if (!existingAlert) {
      throw new Error('Alerta não encontrado');
    }
    await this.alertRepository.deleteAlert(id, userId);
    logger.success(
      'Alerta excluído com sucesso:',
      existingAlert.category?.name,
    );
  }
  async findById(userId: number, id: number): Promise<Alert | null> {
    const alertEntity = await this.alertRepository.findById(id, userId);
    if (!alertEntity) {
      return null;
    }
    return this.mapEntityToAlert(alertEntity);
  }
  async findAll(userId: number): Promise<Alert[]> {
    const alerts = await this.alertRepository.findAllByUserId(userId);
    return alerts.map((entity) => this.mapEntityToAlert(entity));
  }
  async checkAlerts(userId: number): Promise<AlertWithStatus[]> {
    logger.info('Verificando status dos alertas para usuário:', userId);
    const activeAlerts = await this.alertRepository.findActiveByUserId(userId);
    if (activeAlerts.length === 0) {
      return [];
    }
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const expensesByCategory =
      await this.transactionRepository.getExpensesByCategory(
        userId,
        currentYear,
        currentMonth,
      );
    const expensesMap = new Map<number, number>();
    for (const expense of expensesByCategory) {
      expensesMap.set(expense.categoryId, Number(expense.total));
    }
    const alertsWithStatus: AlertWithStatus[] = activeAlerts.map((alert) => {
      const limitAmount = Number(alert.limitAmount);
      const currentSpent = expensesMap.get(alert.categoryId) ?? 0;
      const percentage = this.calculatePercentage(currentSpent, limitAmount);
      const status = this.calculateAlertStatus(currentSpent, limitAmount);
      if (status === 'warning') {
        logger.warning(
          `Alerta de atenção: categoria "${alert.category?.name}" está em ${percentage.toFixed(1)}% do limite`,
        );
      } else if (status === 'critical') {
        logger.error(
          `Alerta crítico: categoria "${alert.category?.name}" ultrapassou o limite (${percentage.toFixed(1)}%)`,
        );
      }
      return {
        alertId: alert.id,
        categoryId: alert.categoryId,
        categoryName: alert.category?.name ?? '',
        limitAmount,
        currentSpent,
        percentage,
        status,
      };
    });
    logger.success(
      `Verificação de alertas concluída: ${alertsWithStatus.length} alertas verificados`,
    );
    return alertsWithStatus;
  }
}
