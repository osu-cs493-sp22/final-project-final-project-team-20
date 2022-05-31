const { DataTypes } = require('sequelize')

const sequelize = require('../lib/sequelize')
const { Course } = require('./course')
const { Assignment } = require('./assignment')
const { User } = require('./user')

const Submission = sequelize.define('submission', {
  assignmentId: { type: DataTypes.INTEGER, allowNull: false },
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  grade: { type: DataTypes.FLOAT, allowNull: false },
  file: { type: DataTypes.STRING, allowNull: false },
  timestamp: { 
		type: DataTypes.DATE, 
		allowNull: false,
		defaultValue: Sequelize.NOW
	}
})

/*
* Set up one-to-many relationship between Submission and User.
*/
Submission.belongsTo(User)
User.hasMany(Submission, { foreignKey: { allowNull: false } })

exports.Submission = Submission

/*
 * Export an array containing the names of fields the client is allowed to set
 * on businesses.
 */
exports.SubmissionClientFields = [
  'assignmentId',
  'studentId',
  'grade',
  'file',
  'timestamp'
]
