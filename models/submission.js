const DataTypes = require('sequelize')

const sequelize = require('../lib/sequelize')
const { User } = require('./user')

const Submission = sequelize.define('submission', {
  assignmentId: { type: DataTypes.INTEGER, allowNull: false },
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  grade: { type: DataTypes.FLOAT, allowNull: false },
  file: { type: DataTypes.STRING, allowNull: false },
  timestamp: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('NOW()').toString() }
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