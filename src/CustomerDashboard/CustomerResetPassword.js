import React, { useState, useEffect } from 'react';
import { PiDotsThreeFill } from "react-icons/pi";
import { FaArrowLeft } from 'react-icons/fa6';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const CustomerResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email');
  const token = queryParams.get('token');

  useEffect(() => {
    // Navigate to login if email or token is missing
    if (!email || !token) {
      navigate('/customer-login');
    }
  }, [email, token, navigate]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission

    // Validate passwords match
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      new_password: password,
      email: email,
      password_token: token,
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    fetch("https://api.goldquestglobal.in/branch/forgot-password", requestOptions)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json(); // Parse the JSON response
      })
      .then((result) => {
        Swal.fire({
          title: 'Success',
          text: 'Password has been successfully reset!',
          icon: 'success',
          confirmButtonText: 'OK',
        }).then(() => {
          // Navigate to the customer login page after clicking OK
          navigate('/customer-login');
        });
      })
      .catch((error) => {
        console.error('Error:', error);
        setMessage('Failed to reset password. Please try again.'); // Error message
      });
  };

  return (
    <div className="bg-white md:w-5/12 m-auto shadow-md rounded-sm p-5 translate-y-2/4">
      <div className="text-center">
        <PiDotsThreeFill className='text-8xl w-full text-center' />
        <h2 className='text-3xl font-bold py-4'>Set New Password</h2>
        <p className='text-lg'>Must be at least 8 characters</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="password" className='d-block'>Password</label>
          <input
            type="password"
            id="password"
            className='outline-none p-3 border mt-3 w-full rounded-md'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="confirm-password" className='d-block'>Confirm Password</label>
          <input
            type="password"
            id="confirm-password"
            className='outline-none p-3 border mt-3 w-full rounded-md'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        {message && <p className="text-red-500">{message}</p>} {/* Displaying messages */}
        <button type="submit" className='bg-[#3e76a5] text-white p-3 rounded-md w-full mb-4 hover:bg-[#3e76a5]'>Reset Password</button>
        <span className='flex justify-center items-center gap-4 text-blue-400'>
          <FaArrowLeft />
          <Link to='/customerlogin'>Back to Login</Link>
        </span>
      </form>
    </div>
  );
}

export default CustomerResetPassword;
