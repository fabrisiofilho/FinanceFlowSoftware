import type { ApiResponse } from './common.types';
export const ONBOARDING_STEPS = [
  {
    title: 'Sua primeira conta',
    route: '/panel/accounts',
    description:
      'Cadastre uma conta ou carteira e informe o saldo que ela tem hoje. Cartão de crédito representa uma dívida, não dinheiro disponível.',
  },
  {
    title: 'Conheça suas categorias',
    route: '/panel/categories',
    description:
      'As categorias comuns já vêm cadastradas com ícones. Confira as opções e crie categorias que representem a sua família.',
  },
  {
    title: 'Registre uma renda',
    route: '/panel/transactions',
    description:
      'Clique em Nova receita, escolha a conta e a categoria. Liquidado significa que o dinheiro já entrou; pendente é uma previsão.',
  },
  {
    title: 'Registre uma despesa',
    route: '/panel/transactions',
    description:
      'Clique em Nova despesa. Informe valor, categoria e conta. Confira a competência e a data de pagamento para separar previsão de realizado.',
  },
  {
    title: 'Planeje os limites',
    route: '/panel/budget',
    description:
      'Crie um orçamento mensal por categoria para identificar gastos acima do planejado. Você pode configurar esta etapa depois.',
    optional: true,
  },
  {
    title: 'Acompanhe e proteja os dados',
    route: '/panel/settings',
    description:
      'Confira seus resultados na visão geral e exporte um backup nas configurações. Os registros ficam neste dispositivo; guarde a senha e uma cópia do backup.',
  },
] as const;
export interface OnboardingState {
  step: number;
  completed: boolean;
  ready: boolean;
}
export interface OnboardingAPI {
  state(): Promise<ApiResponse<OnboardingState>>;
  advance(step: number, skip?: boolean): Promise<ApiResponse<OnboardingState>>;
}
