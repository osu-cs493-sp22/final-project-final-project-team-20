const { Router } = require('express')
const { ValidationError } = require('sequelize')
const { requireAuthentication } = require('../lib/auth')
const { Submission, SubmissionClientFields } = require('../models/submission')
const { User } = require('../models/user')

const router = Router()

/*
 * Route to return a list of submissions.
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

  const result = await Submission.findAndCountAll({
    limit: numPerPage,
    offset: offset
  })

  /*
   * Generate HATEOAS links for surrounding pages.
   */
  const lastPage = Math.ceil(result.count / numPerPage)
  const links = {}
  if (page < lastPage) {
    links.nextPage = `/submissions?page=${page + 1}`
    links.lastPage = `/submissions?page=${lastPage}`
  }
  if (page > 1) {
    links.prevPage = `/submissions?page=${page - 1}`
    links.firstPage = '/submissions?page=1'
  }

  /*
   * Construct and send response.
   */
  res.status(200).json({
    submissions: result.rows,
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
		const submission = await Submission.create(req.body, SubmissionClientFields)
		res.status(201).send({ id: submission.id })
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
router.get('/:submissionId', async function (req, res, next) {
  const submissionId = req.params.submissionId
  const submission = await Submission.findByPk(submissionId)
  if (submission) {
    res.status(200).send(submission)
  } else {
    next()
  }
})

/*
 * Route to update data for a course.
 */
router.put('/:submissionId', requireAuthentication,  async function (req, res, next) {
	const user = await User.findOne({where: {email: req.user}})
	if(req.user !== req.params.userId && user.role != 'admin'){
		res.status(403).send({
        err: "Unauthorized to access the specified resource"
    })
	}else{
	  const submissionId = req.params.submissionId
	  const result = await Submission.update(req.body, {
		where: { id: submissionId },
		fields: SubmissionClientFields
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
router.delete('/:submissionId', requireAuthentication, async function (req, res, next) {
	const user = await User.findOne({where: {email: req.user}})
	if(req.user !== req.params.userId && user.role != 'admin'){
		res.status(403).send({
            err: "Unauthorized to access the specified resource"
        })
	}else{
	  const submissionId = req.params.submissionId
	  const result = await Submission.destroy({ where: { id: submissionId }})
	  if (result > 0) {
		res.status(204).send()
	  } else {
		next()
	  }
	}
})

module.exports = router
