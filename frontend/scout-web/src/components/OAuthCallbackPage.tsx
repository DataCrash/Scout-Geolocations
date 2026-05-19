import { authLoginResponseSchema } from "@/lib/schemas/authApiSchemas";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function resolveOAuthErrorMessage(
  errorCode: string,
  errorDescription: string | null,
): string {
  if (errorCode === "oauth_domain_not_allowed") {
    return "Esta conta nao pertence aos Escoteiros. Use uma conta @escoteiros.org.br para entrar.";
  }

  if (
    errorCode === "oauth_invalid_code" ||
    errorCode === "oauth_missing_code"
  ) {
    return "Nao foi possivel concluir o login com Google. Tente novamente.";
  }

  if (errorDescription?.trim()) {
    return errorDescription;
  }

  return `Falha no login: ${errorCode}`;
}

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
        const errorDescription = searchParams.get("errorDescription");

        if (error) {
          const friendlyMessage = resolveOAuthErrorMessage(
            error,
            errorDescription,
          );
          setStatus("error");
          setMessage(friendlyMessage);
          setError(friendlyMessage);
          setTimeout(() => navigate("/login"), 3000);
          return;
        }

        const parsed = authLoginResponseSchema.safeParse({
          token,
          userId,
          name,
          role,
        });

        if (!parsed.success) {
          setStatus("error");
          setMessage("Invalid callback parameters");
          setError("Invalid callback parameters");
          setTimeout(() => navigate("/login"), 3000);
          return;
        }

        // Store credentials
        setToken(parsed.data.token);
        setUser({
          id: parsed.data.userId,
          name: parsed.data.name,
          role: parsed.data.role,
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
