import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  IconButton,
  TextField,
  Grid,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import SaveTwoToneIcon from '@mui/icons-material/SaveTwoTone';
import { Order, OrderUpdate, DeliveryMethod } from 'src/models';
import { DELIVERY_METHOD_CONFIG } from 'src/constants';

interface OrderDeliveryCardProps {
  order: Order;
  onSave: (data: OrderUpdate) => Promise<void>;
}

function OrderDeliveryCard({ order, onSave }: OrderDeliveryCardProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    delivery: order.delivery,
    address: order.address || '',
    comment: order.comment || ''
  });

  const handleSave = async () => {
    setSaving(true);
    await onSave(formData);
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      delivery: order.delivery,
      address: order.address || '',
      comment: order.comment || ''
    });
    setEditing(false);
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title="Доставка"
        action={
          !editing ? (
            <IconButton size="small" onClick={() => setEditing(true)}>
              <EditTwoToneIcon fontSize="small" />
            </IconButton>
          ) : null
        }
      />
      <CardContent>
        {editing ? (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Способ доставки</InputLabel>
                <Select
                  value={formData.delivery}
                  label="Способ доставки"
                  onChange={(e) => setFormData({ ...formData, delivery: e.target.value as DeliveryMethod })}
                >
                  {Object.entries(DELIVERY_METHOD_CONFIG).map(([value, config]) => (
                    <MenuItem key={value} value={value}>
                      {config.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Адрес"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Комментарий"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" gap={1} justifyContent="flex-end">
                <Button size="small" onClick={handleCancel}>
                  Отмена
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={16} /> : <SaveTwoToneIcon />}
                >
                  Сохранить
                </Button>
              </Box>
            </Grid>
          </Grid>
        ) : (
          <>
            <Typography variant="body1" fontWeight="bold" gutterBottom>
              {DELIVERY_METHOD_CONFIG[order.delivery]?.label || order.delivery}
            </Typography>
            {order.address && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {order.address}
              </Typography>
            )}
            {order.comment && (
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  Комментарий:
                </Typography>
                <Typography variant="body2">{order.comment}</Typography>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default OrderDeliveryCard;
