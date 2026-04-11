import React, { useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadMoreTriggerProps {
    isLoading: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
}

/**
 * Невидимый элемент-триггер вверху списка сообщений.
 * При попадании в viewport вызывает onLoadMore (через IntersectionObserver).
 */
export const LoadMoreTrigger: React.FC<LoadMoreTriggerProps> = ({
    isLoading,
    hasMore,
    onLoadMore,
}) => {
    const triggerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!hasMore || isLoading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    onLoadMore();
                }
            },
            { threshold: 0.1 }
        );

        const el = triggerRef.current;
        if (el) observer.observe(el);

        return () => {
            if (el) observer.unobserve(el);
        };
    }, [hasMore, isLoading, onLoadMore]);

    if (!hasMore && !isLoading) return null;

    return (
        <Box
            ref={triggerRef}
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                py: 2,
                minHeight: 48,
            }}
        >
            {isLoading ? (
                <CircularProgress size={24} />
            ) : hasMore ? (
                <Typography variant="caption" color="text.secondary">
                    Загрузка ранних сообщений...
                </Typography>
            ) : null}
        </Box>
    );
};
