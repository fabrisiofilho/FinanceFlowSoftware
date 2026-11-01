import { forwardRef } from 'react';
import MuiTextField, { type TextFieldProps } from '@mui/material/TextField';

/** Ponto único para campos de texto, senha, número, busca e selects. */
export const Input = forwardRef<HTMLDivElement, TextFieldProps>(
  function Input(props, ref) {
    return (
      <MuiTextField variant="outlined" size="small" {...props} ref={ref} />
    );
  },
) as typeof MuiTextField;
