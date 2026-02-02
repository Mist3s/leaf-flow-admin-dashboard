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
  onActiveChange: (checked: boolean) => void;
  onSortOrderChange: (value: number) => void;
}

function ProductSettingsCard({
  isActive,
  sortOrder,
  onActiveChange,
  onSortOrderChange
}: ProductSettingsCardProps) {
  return (
    <Card>
      <CardHeader title="Настройки" />
      <CardContent>
        <FormControlLabel
          control={
            <Switch
              checked={isActive}
              onChange={(e) => onActiveChange(e.target.checked)}
            />
          }
          label="Активен"
        />
        <TextField
          fullWidth
          type="number"
          label="Порядок сортировки"
          value={sortOrder}
          onChange={(e) => onSortOrderChange(parseInt(e.target.value) || 0)}
          sx={{ mt: 2 }}
        />
      </CardContent>
    </Card>
  );
}

export default ProductSettingsCard;
