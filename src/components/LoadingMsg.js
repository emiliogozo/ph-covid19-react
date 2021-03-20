import React from 'react'
import PropTypes from 'prop-types'

export const LoadingMsg = ({ message }) => {
  return (
    <div className="fixed h-full w-full flex items-center justify-center bg-opacity-50 bg-gray-700">
      <div className="flex bg-teal-600 text-white text-2xl p-3 items-center justify-center rounded-lg shadow-2xl">
        <svg
          className="animate-spin mr-2 h-6 w-6 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        {message}
      </div>
    </div>
  )
}

LoadingMsg.propTypes = {
  message: PropTypes.string,
}

LoadingMsg.defaultProps = {
  message: 'Loading...',
}