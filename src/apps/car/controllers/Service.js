/* @fwrlines/generator-graphql-server-type 2.1.1 */

import models from 'models'

import { ObjectNotFoundError } from 'utils'

const Model = models.Service

/*
import {
  ConfigurationError,
  ValidationError,
  NotUniqueError,
  ObjectNotFoundError
} from 'utils'
*/

const Controller = {
  all:(root, args) => Model.findAll({
    raw :true,
    nest:true
    //plain:true
  }),

  get:(root, { id }) => Model.findByPk( id , { 
    plain:true 
  }),

  add:async (root, { input }) => await Model.create( input, { 
    plain:true 
  }),

  delete:async (root, { id }) => {
    const item = await Model.findByPk(id).catch(e => {
      console.log(e.message)
    })
    if (!item) {
      return false
    }
    await item.destroy()
    return item.id
  },

  update:async (root, { input, id }) => {
    const updated = await Model.update(input, {
      where:{
        id
      },
      returning:true
    }).catch(
      e => console.log(e.message)
    )
    return updated[1][0] //we return the first updated item
  }
}

export default Controller

