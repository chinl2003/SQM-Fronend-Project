import { useEffect, useState, useCallback, useRef } from 'react';
import orderHubService, {
    OrderCreatedEvent,
    OrderStatusUpdateEvent
} from '../services/orderHub.service';

interface UseVendorOrderUpdatesOptions {
    vendorId: string | null;
    enabled?: boolean;
    onNewOrder?: (event: OrderCreatedEvent) => void;
    onOrderStatusChange?: (event: OrderStatusUpdateEvent) => void;
    playNotificationSound?: boolean;
}

/**
 * Hook for vendor dashboard to receive real-time updates for all vendor orders
 * Optionally plays sounds for new orders
 */
export function useVendorOrderUpdates({
    vendorId,
    enabled = true,
    onNewOrder,
    onOrderStatusChange,
    playNotificationSound = true
}: UseVendorOrderUpdatesOptions) {
    const [newOrdersCount, setNewOrdersCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasJoinedGroup = useRef(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize notification sound
    useEffect(() => {
        if (playNotificationSound) {
            audioRef.current = new Audio('/notification.mp3'); // You'll need to add this sound file
            audioRef.current.volume = 0.5;
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [playNotificationSound]);

    // Play notification sound
    const playSound = useCallback(() => {
        if (playNotificationSound && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(err => {
                console.warn('Failed to play notification sound:', err);
            });
        }
    }, [playNotificationSound]);

    // Handle new order created
    const handleNewOrder = useCallback((event: OrderCreatedEvent) => {
        console.log('🔔 New order created:', event);

        if (event.vendorId === vendorId) {
            setNewOrdersCount(prev => prev + 1);

            // Play notification sound
            playSound();

            // Call custom handler if provided
            onNewOrder?.(event);
        }
    }, [vendorId, onNewOrder, playSound]);

    // Handle order status change
    const handleStatusChange = useCallback((event: OrderStatusUpdateEvent) => {
        console.log('📝 Order status changed:', event);

        if (event.vendorId === vendorId) {
            // Call custom handler if provided
            onOrderStatusChange?.(event);
        }
    }, [vendorId, onOrderStatusChange]);

    useEffect(() => {
        if (!enabled || !vendorId) {
            return;
        }

        let isMounted = true;

        const setupConnection = async () => {
            try {
                // Start connection if not already connected
                await orderHubService.startConnection();

                if (!isMounted) return;

                setIsConnected(true);
                setError(null);

                // Subscribe to events
                orderHubService.onOrderCreated(handleNewOrder);
                orderHubService.onOrderStatusChanged(handleStatusChange);

                // Join vendor's orders group
                await orderHubService.joinVendorOrders(vendorId);
                hasJoinedGroup.current = true;

                console.log(`✅ Vendor joined order updates for vendor: ${vendorId}`);
            } catch (err) {
                console.error('Failed to setup vendor OrderHub connection:', err);
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Connection failed');
                    setIsConnected(false);
                }
            }
        };

        setupConnection();

        // Cleanup function
        return () => {
            isMounted = false;

            if (hasJoinedGroup.current && vendorId) {
                orderHubService.leaveVendorOrders(vendorId);
                hasJoinedGroup.current = false;
            }
        };
    }, [vendorId, enabled, handleNewOrder, handleStatusChange]);

    // Reset new orders count
    const resetNewOrdersCount = useCallback(() => {
        setNewOrdersCount(0);
    }, []);

    return {
        newOrdersCount,
        isConnected,
        error,
        resetNewOrdersCount
    };
}
