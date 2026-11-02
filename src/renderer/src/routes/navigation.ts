import type { IDrawerItem } from '@renderer/types/drawer/drawerItem';

/** Áreas de produto independentes das URLs e dos componentes das telas. */
export const navigationAreas = [
  { label: 'Visão geral', routes: ['dashboard'] },
  {
    label: 'Movimentações',
    routes: ['transactions', 'transfers', 'recurring'],
  },
  {
    label: 'Contas e cartões',
    routes: ['accounts', 'credit-cards', 'bank-import'],
  },
  { label: 'Investimentos', routes: ['investments'] },
  {
    label: 'Planejamento',
    routes: ['budget', 'cash-flow', 'goals', 'income-tax'],
  },
  { label: 'Análises', routes: ['reports', 'advanced-reports'] },
  { label: 'Configurações', routes: ['settings', 'categories', 'alerts'] },
  { label: 'Manual do sistema', routes: ['manual'] },
] as const;

export function buildNavigation(items: IDrawerItem[]): IDrawerItem[] {
  return navigationAreas.flatMap((area) => {
    const children = area.routes.flatMap((route) =>
      items.filter((item) => item.path === '/panel/' + route && item.canAccess),
    );
    const first = children[0];
    if (!first) return [];
    return [
      {
        ...first,
        label: area.label,
        subItems:
          children.length > 1
            ? children.map((item) => ({
                label: item.label,
                path: item.path,
                end: true,
                canAccess: item.canAccess,
              }))
            : undefined,
      },
    ];
  });
}
