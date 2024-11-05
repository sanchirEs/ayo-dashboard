"use client";
import { SessionProvider } from "next-auth/react";
import { useTheme } from "next-themes";
import React, { ReactNode } from "react";
import { ToastContainer } from "react-toastify";

const ToastProvider = () => {
  const { theme } = useTheme();
  return (
    <ToastContainer
      position="top-right"
      autoClose={10000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick={false}
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={theme}
      //   theme="dark"
    />
  );
};

export default ToastProvider;
