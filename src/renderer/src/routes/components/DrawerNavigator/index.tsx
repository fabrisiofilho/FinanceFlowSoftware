import { RouteTransition } from '@renderer/components/PageLayout/RouteTransition';
import { type IDrawerItem } from '@renderer/types/drawer/drawerItem';
import { ResponsiveShow } from '@renderer/components/ResponsiveShow';
import { DrawerDesktop } from './Drawer/DrawerDesktop';
import { DrawerMobile } from './Drawer/DrawerMobile';
import { Header } from './Header';
import { Container, DrawerContent, MainContainer, MainContent } from './styles';
import { PropsWithChildren } from 'react';

export const ROUTES_MAIN_SECTION_ID = 'main-route-section';

type Props = {
  items: IDrawerItem[];
};

export function DrawerNavigator({
  items,
  children,
}: Readonly<PropsWithChildren<Props>>) {
  return (
    <Container>
      <DrawerContent>
        <ResponsiveShow>
          <ResponsiveShow.When sizes={['xl', 'lg', 'sm', 'md']}>
            <DrawerDesktop items={items} />
          </ResponsiveShow.When>

          <ResponsiveShow.Else>
            <DrawerMobile items={items} />
          </ResponsiveShow.Else>
        </ResponsiveShow>
      </DrawerContent>

      <MainContainer>
        <Header />
        <MainContent id={ROUTES_MAIN_SECTION_ID}>
          <RouteTransition>{children}</RouteTransition>
        </MainContent>
      </MainContainer>
    </Container>
  );
}
