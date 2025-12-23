import { useEffect, useState, useCallback, useRef } from 'react';
import orderHubService, {
    OrderStatusUpdateEvent,
    OrderETAUpdateEvent,
    OrderDelayEvent
} from '../services/orderHub.service';

interface OrderUpdate {
    status: string | null;
    eta: string | null;
    lastUpdate: Date;
    delayInfo: {
        delayMinutes: number;
        reason: string | null;
    } | null;
}

interface UseOrderUpdatesOptions {
    orderId: string | null;
    enabled?: boolean;
    onStatusChange?: (event: OrderStatusUpdateEvent) => void;
    onETAUpdate?: (event: OrderETAUpdateEvent) => void;
    onDelay?: (event: OrderDelayEvent) => void;
}

/**
 * Hook for real-time order updates for a specific order
 * Connects to OrderHub and subscribes to status changes, ETA updates, and delays
 */
export function useOrderUpdates({
    orderId,
    enabled = true,
    onStatusChange,
    onETAUpdate,
    onDelay
}: UseOrderUpdatesOptions) {
    const [orderUpdate, setOrderUpdate] = useState<OrderUpdate | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasJoinedGroup = useRef(false);

    // Handle status change events
    const handleStatusChange = useCallback((event: OrderStatusUpdateEvent) => {
        console.log('📱 Order status changed:', event);

        if (event.orderId === orderId) {
            setOrderUpdate(prev => ({
                ...prev,
                status: event.newStatus,
                eta: event.eta,
                lastUpdate: new Date(),
                delayInfo: prev?.delayInfo || null
            }));

            // Call custom handler if provided
            onStatusChange?.(event);
        }
    }, [orderId, onStatusChange]);

    // Handle ETA update events
    const handleETAUpdate = useCallback((event: OrderETAUpdateEvent) => {
        console.log('⏰ Order ETA updated:', event);

        if (event.orderId === orderId) {
            setOrderUpdate(prev => ({
                ...prev,
                eta: event.newETA,
                lastUpdate: new Date(),
                status: prev?.status || null,
                delayInfo: prev?.delayInfo || null
            }));

            // Call custom handler if provided
            onETAUpdate?.(event);
        }
    }, [orderId, onETAUpdate]);

    // Handle delay events
    const handleDelay = useCallback((event: OrderDelayEvent) => {
        console.log('⚠️ Order delayed:', event);

        if (event.orderId === orderId) {
            setOrderUpdate(prev => ({
                ...prev,
                eta: event.newETA,
                lastUpdate: new Date(),
                status: prev?.status || null,
                delayInfo: {
                    delayMinutes: event.delayMinutes,
                    reason: event.reason
                }
            }));

            // Call custom handler if provided
            onDelay?.(event);
        }
    }, [orderId, onDelay]);

    useEffect(() => {
        if (!enabled || !orderId) {
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
                orderHubService.onOrderStatusChanged(handleStatusChange);
                orderHubService.onOrderETAUpdated(handleETAUpdate);
                orderHubService.onOrderDelayed(handleDelay);

                // Join the order's update group
                await orderHubService.joinOrderGroup(orderId);
                hasJoinedGroup.current = true;

                console.log(`✅ Joined order updates for order: ${orderId}`);
            } catch (err) {
                console.error('Failed to setup OrderHub connection:', err);
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

            if (hasJoinedGroup.current && orderId) {
                orderHubService.leaveOrderGroup(orderId);
                hasJoinedGroup.current = false;
            }
        };
    }, [orderId, enabled, handleStatusChange, handleETAUpdate, handleDelay]);

    return {
        orderUpdate,
        isConnected,
        error
    };
}
