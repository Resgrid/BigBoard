import type { BaseV4Request } from '@/models/v4/baseV4Request';

/**
 * Common interface for API responses that extend BaseV4Request
 * This helps TypeScript understand the structure of API responses
 */
export interface ApiResponse<T = unknown> extends BaseV4Request {
  Data: T;
}

/**
 * Type helper for API responses with message property
 */
export interface ApiResponseWithMessage<T = unknown> extends BaseV4Request {
  Data: T;
  Message?: string;
}

/**
 * Type guard to check if a response has Data property
 */
export function hasDataProperty<T>(response: unknown): response is ApiResponse<T> {
  return typeof response === 'object' && response !== null && 'Data' in response;
}

/**
 * Type guard to check if a response has Message property
 */
export function hasMessageProperty(response: unknown): response is { Message: string } {
  return typeof response === 'object' && response !== null && 'Message' in response;
}
