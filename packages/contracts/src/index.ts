export { healthResponseSchema, type HealthResponse } from './health/dto/health-response.dto.js';
export { registerRequestSchema, type RegisterRequest } from './auth/dto/register-request.dto.js';
export { logInRequestSchema, type LogInRequest } from './auth/dto/log-in-request.dto.js';
export { userResponseSchema, type UserResponse } from './auth/dto/user-response.dto.js';
export {
  errorResponseSchema,
  type ErrorCode,
  type ErrorResponse,
} from './errors/dto/error-response.dto.js';
