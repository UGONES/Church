import React, { useState, useEffect } from 'react';

const Loader = ({ 
  type = "spinner", 
  size = "medium", 
  color = "#FF7E45", 
  text = "Loading...",
  fullScreen = false,
  timeout = 5000,
  onTimeout, // Callback function when timeout occurs
  timeoutMessage = "Taking longer than expected...", // Message to show after timeout
  showTimeoutMessage = true // Whether to show timeout message
}) => {
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const sizeClasses = {
    small: "w-6 h-6",
    medium: "w-12 h-12",
    large: "w-16 h-16",
    xlarge: "w-24 h-24"
  };

  const spinnerStyles = {
    borderColor: `${color} transparent transparent transparent`
  };

  // Handle timeout
  useEffect(() => {
    if (timeout > 0) {
      const timer = setTimeout(() => {
        setHasTimedOut(true);
        if (onTimeout) {
          onTimeout();
        }
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [timeout, onTimeout]);

  const renderSpinner = () => {
    switch (type) {
      case "dots":
        return (
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-full animate-bounce"
                style={{
                  backgroundColor: color,
                  width: size === "small" ? "8px" : 
                         size === "medium" ? "12px" : 
                         size === "large" ? "16px" : "20px",
                  height: size === "small" ? "8px" : 
                          size === "medium" ? "12px" : 
                          size === "large" ? "16px" : "20px",
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        );

      case "ring":
        return (
          <div className={`${sizeClasses[size]} border-4 rounded-full animate-spin`} style={spinnerStyles}></div>
        );

      case "pulse":
        return (
          <div 
            className="rounded-full animate-pulse"
            style={{
              backgroundColor: color,
              width: size === "small" ? "1.5rem" : 
                     size === "medium" ? "2rem" : 
                     size === "large" ? "3rem" : "4rem",
              height: size === "small" ? "1.5rem" : 
                      size === "medium" ? "2rem" : 
                      size === "large" ? "3rem" : "4rem"
            }}
          ></div>
        );

      case "progress":
        return (
          <div className="w-32 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-2 rounded-full animate-progress"
              style={{
                backgroundColor: color,
                width: '0%',
                animation: 'progress 1.5s ease-in-out infinite'
              }}
            ></div>
          </div>
        );

      case "church":
        return (
          <div className="animate-bounce">
            <i 
              className="fas fa-church"
              style={{
                color: color,
                fontSize: size === "small" ? "1.5rem" : 
                         size === "medium" ? "2rem" : 
                         size === "large" ? "3rem" : "4rem"
              }}
            ></i>
          </div>
        );

      case "spinner":
      default:
        return (
          <div className={`${sizeClasses[size]} border-4 rounded-full animate-spin`} style={spinnerStyles}></div>
        );
    }
  };

  const loaderContent = (
    <div className="flex flex-col items-center justify-center space-y-4">
      {renderSpinner()}
      
      {/* Show timeout message if timed out, otherwise show normal text */}
      {hasTimedOut && showTimeoutMessage ? (
        <div className="text-center">
          <p 
            className="font-medium text-orange-600 mb-2"
            style={{ color: '#e67e22' }}
          >
            ⏰ {timeoutMessage}
          </p>
          {text && (
            <p 
              className="text-sm opacity-75"
              style={{ color: color }}
            >
              {text}
            </p>
          )}
        </div>
      ) : (
        text && (
          <p 
            className="text-center font-medium"
            style={{ color: color }}
          >
            {text}
          </p>
        )
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
};

// Page Loader Component with Timeout
export const PageLoader = ({ 
  timeout = 3000, // 10 seconds default timeout
  onTimeout,
  customMessage 
}) => {
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (timeout > 0) {
      const timer = setTimeout(() => {
        setHasTimedOut(true);
        if (onTimeout) {
          onTimeout();
        }
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [timeout, onTimeout]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#FF7E45] to-[#F4B942] flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
        
        {hasTimedOut ? (
          <>
            <h2 className="text-xl font-semibold text-white mb-2">Still Working...</h2>
            <p className="text-white/80">
              {customMessage || "This is taking longer than expected. Please check your connection."}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-white text-[#FF7E45] rounded-lg hover:bg-gray-100 transition-colors"
            >
              Refresh Page
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-white">St Michael's Church</h2>
            <p className="text-white/80 mt-2">Loading your spiritual journey...</p>
          </>
        )}
      </div>
    </div>
  );
};

// Content Loader Component (Skeleton) with Timeout
export const ContentLoader = ({ 
  type = "card", 
  count = 1,
  timeout = 2000,
  onTimeout 
}) => {
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (timeout > 0) {
      const timer = setTimeout(() => {
        setHasTimedOut(true);
        if (onTimeout) {
          onTimeout();
        }
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [timeout, onTimeout]);

  const renderSkeleton = () => {
    if (hasTimedOut) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <i className="fas fa-exclamation-triangle text-2xl"></i>
          </div>
          <p className="text-gray-600 text-sm">Content is taking longer to load</p>
        </div>
      );
    }

    switch (type) {
      case "card":
        return (
          <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-48 bg-gray-200 rounded-md mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        );
      
      case "text":
        return (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        );
      
      case "list":
        return (
          <div className="space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <React.Fragment key={index}>
          {renderSkeleton()}
        </React.Fragment>
      ))}
    </>
  );
};

// CSS for animations (add this to your global CSS)
export const loaderStyles = `
  @keyframes progress {
    0% { width: 0%; }
    50% { width: 70%; }
    100% { width: 100%; }
  }
  
  .animate-progress {
    animation: progress 1.5s ease-in-out infinite;
  }
`;

export default Loader;