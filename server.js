const express = require('express')
const morgan = require('morgan')
const redis = require('redis')

const api = require('./api')
const sequelize = require('./lib/sequelize')

const app = express()
const port = process.env.PORT || 8000

/*
 * Rate Limiting; Redis
 */
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;

const redisClient = redis.createClient({url: `redis://${redisHost}:${redisPort}`})
//const redisClient = redis.createClient(redisHost, redisPort)

const rateLimitWindowMilliseconds = 60000;


async function rateLimit(req, res, next) {
	let user = req.ip
	let rateLimitWindowMaxRequest = 10;
	
	if(req.allowed){
		console.log("===USER ALLOWED")
		user = req.user
		rateLimitWindowMaxRequest = 30;
	}
	
	console.log("===USER: ", user);
	let tokenBucket
	try {
		tokenBucket = await redisClient.hGetAll(user)
	} catch (e) {
		next()
		return
	}
	console.log("== tokenBucket:", tokenBucket)
	tokenBucket = {
		tokens: parseFloat(tokenBucket.tokens) || rateLimitWindowMaxRequest,
		last: parseInt(tokenBucket.last) || Date.now()
	}
	console.log("== tokenBucket:", tokenBucket)

	  const now = Date.now()
	  const ellapsedMs = now - tokenBucket.last
	  tokenBucket.tokens += ellapsedMs * (rateLimitWindowMaxRequest / rateLimitWindowMilliseconds)
	  tokenBucket.tokens = Math.min(rateLimitWindowMaxRequest, tokenBucket.tokens)
	  tokenBucket.last = now

	if (tokenBucket.tokens >= 1) {
		tokenBucket.tokens -= 1
		await redisClient.hSet(user, [['tokens', tokenBucket.tokens], ['last', tokenBucket.last]])
		// await redisClient.hSet(user)
		next()
	} else {
		await redisClient.hSet(user, [['tokens', tokenBucket.tokens], ['last', tokenBucket.last]])
		// await redisClient.hSet(user)
		res.status(429).send({
			err: "Too many requests per minute"
		})
	}
}

app.use(rateLimit)
/*
 * Morgan is a popular logger.
 */
app.use(morgan('dev'))

app.use(express.json())
app.use(express.static('public'))

/*
 * All routes for the API are written in modules in the api/ directory.  The
 * top-level router lives in api/index.js.  That's what we include here, and
 * it provides all of the routes.
 */
app.use('/', api)

app.use('*', function (req, res, next) {
  res.status(404).json({
    error: "Requested resource " + req.originalUrl + " does not exist"
  })
})

/*
 * This route will catch any errors thrown from our API endpoints and return
 * a response with a 500 status to the client.
 */
app.use('*', function (err, req, res, next) {
  console.error("== Error:", err)
  res.status(500).send({
      error: "Server error.  Please try again later."
  })
})
sequelize.sync().then(function () {
	redisClient.connect().then(function () {
		app.listen(port, function () {
			console.log("== Server is listening on port:", port)
		})
	})
})

