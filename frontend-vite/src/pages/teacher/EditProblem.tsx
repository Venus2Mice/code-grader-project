import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Plus, Trash2, Eye, EyeOff, AlertTriangle, Info, Upload, Save, Copy, Code } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { problemAPI, resourceAPI } from "@/services/api"
import { logger } from "@/lib/logger"
import { MarkdownEditor, ResourceUpload, ResourceDisplay, TestCaseBuilder, FunctionTemplates, CodePreview } from "@/components/problem"
import type { TestCaseInput, TestCaseOutput, Language, Difficulty, Resource, Problem } from "@/types"

interface TestCaseForm {
  id: string
  inputs: TestCaseInput[]
  expected_output: TestCaseOutput
  is_hidden: boolean
  // points removed - backend auto-calculates score from test results
}

interface ParameterForm {
  name: string
  type: string
}

export default function EditProblemPage() {
  const params = useParams()
  const navigate = useNavigate()
  const problemToken = params.token as string

  // Guard against null/undefined token
  useEffect(() => {
    if (!problemToken || problemToken === 'null' || problemToken === 'undefined') {
      logger.error('Invalid problem token in EditProblem', { token: problemToken })
      navigate('/teacher/dashboard')
    }
  }, [problemToken, navigate])

  const [problem, setProblem] = useState<Problem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    markdown_content: "",
    difficulty: "medium" as Difficulty,
    language: "cpp" as Language,
    timeLimit: 1000,
    memoryLimit: 256,
    functionName: "",
    returnType: "",
    dueDate: "",
  })

  const [parameters, setParameters] = useState<ParameterForm[]>([
    { name: "param1", type: "int" }
  ])

  const [testCases, setTestCases] = useState<TestCaseForm[]>([
    { 
      id: "1", 
      inputs: [{ type: "int", value: 0 }], 
      expected_output: { type: "int", value: 0 },
      is_hidden: false
    },
  ])

  // Resource management state
  const [resources, setResources] = useState<Resource[]>([])
  const [showResourceUpload, setShowResourceUpload] = useState(false)

  // UX enhancement state
  const [showTemplates, setShowTemplates] = useState(false)
  const [showCodePreview, setShowCodePreview] = useState(false)

  // Test case dialog state
  const [editingTestCase, setEditingTestCase] = useState<TestCaseForm | null>(null)
  const [isTestCaseDialogOpen, setIsTestCaseDialogOpen] = useState(false)

  // State for validation modal
  const [validationModal, setValidationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error" as "error" | "warning" | "success"
  })

  useEffect(() => {
    fetchProblemData()
  }, [problemToken])

  const fetchProblemData = async () => {
    try {
      setIsLoading(true)
      const response = await problemAPI.getByToken(problemToken)
      const problemData = response.data
      setProblem(problemData)

      // Populate form with existing data
      setFormData({
        title: problemData.title || "",
        description: problemData.description || "",
        markdown_content: problemData.markdown_content || "",
        difficulty: problemData.difficulty || "medium",
        language: problemData.language || "cpp",
        timeLimit: problemData.time_limit_ms || 1000,
        memoryLimit: Math.round((problemData.memory_limit_kb || 256000) / 1024), // KB to MB
        functionName: problemData.function_name || "",
        returnType: problemData.return_type || "",
        dueDate: problemData.due_date ? new Date(problemData.due_date).toISOString().slice(0, 16) : "",
      })

      // Set parameters
      if (problemData.parameters && Array.isArray(problemData.parameters) && problemData.parameters.length > 0) {
        setParameters(problemData.parameters)
      }

      // Set test cases
      if (problemData.test_cases && problemData.test_cases.length > 0) {
        setTestCases(problemData.test_cases.map((tc: any, index: number) => ({
          id: String(tc.id || index + 1),
          inputs: tc.inputs || [],
          expected_output: tc.expected_output || { type: "int", value: 0 },
          is_hidden: tc.is_hidden || false
          // points removed - not needed in frontend
        })))
      }

      // Fetch resources if available
      if (problemData.id) {
        try {
          const resourcesResponse = await resourceAPI.getByProblem(problemToken)
          setResources(resourcesResponse.data || [])
        } catch (err) {
          logger.warn('No resources found for problem')
        }
      }
    } catch (err) {
      logger.error('Error fetching problem', err, { problemToken })
      setValidationModal({
        isOpen: true,
        title: "Error Loading Problem",
        message: "Failed to load problem data. Please try again.",
        type: "error"
      })
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
        is_hidden: false
      },
    ])
  }

  const removeTestCase = (id: string) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((tc) => tc.id !== id))
    }
  }

  // Parameter management
  const addParameter = () => {
    setParameters([...parameters, { name: `param${parameters.length + 1}`, type: "int" }])
  }

  const removeParameter = (index: number) => {
    if (parameters.length > 1) {
      setParameters(parameters.filter((_, i) => i !== index))
    }
  }

  const updateParameter = (index: number, field: keyof ParameterForm, value: string) => {
    // Validate parameter name: only alphanumeric characters
    if (field === 'name') {
      const alphanumericRegex = /^[a-zA-Z0-9_]*$/
      if (!alphanumericRegex.test(value)) {
        setValidationModal({
          isOpen: true,
          title: "Invalid Parameter Name",
          message: "Parameter names can only contain letters, numbers, and underscores. No special characters allowed.",
          type: "error"
        })
        return
      }
    }
    
    setParameters(parameters.map((param, i) => (i === index ? { ...param, [field]: value } : param)))
  }

  // Validate function name
  const validateFunctionName = (name: string): boolean => {
    // Only alphanumeric and underscore allowed, must start with letter or underscore
    const functionNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/
    return functionNameRegex.test(name)
  }

  const handleFunctionNameChange = (value: string) => {
    // Allow empty for typing
    if (value === "") {
      setFormData({ ...formData, functionName: value })
      return
    }

    // Check if valid
    if (!validateFunctionName(value)) {
      setValidationModal({
        isOpen: true,
        title: "Invalid Function Name",
        message: "Function names must start with a letter or underscore and contain only letters, numbers, and underscores. No special characters or spaces allowed.",
        type: "error"
      })
      return
    }

    setFormData({ ...formData, functionName: value })
  }

  // Resource upload handlers
  const handleResourceUploaded = (newResource: Resource) => {
    setResources([...resources, newResource])
    setShowResourceUpload(false)
  }

  const handleResourceDeleted = (resourceId: number) => {
    setResources(resources.filter(r => r.id !== resourceId))
  }

  const openErrorModal = (title: string, message: string) => {
    setValidationModal({
      isOpen: true,
      title,
      message,
      type: "error"
    })
  }

  const updateTestCase = (id: string, field: keyof TestCaseForm, value: any) => {
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

  // Template selection handler
  const handleTemplateSelect = (template: any) => {
    setFormData({
      ...formData,
      functionName: template.functionName,
      returnType: template.returnType
    })
    setParameters(template.parameters)
    setTestCases(template.testCases.map((tc: any, idx: number) => ({
      id: String(idx + 1),
      inputs: tc.inputs,
      expected_output: tc.expected_output,
      is_hidden: false
    })))
    setShowTemplates(false)
  }

  // Quick action handlers for test cases
  const duplicateTestCase = (id: string) => {
    const testCase = testCases.find(tc => tc.id === id)
    if (testCase) {
      const newId = String(Math.max(...testCases.map(tc => parseInt(tc.id))) + 1)
      setTestCases([...testCases, { ...testCase, id: newId }])
    }
  }

  const setAllTestCasesVisibility = (hidden: boolean) => {
    setTestCases(testCases.map(tc => ({ ...tc, is_hidden: hidden })))
  }

  // Test case dialog handlers
  const openTestCaseDialog = (testCase: TestCaseForm) => {
    setEditingTestCase(testCase)
    setIsTestCaseDialogOpen(true)
  }

  const closeTestCaseDialog = () => {
    setEditingTestCase(null)
    setIsTestCaseDialogOpen(false)
  }

  const saveTestCaseFromDialog = () => {
    if (editingTestCase) {
      setTestCases(testCases.map(tc => 
        tc.id === editingTestCase.id ? editingTestCase : tc
      ))
      closeTestCaseDialog()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Function name validation
    const functionNameToSend = formData.functionName.trim()
    
    if (functionNameToSend && !validateFunctionName(functionNameToSend)) {
      setValidationModal({
        isOpen: true,
        title: "Invalid Function Name",
        message: "Function name must start with a letter or underscore and contain only letters, numbers, and underscores. Leave empty to auto-generate from problem title.",
        type: "warning"
      })
      // Allow submission - backend will fallback
    }

    // Validate return type
    if (!formData.returnType) {
      setValidationModal({
        isOpen: true,
        title: "Missing Return Type",
        message: "Return type is required. Examples: int, string, int[], vector<int>",
        type: "error"
      })
      return
    }

    // Validate parameters
    for (let i = 0; i < parameters.length; i++) {
      const param = parameters[i]
      if (!param.name || !validateFunctionName(param.name)) {
        setValidationModal({
          isOpen: true,
          title: "Invalid Parameter Name",
          message: `Parameter ${i + 1}: Name must start with a letter or underscore and contain only letters, numbers, and underscores.`,
          type: "error"
        })
        return
      }
      if (!param.type) {
        setValidationModal({
          isOpen: true,
          title: "Missing Parameter Type",
          message: `Parameter ${i + 1} (${param.name}): Type is required.`,
          type: "error"
        })
        return
      }
    }
    
    // Points validation removed - backend auto-calculates score from test results
    
    try {
      // Update problem using PUT endpoint
      const problemData: any = {
        title: formData.title,
        description: formData.description,
        markdown_content: formData.markdown_content || undefined,
        difficulty: formData.difficulty,
        language: formData.language,
        function_name: formData.functionName,
        return_type: formData.returnType,
        parameters: parameters.map(p => ({ name: p.name, type: p.type })),
        time_limit_ms: formData.timeLimit,
        memory_limit_kb: formData.memoryLimit * 1024, // Convert MB to KB
        test_cases: testCases.map(tc => ({
          inputs: tc.inputs,
          expected_output: tc.expected_output,
          is_hidden: tc.is_hidden
          // points removed - backend will use default 10 points per test case for weighted scoring
        }))
      }
      
      // Add due_date if set
      if (formData.dueDate) {
        problemData.due_date = new Date(formData.dueDate).toISOString()
      } else {
        problemData.due_date = null // Clear due date
      }

      await problemAPI.update(problemToken, problemData)
      
      setValidationModal({
        isOpen: true,
        title: "Problem Updated!",
        message: "Your problem has been updated successfully.",
        type: "success"
      })
      
      // Navigate back to problem view after short delay
      setTimeout(() => {
        navigate(`/teacher/problem/${problemToken}`)
      }, 1500)
    } catch (err: any) {
      logger.error('Error updating problem', err, { problemToken })
      setValidationModal({
        isOpen: true,
        title: "Update Failed",
        message: err.response?.data?.msg || 'Failed to update problem. Please try again.',
        type: "error"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Problem not found</h2>
          <Link to="/teacher/dashboard" className="mt-4 inline-block text-primary hover:underline">
            Return to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b-4 border-border bg-card relative overflow-hidden">
        <div className="absolute -right-16 top-0 h-32 w-32 border-4 border-accent bg-accent/20" />

        <div className="relative mx-auto max-w-5xl px-6 py-8">
          <Link
            to={`/teacher/problem/${problemToken}`}
            className="mb-6 inline-flex items-center gap-2 border-4 border-border bg-white dark:bg-gray-800 px-4 py-2 font-bold uppercase tracking-wide text-foreground transition-all hover:bg-primary hover:text-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <ArrowLeft className="h-5 w-5" />
            BACK
          </Link>

          <div className="mt-4">
            <h1 className="text-4xl font-black uppercase tracking-tight text-foreground">EDIT PROBLEM</h1>
            <p className="mt-3 text-lg font-bold text-muted-foreground">{problem.title}</p>
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

              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-base font-black uppercase tracking-wide">
                  Due Date (Optional)
                </Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="border-4 border-border text-base font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-1 focus:translate-y-1 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                />
                <p className="text-sm font-bold text-muted-foreground border-l-4 border-orange-500 pl-3 bg-orange-50 dark:bg-orange-950 py-2">
                  ⚠️ Students can still submit after due date, but submissions will be marked as "Late"
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-4 border-border bg-card p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="border-l-8 border-secondary pl-4 text-2xl font-black uppercase text-foreground">
                FUNCTION CONFIGURATION
              </h2>
              <Button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                className="border-4 border-border bg-purple-500 px-4 py-2 font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                📝 USE TEMPLATE
              </Button>
            </div>

            {/* Template Selector */}
            {showTemplates && (
              <div className="mb-6">
                <FunctionTemplates onSelectTemplate={handleTemplateSelect} />
              </div>
            )}

            <div className="space-y-6">
              {/* Info Banner - Neo Brutalism */}
              <div className="border-4 border-cyan-500 bg-cyan-50 dark:bg-cyan-950 p-4 shadow-[4px_4px_0px_0px_rgba(6,182,212,1)]">
                <div className="flex gap-3">
                  <Info className="h-6 w-6 text-cyan-600 dark:text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-black text-lg uppercase text-cyan-900 dark:text-cyan-100">Function-Based Grading</p>
                    <p className="text-sm font-bold text-cyan-700 dark:text-cyan-300 mt-2">
                      Students implement ONLY the function. The Go worker auto-generates test harness with starter code.
                    </p>
                  </div>
                </div>
              </div>

              {/* Function Name - Neo Brutalism */}
              <div className="space-y-3">
                <Label htmlFor="functionName" className="text-base font-black uppercase tracking-wide">
                  Function Name (Optional)
                </Label>
                <Input
                  id="functionName"
                  placeholder="e.g., twoSum (leave empty to auto-generate)"
                  value={formData.functionName}
                  onChange={(e) => handleFunctionNameChange(e.target.value)}
                  className="border-4 border-border font-mono text-base font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-1 focus:translate-y-1 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                />
                <div className="space-y-2">
                  <p className="text-sm font-bold text-muted-foreground border-l-4 border-cyan-500 pl-3 bg-cyan-50 dark:bg-cyan-950 py-2">
                    ℹ️ Auto-generated from problem title if not provided
                  </p>
                  <p className="text-sm font-bold text-muted-foreground border-l-4 border-yellow-500 pl-3 bg-yellow-50 dark:bg-yellow-950 py-2">
                    ⚠️ Must start with letter/underscore. Only letters, numbers, underscores allowed.
                  </p>
                </div>
              </div>

              {/* Return Type - Neo Brutalism */}
              <div className="space-y-3">
                <Label htmlFor="returnType" className="text-base font-black uppercase tracking-wide">
                  Return Type *
                </Label>
                <Input
                  id="returnType"
                  placeholder="e.g., int, string, int[], vector<int>"
                  value={formData.returnType}
                  onChange={(e) => setFormData({ ...formData, returnType: e.target.value })}
                  className="border-4 border-border font-mono text-base font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-1 focus:translate-y-1 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  required
                />
                <p className="text-sm font-bold text-muted-foreground">
                  Examples: <code className="bg-muted px-2 py-1 rounded font-mono">int</code>, <code className="bg-muted px-2 py-1 rounded font-mono">vector&lt;int&gt;</code>, <code className="bg-muted px-2 py-1 rounded font-mono">string</code>
                </p>
              </div>

              {/* Parameters Section - Neo Brutalism */}
              <div className="border-4 border-border bg-muted/30 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black uppercase tracking-wide">Parameters</h3>
                  <Button 
                    type="button" 
                    onClick={addParameter}
                    className="border-4 border-border bg-lime-500 px-4 py-2 font-black uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    ADD
                  </Button>
                </div>

                <div className="space-y-4">
                  {parameters.map((param, index) => (
                    <div key={index} className="border-4 border-border bg-background p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-sm font-black uppercase">Name</Label>
                            <Input
                              placeholder="e.g., nums"
                              value={param.name}
                              onChange={(e) => updateParameter(index, 'name', e.target.value)}
                              className="border-4 border-border font-mono font-bold"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-black uppercase">Type</Label>
                            <Input
                              placeholder="e.g., int[]"
                              value={param.type}
                              onChange={(e) => updateParameter(index, 'type', e.target.value)}
                              className="border-4 border-border font-mono font-bold"
                              required
                            />
                          </div>
                        </div>
                        {parameters.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeParameter(index)}
                            className="border-4 border-border bg-red-500 p-2 font-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Resources Section */}
          <Card className="border-4 border-border bg-card p-8">
            <h2 className="mb-6 border-l-8 border-purple-500 pl-4 text-2xl font-black uppercase text-foreground">
              RESOURCES (OPTIONAL)
            </h2>

            <div className="space-y-4">
              <div className="border-4 border-purple-500 bg-purple-50 dark:bg-purple-950 p-4 shadow-[4px_4px_0px_0px_rgba(168,85,247,1)]">
                <div className="flex gap-3">
                  <Upload className="h-6 w-6 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-black text-lg uppercase text-purple-900 dark:text-purple-100">Add Files or Drive Links</p>
                    <p className="text-sm font-bold text-purple-700 dark:text-purple-300 mt-2">
                      Upload files or provide Google Drive links for students. These will appear in problem detail view.
                    </p>
                  </div>
                </div>
              </div>

              {/* Display uploaded resources */}
              {resources.length > 0 && (
                <ResourceDisplay 
                  resources={resources} 
                  canDelete={true}
                  onResourceDeleted={handleResourceDeleted}
                />
              )}

              {/* Resource upload component */}
              {showResourceUpload && (
                <ResourceUpload
                  problemId={problemToken}
                  onUploadSuccess={handleResourceUploaded}
                  onError={openErrorModal}
                />
              )}

              {/* Upload button */}
              {!showResourceUpload && (
                <Button
                  type="button"
                  onClick={() => setShowResourceUpload(true)}
                  className="w-full border-4 border-border bg-purple-500 px-6 py-3 font-black uppercase text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  UPLOAD RESOURCES
                </Button>
              )}
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

            <div className="space-y-4">
              {testCases.map((testCase, index) => (
                <Card key={testCase.id} className="border-4 border-border bg-muted/50 p-4">
                  <div className="flex items-center justify-between">
                    {/* Left: Test case info */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-black text-lg">
                        {index + 1}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {testCase.is_hidden ? (
                            <span className="flex items-center gap-1 px-2 py-1 rounded bg-orange-500/20 text-orange-700 dark:text-orange-300 text-xs font-bold">
                              <EyeOff className="h-3 w-3" />
                              HIDDEN
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 text-green-700 dark:text-green-300 text-xs font-bold">
                              <Eye className="h-3 w-3" />
                              VISIBLE
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {testCase.inputs.length} input(s) → {testCase.expected_output.type}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openTestCaseDialog(testCase)}
                        className="gap-1"
                      >
                        <Code className="h-4 w-4" />
                        EDIT
                      </Button>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateTestCase(testCase.id)}
                        className="gap-1"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>

                      {testCases.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeTestCase(testCase.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Quick Actions for Test Cases */}
            <div className="mt-6 flex items-center justify-between border-4 border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAllTestCasesVisibility(false)}
                  className="gap-1"
                >
                  <Eye className="h-4 w-4" />
                  Show All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAllTestCasesVisibility(true)}
                  className="gap-1"
                >
                  <EyeOff className="h-4 w-4" />
                  Hide All
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCodePreview(!showCodePreview)}
                className="gap-2"
              >
                <Code className="h-4 w-4" />
                {showCodePreview ? "Hide" : "Show"} Code Preview
              </Button>
            </div>

            {/* Test Case Edit Dialog */}
            <Dialog open={isTestCaseDialogOpen} onOpenChange={setIsTestCaseDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-4 border-border">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black uppercase">
                    Edit Test Case
                  </DialogTitle>
                </DialogHeader>

                {editingTestCase && (
                  <div className="space-y-6">
                    {/* Visibility Toggle */}
                    <div className="flex items-center gap-3 border-4 border-border bg-muted/50 p-4">
                      <Switch
                        checked={editingTestCase.is_hidden}
                        onCheckedChange={(checked) => 
                          setEditingTestCase({ ...editingTestCase, is_hidden: checked })
                        }
                      />
                      <Label className="text-sm font-bold cursor-pointer">
                        {editingTestCase.is_hidden ? (
                          <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                            <EyeOff className="h-4 w-4" />
                            HIDDEN FROM STUDENTS
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                            <Eye className="h-4 w-4" />
                            VISIBLE TO STUDENTS
                          </span>
                        )}
                      </Label>
                    </div>

                    {/* TestCaseBuilder */}
                    <TestCaseBuilder
                      inputs={editingTestCase.inputs}
                      expectedOutput={editingTestCase.expected_output}
                      onInputsChange={(inputs) => 
                        setEditingTestCase({ ...editingTestCase, inputs })
                      }
                      onExpectedOutputChange={(output) => 
                        setEditingTestCase({ ...editingTestCase, expected_output: output })
                      }
                      parameterNames={parameters.map(p => p.name)}
                    />
                  </div>
                )}

                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeTestCaseDialog}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={saveTestCaseFromDialog}
                    className="bg-primary text-primary-foreground font-bold"
                  >
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Code Preview */}
            {showCodePreview && testCases.length > 0 && (
              <div className="mt-6">
                <CodePreview
                  language={formData.language}
                  functionName={formData.functionName || "solution"}
                  returnType={formData.returnType}
                  parameters={parameters}
                  testCase={{
                    inputs: testCases[0].inputs,
                    expected_output: testCases[0].expected_output
                  }}
                />
              </div>
            )}
          </Card>

          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(`/teacher/problem/${problemToken}`)}
            >
              CANCEL
            </Button>
            <Button type="submit" className="gap-2">
              <Save className="h-4 w-4" />
              SAVE CHANGES
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
            >
              GOT IT
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
