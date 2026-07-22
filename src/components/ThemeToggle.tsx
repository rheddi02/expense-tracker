import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Switch } from "./ui/switch"

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="h-6 w-11" />

  const isDark = theme === "dark"

  return (
    <div className="flex items-center gap-3">
      <Sun size={16} className={isDark ? "text-muted-foreground" : "text-foreground"} />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Toggle dark mode"
      />
      <Moon size={16} className={isDark ? "text-foreground" : "text-muted-foreground"} />
    </div>
  )
}
