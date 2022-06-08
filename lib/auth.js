const jwt = require('jsonwebtoken')

const secret = "SuperSecret"

function generateAuthToken(id) {
    const payload = { sub: id }
    return jwt.sign(payload, secret, { expiresIn: '24h' })
}
exports.generateAuthToken = generateAuthToken


function requireAuthentication(req, res, next) {
    const authHeader = req.get('authorization') || ''
    const authParts = authHeader.split(' ')
    const token = authParts[0] === 'Bearer' ? authParts[1] : null

    try {
        const payload = jwt.verify(token, secret)
        //console.log("== payload:", payload)
        req.user = payload.sub
		//console.log("== user:", payload.sub)
		req.allowed = 1
        next()
    } catch (err) {
		req.allowed = 0
        res.status(401).send({
            err: "Invalid authentication token"
        })
    }
}
exports.requireAuthentication = requireAuthentication

function optionalAuthentication(req, res, next) {
    const authHeader = req.get('authorization') || ''
    const authParts = authHeader.split(' ')
    const token = authParts[0] === 'Bearer' ? authParts[1] : null

    try {
        const payload = jwt.verify(token, secret)
        //console.log("== payload:", payload)
        req.user = payload.sub
		req.allowed = 1
    } catch (err) {
        req.allowed = 0
    }
	next()
}
exports.optionalAuthentication = optionalAuthentication