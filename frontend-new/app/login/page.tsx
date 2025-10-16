"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Code2, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authAPI } from "@/services/api"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Call real API
      const response = await authAPI.login({ email, password })
      
      // Get user profile to determine role
      const profileResponse = await authAPI.getProfile()
      const user = profileResponse.data
      
      console.log('User profile:', user) // Debug log
      
      // Redirect based on role
      // Backend returns role as a string, not an object
      if (user.role === 'teacher') {
        router.push("/teacher/dashboard")
      } else {
        router.push("/student/dashboard")
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.response?.data?.message || err.response?.data?.msg || 'Invalid credentials')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary border-r-4 border-border relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-center px-16 w-full">
          <div className="mb-8 flex items-center gap-4">
            <div className="h-20 w-20 bg-background border-4 border-border flex items-center justify-center">
              <Code2 className="h-12 w-12 text-foreground" />
            </div>
            <h1 className="text-5xl font-black uppercase text-primary-foreground">CodeGrader</h1>
          </div>

          <h2 className="text-4xl font-black uppercase text-primary-foreground mb-6">
            Master Programming Through Practice
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 bg-accent border-4 border-border flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-accent-foreground" />
              </div>
              <p className="text-lg font-bold text-primary-foreground">INSTANT FEEDBACK ON YOUR CODE SUBMISSIONS</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 bg-accent border-4 border-border flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-accent-foreground" />
              </div>
              <p className="text-lg font-bold text-primary-foreground">AUTOMATED GRADING WITH DETAILED TEST CASES</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 bg-accent border-4 border-border flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-accent-foreground" />
              </div>
              <p className="text-lg font-bold text-primary-foreground">TRACK YOUR PROGRESS AND IMPROVE SKILLS</p>
            </div>
          </div>
        </div>

        {/* Decorative shapes */}
        <div className="absolute top-10 right-10 w-32 h-32 border-4 border-border bg-accent rotate-12" />
        <div className="absolute bottom-20 right-20 w-40 h-40 border-4 border-border bg-secondary rounded-full" />
        <div className="absolute top-1/2 left-10 w-24 h-24 border-4 border-border bg-muted" />
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-background p-4 md:p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-3">
            <CardTitle className="text-2xl md:text-4xl font-black uppercase">Sign In</CardTitle>
            <CardDescription className="font-bold text-sm md:text-base">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4 md:space-y-6">
              {error && (
                <div className="p-3 border-4 border-red-500 bg-red-100 text-red-700 font-bold text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-3">
                <Label htmlFor="email" className="font-bold uppercase text-sm">
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
              <div className="space-y-3">
                <Label htmlFor="password" className="font-bold uppercase text-sm">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full gap-2 text-sm md:text-base" disabled={isLoading}>
                {isLoading ? "SIGNING IN..." : "SIGN IN"}
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <p className="text-xs md:text-sm text-center font-bold">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary hover:underline underline-offset-4 font-black">
                  REGISTER HERE
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
