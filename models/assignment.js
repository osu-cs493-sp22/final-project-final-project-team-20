const DataTypes = require('sequelize')
const moment = require('moment')

const sequelize = require('../lib/sequelize')
const { Submission } = require('./submission')

const Assignment = sequelize.define('assignment', {
	courseId: { type: DataTypes.INTEGER, allowNull: false },
	title: { type: DataTypes.TEXT, allowNull: false },
	points: { type: DataTypes.INTEGER, allowNull: false },
	due: { 
		type: DataTypes.DATE, 
		allowNull: true,
		defaultValue: null,
		set(value){
			if(value == null)
				return null;
			else
				this.setDataValue('due', moment(value).format('YYYY-MM-DD HH:mm:ss'))
        },
		get(){
			if(this.getDataValue('due') != null){
				const rawValue = moment(this.getDataValue('due')).defaultFormat;
				console.log("====RETURNTIMESTAMP: ", rawValue)
				return rawValue;
			}
			else
				return null;
		}
	}
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
  'due' //Time format is ISO 8601 (2022-06-14T17:00:00-07:00 is Jun 15, 2022, 12:00:00 AM [UTC])
]