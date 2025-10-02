// API Response Models
export class BaseApiResponse {
  constructor(data = {}) {
    this.success = data.success || false;
    this.data = data.data || null;
    this.message = data.message || "";
    this.error = data.error || null;
  }
}

export class PaginationMeta {
  constructor(data = {}) {
    this.page = data.page || 1;
    this.limit = data.limit || 10;
    this.total = data.total || 0;
    this.totalPages = data.totalPages || 0;
    this.hasNext = data.hasNext || false;
    this.hasPrev = data.hasPrev || false;
  }
}
