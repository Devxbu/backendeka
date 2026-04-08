class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.success = `${statusCode}`.startsWith("2");
    this.code = statusCode;
    this.message = message;
    this.data = data;
  }

  static success(data, message = "Success") {
    return new ApiResponse(200, data, message);
  }

  static created(data, message = "Created") {
    return new ApiResponse(201, data, message);
  }
}

module.exports = ApiResponse;
