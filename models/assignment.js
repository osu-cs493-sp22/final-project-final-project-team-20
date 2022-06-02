const DataTypes = require('sequelize')

const sequelize = require('../lib/sequelize')
const { Submission } = require('./submission')

const Assignment = sequelize.define('assignment', {
  courseId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.TEXT, allowNull: false },
  points: { type: DataTypes.INTEGER, allowNull: false },
  due: { type: DataTypes.DATE, allowNull: false }
})

/*
* Set up one-to-many relationship between Assignment and Submission.
*/
Submission.belongsTo(Assignment)
Assignment.hasMany(Submission, { foreignKey: { allowNull: false } })

exports.Assignment = Assignment

/*
 * Export an array containing the names of fields the client is allowed to set
 * on businesses.
 */
exports.AssignmentClientFields = [
  'courseId',
  'title',
  'points',
  'due'
]