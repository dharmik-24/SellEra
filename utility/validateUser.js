import Joi from "joi";

const userValidationSchema = Joi.object({
  name: Joi.string().min(3).required().messages({
    "string.min": "Name should have at least 3 characters",
    "any.required": "Name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Invalid email format",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password should have at least 6 characters",
    "any.required": "Password is required",
  }),
  image: Joi.object({
    data: Joi.binary(),
    contentType: Joi.string(),
  }).optional(),
  cart: Joi.array().items(Joi.string().hex().length(24)).optional(),
  orderHistory: Joi.array().items(Joi.string().hex().length(24)).optional(),
  review: Joi.array().items(Joi.string().hex().length(24)).optional(),
});

export default userValidationSchema;
