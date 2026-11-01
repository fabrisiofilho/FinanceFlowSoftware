import { DatePicker } from '@renderer/components/Form/DatePicker';
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
  return (
    <DatePicker
      label={label}
      value={value}
      disabled={disabledDatePicker}
      onAccept={onAccept}
      onChange={handleChange}
      minDate={minDate}
      maxDate={maxDate}
      disableFuture={disableFuture}
      disablePast={disablePast}
      fullWidth
    />
  );
}
