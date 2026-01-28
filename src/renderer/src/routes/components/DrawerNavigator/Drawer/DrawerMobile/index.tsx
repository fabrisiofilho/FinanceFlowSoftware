import { useAppDispatch, useAppSelector } from '@renderer/hooks/redux';
import { type IDrawerItem } from '@renderer/types/drawer/drawerItem';
import { closeDrawer } from '@renderer/redux/slices/drawer';
import { Drawer } from '@mui/material';
import { DrawerContent } from '../DrawerContent';

type Props = {
  items: IDrawerItem[];
};

export function DrawerMobile({ items }: Readonly<Props>) {
  const dispatch = useAppDispatch();

  const { compacted } = useAppSelector((state) => state.drawer);

  const handleCloseDrawer = () => {
    dispatch(closeDrawer());
  };

  return (
    <Drawer anchor="left" open={!compacted} onClose={handleCloseDrawer}>
      <DrawerContent
        compacted={compacted}
        items={items}
        onChangeCompacted={handleCloseDrawer}
      />
    </Drawer>
  );
}
