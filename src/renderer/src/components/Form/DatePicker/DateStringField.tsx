import { forwardRef } from 'react';
import { DatePicker, type DatePickerProps } from '.';

type Props = Omit<DatePickerProps, 'value' | 'onChange'> & {
  value?: string;
  onChange: (value: string) => void;
};
/** Preserva datas locais de calendário sem conversão para UTC. */
export const DateStringField = forwardRef<HTMLInputElement, Props>(
  function DateStringField({ value = '', onChange, ...props }, ref) {
    return (
      <DatePicker
        {...props}
        inputRef={ref}
        value={value || null}
        onChange={(date) => {
          if (date === null) onChange('');
          else if (Number.isFinite(date.getTime()))
            onChange(
              `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
            );
          else onChange('invalid');
        }}
      />
    );
  },
);
