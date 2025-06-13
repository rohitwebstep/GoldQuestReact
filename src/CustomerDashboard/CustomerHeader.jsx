import React from "react";
import Logout from "./Logout";
import Callback from "./Callback";
const CustomerHeader = () => {
  const storedBranchData = JSON.parse(localStorage.getItem("branch"));


  return (

    <header className="p-1 md:p-6 md:flex flex-wrap flex-col-reverse md:flex-row items-center justify-between bg-[#3e76a5]   hidden">
      <div className="w-8/12 flex items-center justify-between">
      <Callback/>
      <p className="text-end text-white font-bold text-xl">BACKGROUND VERIFICATION TRACKING SYSTEM (BVTS)</p></div>
      <div className="flex gap-3 w-4/12 justify-end">   <p className=" whitespace-nowrap font-bold capitalize text-white ">Hi, {storedBranchData?.name ||storedBranchData?.branch_name} </p>

        <Logout /></div>

    </header>
  );
};

export default CustomerHeader;
