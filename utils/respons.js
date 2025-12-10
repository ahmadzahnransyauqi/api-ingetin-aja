class ResponseHelper {
  static success(res, data, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({
      status: "success",
      message,
      data,
    });
  }

  static created(res, data, message = "Created successfully") {
    return res.status(201).json({
      status: "success",
      message,
      data,
    });
  }

  static error(
    res,
    message = "An error occurred",
    statusCode = 500,
    errors = null
  ) {
    const response = {
      status: "error",
      message,
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  static notFound(res, message = "Resource not found") {
    return this.error(res, message, 404);
  }

  static unauthorized(res, message = "Unauthorized access") {
    return this.error(res, message, 401);
  }

  static forbidden(res, message = "Forbidden access") {
    return this.error(res, message, 403);
  }

  static badRequest(res, message = "Bad request", errors = null) {
    return this.error(res, message, 400, errors);
  }

  static validationError(res, errors) {
    return this.error(res, "Validation error", 422, errors);
  }

  static conflict(res, message = "Resource already exists") {
    return this.error(res, message, 409);
  }

  // Pagination response
  static paginated(res, data, pagination, message = "Success") {
    return res.status(200).json({
      status: "success",
      message,
      data,
      pagination,
    });
  }
}

module.exports = ResponseHelper;
