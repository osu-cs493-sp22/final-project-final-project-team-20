const { Router } = require('express')
const bcrypt = require('bcryptjs')

//const { courses } = require('../models/courses')
//const { assignments } = require('../models/assignments')

const { User, UserClientFields } = require('../models/user')
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
		if(req.body && req.body.userId && req.body.password){
			const user = await User.findByPk(req.body.userId)
			const authenticated = user && await bcrypt.compare(
				req.body.password, 
				user.password
			)
			if (authenticated) {
				const token = generateAuthToken(req.body.userId)
				res.status(200).send({ token: token })
			} else {
				res.status(401).send({
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
router.get('/:userId', requireAuthentication, async function (req, res, next) {
	const user = await User.findByPk(req.user)
	if(req.user !== req.params.userId && !user.admin){
		res.status(403).send({
            err: "Unauthorized to access the specified resource"
        })
	}else{
		const userId = req.params.userId
		const user = await User.findByPk(req.params.userId, {
			attributes: ['id', 'name', 'email', 'admin']	
		})
		res.status(200).json({
			users: user
		})
	}
})
module.exports = router
