import { Helmet } from 'react-helmet-async';
import {
  Container,
  Grid,
  Box,
  Button,
  CircularProgress
} from '@mui/material';
import PageHeader from 'src/components/PageHeader';
import NotificationAlert from 'src/components/NotificationAlert';
import LoadingState from 'src/components/LoadingState';
import {
  ProductInfoCard,
  ProductSettingsCard,
  ProductVariantsCard,
  ProductImagesCard,
  ProductAttributesCard
} from './components';
import { useProductForm } from './hooks/useProductForm';

function ProductForm() {
  const {
    isEdit,
    loading,
    saving,
    error,
    success,
    formData,
    categories,
    variants,
    images,
    newTag,
    uploadingImage,
    filteredAttributes,
    selectedAttributeValues,
    savingAttributes,
    handleFieldChange,
    handleAddTag,
    handleRemoveTag,
    handleActiveChange,
    handleSortOrderChange,
    handleAddVariant,
    handleEditVariant,
    handleDeleteVariant,
    handleImageUpload,
    handleDeleteImage,
    handleToggleAttributeValue,
    handleSaveAttributes,
    handleSubmit,
    handleCancel,
    setNewTag,
    clearError,
    clearSuccess
  } = useProductForm();

  if (loading) {
    return <LoadingState message="Загрузка продукта..." />;
  }

  return (
    <>
      <Helmet>
        <title>{isEdit ? 'Редактирование продукта' : 'Новый продукт'} - Leaf Flow Admin</title>
      </Helmet>
      
      <PageHeader
        title={isEdit ? 'Редактирование продукта' : 'Новый продукт'}
        backUrl="/admin/products"
      />

      <Container maxWidth="lg">
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {error && (
              <Grid item xs={12}>
                <NotificationAlert message={error} type="error" onClose={clearError} />
              </Grid>
            )}
            {success && (
              <Grid item xs={12}>
                <NotificationAlert message={success} type="success" onClose={clearSuccess} />
              </Grid>
            )}

            <Grid item xs={12} md={8}>
              <ProductInfoCard
                formData={formData}
                categories={categories}
                isEdit={isEdit}
                newTag={newTag}
                onFieldChange={handleFieldChange}
                onNewTagChange={setNewTag}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <ProductSettingsCard
                isActive={formData.is_active}
                sortOrder={formData.sort_order}
                onActiveChange={handleActiveChange}
                onSortOrderChange={handleSortOrderChange}
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button variant="outlined" onClick={handleCancel}>
                  Отмена
                </Button>
                <Button type="submit" variant="contained" disabled={saving}>
                  {saving ? <CircularProgress size={20} /> : (isEdit ? 'Сохранить' : 'Создать')}
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <ProductVariantsCard
                variants={variants}
                onAdd={handleAddVariant}
                onEdit={handleEditVariant}
                onDelete={handleDeleteVariant}
              />
            </Grid>

            {isEdit && (
              <Grid item xs={12}>
                <ProductImagesCard
                  images={images}
                  uploading={uploadingImage}
                  onUpload={handleImageUpload}
                  onDelete={handleDeleteImage}
                />
              </Grid>
            )}

            {isEdit && filteredAttributes.length > 0 && (
              <Grid item xs={12}>
                <ProductAttributesCard
                  attributes={filteredAttributes}
                  selectedValues={selectedAttributeValues}
                  saving={savingAttributes}
                  onToggleValue={handleToggleAttributeValue}
                  onSave={handleSaveAttributes}
                />
              </Grid>
            )}
          </Grid>
        </form>
      </Container>
    </>
  );
}

export default ProductForm;
