import React from 'react';
import { FaFileInvoiceDollar } from "react-icons/fa";

const InvoiceTable = () => {
  const invoices = [
    { sl: "01", clientCode: "GQ-ABZS", clientCompanyName: "Arbizz Solutions" },
    { sl: "02", clientCode: "GQ-ABZS", clientCompanyName: "Arbizz Solutions" },
    { sl: "03", clientCode: "GQ-ABZS", clientCompanyName: "Arbizz Solutions" },
    { sl: "03", clientCode: "GQ-ABZS", clientCompanyName: "Arbizz Solutions" },
    { sl: "03", clientCode: "GQ-ABZS", clientCompanyName: "Arbizz Solutions" }

  ];

  return (
    <>
      <div className="overflow-x-auto py-8 px-4">
        <h2 className='text-[#3e76a5] font-bold text-2xl pb-6 flex gap-4'>
          <FaFileInvoiceDollar className='text-4xl' />
          Invoices
        </h2>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-3 px-4 border-b text-left whitespace-nowrap uppercase">SL</th>
              <th className="py-3 px-4 border-b text-left whitespace-nowrap uppercase">Client Code</th>
              <th className="py-3 px-4 border-b text-left whitespace-nowrap uppercase">Client Company Name</th>
              <th className="py-3 px-4 border-b text-left whitespace-nowrap uppercase">Check In</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice, index) => (
              <tr key={index}>
                <td className="py-3 px-4 border-b text-[#3e76a5] whitespace-nowrap">{invoice.sl}</td>
                <td className="py-3 px-4 border-b whitespace-nowrap">{invoice.clientCode}</td>
                <td className="py-3 px-4 border-b whitespace-nowrap">{invoice.clientCompanyName}</td>
                <td className="py-3 px-4 border-b whitespace-nowrap">
                  <button className="bg-[#3e76a5] p-2 text-white rounded-md hover:bg-[#3e76a5]">Check in</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default InvoiceTable;
