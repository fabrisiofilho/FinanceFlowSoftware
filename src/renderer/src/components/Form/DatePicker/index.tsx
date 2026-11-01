import { Show } from '@renderer/components/Show';
import { Box, FormHelperText } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ptBR } from 'date-fns/locale/pt-BR';
import { ptBR as pickerLocale } from '@mui/x-date-pickers/locales';
import { parseDateSafe } from '@renderer/utils/date';
import type { Ref, FocusEventHandler } from 'react';

export type DatePickerProps = {
  value: string | Date | null;
  onChange: (value: Date | null) => void;
  onAccept?: (date: Date | null) => void;
  label?: string;
  disabled?: boolean;
  disableFuture?: boolean;
  disablePast?: boolean;
  defaultValue?: Date | null;
  minDate?: Date | string | null;
  maxDate?: Date | string | null;
  helperText?: string;
  error?: boolean;
  fullWidth?: boolean;
  required?: boolean;
  views?: ('year' | 'month' | 'day')[];
  format?: string;
  inputRef?: Ref<HTMLInputElement>;
  name?: string;
  onBlur?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
};

export function DatePicker({
  value,
  onChange,
  onAccept,
  label,
  error,
  helperText,
  required,
  fullWidth,
  disabled,
  disableFuture,
  disablePast,
  minDate,
  maxDate,
  views = ['year', 'month', 'day'],
  format = 'dd/MM/yyyy',
  inputRef,
  name,
  onBlur,
}: Readonly<DatePickerProps>) {
  const handleChange = (newValue: Date | null) => {
    onChange(newValue);
  };

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
        <MuiDatePicker
          label={label}
          value={parseDateSafe(value)}
          onChange={handleChange}
          onAccept={onAccept}
          disabled={disabled}
          disableFuture={disableFuture}
          disablePast={disablePast}
          minDate={parseDateSafe(minDate) ?? undefined}
          maxDate={parseDateSafe(maxDate) ?? undefined}
          views={views}
          openTo={views.includes('day') ? 'day' : 'month'}
          format={format}
          sx={{
            '& .MuiPickersInputBase-root': {
              height: 44,
              borderRadius: 1,
              bgcolor: 'background.paper',
            },
            '& .MuiPickersSectionList-root': { padding: 0, lineHeight: '20px' },
          }}
          slotProps={{
            desktopPaper: {
              sx: {
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                '& .MuiDateCalendar-root': {
                  height: 'auto',
                  maxHeight: 'none',
                },
                '& .MuiMonthCalendar-root': {
                  height: 224,
                  minHeight: 0,
                  padding: 1,
                },
                '& .MuiYearCalendar-root': { height: 240 },
                '& .MuiPickersCalendarHeader-root': {
                  marginTop: 1,
                  marginBottom: 1,
                },
                backgroundImage: 'none',
              },
            },
            mobilePaper: { sx: { borderRadius: 3, backgroundImage: 'none' } },
            textField: {
              inputRef,
              name,
              onBlur,
              fullWidth,
              required,
              error,
              size: 'small',
              InputLabelProps: {
                shrink: true,
              },
            },
            actionBar: {
              actions: views.includes('day') ? ['clear', 'today'] : ['today'],
            },
          }}
          localeText={{
            ...pickerLocale.components.MuiLocalizationProvider.defaultProps
              .localeText,
            clearButtonLabel: 'Limpar',
            todayButtonLabel: 'Hoje',
            cancelButtonLabel: 'Cancelar',
            okButtonLabel: 'OK',
          }}
        />
      </LocalizationProvider>

      <Show.When isTrue={!!helperText}>
        <Box position="relative">
          <FormHelperText error={error} variant="outlined">
            {helperText}
          </FormHelperText>
        </Box>
      </Show.When>
    </Box>
  );
}
