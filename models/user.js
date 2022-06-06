const DataTypes = require('sequelize')

const sequelize = require('../lib/sequelize')
const bcrypt = require('bcryptjs')

const User = sequelize.define('user', {
    name: { type: DataTypes.TEXT, allowNull: false },
    email: { type: DataTypes.TEXT, allowNull: false },
    password:{ 
        type: DataTypes.TEXT, 
        allowNull: false,
        set(value){
            this.setDataValue('password', bcrypt.hashSync(value, 8))
        }
    },
    role:{ 
        type: DataTypes.STRING, 
        allowNull: false,
        defaultValue: 'student'
    }
})

exports.User = User
exports.UserClientFields = [
  'name',
  'email',
  'password',
  'role'
]