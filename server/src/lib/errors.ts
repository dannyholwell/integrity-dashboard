export const getErrorMessage = (error: unknown, fallback = 'Unexpected error') => {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}
