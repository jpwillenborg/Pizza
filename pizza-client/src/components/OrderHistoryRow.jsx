import React, { useState } from 'react';

export default function OrderHistoryRow({ receipt, index, handleRowStatusChange, formatCurrency }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-[12px] p-5 bg-background flex flex-col gap-3 box-border shadow-md">
      <div className="flex justify-between items-start sm:items-center flex-wrap gap-2">
        <div className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2">
          <strong className="order-1 text-white text-[1.05rem] font-mono">{receipt.id}</strong>
          <span className="order-2 text-[0.8rem] text-slateText-muted font-mono sm:order-3 sm:ml-2">Logged: {receipt.timestamp}</span>
          <select
            className="order-3 p-[4px_8px] text-[0.8rem] font-bold border-0 rounded-[6px] text-white cursor-pointer outline-none bg-background-surface focus-visible:ring-2 focus-visible:ring-accent-primary/20 sm:order-2"
            value={receipt.status}
            onChange={(e) => handleRowStatusChange(receipt.id, e.target.value, index)}
          >
            {['Received', 'Preparing', 'Baking', 'Out for Delivery', 'Delivered'].map(stage => (
              <option key={stage} value={stage} className="bg-background-surface text-white">{stage}</option>
            ))}
          </select>
        </div>
        <div className="text-right font-bold text-accent-primary text-[1.1rem] font-mono">
          {formatCurrency(receipt.totalBill)}
        </div>
      </div>

      <div className="bg-background-surface p-4 rounded-[8px] text-[0.9rem] text-slateText-muted relative min-h-[72px]">
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2 text-right">
          <span className="text-[0.9rem] font-sans text-slateText-muted">
            <strong>Pizzas:</strong> <span className="font-bold text-white">{receipt.items ? receipt.items.length : 0}</span>
          </span>
          {receipt.items && receipt.items.length > 0 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden sm:block px-3 py-1.5 text-[0.75rem] font-bold font-sans rounded-[6px] border-0 cursor-pointer transition-all duration-200 outline-none bg-white/5 text-white hover:bg-white/12 focus-visible:ring-2 focus-visible:ring-accent-primary/20"
            >
              {isExpanded ? 'Hide Details' : 'View Details'}
            </button>
          )}
        </div>
        <div className="font-bold mb-2 text-white">Fictional demo customer</div>
        <div className="leading-relaxed"><strong>Name:</strong> {receipt.customer?.name || 'Sandbox Guest'}</div>
        <div className="leading-relaxed"><strong>Phone:</strong> {receipt.customer?.phone || 'Not provided'}</div>
        <div className="leading-relaxed"><strong>Address:</strong> {receipt.customer?.address || 'DEMO PICKUP ONLY'}</div>
        <div className="text-[0.72rem] text-slateText-muted/70 mt-2">Fictional test data; no visitor contact details are collected.</div>
        {receipt.items && receipt.items.length > 0 && (
          <div className="flex justify-end mt-4 sm:hidden">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1.5 text-[0.75rem] font-bold font-sans rounded-[6px] border-0 cursor-pointer transition-all duration-200 outline-none bg-white/5 text-white hover:bg-white/12 focus-visible:ring-2 focus-visible:ring-accent-primary/20"
            >
              {isExpanded ? 'Hide Details' : 'View Details'}
            </button>
          </div>
        )}
      </div>

      {isExpanded && receipt.items && (
        <div className="bg-background-surface/40 border border-slate-800/30 rounded-[8px] p-3.5 mt-0.5 flex flex-col gap-2.5">
          {receipt.items.map((pizza, idx) => (
            <div key={idx} className="text-sm flex flex-col gap-0.5 pb-2 last:pb-0 border-b border-slate-800/20 last:border-b-0">
              <div className="flex justify-between items-center">
                <span className="capitalize text-white font-medium font-mono text-[0.9rem]">
                  🍕 Pizza #{idx + 1}: {pizza.size} Size
                </span>
                {pizza.verifiedPrice && (
                  <span className="text-slateText-muted text-[0.8rem] font-mono">
                    {formatCurrency(pizza.verifiedPrice)}
                  </span>
                )}
              </div>
              <div className="text-[0.8rem] text-slateText-muted pl-4">
                <span className="text-slateText-muted/60">Ingredients: </span>
                {pizza.toppings && pizza.toppings.length > 0 ? (
                  pizza.toppings.map(id => id.replace(/_/g, ' ')).join(', ')
                ) : (
                  <span className="italic text-slateText-muted/40">Plain Cheese Base</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
