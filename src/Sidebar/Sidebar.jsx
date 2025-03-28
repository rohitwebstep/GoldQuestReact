import React, { useState } from 'react';
import { useSidebar } from './SidebarContext.jsx';
import { BiSolidPackage } from "react-icons/bi";
import { HomeIcon, UserIcon } from "@heroicons/react/24/outline";
import { IoMdPersonAdd } from "react-icons/io";
import { RiAiGenerate } from "react-icons/ri";
import { FaFileInvoiceDollar, FaEye, FaEyeSlash, FaServicestack , FaCode } from "react-icons/fa";
import { FaSquarePollHorizontal, FaTicketSimple } from "react-icons/fa6";
import { TiCloudStorage } from "react-icons/ti";
import { TbReportSearch } from "react-icons/tb";
import { VscLinkExternal } from "react-icons/vsc";
import { MdOutlineTrackChanges, MdOutlineDelete, MdEmail, MdAccessTime,MdOutlineDeveloperMode  } from "react-icons/md";
import { IoNotificationsCircle } from "react-icons/io5";
import { GrServices } from "react-icons/gr";
import classNames from 'classnames';
import Logout from '../Dashboard/Logout.jsx';
import { IoCall } from "react-icons/io5";
import { useApiCall } from '../ApiCallContext.jsx';
import { AiOutlineSafetyCertificate } from "react-icons/ai";
import { GrUserAdmin } from "react-icons/gr";
import { BsActivity } from "react-icons/bs";

const tabNames = {
  dashboard: (<><HomeIcon className="h-6 w-6 mr-3 text-gray-600" />DashBoard</>),
  profile: {
    icon: (<><UserIcon className="h-6 w-6 mr-3 text-gray-600" />Client Management</>),
    subItems: [
      { id: 'add_clients', name: 'Add New Client', icon: <IoMdPersonAdd className="h-5 w-5 mr-2 text-gray-500" /> },
      { id: 'active_clients', name: 'Active Clients', icon: <FaEye className="h-5 w-5 mr-2 text-gray-500" /> },
      { id: 'inactive_clients', name: 'Inactive Clients', icon: <FaEyeSlash className="h-5 w-5 mr-2 text-gray-500" /> }
    ]
  },
  package_management: (<><BiSolidPackage className="h-6 w-6 mr-3 text-gray-600" />Package Management</>),
  service_management: (<><GrServices className="h-6 w-6 mr-3 text-gray-600" />Service Management</>),
  generate_invoice: (<><FaFileInvoiceDollar className="h-6 w-6 mr-3 text-gray-600" />Create Invoice</>),
  internal_login: (<><TiCloudStorage className="h-6 w-6 mr-3 text-gray-600" />Internal Login Credentials</>),
  report: {
    icon: (<><TbReportSearch className="h-6 w-6 mr-3 text-gray-600" />Reports Summary</>),
    subItems: [
      { id: 'report_summary', name: 'Report Tracker', icon: <FaSquarePollHorizontal className="h-5 w-5 mr-2 text-gray-500" /> },
      { id: 'generate_report', name: 'Generate Report', icon: <RiAiGenerate className="h-5 w-5 mr-2 text-gray-500" /> },
    ]
  },
  delete: {
    icon: (<><AiOutlineSafetyCertificate className="h-6 w-6 mr-3 text-gray-600" />Deletion Certification</>),
    subItems: [
      { id: 'deletion_certificate', name: 'Deletion Certificate', icon: <MdOutlineDelete className="h-5 w-5 mr-2 text-gray-500" /> },
      { id: 'deletion_requests', name: 'Deletion Certificate Requests', icon: <AiOutlineSafetyCertificate className="h-5 w-5 mr-2 text-gray-500" /> },
    ]
  },
  external: (<><VscLinkExternal className="h-6 w-6 mr-3 text-gray-600" />External Login Credentials</>),
  client_master: (<><MdOutlineTrackChanges className="h-6 w-6 mr-3 text-gray-600" />Client Master Tracker</>),
  candidate_master: (<><MdAccessTime className="h-6 w-6 mr-3 text-gray-600" />Candidate Master Tracker</>),
  permission_manager: (<><GrUserAdmin  className="h-6 w-6 mr-3 text-gray-600" />Permission Manager</>),
  tickets: (<><FaTicketSimple className="h-6 w-6 mr-3 text-gray-600" />Tickets</>),
  tat_delay: (<><IoNotificationsCircle className="h-6 w-6 mr-3 text-gray-600" />TAT Delay Notification</>),
  acknowledgment: (<><MdEmail className="h-6 w-6 mr-3 text-gray-600" />Acknowledgment Email</>),
  holiday_management: (<><FaFileInvoiceDollar className="h-6 w-6 mr-3 text-gray-600" />Holiday Management</>),
  callback: (<><IoCall className="h-6 w-6 mr-3 text-gray-600" />Callback Request</>),
  activity_logs: (<><BsActivity  className="h-6 w-6 mr-3 text-gray-600" />Activity Logs</>),
  developers_tool: {
    icon: (<><FaCode className="h-6 w-6 mr-3 text-gray-600" />Developers</>),
    subItems: [
      { id: 'developers', name: 'Developer', icon: <MdOutlineDeveloperMode   className="h-5 w-5 mr-2 text-gray-500" /> },
      { id: 'report_forms', name: 'Services Forms', icon: <FaServicestack  className="h-5 w-5 mr-2 text-gray-500" /> },
    ]
  },
  // file_manager: (<><FaFileAlt className="h-6 w-6 mr-3 text-gray-600" />File Manager</>),
};

