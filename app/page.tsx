"use client"

import { useState, useEffect } from "react"
import { Search, Settings, Plus, Edit, Trash2, Save, X, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { supabase, type Issue } from "@/lib/supabase"

export default function TroubleshootingApp() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState("")
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    steps: "",
    additionalInfo: "",
  })

  const categories = ["Power", "Paper Handling", "Print Quality", "Connectivity", "Software", "Hardware"]

  const filteredIssues = issues.filter(
    (issue) =>
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Load issues from Supabase
  const loadIssues = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("troubleshooting_issues")
        .select("*")
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error loading issues:", error)
        alert("Error loading troubleshooting issues. Please refresh the page.")
        return
      }

      const formattedIssues: Issue[] = data.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        steps: item.steps,
        additional_info: item.additional_info,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }))

      setIssues(formattedIssues)
      if (formattedIssues.length > 0 && !selectedIssue) {
        setSelectedIssue(formattedIssues[0])
      }
    } catch (error) {
      console.error("Error loading issues:", error)
      alert("Error loading troubleshooting issues. Please refresh the page.")
    } finally {
      setLoading(false)
    }
  }

  // Load issues on component mount
  useEffect(() => {
    loadIssues()
  }, [])

  const handleAdminToggle = () => {
    if (isAdminMode) {
      setIsAdminMode(false)
      setEditingIssue(null)
      setShowAddForm(false)
    } else {
      setShowPasswordModal(true)
    }
  }

  const handlePasswordSubmit = () => {
    if (password === "gopak123") {
      setIsAdminMode(true)
      setShowPasswordModal(false)
      setPassword("")
    } else {
      alert("Incorrect password")
    }
  }

  const handleSaveIssue = async () => {
    if (!formData.title || !formData.category || !formData.steps) {
      alert("Please fill in all required fields")
      return
    }

    const stepsArray = formData.steps.split("\n").filter((step) => step.trim() !== "")
    setSaving(true)

    try {
      if (editingIssue) {
        // Update existing issue
        const { error } = await supabase
          .from("troubleshooting_issues")
          .update({
            title: formData.title,
            category: formData.category,
            steps: stepsArray,
            additional_info: formData.additionalInfo || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingIssue.id)

        if (error) {
          console.error("Error updating issue:", error)
          alert("Error updating issue. Please try again.")
          return
        }

        setEditingIssue(null)
      } else {
        // Add new issue
        const { error } = await supabase.from("troubleshooting_issues").insert({
          title: formData.title,
          category: formData.category,
          steps: stepsArray,
          additional_info: formData.additionalInfo || null,
        })

        if (error) {
          console.error("Error adding issue:", error)
          alert("Error adding issue. Please try again.")
          return
        }

        setShowAddForm(false)
      }

      // Reload issues to get the latest data
      await loadIssues()
      setFormData({ title: "", category: "", steps: "", additionalInfo: "" })
    } catch (error) {
      console.error("Error saving issue:", error)
      alert("Error saving issue. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleEditIssue = (issue: Issue) => {
    setEditingIssue(issue)
    setFormData({
      title: issue.title,
      category: issue.category,
      steps: issue.steps.join("\n"),
      additionalInfo: issue.additional_info || "",
    })
    setShowAddForm(false)
  }

  const handleDeleteIssue = async (issueId: string) => {
    if (!confirm("Are you sure you want to delete this issue?")) {
      return
    }

    try {
      const { error } = await supabase.from("troubleshooting_issues").delete().eq("id", issueId)

      if (error) {
        console.error("Error deleting issue:", error)
        alert("Error deleting issue. Please try again.")
        return
      }

      // Reload issues
      await loadIssues()

      // Update selected issue if it was deleted
      if (selectedIssue?.id === issueId) {
        const remainingIssues = issues.filter((issue) => issue.id !== issueId)
        setSelectedIssue(remainingIssues[0] || null)
      }
    } catch (error) {
      console.error("Error deleting issue:", error)
      alert("Error deleting issue. Please try again.")
    }
  }

  const handleAddNew = () => {
    setShowAddForm(true)
    setEditingIssue(null)
    setFormData({ title: "", category: "", steps: "", additionalInfo: "" })
  }

  const cancelEdit = () => {
    setEditingIssue(null)
    setShowAddForm(false)
    setFormData({ title: "", category: "", steps: "", additionalInfo: "" })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading troubleshooting guide...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">HP Troubleshooting Guide</h1>
            <p className="text-sm text-gray-600">GOPAK Technical Support</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={loadIssues}
              className="flex items-center gap-2 bg-transparent"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant={isAdminMode ? "default" : "outline"}
              onClick={handleAdminToggle}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {isAdminMode ? "Exit Admin" : "Admin Mode"}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Issues List */}
        <div className="w-1/3 border-r bg-gray-50 flex flex-col">
          <div className="p-4 border-b bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {isAdminMode && (
              <Button onClick={handleAddNew} className="w-full mt-3 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Issue
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredIssues.map((issue) => (
              <div
                key={issue.id}
                className={`p-4 border-b cursor-pointer hover:bg-white transition-colors ${
                  selectedIssue?.id === issue.id ? "bg-white border-l-4 border-l-blue-500" : ""
                }`}
                onClick={() => setSelectedIssue(issue)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{issue.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {issue.category}
                    </Badge>
                  </div>
                  {isAdminMode && (
                    <div className="flex gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditIssue(issue)
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteIssue(issue.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Issue Details or Form */}
        <div className="flex-1 flex flex-col">
          {(editingIssue || showAddForm) && isAdminMode ? (
            // Edit/Add Form
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">{editingIssue ? "Edit Issue" : "Add New Issue"}</h2>
                <Button variant="ghost" onClick={cancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4 max-w-2xl">
                <div>
                  <Label htmlFor="title">Issue Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter issue title..."
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="steps">Troubleshooting Steps</Label>
                  <Textarea
                    id="steps"
                    value={formData.steps}
                    onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                    placeholder="Enter each step on a new line..."
                    rows={10}
                  />
                  <p className="text-sm text-gray-500 mt-1">Enter each step on a separate line</p>
                </div>

                <div>
                  <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
                  <Textarea
                    id="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                    placeholder="Enter any additional notes, warnings, or helpful information..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveIssue} className="flex items-center gap-2" disabled={saving}>
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save Issue"}
                  </Button>
                  <Button variant="outline" onClick={cancelEdit} disabled={saving}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : selectedIssue ? (
            // Issue Details
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-semibold text-gray-900">{selectedIssue.title}</h2>
                  <Badge variant="outline">{selectedIssue.category}</Badge>
                </div>
                <Separator className="my-4" />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4 text-gray-900">Troubleshooting Steps</h3>
                <div className="space-y-4">
                  {selectedIssue.steps.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium text-sm">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 leading-relaxed pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedIssue.additional_info && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4 text-gray-900">Additional Information</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">{selectedIssue.additional_info}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // No Issue Selected
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Select an issue to view details</h3>
                <p>Choose from the list on the left to see troubleshooting steps</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Admin Access Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">Enter Admin Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handlePasswordSubmit()}
                placeholder="Enter password..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePasswordSubmit} className="flex-1">
                Access Admin Mode
              </Button>
              <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
