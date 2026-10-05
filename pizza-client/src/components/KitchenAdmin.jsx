import React, { useState } from 'react';
import OrderHistoryRow from './OrderHistoryRow';

export default function KitchenAdmin({ orderStatus, setOrderStatus, apiBaseUrl, sandboxKey, formatCurrency, getNumericPrice }) {
  const [orderHistory, setOrderHistory] = useState([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const lifetimeRevenue = orderHistory.reduce((sum, ord) => sum + getNumericPrice(ord.totalBill), 0);
  const activeOrdersCount = orderHistory.filter(ord => ord.status !== 'Delivered').length;
  const aggregatePizzas = orderHistory.reduce((sum, ord) => sum + (ord.items ? ord.items.length : 0), 0);
  const averageReceiptBill = orderHistory.length > 0 ? (lifetimeRevenue / orderHistory.length) : 0;
  const adminKey = sandboxKey;

  const handleConnect = async (event) => {
    event.preventDefault();
    setAdminError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/orders/history`, {
        headers: { 'x-sandbox-key': adminKey }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Admin access was denied.');
      setOrderHistory(data);
      if (data && data[0]) setOrderStatus(data[0].status);
      setIsAuthorized(true);
    } catch (error) {
      setAdminError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminUpdate = async (receiptId, nextStatus, index) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/orders/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-sandbox-key': adminKey },
        body: JSON.stringify({ id: receiptId, status: nextStatus })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update the order.');
      
      setOrderHistory((history) => history.map((order) => (
        order.id === receiptId ? { ...order, status: nextStatus } : order
      )));
      
      if (index === 0) {
        setOrderStatus(nextStatus);
      }
      setAdminError('');
    } catch (error) {
      setAdminError(error.message);
    }
  };

  const handleRowStatusChange = (receiptId, nextStatus, index) => {
    handleAdminUpdate(receiptId, nextStatus, index);
  };

  const handleWipeLogs = async () => {
    if (!confirm('Are you certain you want to permanently erase all archived demo orders?')) return;

    try {
      const response = await fetch(`${apiBaseUrl}/api/orders/history`, {
        method: 'DELETE',
        headers: { 'x-sandbox-key': adminKey }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Unable to clear order history.');
      }
      setOrderHistory([]);
      setAdminError('');
    } catch (error) {
      setAdminError(error.message);
    }
  };

  if (!isAuthorized) {
    return (
      <form onSubmit={handleConnect} className="max-w-[480px] mx-auto bg-background-surface mb-16 p-6 rounded-[12px] shadow-flat-card">
        <h3 className="mt-0 text-[1.25rem] font-bold text-white">Kitchen Admin Access</h3>
        <label htmlFor="admin-key" className="block text-slateText-muted text-sm mb-2">Visitor sandbox admin key</label>
        <input
          id="admin-key"
          type="text"
          autoComplete="off"
          value={adminKey}
          readOnly
          required
          className="w-full box-border p-3 bg-background border-0 text-white rounded-[6px] text-[0.95rem] outline-none focus:ring-2 focus:ring-accent-primary/20"
        />
        <p className="text-slateText-muted text-sm mt-2">This public demo key is limited to this browser's fictional order data and expires after 24 hours.</p>
        {adminError && <p role="alert" className="text-red-300 text-sm">{adminError}</p>}
        <button type="submit" disabled={isLoading || !adminKey} className="mt-4 w-full py-3 bg-accent-primary text-background border-0 rounded-[6px] py-[0.55rem] text-[0.85rem] font-bold cursor-pointer disabled:opacity-60">
          {isLoading ? 'Checking access...' : 'Unlock Kitchen Admin'}
        </button>
      </form>
    );
  }
  return (
    <div className="flex flex-col gap-8 w-full box-border mb-24">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full box-border">
        <div className="bg-background-surface p-5 rounded-[16px] border-l-[4px] border-l-accent-primary flex flex-col gap-1 shadow-flat-card transition-colors duration-250 ease-out hover:bg-background-hover">
          <span className="text-[0.8rem] font-bold text-slateText-muted uppercase tracking-wider">⏳ In Progress</span>
          <strong className="text-[1.55rem] text-white font-bold">{activeOrdersCount} {activeOrdersCount === 1 ? 'Order' : 'Orders'}</strong>
        </div>
        <div className="bg-background-surface p-5 rounded-[16px] border-l-[4px] border-l-accent-primary flex flex-col gap-1 shadow-flat-card transition-colors duration-250 ease-out hover:bg-background-hover">
          <span className="text-[0.8rem] font-bold text-slateText-muted uppercase tracking-wider">🍕 Cumulative Volume</span>
          <strong className="text-[1.55rem] text-white font-bold">{aggregatePizzas} {aggregatePizzas === 1 ? 'Pizza' : 'Pizzas'}</strong>
        </div>
        <div className="bg-background-surface p-5 rounded-[16px] border-l-[4px] border-l-accent-primary flex flex-col gap-1 shadow-flat-card transition-colors duration-250 ease-out hover:bg-background-hover">
          <span className="text-[0.8rem] font-bold text-slateText-muted uppercase tracking-wider">📊 Avg. Ticket</span>
          <strong className="text-[1.55rem] text-white font-bold">{formatCurrency(averageReceiptBill)}</strong>
        </div>
        <div className="bg-background-surface p-5 rounded-[16px] border-l-[4px] border-l-accent-primary flex flex-col gap-1 shadow-flat-card transition-colors duration-250 ease-out hover:bg-background-hover">
          <span className="text-[0.8rem] font-bold text-slateText-muted uppercase tracking-wider">📈 Earnings</span>
          <strong className="text-[1.55rem] text-white font-bold">{formatCurrency(lifetimeRevenue)}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full box-border mt-4 items-stretch">
        <div className="col-span-1 h-full">
          <div className="bg-background-surface p-6 rounded-[16px] shadow-flat-card transition-colors duration-250 ease-out hover:bg-background-hover h-full flex flex-col justify-between box-border">
            <div>
              <h3 className="mt-0 text-[1.4rem] font-bold text-white">🛠️ Kitchen Dispatch</h3>
              <p className="text-slateText-muted text-[0.95rem] mb-6 leading-[1.65]">Stream live status updates without refreshing the page.</p>
              <div className="bg-background p-4 rounded-[8px] mb-6 border-l-[4px] border-l-accent-primary text-[1.05rem]">
                <strong className="text-white font-medium">Active Status:</strong> 
                <span className="text-accent-primary font-bold block mt-1">{orderStatus}</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              {['Received', 'Preparing', 'Baking', 'Out for Delivery', 'Delivered'].map((stage) => {
                const isActive = orderStatus === stage;
                const latestOrder = orderHistory[0];
                return (
                  <button 
                    key={stage} 
                    type="button"
                    disabled={!latestOrder}
                    onClick={() => handleAdminUpdate(latestOrder.id, stage, 0)}
                    className={`p-4 text-[0.95rem] font-bold cursor-pointer text-left rounded-[8px] border-0 text-white transition-all duration-150 flex items-center justify-start gap-4 w-full outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/20 ${isActive ? 'bg-white/10' : 'bg-background hover:bg-white/5'}`}
                  >
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${isActive ? 'border-accent-primary' : 'border-white/30'}`}>
                      {isActive && <div className="w-2 h-2 bg-accent-primary rounded-full" />}
                    </div>
                    <span className={isActive ? 'text-accent-primary' : 'text-slateText-muted'}>
                      {isActive ? 'Active Step:' : 'Step:'} {stage}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2">
          <div className="bg-background-surface p-6 rounded-[16px] shadow-flat-card transition-colors duration-250 ease-out hover:bg-background-hover">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 flex-wrap">
              <h3 className="m-0 text-[1.4rem] font-bold text-white">📁 Order History</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setOrderHistory([]);
                    setIsAuthorized(false);
                  }}
                  className="p-[0.45rem_0.85rem] text-[0.85rem] font-bold rounded-[6px] cursor-pointer transition-colors duration-150 outline-none border-0 focus-visible:ring-2 focus-visible:ring-white/20 bg-white/5 text-white hover:bg-white/10 active:bg-white/20"
                >
                  Lock Admin
                </button>
                {orderHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={handleWipeLogs}
                    className="p-[0.45rem_0.85rem] text-[0.85rem] font-bold rounded-[6px] cursor-pointer transition-all duration-150 outline-none border-0 focus-visible:ring-2 focus-visible:ring-accent-eraseBorder/30 text-accent-eraseBorder bg-accent-erase hover:bg-opacity-80 active:bg-opacity-60"
                  >
                    Wipe Logs
                  </button>
                )}
              </div>
            </div>
            {adminError && <p role="alert" className="text-red-300 text-sm">{adminError}</p>}
            {orderHistory.length === 0 ? (
              <p className="text-slateText-muted italic text-[0.95rem] m-0">No historical transactions captured in datastore cache yet.</p>
            ) : (
              <div className="flex flex-col gap-4 max-h-[515px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                {orderHistory.map((receipt, index) => (
                  <OrderHistoryRow 
                    key={receipt.id}
                    receipt={receipt}
                    index={index}
                    handleRowStatusChange={handleRowStatusChange}
                    formatCurrency={formatCurrency}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
