import { useRef } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import CloudUploadTwoToneIcon from '@mui/icons-material/CloudUploadTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import { ProductImageResponse } from 'src/api/services/images';

interface ProductImagesCardProps {
  images: ProductImageResponse[];
  uploading: boolean;
  onUpload: (files: FileList) => Promise<void>;
  onDelete: (imageId: number) => Promise<void>;
}

function getImageUrl(image: ProductImageResponse): string {
  const mdVariant = image.variants.find(v => v.variant === 'md');
  const thumbVariant = image.variants.find(v => v.variant === 'thumb');
  const originalVariant = image.variants.find(v => v.variant === 'original');
  const variant = mdVariant || thumbVariant || originalVariant;
  return variant?.storage_key || '';
}

function ProductImagesCard({
  images,
  uploading,
  onUpload,
  onDelete
}: ProductImagesCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      await onUpload(files);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (imageId: number) => {
    if (window.confirm('Удалить это изображение?')) {
      await onDelete(imageId);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Изображения"
        action={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="image-upload-input"
            />
            <label htmlFor="image-upload-input">
              <Button
                component="span"
                startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadTwoToneIcon />}
                size="small"
                disabled={uploading}
              >
                {uploading ? 'Загрузка...' : 'Загрузить'}
              </Button>
            </label>
          </>
        }
      />
      <CardContent>
        {images.length > 0 ? (
          <ImageList cols={isMobile ? 2 : 4} gap={16}>
            {images.map((image) => (
              <ImageListItem key={image.id} sx={{ borderRadius: 1, overflow: 'hidden' }}>
                <img
                  src={getImageUrl(image)}
                  alt={image.title}
                  loading="lazy"
                  style={{ height: 150, objectFit: 'cover' }}
                />
                <ImageListItemBar
                  title={image.title}
                  subtitle={image.is_active ? 'Активно' : 'Неактивно'}
                  actionIcon={
                    <IconButton
                      sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
                      onClick={() => handleDelete(image.id)}
                    >
                      <DeleteTwoToneIcon />
                    </IconButton>
                  }
                />
              </ImageListItem>
            ))}
          </ImageList>
        ) : (
          <Typography color="text.secondary">
            Изображения ещё не добавлены
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default ProductImagesCard;
