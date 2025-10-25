import { useState, useEffect } from 'react'
import { validateAndFormatStudentId, validateAndFormatStudentName } from '../utils/validation'

// Reusable validated input component
const ValidatedInput = ({ 
  type = 'text', 
  value, 
  onChange, 
  onValidationChange,
  placeholder, 
  disabled = false,
  label,
  id,
  required = true,
  validationType = 'studentId' // 'studentId' or 'studentName'
}) => {
  const [validation, setValidation] = useState({ isValid: true, message: '' })
  const [showValidation, setShowValidation] = useState(false)

  // Validate input in real-time
  useEffect(() => {
    if (value && value.length > 0) {
      let result
      if (validationType === 'studentId') {
        result = validateAndFormatStudentId(value)
      } else if (validationType === 'studentName') {
        result = validateAndFormatStudentName(value)
      }
      
      setValidation(result)
      if (onValidationChange) {
        onValidationChange(result)
      }
    } else {
      const emptyValidation = { isValid: !required, message: required ? `${label} is required` : '' }
      setValidation(emptyValidation)
      if (onValidationChange) {
        onValidationChange(emptyValidation)
      }
    }
  }, [value, required, label, validationType, onValidationChange])

  const handleInputChange = (e) => {
    const inputValue = e.target.value
    let formattedValue = inputValue

    // Auto-format based on validation type
    if (validationType === 'studentId') {
      // Convert to uppercase and remove invalid characters
      formattedValue = inputValue.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    } else if (validationType === 'studentName') {
      // Remove invalid characters but preserve case
      formattedValue = inputValue.replace(/[^A-Za-z\s\-'']/g, '')
    }

    onChange(formattedValue)
    setShowValidation(true)
  }

  const handleFocus = () => {
    setShowValidation(true)
  }

  const handleBlur = () => {
    setShowValidation(true)
  }

  return (
    <div className="validated-input-group">
      <label htmlFor={id} className="input-label">
        {label}
        {required && <span className="required-asterisk">*</span>}
      </label>
      <div className="input-container">
        <input
          type={type}
          id={id}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`validated-input ${!validation.isValid && showValidation ? 'invalid' : ''} ${validation.isValid && showValidation ? 'valid' : ''}`}
        />
        {validation.isValid && showValidation && value && (
          <span className="validation-icon valid">✓</span>
        )}
        {!validation.isValid && showValidation && (
          <span className="validation-icon invalid">✗</span>
        )}
      </div>
      {showValidation && validation.message && (
        <div className={`validation-message ${validation.isValid ? 'valid' : 'invalid'}`}>
          {validation.message}
        </div>
      )}
      {validationType === 'studentId' && (
        <div className="input-hint">
          Format: 3-20 characters, uppercase letters and numbers only
        </div>
      )}
      {validationType === 'studentName' && (
        <div className="input-hint">
          Format: 2-50 characters, letters, spaces, hyphens, and apostrophes only
        </div>
      )}
    </div>
  )
}

export default ValidatedInput
