import React from "react";
import Logout from "./Logout";
const Header = () => {
  const admin = JSON.parse(localStorage.getItem("admin"))?.name;
  return (
    <header className="p-1 md:p-6 md:flex flex-wrap flex-col-reverse md:flex-row items-center justify-between bg-[#3e76a5]   hidden">
      <div className="w-8/12"><p className="text-end text-white font-bold text-2xl">BACKGROUND VERIFICATION TRACKING SYSTEM (BVTS)</p></div>
      <div className="flex gap-3 w-4/12 justify-end"><p className=" whitespace-nowrap font-bold capitalize text-white ">Hi,  {admin}</p>
        <Logout /></div>

    </header>
  );
};

export default Header;
