/**
 * Example: Vendor Dashboard Component
 * This shows how to integrate real-time order notifications for vendors
 */

import { useVendorOrderUpdates } from '@/hooks/useVendorOrderUpdates';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface VendorDashboardProps {
    vendorId: string;
}

export function VendorDashboard({ vendorId }: VendorDashboardProps) {
    const queryClient = useQueryClient();
    const [showNotificationBadge, setShowNotificationBadge] = useState(false);

    // Use the real-time vendor order updates hook
    const {
        newOrdersCount,
        resetNewOrdersCount,
        isConnected
    } = useVendorOrderUpdates({
        vendorId,
        enabled: true,
        playNotificationSound: true, // Play sound for new orders

        // Handler for new orders
        onNewOrder: (event) => {
            console.log('New order received:', event);

            // Invalidate and refetch orders list
            queryClient.invalidateQueries({
                queryKey: ['vendor-orders', vendorId]
            });

            // Show notification badge
            setShowNotificationBadge(true);

            // You can also update specific caches directly
            // queryClient.setQueryData(['order', event.orderId], event);
        },

        // Handler for order status changes
        onOrderStatusChange: (event) => {
            console.log('Order status changed:', event);

            // Update specific order in cache
            queryClient.invalidateQueries({
                queryKey: ['order', event.orderId]
            });

            // Optionally refresh the orders list
            queryClient.invalidateQueries({
                queryKey: ['vendor-orders', vendorId]
            });
        },
    });

    const handleViewNewOrders = () => {
        resetNewOrdersCount();
        setShowNotificationBadge(false);
        // Navigate to orders tab or scroll to new orders
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header with Notification Badge */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Vendor Dashboard
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                {isConnected ? (
                                    <>
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        <span className="text-sm text-green-600">Live updates active</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                                        <span className="text-sm text-gray-500">Connecting...</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* New Orders Badge */}
                        {newOrdersCount > 0 && (
                            <button
                                onClick={handleViewNewOrders}
                                className="relative inline-flex items-center px-6 py-3 bg-red-500 text-white 
                         rounded-lg font-semibold shadow-lg hover:bg-red-600 transition-all
                         animate-pulse hover:animate-none"
                            >
                                <span className="text-xl mr-2">🔔</span>
                                <span>{newOrdersCount} New Order{newOrdersCount > 1 ? 's' : ''}</span>
                                {showNotificationBadge && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full 
                                   rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        title="Pending Orders"
                        value="12"
                        icon="⏳"
                        color="yellow"
                    />
                    <StatCard
                        title="Preparing"
                        value="8"
                        icon="🍳"
                        color="blue"
                    />
                    <StatCard
                        title="Ready"
                        value="5"
                        icon="✅"
                        color="green"
                    />
                    <StatCard
                        title="Completed Today"
                        value="47"
                        icon="🎉"
                        color="purple"
                    />
                </div>

                {/* Orders List Placeholder */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Active Orders</h2>
                    <p className="text-gray-500">
                        Your order list component goes here.
                        It will automatically update when new orders arrive or status changes!
                    </p>
                </div>
            </div>
        </div>
    );
}

// Helper component for stat cards
function StatCard({
    title,
    value,
    icon,
    color
}: {
    title: string;
    value: string;
    icon: string;
    color: 'yellow' | 'blue' | 'green' | 'purple';
}) {
    const colorClasses = {
        yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
        blue: 'bg-blue-50 border-blue-200 text-blue-700',
        green: 'bg-green-50 border-green-200 text-green-700',
        purple: 'bg-purple-50 border-purple-200 text-purple-700',
    };

    return (
        <div className={`rounded-lg border-2 p-4 ${colorClasses[color]}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium opacity-75">{title}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                <span className="text-3xl">{icon}</span>
            </div>
        </div>
    );
}
