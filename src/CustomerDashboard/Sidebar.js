import React, { useState } from "react";
import { HomeIcon, UserIcon } from "@heroicons/react/24/outline";
import { RiLockPasswordFill } from "react-icons/ri";
import { FaDropbox } from "react-icons/fa";
import { AiFillDropboxCircle } from "react-icons/ai";
import { GrIntegration, GrServices } from "react-icons/gr";
import DashBoard from './Dashboard';
import EmployeeManagement from './EmployeeManagement';
import AddUser from './AddUser';
import BulkUpload from './BulkUpload';
import EscalationMatrix from './EscalationMatrix';
import CustomerHeader from './CustomerHeader';
import Logout from './Logout';
import ReportCaseTable from "./ReportCaseTable";
import DropBoxList from "./DropBoxList";
import CandidateList from "./CandidateList";
import CaseLog from './CaseLog'
import Integration from './Integration'
import { IoCall } from "react-icons/io5";
import { useApiCall } from '../ApiCallContext';
import DeletionRequest from "./DeletionRequest";
import SubUserCredentials from "./SubuserCredentials";
import { CiUser } from "react-icons/ci";
import CustomerUpdatePassword from "./CustomerUpdatePassword";

const tabComponents = {
  dashboard: <DashBoard />,
  employee_management: <EmployeeManagement />,
  add_user: <AddUser />,
  report_case: <ReportCaseTable />,
  dropbox: <DropBoxList />,
  Candidate: <CandidateList />,
  bulkupload: <BulkUpload />,
  update_password: <CustomerUpdatePassword />,
  escalation: <EscalationMatrix />,
  case_logs: <CaseLog />,
  callback: <DeletionRequest />,
  subuser: <SubUserCredentials />,
  integartion: <Integration />

};

const tabNames = {
  dashboard: (<><HomeIcon className="h-6 w-6 mr-3 text-gray-600" />DashBoard</>),
  employee_management: (<><UserIcon className="h-6 w-6 mr-3 text-gray-600" />Client Master Data</>),
  subuser: (<><CiUser className="h-6 w-6 mr-3 text-gray-600" />Add Subuser Credentials</>),
  report_case: (<><GrServices className="h-6 w-6 mr-3 text-gray-600" />Report & Case Status</>),
  dropbox: (<><FaDropbox className="h-6 w-6 mr-3 text-gray-600" />Client DropBox</>),
  case_logs: (<><RiLockPasswordFill className="h-6 w-6 mr-3 text-gray-600" />Case Logs</>),
  integartion: (<><GrIntegration className="h-6 w-6 mr-3 text-gray-600" />Integration</>),
  callback: (<><IoCall className="h-6 w-6 mr-3 text-gray-600" /> Deletion Requests</>),
  Candidate: (<><AiFillDropboxCircle className="h-6 w-6 mr-3 text-gray-600" />Candidate DropBox</>),
  update_password: (<><RiLockPasswordFill className="h-6 w-6 mr-3 text-gray-600" />Update Password</>),

};

const Sidebar = () => {
  const [toggle, setToggle] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isBranchApiLoading } = useApiCall();
  const handleToggle = () => {
    setToggle(!toggle);
  };

  const onTabChange = (tab) => {
    setActiveTab(tab);
    setToggle(false); // Close sidebar on mobile after selecting a tab
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <CustomerHeader />
      <div className="flex flex-col items-stretch md:flex-row">
        <button
          className="md:hidden p-3 fixed top-0 left-0 z-50  bg-[#3e76a5] text-white w-full  focus:outline-none"
          onClick={handleToggle}
          aria-label="Toggle Sidebar"
        >
          <div className='flex justify-between items-center'>  <div><span className="block w-8 h-1 bg-white mb-1"></span>
            <span className="block w-8 h-1 bg-white mb-1"></span>
            <span className="block w-8 h-1 bg-white"></span></div>
            <div><Logout/></div></div>

        </button>


        {/* Sidebar */}
        <div
          className={`w-full md:w-1/5 z-50 mt-10 md:mt-0 flex flex-col h-auto bg-white border-e fixed md:relative top-0 left-0  transition-transform transform ${toggle ? 'translate-x-0' : '-translate-x-full'
            } md:translate-x-0`}
        >
          <div className="h-full">
            <div className="px-3" id="sider_content">
              <div className="flex flex-col px-3 py-8">
                <ul>
                  {Object.keys(tabNames).map((tab) => (
                    <li
                      key={tab}
                      className={`${activeTab === tab ? 'active bg-[#3e76a5] text-white' : 'togglelist hover:bg-[#3e76a5] hover:text-white'
                        } w-full flex items-center p-3 cursor-pointer rounded-md mb-2 ${isBranchApiLoading ? 'pointer-events-none opacity-50' : ''}`}
                      onClick={() => !isBranchApiLoading && onTabChange(tab)} // Prevent tab change while loading
                    >
                      {tabNames[tab]}
                    </li>
                  ))}
                  <Logout />
                </ul>

              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full md:w-4/5 h-full flex flex-col pl-0 mt-20 md:m-4">
          {tabComponents[activeTab]}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
