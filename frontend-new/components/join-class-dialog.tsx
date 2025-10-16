"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface JoinClassDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onJoinClass: (classCode: string) => void
}

export function JoinClassDialog({ open, onOpenChange, onJoinClass }: JoinClassDialogProps) {
  const [classCode, setClassCode] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onJoinClass(classCode)
    setClassCode("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Join a Class</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="classCode">Class Code</Label>
            <Input
              id="classCode"
              placeholder="e.g., CS301"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value.toUpperCase())}
              className="font-mono text-lg"
              required
            />
            <p className="text-xs text-muted-foreground">Enter the class code provided by your teacher</p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Join Class</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
