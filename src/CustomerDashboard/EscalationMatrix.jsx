import React from 'react';

const EscalationMatrix = () => {
  const escalationData = [
    {
      label: "1st Level",
      Relations: "Client Servicing Team",
    },
    {
      label: "SPOC",
      spocdata: [
        {
          name: "Mr Raj Kumar",
          designation: "Assistant Manager - Client Relations",
          number: "96115 45060",
          id: "bgvcst@goldquestglobal.in",
        },
        {
          name: "Miss Soujanya",
          designation: "Assistant Manager - Client Relations",
          number: "80500 37722",
          id: "bgvcst@goldquestglobal.in",
        }
      ]
    },
    {
      label: "Final Level",
      name: "MR. Jayakumar",
      designation: "CHIEF EXECUTIVE OFFICER",
      number: "8754562623",
      id: "jay@goldquestglobal.in",
    }
  ];

  return (
    <div className="md:m-8 md:p-6 m-2 p-2 bg-gray-50 rounded-lg shadow-lg">
      <h2 className="text-center md:text-5xl text-2xl font-bold mb-10">Escalation Matrix</h2>
      <div className="flex flex-col md:flex-row gap-8">
        {escalationData.map((item, index) => (
          <div key={index} className="bg-white shadow-lg rounded-lg p-8 flex-1 space-y-6">
            <div className="border-b border-gray-300 pb-6 mb-6">
              <h4 className="text-2xl font-semibold text-[#3e76a5] mb-1">{item.label}</h4>
              {item.Relations && <p className="text-lg text-gray-500">{item.Relations}</p>}
            </div>
            {item.spocdata ? (
              <ul className="space-y-6">
                {item.spocdata.map((spoc, spocIndex) => (
                  <li key={spocIndex} className="border-b border-gray-200 pb-4">
                    <div className="md:text-xl text-lg font-semibold text-gray-800 mb-1">{spoc.name}</div>
                    <div className="text-lg text-gray-600 mb-1">{spoc.designation}</div>
                    <div className="text-lg text-gray-600 mb-1">Phone: {spoc.number}</div>
                    <div className="text-lg text-gray-600">Email: <a href={`mailto:${spoc.id}`} className="text-blue-600 hover:underline">{spoc.id}</a></div>
                  </li>
                ))}
              </ul>
            ) : (
              <div>
                <div className="text-xl font-semibold text-gray-800 mb-1">{item.name}</div>
                <div className="text-lg text-gray-600 mb-1">{item.designation}</div>
                <div className="text-lg text-gray-600 mb-1">Phone: {item.number}</div>
                <div className="text-lg text-gray-600">Email: <a href={`mailto:${item.id}`} className="text-blue-600 hover:underline">{item.id}</a></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EscalationMatrix;
