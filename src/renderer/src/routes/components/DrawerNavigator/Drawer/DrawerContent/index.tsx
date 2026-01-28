import { Show } from '@renderer/components/Show';
import { AppVersion } from '@renderer/components/AppVersion';
import { type IDrawerItem } from '@renderer/types/drawer/drawerItem';
import { useLocation } from 'react-router-dom';
import { DrawerArrowButton } from './DrawerArrowButton';
import { DrawerCategoryList } from './DrawerCategoryList';
import { Container, Content, LogoContainer, LogoText } from './styles';

type Props = {
  items: IDrawerItem[];
  compacted: boolean;
  onChangeCompacted: () => void;
};

export function DrawerContent({
  items,
  compacted,
  onChangeCompacted,
}: Readonly<Props>) {
  const { pathname, search } = useLocation();

  return (
    <Container compacted={compacted}>
      <LogoContainer>
        <LogoText compacted={compacted}>FinanceFlow</LogoText>

        <DrawerArrowButton onClick={onChangeCompacted} />
      </LogoContainer>

      <Content>
        <Show.When isTrue={items.length > 0}>
          <DrawerCategoryList
            list={items}
            currentPath={`${pathname}${search}`}
            compacted={compacted}
            onChangeCompacted={onChangeCompacted}
          />
        </Show.When>
      </Content>

      <AppVersion compacted={compacted} />
    </Container>
  );
}
