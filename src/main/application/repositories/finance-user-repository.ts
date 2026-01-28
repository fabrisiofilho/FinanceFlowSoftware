import { BaseRepository } from './base-repository';
import { FinanceUserEntity } from '../entities/finance-user.entity';
import { EntityManager } from 'typeorm';
export class FinanceUserRepository extends BaseRepository<FinanceUserEntity> {
  constructor(manager?: EntityManager) {
    super(FinanceUserEntity, manager);
  }
  async findByEmail(email: string): Promise<FinanceUserEntity | null> {
    return await this.findOneBy({ email });
  }
  async findById(id: number): Promise<FinanceUserEntity | null> {
    return await this.findOneBy({ id });
  }
  async emailExists(email: string): Promise<boolean> {
    const count = await this.count({ email });
    return count > 0;
  }
  async createUser(
    userData: Partial<FinanceUserEntity>,
  ): Promise<FinanceUserEntity> {
    return await this.save(userData);
  }
  async updateUser(
    id: number,
    userData: Partial<FinanceUserEntity>,
  ): Promise<FinanceUserEntity | null> {
    await this.update({ id }, userData);
    return await this.findById(id);
  }
}
