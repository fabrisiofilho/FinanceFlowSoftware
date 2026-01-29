import { logger } from '@main/infrastructure/log/logger';
import { getDataSource } from '@main/infrastructure/database/data-source';
import { CurrencyEntity } from '../entities/currency.entity';
import {
  Currency,
  CreateCurrencyInput,
  UpdateCurrencyInput,
  CurrencyConversion,
} from '@shared/interfaces/types/currency.types';

export class CurrencyService {
  private get currencyRepository() {
    return getDataSource().getRepository(CurrencyEntity);
  }

  private mapEntityToCurrency(entity: CurrencyEntity): Currency {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      symbol: entity.symbol,
      decimalPlaces: entity.decimalPlaces,
      isDefault: Boolean(entity.isDefault),
      exchangeRate: Number(entity.exchangeRate),
      lastUpdated: entity.lastUpdated,
      createdAt: entity.createdAt,
    };
  }

  async create(data: CreateCurrencyInput): Promise<Currency> {
    logger.info('Criando moeda:', data.code);

    const existing = await this.currencyRepository.findOne({
      where: { code: data.code },
    });

    if (existing) {
      throw new Error('Moeda já cadastrada');
    }

    const currency = this.currencyRepository.create({
      code: data.code.toUpperCase(),
      name: data.name,
      symbol: data.symbol,
      decimalPlaces: data.decimalPlaces ?? 2,
      exchangeRate: data.exchangeRate ?? 1,
      isDefault: false,
    });

    const saved = await this.currencyRepository.save(currency);
    logger.success('Moeda criada:', saved.id);

    return this.mapEntityToCurrency(saved);
  }

  async update(id: number, data: UpdateCurrencyInput): Promise<Currency> {
    logger.info('Atualizando moeda:', id);

    const currency = await this.currencyRepository.findOne({
      where: { id },
    });

    if (!currency) {
      throw new Error('Moeda não encontrada');
    }

    if (data.name) currency.name = data.name;
    if (data.symbol) currency.symbol = data.symbol;
    if (data.exchangeRate !== undefined) {
      currency.exchangeRate = data.exchangeRate;
      currency.lastUpdated = new Date();
    }

    const saved = await this.currencyRepository.save(currency);
    return this.mapEntityToCurrency(saved);
  }

  async delete(id: number): Promise<void> {
    const currency = await this.currencyRepository.findOne({
      where: { id },
    });

    if (!currency) {
      throw new Error('Moeda não encontrada');
    }

    if (currency.isDefault) {
      throw new Error('Não é possível excluir a moeda padrão');
    }

    await this.currencyRepository.remove(currency);
    logger.success('Moeda excluída:', id);
  }

  async findById(id: number): Promise<Currency | null> {
    const currency = await this.currencyRepository.findOne({
      where: { id },
    });

    return currency ? this.mapEntityToCurrency(currency) : null;
  }

  async findByCode(code: string): Promise<Currency | null> {
    const currency = await this.currencyRepository.findOne({
      where: { code: code.toUpperCase() },
    });

    return currency ? this.mapEntityToCurrency(currency) : null;
  }

  async findAll(): Promise<Currency[]> {
    const currencies = await this.currencyRepository.find({
      order: { isDefault: 'DESC', code: 'ASC' },
    });

    return currencies.map((c) => this.mapEntityToCurrency(c));
  }

  async getDefault(): Promise<Currency> {
    const currency = await this.currencyRepository.findOne({
      where: { isDefault: true },
    });

    if (!currency) {
      throw new Error('Moeda padrão não configurada');
    }

    return this.mapEntityToCurrency(currency);
  }

  async setDefault(id: number): Promise<Currency> {
    const currency = await this.currencyRepository.findOne({
      where: { id },
    });

    if (!currency) {
      throw new Error('Moeda não encontrada');
    }

    // Remove default from all currencies
    await this.currencyRepository.update({}, { isDefault: false });

    // Set new default
    currency.isDefault = true;
    const saved = await this.currencyRepository.save(currency);

    logger.success('Moeda padrão definida:', currency.code);
    return this.mapEntityToCurrency(saved);
  }

  async convert(
    fromCode: string,
    toCode: string,
    amount: number,
  ): Promise<CurrencyConversion> {
    const fromCurrency = await this.findByCode(fromCode);
    const toCurrency = await this.findByCode(toCode);

    if (!fromCurrency || !toCurrency) {
      throw new Error('Moeda não encontrada');
    }

    // Convert to base currency (BRL) first, then to target
    const baseAmount = amount / fromCurrency.exchangeRate;
    const convertedAmount = baseAmount * toCurrency.exchangeRate;
    const exchangeRate = toCurrency.exchangeRate / fromCurrency.exchangeRate;

    return {
      fromCurrency: fromCode,
      toCurrency: toCode,
      amount,
      convertedAmount,
      exchangeRate,
    };
  }

  async updateExchangeRates(
    rates: { code: string; rate: number }[],
  ): Promise<void> {
    logger.info('Atualizando taxas de câmbio');

    for (const { code, rate } of rates) {
      const currency = await this.currencyRepository.findOne({
        where: { code: code.toUpperCase() },
      });

      if (currency) {
        currency.exchangeRate = rate;
        currency.lastUpdated = new Date();
        await this.currencyRepository.save(currency);
      }
    }

    logger.success(`Atualizadas ${rates.length} taxas de câmbio`);
  }
}
