/**
 * DEBUGGING COMPONENT - Real-Time Order Updates
 * Add this to your app to test SignalR connection
 */

import { useEffect, useState } from 'react';
import orderHubService from '@/services/orderHub.service';

export function OrderHubDebugger() {
    const [logs, setLogs] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionState, setConnectionState] = useState('Disconnected');

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
        console.log(`[OrderHub Debug] ${message}`);
    };

    useEffect(() => {
        const setupConnection = async () => {
            try {
                addLog('🔄 Starting connection...');
                await orderHubService.startConnection();

                const state = orderHubService.getConnectionState();
                setConnectionState(state || 'Unknown');
                setIsConnected(orderHubService.isConnected());

                if (orderHubService.isConnected()) {
                    addLog('✅ Connected successfully!');

                    // Subscribe to all events for debugging
                    orderHubService.onOrderStatusChanged((event) => {
                        addLog(`📝 Status Changed: Order ${event.orderCode} → ${event.newStatus}`);
                    });

                    orderHubService.onOrderCreated((event) => {
                        addLog(`🆕 New Order: ${event.orderCode} for vendor ${event.vendorId}`);
                    });

                    orderHubService.onOrderETAUpdated((event) => {
                        addLog(`⏰ ETA Updated: Order ${event.orderCode}`);
                    });

                    orderHubService.onOrderDelayed((event) => {
                        addLog(`⚠️ Order Delayed: ${event.orderCode} by ${event.delayMinutes} min`);
                    });

                    addLog('🎧 Subscribed to all events');
                } else {
                    addLog('❌ Connection failed');
                }
            } catch (error) {
                addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        };

        setupConnection();

        return () => {
            orderHubService.removeAllHandlers();
            orderHubService.stopConnection();
        };
    }, []);

    const testJoinOrder = async () => {
        const testOrderId = prompt('Enter order ID to join:');
        if (testOrderId) {
            try {
                await orderHubService.joinOrderGroup(testOrderId);
                addLog(`✅ Joined order group: ${testOrderId}`);
            } catch (error) {
                addLog(`❌ Failed to join: ${error}`);
            }
        }
    };

    const testJoinVendor = async () => {
        const testVendorId = prompt('Enter vendor ID to join:');
        if (testVendorId) {
            try {
                await orderHubService.joinVendorOrders(testVendorId);
                addLog(`✅ Joined vendor orders: ${testVendorId}`);
            } catch (error) {
                addLog(`❌ Failed to join: ${error}`);
            }
        }
    };

    return (
        <div className="fixed bottom-4 right-4 w-96 bg-white shadow-2xl rounded-lg border-2 border-gray-200 max-h-[600px] flex flex-col z-50">
            {/* Header */}
            <div className={`p-4 rounded-t-lg ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}>
                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-white animate-pulse' : 'bg-gray-300'}`} />
                        <span className="font-bold">OrderHub Debug</span>
                    </div>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">{connectionState}</span>
                </div>
            </div>

            {/* Connection Info */}
            <div className="p-3 bg-gray-50 border-b text-xs">
                <div className="space-y-1">
                    <div><strong>API URL:</strong> {import.meta.env.VITE_API_URL || 'Not configured!'}</div>
                    <div><strong>Token:</strong> {localStorage.getItem('accessToken') ? '✅ Present' : '❌ Missing'}</div>
                    <div><strong>UserId:</strong> {localStorage.getItem('userId') || 'Not found'}</div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="p-3 border-b flex gap-2">
                <button
                    onClick={testJoinOrder}
                    className="flex-1 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    disabled={!isConnected}
                >
                    Join Order
                </button>
                <button
                    onClick={testJoinVendor}
                    className="flex-1 px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                    disabled={!isConnected}
                >
                    Join Vendor
                </button>
            </div>

            {/* Logs */}
            <div className="flex-1 overflow-y-auto p-3 bg-gray-900 text-green-400 font-mono text-xs rounded-b-lg">
                {logs.length === 0 ? (
                    <div className="text-gray-500">Waiting for events...</div>
                ) : (
                    logs.map((log, index) => (
                        <div key={index} className="mb-1 break-words">{log}</div>
                    ))
                )}
            </div>
        </div>
    );
}
