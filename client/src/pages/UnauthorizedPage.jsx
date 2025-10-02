// pages/UnauthorizedPage.jsx
import { Link, useLocation } from "react-router-dom";

const UnauthorizedPage = () => {
  const location = useLocation();
  const state = location.state || {};

  return (
    <div className="page">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <i className="fas fa-exclamation-triangle text-red-500 text-2xl" />
            </div>

            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-4">
              {state.message ||
                "You don't have permission to access this page."}
            </p>

            {state.required && (
              <p className="text-sm text-gray-500 mb-4">
                Required: {state.required}
                {state.current && ` | Your role: ${state.current}`}
              </p>
            )}

            <div className="space-y-3">
              <Link
                to="/"
                className="block w-full bg-[#FF7E45] text-white py-2 px-4 rounded hover:bg-[#FFA76A] transition-colors"
              >
                Go to Homepage
              </Link>

              {state.from && (
                <Link
                  to={state.from}
                  className="block w-full border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50 transition-colors"
                >
                  Go Back
                </Link>
              )}

              <Link
                to="/login"
                className="block w-full text-[#FF7E45] hover:text-[#FFA76A] py-2"
              >
                Login with different account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
