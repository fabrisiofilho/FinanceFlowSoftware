import { DatePicker } from '../DatePicker';
import { parseDateSafe } from '@renderer/utils/date';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  fullWidth?: boolean;
};
export function MonthField({
  label,
  value,
  onChange,
  fullWidth = true,
}: Props) {
  return (
    <DatePicker
      label={label}
      value={parseDateSafe(`${value}-01`)}
      views={['year', 'month']}
      format="MMM/yyyy"
      fullWidth={fullWidth}
      onChange={(date) => {
        if (date && Number.isFinite(date.getTime()))
          onChange(
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
          );
      }}
    />
  );
}
