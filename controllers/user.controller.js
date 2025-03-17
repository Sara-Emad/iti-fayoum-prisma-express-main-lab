


const fs = require('fs');
const prisma = require('../lib/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')


const register = async (req, res,next)=>{
	try{
		const {name,email,password} = req.body;
	const hashedPassword = await bcrypt.hash(password,10)
	console.log("🚀 ~ router.post ~ hashedPassword:", hashedPassword)
	const user = await prisma.user.create(
		{
			data: {name,email,password: hashedPassword}
		}
	)
	user.password = undefined;
	res.send(user)
	}catch(err){
		next(err)
	}
}

const login = async(req,res,next)=>{
	try{
		// email, password
		//1. email -> exists or not: user
		const {email, password} = req.body;
		const user = await prisma.user.findUnique({
			where: {email: email}
		})
		if(!user) throw new AppError('invalid credentials', 400)
		console.log("🚀 ~ router.post ~ user:", user)
		//2. password -> user.passworc
		const passwordCorrect = await bcrypt.compare(password, user.password);
		if(!passwordCorrect) throw new AppError('invalid credentials', 400)
		//3. success
	const token = jwt.sign({email: user.email},process.env.JWT_SECRET);
		res.send({token})
	}catch(err){
		next(err)
	}
}



const getAllUsers = async (req, res) => {
	const users = await prisma.user.findMany({
		include:{
			posts:{
				select:{
					title: true
				}
			}
		}
	}) 
	res.send(users)
}





module.exports = {login,register,getAllUsers}