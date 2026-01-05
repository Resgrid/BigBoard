export interface ApiResponse<T = unknown> {
  Data: T;
  Status: number;
  StatusText: string;
}
