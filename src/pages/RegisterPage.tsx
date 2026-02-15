import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Alert, AlertDescription } from "@/components/ui/alert"; // Если есть компонент Alert
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom"; // Добавили useParams

export default function RegisterPage() {
  const { token } = useParams<{ token: string }>(); // 1. Берем токен из URL
  const [name, setName] = useState("");
  const [error, setError] = useState(""); // Стейт для ошибок
  const [isLoading, setIsLoading] = useState(false); // Стейт загрузки

  const { register } = useAuth(); // register должен быть обновлен в Context!
  const navigate = useNavigate();

  // Проверяем, есть ли вообще токен при загрузке
  useEffect(() => {
    if (!token) {
      setError("Ошибка: Ссылка приглашения недействительна (нет токена).");
    }
  }, [token]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!token) {
      setError("Токен отсутствует.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // 2. Отправляем и токен, и имя
      // В AuthContext функция register должна принимать (token, name)
      await register(token, name);

      navigate("/dashboard");
    } catch (err: any) {
      // Если бэккенд вернул ошибку (например, "Token already used")
      setError(err.response?.data?.message || "Ошибка регистрации. Токен невалиден или уже использован.");
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
            Введите имя для активации доступа.
            <br />
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

            <div className="space-y-2">
              <Label htmlFor="name">Ваше Имя</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Иван Иванов"
                disabled={isLoading || !!error} // Блокируем если грузится или ошибка токена
              />
            </div>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !name.trim() || !!error}
            >
              {isLoading ? "Активация..." : "Зарегистрироваться"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}