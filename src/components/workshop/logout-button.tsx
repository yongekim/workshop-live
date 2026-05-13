"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const router = useRouter()

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    })

    router.push("/")
    router.refresh()
  }

  return (
    <Button variant="secondary" className="rounded-full" onClick={logout}>
      <LogOut className="mr-2 h-4 w-4" />
      Logga ut
    </Button>
  )
}