import React, { useState } from 'react';

// Importing Icons from React Icons
import { FaFolder, FaFileAlt, FaImage, FaLightbulb } from 'react-icons/fa';

// Folder Item Component
const FolderItem = ({ folderName, folderIcon: Icon, onClick }) => {
  return (
    <div
      className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md md:w-40 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105"
      onClick={onClick} // On click, show images related to the folder
    >
      <div className="md:w-24 md:h-24 bg-gray-200 rounded-t-lg flex justify-center items-center overflow-hidden">
        <Icon className="md:w-12 md:h-12 text-gray-700" /> {/* Display the passed icon */}
      </div>
      <p className="mt-2 text-center text-gray-700 font-semibold">{folderName}</p>
    </div>
  );
};

const FolderGrid = () => {
  const folders = [
    { name: 'Documents', image: '/images/folder-documents.png', images: ['/images/pizaa.png', '/images/pizaa_2.png', '/images/pizaa_3.png'], icon: FaFileAlt },
    { name: 'Images', image: '/images/folder-images.png', images: ['/images/pizaa_2.png', '/images/pizaa_3.png', '/images/pizaa_4.png'], icon: FaImage },
    { name: 'Projects', image: '/images/folder-projects.png', images: ['/images/pizaa_4.png', '/images/pizaa.png'], icon: FaFolder },
    { name: 'Notes', image: '/images/folder-notes.png', images: ['/images/pizaa_3.png', '/images/pizaa_2.png'], icon: FaLightbulb },
  ];

  const [selectedFolder, setSelectedFolder] = useState(folders[0]); // Default to first folder

  const handleFolderClick = (folder) => {
    setSelectedFolder(folder); // Set selected folder to display its images
  };

  return (
    <div className="container mx-auto py-8 p-4">
      {/* Folder Grid */}
      <div className="grid grid-cols-2 justify-center sm:grid-cols-3 lg:grid-cols-4 gap-8">
        {folders.map((folder, index) => (
          <FolderItem
            key={index}
            folderName={folder.name}
            folderImage={folder.image}
            folderIcon={folder.icon} // Pass the appropriate icon
            onClick={() => handleFolderClick(folder)} // Show images when folder is clicked
          />
        ))}
      </div>

      {/* Display Images for Selected Folder */}
      {selectedFolder && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">{selectedFolder.name} Images</h2>
          <div className="grid  sm:grid-cols-4 lg:grid-cols-6 gap-6">
            {selectedFolder.images.map((img, index) => (
              <div key={index} className="w-full h-56 bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={img}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderGrid;
