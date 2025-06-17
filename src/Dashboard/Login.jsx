import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import LoginForm from './LoginForm';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const adminData = JSON.parse(localStorage.getItem("shippingData"));
    const admin_token = adminData?.security?.token;
    if (admin_token) {

      router.push("/admin/auth/login");        // Redirect to login

      return;
    }
  }, [location, navigate])


  return (

    <LoginForm />
  );
};

export default Login;
