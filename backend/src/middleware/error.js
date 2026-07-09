const errorHandler = (err, req, res, next) => {
  let { statusCode, message, errors, isOperational } = err;

  // Default to 500 for unhandled errors
  if (!statusCode) {
    statusCode = 500;
  }
  if (!message) {
    message = 'An unexpected server error occurred';
  }

  // Log error (avoid logging passwords/tokens in production, this is a basic logger)
  if (!isOperational || statusCode >= 500) {
    console.error(`[Error] ${err.name}: ${err.message}`);
    if (process.env.NODE_ENV === 'development') {
      console.error(err.stack);
    }
  }

  const response = {
    success: false,
    message,
    ...(errors && { errors })
  };

  // Only expose stack in development for non-operational errors
  if (process.env.NODE_ENV === 'development' && !isOperational) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
