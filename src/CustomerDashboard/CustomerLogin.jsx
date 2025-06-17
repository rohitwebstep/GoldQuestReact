import  {React,useEffect} from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import active_client from '../Images/Login.jpeg';
import CustomerLoginForm from './CustomerLoginForm';
import loginImg from '../Images/customerlogin.png'
const CustomerLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {

    const storedAdminData = localStorage.getItem("branch");
    const storedToken = localStorage.getItem("branch_token");
    let preBranchData;

    try {
      preBranchData = JSON.parse(storedAdminData);
    } catch (e) {
      console.error('Error parsing JSON from localStorage:', e);
      preBranchData = null;
    }

    if (preBranchData || storedToken) {

      navigate('/customer-dashboard', { state: { from: location }, replace: true });
      return;
    }
  }, [location, navigate])
  return (
    <>
      <div className="bg-cover h-screen md:h-lvh bg-center flex md:items-center justify-center p-4 md:p-10" style={{ backgroundImage: `url(${active_client})` }}>
        <div className="md:flex  h-auto flex-col gap-10 md:flex-row items-center w-full md:w-7/12 p-4 bg-slate-50 opacity-90 lg:p-6 xl:px-16 rounded-lg shadow-lg">
          <div className="w-full md:w-7/10 flex flex-col lg:p-4">
            <CustomerLoginForm />
          </div>
          <div className="w-full md:w-3/10 hidden  md:flex items-center mt-5 md:mt-0 justify-center">
            <img src={loginImg} alt="" className='' />
          </div>
        </div>

      </div>
    </>
  )
}

export default CustomerLogin
