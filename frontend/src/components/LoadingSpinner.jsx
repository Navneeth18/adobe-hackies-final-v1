import React from 'react';

const LoadingSpinner = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-transparent bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 bg-white rounded-lg shadow-xl p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <h3 className="text-2xl font-semibold text-gray-800">Processing...</h3>
          <p className="text-gray-600 mt-2">{message || 'Cooking your document, please wait...'}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
