// Base controller with common methods
class Controller {
  success(res, data = null, message = 'Success', status = 200) {
    const response = { success: true, message };
    if (data !== null) response.data = data;
    return res.status(status).json(response);
  }

  error(res, message = 'Error occurred', status = 500, details = null) {
    const response = { success: false, message };
    if (details) response.details = details;
    return res.status(status).json(response);
  }

  paginate(req) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    return { page, limit, skip };
  }
}

export default Controller;