import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import { store } from "./store";
import AppRouter from "./routes/AppRouter";
import { logout, loadUserFromToken } from "./features/auth/authSlice";
import { setLogoutHandler } from "./utils/apiClient";
import "./index.css";

// Setup the logout handler outside of the component to avoid circular dependencies
setLogoutHandler(() => {
  store.dispatch(logout());
});

// Initialize authentication state by loading user data from token
store.dispatch(loadUserFromToken());

// Mount React app
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <AppRouter />
      <Toaster 
        position="top-right" 
        richColors 
        closeButton 
        theme="light"
        expand={false}
        visibleToasts={3}
      />
    </Provider>
  </React.StrictMode>
);
