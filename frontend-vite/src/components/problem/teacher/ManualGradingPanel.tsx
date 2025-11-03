import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { submissionAPI } from "@/services/api"
import { logger } from "@/lib/logger"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

interface ManualGradingPanelProps {
  submissionId: number
  currentScore?: number
  currentComment?: string
  gradedAt?: string
  onGradeSuccess?: () => void
}

export function ManualGradingPanel({
  submissionId,
  currentScore,
  currentComment,
  gradedAt,
  onGradeSuccess
}: ManualGradingPanelProps) {
  const [score, setScore] = useState<string>(currentScore?.toString() || "")
  const [comment, setComment] = useState<string>(currentComment || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    // Validation
    const scoreNum = parseInt(score)
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      setError("Score must be a number between 0 and 100")
      return
    }

    setIsSubmitting(true)

    try {
      await submissionAPI.manualGrade(submissionId, {
        manual_score: scoreNum,
        teacher_comment: comment
      })

      setSuccess(true)
      logger.info("Manual grade submitted successfully", { submissionId, score: scoreNum })
      
      // Call success callback
      if (onGradeSuccess) {
        setTimeout(() => {
          onGradeSuccess()
        }, 1000)
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.msg || "Failed to submit grade"
      setError(errorMsg)
      logger.error("Failed to submit manual grade", { error: err })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader className="bg-yellow-400 border-b-4 border-black">
        <CardTitle className="text-2xl font-black uppercase">Manual Grading</CardTitle>
        {gradedAt && (
          <p className="text-sm font-bold text-gray-700">
            Last graded: {new Date(gradedAt).toLocaleString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Score Input */}
          <div className="space-y-2">
            <Label htmlFor="score" className="text-lg font-black uppercase">
              Score (0-100)
            </Label>
            <Input
              id="score"
              type="number"
              min="0"
              max="100"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="Enter score"
              className="border-4 border-black text-lg font-bold focus:ring-4 focus:ring-cyan-400"
              required
            />
          </div>

          {/* Comment Textarea */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-lg font-black uppercase">
              Feedback (Optional)
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your feedback here..."
              rows={4}
              className="border-4 border-black font-mono text-sm focus:ring-4 focus:ring-cyan-400 resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-100 border-4 border-red-600">
              <XCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-bold text-red-600">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-100 border-4 border-green-600">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm font-bold text-green-600">Grade submitted successfully!</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-cyan-400 hover:bg-cyan-500 text-black border-4 border-black font-black uppercase text-lg py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Grade"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
