import React, { useState, useCallback, useRef } from 'react';
import {
    IconButton,
    Popover,
    Drawer,
    styled,
    alpha,
    useTheme,
    useMediaQuery,
    Box,
} from '@mui/material';
import SentimentSatisfiedAltRoundedIcon from '@mui/icons-material/SentimentSatisfiedAltRounded';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

// === Styled ===

const EmojiButton = styled(IconButton)(({ theme }) => ({
    color: theme.colors.alpha.black[50],
    transition: 'color 0.2s ease',

    '&:hover': {
        color: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
    },
}));

const PickerWrapper = styled(Box)(() => ({
    '& em-emoji-picker': {
        '--border-radius': '0',
        '--shadow': 'none',
    },
}));

const MobilePickerWrapper = styled(Box)(() => ({
    '& em-emoji-picker': {
        '--border-radius': '0',
        '--shadow': 'none',
        width: '100%',
        maxWidth: '100%',
    },
}));

// === Component ===

interface EmojiPickerButtonProps {
    onEmojiSelect: (emoji: string) => void;
    /** Вызывается при любом закрытии пикера — для возврата фокуса на input */
    onPickerClose?: () => void;
}

export const EmojiPickerButton: React.FC<EmojiPickerButtonProps> = ({ onEmojiSelect, onPickerClose }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const popoverOpen = Boolean(anchorEl);

    const handleOpen = useCallback((e: React.MouseEvent<HTMLElement>) => {
        if (isMobile) {
            setDrawerOpen(true);
        } else {
            setAnchorEl(e.currentTarget);
        }
    }, [isMobile]);

    const handleClose = useCallback(() => {
        setAnchorEl(null);
        setDrawerOpen(false);
        onPickerClose?.();
    }, [onPickerClose]);

    const handleSelect = useCallback((emojiData: { native: string }) => {
        onEmojiSelect(emojiData.native);
        handleClose();
    }, [onEmojiSelect, handleClose]);

    const pickerProps = {
        data,
        onEmojiSelect: handleSelect,
        theme: 'light' as const,
        locale: 'ru',
        previewPosition: 'none' as const,
        skinTonePosition: 'search' as const,
        maxFrequentRows: 2,
    };

    return (
        <>
            <EmojiButton
                ref={buttonRef}
                onClick={handleOpen}
                size="small"
            >
                <SentimentSatisfiedAltRoundedIcon fontSize="small" />
            </EmojiButton>

            {/* Desktop: Popover */}
            {!isMobile && (
                <Popover
                    open={popoverOpen}
                    anchorEl={anchorEl}
                    onClose={handleClose}
                    disableRestoreFocus
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                    }}
                    transformOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                    PaperProps={{
                        sx: {
                            borderRadius: 3,
                            boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.15)}`,
                            overflow: 'hidden',
                        },
                    }}
                >
                    <PickerWrapper><Picker {...pickerProps} perLine={9} /></PickerWrapper>
                </Popover>
            )}

            {/* Mobile: Bottom Drawer */}
            {isMobile && (
                <Drawer
                    anchor="bottom"
                    open={drawerOpen}
                    onClose={handleClose}
                    disableRestoreFocus
                    PaperProps={{
                        sx: {
                            borderTopLeftRadius: 16,
                            borderTopRightRadius: 16,
                            maxHeight: '50vh',
                            overflow: 'hidden',
                        },
                    }}
                    ModalProps={{
                        keepMounted: true,
                    }}
                >
                    {/* Ручка для визуального индикатора */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            pt: 1,
                            pb: 0.5,
                        }}
                    >
                        <Box
                            sx={{
                                width: 36,
                                height: 4,
                                borderRadius: 2,
                                bgcolor: theme.colors.alpha.black[20],
                            }}
                        />
                    </Box>
                    <MobilePickerWrapper><Picker {...pickerProps} dynamicWidth /></MobilePickerWrapper>
                </Drawer>
            )}
        </>
    );
};
