import { Link } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Moon, Sun, User as UserIcon } from "lucide-react" // Убрали иконку LogOut

export function Navbar() {
  const { user } = useAuth() // Убрали деструктуризацию logout, так как он не нужен
  const { setTheme } = useTheme()
  // navigate больше не нужен, так как мы не редиректим при выходе

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            {/* Изменили название */}
            <span className="font-bold sm:inline-block text-lg">Platonus test</span>
          </Link>
          {user && (
            <div className="hidden md:flex items-center gap-4 text-sm font-medium">
              {/* Перевели ссылки */}
              <Link to="/dashboard" className="transition-colors hover:text-foreground/80 text-foreground/60">Главная</Link>
              
                  <>
                    <Link to="/create-quiz" className="transition-colors hover:text-foreground/80 text-foreground/60">Создать тест</Link>
                    <Link to="/favorites" className="transition-colors hover:text-foreground/80 text-foreground/60">Избранное</Link>
                  </>
            
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Сменить тему</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Перевели пункты темы */}
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Светлая
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Темная
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                Системная
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Перевели заголовок */}
                <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                    <UserIcon className="mr-2 h-4 w-4" />
                    {user.name}
                </DropdownMenuItem>
                
                {/* УБРАЛИ КНОПКУ LOGOUT ОТСЮДА */}
                
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
                <Link to="/register"><Button>Регистрация</Button></Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}