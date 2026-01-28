import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ptBR } from 'date-fns/locale/pt-BR';

type Props = {
  label: string;
  value: string | Date | null;
  onAccept?: (date: string | Date | null) => void;
  handleChange: (value: string | Date | null) => void;
  disabledDatePicker?: boolean;
  disableFuture?: boolean;
  disablePast?: boolean;
  minDate?: Date | string | null;
  maxDate?: Date | string | null;
  popperOffset?: number[];
};

export function DatePickerField({
  label,
  value,
  disabledDatePicker,
  onAccept,
  handleChange,
  minDate,
  maxDate,
  disableFuture,
  disablePast,
}: Readonly<Props>) {
  let mininumDate: Date | undefined;
  let maximumDate: Date | undefined;

  if (minDate) {
    const minDateStr = String(minDate);
    if (!minDateStr.includes(':')) {
      mininumDate = new Date(`${minDateStr}T03:00:00+0000`);
    } else {
      mininumDate = new Date(minDateStr);
    }
  }

  if (maxDate) {
    const maxDateStr = String(maxDate);
    if (!maxDateStr.includes(':')) {
      maximumDate = new Date(`${maxDateStr}T03:00:00+0000`);
    } else {
      maximumDate = new Date(maxDateStr);
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <MuiDatePicker
        views={['year', 'day']}
        minDate={mininumDate}
        maxDate={maximumDate}
        label={label}
        value={(value && new Date(value)) || null}
        disabled={disabledDatePicker}
        disableFuture={disableFuture}
        disablePast={disablePast}
        onChange={handleChange}
        onAccept={onAccept}
      />
    </LocalizationProvider>
  );
}
