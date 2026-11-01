import * as bcrypt from 'bcryptjs';
import { repositoryCache } from '../repositories/repository-cache';
import { logger } from '@main/infrastructure/log/logger';
import {
  RegisterInput,
  FinanceUser,
  FinanceAuthData,
} from '@shared/interfaces/types/finance-auth.types';
import { FinanceUserEntity } from '../entities/finance-user.entity';
export class FinanceAuthService {
  private static instance: FinanceAuthService;
  private currentUser: FinanceUser | null = null;
  private static readonly MIN_PASSWORD_LENGTH = 6;
  private static readonly BCRYPT_SALT_ROUNDS = 10;
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private;
  private get userRepository() {
    return repositoryCache.financeUserRepository;
  }
  static getInstance(): FinanceAuthService {
    if (!FinanceAuthService.instance) {
      FinanceAuthService.instance = new FinanceAuthService();
    }
    return FinanceAuthService.instance;
  }
  private isValidEmail(email: string): boolean {
    return FinanceAuthService.EMAIL_REGEX.test(email);
  }
  private validateRegistrationData(data: RegisterInput): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Nome é obrigatório');
    }
    if (!data.email || data.email.trim().length === 0) {
      throw new Error('E-mail é obrigatório');
    }
    if (!this.isValidEmail(data.email)) {
      throw new Error('E-mail inválido');
    }
    if (
      !data.password ||
      data.password.length < FinanceAuthService.MIN_PASSWORD_LENGTH
    ) {
      throw new Error(
        `Senha deve ter no mínimo ${FinanceAuthService.MIN_PASSWORD_LENGTH} caracteres`,
      );
    }
  }
  private mapEntityToUser(entity: FinanceUserEntity): FinanceUser {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      createdAt: entity.createdAt ?? new Date(),
    };
  }
  async register(data: RegisterInput): Promise<FinanceUser> {
    logger.info('Registrando novo usuário:', data.email);
    this.validateRegistrationData(data);
    const emailExists = await this.userRepository.emailExists(
      data.email.toLowerCase(),
    );
    if (emailExists) {
      logger.warning(
        'Tentativa de registro com email já cadastrado:',
        data.email,
      );
      throw new Error('Este e-mail já está cadastrado');
    }
    const passwordHash = await bcrypt.hash(
      data.password,
      FinanceAuthService.BCRYPT_SALT_ROUNDS,
    );
    const userEntity = await this.userRepository.createUser({
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      passwordHash,
    });
    logger.success('Usuário registrado com sucesso:', userEntity.email);
    return this.mapEntityToUser(userEntity);
  }
  async login(email: string, password: string): Promise<FinanceAuthData> {
    logger.info('Tentativa de login:', email);
    if (!email || !password) {
      throw new Error('E-mail e senha são obrigatórios');
    }
    const userEntity = await this.userRepository.findByEmail(
      email.toLowerCase().trim(),
    );
    if (!userEntity) {
      logger.warning('Tentativa de login com email não cadastrado:', email);
      throw new Error('E-mail ou senha incorretos');
    }
    const isPasswordValid = await bcrypt.compare(
      password,
      userEntity.passwordHash,
    );
    if (!isPasswordValid) {
      logger.warning('Tentativa de login com senha incorreta:', email);
      throw new Error('E-mail ou senha incorretos');
    }
    this.currentUser = this.mapEntityToUser(userEntity);
    logger.success('Login realizado com sucesso:', userEntity.email);
    return {
      user: this.currentUser,
      isAuthenticated: true,
    };
  }
  async logout(): Promise<void> {
    logger.info('Encerrando sessão do usuário');
    this.currentUser = null;
    logger.success('Sessão encerrada com sucesso');
  }
  getCurrentUser(): FinanceUser | null {
    return this.currentUser;
  }
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }
  getCurrentUserId(): number | null {
    return this.currentUser?.id ?? null;
  }
  async validateCredentials(email: string, password: string): Promise<boolean> {
    const userEntity = await this.userRepository.findByEmail(
      email.toLowerCase().trim(),
    );
    if (!userEntity) {
      return false;
    }
    return bcrypt.compare(password, userEntity.passwordHash);
  }
  async changePassword(
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    if (!this.currentUser) {
      throw new Error('Usuário não autenticado');
    }
    if (
      !newPassword ||
      newPassword.length < FinanceAuthService.MIN_PASSWORD_LENGTH
    ) {
      throw new Error(
        `Nova senha deve ter no mínimo ${FinanceAuthService.MIN_PASSWORD_LENGTH} caracteres`,
      );
    }
    const isValid = await this.validateCredentials(
      this.currentUser.email,
      oldPassword,
    );
    if (!isValid) {
      throw new Error('Senha atual incorreta');
    }
    const passwordHash = await bcrypt.hash(
      newPassword,
      FinanceAuthService.BCRYPT_SALT_ROUNDS,
    );
    await this.userRepository.updateUser(this.currentUser.id, { passwordHash });
    logger.success('Senha alterada com sucesso para:', this.currentUser.email);
  }
  async updateProfile(data: {
    name?: string;
    email?: string;
  }): Promise<FinanceUser> {
    if (!this.currentUser) {
      throw new Error('Usuário não autenticado');
    }
    const updateData: Partial<FinanceUserEntity> = {};
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new Error('Nome é obrigatório');
      }
      updateData.name = data.name.trim();
    }
    if (data.email !== undefined) {
      if (!data.email || !this.isValidEmail(data.email)) {
        throw new Error('E-mail inválido');
      }
      const normalizedEmail = data.email.toLowerCase().trim();
      if (normalizedEmail !== this.currentUser.email) {
        const emailExists =
          await this.userRepository.emailExists(normalizedEmail);
        if (emailExists) {
          throw new Error('Este e-mail já está cadastrado');
        }
      }
      updateData.email = normalizedEmail;
    }
    const updatedEntity = await this.userRepository.updateUser(
      this.currentUser.id,
      updateData,
    );
    if (!updatedEntity) {
      throw new Error('Erro ao atualizar perfil');
    }
    this.currentUser = this.mapEntityToUser(updatedEntity);
    logger.success('Perfil atualizado com sucesso:', this.currentUser.email);
    return this.currentUser;
  }
  async findById(id: number): Promise<FinanceUser | null> {
    const userEntity = await this.userRepository.findById(id);
    if (!userEntity) {
      return null;
    }
    return this.mapEntityToUser(userEntity);
  }
}
