import { supabase } from "./supabase"

export async function uploadImage(file: File, bucket = "troubleshooting-images"): Promise<string | null> {
  try {
    // Generate a unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    // Upload the file
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Error uploading image:", error)
      return null
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    console.error("Error uploading image:", error)
    return null
  }
}

export async function deleteImage(imageUrl: string, bucket = "troubleshooting-images"): Promise<boolean> {
  try {
    // Extract filename from URL
    const urlParts = imageUrl.split("/")
    const fileName = urlParts[urlParts.length - 1]

    const { error } = await supabase.storage.from(bucket).remove([fileName])

    if (error) {
      console.error("Error deleting image:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error deleting image:", error)
    return false
  }
}
