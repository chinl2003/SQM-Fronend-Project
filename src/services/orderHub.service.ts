import * as signalR from '@microsoft/signalr';

// Event types matching backend events
export interface OrderStatusUpdateEvent {
    orderId: string;
    orderCode: string;
    oldStatus: string | null;
    newStatus: string;
    timestamp: string;
    eta: string | null;
    customerName: string | null;
    vendorId: string | null;
}

export interface OrderETAUpdateEvent {
    orderId: string;
    orderCode: string;
    oldETA: string | null;
    newETA: string | null;
    delayMinutes: number | null;
    timestamp: string;
}

export interface OrderCreatedEvent {
    orderId: string;
    orderCode: string;
    vendorId: string;
    customerId: string;
    customerName: string | null;
    totalPrice: number | null;
    status: string;
    createdAt: string;
    eta: string | null;
}

export interface OrderDelayEvent {
    orderId: string;
    orderCode: string;
    delayMinutes: number;
    reason: string | null;
    newETA: string | null;
    timestamp: string;
}

// Event handler types
export type OrderStatusChangedHandler = (event: OrderStatusUpdateEvent) => void;
export type OrderETAUpdatedHandler = (event: OrderETAUpdateEvent) => void;
export type OrderCreatedHandler = (event: OrderCreatedEvent) => void;
export type OrderDelayedHandler = (event: OrderDelayEvent) => void;

class OrderHubService {
    private connection: signalR.HubConnection | null = null;
    private baseUrl: string;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 3000; // 3 seconds

    constructor() {
        // Get API base URL from environment or use default
        this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    }

