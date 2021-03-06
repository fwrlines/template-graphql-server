/* @fwrlines/generator-graphql-server-type 1.3.1 */
import { Sequelize, Model } from 'sequelize'
import bcrypt from 'bcrypt'

import { getTokenFor } from '../utils'

export default sequelize => {
  class User extends Model {

    /*
  static classLevelMethod() {
  }

  instanceLevelMethod() {
    return this.first_name
  }
  */
    canLogIn() {
      return this.get('isActive')
    }

    async setPassword(password) {
      this.passwordHash = await bcrypt.hash(password, 8)
      await this.save()
      return true
    }

    async isPasswordValid(password) {
      return await bcrypt.compare(password, this.passwordHash)
    }

    async getAuthToken() {
      return await getTokenFor(this)
    }

  }

  User.init({
    id:{
      type        :Sequelize.DataTypes.UUID,
      defaultValue:Sequelize.UUIDV4,
      allowNull   :false,
      primaryKey  :true,
    },
    email:{
      type    :Sequelize.DataTypes.STRING,
      unique  :true,
      validate:{
        isEmail:true
      },
    },
    emailVerified:{
      type        :Sequelize.DataTypes.BOOLEAN,
      allowNull   :false,
      defaultValue:false
    },
    firstName:{
      type:Sequelize.DataTypes.STRING
    },
    lastName:{
      type:Sequelize.DataTypes.STRING
    },
    username:{
      type  :Sequelize.DataTypes.STRING,
      unique:true
    },
    handle:{
      type  :Sequelize.DataTypes.STRING,
      unique:true
    },
    superuser:{
      type        :Sequelize.DataTypes.BOOLEAN,
      allowNull   :false,
      defaultValue:false
    },
    isActive:{
      type        :Sequelize.DataTypes.BOOLEAN,
      allowNull   :false,
      defaultValue:false
    },
    passwordHash:{
      type:Sequelize.DataTypes.STRING
    },

    onboardingStatus:{
      type        :Sequelize.DataTypes.INTEGER,
      defaultValue:0,
      allowNull   :false,
    },

    _string:{
      type:new Sequelize.DataTypes.VIRTUAL(Sequelize.DataTypes.STRING, ['email']),
      get :function() {
        return this.get('email')
      }
    },

  },{
    sequelize,
    modelName:'User',
    tableName:'users',
    updatedAt:'updatedAt',
    createdAt:'createdAt'
  //freezeTableName: true
  })
  
  User.associate = models => {
    //User.hasMany(models.OAuth2)
  }

  User.addHook('beforeValidate', 'lowercaseEmail', (item, options) => {
    if(item.email) {
      item.email = item.email.toLowerCase()
    }
  })
  
  //User.addHook('afterCreate', 'hookName', (e, options) => {})

  return User
}

