import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Chip,
  IconButton,
  TextField,
  Grid,
  Box,
  Button,
  CircularProgress
} from '@mui/material';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import SaveTwoToneIcon from '@mui/icons-material/SaveTwoTone';
import { useNavigate } from 'react-router-dom';
import { Order, OrderUpdate } from 'src/models';
import { ROUTES } from 'src/constants';

interface OrderCustomerCardProps {
  order: Order;
  onSave: (data: OrderUpdate) => Promise<void>;
}

function OrderCustomerCard({ order, onSave }: OrderCustomerCardProps) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: order.customer_name,
    phone: order.phone
  });

  const handleSave = async () => {
    setSaving(true);
    await onSave(formData);
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      customer_name: order.customer_name,
      phone: order.phone
    });
    setEditing(false);
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title="Клиент"
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
              <TextField
                fullWidth
                size="small"
                label="Имя клиента"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Телефон"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              {order.customer_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {order.phone}
            </Typography>
            {order.user_id && (
              <Chip
                size="small"
                label={`ID: ${order.user_id}`}
                onClick={() => navigate(ROUTES.USER_DETAIL(order.user_id!))}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default OrderCustomerCard;
