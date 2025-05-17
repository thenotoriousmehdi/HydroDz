import { useState } from "react";
import React from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../utils/axiosConfig";
// Import your assets
// Note: In React, you'd typically import images like this:
import logo from "../assets/logohydrodz.png";
import barage from "../assets/dam-2.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await api.post("/auth", {
        email,
        password,
      });

      const { accessToken, user } = response.data;

      if (accessToken) {
        localStorage.setItem("authToken", accessToken);
        localStorage.setItem("userRole", user.role);
        navigate("/");
      } else {
        setError("No token received from server. Please try again.");
      }
    } catch (error) {
      console.error("Error during login:", error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const errorMessage =
            error.response.data.error || "Invalid credentials or something went wrong. Please try again.";

          console.log("Axios error response:", error.response);
          setError(errorMessage);
        } else if (error.request) {
          setError("No response received from the server. Please try again.");
        } else {
          setError("An error occurred during the request. Please try again.");
        }
      } else {
        setError("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Left column - Login form */}
      <div className="w-full xl:w-1/2 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center animate-fade-in">
            <img src={logo} alt="HydroDZ Logo" className="h-16 w-auto mb-6" />
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="space-y-1 mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Welcome back{" "}
                  <span className="animate-wave" role="img" aria-label="wave">
                    👋
                  </span>
                </h2>
                <p className="text-sm text-gray-600">Sign in to your account to continue</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center gap-2 animate-slide-down"
                    role="alert"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={handleEmailChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                  
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={passwordVisible ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={handlePasswordChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent pr-10 transition-all duration-200"
                    />
                    <button
                      type="button"
                      className="absolute right-0 top-0 h-full px-3 py-2 text-gray-500 hover:text-gray-700"
                      onClick={togglePasswordVisibility}
                    >
                      {passwordVisible ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                          <line x1="2" x2="22" y1="2" y2="22" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                      <span className="sr-only">{passwordVisible ? "Hide password" : "Show password"}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-700 hover:bg-cyan-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-600 transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign in"}
                  </button>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-center">
              <p className="text-sm text-gray-600">
                HydroDZ 2025. All rights reserved. &nbsp; 
             
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right column - Image */}
      <div className="hidden xl:flex xl:w-1/2 bg-cyan-700 items-center justify-center p-10">
        <div className="relative w-full max-w-2xl aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-cyan-800/50 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cyan-900/70 z-10"></div>
          <img
            src={barage}
            alt="Dam"
            className="absolute bottom-0 w-full h-auto z-20 object-contain"
          />
          <div className="absolute inset-0 z-30 flex flex-col justify-end p-8 text-white">
            <h2 className="text-3xl font-bold mb-2">HydroDZ Management</h2>
            <p className="text-lg opacity-90 max-w-md">Secure access to your water resource management dashboard</p>
          </div>
        </div>
      </div>

      {/* CSS for animations and custom colors */}
      <style>
        {`
          /* Animations */
          .animate-wave {
            animation: wave 2.5s infinite;
            transform-origin: 70% 70%;
            display: inline-block;
          }
          
          .animate-fade-in {
            animation: fadeIn 0.8s ease-in-out;
          }
          
          .animate-slide-down {
            animation: slideDown 0.3s ease-out;
          }
          
          @keyframes wave {
            0% { transform: rotate(0deg); }
            10% { transform: rotate(14deg); }
            20% { transform: rotate(-8deg); }
            30% { transform: rotate(14deg); }
            40% { transform: rotate(-4deg); }
            50% { transform: rotate(10deg); }
            60% { transform: rotate(0deg); }
            100% { transform: rotate(0deg); }
          }
          
          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          
          @keyframes slideDown {
            0% { opacity: 0; transform: translateY(-10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}