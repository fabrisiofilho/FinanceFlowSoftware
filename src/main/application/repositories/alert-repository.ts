import { BaseRepository } from './base-repository';
import { AlertEntity } from '../entities/alert.entity';
import { EntityManager } from 'typeorm';
export class AlertRepository extends BaseRepository<AlertEntity> {
  constructor(manager?: EntityManager) {
    super(AlertEntity, manager);
  }
  async findById(id: number, userId: number): Promise<AlertEntity | null> {
    return await this.findOne({
      where: { id, userId },
      relations: ['category'],
    });
  }
  async findAllByUserId(userId: number): Promise<AlertEntity[]> {
    return await this.find({
      where: { userId },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }
  async findActiveByUserId(userId: number): Promise<AlertEntity[]> {
    return await this.find({
      where: { userId, isActive: true },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }
  async findByCategory(
    userId: number,
    categoryId: number,
  ): Promise<AlertEntity | null> {
    return await this.findOne({
      where: { userId, categoryId },
      relations: ['category'],
    });
  }
  async alertExistsForCategory(
    userId: number,
    categoryId: number,
    excludeId?: number,
  ): Promise<boolean> {
    const query = this.repository
      .createQueryBuilder('alert')
      .where('alert.user_id = :userId', { userId })
      .andWhere('alert.category_id = :categoryId', { categoryId });
    if (excludeId) {
      query.andWhere('alert.id != :excludeId', { excludeId });
    }
    const count = await query.getCount();
    return count > 0;
  }
  async createAlert(
    userId: number,
    alertData: Partial<AlertEntity>,
  ): Promise<AlertEntity> {
    return await this.save({ ...alertData, userId, isActive: true });
  }
  async updateAlert(
    id: number,
    userId: number,
    alertData: Partial<AlertEntity>,
  ): Promise<AlertEntity | null> {
    await this.update({ id, userId }, alertData);
    return await this.findById(id, userId);
  }
  async deleteAlert(id: number, userId: number): Promise<void> {
    await this.delete({ id, userId });
  }
  async toggleActive(id: number, userId: number): Promise<AlertEntity | null> {
    const alert = await this.findById(id, userId);
    if (!alert) {
      return null;
    }
    await this.update({ id, userId }, { isActive: !alert.isActive });
    return await this.findById(id, userId);
  }
  async deactivate(id: number, userId: number): Promise<void> {
    await this.update({ id, userId }, { isActive: false });
  }
  async activate(id: number, userId: number): Promise<void> {
    await this.update({ id, userId }, { isActive: true });
  }
  async deleteByCategory(categoryId: number): Promise<void> {
    await this.delete({ categoryId });
  }
}
