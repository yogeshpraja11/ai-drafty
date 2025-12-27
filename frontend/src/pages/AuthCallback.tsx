import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

const API_BASE = "http://localhost:3000";

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const code = searchParams.get("code");
        if (!code) {
            setError("No authorization code found");
            return;
        }

        const exchangeCode = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/auth/callback`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ code }),
                });

                if (!response.ok) {
                    throw new Error("Failed to authenticate");
                }

                const data = await response.json();
                // Store user/session if needed
                localStorage.setItem("user", JSON.stringify(data.user));

                navigate("/");
            } catch (err) {
                console.error("Auth callback error:", err);
                setError("Authentication failed. Please try again.");
            }
        };

        exchangeCode();
    }, [searchParams, navigate]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
                <p className="text-gray-500">Signing you in...</p>
            </div>
        </div>
    );
};

export default AuthCallback;
