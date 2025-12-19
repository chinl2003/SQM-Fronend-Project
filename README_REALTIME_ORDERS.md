# Real-Time Order Status Updates - Quick Start Guide

## 🚀 Setup

### 1. Configure Environment Variables

Copy `.env.example` to `.env` and update with your API URL:

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000
# Or for production:
# VITE_API_URL=https://sqm-staging.app.tms-s.vn
```

### 2. Install Dependencies (if not already done)

```bash
npm install
```

The `@microsoft/signalr` package is already in your `package.json`.

---

## 📖 Usage

### For Customer Order Tracking

Use the `useOrderUpdates` hook to track a specific order:

```typescript
import { useOrderUpdates } from '@/hooks/useOrderUpdates';

function MyOrderPage({ orderId }: { orderId: string }) {
  const { orderUpdate, isConnected } = useOrderUpdates({
    orderId,
    enabled: true,
    onStatusChange: (event) => {
      console.log('Status changed:', event.newStatus);
    }
  });

  return (
    <div>
      {isConnected && <span>🟢 Live</span>}
      <p>Status: {orderUpdate?.status}</p>
      <p>ETA: {orderUpdate?.eta}</p>
    </div>
  );
}
```

**See full example:** [CustomerOrderTracking.example.tsx](./src/components/examples/CustomerOrderTracking.example.tsx)

---

### For Vendor Dashboard

Use the `useVendorOrderUpdates` hook to receive all vendor order notifications:

```typescript
import { useVendorOrderUpdates } from '@/hooks/useVendorOrderUpdates';

function VendorDashboard({ vendorId }: { vendorId: string }) {
  const { newOrdersCount, resetNewOrdersCount } = useVendorOrderUpdates({
    vendorId,
    enabled: true,
    playNotificationSound: true,
    onNewOrder: (event) => {
      // Refresh orders list
      queryClient.invalidateQueries(['vendor-orders']);
    }
  });

  return (
    <div>
      {newOrdersCount > 0 && (
        <button onClick={resetNewOrdersCount}>
          🔔 {newOrdersCount} New Orders
        </button>
      )}
    </div>
  );
}
```

**See full example:** [VendorDashboard.example.tsx](./src/components/examples/VendorDashboard.example.tsx)

---

## 🎯 Available Hooks

### `useOrderUpdates(options)`

Track a specific order with real-time updates.

**Options:**
- `orderId: string` - The order ID to track
- `enabled?: boolean` - Enable/disable connection (default: `true`)
- `onStatusChange?: (event) => void` - Callback when status changes
- `onETAUpdate?: (event) => void` - Callback when ETA updates
- `onDelay?: (event) => void` - Callback when order is delayed

**Returns:**
- `orderUpdate` - Current order state (status, eta, delayInfo)
- `isConnected` - Connection status
- `error` - Connection error if any

---

### `useVendorOrderUpdates(options)`

Receive all order notifications for a vendor.

**Options:**
- `vendorId: string` - The vendor ID
- `enabled?: boolean` - Enable/disable connection (default: `true`)
- `playNotificationSound?: boolean` - Play sound for new orders (default: `true`)
- `onNewOrder?: (event) => void` - Callback when new order arrives
- `onOrderStatusChange?: (event) => void` - Callback when any order status changes

**Returns:**
- `newOrdersCount` - Count of new orders since last reset
- `isConnected` - Connection status
- `error` - Connection error if any
- `resetNewOrdersCount()` - Function to reset the count

---

## 🔧 Advanced Usage

### Direct Service Access

For advanced scenarios, you can use the service directly:

```typescript
import orderHubService from '@/services/orderHub.service';

// Start connection
await orderHubService.startConnection();

// Join groups
await orderHubService.joinOrderGroup('order-123');
await orderHubService.joinVendorOrders('vendor-456');

// Listen to events
orderHubService.onOrderStatusChanged((event) => {
  console.log('Status changed:', event);
});

// Cleanup
orderHubService.removeAllHandlers();
await orderHubService.stopConnection();
```

---

## 🎨 Adding Notification Sound

Place a notification sound file at:
```
/public/notification.mp3
```

The vendor dashboard will play this sound when new orders arrive.

---

## 🐛 Troubleshooting

### Connection Issues

**Problem:** "Authentication required" error

**Solution:** Ensure JWT token is in localStorage:
```typescript
localStorage.setItem('token', yourJwtToken);
```

---

**Problem:** Connection keeps disconnecting

**Solution:** Check that:
1. Backend is running on the correct URL
2. CORS allows your frontend origin
3. Firewall allows WebSocket connections

---

### No Updates Received

**Debug steps:**
1. Open DevTools → Network → WS tab
2. Verify WebSocket connection to `/hubs/orders`
3. Check console for "Joined order group" messages
4. Verify backend logs show "Sending order status update"

---

## 📊 React Query Integration

The hooks work seamlessly with React Query:

```typescript
const { newOrdersCount } = useVendorOrderUpdates({
  vendorId,
  onNewOrder: () => {
    // Automatically refetch orders
    queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
  },
  onOrderStatusChange: (event) => {
    // Update specific order
    queryClient.invalidateQueries({ queryKey: ['order', event.orderId] });
  }
});
```

---

## 🚦 Testing

### Manual Test

1. Start backend: `cd SQM.API && dotnet run`
2. Start frontend: `npm run dev`
3. Open browser DevTools → Network → WS
4. Create an order
5. Verify WebSocket shows "OrderCreated" message
6. Update order status
7. Verify customer/vendor receives update

### Check Connection

```typescript
// In React component
console.log('Connected:', orderHubService.isConnected());
console.log('State:', orderHubService.getConnectionState());
```

---

## 📚 Additional Resources

- **Full Implementation Walkthrough**: See [walkthrough.md](../../.gemini/antigravity/brain/1d17268b-2f8a-45b2-a9e3-decef5e19b2d/walkthrough.md)
- **Backend Code**: `SQM.API/Hubs/OrderHub.cs`
- **Service Implementation**: `src/services/orderHub.service.ts`

---

## 🎉 You're Ready!

The real-time order status system is fully integrated. Simply use the hooks in your components and they'll automatically receive live updates!
