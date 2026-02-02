import {
  Card,
  CardHeader,
  CardContent,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import Label from 'src/components/Label';
import { OrderStatus } from 'src/models';
import { ORDER_STATUS_CONFIG } from 'src/constants';

interface OrderStatusCardProps {
  status: OrderStatus;
  updating: boolean;
  onStatusChange: (newStatus: OrderStatus) => void;
}

function OrderStatusCard({ status, updating, onStatusChange }: OrderStatusCardProps) {
  const currentStatus = ORDER_STATUS_CONFIG[status];

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader title="Статус заказа" />
      <CardContent>
        <Box mb={2}>
          <Label color={currentStatus?.color || 'info'}>
            {currentStatus?.label || status}
          </Label>
        </Box>
        <FormControl fullWidth size="small">
          <InputLabel>Изменить статус</InputLabel>
          <Select
            value={status}
            label="Изменить статус"
            onChange={(e) => onStatusChange(e.target.value as OrderStatus)}
            disabled={updating}
          >
            {Object.entries(ORDER_STATUS_CONFIG).map(([value, config]) => (
              <MenuItem key={value} value={value}>
                {config.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </CardContent>
    </Card>
  );
}

export default OrderStatusCard;
