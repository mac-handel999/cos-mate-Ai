// Utility functions for COS MATE

export class Logger {
  static info(message, data = null) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data ? data : '');
  }

  static error(message, error = null) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error ? error : '');
  }

  static warn(message, data = null) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data ? data : '');
  }
}

export class Validator {
  static isEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  static isRequired(value) {
    return value !== null && value !== undefined && value !== '';
  }

  static minLength(value, min) {
    return value && value.length >= min;
  }
}

export class Response {
  static success(res, data = null, message = 'Success', status = 200) {
    const response = { success: true, message };
    if (data !== null) response.data = data;
    return res.status(status).json(response);
  }

  static error(res, message = 'Error occurred', status = 500, details = null) {
    const response = { success: false, message };
    if (details) response.details = details;
    return res.status(status).json(response);
  }
}

export class Pagination {
  static parse(req) {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
  }

  static getPaginationMetadata(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    return {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }
}