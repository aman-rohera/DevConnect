const validate = (schema) => (req, res, next) => {
  try {
    // Parse and validate the request components: body, query, and params
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    // If validation fails, return 400 Bad Request with details
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors.map((err) => ({
        field: err.path.join('.').replace(/^(body|query|params)\./, ''), // clean up path
        message: err.message,
      })),
    });
  }
};

export { validate };
