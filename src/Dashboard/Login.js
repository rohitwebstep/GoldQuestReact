import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import LoginForm from './LoginForm';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {


    const storedAdminData = localStorage.getItem("admin");
    const storedToken = localStorage.getItem("_token");
    let preAdminData;

    try {
      preAdminData = JSON.parse(storedAdminData);
    } catch (e) {
      console.error('Error parsing JSON from localStorage:', e);
      preAdminData = null;
    }

    if (preAdminData || storedToken) {

      navigate('/', { state: { from: location }, replace: true });
      return;
    }
  }, [location, navigate])


  return (

    <LoginForm />
  );
};

export default Login;
