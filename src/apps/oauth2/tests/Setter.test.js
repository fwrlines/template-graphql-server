/* @fwrlines/generator-graphql-server-type 2.1.1 */
import { assert, expect } from 'chai'
import { OAuth2SetterController as MainController } from '../controllers'
import models from 'models'
import * as faker from 'faker'

import { generateTestSetter as generateFakeData } from './generators'
import { generateTestUser } from 'apps/auth/tests/generators'

const Model = models.OAuth2Setter

//FM for ForeignModel
const FM_A = {
  generateData:() => generateTestUser(),
  model       :models.User,
  foreignKey  :'userId',
  references  :'id',
  as          :'user'
}


describe('OAuth2 -> OAuth2Setter Model', function() {
  /*
  before( function(){
  })

  beforeEach( function(){
  })
  */

  describe('Model -> Key -> Code', function() {
    it('Default Value -> The default code is a unique 64 char string', async function() {
      const data1 = generateFakeData()
      const data2 = generateFakeData()
      const records = await Model.bulkCreate([data1, data2])
      const { code:code1 } = records[0]
      const { code:code2 } = records[1]
      expect( code1 ).to.have.lengthOf(64)
      expect( code2 ).to.have.lengthOf(64)
      expect( code1 ).to.not.deep.equal(code2)
      records.forEach((e) =>
        e.destroy()
      )
    })

  })

  describe('Model -> Virtual -> IsValid', function() {
    it('Model API -> An instance is valid ioi it expires later than now', async function() {
      const data1 = generateFakeData()
      const data2 = generateFakeData({ expires: Date.now() - (Number(200 * 1000)) })
      const records = await Model.bulkCreate([data1, data2])
      expect( records[0].isValid ).to.equal(true)
      expect( records[1].isValid ).to.equal(false)
      records.forEach((e) =>
        e.destroy()
      )
    })
  })

  describe('Model -> Instance Method -> Login', function() {
    it('Model API -> When we login a valid instance, it should be not valid anymore', async function() {
      const data1 = generateFakeData({ useToLogin: true })
      const data2 = generateFakeData({ useToLogin: false })
      const data3 = generateFakeData({ useToLogin: true, expires: Date.now() - (Number(200 * 1000)) })
      const records = await Model.bulkCreate([data1, data2, data3])
      const [e1, e2, e3] = records
      //console.log(999, records[0].isValid, records[0].useToLogin, await records[0].login())
      expect( await e1.login() ).to.equal(true)
      expect( await e2.login() ).to.equal(false)
      expect( await e3.login() ).to.equal(false)
      expect( await e1.useToLogin ).to.equal(false)
      records.forEach(e => {
        e.destroy()
      })
    })
  })

  describe('Model -> Class Method -> Clean', function() {
    it('Model API -> After using the clean method, we shouldnt have any expired objects in the database', async function() {
      const data1 = generateFakeData({ useToLogin: true, expires: Date.now() - 1 })
      const data2 = generateFakeData({ useToLogin: true, expires: Date.now() - 10 })
      const data3 = generateFakeData({ useToLogin: true, expires: Date.now() - (Number(200 * 1000)) })
      const records = await Model.bulkCreate([data1, data2, data3])
      const [e1, e2, e3] = records
      await Model.clean()
      await Model.findByPk(e1.id)
      const i1 = await Model.findByPk(e1.id)
      const i2 = await Model.findByPk(e2.id)
      const i3 = await Model.findByPk(e3.id)
      expect(i1).to.equal(null)
      expect(i2).to.equal(null)
      expect(i3).to.equal(null)
    })
  })

  /*
  afterEach( function(){
  })

  after( function(){
  })
  */
})

