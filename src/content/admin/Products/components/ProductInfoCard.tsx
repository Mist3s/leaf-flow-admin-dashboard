import {
  Card,
  CardHeader,
  CardContent,
  TextField,
  MenuItem,
  Grid,
  Box,
  Button,
  Chip
} from '@mui/material';
import { Category } from 'src/models';
import { PRODUCT_TYPE_CONFIG } from 'src/constants';

interface ProductFormData {
  id: string;
  name: string;
  description: string;
  category_slug: string;
  product_type_code: string;
  tags: string[];
  is_active: boolean;
  sort_order: number;
}

interface ProductInfoCardProps {
  formData: ProductFormData;
  categories: Category[];
  isEdit: boolean;
  newTag: string;
  onFieldChange: (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNewTagChange: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
}

function ProductInfoCard({
  formData,
  categories,
  isEdit,
  newTag,
  onFieldChange,
  onNewTagChange,
  onAddTag,
  onRemoveTag
}: ProductInfoCardProps) {
  return (
    <Card>
      <CardHeader title="Основная информация" />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="ID продукта"
              value={formData.id}
              onChange={onFieldChange('id')}
              disabled={isEdit}
              required
              helperText="Уникальный идентификатор (slug)"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Название"
              value={formData.name}
              onChange={onFieldChange('name')}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Описание"
              value={formData.description}
              onChange={onFieldChange('description')}
              multiline
              rows={4}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Категория"
              value={formData.category_slug}
              onChange={onFieldChange('category_slug')}
              required
            >
              {categories.map((cat) => (
                <MenuItem key={cat.slug} value={cat.slug}>
                  {cat.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Тип продукта"
              value={formData.product_type_code}
              onChange={onFieldChange('product_type_code')}
              required
            >
              {Object.entries(PRODUCT_TYPE_CONFIG).map(([code, config]) => (
                <MenuItem key={code} value={code}>
                  {config.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Box display="flex" gap={1} alignItems="center" mb={1}>
              <TextField
                size="small"
                label="Добавить тег"
                value={newTag}
                onChange={(e) => onNewTagChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddTag();
                  }
                }}
              />
              <Button onClick={onAddTag} variant="outlined" size="small">
                Добавить
              </Button>
            </Box>
            <Box display="flex" gap={1} flexWrap="wrap">
              {formData.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => onRemoveTag(tag)}
                  size="small"
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default ProductInfoCard;
