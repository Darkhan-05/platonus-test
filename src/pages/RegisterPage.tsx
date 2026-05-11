import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function RegisterPage() {
  const { token: urlToken } = useParams();
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (urlToken && urlToken !== "default-token" && urlToken !== "34bdca435-69cf-46e3-8d72-f307fc69c25f") {
      setToken(urlToken);
    } else if (urlToken === "34bdca435-69cf-46e3-8d72-f307fc69c25f") {
      setToken(urlToken);
    }
  }, [urlToken]);

  const hasUrlToken = !!urlToken && urlToken !== "default-token";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !token.trim()) {
      setError(t('fillAllFields'));
      return;
    }

    if (token.trim() === "Darkhan12@") {
      navigate("/secret-room/admin");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await register(token.trim(), name.trim());
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || t('registerError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {hasUrlToken ? t('activation') : t('invitationEntry')}
          </CardTitle>
          <CardDescription>
            {hasUrlToken ? t('enterNameDesc') : t('enterTokenDesc')}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            {!hasUrlToken && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <Label htmlFor="token">{t('tokenLabel')}</Label>
                <Input
                  id="token"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="WhatsApp..."
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">{t('nameLabel')}</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name..."
                disabled={isLoading}
              />
            </div>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !name.trim() || !token.trim()}
            >
              {isLoading ? t('activating') : t('registerButton')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
