const { Router } = require('express')
const bcrypt = require('bcryptjs')

//const { courses } = require('../models/courses')
//const { assignments } = require('../models/assignments')

const { User, UserClientFields } = require('../models/user')
const { Course } = require('../models/course')
const { generateAuthToken, requireAuthentication, optionalAuthentication } = require("../lib/auth")
const { ValidationError } = require('sequelize')

const router = Router()

//CREATE USER
router.post('/', optionalAuthentication, async function (req,res, next){
	
	try {
		if(req.body.admin){
			if(req.allowed){
				const user = await User.create(req.body, UserClientFields)
				res.status(201).send({ id: user.id })
			}else{
				res.status(401).send({
					err: "Invalid authentication token"
				})
			}
		}
		else{
			const user = await User.create(req.body, UserClientFields)
			res.status(201).send({ id: user.id })
		}
	} catch (e) {
		if (e instanceof ValidationError) {
			res.status(400).send({ error: e.message })
		} else {
			throw e
		}
	}
})

//USERS LOGIN
router.post('/login', async function (req, res, next){
	
	try {
		if(req.body && req.body.email && req.body.password){
			const user = await User.findOne({where: {email: req.body.email}})
			if(user){
				const authenticated = user && await bcrypt.compare(
					req.body.password, 
					user.password
				)
				if (authenticated) {
					const token = generateAuthToken(req.body.email)
					res.status(200).send({ token: token })
				} else {
					res.status(401).send({
					error: "Invalid credentials"
					})
				}
			}
			else{
				res.status(401).json({
				error: "Invalid credentials"
			})
			}
		}
		else{
			res.status(400).json({
				error: "Request Body Needs userID and password."
			})
		}
		
	} catch (e) {
		if (e instanceof ValidationError) {
			res.status(401).send({ error: e.message })
		} else {
			throw e
		}
	}
})

//Show user NO PASSWORD
router.get('/:email', requireAuthentication, async function (req, res, next) {
	const currUser = await User.findOne({where: {email: req.user}})
	if(req.user !== req.params.email && currUser.role != 'admin'){
		res.status(403).send({
            err: "Unauthorized to access the specified resource"
        })
	}else{
		const user = await User.findOne({where: {email: req.params.email}})
		if(user.role == 'instructor'){
			console.log("===INSTRUCTOR")
			const user = await User.findOne( {where: {email: req.params.email},
				attributes: ['id', 'name', 'email', 'role']
			})
		}
		else if( user.role == 'student'){
			console.log("===STUDENT")
			const user = await User.findOne( {where: {email: req.params.email},
				attributes: ['id', 'name', 'email', 'role']	
			})			
		}
		else if( user.role == 'admin'){
			console.log("===ADMIN")
			const user = await User.findOne( {where: {email: req.params.email},
				attributes: ['id', 'name', 'email', 'role']	
			})
		}
		else{
			console.log("===BAD ROLE")
			res.status(500).send({
            err: "role unauthorized to have"
			})
		}
		res.status(200).json({
			users: user
		})
	}
})
module.exports = router
