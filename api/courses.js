const { Router } = require('express')
const { ValidationError } = require('sequelize')
const { requireAuthentication } = require('../lib/auth')
const { Course, CourseClientFields } = require('../models/course')
const { User } = require('../models/user')
const { Assignment } = require('../models/assignment')
const { Submission } = require('../models/submission')
const { Sequelize } = require('../lib/sequelize')
const {Parser} = require('json2csv');
const op = Sequelize.Op
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

/*
 * Route to fetch info about a specific course roster.
 */
router.get('/:courseId/roster',requireAuthentication, async function (req, res, next) {
  const user = await User.findOne({where: {email: req.user}})
  if(req.user !== req.params.userId && user.role != 'admin'){
    res.status(403).send({
            err: "Unauthorized to access the specified resource"
        })
  }else{
    const courseId = req.params.courseId
    const course = await Course.findByPk(courseId)
    if (course) {
      const fields = [{
        label: 'StudentID',
        value: 'id'
      }, {
        label: 'Name',
        value: 'name'
      }, {
        label: 'Email',
        value: 'email'
      }];
      const assignments = await Assignment.findAll({where: {courseId: courseId}})
      const assignmentIds = assignments.map(x => x.id)
      const submissions = await Submission.findAll({where: {assignmentId: { [op.in]: assignmentIds }}})
      const studenIds = submissions.map(x => x.studentId)
      const students = await User.findAll({where: {id: { [op.in]: studenIds }}})

      const parser = new Parser({fields});
      const csv = parser.parse(students);

      res.set('Content-Type', 'text/csv');
      res.status(200).send(csv);

    } else {
    next()
    }
  }
})

/*
 * Route to fetch info about a specific course students.
 */
router.get('/:courseId/students',requireAuthentication, async function (req, res, next) {
  const user = await User.findOne({where: {email: req.user}})
  if(req.user !== req.params.userId && user.role != 'admin'){
    res.status(403).send({
            err: "Unauthorized to access the specified resource"
        })
  }else{
    const courseId = req.params.courseId
    const course = await Course.findByPk(courseId)
    if (course) {
      const assignments = await Assignment.findAll({where: {courseId: courseId}})
      const assignmentIds = assignments.map(x => x.id)
      const submissions = await Submission.findAll({where: {assignmentId: { [op.in]: assignmentIds }}})
      const studenIds = submissions.map(x => x.studentId)
      const students = await User.findAll({where: {id: { [op.in]: studenIds }}})

      res.status(200).send({
        students: students
      });
    } else {
    next()
    }
  }
})

/*
 * Route to fetch info about a specific course assignments.
 */
router.get('/:courseId/assignments',requireAuthentication, async function (req, res, next) {
  const user = await User.findOne({where: {email: req.user}})
  if(req.user !== req.params.userId && user.role != 'admin'){
    res.status(403).send({
            err: "Unauthorized to access the specified resource"
        })
  }else{
    const courseId = req.params.courseId
    const course = await Course.findByPk(courseId)
    if (course) {
      const assignments = await Assignment.findAndCountAll({where: {courseId: courseId}})

      res.status(200).send({
        assignments: assignments
      });
    } else {
    next()
    }
  }
})


module.exports = router
