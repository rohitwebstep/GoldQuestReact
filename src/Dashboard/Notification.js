import React, { useState } from 'react';
import NotificationBox from './NotificationBox';
import { IoNotificationsCircleSharp } from "react-icons/io5";

const Notification = () => {
  const [notifications] = useState([
    { id: 1, message: 'Success! Your action was successful.', type: 'success' },
    { id: 2, message: 'Info! This is some information.', type: 'info' },
    { id: 3, message: 'Warning! Be careful with this.', type: 'warning' },
    { id: 4, message: 'Error! Something went wrong.', type: 'error' },
  ]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-[#3e76a5] flex items-end gap-4"><IoNotificationsCircleSharp className='text-4xl' />
      Notification Box</h1>
      {notifications.map(notification => (
        <NotificationBox
          key={notification.id}
          message={notification.message}
          type={notification.type}
        />
      ))}
    </div>
  );
};

export default Notification;
