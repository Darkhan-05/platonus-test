import { Button } from "@/components/ui/button"; // Не забудьте импортировать кнопку
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    register(name);
    navigate("/dashboard");
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Создание аккаунта</CardTitle>
          <CardDescription>
            После регистрации вход на сайт будет доступен только с одного устройства
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Имя профиля</Label>

              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введите ваше имя"
              />
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full">
              Зарегистрироваться
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}