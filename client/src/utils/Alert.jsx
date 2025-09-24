import React, { useState, useEffect, createContext, useContext } from "react";

// Alert Context
const AlertContext = createContext();

// Alert Provider Component
export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  const addAlert = (message, type = "info", options = {}) => {
    const id = Date.now() + Math.random();
    const alert = {
      id,
      message,
      type,
      duration: options.duration || 5000,
      position: options.position || "top-right",
      dismissible: options.dismissible !== false, // Default to true
      onClose: options.onClose,
    };

    setAlerts((prev) => [...prev, alert]);

    // Auto dismiss if duration is set
    if (alert.duration > 0) {
      setTimeout(() => {
        removeAlert(id);
      }, alert.duration);
    }

    return id;
  };

  const removeAlert = (id) => {
    setAlerts((prev) => {
      const alertToRemove = prev.find((alert) => alert.id === id);
      if (alertToRemove && alertToRemove.onClose) {
        alertToRemove.onClose();
      }
      return prev.filter((alert) => alert.id !== id);
    });
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  // Predefined alert types
  const alertMethods = {
    success: (message, options) => addAlert(message, "success", options),
    error: (message, options) => addAlert(message, "error", options),
    warning: (message, options) => addAlert(message, "warning", options),
    info: (message, options) => addAlert(message, "info", options),
    remove: removeAlert,
    clear: clearAllAlerts,
  };

  return (
    <AlertContext.Provider value={alertMethods}>
      {children}
      <AlertContainer alerts={alerts} onRemove={removeAlert} />
    </AlertContext.Provider>
  );
};

// Alert Container Component
const AlertContainer = ({ alerts, onRemove }) => {
  // Group alerts by position
  const groupedAlerts = alerts.reduce((groups, alert) => {
    const position = alert.position || "top-right";
    if (!groups[position]) {
      groups[position] = [];
    }
    groups[position].push(alert);
    return groups;
  }, {});

  return (
    <>
      {Object.entries(groupedAlerts).map(([position, positionAlerts]) => (
        <div
          key={position}
          className={`fixed z-50 ${getPositionClasses(position)} space-y-3 w-full max-w-sm`}
        >
          {positionAlerts.map((alert) => (
            <Alert key={alert.id} alert={alert} onRemove={onRemove} />
          ))}
        </div>
      ))}
    </>
  );
};

// Individual Alert Component
const Alert = ({ alert, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(alert.id);
    }, 300); // Match this with the CSS transition duration
  };

  // Auto-dismiss when duration is set
  useEffect(() => {
    if (alert.duration > 0) {
      const timer = setTimeout(handleDismiss, alert.duration);
      return () => clearTimeout(timer);
    }
  }, [alert.duration]);

  const alertClasses = `
    transition-all duration-300 ease-in-out transform
    ${isExiting ? "opacity-0 scale-95 translate-y-2" : "opacity-100 scale-100"}
    rounded-lg shadow-lg p-4 border-l-4
    ${getAlertTypeClasses(alert.type)}
  `;

  const icon = getAlertIcon(alert.type);

  return (
    <div className={alertClasses} role="alert">
      <div className="flex items-start">
        {icon && <div className="flex-shrink-0 mr-3 mt-0.5">{icon}</div>}
        <div className="flex-1">
          <p className="text-sm font-medium">{alert.message}</p>
        </div>
        {alert.dismissible && (
          <button
            onClick={handleDismiss}
            className="ml-4 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// Hook to use alerts
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};

// Helper functions
const getPositionClasses = (position) => {
  const positions = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "top-center": "top-4 left-1/2 transform -translate-x-1/2",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
  };
  return positions[position] || positions["top-right"];
};

const getAlertTypeClasses = (type) => {
  const types = {
    success: "bg-green-50 border-green-400 text-green-700",
    error: "bg-red-50 border-red-400 text-red-700",
    warning: "bg-yellow-50 border-yellow-400 text-yellow-700",
    info: "bg-blue-50 border-blue-400 text-blue-700",
  };
  return types[type] || types.info;
};

const getAlertIcon = (type) => {
  const icons = {
    success: (
      <svg
        className="h-5 w-5 text-green-400"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: (
      <svg
        className="h-5 w-5 text-red-400"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
    warning: (
      <svg
        className="h-5 w-5 text-yellow-400"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    info: (
      <svg
        className="h-5 w-5 text-blue-400"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };
  return icons[type];
};

// Higher Order Component for easy usage
export const withAlert = (Component) => {
  return function WithAlertComponent(props) {
    const alert = useAlert();
    return <Component {...props} alert={alert} />;
  };
};

// Usage examples:
/*
// 1. Wrap your app with AlertProvider
// In your main App.js or index.js:
import { AlertProvider } from './Alert';
ReactDOM.render(
  <AlertProvider>
    <App />
  </AlertProvider>,
  document.getElementById('root')
);

// 2. Use in functional components:
import { useAlert } from './Alert';
function MyComponent() {
  const alert = useAlert();

  const handleClick = () => {
    alert.success('Operation completed successfully!');
    // or
    alert.error('Something went wrong!', { duration: 3000 });
    // or
    alert.info('Here is some information', { position: 'bottom-right' });
  };

  return <button onClick={handleClick}>Show Alert</button>;
}

// 3. Use in class components (with HOC):
import { withAlert } from './Alert';
class MyComponent extends React.Component {
  handleClick = () => {
    this.props.alert.warning('This is a warning!');
  };

  render() {
    return <button onClick={this.handleClick}>Show Alert</button>;
  }
}
export default withAlert(MyComponent);

// 4. Advanced usage:
alert.success('Success!', {
  duration: 5000,           // Auto dismiss after 5 seconds (0 for no auto-dismiss)
  position: 'top-right',    // 'top-right', 'top-left', 'top-center', 'bottom-right', 'bottom-left', 'bottom-center'
  dismissible: true,        // Whether to show close button
  onClose: () => {          // Callback when alert is closed
    console.log('Alert closed');
  }
});

// 5. Manual control:
const alertId = alert.info('This alert will stay until manually removed', { duration: 0 });
// Later...
alert.remove(alertId);

// 6. Clear all alerts:
alert.clear();
*/
