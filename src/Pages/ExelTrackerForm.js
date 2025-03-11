import { React, useState } from 'react'

const ExelTrackerForm = () => {
    const [input, setInput] = useState({
        refId: "",
        status: "",
        month: "",
        year: "",
    });
    const [error, setError] = useState({});
    const handleChange = (event) => {
        const { name, value } = event.target;
        setInput((prev) => ({
            ...prev, [name]: value,
        }))
    };

    const validateErrors = () => {
        const newError = {};
        if (!input.refId) {
             newError.refId = 'This is Required!' 
            };
        if (!input.status) { 
            newError.status = 'This is Required!'
         };
        if (!input.month) { 
            newError.month = 'This is Required!'
         };
        if (!input.year) {
             newError.year = 'This is Required!' 
         }
         else{

         }
      
        return newError;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errors = validateErrors();
        if (Object.keys(errors).length === 0) {
         
            setError({});
        }
        else {
            setError(errors);
        }
    };
    return (
        <>
            <form action="" onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="id">Client Reference ID:</label>
                    <input type="text" name="refId" className=" appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="RefId" placeholder='' value={input.refId} onChange={handleChange} />
                      {error.refId && <p className='text-red-500'>{error.refId}</p>}
                    </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">Status:</label>
                    <select name="status" id="Status" className='outline-none pe-14 ps-2 text-left rounded-md w-full border p-2' value={input.status} onChange={handleChange} >
                        <option value="WIP">WIP</option>
                        <option value="Overall">Overall</option>
                        <option value="INSUFF">INSUFF</option>
                        <option value="COMPLETED">COMPLETED</option>
                    </select>
                    {error.status && <p className='text-red-500'>{error.status}</p>}

                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="month">Select Month:</label>
                    <select name="month" id="Select_Month" className='outline-none pe-14 ps-2 text-left rounded-md w-full border p-2' value={input.month} onChange={handleChange} >
                        <option value="Select Month">Select Month</option>
                        <option value="January">January</option>
                        <option value="February">February</option>
                        <option value="March">March</option>
                        <option value="April">April</option>
                        <option value="May">May</option>
                        <option value="June">June</option>
                        <option value="July">July</option>
                        <option value="August">August</option>
                        <option value="September">September</option>
                        <option value="October">October</option>
                        <option value="November">November</option>
                        <option value="December">December</option>
                    </select>
                    {error.month && <p className='text-red-500'>{error.month}</p>}

                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="id">Select Year:</label>
                    <select name="year" id="Select_Years" className='outline-none pe-14 ps-2 text-left rounded-md w-full border p-2' value={input.year} onChange={handleChange} >
                        <option value="Select Year">Select Year</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                    </select>
                    {error.year && <p className='text-red-500'>{error.year}</p>}

                </div>
                <button type="submit" className='bg-[#3e76a5] text-center p-3 w-full rounded-md hover:bg-[#3e76a5] text-white text-lg'>Download</button>
            </form>
        </>
    )
}

export default ExelTrackerForm