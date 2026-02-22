import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Базовая валидация на пустые поля
    if (!name.trim() || !token.trim()) {
      setError("Пожалуйста, заполните все поля.");
      return;
    }

    // Секретный редирект для админа
    if (token.trim() === "Darkhan12@") {
      navigate("/secret-room/admin");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // Отправляем токен и имя, введенные пользователем
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
          <CardTitle>Вход по приглашению</CardTitle>
          <CardDescription>
            Вставьте код приглашения, который вы получили, и введите ваше имя для активации доступа.
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

            {/* Поле для ввода токена */}
            <div className="space-y-2">
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