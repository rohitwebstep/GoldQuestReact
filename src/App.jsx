import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, useLocation, Routes, Route } from 'react-router-dom';
import './App.css';
import Render from './Pages/Render';
import ForgotPassword from './Pages/ForgotPassword.jsx';
import CustomerLogin from './CustomerDashboard/CustomerLogin.jsx';
import CustomerBgv from './CustomerDashboard/CustomerBgv.jsx';
import CustomerGapStatus from './CustomerDashboard/CustomerGapStatus.jsx';
import CustomerDav from './CustomerDashboard/CustomerDav.jsx';
import SetNewPassword from './Pages/SetNewPassword.jsx';
import Login from './Dashboard/Login.jsx';
import CustomerDashboard from './CustomerDashboard/CustomerDashboard.jsx';
import CustomerForgotPassword from './CustomerDashboard/CustomerForgotPassword.jsx';
import CustomerResetPassword from './CustomerDashboard/CustomerResetPassword.jsx';
import Admin from './Middleware/Admin.jsx';
import { PackageProvider } from './Pages/PackageContext.jsx';
import { ServiceProvider } from './Pages/ServiceContext.jsx';
import { ClientProvider } from './Pages/ClientManagementContext.jsx';
import { ClientEditProvider } from './Pages/ClientEditContext.jsx';
import { BranchEditProvider } from './Pages/BranchEditContext.jsx';
import { DropBoxProvider } from './CustomerDashboard/DropBoxContext'
import { DataProvider } from './Pages/DataContext.jsx';
import { ApiProvider } from './ApiContext'
import { CustomFunctionsProvider } from './CustomFunctionsContext'
import { TabProvider } from './Pages/TabContext.jsx';
import { BranchProviderExel } from './Pages/BranchContextExel.jsx';
import CandidateMain from './Pages/Candidate/CandidateMain.jsx';
import CandidateBGV from './Pages/CandidateBGV.jsx';
import DemoBgForm from './Pages/DemoBgForm.jsx';
import BackgroundForm from './Pages/BackgroundForm.jsx';
import DigitalAddressVerification from './Pages/DigitalAddressVerification.jsx';
import 'react-select-search/style.css'
import UpdatePassword from './Pages/UpdatePassword.jsx';
import { HolidayManagementProvider } from './Pages/HolidayManagementContext.jsx';
import DashboardProvider from './CustomerDashboard/DashboardContext.jsx';
import ClientBulkUpload from './CustomerDashboard/ClientBulkUpload.jsx';
import CandidiateDav from './Pages/CandidateDAV.jsx';
import { LoginProvider } from './Pages/InternalLoginContext.jsx';
import { AiOutlineArrowUp } from "react-icons/ai";
import { ApiCallProvider } from './ApiCallContext.jsx';
import { ServicesProvider } from './Pages/ServicesContext.jsx';
import GapStatus from './Pages/GapStatus.jsx';
import CandidateBulkUpload from './CustomerDashboard/CandidateBulkUpload.jsx';

const App = () => {
  const [showGoToTop, setShowGoToTop] = useState(false);

  const handleScroll = () => {
    if (window.scrollY > 60) {
      setShowGoToTop(true);
    } else {
      setShowGoToTop(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  return (
    <BranchProviderExel>
     <ApiCallProvider>
      <TabProvider>
        <ApiProvider>
          <DataProvider>
            <ClientEditProvider>
              <BranchEditProvider>
                  <ClientProvider>
                    <DropBoxProvider>
                      <PackageProvider>
                        <ServiceProvider>
                          <CustomFunctionsProvider>
                            <HolidayManagementProvider>
                              <DashboardProvider>
                                <LoginProvider>
                                 <ServicesProvider>
                                  {/* Setting the basename='/' globally */}
                                  <Router basename="/">
                                    <Routes>
                                      {/* Main Route */}
                                      <Route path="/" element={<Admin><Render /></Admin>} />

                                      {/* Customer Routes */}
                                      <Route path="/customer-login" element={<CustomerLogin />} />
                                      <Route path="/customer-dashboard" element={<CustomerDashboard />} />
                                      <Route path="/customer-dashboard/customer-bgv" element={<CustomerBgv />} />
                                      <Route path="/customer-dashboard/customer-dav" element={<CustomerDav />} />
                                      <Route path="/customer-dashboard/customer-gap-check" element={<CustomerGapStatus />} />
                                      <Route path='customer-login/customer-reset-password' element={<CustomerResetPassword />} />
                                      <Route path='customer-login/customer-forgotpassword' element={<CustomerForgotPassword />} />
                                      {/* Admin Routes */}
                                      <Route path="/admin-login" element={<Login />} />
                                      <Route path="/forgotpassword" element={<ForgotPassword />} />
                                      <Route path="/reset-password" element={<SetNewPassword />} />
                                      <Route path="/update-password" element={<UpdatePassword />} />
                                      <Route path="/client" element={<CandidateMain />} />
                                      <Route path="/candidate-bgv" element={<CandidateBGV />} />
                                      <Route path="/candidate-dav" element={<CandidiateDav />} />

                                      {/* Other Routes */}
                                      <Route path="/background-form" element={<BackgroundForm />} />
                                      <Route path="/background-form-c" element={<DemoBgForm />} />
                                      <Route path="/gap-check" element={<GapStatus />} />
                                      <Route path="/digital-form" element={<DigitalAddressVerification />} />

                                      {/* Client Bulk Upload */}
                                      <Route path="/ClientBulkUpload" element={<ClientBulkUpload />} />
                                      <Route path="/CandidateBulkUpload" element={<CandidateBulkUpload />} />
                                    </Routes>
                                    {showGoToTop && (
                                      <div
                                        className="fixed bottom-5 right-5 bg-[#3e76a5] text-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-[#3e76a5]"
                                        onClick={scrollToTop}
                                        aria-label="Scroll to top"
                                      >
                                        <AiOutlineArrowUp className="h-6 w-6" />
                                      </div>
                                    )}
                                  </Router>
                                  </ServicesProvider>
                                </LoginProvider>
                              </DashboardProvider>
                            </HolidayManagementProvider>
                          </CustomFunctionsProvider>
                        </ServiceProvider>
                      </PackageProvider>
                    </DropBoxProvider>
                  </ClientProvider>
              </BranchEditProvider>
            </ClientEditProvider>
          </DataProvider>
        </ApiProvider>
      </TabProvider>
      </ApiCallProvider>
    </BranchProviderExel>

  );
};


export default App;
