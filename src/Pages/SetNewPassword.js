import React, { useState } from 'react';
import { PiDotsThreeFill } from "react-icons/pi";
import { FaArrowLeft } from 'react-icons/fa6';
import { Link, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';

const SetNewPassword = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const email = queryParams.get('email');
    const token = queryParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission
    
        // Password length validation
        if (password.length < 8 || password.length>10) {
            setPasswordError("Password must be between 8 and 10 characters long");
            return;
        } else {
            setPasswordError(""); // Clear error if valid
        }
    
        if (confirmPassword.length < 8) {
            setConfirmPasswordError("Confirm Password must be at least 8 characters.");
            return;
        } else {
            setConfirmPasswordError(""); // Clear error if valid
        }
    
        // Check if passwords match
        if (password !== confirmPassword) {
            setMessage("Passwords do not match");
            return;
        } else {
            setMessage(""); // Clear error if passwords match
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
    
        fetch("https://api.goldquestglobal.in/admin/forgot-password", requestOptions)
            .then((response) => {
                return response.json(); // Parse the response as JSON
            })
            .then((result) => {
                // Display success message
                if (result.status) {
                    Swal.fire({
                        title: "Success!",
                        text: result.message || "Password reset successfully.",
                        icon: "success",
                        confirmButtonText: "OK",
                    });
    
                    // Optionally, you can redirect the user after success
                    // navigate('/some-path');
                } else {
                    // Display error message if status is false
                    Swal.fire({
                        title: "Error!",
                        text: result.message || "An error occurred during password reset.",
                        icon: "error",
                        confirmButtonText: "OK",
                    });
                }
    
                // Save token to localStorage if provided
                const newToken = result._token || result.token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
            })
            .catch((error) => {
                console.error('Error:', error);
                Swal.fire({
                    title: "Error!",
                    text: "Failed to reset password. Please try again.",
                    icon: "error",
                    confirmButtonText: "OK",
                });
            });
    };
    

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="bg-white md:w-5/12 w-full m-auto shadow-md rounded-sm p-5 border">
                <div className="text-center">
                    <PiDotsThreeFill className="text-8xl w-full text-center" />
                    <h2 className="text-3xl font-bold py-4">Set New Password</h2>
                    <p className="text-lg">Must be at least 8 characters</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="password" className="d-block">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="outline-none p-3 border mt-3 w-full rounded-md"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        {passwordError && <p className="text-red-500">{passwordError}</p>}
                    </div>
                    <div className="mb-4">
                        <label htmlFor="confirm-password" className="d-block">Confirm Password</label>
                        <input
                            type="password"
                            id="confirm-password"
                            className="outline-none p-3 border mt-3 w-full rounded-md"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        {confirmPasswordError && <p className="text-red-500">{confirmPasswordError}</p>}
                    </div>
                    {message && <p className="text-red-500">{message}</p>} {/* Displaying messages */}
                    <button type="submit" className="bg-[#3e76a5] text-white p-3 rounded-md w-full mb-4 hover:bg-[#3e76a5]">Reset Password</button>
                    <span className="flex justify-center items-center gap-4 text-blue-400">
                        <FaArrowLeft />
                        <Link to='/admin-login'>Back to Login</Link>
                    </span>
                </form>
            </div>
        </div>
    );
};

export default SetNewPassword;
