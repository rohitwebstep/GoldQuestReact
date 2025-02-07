import React, { createContext, useContext } from 'react';

const CustomFunctionsContext = createContext();

export const CustomFunctionsProvider = ({ children }) => {
  const wordify = (inputNumber) => {
    if (typeof inputNumber !== 'number' || isNaN(inputNumber)) {
      return "Invalid input";
    }

    if (inputNumber < 0) {
      return "Negative numbers not supported";
    }

    const single = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const double = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const denominations = ["", "Thousand", "Lakh", "Crore"];

    const numberToWords = (num) => {
      if (num < 10) return single[num];
      if (num < 20) return double[num - 10];
      if (num < 100) {
        const ten = Math.floor(num / 10);
        const unit = num % 10;
        return tens[ten] + (unit ? " " + single[unit] : "");
      }
      if (num < 1000) {
        const hundred = Math.floor(num / 100);
        const remainder = num % 100;
        return single[hundred] + " Hundred" + (remainder ? " and " + numberToWords(remainder) : "");
      }
      return "";
    };

    const formatNumber = (num) => {
      let parts = [];
      let factor = 1000;
      let index = 0;

      while (num > 0) {
        const remainder = num % factor;
        if (remainder !== 0) {
          const words = numberToWords(remainder);
          parts.push(words + (denominations[index] ? " " + denominations[index] : ""));
        }
        num = Math.floor(num / factor);
        if (index === 0) factor = 100; // Switch to lakh and crore after thousands
        index++;
      }

      return parts.reverse().join(", ");
    };

    return formatNumber(inputNumber).trim();
  };

  return (
    <CustomFunctionsContext.Provider value={wordify}>
      {children}
    </CustomFunctionsContext.Provider>
  );
};

export const useCustomFunction = () => useContext(CustomFunctionsContext);
