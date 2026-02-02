/**
 * Extract error message from various error formats
 * Handles Axios errors, API validation errors, and standard errors
 */
export function extractErrorMessage(error: unknown, defaultMessage = 'Произошла ошибка'): string {
  if (!error) {
    return defaultMessage;
  }

  // Handle Axios error response
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, any>;
    
    // Axios error with response
    if (err.response?.data) {
      const data = err.response.data;
      
      // FastAPI validation error format
      if (Array.isArray(data.detail)) {
        return data.detail.map((d: any) => d.msg).join(', ');
      }
      
      // Simple message format
      if (typeof data.detail === 'string') {
        return data.detail;
      }
      
      if (typeof data.message === 'string') {
        return data.message;
      }
    }
    
    // Standard Error object
    if (err.message && typeof err.message === 'string') {
      return err.message;
    }
  }

  // String error
  if (typeof error === 'string') {
    return error;
  }

  return defaultMessage;
}
