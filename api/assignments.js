const { Router } = require('express')
const { ValidationError } = require('sequelize')
const { requireAuthentication } = require('../lib/auth')
const { Assignment, AssignmentClientFields } = require('../models/assignment')
const { Submission, SubmissionClientFields } = require('../models/submission')
const { User } = require('../models/user')
const multer = require('multer')
const crypto = require('crypto')

const router = Router()

const upload = multer({
  storage: multer.diskStorage({
    destination: `${__dirname}/uploads`,
    filename: (req, file, callback) => {
      const filename = crypto.pseudoRandomBytes(16).toString('hex')
      callback(null, `${filename}`)
    }})
})

/*
 * Route to return a list of courses.
 */
router.get('/', async function (req, res) {
  /*
   * Compute page number based on optional query string parameter `page`.
   * Make sure page is within allowed bounds.
   */
  let page = parseInt(req.query.page) || 1
  page = page < 1 ? 1 : page
  const numPerPage = 10
  const offset = (page - 1) * numPerPage

  const result = await Assignment.findAndCountAll({
    limit: numPerPage,
    offset: offset
  })

  /*
   * Generate HATEOAS links for surrounding pages.
   */
  const lastPage = Math.ceil(result.count / numPerPage)
  const links = {}
  if (page < lastPage) {
    links.nextPage = `/assignments?page=${page + 1}`
    links.lastPage = `/assignments?page=${lastPage}`
  }
  if (page > 1) {
    links.prevPage = `/assignments?page=${page - 1}`
    links.firstPage = '/assignments?page=1'
  }

  /*
   * Construct and send response.
   */
  res.status(200).json({
    assignments: result.rows,
    pageNumber: page,
    totalPages: lastPage,
    pageSize: numPerPage,
    totalCount: result.count,
    links: links
  })
})

/*
 * Route to create a new course.
 */
router.post('/', requireAuthentication, async function (req, res, next) {
	const user = await User.findOne({where: {email: req.user}})
	if(req.user !== req.params.userId && user.role != 'admin'){
		res.status(403).send({
            err: "Unauthorized to access the specified resource"
        })
	}else{
	  try {
		const assignment = await Assignment.create(req.body, AssignmentClientFields)
		res.status(201).send({ id: assignment.id })
	  } catch (e) {
		if (e instanceof ValidationError) {
		  res.status(400).send({ error: e.message })
		} else {
		  throw e
		}
	  }
	}
})

/*
 * Route to fetch info about a specific course.
 */
router.get('/:assignmentId', async function (req, res, next) {
  const assignmentId = req.params.assignmentId
  const assignment = await Assignment.findByPk(assignmentId)
  if (assignment) {
    res.status(200).send(assignment)
  } else {
    next()
  }
})

/*
* Route to get submissions for a specific assignment
*/
router.get('/:assignmentId/submissions', async function (req, res, next) {
  const assignmentId = req.params.assignmentId
  const assignment = await Assignment.findByPk(assignmentId)
  if (assignment) {
    const submissions = await Submission.findAll({where: {assignmentId: assignmentId}})
    if (submissions) {
      res.status(200).send(submissions)
    }
    else {
      next()
    }
  }
  else {
    next()
  }
})

/*
* Route to post a submission for a specific assignment
*/
router.post('/:assignmentId/submissions', upload.single('file'), requireAuthentication, async function (req, res, next) {
  const user = await User.findOne({where: {email: req.user}})
  const studentId = user.id
  if(req.user !== req.params.userId && !(user.role == 'student' || user.role == 'admin')){
		res.status(403).send({
            err: "Unauthorized to access the specified resource"
        })
	}
  else {
    const assignmentId = req.params.assignmentId
    const assignment = await Assignment.findByPk(assignmentId)
    if (assignment) {
      const submission = await Submission.create({studentId: studentId, assignmentId: assignmentId, grade: "NOT YET GRADED", file: `submissions/${assignmentId}/${studentId}+${this.id}`}, SubmissionClientFields)
      res.status(201).send({ link: `/submissions/${submisison.id}` })
    }
    else {
      next()
    }
  }
})

/*
 * Route to update data for a course.
 */
router.put('/:assignmentId', requireAuthentication,  async function (req, res, next) {
	const user = await User.findOne({where: {email: req.user}})
	if(req.user !== req.params.userId && user.role != 'admin'){
		res.status(403).send({
            err: "Unauthorized to access the specified resource"
        })
	}else{
	  const assignmentId = req.params.assignmentId
	  const result = await Assignment.update(req.body, {
		where: { id: assignmentId },
		fields: AssignmentClientFields
	  })
	  if (result[0] > 0) {
		res.status(204).send()
	  } else {
		next()
	  }
	}
})

/*
 * Route to delete a course.
 */
router.delete('/:assignmentId', requireAuthentication, async function (req, res, next) {
	const user = await User.findOne({where: {email: req.user}})
	if(req.user !== req.params.userId && user.role != 'admin'){
		res.status(403).send({
            err: "Unauthorized to access the specified resource"
        })
	}else{
	  const assignmentId = req.params.assignmentId
	  const result = await Assignment.destroy({ where: { id: assignmentId }})
	  if (result > 0) {
		res.status(204).send()
	  } else {
		next()
	  }
	}
})

module.exports = router
