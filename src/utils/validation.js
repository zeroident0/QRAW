// Input validation utilities for ClassPass
// These match the database constraints exactly

// Student ID validation: ^[A-Z0-9]{3,20}$
export const validateStudentId = (studentId) => {
  if (!studentId) return { isValid: false, message: 'Student ID is required' }
  
  const trimmed = studentId.trim()
  if (trimmed.length < 3) return { isValid: false, message: 'Student ID must be at least 3 characters' }
  if (trimmed.length > 20) return { isValid: false, message: 'Student ID must be no more than 20 characters' }
  
  const regex = /^[A-Z0-9]{3,20}$/
  if (!regex.test(trimmed)) {
    return { 
      isValid: false, 
      message: 'Student ID must contain only uppercase letters (A-Z) and numbers (0-9)' 
    }
  }
  
  return { isValid: true, message: '' }
}

// Student name validation: ^[A-Za-z\s\-'']{2,50}$
export const validateStudentName = (studentName) => {
  if (!studentName) return { isValid: false, message: 'Student name is required' }
  
  const trimmed = studentName.trim()
  if (trimmed.length < 2) return { isValid: false, message: 'Student name must be at least 2 characters' }
  if (trimmed.length > 50) return { isValid: false, message: 'Student name must be no more than 50 characters' }
  
  const regex = /^[A-Za-z\s\-'']{2,50}$/
  if (!regex.test(trimmed)) {
    return { 
      isValid: false, 
      message: 'Student name can only contain letters, spaces, hyphens, and apostrophes' 
    }
  }
  
  return { isValid: true, message: '' }
}

// Format student ID input (convert to uppercase, remove invalid characters)
export const formatStudentId = (input) => {
  // Remove all non-alphanumeric characters and convert to uppercase
  return input.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
}

// Format student name input (remove invalid characters)
export const formatStudentName = (input) => {
  // Keep only letters, spaces, hyphens, and apostrophes
  return input.replace(/[^A-Za-z\s\-'']/g, '')
}

// Real-time validation with formatting
export const validateAndFormatStudentId = (input) => {
  const formatted = formatStudentId(input)
  const validation = validateStudentId(formatted)
  return {
    formatted,
    ...validation
  }
}

export const validateAndFormatStudentName = (input) => {
  const formatted = formatStudentName(input)
  const validation = validateStudentName(formatted)
  return {
    formatted,
    ...validation
  }
}
