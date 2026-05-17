export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ApiError {
  status: number;
  title: string;
  detail: string;
  fieldErrors?: { [key: string]: string };
  timestamp: string;
}

export interface SelectOption {
  label: string;
  value: any;
}