const Sidebar = () => {
  const { isApiLoading } = useApiCall();

  const [toggle, setToggle] = useState(false);
  const [expandedTab, setExpandedTab] = useState(null);
  const { activeTab, handleTabChange } = useSidebar();

  const handleToggle = () => setToggle(!toggle);

  const onTabChange = (tab) => {
    handleTabChange(tab);
    setToggle(false); // Close sidebar on mobile after selection
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExpand = (tab) => setExpandedTab(expandedTab === tab ? null : tab);

  return (
    <div className="flex flex-col md:flex-row relative z-10  h-full md:w-[20%] ">
      <button
        className="md:hidden p-3 fixed  top-0 left-0 z-40 bg-[#3e76a5] text-white w-full  focus:outline-none"
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
        className={`w-full  bg-white border-e fixed md:relative top-0 left-0  transition-transform transform ${toggle ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0`}
      >
        <div className="px-3 py-4 mt-10 md:mt-0 overflow-auto h-[500px]" id='menuitem'>
          <ul>
            {Object.keys(tabNames).map((tab) => {
              const tabContent = tabNames[tab];
              return (
                <React.Fragment key={tab}>
                  <li
                    className={classNames(
                      'w-full flex items-center p-3 cursor-pointer rounded-md my-2 text-sm',
                      {
                        'bg-[#3e76a5] text-white': activeTab === tab,
                        'hover:bg-[#3e76a5] hover:text-white': activeTab !== tab && !isApiLoading,
                        'opacity-50 cursor-not-allowed': isApiLoading,
                      }
                    )}
                    onClick={() => {
                      if (!isApiLoading) {
                        if (tabContent.subItems) {
                          handleExpand(tab);
                        } else {
                          onTabChange(tab);
                        }
                      }
                    }}
                  >
                    {tabContent.icon || tabContent}
                  </li>
                  {expandedTab === tab && tabContent.subItems && (
                    <ul className="pl-6">
                      {tabContent.subItems.map((subItem) => (
                        <li
                          key={subItem.id}
                          className={classNames(
                            'w-full flex items-center p-3 cursor-pointer rounded-md my-2 text-sm',
                            {
                              'bg-[#3e76a5] text-white': activeTab === subItem.id,
                              'hover:bg-[#3e76a5] hover:text-white': activeTab !== subItem.id && !isApiLoading,
                              'opacity-50 cursor-not-allowed': isApiLoading,
                            }
                          )}
                          onClick={() => {
                            if (!isApiLoading) {
                              onTabChange(subItem.id);
                            }
                          }}
                        >
                          {subItem.icon}
                          {subItem.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </React.Fragment>
              );
            })}
          </ul>

          <Logout />
        </div>

      </div>
    </div>
  );
};

export default Sidebar;
