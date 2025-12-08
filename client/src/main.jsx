import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { AlertProvider } from "./utils/Alert";
import { AuthProvider } from "./hooks/useAuth";
import { SocialAuthProvider } from "./contexts/SocialAuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AlertProvider>
        <AuthProvider>
          <SocialAuthProvider>
            <App />
          </SocialAuthProvider>
        </AuthProvider>
      </AlertProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
