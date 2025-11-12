import React, { useState, useCallback, useEffect } from "react";
import { Copy, Download, KeyRound, RefreshCw } from "lucide-react";
import Swal from "sweetalert2";
import { useApi } from '../ApiContext';

export default function CallBack() {
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState('');
  const API_URL = useApi();

  // const handleGenerateToken = () => {
  //   setLoading(true);
  //   setTimeout(() => {
  //     setAccessToken("NEW-" + Math.random().toString(36).substr(2, 10));
  //     setLoading(false);
  //   }, 1200);
  // };

  const fetchToken = useCallback(async () => {
    try {
      const branchData = JSON.parse(localStorage.getItem("branch")) || {};
      const branchEmail = branchData?.email;
      const branchId = branchData?.branch_id;
      const customerId = branchData?.customer_id;
      const token = localStorage.getItem("branch_token");

      // 🧩 Check login/session validity
      if (!branchId || !token) {
        window.location.href = `/customer-login?email=${encodeURIComponent(branchEmail || "")}`;
        return;
      }

      // 🧾 Prepare request payload
      const payLoad = {
        branch_id: branchId,
        _token: token,
        customer_id: customerId,
        ...(branchData?.type === "sub_user" && { sub_user_id: branchData.id }),
        ...(branchData?.type === "additional_user" && { additional_customer_id: branchData.customer_id }),
      };

      const queryString = new URLSearchParams(payLoad).toString();

      // 📨 Fetch token
      const response = await fetch(`${API_URL}/branch/access-token?${queryString}`, {
        method: "GET",
        redirect: "follow",
      });

      const result = await response.json();

      // 🪙 Update token if new one received
      const newToken = result?._token || result?.token;
      if (newToken) {
        localStorage.setItem("branch_token", newToken);
      }

      // ⏰ Handle expired or invalid token
      if (
        result?.message?.toLowerCase().includes("invalid") &&
        result?.message?.toLowerCase().includes("token")
      ) {
        Swal.fire({
          title: "Session Expired",
          text: "Your session has expired. Please log in again.",
          icon: "warning",
          confirmButtonText: "OK",
        }).then(() => {
          window.location.href = `/customer-login?email=${encodeURIComponent(branchEmail || "")}`;
        });
        return;
      }

      // ❌ Handle failed responses
      if (!response.ok) {
        const errorMessage = result?.message || "Something went wrong. Please try again later.";
        setErrors(errorMessage);
        return;
      }

      // ✅ Set access token if successful
      if (result?.access_token) {
        setAccessToken(result.access_token);
        setErrors(null); // clear any previous errors
      } else {
        setErrors("Token not found. Please generate it.");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      Swal.fire({
        title: "Error",
        text: "An unexpected error occurred while fetching the token.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  }, [API_URL]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken])


  const handleCopyToken = () => {
    navigator.clipboard.writeText(accessToken);
    alert("Access token copied to clipboard!");
  };

  const handleGenerateToken = () => {
    const branchData = localStorage.getItem("branch");

    // 🧩 Check if branch data exists
    if (!branchData) {
      Swal.fire({
        title: "Error",
        text: "Branch data is missing. Please log in again.",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    // 🧾 Parse branch data safely
    let parsedBranchData;
    try {
      parsedBranchData = JSON.parse(branchData);
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: "We couldn't read your session data. Please log in again.",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    const branch_id = parsedBranchData?.branch_id;
    const branch_token = localStorage.getItem("branch_token");
    const customerId = parsedBranchData?.customer_id;

    // 🧠 Validate required values
    if (!branch_id || !branch_token) {
      Swal.fire({
        title: "Error",
        text: "Branch ID or token is missing. Please log in again.",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    // 🧾 Build request payload
    const payLoad = {
      branch_id,
      _token: branch_token,
      customer_id: customerId,
      ...(parsedBranchData?.type === "sub_user" && { sub_user_id: parsedBranchData.id }),
      ...(parsedBranchData?.type === "additional_user" && { additional_customer_id: parsedBranchData.customer_id }),
    };

    const queryString = new URLSearchParams(payLoad).toString();

    // 📨 Prepare request
    const requestOptions = {
      method: "GET",
      redirect: "follow",
    };

    // 💬 Show loading alert
    Swal.fire({
      title: "Generating Token...",
      text: "Please wait while we create your new access token.",
      icon: "info",
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    // 🔥 API Call
    fetch(`https://api.goldquestglobal.in/branch/access-token/generate?${queryString}`, requestOptions)
      .then(async (response) => {
        const result = await response.json();

        if (!response.ok) {
          const errorMessage = result.message || "An unexpected error occurred.";

          // 🕒 Handle expired token
          if (
            errorMessage.toLowerCase().includes("invalid") &&
            errorMessage.toLowerCase().includes("token")
          ) {
            Swal.fire({
              title: "Session Expired",
              text: "Your session has expired. Please log in again to continue.",
              icon: "warning",
              confirmButtonText: "OK",
            }).then(() => {
              window.location.href = `/customer-login?email=${encodeURIComponent(parsedBranchData?.email)}`;
            });
          } else {
            Swal.fire({
              title: "Error",
              text: errorMessage,
              icon: "error",
              confirmButtonText: "OK",
            });
          }
          throw new Error(errorMessage);
        }

        // ✅ Success response
        Swal.close();

        const newToken = result._token || result.token;
        if (newToken) {
          localStorage.setItem("branch_token", newToken);
        }

        Swal.fire({
          title: "Success",
          text: result.message || "A new access token has been generated successfully.",
          icon: "success",
          confirmButtonText: "OK",
        });
        fetchToken();
        setAccessToken(result?.access_token);
        setErrors('')
      })
      .catch((error) => {
        console.error("Error caught in fetch:", error);
        Swal.close();

        Swal.fire({
          title: "Error",
          text: "An error occurred while generating your token. Please try again later.",
          icon: "error",
          confirmButtonText: "OK",
        });
      });
  };



  const handleDownloadCollection = () => {
    const link = document.createElement("a");
    link.href = "/API.postman_collection.json";
    link.download = "Postman_Collection.json";
    link.click();
  };

  return (
    <div className="min-h-screen flex flex-col  items-center bg-gray-50 p-6">
      <div className="bg-white shadow-md rounded-2xl w-full md:w-9/12 p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          API Token Management
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="border rounded-2xl p-4 flex flex-col items-center justify-center text-wrap bg-gray-50 hover:bg-gray-100 transition">
            <KeyRound className="text-blue-500 mb-2" size={32} />
            <h3 className="font-semibold mb-1">Access Token</h3>
            <p className={`whitespace-normal pb-2 text-center ${errors ? "text-red-500" : "text-gray-600"}`}>
              {errors ? (
                <>
                  <span>Token not found.</span>
                  <span className="block mt-1">Please generate it.</span>
                </>
              ) : (
                <span className="break-all">{accessToken}</span>
              )}
            </p>


            {accessToken && (
              <button
                onClick={handleCopyToken}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
              >
                <Copy size={14} /> Copy
              </button>

            )}
          </div>


          <div className="border rounded-2xl p-4 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition">
            <RefreshCw className="text-green-500 mb-2" size={32} />
            <h3 className="font-semibold mb-2">Generate New Token</h3>
            <button
              onClick={handleGenerateToken}
              disabled={loading}
              className={`px-4 py-2 text-sm rounded-full text-white transition ${loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
                }`}
            >
              {loading ? "Generating..." : "Generate New Token"}
            </button>
          </div>

          {/* Download Postman Box */}
          <div className="border rounded-2xl p-4 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition">
            <Download className="text-purple-500 mb-2" size={32} />
            <h3 className="font-semibold mb-2 text-center">
              Download Postman Collection
            </h3>
            <button
              onClick={handleDownloadCollection}
              className="px-4 py-2 text-sm rounded-full text-white bg-purple-500 hover:bg-purple-600 transition"
            >
              Download
            </button>
          </div>
        </div>

        {/* Warning Message */}
        <p className="text-center text-sm text-red-500 mt-6">
          ⚠️ Generating a new token will revoke your previous token.
        </p>
      </div>
    </div>
  );
}
