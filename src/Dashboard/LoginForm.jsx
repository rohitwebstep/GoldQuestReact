import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { useApi } from "../ApiContext";
import logo from "../Images/Logo.png";
import bg_img from "../Images/login-bg-img.png";

const LoginForm = () => {
  const [input, setInput] = useState({
    username: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const API_URL = useApi();
  const [error, setError] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  // On component mount, check localStorage for saved login credentials
  useEffect(() => {
    const savedUsername = localStorage.getItem("username");
    const savedPassword = localStorage.getItem("password");

    if (savedUsername && savedPassword) {
      setInput({
        username: savedUsername,
        password: savedPassword,
      });
      setRememberMe(true);
    }
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setInput((prevInput) => ({
      ...prevInput,
      [name]: value,
    }));
  };

  const handleRememberMeChange = () => {
    setRememberMe((prev) => !prev);
  };

  const validateError = () => {
    const newErrors = {};

    if (!input.username) {
        newErrors.username = "This is Required";
    }

    if (!input.password) {
        newErrors.password = "This is Required";
    } else if (input.password.length < 8 | input.password.length > 10) {
        newErrors.password = "Password must be between 8 and 10 characters long";
    }

    return newErrors;
};


  const handleSubmit = (event) => {
    event.preventDefault();
    const errors = validateError();

    if (Object.keys(errors).length === 0) {
      setLoading(true);

      const loginData = {
        username: input.username,
        password: input.password,
      };

      const swalInstance = Swal.fire({
        title: "Processing...",
        text: "Please wait while we log you in.",
        didOpen: () => {
          Swal.showLoading();
        },
        allowOutsideClick: false,
        showConfirmButton: false,
      });

      axios
        .post(`${API_URL}/admin/login`, loginData)
        .then((response) => {
          const result = response.data;

          if (!result.status) {
            Swal.fire({
              title: "Error!",
              text: result.message || "An error occurred",
              icon: "error",
              confirmButtonText: "Ok",
            });
          } else {
            if (result.message === "OTP sent successfully.") {
              Swal.fire({
                title: "OTP Sent!",
                text: "Please check your email for the OTP to proceed with the login.",
                icon: "info",
                confirmButtonText: "Ok",
              }).then(() => {
                setShowOtpModal(true);
              });
            } else {
              handleLoginSuccess(result);
            }
          }

          // Handle token storage
          const newToken = result._token || result.token;
          if (newToken) {
            localStorage.setItem("_token", newToken);
          }

          // Store credentials if 'Remember me' is checked
          if (rememberMe) {
            localStorage.setItem("username", input.username);
            localStorage.setItem("password", input.password);
          } else {
            localStorage.removeItem("username");
            localStorage.removeItem("password");
          }
        })
        .catch((error) => {
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "An unexpected error occurred";
          Swal.fire({
            title: "Error!",
            text: errorMessage,
            icon: "error",
            confirmButtonText: "Ok",
          });
        })
        .finally(() => {
          swalInstance.close();
          setLoading(false);
        });
    } else {
      setError(errors);
    }
  };

  const handleLoginSuccess = (result) => {
    const adminData = result.adminData;
    const _token = result.token;

    localStorage.setItem("admin", JSON.stringify(adminData));
    localStorage.setItem("_token", _token);

    Swal.fire({
      title: "Success",
      text: "Login Successful",
      icon: "success",
      confirmButtonText: "Ok",
    });

    navigate("/", { state: { from: location }, replace: true });
  };

  const handleOtpSubmit = () => {
    setIsOtpLoading(true);

    axios
      .post(`${API_URL}/admin/verify-two-factor`, {
        username: input.username,
        otp,
      })
      .then((response) => {
        const result = response.data;
        if (!result.status) {
          Swal.fire({
            title: "Error!",
            text: result.message,
            icon: "error",
            confirmButtonText: "Ok",
          });
        } else {
          setShowOtpModal(false);
          handleLoginSuccess(result);
        }
      })
      .catch((error) => {
        Swal.fire({
          title: "Error!",
          text: `Error: ${error.response?.data?.message || error.message}`,
          icon: "error",
          confirmButtonText: "Ok",
        });
      })
      .finally(() => {
        setIsOtpLoading(false);
      });
  };

  const goToForgotPassword = () => {
    navigate("/ForgotPassword");
  };

  return (
    <>
      <div className="md:bg-[#f9f9f9] h-screen flex items-end justify-center" id="login_form">
        <div className="flex wrap lg:flex-nowrap flex-col-reverse lg:flex-row bg-white lg:w-10/12 p-3 m-auto rounded-md">
          <div className="md:w-10/12 lg:w-7/12 w-full m-auto">
            <img src={bg_img} alt="Logo" className="" />
          </div>

          <div className="lg:w-5/12 flex mb-10 md:mb-0 justify-center md:mt-0 mt-10">
            <div className="w-full lg:max-w-xl md:p-8">
              <div className="flex flex-col items-center mb-3 md:mb-12">
                <img
                  src={logo}
                  alt="Logo"
                  className="mb-4 lg:h-[150px] md:h-[160px] w-6/12 m-auto md:w-auto logo_img"
                />
                <h2 className="text-[18px] text-center font-bold text-[#24245a]">
                  Building Trust - One Check At A Time
                </h2>
              </div>

              <h2 className="text-xl font-semibold text-center text-[#24245a] mb-6 md:text-2xl">
                Login Account
              </h2>
              <form className="mt-8" onSubmit={handleSubmit}>
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Username"
                    className="w-full px-4 py-4 border-l-[6px] bg-[#f9f9f9] border-[#24245a] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="username"
                    onChange={handleChange}
                    value={input.username}
                    name="username"
                  />
                  {error.username && (
                    <p className="text-red-500">{error.username}</p>
                  )}
                </div>
                <div className="mb-10">
                  <input
                    className="w-full px-4 py-4 border-l-[6px]  bg-[#f9f9f9]  border-[#24245a] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="password"
                    type="password"
                    name="password"
                    value={input.password}
                    onChange={handleChange}
                    placeholder="Password"
                  />
                  {error.password && (
                    <p className="text-red-500">{error.password}</p>
                  )}
                </div>
                <div className="flex items-center justify-between mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={handleRememberMeChange}
                      className="mr-2"
                    />
                    Remember me
                  </label>
                  <div onClick={goToForgotPassword}>
                    <a
                      href="#"
                      className="text-red-500 hover:underline text-sm"
                    >
                      Forgot Password?
                    </a>
                  </div>
                </div>
                <button
                  type={showOtpModal ? "button" : "submit"}
                  className="w-full bg-[#24245a] hover:bg-[#24245a] xxl:py-5 text-white font-semibold py-2 md:py-3 px-4 signinbtn rounded-full text-xl tracking-widest"
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </button>
                {showOtpModal && (
                  <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 w-96">
                      <h3 className="text-xl font-bold mb-4">Enter OTP</h3>
                      <input
                        className="appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                      <button
                        type="submit"
                        className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full ${
                          isOtpLoading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        onClick={handleOtpSubmit}
                        disabled={isOtpLoading}
                      >
                        {isOtpLoading ? "Verifying..." : "Verify"}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginForm;
