export const rules = {
  required: (value, message = 'This field is required') => {
    if (value === null || value === undefined || String(value).trim() === '') return message;
    return null;
  },
  email: (value, message = 'Enter a valid email address') => {
    if (!value) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim()) ? null : message;
  },
  phone: (value, message = 'Enter a valid 10-digit phone number') => {
    if (!value) return null;
    return /^[6-9]\d{9}$/.test(String(value).replace(/\D/g, '')) ? null : message;
  },
  minLength: (min, message) => (value) => {
    if (!value) return null;
    return String(value).trim().length >= min ? null : message || `Minimum ${min} characters required`;
  },
};

export const validateForm = (schema) => {
  const errors = {};
  Object.entries(schema).forEach(([field, { value, validators = [] }]) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  });
  return errors;
};

export const firstError = (errors) => Object.values(errors)[0] || null;
