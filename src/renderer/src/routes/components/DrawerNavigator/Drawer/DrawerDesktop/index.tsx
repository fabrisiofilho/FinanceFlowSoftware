import { useDebounce } from '@renderer/hooks/debounce';
import { useAppDispatch, useAppSelector } from '@renderer/hooks/redux';
import { type IDrawerItem } from '@renderer/types/drawer/drawerItem';
import { closeDrawer, openDrawer } from '@renderer/redux/slices/drawer';
import { useState } from 'react';
import { DrawerContent } from '../DrawerContent';
import { DynamicWidthContainer } from './styles';

type Props = {
  items: IDrawerItem[];
};

export function DrawerDesktop({ items }: Readonly<Props>) {
  const dispatch = useAppDispatch();

  const { compacted } = useAppSelector((state) => state.drawer);

  const [isHovering, setIsHovering] = useState(false);
  const debouncedHovering = useDebounce(isHovering, 150);

  const isCompacted = compacted && !debouncedHovering;

  const handleOnClickArrowButton = () => {
    if (compacted) {
      dispatch(openDrawer());
      return;
    }

    dispatch(closeDrawer());
  };

  return (
    <DynamicWidthContainer
      compacted={isCompacted}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <DrawerContent
        items={items}
        compacted={isCompacted}
        onChangeCompacted={handleOnClickArrowButton}
      />
    </DynamicWidthContainer>
  );
}
