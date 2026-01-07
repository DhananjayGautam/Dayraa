import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import { FaAngleUp } from "react-icons/fa6";
import { FaAngleDown } from "react-icons/fa6";

export const QtyBox = (props) => {
  const [qtyVal, setQtyVal] = useState(1);

  // Get max quantity from props (available stock)
  const maxQuantity = props.maxQuantity || 999; // Default to a high number if not provided

  // Reset quantity when maxQuantity changes
  useEffect(() => {
    if (qtyVal > maxQuantity) {
      setQtyVal(maxQuantity);
      props.handleSelecteQty(maxQuantity);
    }
  }, [maxQuantity]);

  const plusQty = () => {
    if (qtyVal < maxQuantity) {
      const newQty = qtyVal + 1;
      setQtyVal(newQty);
      props.handleSelecteQty(newQty);
    }
  }

  const minusQty = () => {
    if (qtyVal === 1) {
      setQtyVal(1);
      props.handleSelecteQty(1);
    } else {
      const newQty = qtyVal - 1;
      setQtyVal(newQty);
      props.handleSelecteQty(newQty);
    }
  }

  const handleInputChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    
    if (value < 1) {
      setQtyVal(1);
      props.handleSelecteQty(1);
    } else if (value > maxQuantity) {
      setQtyVal(maxQuantity);
      props.handleSelecteQty(maxQuantity);
    } else {
      setQtyVal(value);
      props.handleSelecteQty(value);
    }
  }

  // Check if plus button should be disabled
  const isPlusDisabled = qtyVal >= maxQuantity;

  return (
    <div className="qtyBox flex items-center relative">
      <input
        type="number"
        className="w-full h-[40px] p-2 pl-5 text-[15px] focus:outline-none border border-[rgba(0,0,0,0.2)] rounded-md"
        value={qtyVal}
        min="1"
        max={maxQuantity}
        onChange={handleInputChange}
      />

      <div className="flex items-center flex-col justify-between h-[40px] absolute top-0 right-0 z-50">
        <Button 
          className={`!min-w-[25px] !w-[25px] !h-[20px] !text-[#000] !rounded-none hover:!bg-[#f1f1f1] ${isPlusDisabled ? '!opacity-50 !cursor-not-allowed' : ''}`}
          onClick={plusQty}
          disabled={isPlusDisabled}
        >
          <FaAngleUp className="text-[12px] opacity-55" />
        </Button>
        <Button 
          className="!min-w-[25px] !w-[25px] !h-[20px] !text-[#000] !rounded-none hover:!bg-[#f1f1f1]"
          onClick={minusQty}
          disabled={qtyVal === 1}
        >
          <FaAngleDown className="text-[12px] opacity-55"/>
        </Button>
      </div>
    </div>
  );
};