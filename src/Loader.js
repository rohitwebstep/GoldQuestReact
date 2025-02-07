import React, {useState, CSSProperties, useContext } from 'react';
import PulseLoader from "react-spinners/PulseLoader";
import { LoaderContext } from './LoaderContext';
const Loader = () => {
    const {loading}=useContext(LoaderContext)
    const override: CSSProperties = {
        display: "block",
        margin: "0 auto",
        borderColor: "red",
      };
    const [color] = useState("#000");
    
  return (
    <>
    <div className='flex items-center justify-center min-h-screen'>
    <div className="sweet-loading">
      <PulseLoader
        color={color}
        loading={loading}
        cssOverride={override}
        size={15}
        aria-label="Loading Spinner"
        data-testid="loader"
      />
    </div>
  </div>
    </>
  )
}

export default Loader