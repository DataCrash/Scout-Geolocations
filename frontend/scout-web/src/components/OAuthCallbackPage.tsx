import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, setToken, setError } = useAuthStore();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing",
  );
  const [message, setMessage] = useState("Processing your login...");

  useEffect(() => {
    const processCallback = async () => {
      try {
        const token = searchParams.get("token");
        const userId = searchParams.get("userId");
        const name = searchParams.get("name");
        const role = searchParams.get("role");
        const error = searchParams.get("error");

        if (error) {
          setStatus("error");
          setMessage(`Login failed: ${error}`);
          setError(`Login failed: ${error}`);
          setTimeout(() => navigate("/login"), 3000);
          return;
        }

        if (!token || !userId || !name || !role) {
          setStatus("error");
          setMessage("Invalid callback parameters");
          setError("Invalid callback parameters");
          setTimeout(() => navigate("/login"), 3000);
          return;
        }

        // Store credentials
        setToken(token);
        setUser({
          id: userId,
          name: name,
          role: role as any,
        });

        setStatus("success");
        setMessage("Login successful! Redirecting...");

        // Redirect to dashboard
        setTimeout(() => navigate("/"), 1500);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An error occurred";
        setStatus("error");
        setMessage(message);
        setError(message);
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    processCallback();
  }, [searchParams, navigate, setUser, setToken, setError]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {status === "processing" && (
          <>
            <div className="mb-4">
              <div className="inline-block animate-spin">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
              </div>
            </div>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mb-4 text-4xl">✓</div>
            <p className="text-green-600 font-semibold">{message}</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mb-4 text-4xl">✕</div>
            <p className="text-red-600 font-semibold mb-2">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
}
