"use client"

import { useState } from "react"
import { Search, Settings, Plus, Edit, Trash2, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface Issue {
  id: string
  title: string
  category: string
  steps: string[]
  additionalInfo?: string
}

const initialIssues: Issue[] = [
  {
    id: "1",
    title: "Printer Won't Turn On",
    category: "Power",
    steps: [
      "Check if the power cord is properly connected to both the printer and power outlet",
      "Verify the power outlet is working by testing with another device",
      "Press and hold the power button for 3-5 seconds",
      "Check if the power LED indicator lights up",
      "If still not working, try a different power cord if available",
    ],
    additionalInfo:
      "If the printer still won't turn on after these steps, the internal power supply may be faulty and require professional service.",
  },
  {
    id: "2",
    title: "Paper Jam Error",
    category: "Paper Handling",
    steps: [
      "Turn off the printer and unplug it from power",
      "Open all printer covers and trays",
      "Gently remove any visible paper, pulling in the direction of paper path",
      "Check for small torn pieces of paper",
      "Close all covers and trays",
      "Plug in and turn on the printer",
      "Run a test print",
    ],
    additionalInfo:
      "Always pull paper in the direction it normally travels. Pulling against the paper path can damage the printer mechanism.",
  },
  {
    id: "3",
    title: "Poor Print Quality",
    category: "Print Quality",
    steps: [
      "Check ink or toner levels in printer software",
      "Run the printer's built-in cleaning cycle",
      "Check print settings - ensure correct paper type is selected",
      "Inspect paper for damage or moisture",
      "Clean the printer heads using the maintenance menu",
      "Replace ink cartridges if levels are low",
      "Perform a printer alignment if available",
    ],
    additionalInfo:
      "Print quality issues can also be caused by using non-genuine ink cartridges or expired cartridges. Always use HP-certified supplies for best results.",
  },
  {
    id: "4",
    title: "Printer Not Detected by Computer",
    category: "Connectivity",
    steps: [
      "Check USB or network cable connections",
      "Restart both printer and computer",
      "Update or reinstall printer drivers",
      "For wireless: Check WiFi connection and password",
      "Run Windows printer troubleshooter",
      "Add printer manually through Control Panel",
      "Check firewall settings if using network printer",
    ],
    additionalInfo:
      "For wireless printers, ensure the printer and computer are on the same network. Some routers have guest networks that may prevent device communication.",
  },
]

export default function TroubleshootingApp() {
  const [issues, setIssues] = useState<Issue[]>(initialIssues)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(issues[0])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState("")
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
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

  const handleSaveIssue = () => {
    if (!formData.title || !formData.category || !formData.steps) {
      alert("Please fill in all required fields")
      return
    }

    const stepsArray = formData.steps.split("\n").filter((step) => step.trim() !== "")

    if (editingIssue) {
      // Update existing issue
      const updatedIssues = issues.map((issue) =>
        issue.id === editingIssue.id
          ? {
              ...issue,
              title: formData.title,
              category: formData.category,
              steps: stepsArray,
              additionalInfo: formData.additionalInfo || undefined,
            }
          : issue,
      )
      setIssues(updatedIssues)
      setEditingIssue(null)
    } else {
      // Add new issue
      const newIssue: Issue = {
        id: Date.now().toString(),
        title: formData.title,
        category: formData.category,
        steps: stepsArray,
        additionalInfo: formData.additionalInfo || undefined,
      }
      setIssues([...issues, newIssue])
      setShowAddForm(false)
    }

    setFormData({ title: "", category: "", steps: "", additionalInfo: "" })
  }

  const handleEditIssue = (issue: Issue) => {
    setEditingIssue(issue)
    setFormData({
      title: issue.title,
      category: issue.category,
      steps: issue.steps.join("\n"),
      additionalInfo: issue.additionalInfo || "",
    })
    setShowAddForm(false)
  }

  const handleDeleteIssue = (issueId: string) => {
    if (confirm("Are you sure you want to delete this issue?")) {
      const updatedIssues = issues.filter((issue) => issue.id !== issueId)
      setIssues(updatedIssues)
      if (selectedIssue?.id === issueId) {
        setSelectedIssue(updatedIssues[0] || null)
      }
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">HP Troubleshooting Guide</h1>
            <p className="text-sm text-gray-600">GOPAK Technical Support</p>
          </div>
          <Button
            variant={isAdminMode ? "default" : "outline"}
            onClick={handleAdminToggle}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            {isAdminMode ? "Exit Admin" : "Admin Mode"}
          </Button>
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
                  <Button onClick={handleSaveIssue} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Issue
                  </Button>
                  <Button variant="outline" onClick={cancelEdit}>
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

              {selectedIssue.additionalInfo && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4 text-gray-900">Additional Information</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">{selectedIssue.additionalInfo}</p>
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
