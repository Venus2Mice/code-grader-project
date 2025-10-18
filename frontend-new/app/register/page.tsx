"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authAPI } from "@/services/api"

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"student" | "teacher">("student")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Call real API
      await authAPI.register({
        full_name: fullName,
        email,
        password,
        role
      })
      
      // After successful registration, login automatically
      await authAPI.login({ email, password })
      const profileResponse = await authAPI.getProfile()
      
      // Redirect based on role
      if (role === "teacher") {
        router.push("/teacher/dashboard")
      } else {
        router.push("/student/dashboard")
      }
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.response?.data?.message || err.response?.data?.msg || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Registration Form */}
      <div className="flex-1 flex items-center justify-center bg-background p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 bg-primary border-4 border-border flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-4xl font-black uppercase">Join Us</CardTitle>
            </div>
            <CardDescription className="text-base font-bold">Create your account and start coding</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-5">
              {error && (
                <div className="p-3 border-4 border-red-500 bg-red-100 text-red-700 font-bold text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="font-black uppercase text-sm">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-black uppercase text-sm">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="font-black uppercase text-sm">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-3">
                <Label className="font-black uppercase text-sm">Account Type</Label>
                <RadioGroup value={role} onValueChange={(value) => setRole(value as "student" | "teacher")}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-3 border-4 border-border p-5 bg-card hover:bg-primary/5 transition-colors cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none data-[state=checked]:bg-primary/10 data-[state=checked]:border-primary">
                      <RadioGroupItem value="student" id="student" />
                      <Label htmlFor="student" className="font-bold cursor-pointer uppercase text-xs md:text-sm flex-1">
                        Student - Learn & Practice
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 border-4 border-border p-5 bg-card hover:bg-primary/5 transition-colors cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none data-[state=checked]:bg-primary/10 data-[state=checked]:border-primary">
                      <RadioGroupItem value="teacher" id="teacher" />
                      <Label htmlFor="teacher" className="font-bold cursor-pointer uppercase text-xs md:text-sm flex-1">
                        Teacher - Create & Manage
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 mt-6">
              <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                {isLoading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
                <ArrowRight className="h-5 w-5" />
              </Button>
              <p className="text-sm text-center font-bold">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline underline-offset-4 font-black">
                  SIGN IN HERE
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Right Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-accent border-l-4 border-border relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-center px-16 w-full">
          <h2 className="text-5xl font-black uppercase text-accent-foreground mb-8">Start Your Coding Journey Today</h2>

          <div className="space-y-6">
            <div className="border-4 border-border bg-background p-6">
              <h3 className="text-2xl font-black uppercase mb-3 text-foreground">For Students</h3>
              <p className="font-bold text-muted-foreground">
                Submit code, get instant feedback, and track your progress through assignments
              </p>
            </div>

            <div className="border-4 border-border bg-background p-6">
              <h3 className="text-2xl font-black uppercase mb-3 text-foreground">For Teachers</h3>
              <p className="font-bold text-muted-foreground">
                Create classes, design problems with test cases, and manage student submissions
              </p>
            </div>
          </div>
        </div>

        {/* Decorative shapes */}
        <div className="absolute top-20 left-10 w-28 h-28 border-4 border-border bg-primary rotate-45" />
        <div className="absolute bottom-10 right-10 w-36 h-36 border-4 border-border bg-secondary" />
        <div className="absolute top-1/2 right-20 w-20 h-20 border-4 border-border bg-muted rounded-full" />
      </div>
    </div>
  )
}
