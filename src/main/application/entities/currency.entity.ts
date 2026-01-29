import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('currencies')
export class CurrencyEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', unique: true })
  code!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  symbol!: string;

  @Column({ name: 'decimal_places', type: 'integer', default: 2 })
  decimalPlaces!: number;

  @Column({ name: 'is_default', type: 'integer', default: 0 })
  isDefault!: boolean;

  @Column({
    name: 'exchange_rate',
    type: 'decimal',
    precision: 18,
    scale: 8,
    default: 1,
  })
  exchangeRate!: number;

  @Column({
    name: 'last_updated',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastUpdated!: Date;

  @Column({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}
