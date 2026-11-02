import { PageHeader } from '@renderer/components/PageHeader';
import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import {
  MenuBookOutlined,
  SearchRounded,
  ArrowForwardRounded,
  CheckCircleOutlineRounded,
  DashboardOutlined,
  ReceiptLongOutlined,
  AccountBalanceOutlined,
  CategoryOutlined,
  CreditCardOutlined,
  SavingsOutlined,
  NotificationsOutlined,
  AssessmentOutlined,
  CalculateOutlined,
  SwapHorizOutlined,
  RepeatOutlined,
  TimelineOutlined,
  SyncOutlined,
  SettingsOutlined,
  PublicOutlined,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { ContentSurface, PageContainer } from '@renderer/components/PageLayout';
import { Input } from '@renderer/components/Form/Input';
import { manualTopics } from './topics';
const icons: Record<string, typeof MenuBookOutlined> = {
  '/panel/dashboard': DashboardOutlined,
  '/panel/transactions': ReceiptLongOutlined,
  '/panel/accounts': AccountBalanceOutlined,
  '/panel/categories': CategoryOutlined,
  '/panel/credit-cards': CreditCardOutlined,
  '/panel/goals': SavingsOutlined,
  '/panel/alerts': NotificationsOutlined,
  '/panel/reports': AssessmentOutlined,
  '/panel/budget': CalculateOutlined,
  '/panel/income-tax': CalculateOutlined,
  '/panel/transfers': SwapHorizOutlined,
  '/panel/recurring': RepeatOutlined,
  '/panel/cash-flow': TimelineOutlined,
  '/panel/advanced-reports': AssessmentOutlined,
  '/panel/bank-import': SyncOutlined,
  '/panel/settings': SettingsOutlined,
  '/panel/external-data': PublicOutlined,
};
const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
export function ManualPage() {
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(manualTopics[0].title);
  const topics = manualTopics.filter((topic) =>
    normalize(
      [topic.title, topic.description, ...topic.steps].join(' '),
    ).includes(normalize(search)),
  );
  const selected = topics.find((topic) => topic.title === active) ?? topics[0];
  return (
    <PageContainer>
      <PageHeader
        title="Manual do sistema"
        description="Conheça cada recurso do Contabily e cuide das suas finanças com confiança."
      />
      <ContentSurface loading={false} sx={{ p: 3, mb: 3 }}>
        <Input
          fullWidth
          label="Buscar uma função ou dúvida"
          placeholder="Ex.: receitas, cartão, importar…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded />
                </InputAdornment>
              ),
            },
          }}
          sx={{ maxWidth: 640 }}
        />
      </ContentSurface>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '280px minmax(0,1fr)' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <ContentSurface sx={{ p: 1 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ px: 2, py: 1, display: 'block' }}
          >
            Explore o sistema · {topics.length} guias
          </Typography>
          <List
            aria-label="Assuntos do manual"
            sx={{ maxHeight: 640, overflowY: 'auto' }}
          >
            {topics.map((topic) => {
              const Icon = icons[topic.route] ?? MenuBookOutlined;
              return (
                <ListItemButton
                  key={topic.title}
                  selected={selected?.title === topic.title}
                  onClick={() => setActive(topic.title)}
                  sx={{ borderRadius: 2, mb: 0.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={topic.title}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: selected?.title === topic.title ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </ContentSurface>
        {selected ? (
          <ContentSurface sx={{ p: { xs: 3, md: 4 } }}>
            <Chip
              label="Guia de uso"
              color="secondary"
              size="small"
              sx={{ mb: 2 }}
            />
            <Typography variant="h4" component="h2" mb={1}>
              {selected.title}
            </Typography>
            <Typography color="text.secondary" mb={4}>
              {selected.description}
            </Typography>
            <Stack
              component="ol"
              spacing={3}
              sx={{ listStyle: 'none', m: 0, p: 0 }}
            >
              {selected.steps.map((step, index) => (
                <Stack
                  key={step}
                  component="li"
                  direction="row"
                  spacing={2}
                  alignItems="flex-start"
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      bgcolor: 'action.selected',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </Box>
                  <Typography variant="body2" sx={{ pt: 0.5, lineHeight: 1.8 }}>
                    {step}
                  </Typography>
                </Stack>
              ))}
            </Stack>
            <Box
              sx={{
                mt: 4,
                pt: 3,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Button
                component={Link}
                to={selected.route}
                variant="contained"
                color="secondary"
                endIcon={<ArrowForwardRounded />}
              >
                Abrir{' '}
                {selected.title === 'Primeiros passos'
                  ? 'Contas'
                  : 'funcionalidade'}
              </Button>
            </Box>
            <Stack
              direction="row"
              gap={1}
              alignItems="center"
              sx={{ mt: 3, color: 'text.secondary' }}
            >
              <CheckCircleOutlineRounded fontSize="small" />
              <Typography variant="caption">
                Suas informações permanecem neste computador.
              </Typography>
            </Stack>
          </ContentSurface>
        ) : (
          <ContentSurface sx={{ p: 4 }}>
            <Typography role="status">
              Nenhum assunto encontrado. Tente outro termo.
            </Typography>
            <Button onClick={() => setSearch('')}>Limpar busca</Button>
          </ContentSurface>
        )}
      </Box>
    </PageContainer>
  );
}
