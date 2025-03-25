import React, { useState } from 'react';

const AddUserForm = () => {
    const [newPass, setNewPass] = useState({
        email: '',
        pass: '',
        c_pass: '',
    });
    const [passError, setPassError] = useState({});

    const handleChange = (event) => {
        const { name, value } = event.target;
        setNewPass((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const validate = () => {
        const errors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 

        if (!newPass.email) {
            errors.email = 'This is required';
        } else if (!emailRegex.test(newPass.email)) {
            errors.email = 'Invalid email format';
        }

        if (!newPass.pass) {
            errors.pass = 'This is required';
        }

        if (!newPass.c_pass) {
            errors.c_pass = 'This is required';
        } else if (newPass.c_pass !== newPass.pass) {
            errors.c_pass = 'Passwords do not match';
        }

        return errors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errors = validate();
        if (Object.keys(errors).length === 0) {
            setPassError({});
            // You can handle successful submission here (e.g., send data to an API)
        } else {
            setPassError(errors);
        }
    };

    return (
        <form className='mt-4' onSubmit={handleSubmit}>
            <div className="mb-6 text-left">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="AddUserEmail">User Email</label>
                <input
                    type="email"
                    name="email"
                    className="appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                    id="AddUserEmail"
                    placeholder='Enter your email'
                    onChange={handleChange}
                    value={newPass.email}
                />
                {passError.email && <p className='text-red-500'>{passError.email}</p>}
            </div>
            <div className="mb-6 text-left">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="AddUserPassword">Password</label>
                <input
                    type="password"
                    name="pass"
                    className="appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                    id="AddUserPassword"
                    placeholder='Enter your password'
                    onChange={handleChange}
                    value={newPass.pass}
                />
                {passError.pass && <p className='text-red-500'>{passError.pass}</p>}
            </div>
            <div className="mb-6 text-left">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="AddUserConfirmPassword">Confirm Password</label>
                <input
                    type="password"
                    name="c_pass"
                    className="appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                    id="AddUserConfirmPassword"
                    placeholder='Confirm your password'
                    onChange={handleChange}
                    value={newPass.c_pass}
                />
                {passError.c_pass && <p className='text-red-500'>{passError.c_pass}</p>}
            </div>
            <button type="submit" className='bg-[#3e76a5] text-white p-3 rounded-md w-full mb-4 hover:bg-[#3e76a5]'>
                Create SubUser
            </button>
        </form>
    );
};

export default AddUserForm;