describe('OAuth2 -> OAuth2Setter Controller', function() {

  /*
  before( function(){

  })

  beforeEach( function(){

  })
  */

  describe('Controller -> Get all', function() {
    it('Admin API -> The objects retrieved equals the objects looked fori, with no association', async function() {
      // 1. We generate two items
      const data1 = generateFakeData()
      const data2 = generateFakeData()
      const records = await Model.bulkCreate([data1, data2], {})

      // 2. We test they are generated properly, and we keep their irds
      expect(records[0]).to.deep.include(data1)
      expect(records[1]).to.deep.include(data2)
  
      const { id:id1 } = records[0]
      const { id:id2 } = records[1]

      // 3. We get all the items in the DB, in which we check the generated items are present
      const rows = await MainController.all({})

      const s1 = rows.find(e => e.id === id1)
      const s2 = rows.find(e => e.id === id2)
      assert.exists(s1.id, 'We shouldnt deep test inclusion of empty item')
      assert.exists(s2.id, 'We shouldnt deep test inclusion of empty item')

      // 4. We compare the found item with the generated one
      expect(s1).to.deep.include(data1)
      expect(s2).to.deep.include(data2) //Include instead of equal because if there is a foreign key, it will be developped in the controller get all method
      //expect(rows).to.deep.include.members([ r1, r2 ])

      // 5.Cleanup
      records.forEach((e) =>
        e.destroy()
      )
    })

    it('Admin API -> The objects retrieved equals the objects looked for, including associations', async function() {
      // O. We prepare the FK Data

      const instFM_A_A1 = await FM_A.model.create(FM_A.generateData(), { plain: true })
      const instFM_A_A2 = await FM_A.model.create(FM_A.generateData(), { plain: true })
      //console.log(instUser1, instFM_A2)

      // 1. We generate two items
      const data1 = generateFakeData({
        [FM_A.foreignKey]:instFM_A_A1[FM_A.references]
      })

      const data2 = generateFakeData({
        [FM_A.foreignKey]:instFM_A_A2[FM_A.references]
      })

      const records = await Model.bulkCreate([data1, data2], {})

      // 2. We test they are generated properly, and we keep their irds
      expect(records[0]).to.deep.include(data1)
      expect(records[1]).to.deep.include(data2)
  
      const { id:id1 } = records[0]
      const { id:id2 } = records[1]

      // 3. We get all the items in the DB, in which we check the generated items are present
      const rows = await MainController.all({})

      const s1 = rows.find(e => e.id === id1)
      const s2 = rows.find(e => e.id === id2)
      assert.exists(s1.id, 'We shouldnt deep test inclusion of empty item')
      assert.exists(s2.id, 'We shouldnt deep test inclusion of empty item')

      // 4. We compare the found item with the generated one
      expect(s1).to.deep.include({
        ...data1, 
        [FM_A.as]:instFM_A_A1.dataValues
      })
      expect(s2).to.deep.include({
        ...data2, 
        [FM_A.as]:instFM_A_A2.dataValues
      })
      //expect(rows).to.deep.include.members([ r1, r2 ])

      // 5.Cleanup
      records.forEach((e) =>
        e.destroy()
      )
      instFM_A_A1.destroy()
      instFM_A_A2.destroy()
    })
  })

  describe('Controller -> Get one', function() {
    it('Admin API -> The object retrieved correspond to the objects looked for, with no association', async function() {
      const data = generateFakeData()
      const { id } = await Model.create( data )
      const inst = await MainController.get({}, { id })
      expect(inst).to.deep.include({id, ...data})
      inst.destroy()
    })

    it('Admin API -> The object retrieved correspond to the objects looked for, including associations', async function() {
      const instFM_A = await FM_A.model.create(FM_A.generateData(), { plain: true })

      const data = generateFakeData({
        [FM_A.foreignKey]:instFM_A[FM_A.references]
      })

      const { id } = await Model.create( data )
      const inst = await MainController.get({}, { id })
      expect(inst).to.deep.include({ id, ...data })
      expect(inst[FM_A.as].dataValues).to.deep.include(instFM_A.dataValues)
      inst.destroy()
      instFM_A.destroy()  
    })
  })

  describe('Controller -> Add', function() {
    it('Admin API -> The object created equals the specs given, with no association', async function() {
      const input = generateFakeData()
      const inst = await MainController.add({}, { input })
      expect(inst).to.deep.include(input)
      inst.destroy()
    })

    it('Admin API -> The object created equals the specs given, including associations', async function() {
      const instFM_A = await FM_A.model.create(FM_A.generateData(), { plain: true })

      const input = generateFakeData({
        [FM_A.foreignKey]:instFM_A[FM_A.references]
      })

      const inst = await MainController.add({}, { input })
      expect(inst).to.deep.include(input)
      //expect(inst.user.dataValues).to.deep.include(instUser.dataValues)
      //expect(inst[FM_A.as].dataValues).to.deep.include(instFM_A.dataValues) //
      //https://github.com/sequelize/sequelize/issues/3807
      inst.destroy()
      instFM_A.destroy()
    })

  })

  describe('Controller -> Update', function() {
    it('Admin API -> The object is successfully updated, with no association', async function() {
      const data = generateFakeData()
      const { id } = await Model.create( data )
      const input = generateFakeData()
      const inst = await MainController.update({}, { id, input })
      expect(inst).to.deep.include({id, ...input})
      inst.destroy()
    })

    it('Admin API -> The object is successfully updated, with associations', async function() {
      const instFM_A = await FM_A.model.create(FM_A.generateData(), { plain: true })

      const data = generateFakeData({
        [FM_A.foreignKey]:instFM_A[FM_A.references]
      })

      const { id } = await Model.create( data )
      const input = generateFakeData()
      const inst = await MainController.update({}, { id, input })
      expect(inst).to.deep.include({id, ...input})
      inst.destroy()
      instFM_A.destroy()
    })
  })

  describe('Controller -> Delete', function() {
    it('Admin API -> The object is successfully deleted', async function() {
      const data = generateFakeData()
      const { id } = await Model.create( data )
      const deletedId = await MainController.delete({}, { id })
      assert( deletedId === id, 'The controller should respond true to the deletion command' )
      await Model.findByPk(id, { transaction: null }) //there is a little time for the deletion to actually happen, so we auery twice
      const objectShouldntRemain = await Model.findByPk(id, { transaction: null })
      expect( objectShouldntRemain ).to.equal(null)
      //assert( Model.findByPk( id ) == null, 'There should be no item anymore in the db')
    })
  })

  /*
  afterEach( function(){

  })

  after( function(){

  })
    */


})



