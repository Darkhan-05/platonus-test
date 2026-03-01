import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function RegisterPage() {
  const { token: urlToken } = useParams();
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (urlToken && urlToken !== "default-token" && urlToken !== "34bdca435-69cf-46e3-8d72-f307fc69c25f") { // Check if it's a real token or the placeholders
      setToken(urlToken);
    } else if (urlToken === "34bdca435-69cf-46e3-8d72-f307fc69c25f") {
      setToken(urlToken);
    }
    // Note: Darkhan12@ for admin is likely direct input
  }, [urlToken]);

  const hasUrlToken = !!urlToken && urlToken !== "default-token";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Базовая валидация на пустые поля
    if (!name.trim() || !token.trim()) {
      setError("Пожалуйста, заполните все поля.");
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
      setError(err.response?.data?.message || "Ошибка регистрации. Проверьте правильность токена.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {hasUrlToken ? "Активация доступа" : "Вход по приглашению"}
          </CardTitle>
          <CardDescription>
            {hasUrlToken
              ? "Введите ваше имя для активации доступа по приглашению."
              : "Вставьте код приглашения, который вы получили, и введите ваше имя."}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">

            {/* Блок ошибки */}
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            {/* Поле для ввода токена - скрываем, если он есть в URL */}
            {!hasUrlToken && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <Label htmlFor="token">Код приглашения (Токен)</Label>
                <Input
                  id="token"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Вставьте код из WhatsApp"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Поле для ввода имени */}
            <div className="space-y-2">
              <Label htmlFor="name">Ваше Имя</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Иван Иванов"
                disabled={isLoading}
              />
            </div>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              // Кнопка недоступна, если идет загрузка или одно из полей пустое
              disabled={isLoading || !name.trim() || !token.trim()}
            >
              {isLoading ? "Активация..." : "Зарегистрироваться"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
