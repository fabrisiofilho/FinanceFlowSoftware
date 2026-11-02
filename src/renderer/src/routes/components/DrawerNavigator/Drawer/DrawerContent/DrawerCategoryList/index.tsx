import type { IDrawerItem } from '@renderer/types/drawer/drawerItem';
import { Box, Divider, Typography } from '@mui/material';
import { DrawerItem } from './DrawerItem';
type Props = {
  list: IDrawerItem[];
  currentPath: string;
  compacted: boolean;
  onChangeCompacted: () => void;
};
const groups = [
  {
    name: 'Seu financeiro',
    paths: [
      'dashboard',
      'transactions',
      'accounts',
      'investments',
      'budget',
      'reports',
    ],
  },
  { name: 'Preferências', paths: ['settings'] },
  { name: 'Ajuda', paths: ['manual'] },
];
export function DrawerCategoryList({
  list,
  currentPath,
  compacted,
  onChangeCompacted,
}: Readonly<Props>) {
  return (
    <Box sx={{ py: 1 }}>
      {groups.map((group) => {
        const items = group.paths.flatMap((path) =>
          list.filter((item) => item.path === '/panel/' + path),
        );
        if (!items.length) return null;
        return (
          <Box key={group.name} sx={{ mb: 1.5 }}>
            {compacted ? (
              <Divider sx={{ mx: 2, my: 1 }} />
            ) : (
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{
                  px: 2.5,
                  fontSize: 10,
                  letterSpacing: '.1em',
                  display: 'block',
                  mb: 0.5,
                }}
              >
                {group.name}
              </Typography>
            )}
            {items.map((item) => (
              <DrawerItem
                key={item.path}
                item={item}
                currentPath={currentPath}
                compacted={compacted}
                onChangeCompacted={onChangeCompacted}
              />
            ))}
          </Box>
        );
      })}
    </Box>
  );
}