    /**
     * Start connection to OrderHub
     */
    async startConnection(): Promise<void> {
        if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
            console.log('OrderHub: Already connected');
            return;
        }

        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.warn('OrderHub: No authentication token found');
            throw new Error('Authentication required');
        }

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${this.baseUrl}/hubs/orders`, {
                accessTokenFactory: () => token,
                skipNegotiation: false,
                transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents
            })
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: (retryContext) => {
                    // Exponential backoff: 0s, 2s, 10s, 30s, 60s
                    if (retryContext.previousRetryCount === 0) return 0;
                    if (retryContext.previousRetryCount === 1) return 2000;
                    if (retryContext.previousRetryCount === 2) return 10000;
                    if (retryContext.previousRetryCount === 3) return 30000;
                    return 60000;
                }
            })
            .configureLogging(signalR.LogLevel.Information)
            .build();

        // Connection event handlers
        this.connection.onreconnecting((error) => {
            console.warn('OrderHub: Reconnecting...', error);
        });

        this.connection.onreconnected((connectionId) => {
            console.log('OrderHub: Reconnected with id:', connectionId);
            this.reconnectAttempts = 0;
        });

        this.connection.onclose(async (error) => {
            console.error('OrderHub: Connection closed', error);

            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                console.log(`OrderHub: Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

                await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
                try {
                    await this.startConnection();
                } catch (err) {
                    console.error('OrderHub: Reconnection failed', err);
                }
            }
        });

        try {
            await this.connection.start();
            console.log('✅ OrderHub: Connected successfully');
            this.reconnectAttempts = 0;
        } catch (err) {
            console.error('❌ OrderHub: Connection failed', err);
            throw err;
        }
    }

    /**
     * Stop connection to OrderHub
     */
    async stopConnection(): Promise<void> {
        if (this.connection) {
            try {
                await this.connection.stop();
                console.log('OrderHub: Connection stopped');
            } catch (err) {
                console.error('OrderHub: Error stopping connection', err);
            }
            this.connection = null;
        }
    }

    /**
     * Join a specific order's update group
     */
    async joinOrderGroup(orderId: string): Promise<void> {
        if (!this.connection) {
            console.warn('OrderHub: Not connected');
            return;
        }

        try {
            await this.connection.invoke('JoinOrderGroup', orderId);
            console.log(`OrderHub: Joined order group for order ${orderId}`);
        } catch (err) {
            console.error('OrderHub: Failed to join order group', err);
        }
    }

    /**
     * Leave a specific order's update group
     */
    async leaveOrderGroup(orderId: string): Promise<void> {
        if (!this.connection) return;

        try {
            await this.connection.invoke('LeaveOrderGroup', orderId);
            console.log(`OrderHub: Left order group for order ${orderId}`);
        } catch (err) {
            console.error('OrderHub: Failed to leave order group', err);
        }
    }

    /**
     * Join vendor's orders group (for vendor dashboard)
     */
    async joinVendorOrders(vendorId: string): Promise<void> {
        if (!this.connection) {
            console.warn('OrderHub: Not connected');
            return;
        }

        try {
            await this.connection.invoke('JoinVendorOrders', vendorId);
            console.log(`OrderHub: Joined vendor orders group for vendor ${vendorId}`);
        } catch (err) {
            console.error('OrderHub: Failed to join vendor orders group', err);
        }
    }

    /**
     * Leave vendor's orders group
     */
    async leaveVendorOrders(vendorId: string): Promise<void> {
        if (!this.connection) return;

        try {
            await this.connection.invoke('LeaveVendorOrders', vendorId);
            console.log(`OrderHub: Left vendor orders group for vendor ${vendorId}`);
        } catch (err) {
            console.error('OrderHub: Failed to leave vendor orders group', err);
        }
    }

    /**
     * Join customer's orders group (for customer to track all their orders)
     */
    async joinCustomerOrders(customerId: string): Promise<void> {
        if (!this.connection) {
            console.warn('OrderHub: Not connected');
            return;
        }

        try {
            await this.connection.invoke('JoinCustomerOrders', customerId);
            console.log(`OrderHub: Joined customer orders group for customer ${customerId}`);
        } catch (err) {
            console.error('OrderHub: Failed to join customer orders group', err);
        }
    }

    /**
     * Leave customer's orders group
     */
    async leaveCustomerOrders(customerId: string): Promise<void> {
        if (!this.connection) return;

        try {
            await this.connection.invoke('LeaveCustomerOrders', customerId);
            console.log(`OrderHub: Left customer orders group for customer ${customerId}`);
        } catch (err) {
            console.error('OrderHub: Failed to leave customer orders group', err);
        }
    }

    /**
     * Subscribe to order status changed events
     */
    onOrderStatusChanged(handler: OrderStatusChangedHandler): void {
        if (!this.connection) {
            console.warn('OrderHub: Cannot subscribe - not connected');
            return;
        }

        this.connection.on('OrderStatusChanged', handler);
        console.log('OrderHub: Subscribed to OrderStatusChanged');
    }

    /**
     * Subscribe to order ETA updated events
     */
    onOrderETAUpdated(handler: OrderETAUpdatedHandler): void {
        if (!this.connection) {
            console.warn('OrderHub: Cannot subscribe - not connected');
            return;
        }

        this.connection.on('OrderETAUpdated', handler);
        console.log('OrderHub: Subscribed to OrderETAUpdated');
    }

    /**
     * Subscribe to order created events (for vendors)
     */
    onOrderCreated(handler: OrderCreatedHandler): void {
        if (!this.connection) {
            console.warn('OrderHub: Cannot subscribe - not connected');
            return;
        }

        this.connection.on('OrderCreated', handler);
        console.log('OrderHub: Subscribed to OrderCreated');
    }

    /**
     * Subscribe to order delayed events
     */
    onOrderDelayed(handler: OrderDelayedHandler): void {
        if (!this.connection) {
            console.warn('OrderHub: Cannot subscribe - not connected');
            return;
        }

        this.connection.on('OrderDelayed', handler);
        console.log('OrderHub: Subscribed to OrderDelayed');
    }

    /**
     * Unsubscribe from all events and clean up
     */
    removeAllHandlers(): void {
        if (this.connection) {
            this.connection.off('OrderStatusChanged');
            this.connection.off('OrderETAUpdated');
            this.connection.off('OrderCreated');
            this.connection.off('OrderDelayed');
            console.log('OrderHub: Removed all event handlers');
        }
    }

    /**
     * Get current connection state
     */
    getConnectionState(): signalR.HubConnectionState | null {
        return this.connection?.state || null;
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.connection?.state === signalR.HubConnectionState.Connected;
    }
}

// Export singleton instance
export const orderHubService = new OrderHubService();
export default orderHubService;
