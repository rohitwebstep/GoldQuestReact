import React from 'react';
import { useSidebar } from '../Sidebar/SidebarContext.jsx'; // Import the custom hook for accessing sidebar context
import DashBoard from '../Dashboard/Dashboard'; // Dashboard component
import ClientManagement from './ClientManagement'; // Client Management component
import PackageManagement from './PackageManagement'; // Package Management component
import ServiceMangement from './ServiceMangement'; // Service Management component
import InternalLogin from './InternalLogin'; // Internal Login component
import Reports from './Reports'; // Reports component
import ExternalLogin from './ExternalLoginData'; // External Login component
import ClientMasterTracker from './ClientMasterTracker'; // Client Master Tracker component
import CandidateMasterTracker from './CandidatemasterTracker'; // Client Master Tracker component
import FolderGrid from './FolderGrid'
import ExelTracker from './ExelTracker'; // Excel Tracker component
import TatDelay from './TatDelay'; // TAT Delay component
import Acknowledgement from './Acknowledgement'; // Acknowledgement component
import ClientManagementList from './ClientManagementList'; // Client Management List component
import InactiveClients from './InactiveClients'; // Inactive Clients component
import ExelTrackerStatus from './ExelTrackerStatus';
import CandidateExcelTrackerStatus from './CandidateExcelTrackerStatus';
import Tickets from './Tickets'
// Excel Tracker Status component
import CreateInvoice from './CreateInvoice';
import { ClientEditForm } from './ClientEditForm';
import HolidayManagement from './HolidayManagement';
import GenerateReportList from './GenerateReportList';
import DeletionCertification from './DeletionCertification';
import CallbackAdmin from './CallbackAdmin';
import ServiceForms from './ServiceForms';
import ServiceReportForm from './ServicesReportForm';
import AdminDeletionRequest from './AdminDeletionRequest';
import PermissionManager from './PermissionManager';
import ActivityLogs from './ActivityLogs';



const tabComponents = {
  dashboard: <DashBoard />,
  profile: <ClientManagement />,
  package_management: <PackageManagement />,
  service_management: <ServiceMangement />,
  internal_login: <InternalLogin />,
  report_summary: <Reports />,
  generate_report: <GenerateReportList />,
  external: <ExternalLogin />,
  client_master: <ClientMasterTracker />,
  candidate_master: <CandidateMasterTracker />,
  exel_tracker: <ExelTracker />,
  tat_delay: <TatDelay />,
  acknowledgment: <Acknowledgement />,
  // update_password: <UpdatePassword />,
  activity_logs: <ActivityLogs />,
  tickets: <Tickets />,
  add_clients: <ClientManagement />,
  active_clients: <ClientManagementList />,
  inactive_clients: <InactiveClients />,
  tracker_status: <ExelTrackerStatus />,
  deletion_certificate: <DeletionCertification />,
  Candidate_tracker_status: <CandidateExcelTrackerStatus />,
  callback: <CallbackAdmin />,
  file_manager: <FolderGrid />,
  generate_invoice: <CreateInvoice />,
  edit: <ClientEditForm />,
  holiday_management: <HolidayManagement />,
  developers: <ServiceForms />,
  report_forms: <ServiceReportForm />,
  deletion_requests: <AdminDeletionRequest />,
  permission_manager: <PermissionManager />,
};

const MainContent = () => {
  const { activeTab } = useSidebar();

  return (
    <div className="w-full md:w-[80%] mt-16 md:mt-0 flex flex-col items-stretch ">
      {tabComponents[activeTab] || <DashBoard />}
    </div>
  );
};

export default MainContent;