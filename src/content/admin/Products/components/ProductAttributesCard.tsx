import {
  Card,
  CardHeader,
  CardContent,
  Button,
  CircularProgress,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormGroup,
  FormControlLabel,
  Checkbox,
  useTheme,
  useMediaQuery
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AttributeDetail } from 'src/models';
import { ATTRIBUTE_KIND_CONFIG } from 'src/constants';

interface ProductAttributesCardProps {
  attributes: AttributeDetail[];
  selectedValues: number[];
  saving: boolean;
  onToggleValue: (valueId: number) => void;
  onSave: () => Promise<void>;
}

function ProductAttributesCard({
  attributes,
  selectedValues,
  saving,
  onToggleValue,
  onSave
}: ProductAttributesCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (attributes.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader
        title="Атрибуты"
        action={
          <Button
            size="small"
            variant="contained"
            onClick={onSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            {saving ? 'Сохранение...' : 'Сохранить атрибуты'}
          </Button>
        }
      />
      <CardContent>
        {attributes.map((attribute) => (
          <Accordion key={attribute.id} defaultExpanded={false}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {attribute.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {attribute.description} • {ATTRIBUTE_KIND_CONFIG[attribute.kind]?.label || attribute.kind}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <FormGroup row={!isMobile}>
                {attribute.values
                  .filter(v => v.is_active)
                  .map((value) => (
                    <FormControlLabel
                      key={value.id}
                      control={
                        <Checkbox
                          checked={selectedValues.includes(value.id)}
                          onChange={() => onToggleValue(value.id)}
                        />
                      }
                      label={value.name}
                      sx={{ minWidth: 150 }}
                    />
                  ))}
              </FormGroup>
              {attribute.values.filter(v => v.is_active).length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Нет доступных значений
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </CardContent>
    </Card>
  );
}

export default ProductAttributesCard;
