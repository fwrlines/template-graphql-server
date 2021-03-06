/* @fwrlines/generator-graphql-server-type 1.3.1 */
import { Sequelize, Model } from 'sequelize'

export default (sequelize) => {
  class Profile extends Model {
  }

  Profile.init({
    id:{
      type        :Sequelize.DataTypes.UUID,
      defaultValue:Sequelize.UUIDV4,
      allowNull   :false,
      primaryKey  :true,
    },
    /*
    accessToken:{
      type:Sequelize.DataTypes.STRING
    },
    */
    refreshToken:{
      type:Sequelize.DataTypes.STRING
    },
    picture:{
      type:Sequelize.DataTypes.TEXT
    },
    provider:{
      type:Sequelize.DataTypes.STRING
    },
    scope:{
      type:Sequelize.DataTypes.STRING
    },
    locale:{
      type:Sequelize.DataTypes.STRING
    },
    name:{
      type:Sequelize.DataTypes.STRING
    },
    email:{
      type:Sequelize.DataTypes.STRING
    },
    emailVerified:{
      type        :Sequelize.DataTypes.BOOLEAN,
      defaultValue:false
    },
    expires:{
      type:Sequelize.DataTypes.DATE
    },

    _string:{
      type:new Sequelize.DataTypes.VIRTUAL(Sequelize.DataTypes.STRING, ['provider', 'email', 'id']),
      get :function() {
        return this.get('email') ?
          `${this.get('provider')}/${this.get('email')}` :
          `${this.get('provider')}/${this.get('id').slice(8)}`
      }
    },
  

  },{
    sequelize,
    modelName:'OAuth2Profile',
    tableName:'oauth2_profiles',
    updatedAt:'updatedAt',
    createdAt:'createdAt'
  //freezeTableName: true
  })

  Profile.associate = models => {
    //reverse association to keep this package independent from auth
    models.User.hasMany(Profile, {
      as        :'oAuth2Profiles',
      targetKey :'id',
      foreignKey:{
        name:'userId',
        type:Sequelize.DataTypes.UUID,
        //allowNull:false
      }
    })
    Profile.belongsTo(models.User, {
      as        :'user',
      targetKey :'id',
      foreignKey:{
        name:'userId',
        type:Sequelize.DataTypes.UUID,
        //allowNull:false
      }
    })
  }

  return Profile
}

