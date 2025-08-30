import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AlertProvider } from './utils/Alert';
import { SocialAuthProvider } from "./contexts/SocialAuthContext";
  

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AlertProvider>
      <SocialAuthProvider>
      <App />
      </SocialAuthProvider>
    </AlertProvider>
  </React.StrictMode>
);
