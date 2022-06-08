const { Router } = require('express')
const bcrypt = require('bcryptjs')

//const { courses } = require('../models/courses')
//const { assignments } = require('../models/assignments')

const { User, UserClientFields } = require('../models/user')
const { Course } = require('../models/course')
const { generateAuthToken, requireAuthentication, optionalAuthentication } = require("../lib/auth")
const { ValidationError } = require('sequelize')
const { Assignment } = require('../models/assignment')
const { Submission } = require('../models/submission')
const { Sequelize } = require('../lib/sequelize')
const op = Sequelize.Op

const router = Router()

//CREATE USER
router.post('/', optionalAuthentication, async function (req,res, next){
	
	try {
		if(req.body.role == 'admin' || req.body.role == 'instructor'){
			if(req.allowed){
				const user = await User.create(req.body, UserClientFields)
				res.status(201).send({ id: user.id })
			}else{
				res.status(401).send({
					err: "Unauthorized to create this user"
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
			
			const retUser = await User.findOne( {where: {email: req.params.email},
				attributes: ['id', 'name', 'email', 'role'],
				include: [
					{
						model: Course,
						where: {instructorId: user.id}
					}
				]
			})
			res.status(200).json({
				user: retUser
			})
		}
		else if( user.role == 'student'){
			console.log("===STUDENT")
			const submissions = await Submission.findAll({where: {studentId: user.id}})
			const assignmentIds = submissions.map(x => x.assignmentId) 
			const assignments = await Assignment.findAll({where: {id: { [op.in]: assignmentIds }}})
			const courseIds = assignments.map(x => x.courseId)
			const courses = await Course.findAll({where: {id: {[op.in]: courseIds}}})
			const retUser = await User.findOne( {where: {email: req.params.email},
				attributes: ['id', 'name', 'email', 'role']
			})
			retUser.setDataValue('courses', courses)
			res.status(200).json({
				user: retUser
			})
		}
		else if( user.role == 'admin'){
			console.log("===ADMIN")
			const retUser = await User.findOne( {where: {email: req.params.email},
				attributes: ['id', 'name', 'email', 'role']	
			})
			res.status(200).json({
				user: retUser
			})
		}
		else{
			console.log("===BAD ROLE")
			res.status(500).send({
            err: "role unauthorized to have"
			})
		}
	}
})
module.exports = router
