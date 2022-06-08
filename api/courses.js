const { Router } = require('express')
const { ValidationError } = require('sequelize')
const { requireAuthentication } = require('../lib/auth')
const { Course, CourseClientFields } = require('../models/course')
const { User } = require('../models/user')
const { Assignment } = require('../models/assignment')
const { Submission } = require('../models/submission')

const router = Router()

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

  const result = await Course.findAndCountAll({
    limit: numPerPage,
    offset: offset
  })

  /*
   * Generate HATEOAS links for surrounding pages.
   */
  const lastPage = Math.ceil(result.count / numPerPage)
  const links = {}
  if (page < lastPage) {
    links.nextPage = `/courses?page=${page + 1}`
    links.lastPage = `/courses?page=${lastPage}`
  }
  if (page > 1) {
    links.prevPage = `/courses?page=${page - 1}`
    links.firstPage = '/courses?page=1'
  }

  /*
   * Construct and send response.
   */
  res.status(200).json({
    courses: result.rows,
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
		const course = await Course.create(req.body, CourseClientFields)
		res.status(201).send({ id: course.id })
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
router.get('/:courseId', async function (req, res, next) {
  const courseId = req.params.courseId
  const course = await Course.findByPk(courseId)
  if (course) {
    res.status(200).send(course)
  } else {
    next()
  }
})

/*
 * Route to update data for a course.
 */
router.put('/:courseId', requireAuthentication,  async function (req, res, next) {
	const user = await User.findOne({where: {email: req.user}})
	if(req.user !== req.params.userId && user.role != 'admin'){
		res.status(403).send({
            err: "Unauthorized to access the specified resource"
        })
	}else{
	  const courseId = req.params.courseId
	  const result = await Course.update(req.body, {
		where: { id: courseId },
		fields: CourseClientFields
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
router.delete('/:courseId', requireAuthentication, async function (req, res, next) {
	const user = await User.findOne({where: {email: req.user}})
	if(req.user !== req.params.userId && user.role != 'admin'){
		res.status(403).send({
            err: "Unauthorized to access the specified resource"
        })
	}else{
	  const courseId = req.params.courseId
	  const result = await Course.destroy({ where: { id: courseId }})
	  if (result > 0) {
		res.status(204).send()
	  } else {
		next()
	  }
	}
})

module.exports = router
