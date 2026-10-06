import React, { useState } from 'react';

export default function OrderHistoryRow({ receipt, index, handleRowStatusChange, formatCurrency }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Clean, monotone-friendly server timestamp formatter
  const orderTimestamp = receipt.createdAt 
    ? new Date(receipt.createdAt).toLocaleString('en-US', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).replace(',', ' @')
    : receipt.timestamp || '10/06/26 @ 11:57:29 AM';

  // Helper function to capitalize words and replace underscores
  const formatToppingName = (topping) => {
    if (!topping) return '';
    return topping
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="bg-background p-6 rounded-[12px] transition-all duration-150 flex flex-col gap-5 text-left w-full box-border font-mono">
      
      {/* Tier 1: Unified Horizontal Header Track (All items aligned flush at top) */}
      <div className="flex flex-row items-start justify-between w-full gap-4">
        
        {/* Left Aspect: Order Identifier Info */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[0.85rem] font-bold text-white/40 uppercase tracking-wider block">ORDER NUMBER</span>
          <strong className="text-white text-[1.25rem] font-medium tracking-tight">ORD-{receipt.id.toString().slice(-6)}</strong>
          <span className="text-slateText-white/70 text-[0.85rem] mt-0.5 block">
            {orderTimestamp}
          </span>
        </div>

        {/* Right Aspect: Fully Integrated Stacked Status & Navigation Hub */}
        <div className="flex flex-col gap-1 text-right flex-shrink-0">
          <label 
            htmlFor={`status-select-${receipt.id}`} 
            className="text-[0.85rem] font-bold text-white/40 uppercase tracking-wider block"
          >
            STATUS:
          </label>
          
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`text-[0.85rem] font-bold rounded-[4px] px-4 h-[38px] flex items-center justify-center cursor-pointer transition-all duration-150 outline-none border-0 ${
                isExpanded 
                  ? 'bg-white/10 text-white' 
                  : 'bg-background-surface text-white/80 hover:text-white'
              }`}
            >
              {isExpanded ? 'Hide Details' : 'View Details'}
            </button>

            <select
              id={`status-select-${receipt.id}`}
              value={receipt.status}
              onChange={(e) => handleRowStatusChange(receipt.id, e.target.value, index)}
              className="p-[0rem_1.75rem_0rem_0.65rem] h-[38px] text-[0.85rem] font-bold rounded-[4px] bg-background-surface border-0 text-white outline-none cursor-pointer hover:text-white transition-all focus:ring-1 focus:ring-white/20"
            >
              <option value="Received">Received</option>
              <option value="Preparing">Preparing</option>
              <option value="Baking">Baking</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        </div>

      </div>

      {/* Tier 2: Unified Customer Details & Financial Totals */}
      <div className="flex flex-row items-end justify-between w-full border-t border-white/[0.04] pt-4 gap-6">
        
        {/* Left Side Column Block: Vertically Stacked Contact Info */}
        <div className="flex flex-col gap-2 min-w-0 flex-grow">
          <div className="flex items-center gap-2.5">
            <span className="text-[0.85rem] font-bold text-white/40 uppercase tracking-wider flex-shrink-0">CUSTOMER:</span>
            <span className="text-white text-[1rem] font-medium truncate">{receipt.customer?.name || receipt.customerName || 'Sandbox Guest'}</span>
          </div>
          
          <div className="flex items-center gap-2.5">
            <span className="text-[0.85rem] font-bold text-white/40 uppercase tracking-wider flex-shrink-0">PHONE:</span>
            <span className="text-white text-[0.98rem] font-medium truncate">{receipt.customer?.phone || receipt.customerPhone || 'N/A'}</span>
          </div>
          
          <div className="flex items-center gap-2.5">
            <span className="text-[0.85rem] font-bold text-white/40 uppercase tracking-wider flex-shrink-0">ADDRESS:</span>
            <span className="text-white/90 text-[1rem] font-medium truncate">{receipt.customer?.address || receipt.customerAddress || 'DEMO DELIVERY ONLY'}</span>
          </div>
        </div>

        {/* Right Side Column Block: Quantities Stacking Stacked Flush Above Prices */}
        <div className="flex flex-col gap-3 text-right flex-shrink-0">
          <div className="flex flex-col gap-0.5">
            <span className="text-[0.85rem] font-bold text-white/40 uppercase tracking-wider block">QUANTITY</span>
            <strong className="text-white text-[1rem] font-medium block">
              {receipt.items?.length || 0} {receipt.items?.length === 1 ? 'Pizza' : 'Pizzas'}
            </strong>
          </div>
          
          <div className="flex flex-col gap-0.5">
            <span className="text-[0.85rem] font-bold text-white/40 uppercase tracking-wider block">TOTAL COST</span>
            <strong className="text-white text-[1.3rem] font-medium tracking-tight block">{formatCurrency(receipt.totalBill)}</strong>
          </div>
        </div>

      </div>

      {/* Tier 3: Itemized Toppings Breakdown Drawer (Removed scrollbar and height restrictions to let all items render instantly) */}
      {isExpanded && (
        <div className="bg-white/[0.04] p-4 rounded-[6px] text-[0.95rem] text-white/90 leading-relaxed flex flex-col gap-2.5 mt-1">
          {receipt.items?.map((pizza, pIdx) => (
            <div key={pIdx} className="flex flex-row items-center justify-between pb-2 mb-1 border-b border-white/[0.02] last:border-0 last:pb-0 last:mb-0">
              <div className="flex flex-row items-center gap-4 w-full min-w-0">
                
                {/* Fixed layout alignment column baseline */}
                <span className="capitalize font-medium text-white w-[140px] flex-shrink-0">
                  Pizza #{pIdx + 1}: {pizza.size}
                </span>

                {/* Raw ingredients capsule */}
                <span className="text-[0.85rem] text-white/70 bg-white/5 px-2 py-0.5 rounded-[4px] text-left whitespace-normal break-words flex-grow min-w-0">
                  {pizza.toppings?.length === 0 ? 'Cheese Base' : pizza.toppings?.map(formatToppingName).join(', ')}
                </span>

              </div>
              {pizza.price && (
                <span className="text-white font-medium pl-4 flex-shrink-0">
                  {formatCurrency(pizza.price || pizza.verifiedPrice)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
