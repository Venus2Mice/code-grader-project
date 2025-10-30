import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Plus, Trash2, Eye, EyeOff, AlertTriangle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { classAPI, problemAPI } from "@/services/api"
import { logger } from "@/lib/logger"
import { MarkdownEditor } from "@/components/problem"
import type { TestCaseInput, TestCaseOutput, Language, Difficulty } from "@/types"

interface TestCaseForm {
  id: string
  inputs: TestCaseInput[]
  expected_output: TestCaseOutput
  is_hidden: boolean
  points: number
}

export default function CreateProblemPage() {
  const params = useParams()
  const navigate = useNavigate()
  const classId = params.id as string
  const [classData, setClassData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    markdown_content: "",
    difficulty: "medium" as Difficulty,
    language: "cpp" as Language,
    timeLimit: 1000,
    memoryLimit: 256,
    functionSignature: "",
  })

  const [testCases, setTestCases] = useState<TestCaseForm[]>([
    { 
      id: "1", 
      inputs: [{ type: "int", value: 0 }], 
      expected_output: { type: "int", value: 0 },
      is_hidden: false, 
      points: 10 
    },
  ])

  // State for validation modal
  const [validationModal, setValidationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error" as "error" | "warning"
  })

  useEffect(() => {
    fetchClassData()
  }, [classId])

  const fetchClassData = async () => {
    try {
      const response = await classAPI.getById(Number(classId))
      setClassData(response.data)
    } catch (err) {
      logger.error('Error fetching class', err, { classId })
    } finally {
      setIsLoading(false)
    }
  }

  const addTestCase = () => {
    setTestCases([
      ...testCases,
      {
        id: String(testCases.length + 1),
        inputs: [{ type: "int", value: 0 }],
        expected_output: { type: "int", value: 0 },
        is_hidden: false,
        points: 10,
      },
    ])
  }

  const removeTestCase = (id: string) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((tc) => tc.id !== id))
    }
  }

  const updateTestCase = (id: string, field: keyof TestCaseForm, value: any) => {
    // Validate points: must be non-negative
    if (field === 'points') {
      const points = Number(value)
      if (points < 0) {
        setValidationModal({
          isOpen: true,
          title: "Invalid Points",
          message: "Test case points cannot be negative. Please enter a value of 0 or greater.",
          type: "error"
        })
        return
      }
      
      // Calculate total points with this new value
      const updatedTestCases = testCases.map((tc) => 
        tc.id === id ? { ...tc, [field]: points } : tc
      )
      const totalPoints = updatedTestCases.reduce((sum, tc) => sum + tc.points, 0)
      
      if (totalPoints > 100) {
        setValidationModal({
          isOpen: true,
          title: "Points Limit Exceeded",
          message: `Total points would be ${totalPoints}, which exceeds the maximum of 100 points. Please reduce the points to stay within the limit.`,
          type: "error"
        })
        return
      }
    }
    
    setTestCases(testCases.map((tc) => (tc.id === id ? { ...tc, [field]: value } : tc)))
  }

  // Helper to update test case inputs/output with JSON parsing
  const updateTestCaseJSON = (id: string, field: 'inputs' | 'expected_output', jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString)
      updateTestCase(id, field, parsed)
    } catch (err) {
      // Invalid JSON - show error
      setValidationModal({
        isOpen: true,
        title: "Invalid JSON",
        message: `Please enter valid JSON for ${field}. Example: ${field === 'inputs' ? '[{"type":"int","value":5}]' : '{"type":"int","value":10}'}`,
        type: "error"
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate total points before submission
    const totalPoints = testCases.reduce((sum, tc) => sum + tc.points, 0)
    
    if (totalPoints === 0) {
      setValidationModal({
        isOpen: true,
        title: "No Points Assigned",
        message: "Total points must be greater than 0. Please assign points to your test cases.",
        type: "warning"
      })
      return
    }
    
    if (totalPoints > 100) {
      setValidationModal({
        isOpen: true,
        title: "Points Limit Exceeded",
        message: `Total points is ${totalPoints}, which exceeds the maximum of 100 points. Please adjust your test case points.`,
        type: "error"
      })
      return
    }
    
    // Check for negative points
    const hasNegativePoints = testCases.some(tc => tc.points < 0)
    if (hasNegativePoints) {
      setValidationModal({
        isOpen: true,
        title: "Invalid Points",
        message: "Some test cases have negative points. Please ensure all points are 0 or greater.",
        type: "error"
      })
      return
    }
    
    try {
      // Create problem with test cases matching backend schema
      const problemData = {
        title: formData.title,
        description: formData.description,
        markdown_content: formData.markdown_content || undefined,
        difficulty: formData.difficulty,
        language: formData.language,
        function_signature: formData.functionSignature,
        time_limit_ms: formData.timeLimit,
        memory_limit_kb: formData.memoryLimit * 1024, // Convert MB to KB
        test_cases: testCases.map(tc => ({
          inputs: tc.inputs,
          expected_output: tc.expected_output,
          is_hidden: tc.is_hidden,
          points: tc.points
        }))
      }

      await problemAPI.create(Number(classId), problemData)
      navigate(`/teacher/class/${classId}`)
    } catch (err: any) {
      logger.error('Error creating problem', err, { classId })
      alert(err.response?.data?.msg || 'Failed to create problem')
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
            to={`/teacher/class/${classId}`}
            className="mb-6 inline-flex items-center gap-2 border-4 border-border bg-muted px-4 py-2 font-bold uppercase tracking-wide text-foreground transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
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
        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="border-4 border-border bg-card p-8">
            <h2 className="mb-6 border-l-8 border-primary pl-4 text-2xl font-black uppercase text-foreground">
              PROBLEM DETAILS
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Problem Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Two Sum"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Problem Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the problem, input format, output format, and constraints..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={8}
                  required
                />
                <p className="text-xs text-muted-foreground">Use clear formatting to explain the problem statement</p>
              </div>

              <div className="space-y-2">
                <Label>Problem Description (Markdown - Optional)</Label>
                <MarkdownEditor
                  value={formData.markdown_content}
                  onChange={(value) => setFormData({ ...formData, markdown_content: value })}
                  onFileUpload={(filename) => logger.info(`Markdown file uploaded: ${filename}`)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData({ ...formData, difficulty: value as Difficulty })}
                  >
                    <SelectTrigger id="difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) => setFormData({ ...formData, language: value as Language })}
                  >
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpp">C++</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeLimit">Time Limit (ms)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    value={formData.timeLimit}
                    onChange={(e) => setFormData({ ...formData, timeLimit: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="memoryLimit">Memory Limit (MB)</Label>
                <Input
                  id="memoryLimit"
                  type="number"
                  value={formData.memoryLimit}
                  onChange={(e) => setFormData({ ...formData, memoryLimit: Number(e.target.value) })}
                  required
                />
              </div>
            </div>
          </Card>

          <Card className="border-4 border-border bg-card p-8">
            <h2 className="mb-6 border-l-8 border-secondary pl-4 text-2xl font-black uppercase text-foreground">
              FUNCTION CONFIGURATION
            </h2>

            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 border-l-4 border-blue-500">
                <div className="flex gap-2">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-bold text-blue-900 dark:text-blue-100">Function-Based Grading</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Students implement the specified function. The system automatically generates test harness code.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="functionSignature">Function Signature *</Label>
                <Input
                  id="functionSignature"
                  placeholder="e.g., vector<int> twoSum(vector<int>& nums, int target)"
                  value={formData.functionSignature}
                  onChange={(e) => setFormData({ ...formData, functionSignature: e.target.value })}
                  className="font-mono text-sm"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Function that students must implement. Must include return type, name, and parameters.
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-4 border-border bg-card p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="border-l-8 border-accent pl-4 text-2xl font-black uppercase text-foreground">
                TEST CASES
              </h2>
              <Button type="button" variant="outline" size="sm" onClick={addTestCase} className="gap-2 bg-transparent">
                <Plus className="h-4 w-4" />
                ADD TEST CASE
              </Button>
            </div>

            <div className="space-y-6">
              {testCases.map((testCase, index) => (
                <Card key={testCase.id} className="border-4 border-border bg-muted/50 p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Test Case {index + 1}</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-3 border-2 border-border bg-background px-3 py-1.5 rounded">
                        <Switch
                          checked={testCase.is_hidden}
                          onCheckedChange={(checked) => updateTestCase(testCase.id, "is_hidden", checked)}
                        />
                        <Label className="text-sm font-bold cursor-pointer">
                          {testCase.is_hidden ? (
                            <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                              <EyeOff className="h-4 w-4" />
                              Hidden
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                              <Eye className="h-4 w-4" />
                              Visible
                            </span>
                          )}
                        </Label>
                      </div>
                      {testCases.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeTestCase(testCase.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Inputs (JSON Array)</Label>
                      <Textarea
                        placeholder='[{"type":"int","value":5},{"type":"int","value":10}]'
                        value={JSON.stringify(testCase.inputs)}
                        onChange={(e) => updateTestCaseJSON(testCase.id, "inputs", e.target.value)}
                        rows={4}
                        className="font-mono text-sm"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Array of objects with "type" and "value" fields
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Expected Output (JSON Object)</Label>
                      <Textarea
                        placeholder='{"type":"int","value":15}'
                        value={JSON.stringify(testCase.expected_output)}
                        onChange={(e) => updateTestCaseJSON(testCase.id, "expected_output", e.target.value)}
                        rows={4}
                        className="font-mono text-sm"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Object with "type" and "value" fields
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <Label>Points</Label>
                    <Input
                      type="number"
                      value={testCase.points}
                      onChange={(e) => updateTestCase(testCase.id, "points", Number(e.target.value))}
                      className="w-32"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                </Card>
              ))}
            </div>

            {(() => {
              const totalPoints = testCases.reduce((sum, tc) => sum + tc.points, 0)
              const isValid = totalPoints > 0 && totalPoints <= 100
              const isEmpty = totalPoints === 0
              const isOverLimit = totalPoints > 100
              
              return (
                <div className={`mt-6 border-4 border-border p-6 ${
                  isOverLimit ? 'bg-destructive/10' : 
                  isEmpty ? 'bg-orange-500/10' : 
                  'bg-primary/10'
                }`}>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-black uppercase text-foreground">
                      TOTAL POINTS: <span className={
                        isOverLimit ? 'text-destructive' : 
                        isEmpty ? 'text-orange-600' : 
                        'text-primary'
                      }>{totalPoints}</span>
                      <span className="text-muted-foreground"> / 100</span>
                    </p>
                    {!isValid && (
                      <span className={`text-sm font-bold uppercase ${
                        isOverLimit ? 'text-destructive' : 'text-orange-600'
                      }`}>
                        {isOverLimit ? '⚠️ EXCEEDS LIMIT!' : '⚠️ MUST BE > 0'}
                      </span>
                    )}
                  </div>
                  {!isValid && (
                    <p className={`mt-2 text-xs font-medium ${
                      isOverLimit ? 'text-destructive' : 'text-orange-600'
                    }`}>
                      {isOverLimit 
                        ? 'Please reduce the points. Total must not exceed 100.' 
                        : 'Please assign points to test cases. Total must be greater than 0.'}
                    </p>
                  )}
                </div>
              )
            })()}
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              CANCEL
            </Button>
            <Button type="submit">CREATE ASSIGNMENT</Button>
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
                  : 'bg-orange-500/10'
              }`}>
                <AlertTriangle className={`h-6 w-6 ${
                  validationModal.type === 'error' 
                    ? 'text-destructive' 
                    : 'text-orange-600'
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
            >
              GOT IT
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
