"use client"

import { Button } from "@/components/ui/button"
import { Code2, BookOpen, CheckCircle, Zap } from "lucide-react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="relative bg-primary border-b-4 border-border overflow-hidden">
        {/* Decorative geometric shapes */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-secondary border-4 border-border rotate-12 hidden lg:block" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-accent border-4 border-border -rotate-12 hidden lg:block" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 border-4 border-border bg-destructive rotate-45 hidden lg:block" />

        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            <div className="flex justify-center mb-8">
              <div className="h-24 w-24 bg-card border-4 border-border flex items-center justify-center">
                <Code2 className="h-14 w-14 text-foreground" />
              </div>
            </div>
            <h1 className="text-6xl md:text-7xl font-black uppercase tracking-tight text-primary-foreground leading-none">
              Automated Programming Grading
            </h1>
            <p className="text-xl md:text-2xl font-bold text-primary-foreground/90 leading-relaxed">
              CodeGrader helps teachers manage programming courses and provides students with instant feedback.
            </p>
            <div className="flex gap-6 justify-center pt-6">
              <Button asChild size="lg" className="text-base">
                <Link href="/register">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base bg-card">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="border-4 border-border bg-card p-8 space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-accent border-4 border-border flex items-center justify-center">
                <Zap className="h-8 w-8 text-accent-foreground" />
              </div>
            </div>
            <h3 className="text-2xl font-black uppercase text-center">Instant Feedback</h3>
            <p className="text-center font-medium leading-relaxed">
              Students receive immediate results on their code submissions with detailed test case feedback.
            </p>
          </div>

          <div className="border-4 border-border bg-card p-8 space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-primary border-4 border-border flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h3 className="text-2xl font-black uppercase text-center">Easy Management</h3>
            <p className="text-center font-medium leading-relaxed">
              Teachers can create classes, add problems, and track student progress all in one place.
            </p>
          </div>

          <div className="border-4 border-border bg-card p-8 space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-secondary border-4 border-border flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-secondary-foreground" />
              </div>
            </div>
            <h3 className="text-2xl font-black uppercase text-center">Automated Testing</h3>
            <p className="text-center font-medium leading-relaxed">
              Define test cases once and let the system automatically compile, run, and grade submissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
