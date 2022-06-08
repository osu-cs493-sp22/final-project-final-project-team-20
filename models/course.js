const DataTypes = require('sequelize')

const sequelize = require('../lib/sequelize')
const { Assignment } = require('./assignment')
const { User } = require('./user')

const Course = sequelize.define('course', {
	instructorId: { type: DataTypes.INTEGER, allowNull: false },
	subject: { type: DataTypes.TEXT, allowNull: false, 
		set(value){
		this.setDataValue('subject', value.toUpperCase())
		}
	},
	number: { type: DataTypes.INTEGER, allowNull: false },
	title: { type: DataTypes.TEXT, allowNull: false },
	term: { type: DataTypes.TEXT, allowNull: false }
})

/*
* Set up one-to-many relationship between Course and Assignment.
*/
Course.hasMany(Assignment, { 
	foreignKey: { allowNull: false },
	onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
	})
Assignment.belongsTo(Course)

/*
* Set up one-to-many relationship between Course and Instructor.
*/
Course.belongsTo(User)
User.hasMany(Course, { 
	foreignKey: { name: 'instructorId', allowNull: false },
	onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
	})

exports.Course = Course

/*
 * Export an array containing the names of fields the client is allowed to set
 * on businesses.
 */
exports.CourseClientFields = [
  'instructorId',
  'subject',
  'number',
  'title',
  'term',
]