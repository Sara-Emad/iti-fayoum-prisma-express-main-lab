const express = require('express');

const router = express.Router();
const AppError = require('../utils/AppError');
const Joi = require('joi')
const userController = require('../controllers/user.controller')


const registerSchema = Joi.object({
	name:Joi.string().required(),
	email:Joi.string().required(),
	password: Joi.string().required(),
})
const validate = (req,res,next)=>{
	const {error} = registerSchema.validate(req.body,{
		abortEarly: false
	})

	if(error){
		return next(new AppError(error.details[0].message, 400 , error.details))
	}
  next();
}
router.post('/',validate, userController.register)

// login
router.post('/login',userController.login)

// users
router.get('/',userController.login )




module.exports = router;