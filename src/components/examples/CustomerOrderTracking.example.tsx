/**
 * Example: Customer Order Tracking Component
 * This shows how to integrate real-time order updates for customers
 */

import { useOrderUpdates } from '@/hooks/useOrderUpdates';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface CustomerOrderTrackingProps {
    orderId: string;
    customerId: string;
}

export function CustomerOrderTracking({ orderId }: CustomerOrderTrackingProps) {
    // Use the real-time order updates hook
    const { orderUpdate, isConnected, error } = useOrderUpdates({
        orderId,
        enabled: true, // Set to false to disable real-time updates

        // Optional: Custom handlers for events
        onStatusChange: (event) => {
            toast.success('Order Status Updated!', {
                description: `Your order is now ${event.newStatus}`,
                duration: 5000,
            });
        },

        onETAUpdate: (event) => {
            const newETA = event.newETA ? new Date(event.newETA) : null;
            toast.info('Delivery Time Updated', {
                description: newETA
                    ? `New estimated time: ${newETA.toLocaleTimeString('vi-VN')}`
                    : 'Delivery time updated',
                duration: 4000,
            });
        },

        onDelay: (event) => {
            toast.warning('Order Delayed', {
                description: `Your order is delayed by ${event.delayMinutes} minutes${event.reason ? `: ${event.reason}` : ''
                    }`,
                duration: 6000,
            });
        },
    });

    // Show error if connection fails
    useEffect(() => {
        if (error) {
            toast.error('Connection Error', {
                description: 'Unable to connect to real-time updates. Retrying...',
            });
        }
    }, [error]);

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            {/* Connection Status Indicator */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Track Your Order</h1>

                <div className="flex items-center gap-2">
                    {isConnected ? (
                        <>
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm text-green-600 font-medium">Live Updates</span>
                        </>
                    ) : (
                        <>
                            <div className="w-2 h-2 rounded-full bg-gray-400" />
                            <span className="text-sm text-gray-500">Connecting...</span>
                        </>
                    )}
                </div>
            </div>

            {/* Order Information */}
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Order #{orderId.slice(-6)}</h2>
                    {orderUpdate?.status && (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${orderUpdate.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                orderUpdate.status === 'Ready' ? 'bg-blue-100 text-blue-800' :
                                    orderUpdate.status === 'Prepareing' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                            }`}>
                            {orderUpdate.status}
                        </span>
                    )}
                </div>

                {/* ETA Display */}
                {orderUpdate?.eta && (
                    <div className="border-t pt-4">
                        <p className="text-sm text-gray-600 mb-1">Estimated Ready Time</p>
                        <p className="text-xl font-bold text-blue-600">
                            {new Date(orderUpdate.eta).toLocaleString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                            })}
                        </p>
                    </div>
                )}

                {/* Delay Information */}
                {orderUpdate?.delayInfo && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <p className="font-semibold text-yellow-800">Order Delayed</p>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Your order is delayed by approximately {orderUpdate.delayInfo.delayMinutes} minutes.
                                </p>
                                {orderUpdate.delayInfo.reason && (
                                    <p className="text-sm text-yellow-600 mt-2 italic">
                                        Reason: {orderUpdate.delayInfo.reason}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Last Update Timestamp */}
                {orderUpdate?.lastUpdate && (
                    <div className="border-t pt-4">
                        <p className="text-xs text-gray-500">
                            Last updated: {orderUpdate.lastUpdate.toLocaleTimeString('vi-VN')}
                        </p>
                    </div>
                )}
            </div>

            {/* Status Timeline (Optional) */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold mb-4">Order Progress</h3>
                <div className="space-y-3">
                    <StatusStep
                        label="Order Placed"
                        status="completed"
                    />
                    <StatusStep
                        label="Confirmed"
                        status={orderUpdate?.status ? 'completed' : 'pending'}
                    />
                    <StatusStep
                        label="Preparing"
                        status={
                            orderUpdate?.status === 'Prepareing' ? 'active' :
                                orderUpdate?.status === 'Ready' || orderUpdate?.status === 'Completed' ? 'completed' :
                                    'pending'
                        }
                    />
                    <StatusStep
                        label="Ready for Pickup"
                        status={
                            orderUpdate?.status === 'Ready' ? 'active' :
                                orderUpdate?.status === 'Completed' ? 'completed' :
                                    'pending'
                        }
                    />
                    <StatusStep
                        label="Completed"
                        status={orderUpdate?.status === 'Completed' ? 'completed' : 'pending'}
                    />
                </div>
            </div>
        </div>
    );
}

// Helper component for status timeline
function StatusStep({ label, status }: { label: string; status: 'completed' | 'active' | 'pending' }) {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${status === 'completed' ? 'bg-green-500' :
                    status === 'active' ? 'bg-blue-500 animate-pulse' :
                        'bg-gray-200'
                }`}>
                {status === 'completed' && <span className="text-white text-sm">✓</span>}
                {status === 'active' && <span className="text-white text-sm">⏳</span>}
            </div>
            <span className={`${status === 'completed' ? 'text-gray-900 font-medium' :
                    status === 'active' ? 'text-blue-600 font-medium' :
                        'text-gray-400'
                }`}>
                {label}
            </span>
        </div>
    );
}
