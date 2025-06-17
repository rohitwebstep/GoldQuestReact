import React, { useState } from 'react';
import classNames from 'classnames';
import { AiOutlineCheckCircle, AiOutlineInfoCircle, AiOutlineWarning, AiOutlineCloseCircle } from 'react-icons/ai';

const NotificationBox = ({ message, type, dismissable = true }) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const notificationClasses = classNames('px-4 py-3 rounded shadow-md flex items-center space-x-3 transition-opacity duration-300', {
    'bg-[#3e76a5] border-[#3e76a5] text-[#3e76a5]': type === 'success',
    'bg-blue-100 border-blue-500 text-blue-700': type === 'info',
    'bg-yellow-100 border-yellow-500 text-yellow-700': type === 'warning',
    'bg-red-100 border-red-500 text-red-700': type === 'error',
  });

  const icon = {
    success: <AiOutlineCheckCircle className="text-[#3e76a5]" />,
    info: <AiOutlineInfoCircle className="text-blue-700" />,
    warning: <AiOutlineWarning className="text-yellow-700" />,
    error: <AiOutlineCloseCircle className="text-red-700" />,
  }[type];

  return (
    <div className={`border ${notificationClasses} mb-4`}>
      {icon}
      <span>{message}</span>
      {dismissable && (
        <button
          onClick={() => setVisible(false)}
          className="ml-auto text-lg leading-none focus:outline-none"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default NotificationBox;
