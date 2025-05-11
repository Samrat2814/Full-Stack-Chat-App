import React, { useEffect } from "react";
import Navbar from "./Components/Navbar";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./Pages/HomePage"
import SignUpPage from "./Pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./Pages/SettingsPage";
import ProfilePage from "./Pages/ProfilePage";
import { useAuthStore } from "./store/useAuthStore";
import Loading from "./Components/Loading";
import { Toaster } from "react-hot-toast";
const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // console.log(authUser);
  // auth user
  if (isCheckingAuth && !authUser) return <Loading />;
  return (
    <div>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to="/login" />}
        />
        <Route path="/signup" element={!authUser?<SignUpPage />:<Navigate to="/"/>} />
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" />}
        />
        <Route path="/settings" element={<SettingsPage />} />
        <Route
          path="/profile"
          element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
        />
      </Routes>
      <Toaster />
    </div>
  );
};

export default App;
