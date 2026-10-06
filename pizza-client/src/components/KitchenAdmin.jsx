import React, { useState, useEffect } from 'react';
import OrderHistoryRow from './OrderHistoryRow';

export default function KitchenAdmin({ orderStatus, setOrderStatus, apiBaseUrl, sandboxKey, formatCurrency, getNumericPrice }) {
  const [orderHistory, setOrderHistory] = useState([]);
  // const [orderHistory, setOrderHistory] = useState([
  //   {
  //     id: "cfd83d17",
  //     status: "Received",
  //     totalBill: "21.00",
  //     createdAt: new Date().toISOString(),
  //     customerName: "Patrick Demo",
  //     customerPhone: "+1-202-555-0103",
  //     customerAddress: "DEMO PICKUP ONLY",
  //     items: [
  //       { size: "large", toppings: ["pepperoni", "onions"], price: 12.00 },
  //       { size: "medium", toppings: ["extra_cheese"], price: 9.00 }
  //     ]
  //   }
  // ]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  // const [isAuthorized, setIsAuthorized] = useState(true);
  const [adminError, setAdminError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const lifetimeRevenue = orderHistory.reduce((sum, ord) => sum + getNumericPrice(ord.totalBill), 0);
  const activeOrdersCount = orderHistory.filter(ord => ord.status !== 'Delivered').length;
  const aggregatePizzas = orderHistory.reduce((sum, ord) => sum + (ord.items ? ord.items.length : 0), 0);
  const averageReceiptBill = orderHistory.length > 0 ? (lifetimeRevenue / orderHistory.length) : 0;
  const adminKey = sandboxKey;

  const handleConnect = async (event) => {
    if (event) event.preventDefault();
    setAdminError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/orders/history`, {
        headers: { 'x-sandbox-key': adminKey }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Admin access was denied.');
      setOrderHistory(data);
      
      if (data && data.length > 0) {
        const sortedByRecent = [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrderStatus(sortedByRecent[0].status);
      } else {
        setOrderStatus('No Active Order');
      }
      setIsAuthorized(true);
    } catch (error) {
      setAdminError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminUpdate = async (receiptId, nextStatus) => {
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

      const sortedByRecent = [...orderHistory].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (sortedByRecent.length > 0 && sortedByRecent[0].id === receiptId) {
        setOrderStatus(nextStatus);
      } else if (orderHistory.length === 1) {
        setOrderStatus(nextStatus);
      }
      setAdminError('');
    } catch (error) {
      setAdminError(error.message);
    }
  };

  const handleRowStatusChange = (receiptId, nextStatus) => {
    handleAdminUpdate(receiptId, nextStatus);
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
      setOrderStatus('No Active Order');
      setAdminError('');
    } catch (error) {
      setAdminError(error.message);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="w-full box-border md:min-h-[820px] flex flex-col justify-start">
        <form onSubmit={handleConnect} className="max-w-[480px] mx-auto bg-background-surface mb-16 p-6 rounded-[12px] shadow-flat-card text-left md:mt-[52px] w-full box-border">
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
      </div>
    );
  }
  const sortedOrdersForDisplay = [...orderHistory].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const activeLiveOrder = sortedOrdersForDisplay.length > 0 ? sortedOrdersForDisplay[0] : null;

  return (
    <div className="flex flex-col gap-6 w-full box-border mb-24 text-left">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full box-border">
        <div className="bg-background-surface p-5 rounded-[16px] border-l-[4px] border-l-accent-primary flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-2 shadow-flat-card transition-colors duration-250 ease-out hover:bg-background-hover">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-[1.1rem] md:text-[0.95rem] flex-shrink-0" aria-hidden="true">⏳</span>
            <span className="text-[0.8rem] font-bold text-slateText-muted uppercase tracking-wider truncate">In Progress</span>
          </div>
          <strong className="text-[1.35rem] md:text-[1.55rem] text-white font-bold font-sans md:mt-1 flex-shrink-0">
            {activeOrdersCount} {activeOrdersCount === 1 ? 'Order' : 'Orders'}
          </strong>
        </div>

        <div className="bg-background-surface p-5 rounded-[16px] border-l-[4px] border-l-accent-primary flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-2 shadow-flat-card transition-colors duration-250 ease-out hover:bg-background-hover">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-[1.1rem] md:text-[0.95rem] flex-shrink-0" aria-hidden="true">📦</span>
            <span className="text-[0.8rem] font-bold text-slateText-muted uppercase tracking-wider truncate">Volume</span>
          </div>
          <strong className="text-[1.35rem] md:text-[1.55rem] text-white font-bold font-sans md:mt-1 flex-shrink-0">
            {aggregatePizzas} {aggregatePizzas === 1 ? 'Pizza' : 'Pizzas'}
          </strong>
        </div>

        <div className="bg-background-surface p-5 rounded-[16px] border-l-[4px] border-l-accent-primary flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-2 shadow-flat-card transition-colors duration-250 ease-out hover:bg-background-hover">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-[1.1rem] md:text-[0.95rem] flex-shrink-0" aria-hidden="true">📊</span>
            <span className="text-[0.8rem] font-bold text-slateText-muted uppercase tracking-wider truncate">Avg. Ticket</span>
          </div>
          <strong className="text-[1.35rem] md:text-[1.55rem] text-white font-bold font-mono md:mt-1 flex-shrink-0">
            {formatCurrency(averageReceiptBill)}
          </strong>
        </div>

        <div className="bg-background-surface p-5 rounded-[16px] border-l-[4px] border-l-accent-primary flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-2 shadow-flat-card transition-colors duration-250 ease-out hover:bg-background-hover">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-[1.1rem] md:text-[0.95rem] flex-shrink-0" aria-hidden="true">💰</span>
            <span className="text-[0.8rem] font-bold text-slateText-muted uppercase tracking-wider truncate">Earnings</span>
          </div>
          <strong className="text-[1.35rem] md:text-[1.55rem] text-white font-bold font-mono md:mt-1 flex-shrink-0">
            {formatCurrency(lifetimeRevenue)}
          </strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full box-border mt-4 items-stretch">
        <div className="col-span-1 h-full">
          <div className="bg-background-surface p-6 rounded-[16px] shadow-flat-card transition-colors duration-250 ease-out hover:bg-background-hover h-full flex flex-col justify-between box-border">
            <div>
              <h3 className="mt-0 text-[1.4rem] font-bold text-white">🍕 Kitchen Dispatch</h3>
              <p className="text-slateText-muted text-[0.95rem] mb-6 leading-[1.65]">Stream live status updates without refreshing the page.</p>
              <div className="bg-background p-4 rounded-[8px] mb-6 border-l-[4px] border-l-accent-primary text-[1.05rem]">
                <strong className="text-white font-medium">Current Status:</strong> 
                <span className="text-accent-primary font-bold block mt-1">{orderStatus || 'No Active Order'}</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              {['Received', 'Preparing', 'Baking', 'Out for Delivery', 'Delivered'].map((stage) => {
                const isActive = orderStatus === stage;
                return (
                  <button 
                    key={stage} 
                    type="button"
                    disabled={!activeLiveOrder}
                    onClick={() => activeLiveOrder && handleAdminUpdate(activeLiveOrder.id, stage)}
                    className={`p-4 text-[0.95rem] font-bold cursor-pointer text-left rounded-[8px] border-0 text-white transition-all duration-150 flex items-center justify-start gap-4 w-full outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/20 ${isActive && activeLiveOrder ? 'bg-accent-primary/25' : 'bg-background hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                  >
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${isActive && activeLiveOrder ? 'border-accent-primary' : 'border-white/30'}`}>
                      {isActive && activeLiveOrder && <div className="w-2 h-2 bg-accent-primary rounded-full" />}
                    </div>
                    <span className={isActive && activeLiveOrder ? 'text-accent-primary' : 'text-slateText-muted'}>
                      {isActive && activeLiveOrder ? '' : 'Step:'} {stage}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2">
          <div className="bg-background-surface p-6 rounded-[16px] shadow-flat-card transition-colors duration-250 ease-out hover:bg-background-hover h-full flex flex-col box-border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 flex-wrap flex-shrink-0">
              <h3 className="m-0 text-[1.4rem] font-bold text-white">📜 Order History</h3>
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
            {adminError && <p role="alert" className="text-red-300 text-sm flex-shrink-0 mb-2">{adminError}</p>}
            {sortedOrdersForDisplay.length === 0 ? (
              <p className="text-slateText-muted italic text-[0.95rem] m-0">No historical transactions captured in datastore cache yet.</p>
            ) : (
              <div className="flex flex-col gap-4 max-h-[465px] overflow-y-auto pr-2 flex-grow [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-[#090d16] [&::-webkit-scrollbar-thumb]:bg-[#232d3f] hover:[&::-webkit-scrollbar-thumb]:bg-[#2d3952] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:rounded-full">
                {sortedOrdersForDisplay.map((receipt, displayIndex) => (
                  <OrderHistoryRow 
                    key={receipt.id}
                    receipt={receipt}
                    index={orderHistory.findIndex(o => o.id === receipt.id)}
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
