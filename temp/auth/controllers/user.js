import { User } from '../models'

import bcrypt from 'bcrypt'
import validateSignupInput from '../validation/signup'
import validateLoginInput from '../validation/login'
import { getTokenFor } from '../utils'
import { ValidationError, NotUniqueError, ObjectNotFoundError } from 'utils/errors'

const userController = {
  add: (root, args) => {
    const user = new User(args)
    return user.save()
  },

  del: async (root, id) => {
    console.log('DELETING', id)
    await User.deleteOne({ _id:id  }, function (err) {
      if (err) return false
    })
    return true
  },

  changePassword: async(r, a) => {
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(a.password, salt)
    const updatedUser = await User.findByIdAndUpdate(
      a.id,
      { password: hash },
    )
    if (!updatedUser){
      throw new ObjectNotFoundError()
    } else {
      return true
    }
  },

  changeMyPassword: async(r, a, c) => {
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(a.password, salt)
    const updatedUser = await User.findByIdAndUpdate(
      c.user.id,
      { password: hash },
    )
    if (!updatedUser){
      throw new ObjectNotFoundError()
    } else {
      return true
    }
  },

	 updateMe: async (r, a, c) => {
    const tempUser = { ...a.input }
    tempUser.ts_updated = Date.now()
    const updatedUser = await User.findByIdAndUpdate(
      c.user.id,
      { $set: tempUser },
    )
    if (!updatedUser){
      throw new ObjectNotFoundError()
    } else {
      return updatedUser
    }
  },

	 update: async (root, args) => {
    const tempUser = { ...args.input }
    tempUser.ts_updated = Date.now()
    const updatedUser = await User.findByIdAndUpdate(
      args.id,
      { $set: tempUser },
    )
    if (!updatedUser){
      throw new ObjectNotFoundError()
    } else {
      return updatedUser
    }
  },

  users: (root, args) => User.find({}),

  user: (token) => User.find({ token: token }),

  signup: async (root, args, context) => {
    const { errors, isValid } = validateSignupInput(args)
    if(!isValid) {
      throw new ValidationError({data:errors})
    }
    const email_exists = await User.findOne({
      email: args.email
    })
    if(email_exists) {
      throw new NotUniqueError({message:'email already exists', data:{email: 'email already exists'}})
    }
    else {
      const newUser = new User(args)
      const salt = await bcrypt.genSalt(10)
      const hash = await bcrypt.hash(newUser.password, salt)

      newUser.ts_updated = Date.now()
      newUser.password = hash
      newUser.save()
      return getTokenFor(newUser, process.env.JWT_SECRET)
    }
  },

  login: async (root, args, context) => {
    const { errors, isValid } = validateLoginInput(args)

    if(!isValid) {
      throw new ValidationError({data:errors})
    }

    const email = args.email
    const password = args.password
    const user = await User.findOne({email})
    if (user) {
      console.log(password, user.password)
      const isMatch = await bcrypt.compare(password, user.password)
      console.log(isMatch)

      if(isMatch) {
        console.log(isMatch, process.env.JWT_SECRET)
        if (!process.env.JWT_SECRET) {
          throw new ValidationError({message:'No jwt secret key' + process.env.JWT_SECRET})
        }
        return getTokenFor(user, process.env.JWT_SECRET)
      }
      else {
        return new ValidationError({message:'Incorrect Password'})
        //return res.status(400).json(errors)
      }
    }
    else {
      throw new ValidationError({message:'user not found'})
    }
  },

  me: async(root, args, context) => {
    console.log('me function called, r, a ,c', root, args, context)
  },
}

export { userController }
