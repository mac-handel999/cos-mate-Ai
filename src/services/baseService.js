// Base service class
class Service {
  constructor() {
    this.errors = [];
  }

  validate(data, rules) {
    // Basic validation logic
    for (const [field, rule] of Object.entries(rules)) {
      if (rule.required && !data[field]) {
        this.errors.push(`${field} is required`);
      }
    }
    return this.errors.length === 0;
  }

  clearErrors() {
    this.errors = [];
  }
}

export default Service;