import { SpaOutlined } from '@mui/icons-material';
import { Minus, Square, X } from 'lucide-react';
import { IconButton, Stack, Typography } from '@mui/material';
import styled from 'styled-components';

const Bar = styled.header`
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 18px;
  background: ${({ theme }) => theme.COLORS.surface};
  border-bottom: 1px solid ${({ theme }) => theme.COLORS.border};
  -webkit-app-region: drag;
  user-select: none;
  button {
    -webkit-app-region: no-drag;
    border-radius: 0;
    margin: 0;
    width: 46px;
    height: 40px;
  }
  button:last-child:hover {
    background: #c42b1c;
    color: white;
  }
`;

export function TitleBar() {
  const controls = window.electronAPI.windowControls;
  return (
    <Bar onDoubleClick={() => controls.toggleMaximize()}>
      <Stack direction="row" alignItems="center" gap={1}>
        <SpaOutlined sx={{ fontSize: 18, color: 'secondary.main' }} />
        <Typography variant="caption" fontWeight={600}>
          Contabily
        </Typography>
      </Stack>
      <Stack direction="row" onDoubleClick={(event) => event.stopPropagation()}>
        <IconButton
          aria-label="Minimizar janela"
          onClick={() => controls.minimize()}
        >
          <Minus size={16} strokeWidth={1.5} />
        </IconButton>
        <IconButton
          aria-label="Maximizar ou restaurar janela"
          onClick={() => controls.toggleMaximize()}
        >
          <Square size={13} strokeWidth={1.5} />
        </IconButton>
        <IconButton
          aria-label="Fechar aplicativo"
          onClick={() => controls.close()}
        >
          <X size={16} strokeWidth={1.5} />
        </IconButton>
      </Stack>
    </Bar>
  );
}
