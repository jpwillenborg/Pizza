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
    <div className="bg-background p-4 md:p-6 rounded-[12px] transition-all duration-150 flex flex-col gap-4 md:gap-5 text-left w-full box-border font-mono">
      
      {/* Tier 1: Receipt Header Block */}
      <div className="flex flex-col md:flex-row md:items-start justify-between w-full gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[0.85rem] font-bold text-white/40 uppercase tracking-wider block">ORDER NUMBER</span>
          <strong className="text-white text-[1.25rem] font-medium tracking-tight whitespace-nowrap">ORD-{receipt.id.toString().slice(-6)}</strong>
          <span className="text-slateText-white/70 text-[0.78rem] md:text-[0.85rem] mt-0.5 block whitespace-nowrap">
            {orderTimestamp}
          </span>

          {/* Left-Justified Mobile Status Dropdown */}
          <div className="flex flex-col gap-1.5 mt-3 md:hidden">
            <label 
              htmlFor={`status-select-mobile-${receipt.id}`} 
              className="text-[0.85rem] font-bold text-white/40 uppercase tracking-wider block"
            >
              STATUS:
            </label>
            <select
              id={`status-select-mobile-${receipt.id}`}
              value={receipt.status}
              onChange={(e) => handleRowStatusChange(receipt.id, e.target.value, index)}
              className="p-[0rem_1.75rem_0rem_0.65rem] h-[38px] text-[0.85rem] font-bold rounded-[4px] bg-background-surface border-0 text-white outline-none cursor-pointer w-full max-w-[220px]"
            >
              <option value="Received">Received</option>
              <option value="Preparing">Preparing</option>
              <option value="Baking">Baking</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        </div>

        {/* Desktop-Only Actions Layout Block */}
        <div className="hidden md:flex flex-col gap-1 text-right flex-shrink-0">
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
                isExpanded ? 'bg-white/10 text-white' : 'bg-background-surface text-white/80 hover:text-white'
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

      {/* Tier 2: Customer Details & Financial Metrics */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between w-full border-t border-white/[0.04] pt-4 gap-5 md:gap-6">
        
        {/* Contact Info Track Stack */}
        <div className="flex flex-col gap-3 min-w-0 flex-grow">
          <div className="flex flex-col gap-0.5">
            <span className="text-[0.85rem] font-bold text-white/40 uppercase tracking-wider block">CUSTOMER:</span>
            <span className="text-white text-[1rem] font-medium break-words">{receipt.customer?.name || receipt.customerName || 'Sandbox Guest'}</span>
          </div>
          
          <div className="flex flex-col gap-0.5">
            <span className="text-[0.85rem] font-bold text-white/40 uppercase tracking-wider block">PHONE:</span>
            <span className="text-white text-[0.98rem] font-medium break-all">{receipt.customer?.phone || receipt.customerPhone || 'N/A'}</span>
          </div>
          
          <div className="flex flex-col gap-0.5">
            <span className="text-[0.85rem] font-bold text-white/40 uppercase tracking-wider block">ADDRESS:</span>
            {/* Updated fallback value text string phrase to DEMO DELIVERY ONLY */}
            <span className="text-white/90 text-[1rem] font-medium break-words">{receipt.customer?.address || receipt.customerAddress || 'DEMO DELIVERY ONLY'}</span>
          </div>
        </div>

        {/* Fixed Metrics Panel Block */}
        <div className="grid grid-cols-2 md:flex md:flex-col gap-4 md:gap-4 flex-shrink-0 pt-4 md:pt-0 border-t border-white/[0.04] md:border-t-0 w-full md:w-auto text-left">
          
          {/* Quantity Section */}
          <div className="flex flex-col gap-0.5 text-left md:text-right">
            <span className="text-[0.85rem] font-bold text-white/40 uppercase tracking-wider block">QUANTITY</span>
            <strong className="text-white text-[1rem] font-medium block whitespace-nowrap">
              {receipt.items?.length || 0} {receipt.items?.length === 1 ? 'Pizza' : 'Pizzas'}
            </strong>
          </div>
          
          {/* Cost Section */}
          <div className="flex flex-col gap-0.5 text-left md:text-right">
            <span className="text-[0.85rem] font-bold text-white/40 uppercase tracking-wider block">TOTAL COST</span>
            <strong className="text-white text-[1.2rem] md:text-[1.3rem] font-medium tracking-tight block whitespace-nowrap">
              {formatCurrency(receipt.totalBill)}
            </strong>
          </div>

        </div>

      </div>

      {/* Mobile-Only Center-Justified Full Width View Details Button Track */}
      <button 
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full h-[42px] flex items-center justify-center font-bold text-[0.85rem] rounded-[4px] cursor-pointer transition-all duration-150 outline-none border-0 md:hidden mt-2 ${
          isExpanded 
            ? 'bg-white/10 text-white' 
            : 'bg-background-surface text-white/80 hover:text-white'
        }`}
      >
        {isExpanded ? 'Hide Details' : 'View Details'}
      </button>

      {/* Tier 3: Itemized Toppings Breakdown Drawer */}
      {isExpanded && (
        <div className="bg-white/[0.04] p-4 rounded-[6px] text-[0.95rem] text-white/90 leading-relaxed flex flex-col gap-4 mt-1">
          {receipt.items?.map((pizza, pIdx) => (
            <div key={pIdx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 mb-1 border-b border-white/[0.02] last:border-0 last:pb-0 last:mb-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full min-w-0">
                
                <span className="capitalize font-medium text-white w-full sm:w-[140px] flex-shrink-0 block">
                  Pizza #{pIdx + 1}: {pizza.size}
                </span>

                <span className="text-[0.85rem] text-white/70 bg-white/5 px-2 py-1 rounded-[4px] text-left whitespace-normal break-words inline-block w-full sm:w-auto sm:flex-grow min-w-0">
                  {pizza.toppings?.length === 0 ? 'Cheese Base' : pizza.toppings?.map(formatToppingName).join(', ')}
                </span>

              </div>
              {pizza.price && (
                <span className="text-white font-medium pl-0 sm:pl-4 flex-shrink-0 block w-full sm:w-auto text-left sm:text-right font-mono">
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
