import { Link } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/components/theme-provider"
import { useLanguage } from "@/context/LanguageContext"
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
import { Moon, Sun, User as UserIcon, Languages } from "lucide-react"

export function Navbar() {
  const { user } = useAuth()
  const { setTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold sm:inline-block text-lg">{t('appName')}</span>
          </Link>
          {user && (
            <div className="hidden md:flex items-center gap-4 text-sm font-medium">
              <Link to="/dashboard" className="transition-colors hover:text-foreground/80 text-foreground/60">
                {t('dashboard')}
              </Link>
              <Link to="/create-quiz" className="transition-colors hover:text-foreground/80 text-foreground/60">
                {t('createQuiz')}
              </Link>
              <Link to="/favorites" className="transition-colors hover:text-foreground/80 text-foreground/60">
                {t('favorites')}
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Переключатель языка */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 px-2">
                <Languages className="h-4 w-4" />
                <span className="uppercase text-xs font-bold">{language}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage('ru')} className={language === 'ru' ? 'bg-muted' : ''}>
                Русский
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('kk')} className={language === 'kk' ? 'bg-muted' : ''}>
                Қазақша
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('en')} className={language === 'en' ? 'bg-muted' : ''}>
                English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">{t('changeTheme')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('account')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <UserIcon className="mr-2 h-4 w-4" />
                  {user.username}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/register"><Button>{t('register')}</Button></Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}