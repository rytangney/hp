"use client"

import { useState, useEffect } from "react"
import { Search, Settings, Plus, Edit, Trash2, Save, X, RefreshCw, Upload, ImageIcon, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { supabase, type Issue } from "@/lib/supabase"
import { uploadImage, deleteImage } from "@/lib/storage"

// Function to calculate daily HP CE Code
function calculateHPCECode(): string {
  const startDate = new Date("2024-03-26")
  const today = new Date()

  // Calculate days since start date
  const timeDiff = today.getTime() - startDate.getTime()
  const daysSinceStart = Math.floor(timeDiff / (1000 * 3600 * 24))

  // 10-day cycle increments
  const cycleIncrements = [173, 173, 173, 173, 172, 173, 173, 173, 172, 173]

  let currentCode = 9452 // Starting code

  // Calculate total increment based on complete cycles and remaining days
  const completeCycles = Math.floor(daysSinceStart / 10)
  const remainingDays = daysSinceStart % 10

  // Add increments for complete cycles
  const cycleSum = cycleIncrements.reduce((sum, increment) => sum + increment, 0)
  currentCode += completeCycles * cycleSum

  // Add increments for remaining days
  for (let i = 0; i < remainingDays; i++) {
    currentCode += cycleIncrements[i]
  }

  // Return only the last 4 digits
  return (currentCode % 10000).toString().padStart(4, "0")
}

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
  const [uploadingImages, setUploadingImages] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    steps: "",
    additionalInfo: "",
    media: [] as { url: string; type: "image" | "video" }[],
  })

  const categories = ["Print Quality", "Error Message", "Mechanical", "Material", "Software", "Other"]

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
        media: item.media || [],
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

  const handleMediaUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploadingImages(true)
    const uploadedMedia: { url: string; type: "image" | "video" }[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate file type
        const isImage = file.type.startsWith("image/")
        const isVideo = file.type.startsWith("video/")

        if (!isImage && !isVideo) {
          alert(`File ${file.name} is not a supported media type`)
          continue
        }

        // Validate file size (max 50MB for videos, 5MB for images)
        const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024
        if (file.size > maxSize) {
          alert(`File ${file.name} is too large. Maximum size is ${isVideo ? "50MB for videos" : "5MB for images"}`)
          continue
        }

        const mediaUrl = await uploadImage(file)
        if (mediaUrl) {
          uploadedMedia.push({
            url: mediaUrl,
            type: isVideo ? "video" : "image",
          })
        }
      }

      if (uploadedMedia.length > 0) {
        setFormData((prev) => ({
          ...prev,
          media: [...prev.media, ...uploadedMedia],
        }))
      }
    } catch (error) {
      console.error("Error uploading media:", error)
      alert("Error uploading media. Please try again.")
    } finally {
      setUploadingImages(false)
    }
  }

  const handleRemoveMedia = async (mediaUrl: string) => {
    try {
      await deleteImage(mediaUrl)
      setFormData((prev) => ({
        ...prev,
        media: prev.media.filter((item) => item.url !== mediaUrl),
      }))
    } catch (error) {
      console.error("Error removing media:", error)
      alert("Error removing media. Please try again.")
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
            media: formData.media,
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
          media: formData.media,
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
      setFormData({ title: "", category: "", steps: "", additionalInfo: "", media: [] })
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
      media: issue.media || [],
    })
    setShowAddForm(false)
  }

  const handleDeleteIssue = async (issueId: string) => {
    if (!confirm("Are you sure you want to delete this issue?")) {
      return
    }

    try {
      // Find the issue to get its images
      const issueToDelete = issues.find((issue) => issue.id === issueId)

      // Delete associated images from storage
      if (issueToDelete?.media) {
        for (const mediaItem of issueToDelete.media) {
          await deleteImage(mediaItem.url)
        }
      }

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
    setFormData({ title: "", category: "", steps: "", additionalInfo: "", media: [] })
  }

  const cancelEdit = () => {
    setEditingIssue(null)
    setShowAddForm(false)
    setFormData({ title: "", category: "", steps: "", additionalInfo: "", media: [] })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl border border-green-100">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="h-8 w-8 animate-spin text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Troubleshooting Guide</h3>
          <p className="text-gray-600">Connecting to GOPAK database...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-500 via-gray-600 to-gray-500 shadow-2xl border-b-4 border-green-500 relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{
            backgroundImage: "url('/images/header-background.jpg')",
          }}
        ></div>

        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/30 to-black/40"></div>

        {/* Textured background overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent"></div>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px),
                             radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "20px 20px",
            }}
          ></div>
        </div>

        <div className="flex items-center justify-between px-8 py-6 relative z-10">
          {/* Rest of header content remains the same */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <img src="/images/gopak-logo.png" alt="GOPAK Logo" className="h-12 w-auto drop-shadow-lg" />
              <div className="h-12 w-px bg-green-400/60"></div>
            </div>
            <div>
              <div className="flex items-center gap-4 mb-1">
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">HP Troubleshooting Guide</h1>
                {isAdminMode && (
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg shadow-lg border border-green-400/30">
                    <div className="text-xs font-medium opacity-90">HP CE CODE</div>
                    <div className="text-lg font-bold">{calculateHPCECode()}</div>
                  </div>
                )}
              </div>
              <p className="text-green-300 font-medium drop-shadow-sm">GOPAK Technical Support</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={loadIssues}
              className="flex items-center gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/40 transition-all duration-200 backdrop-blur-sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant={isAdminMode ? "default" : "outline"}
              onClick={handleAdminToggle}
              className={`flex items-center gap-2 transition-all duration-200 ${
                isAdminMode
                  ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg border border-green-400/30"
                  : "bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/40 backdrop-blur-sm"
              }`}
            >
              <Settings className="h-4 w-4" />
              {isAdminMode ? "Exit Admin" : "Admin Mode"}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-100px)]">
        {/* Left Panel - Issues List */}
        <div className="w-1/3 bg-white/80 backdrop-blur-sm border-r-4 border-green-300 shadow-2xl flex flex-col">
          <div className="p-6 border-b border-green-100 bg-gradient-to-r from-green-50 to-white">
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-600 h-5 w-5" />
              <Input
                placeholder="Search troubleshooting issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-green-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl bg-white/80 backdrop-blur-sm"
              />
            </div>
            {isAdminMode && (
              <Button
                onClick={handleAddNew}
                className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add New Issue
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredIssues.map((issue, index) => (
              <div
                key={issue.id}
                className={`p-5 border-b border-green-100/50 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-green-50 hover:to-white ${
                  selectedIssue?.id === issue.id
                    ? "bg-gradient-to-r from-green-100 to-white border-l-4 border-l-green-500 shadow-lg"
                    : ""
                }`}
                onClick={() => setSelectedIssue(issue)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight">{issue.title}</h3>
                      {issue.media && issue.media.length > 0 && (
                        <div className="flex gap-1">
                          {issue.media.some((m) => m.type === "image") && (
                            <ImageIcon className="h-3 w-3 text-green-600" />
                          )}
                          {issue.media.some((m) => m.type === "video") && <Video className="h-3 w-3 text-blue-600" />}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300 text-xs font-medium"
                    >
                      {issue.category}
                    </Badge>
                  </div>
                  {isAdminMode && (
                    <div className="flex gap-1 ml-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditIssue(issue)
                        }}
                        className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-700 transition-colors"
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
                        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700 transition-colors"
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
        <div className="flex-1 flex flex-col bg-white">
          {(editingIssue || showAddForm) && isAdminMode ? (
            // Edit/Add Form
            <div className="p-8 overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {editingIssue ? "Edit Issue" : "Add New Issue"}
                  </h2>
                  <p className="text-gray-600">
                    {editingIssue ? "Update the troubleshooting information" : "Create a new troubleshooting guide"}
                  </p>
                </div>
                <Button variant="ghost" onClick={cancelEdit} className="h-10 w-10 p-0 hover:bg-gray-100 rounded-full">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-6 max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="title" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Issue Title
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter issue title..."
                      className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Category
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-lg">
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
                </div>

                <div>
                  <Label htmlFor="steps" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Troubleshooting Steps
                  </Label>
                  <Textarea
                    id="steps"
                    value={formData.steps}
                    onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                    placeholder="Enter each step on a new line..."
                    rows={8}
                    className="border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-lg resize-none"
                  />
                  <p className="text-sm text-gray-500 mt-2">Enter each step on a separate line</p>
                </div>

                <div>
                  <Label htmlFor="additionalInfo" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Additional Information (Optional)
                  </Label>
                  <Textarea
                    id="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                    placeholder="Enter any additional notes, warnings, or helpful information..."
                    rows={4}
                    className="border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-lg resize-none"
                  />
                </div>

                {/* Media Upload Section */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">Photos & Videos (Optional)</Label>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={(e) => handleMediaUpload(e.target.files)}
                        className="hidden"
                        id="media-upload"
                        disabled={uploadingImages}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("media-upload")?.click()}
                        disabled={uploadingImages}
                        className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
                      >
                        <Upload className="h-4 w-4" />
                        {uploadingImages ? "Uploading..." : "Upload Photos & Videos"}
                      </Button>
                      <p className="text-sm text-gray-500">
                        Max 5MB for images, 50MB for videos. Supports JPG, PNG, MP4, MOV, WebM
                      </p>
                    </div>

                    {/* Display uploaded media */}
                    {formData.media.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {formData.media.map((mediaItem, index) => (
                          <div key={index} className="relative group">
                            {mediaItem.type === "image" ? (
                              <img
                                src={mediaItem.url || "/placeholder.svg"}
                                alt={`Upload ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                              />
                            ) : (
                              <div className="relative">
                                <video
                                  src={mediaItem.url}
                                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                  muted
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                                  <Video className="h-8 w-8 text-white" />
                                </div>
                              </div>
                            )}
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveMedia(mediaItem.url)}
                              className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={handleSaveIssue}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={saving || uploadingImages}
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save Issue"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={cancelEdit}
                    disabled={saving || uploadingImages}
                    className="px-8 py-3 border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors bg-transparent"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : selectedIssue ? (
            // Issue Details
            <div className="p-8 overflow-y-auto">
              <div className="mb-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">{selectedIssue.title}</h2>
                    <Badge
                      variant="outline"
                      className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300 px-4 py-1 text-sm font-medium"
                    >
                      {selectedIssue.category}
                    </Badge>
                  </div>
                </div>
                <Separator className="bg-gradient-to-r from-green-200 to-transparent" />
              </div>

              {/* Display media if available */}
              {selectedIssue.media && selectedIssue.media.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Reference Media
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedIssue.media.map((mediaItem, index) => (
                      <div key={index} className="group">
                        {mediaItem.type === "image" ? (
                          <img
                            src={mediaItem.url || "/placeholder.svg"}
                            alt={`Reference ${index + 1}`}
                            className="w-full h-48 object-cover rounded-xl border border-gray-200 group-hover:border-green-300 transition-colors shadow-lg group-hover:shadow-xl cursor-pointer"
                            onClick={() => window.open(mediaItem.url, "_blank")}
                          />
                        ) : (
                          <div className="relative">
                            <video
                              src={mediaItem.url}
                              controls
                              className="w-full h-48 object-cover rounded-xl border border-gray-200 group-hover:border-green-300 transition-colors shadow-lg group-hover:shadow-xl"
                              preload="metadata"
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-10">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Troubleshooting Steps
                </h3>
                <div className="space-y-6">
                  {selectedIssue.steps.map((step, index) => (
                    <div key={index} className="flex gap-6 group">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-lg group-hover:shadow-xl transition-shadow">
                        {index + 1}
                      </div>
                      <div className="flex-1 bg-gradient-to-r from-gray-50 to-white p-5 rounded-xl border border-gray-200 group-hover:border-green-200 transition-colors">
                        <p className="text-gray-800 leading-relaxed font-medium">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedIssue.additional_info && (
                <div className="bg-gradient-to-r from-green-50 to-white border border-green-200 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Additional Information
                  </h3>
                  <p className="text-gray-700 leading-relaxed font-medium">{selectedIssue.additional_info}</p>
                </div>
              )}
            </div>
          ) : (
            // No Issue Selected
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-green-50 to-white">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <Search className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Select an Issue</h3>
                <p className="text-gray-600 leading-relaxed">
                  Choose a troubleshooting issue from the list on the left to view detailed step-by-step instructions
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl border-2 border-green-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Settings className="h-3 w-3 text-white" />
              </div>
              Admin Access Required
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div>
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700 mb-2 block">
                Enter Admin Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handlePasswordSubmit()}
                placeholder="Enter password..."
                className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-lg"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handlePasswordSubmit}
                className="flex-1 h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Access Admin Mode
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPasswordModal(false)}
                className="h-12 px-6 border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
