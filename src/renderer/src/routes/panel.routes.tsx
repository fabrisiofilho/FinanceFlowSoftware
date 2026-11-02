import { lazy, Suspense } from 'react';
import { ContentLoading } from '@renderer/components/ContentLoading';
const DiagnosticsPage = lazy(() => import('@renderer/pages/Diagnostics').then((module) => ({ default: module.DiagnosticsPage })));
const FinancingPage = lazy(() => import('@renderer/pages/Financing').then((module) => ({ default: module.FinancingPage })));
const ExternalDataPage = lazy(() => import('@renderer/pages/ExternalData').then((module) => ({ default: module.ExternalDataPage })));
import PublicRounded from '@mui/icons-material/PublicRounded';
const SettingsPage = lazy(() => import('@renderer/pages/Settings/Overview').then((module) => ({ default: module.SettingsPage })));
const IncomeTaxPage = lazy(() => import('@renderer/pages/IncomeTax').then((module) => ({ default: module.IncomeTaxPage })));
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import { buildNavigation } from './navigation';
const InvestmentsPage = lazy(() => import('@renderer/pages/Investments').then((module) => ({ default: module.InvestmentsPage })));
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
const ManualPage = lazy(() => import('@renderer/pages/Manual').then((module) => ({ default: module.ManualPage })));
import { Navigate, Route, Routes } from 'react-router-dom';
import { DrawerNavigator } from './components/DrawerNavigator';
import { IDrawerItem } from '@renderer/types/drawer/drawerItem';
import { JSX } from 'react';

const DashboardPage = lazy(() => import('@renderer/pages/Dashboard').then((module) => ({ default: module.DashboardPage })));
const TransactionsPage = lazy(() => import('@renderer/pages/Transactions').then((module) => ({ default: module.TransactionsPage })));
const AccountsPage = lazy(() => import('@renderer/pages/Accounts').then((module) => ({ default: module.AccountsPage })));
const CreditCardsPage = lazy(() => import('@renderer/pages/CreditCards').then((module) => ({ default: module.CreditCardsPage })));
const GoalsPage = lazy(() => import('@renderer/pages/Goals').then((module) => ({ default: module.GoalsPage })));
const CategoriesPage = lazy(() => import('@renderer/pages/Categories').then((module) => ({ default: module.CategoriesPage })));
const AlertsPage = lazy(() => import('@renderer/pages/Settings/Alerts').then((module) => ({ default: module.AlertsPage })));
const ReportsPage = lazy(() => import('@renderer/pages/Reports').then((module) => ({ default: module.ReportsPage })));
const BudgetPage = lazy(() => import('@renderer/pages/Budget').then((module) => ({ default: module.BudgetPage })));
const TransfersPage = lazy(() => import('@renderer/pages/Transfers').then((module) => ({ default: module.TransfersPage })));
const RecurringTransactionsPage = lazy(() => import('@renderer/pages/RecurringTransactions').then((module) => ({ default: module.RecurringTransactionsPage })));
const CashFlowPage = lazy(() => import('@renderer/pages/CashFlow').then((module) => ({ default: module.CashFlowPage })));
const AdvancedReportsPage = lazy(() => import('@renderer/pages/AdvancedReports').then((module) => ({ default: module.AdvancedReportsPage })));
const BankImportPage = lazy(() => import('@renderer/pages/BankImport').then((module) => ({ default: module.BankImportPage })));

type WithRouteProps<T> = T & {
  routePath: string;
  routeElement: JSX.Element;
};

const ROUTES_ITEMS: WithRouteProps<IDrawerItem>[] = [
  {label:'Diagnóstico',path:'/panel/diagnostics',icon:<SettingsOutlined />,canAccess:true,routeElement:<DiagnosticsPage />,routePath:'/diagnostics'},
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
      <Suspense fallback={<ContentLoading loading initial="cards"><div /></ContentLoading>}>
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
      </Suspense>
    </DrawerNavigator>
  );
}
