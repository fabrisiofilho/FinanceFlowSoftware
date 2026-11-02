import { FinancingPage } from '@renderer/pages/Financing';
import { ExternalDataPage } from '@renderer/pages/ExternalData';
import PublicRounded from '@mui/icons-material/PublicRounded';
import { SettingsPage } from '@renderer/pages/Settings/Overview';
import { IncomeTaxPage } from '@renderer/pages/IncomeTax';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import { buildNavigation } from './navigation';
import { InvestmentsPage } from '@renderer/pages/Investments';
import ShowChartRounded from '@mui/icons-material/ShowChartRounded';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import RepeatOutlinedIcon from '@mui/icons-material/RepeatOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import SyncOutlinedIcon from '@mui/icons-material/SyncOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import { ManualPage } from '@renderer/pages/Manual';
import { Navigate, Route, Routes } from 'react-router-dom';
import { DrawerNavigator } from './components/DrawerNavigator';
import { IDrawerItem } from '@renderer/types/drawer/drawerItem';
import { JSX } from 'react';

import { DashboardPage } from '@renderer/pages/Dashboard';
import { TransactionsPage } from '@renderer/pages/Transactions';
import { AccountsPage } from '@renderer/pages/Accounts';
import { CreditCardsPage } from '@renderer/pages/CreditCards';
import { GoalsPage } from '@renderer/pages/Goals';
import { CategoriesPage } from '@renderer/pages/Categories';
import { AlertsPage } from '@renderer/pages/Settings/Alerts';
import { ReportsPage } from '@renderer/pages/Reports';
import { BudgetPage } from '@renderer/pages/Budget';
import { TransfersPage } from '@renderer/pages/Transfers';
import { RecurringTransactionsPage } from '@renderer/pages/RecurringTransactions';
import { CashFlowPage } from '@renderer/pages/CashFlow';
import { AdvancedReportsPage } from '@renderer/pages/AdvancedReports';
import { BankImportPage } from '@renderer/pages/BankImport';

type WithRouteProps<T> = T & {
  routePath: string;
  routeElement: JSX.Element;
};

const ROUTES_ITEMS: WithRouteProps<IDrawerItem>[] = [
  { label: 'Financiamentos', path: '/panel/financing', icon: <AccountBalanceOutlinedIcon />, canAccess: true, routeElement: <FinancingPage />, routePath: '/financing' },
  {
    label: 'Dados externos',
    path: '/panel/external-data',
    icon: <PublicRounded />,
    canAccess: true,
    routeElement: <ExternalDataPage />,
    routePath: '/external-data',
  },
  {
    label: 'Simulação de IR',
    path: '/panel/income-tax',
    icon: <CalculateOutlinedIcon />,
    canAccess: true,
    routeElement: <IncomeTaxPage />,
    routePath: '/income-tax',
  },
  {
    label: 'Preferências e backup',
    path: '/panel/settings',
    icon: <SettingsOutlined />,
    canAccess: true,
    routeElement: <SettingsPage />,
    routePath: '/settings',
  },
  {
    label: 'Investimentos',
    path: '/panel/investments',
    icon: <ShowChartRounded />,
    canAccess: true,
    routeElement: <InvestmentsPage />,
    routePath: '/investments',
  },
  {
    label: 'Dashboard',
    path: '/panel/dashboard',
    icon: <AccountBalanceWalletOutlinedIcon />,
    canAccess: true,
    routeElement: <DashboardPage />,
    routePath: '/dashboard',
  },
  {
    label: 'Transações',
    path: '/panel/transactions',
    icon: <ReceiptLongOutlinedIcon />,
    canAccess: true,
    routeElement: <TransactionsPage />,
    routePath: '/transactions',
  },
  {
    label: 'Contas',
    path: '/panel/accounts',
    icon: <AccountBalanceOutlinedIcon />,
    canAccess: true,
    routeElement: <AccountsPage />,
    routePath: '/accounts',
  },
  {
    label: 'Cartões de Crédito',
    path: '/panel/credit-cards',
    icon: <CreditCardOutlinedIcon />,
    canAccess: true,
    routeElement: <CreditCardsPage />,
    routePath: '/credit-cards',
  },
  {
    label: 'Metas',
    path: '/panel/goals',
    icon: <SavingsOutlinedIcon />,
    canAccess: true,
    routeElement: <GoalsPage />,
    routePath: '/goals',
  },
  {
    label: 'Categorias',
    path: '/panel/categories',
    icon: <CategoryOutlinedIcon />,
    canAccess: true,
    routeElement: <CategoriesPage />,
    routePath: '/categories',
  },
  {
    label: 'Alertas',
    path: '/panel/alerts',
    icon: <NotificationsOutlinedIcon />,
    canAccess: true,
    routeElement: <AlertsPage />,
    routePath: '/alerts',
  },
  {
    label: 'Relatórios',
    path: '/panel/reports',
    icon: <AssessmentOutlinedIcon />,
    canAccess: true,
    routeElement: <ReportsPage />,
    routePath: '/reports',
  },
  {
    label: 'Orçamento',
    path: '/panel/budget',
    icon: <CalculateOutlinedIcon />,
    canAccess: true,
    routeElement: <BudgetPage />,
    routePath: '/budget',
  },
  {
    label: 'Transferências',
    path: '/panel/transfers',
    icon: <SwapHorizOutlinedIcon />,
    canAccess: true,
    routeElement: <TransfersPage />,
    routePath: '/transfers',
  },
  {
    label: 'Recorrentes',
    path: '/panel/recurring',
    icon: <RepeatOutlinedIcon />,
    canAccess: true,
    routeElement: <RecurringTransactionsPage />,
    routePath: '/recurring',
  },
  {
    label: 'Fluxo de Caixa',
    path: '/panel/cash-flow',
    icon: <TimelineOutlinedIcon />,
    canAccess: true,
    routeElement: <CashFlowPage />,
    routePath: '/cash-flow',
  },
  {
    label: 'Relatórios Avançados',
    path: '/panel/advanced-reports',
    icon: <AssessmentOutlinedIcon />,
    canAccess: true,
    routeElement: <AdvancedReportsPage />,
    routePath: '/advanced-reports',
  },
  {
    label: 'Importar Transações',
    path: '/panel/bank-import',
    icon: <SyncOutlinedIcon />,
    canAccess: true,
    routeElement: <BankImportPage />,
    routePath: '/bank-import',
  },
  {
    label: 'Manual do sistema',
    path: '/panel/manual',
    icon: <MenuBookOutlinedIcon />,
    canAccess: true,
    routeElement: <ManualPage />,
    routePath: '/manual',
  },
];

export function PanelRoutes() {
  return (
    <DrawerNavigator items={buildNavigation(ROUTES_ITEMS)}>
      <Routes>
        {ROUTES_ITEMS.map((item) => (
          <Route
            key={item.routePath}
            path={item.routePath}
            element={item.routeElement}
          />
        ))}

        <Route path="/" element={<Navigate to="/panel/dashboard" replace />} />
      </Routes>
    </DrawerNavigator>
  );
}
