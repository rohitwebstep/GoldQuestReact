import { React, useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa6';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const ForgotPassword = () => {

  const [formData, setFormData] = useState({
    email: '',
  });
  const navigate = useNavigate();


  const [loading, setLoading] = useState(false); // Track loading state
  const [emailSent, setEmailSent] = useState(false); // Track if the email has been sent
  const [isBlocked, setIsBlocked] = useState(false); // Track blocked state

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev, [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault(); // Prevent default form submission if triggered by form submit

    if (emailSent) return; // Prevent submission if email has already been sent

    setLoading(true); // Set loading to true when the request starts
    setEmailSent(false); // Reset email sent state

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      email: formData.email,
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    fetch("https://api.goldquestglobal.in/admin/forgot-password-request", requestOptions)
      .then((response) => response.json())  // Parse the response as JSON
      .then((result) => {
        if (result.status) {  // Check if the status is true
          // Show success message from the result
          Swal.fire(
            'Success!',
            result.message || 'Password reset email has been sent.',
            'success'
          );
          setEmailSent(true); // Set emailSent to true when the email is successfully sent
        } else if (result.message === "Too many reset requests. Your account is temporarily blocked. Please try again tomorrow.") {
          // Blocked message - disable the form and show a blocked message
          setIsBlocked(true); // Set the blocked state
          Swal.fire(
            'Blocked!',
            result.message || 'Your account is temporarily blocked. Please try again tomorrow.',
            'error'
          );
          navigate('/admin-login')
        } else {
          // If the status is false, show an error message
          Swal.fire(
            'Error!',
            result.message || 'An error occurred while processing your request.',
            'error'
          );
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        Swal.fire(
          'Error!',
          'There was an issue with the request.',
          'error'
        );
      })
      .finally(() => {
        setLoading(false); // Reset loading state when request is done
      });
  };

  const handleResendEmail = () => {
    setEmailSent(false); // Reset the emailSent state to allow form submission
    handleSubmit(); // Trigger the form submit function to resend the email
  };

  return (
    <div className={`bg-white md:w-5/12 m-auto shadow-md rounded-sm p-5 translate-y-2/4 border ${isBlocked ? 'form-blocked' : ''}`}>
      <h2 className='md:text-4xl text-2xl font-bold pb-8 md:pb-4'>Forgot Password?</h2>
      <p>We'll Send You Reset Instructions.</p>

      {/* Forgot Password Form */}
      <form onSubmit={handleSubmit} className={`mt-9 mb-9 `}>

        <div className="mb-4">
          <label htmlFor="email" className='d-block'>Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            className='outline-none p-3 border mt-3 w-full rounded-md'
            value={formData.email}
            onChange={handleChange}
            required
            disabled={emailSent || isBlocked} // Disable the input field after email is sent or if blocked
          />
        </div>
        <button
          type='submit'
          className={`text-white p-3 rounded-md w-full inline-block text-center 
    ${loading || emailSent || isBlocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#3e76a5] hover:bg-[#3e76a5]'}`}
          disabled={loading || emailSent || isBlocked} // Disable the button if loading, email has been sent or account is blocked
        >
          {loading ? "Submitting..." : emailSent ? "Email Sent" : "Reset Password"}
        </button>

      </form>

      {/* Resend Email Section */}
      {emailSent && !loading && !isBlocked && (
        <div className="mt-4">
          <button
            onClick={handleResendEmail}
            className="bg-blue-400 text-white hover:bg-blue-200 p-3 rounded-md w-full inline-block text-center"
            disabled={loading} // Disable the resend button if loading
          >
            Resend Email
          </button>
        </div>
      )}

      {/* Blocked Message */}
      {isBlocked && (
        <div className="mt-4 text-center text-red-500">
          <p>Your account is temporarily blocked. Please try again tomorrow.</p>
        </div>
      )}

      <span className='flex justify-center items-center gap-4 text-blue-400 mt-4'>
        <FaArrowLeft />
        <Link to='/admin-login'>Back to Login</Link>
      </span>
    </div>
  );
};

export default ForgotPassword;
