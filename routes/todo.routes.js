const express = require('express');
const fs = require('fs');
const path = require('path')
const router = express.Router();
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// verficiation step
const verifyUser = async (req,res,next)=>{
	try{
		// receive token and extract it
	const token = req.headers.authorization.split(' ')[1]
		// verify the token using jwt
	const payload = jwt.verify(token,process.env.JWT_SECRET)
		// get the user from the database
	const user  = await prisma.user.findUnique({
		where : {email: payload.email}
	})
	req.user = user
	// append the user to the request object
	next()
	}catch(err){
		next(err)
	}
}

router.use(verifyUser)





router.get('/', (req, res) => {
	console.log("user inside get request",req.user)
	const data = fs.readFileSync('db.json',{encoding:'utf-8'})
	res.send(JSON.parse(data))
})




router.post('/',(req, res)=>{
	const filePath  = path.join(__dirname,'hamada.json')
	const dataString = fs.readFileSync(filePath,{encoding:'utf-8'});
	const data = JSON.parse(dataString)
	const newTodo = req.body;
	console.log("🚀 ~ router.post ~ newTodo:", newTodo)
	data.push(newTodo)
	console.log("🚀 ~ router.post ~ data:", data)
	fs.writeFileSync(filePath,JSON.stringify(data,null,2))
	res.send('success')
})

router.get('/:id',()=>{})

router.delete('/:id',(req,res)=>{
	console.log("params",req.params)
	res.send('deleted')
})
router.put('/:id',()=>{})





module.exports = router;
