import { clsx, type ClassValue } from "clsx"
import { toast } from "sonner"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to handle file selection and convert to Base64
export const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, fieldChange: (value: string) => void) => {
  const file = event.target.files?.[0]
  if (file) {
    // Basic validation for .docx extension
    if (!file.name.endsWith('.docx')) {
      toast.error('Please upload a .docx file.')
      fieldChange('') // Clear the field if not a docx
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(file) // Reads the file as a data URL (Base64)
    reader.onload = () => {
      const base64String = reader.result as string
      // Data URL format is "data:MIME_TYPE;base64,BASE64_ENCODED_DATA"
      // We only need the BASE64_ENCODED_DATA part
      const base64Only = base64String.split(',')[1]
      fieldChange(base64Only) // Update the form field with the Base64 string
    }
    reader.onerror = (error) => {
      console.error('Error reading file:', error)
      toast.error('Failed to read file content.')
      fieldChange('')
    }
  } else {
    fieldChange('') // Clear field if no file selected
  }
}