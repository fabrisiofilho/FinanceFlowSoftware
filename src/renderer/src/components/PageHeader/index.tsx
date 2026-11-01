import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { PageHeading } from '../PageLayout';
import type { IBreadCrumbs } from '@renderer/types/breadCrumbs';
import { Breadcrumb } from './BreadCrumb';
type Props = {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  rightContent?: ReactNode;
  breadcrumbs?: IBreadCrumbs;
};
export function PageHeader({
  title,
  description,
  actions,
  rightContent,
  breadcrumbs,
}: Props) {
  return (
    <PageHeading data-page-header>
      <Stack spacing={0.75} sx={{ minWidth: 0 }}>
        <Typography
          component="h1"
          variant="h4"
          sx={{
            fontSize: 26,
            fontWeight: 650,
            letterSpacing: '-.025em',
            lineHeight: 1.3,
          }}
        >
          {title}
        </Typography>
        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.6, overflow: 'visible' }}
          >
            {description}
          </Typography>
        )}
        {breadcrumbs && <Breadcrumb breadcrumbs={breadcrumbs} />}
      </Stack>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
          minWidth: 0,
        }}
      >
        {actions ?? rightContent}
      </Box>
    </PageHeading>
  );
}
