import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useApi } from '../ApiContext';
const EmailLogin = () => {
  const API_URL = useApi();

  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const emailFromQuery = query.get('email') || '';
  const navigate = useNavigate();

  const [input, setInput] = useState({
    email: emailFromQuery,
    password: "",
  });

  const [error, setError] = useState({});

  useEffect(() => {
    setInput(prev => ({
      ...prev,
      email: emailFromQuery,
    }));
  }, [emailFromQuery]);

  const validations = () => {
    const newErrors = {};
    if (!input.email) {
      newErrors.email = 'This field is required!';
    }
    if (!input.password) {
      newErrors.password = 'This field is required!';
    } else if (input.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInput(prev => ({
      ...prev, [name]: value,
    }));
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    const validateError = validations();

    if (Object.keys(validateError).length === 0) {
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify({
        "username": input.email,
        "password": input.password,
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };

      fetch(`${API_URL}/branch/login`, requestOptions)
        .then(res => res.json())
        .then(response => {
          if (!response.status) {
            Swal.fire({
              title: 'Error!',
              text: `An error occurred: ${response.message}`,
              icon: 'error',
              confirmButtonText: 'Ok'
            });
            const newToken = response.branch_token || response.token;
            if (newToken) {
              localStorage.setItem("branch_token", newToken);
            }
          } else {

            const branchData = response.branchData;
            const branch_token = response.token;

            localStorage.setItem('branch', JSON.stringify(branchData));
            localStorage.setItem('branch_token', branch_token);

            Swal.fire({
              title: "Success",
              text: 'Login Successful',
              icon: "success",
              confirmButtonText: "Ok"
            });


            navigate('/customer-dashboard', { state: { from: location }, replace: true });
            setError({});
          }
        })
        .catch(error => {
          Swal.fire({
            title: 'Error!',
            text: `Error: ${error.response?.data?.message || error.message}`,
            icon: 'error',
            confirmButtonText: 'Ok'
          });
          console.error('Login failed:', error); // Log the error details
        });

    } else {
      setError(validateError);
    }
  };

  return (
    <>
      <form className='mt-9' onSubmit={handleSubmitForm}>
        <div className="mb-3">
          <label htmlFor="email" className='d-block '>Enter Your Email:</label>
          <input type="email"
            name="email"
            id="EmailId"
            onChange={handleChange}
            value={input.email}
            className='outline-none p-3 border mt-3 w-full rounded-md' />
          {error.email && <p className='text-red-500'>{error.email}</p>}
        </div>
        <div className="mb-3">
          <label htmlFor="Password" className='d-block '>Enter Your Password:</label>
          <input type="password"
            name="password"
            id="YourPassword"
            onChange={handleChange}
            value={input.password}
            className='outline-none p-3 border mt-3 w-full rounded-md' />
          {error.password && <p className='text-red-500'>{error.password}</p>}
        </div>
        <button type="submit" className='bg-[#3e76a5] text-white p-3 rounded-md w-full hover:bg-[#3e76a5]'>Sign In</button>
        <span className='text-center pt-4 flex justify-center text-blue-400 cursor-pointer'>
          <Link to='/forgotpassword'>Forgot Password?</Link>
        </span>
      </form>
    </>
  );
}

export default EmailLogin;
