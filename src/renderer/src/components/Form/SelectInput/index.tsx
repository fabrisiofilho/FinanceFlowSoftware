import { Input as TextField } from '@renderer/components/Form/Input';
import {
  CircularProgress,
  MenuItem,
  Stack,
  type TextFieldProps,
} from '@mui/material';
import { type ChangeEvent, type Ref, forwardRef } from 'react';

export const SELECT_MENU_ITEMS_MAX_HEIGHT = 300;

type ValueObject = {
  id: number;
  [key: string]: unknown;
};

type Value = number | string | boolean | ValueObject;

export type SelectInputItem = {
  value: Value;
  label: string;
  [key: string]: unknown;
};

type SelectChangeTarget = {
  target: {
    name: string | undefined;
    value: Value;
  };
};

export type SelectInputProps = TextFieldProps & {
  items: SelectInputItem[];
  onCreate?: () => void;
  createLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  objectValue?: boolean;
  customKey?: string;
  onChange?: (event: SelectChangeTarget) => void;
};

export const SelectInput = forwardRef(function SelectInput(
  {
    onCreate,
    createLabel = 'Cadastrar agora',
    customKey,
    objectValue,
    items,
    defaultValue,
    required,
    loading,
    name,
    onChange,
    onBlur,
    value,
    ...rest
  }: SelectInputProps,
  ref,
) {
  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (event.target.value === '__create__') {
      onCreate?.();
      return;
    }
    if (objectValue) {
      const objectData = {
        target: {
          name,
          value: JSON.parse(event.target.value),
        },
      };

      onChange?.(objectData);
      return;
    }

    const data = {
      target: {
        name,
        value: event.target.value,
      },
    };

    onChange?.(data);
  };

  const handleGetValue = (data: unknown) => {
    if (typeof data === 'object' && data !== null) {
      return JSON.stringify(data);
    }

    return data as string | number | boolean | undefined;
  };

  const handleGetItemKeyAndValue = (item: SelectInputItem) => {
    if (customKey) {
      const customValue = item[customKey];
      return {
        key: customValue as string | number,
        value: customValue as string | number,
      };
    }

    if (typeof item.value === 'object') {
      return {
        key: item.value.id,
        value: JSON.stringify(item.value),
      };
    }

    return {
      key: item.value as string | number | boolean,
      value: item.value as string | number,
    };
  };

  const handleRenderLoading = () => {
    if (!loading) return;

    return (
      <Stack alignItems="center" py="1rem">
        <CircularProgress size="1.6rem" />
      </Stack>
    );
  };

  const handleRenderEmptyMessage = () => {
    if (loading || items.length > 0) return null;

    return (
      <MenuItem disabled value="">
        Nenhum item disponível
      </MenuItem>
    );
  };

  return (
    <TextField
      ref={ref as Ref<HTMLDivElement>}
      {...rest}
      name={name}
      required={required}
      select
      disabled={rest.disabled || loading}
      value={handleGetValue(value) ?? ''}
      defaultValue={handleGetValue(defaultValue) ?? ''}
      onChange={handleChange}
      onBlur={onBlur}
      slotProps={{
        select: {
          displayEmpty: true,
          sx: {
            minWidth: 0,
            '& .MuiSelect-select': {
              minHeight: '20px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          },
          renderValue: (selected) =>
            items.find(
              (item) =>
                String(handleGetItemKeyAndValue(item).value) ===
                String(selected),
            )?.label ?? 'Selecione',
          ...rest?.slotProps?.select,
          MenuProps: {
            slotProps: {
              paper: {
                sx: {
                  maxHeight: SELECT_MENU_ITEMS_MAX_HEIGHT,
                  overflowY: 'auto',
                  colorScheme: 'dark',
                },
              },
            },
          },
        },
        inputLabel: {
          shrink: true,
          required,
        },
      }}
    >
      {handleRenderEmptyMessage()}

      {items.map((item: SelectInputItem) => {
        const { key, value } = handleGetItemKeyAndValue(item);

        return (
          <MenuItem
            key={String(key)}
            value={value}
            sx={{
              minHeight: 42,
              py: 1,
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
            }}
          >
            {item.label}
          </MenuItem>
        );
      })}

      {onCreate && (
        <MenuItem
          value="__create__"
          sx={{
            minHeight: 44,
            mt: 0.5,
            borderTop: 1,
            borderColor: 'divider',
            color: 'primary.main',
            whiteSpace: 'normal',
          }}
        >
          + {createLabel}
        </MenuItem>
      )}
      {handleRenderLoading()}
    </TextField>
  );
});
