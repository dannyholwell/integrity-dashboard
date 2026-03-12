export const getErrorMessage = (error, fallback = 'Unexpected error') => {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return fallback;
};
