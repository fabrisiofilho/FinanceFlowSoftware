import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import { Navigate, Route, Routes } from 'react-router-dom';
import { DrawerNavigator } from './components/DrawerNavigator';
import { IDrawerItem } from '@renderer/types/drawer/drawerItem';
import { JSX } from 'react';

import { DashboardPage } from '@renderer/pages/Dashboard';
import { TransactionsPage } from '@renderer/pages/Transactions';
import { AccountsPage } from '@renderer/pages/Accounts';
import { CreditCardsPage } from '@renderer/pages/CreditCards';
import { GoalsPage } from '@renderer/pages/Goals';
import { AlertsPage } from '@renderer/pages/Settings/Alerts';
import { ReportsPage } from '@renderer/pages/Reports';
import { ImportPage } from '@renderer/pages/Settings/Import';

type WithRouteProps<T> = T & {
  routePath: string;
  routeElement: JSX.Element;
};

const ROUTES_ITEMS: WithRouteProps<IDrawerItem>[] = [
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
    label: 'Importar Dados',
    path: '/panel/import',
    icon: <FileUploadOutlinedIcon />,
    canAccess: true,
    routeElement: <ImportPage />,
    routePath: '/import',
  },
];

export function PanelRoutes() {
  return (
    <DrawerNavigator items={ROUTES_ITEMS}>
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
