export default class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
  static badRequest(msg, details) { return new ApiError(400, msg, details); }
  static unauthorized(msg = 'Sign in to continue') { return new ApiError(401, msg); }
  static forbidden(msg = 'Your role does not have access to this area') { return new ApiError(403, msg); }
  static notFound(what = 'Record') { return new ApiError(404, `${what} not found`); }
  static conflict(msg) { return new ApiError(409, msg); }
}
