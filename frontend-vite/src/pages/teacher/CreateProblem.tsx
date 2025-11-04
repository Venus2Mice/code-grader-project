import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { ArrowLeft, AlertTriangle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { classAPI, problemAPI } from "@/services/api"
import { logger } from "@/lib/logger"
import type { Language, Difficulty } from "@/types"

export default function CreateProblemPage() {
  const params = useParams()
  const navigate = useNavigate()
  const classToken = params.token as string
  const [classData, setClassData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "medium" as Difficulty,
    language: "cpp" as Language,
  })

  // State for validation modal
  const [validationModal, setValidationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error" as "error" | "warning" | "success"
  })

  useEffect(() => {
    fetchClassData()
  }, [classToken])

  const fetchClassData = async () => {
    try {
      const response = await classAPI.getByToken(classToken)
      setClassData(response.data)
    } catch (err) {
      logger.error('Error fetching class', err, { classToken })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      setValidationModal({
        isOpen: true,
        title: "Missing Title",
        message: "Please enter a problem title.",
        type: "error"
      })
      return
    }

    if (!formData.description.trim()) {
      setValidationModal({
        isOpen: true,
        title: "Missing Description",
        message: "Please enter a problem description.",
        type: "error"
      })
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Create problem with MINIMAL data using /define endpoint
      const problemData = {
        title: formData.title,
        description: formData.description,
        difficulty: formData.difficulty,
        language: formData.language,
        function_name: "", // Let backend auto-generate
        return_type: "int", // Default, will be changed in edit page
        parameters: [{ name: "param1", type: "int" }], // Default single parameter
        time_limit_ms: 1000, // Default
        memory_limit_kb: 256 * 1024, // Default 256MB
        test_cases: [
          {
            inputs: [{ type: "int", value: 0 }],
            expected_output: { type: "int", value: 0 },
            is_hidden: false,
            points: 100 // Single default test case with all points
          }
        ]
      }

      const response = await problemAPI.createWithDefinition(classToken, problemData)
      
      // DEBUG: Direct console.log to see raw token value (bypasses logger sanitization)
      console.log('=== RAW RESPONSE DEBUG ===')
      console.log('response.data:', response.data)
      console.log('response.data.token:', response.data?.token)
      console.log('typeof token:', typeof response.data?.token)
      console.log('token truthy?:', !!response.data?.token)
      console.log('========================')
      
      // CRITICAL: Extract token IMMEDIATELY before any other operations
      // Store in a const to prevent any reference issues
      const responseData = response.data
      const createdProblemToken = responseData?.token || responseData?.problem_token || responseData?.public_token
      
      // Validate token exists and is not a placeholder
      if (!createdProblemToken || createdProblemToken === '[REDACTED]' || createdProblemToken === 'null' || createdProblemToken === 'undefined') {
        // Log raw response for debugging
        console.error('❌ Invalid token received:', {
          token: createdProblemToken,
          tokenType: typeof createdProblemToken,
          responseData: responseData,
          allKeys: responseData ? Object.keys(responseData) : []
        })
        throw new Error('Problem token not returned from server or is invalid')
      }
      
      console.log('✅ Token extracted successfully:', createdProblemToken)
      
      // Now safe to log after token extraction
      logger.info('Problem created successfully', { 
        problemId: responseData?.id,
        title: responseData?.title,
        hasValidToken: true
      })
      
      // Show success and redirect to EDIT page
      setValidationModal({
        isOpen: true,
        title: "Problem Created!",
        message: "Problem created successfully. Redirecting to configuration page...",
        type: "success"
      })
      
      // Redirect to edit page after short delay
      setTimeout(() => {
        navigate(`/teacher/problem/${createdProblemToken}/edit`)
      }, 1500)
    } catch (err: any) {
      logger.error('Error creating problem', err, { classToken })
      setValidationModal({
        isOpen: true,
        title: "Creation Failed",
        message: err.response?.data?.msg || 'Failed to create problem. Please try again.',
        type: "error"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
      </div>
    )
  }

  if (!classData) {
    return <div>Class not found</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b-4 border-border bg-card relative overflow-hidden">
        <div className="absolute -right-16 top-0 h-32 w-32 border-4 border-accent bg-accent/20" />

        <div className="relative mx-auto max-w-5xl px-6 py-8">
          <Link
            to={`/teacher/class/${classToken}`}
            className="mb-6 inline-flex items-center gap-2 border-4 border-border bg-white dark:bg-gray-800 px-4 py-2 font-bold uppercase tracking-wide text-foreground transition-all hover:bg-primary hover:text-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <ArrowLeft className="h-5 w-5" />
            BACK
          </Link>

          <div className="mt-4">
            <h1 className="text-4xl font-black uppercase tracking-tight text-foreground">CREATE ASSIGNMENT</h1>
            <p className="mt-3 text-lg font-bold text-muted-foreground">{classData.name}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Info Banner */}
        <div className="mb-8 border-4 border-cyan-500 bg-cyan-50 dark:bg-cyan-950 p-6 shadow-[4px_4px_0px_0px_rgba(6,182,212,1)]">
          <div className="flex gap-3">
            <Info className="h-6 w-6 text-cyan-600 dark:text-cyan-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-black text-lg uppercase text-cyan-900 dark:text-cyan-100">Quick Setup</p>
              <p className="text-sm font-bold text-cyan-700 dark:text-cyan-300 mt-2">
                Start with basic information. You'll configure test cases, function signature, resources, and other details in the next step.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="border-4 border-border bg-card p-8">
            <h2 className="mb-6 border-l-8 border-primary pl-4 text-2xl font-black uppercase text-foreground">
              BASIC INFORMATION
            </h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-black uppercase tracking-wide">
                  Problem Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Two Sum, Fibonacci Sequence, Binary Search"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="border-4 border-border text-base font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-1 focus:translate-y-1 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-black uppercase tracking-wide">
                  Problem Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe what the student needs to solve. You can add more detailed instructions, examples, and constraints in the next step."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={8}
                  className="border-4 border-border text-base font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-1 focus:translate-y-1 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  required
                />
                <p className="text-sm font-bold text-muted-foreground border-l-4 border-yellow-500 pl-3 bg-yellow-50 dark:bg-yellow-950 py-2">
                  💡 Tip: Keep it brief for now. You can enhance with markdown formatting, examples, and test cases in the configuration page.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="difficulty" className="text-base font-black uppercase tracking-wide">
                    Difficulty Level *
                  </Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData({ ...formData, difficulty: value as Difficulty })}
                  >
                    <SelectTrigger 
                      id="difficulty"
                      className="border-4 border-border text-base font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-1 focus:translate-y-1 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy" className="font-bold">🟢 Easy</SelectItem>
                      <SelectItem value="medium" className="font-bold">🟡 Medium</SelectItem>
                      <SelectItem value="hard" className="font-bold">🔴 Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language" className="text-base font-black uppercase tracking-wide">
                    Programming Language *
                  </Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) => setFormData({ ...formData, language: value as Language })}
                  >
                    <SelectTrigger 
                      id="language"
                      className="border-4 border-border text-base font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-1 focus:translate-y-1 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpp" className="font-bold">C++</SelectItem>
                      <SelectItem value="python" className="font-bold">Python</SelectItem>
                      <SelectItem value="java" className="font-bold">Java</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(`/teacher/class/${classToken}`)}
              disabled={isSubmitting}
              className="border-4 border-border font-black uppercase px-6 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              CANCEL
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="border-4 border-border bg-primary font-black uppercase px-8 py-3 text-primary-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "CREATING..." : "CREATE & CONFIGURE"}
            </Button>
          </div>
        </form>
      </div>

      {/* Validation Modal */}
      <Dialog open={validationModal.isOpen} onOpenChange={(open) => setValidationModal({ ...validationModal, isOpen: open })}>
        <DialogContent className="sm:max-w-md border-4 border-border">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2 ${
                validationModal.type === 'error' 
                  ? 'bg-destructive/10' 
                  : validationModal.type === 'warning'
                  ? 'bg-orange-500/10'
                  : 'bg-green-500/10'
              }`}>
                <AlertTriangle className={`h-6 w-6 ${
                  validationModal.type === 'error' 
                    ? 'text-destructive' 
                    : validationModal.type === 'warning'
                    ? 'text-orange-600'
                    : 'text-green-600'
                }`} />
              </div>
              <DialogTitle className="text-xl font-black uppercase">
                {validationModal.title}
              </DialogTitle>
            </div>
            <DialogDescription className="text-base text-foreground mt-4">
              {validationModal.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button 
              onClick={() => setValidationModal({ ...validationModal, isOpen: false })}
              className="w-full"
              disabled={validationModal.type === 'success'} // Disable if redirecting
            >
              {validationModal.type === 'success' ? 'REDIRECTING...' : 'GOT IT'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
