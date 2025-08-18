import React from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-transparent bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md mx-auto">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
          <div className="mt-2 px-7 py-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {children}
            </p>
          </div>
          <div className="flex justify-center mt-4 space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
