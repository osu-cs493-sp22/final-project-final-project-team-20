const DataTypes = require('sequelize')
const moment = require('moment')

const sequelize = require('../lib/sequelize')
const { User } = require('./user')

const Submission = sequelize.define('submission', {
	assignmentId: { type: DataTypes.INTEGER, allowNull: false },
	studentId: { type: DataTypes.INTEGER, allowNull: false },
	grade: { type: DataTypes.FLOAT, allowNull: false },
	file: { type: DataTypes.STRING, allowNull: false },
	timestamp: { 
		type: DataTypes.DATE, 
		allowNull: false, 
		defaultValue: moment().format('YYYY-MM-DD HH:mm:ss'),
		set(value){
				this.setDataValue('timestamp', moment(value).format('YYYY-MM-DD HH:mm:ss'))
        },
		get(){
			const rawValue = moment(this.getDataValue('timestamp')).defaultFormat;
			console.log("====RETURNTIMESTAMP: ", rawValue)
			return rawValue;
		}
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