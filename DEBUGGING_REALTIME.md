# 🔍 Debugging Real-Time Order Updates

If you're not seeing real-time updates, follow these steps:

## Step 1: Add Debug Component

Add this to your main App or a test page:

```tsx
import { OrderHubDebugger } from '@/components/OrderHubDebugger';

function App() {
  return (
    <div>
      {/* Your app content */}
      
      {/* Debug panel - shows in bottom right corner */}
      {import.meta.env.DEV && <OrderHubDebugger />}
    </div>
  );
}
```

## Step 2: Check Environment Variables

Open your `.env` file and verify:

```env
VITE_API_URL=http://localhost:5000
```

**Important:** Restart your dev server after changing `.env`:
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## Step 3: Verify Backend is Running

Check if backend is running:
```bash
curl http://localhost:5000/hubs/orders
# Should return some HTML or error (not "connection refused")
```

Or check in browser: http://localhost:5000/swagger

## Step 4: Check Browser Console

1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for:
   - ✅ `"OrderHub: Connected successfully"`
   - ❌ `"OrderHub: Connection failed"` or any errors

4. Go to **Network** tab → **WS** (WebSockets)
5. You should see a connection to `ws://localhost:5000/hubs/orders`
6. Click on it to see messages

## Step 5: Verify Authentication

The OrderHub requires authentication. Check:

1. **Token exists:**
```javascript
// In browser console:
localStorage.getItem('token')
// Should return your JWT token
```

2. **UserId exists:**
```javascript
localStorage.getItem('userId')
// Should return your user ID
```

If either is missing, log in again.

## Step 6: Test with Debug Component

1. The **OrderHubDebugger** component should appear in bottom-right
2. It should show **green** if connected
3. Click "Join Order" and enter an order ID
4. Update that order's status from vendor panel
5. You should see the event in the debug logs

## Step 7: Check CORS Settings

If you see CORS errors, verify backend allows your origin.

In `SQM.API/Program.cs`, check:
```csharp
var allowedOrigins = new[]
{
    "http://localhost:8085",  // ← Your frontend port
    "http://localhost:5173",  // ← Vite default port
};
```

## Step 8: Check Network Tab for Errors

In DevTools → Network:
- Filter by "WS" (WebSocket)
- Look for failed connections
- Check the response/error messages

## Common Issues & Solutions

### Issue: "Authentication required"
**Solution:** Make sure you're logged in and token is in localStorage

### Issue: Connection shows "Connecting..." forever
**Solution:** 
- Check backend is running on correct port
- Verify VITE_API_URL in .env matches backend URL
- Restart frontend dev server

### Issue: Connected but no events received
**Solution:**
- Make sure you called `joinOrderGroup(orderId)` or `joinVendorOrders(vendorId)`
- Check backend logs to see if events are being sent
- Verify order status is actually changing in database

### Issue: CORS error
**Solution:**
- Add your frontend URL to backend's allowed origins
- Restart backend after changing CORS settings

## Backend Logs to Check

Start backend with logging:
```bash
cd /home/tuan4403/workspace/SQM/SQM.API
dotnet run
```

Look for these logs:
- `"OrderHub: Client connected"`
- `"Joined order group for order..."`
- `"Sending order status update"`

## Quick Test

1. **Backend:** Create/update an order via Swagger or Postman
2. **Frontend:** Debug component should show the event
3. **Component:** Any component using `useOrderUpdates` should receive the update

## Still Not Working?

Run this in browser console:
```javascript
// Check service
import('@/services/orderHub.service').then(service => {
  console.log('Connection state:', service.default.getConnectionState());
  console.log('Is connected:', service.default.isConnected());
});
```

If you're still having issues, check:
1. Browser console for errors
2. Network tab for failed WebSocket connections
3. Backend logs for connection attempts
