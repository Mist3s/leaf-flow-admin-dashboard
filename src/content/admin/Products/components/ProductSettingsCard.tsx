import {
  Card,
  CardHeader,
  CardContent,
  TextField,
  FormControlLabel,
  Switch
} from '@mui/material';

interface ProductSettingsCardProps {
  isActive: boolean;
  sortOrder: number;
  isEdit: boolean;
  onActiveChange: (checked: boolean) => void;
  onSortOrderChange: (value: number) => void;
}

function ProductSettingsCard({
  isActive,
  sortOrder,
  isEdit,
  onActiveChange,
  onSortOrderChange
}: ProductSettingsCardProps) {
  return (
    <Card>
      <CardHeader title="Настройки" />
      <CardContent>
        {isEdit && (
          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(e) => onActiveChange(e.target.checked)}
              />
            }
            label="Активен"
          />
        )}
        <TextField
          fullWidth
          type="number"
          label="Порядок сортировки"
          value={sortOrder}
          onChange={(e) => onSortOrderChange(parseInt(e.target.value) || 0)}
          sx={isEdit ? { mt: 2 } : undefined}
        />
      </CardContent>
    </Card>
  );
}

export default ProductSettingsCard;
