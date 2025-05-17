import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import React from "react";
import api from "../utils/axiosConfig";
import logo from "../assets/logohydrodz.png";
import barage from "../assets/barage.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
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
            error.response.data.error ||
            "Invalid credentials or something went wrong. Please try again.";

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
    }
  };

  return (
    <div className="flex h-screen  bg-no-repeat bg-cover justify-center">
      <div
        className="w-full xl:w-[48%] xl:m-0 m-8 flex flex-col justify-center bg-white px-[25px] sm:px-[50px] md:px-[107px] gap-[60px] xl:overflow-hidden xl:h-full z-20"
      >
        <img src={logo} alt="logo" className="w-48 h-auto" />
        <div className="flex flex-col items-start justify-start">
          <h1 className="font-poppins font-semibold mb-4 text-[24px] text-gray-900">
            Welcome! <span className="wave-emoji">👋</span>
          </h1>
          <p className="font-openSans font-regular text-[16px] text-gray-900 text-opacity-80 text-start">
            Log in to your account by filling in the login form with your
            personal information.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-[25px]">
            {error && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <div>
              <label>
                <input
                  className="sm:p-[20px] p-[15px] w-full rounded-[8px] text-[16px] font-openSans font-regular border border-BorderWithoutAction focus:border-blue-700 focus:outline-none"
                  type="email"
                  placeholder="Email"
                  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                  value={email}
                  onChange={handleEmailChange}
                />
              </label>
            </div>

            <div>
              <div className="flex sm:p-[20px] p-[15px] w-full text-[16px] rounded-[8px] font-openSans font-regular border border-BorderWithoutAction focus-within:border-blue-700 justify-between">
                <input
                  className="bg-transparent border-transparent"
                  type={passwordVisible ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  minLength={8}
                  maxLength={20}
                  onChange={handlePasswordChange}
                  placeholder="Password"
                />
                <div className="mr-[8px] z-10">
                  <span onClick={togglePasswordVisibility}>
                    <FontAwesomeIcon
                      icon={passwordVisible ? faEyeSlash : faEye}
                    />
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full hover:bg-blue-500/80 bg-blue-600 p-[12px] sm:p-[16px] text-white rounded-[15px] font-poppins text-[20px] font-medium"
            >
              SignIn
            </button>
          </div>
        </form>
      </div>

      <div className="hidden xl:block xl:w-[52%] xl:relative p-10 ">
        <div className="absolute inset-[40px] bg-blue-500 bg-opacity-50 z-10 rounded-2xl">
          <img
            src={barage}
            alt="Dam Icon"
            className="absolute bottom-0 w-full h-auto z-20 object-contain rounded-2xl"
          />
        </div>
      </div>
    </div>
  );
}
