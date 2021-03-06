/* @fwrlines/generator-graphql-server-type 2.1.1 */
import { DomainController as MainController } from '../controllers'
import models from 'models'
import * as faker from 'faker'
import { VercelAPI } from '../utils'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
const { assert, expect } = chai

import { generateTestDomain as generateFakeData } from './generators'

const Model = models.Domain

const generateFakeDomainName = () => 'auto-testing-available-domain' + faker.random.alphaNumeric(8).toLowerCase() + '.com'


describe('Website -> Domain Model', function() {
  /*
  before( function(){
  })

  beforeEach( function(){
  })
  */


  describe('Domain Model -> Virtual -> Added To Vercel ( Boolean )', function() {
    it('Model API -> The model is added to Vercel, should return true', async function() {
      const data = generateFakeData({ vercelDomainId: 'someid' })
      const inst = await Model.create(data)
      expect(inst.isAddedToVercel).to.equal(true)
      inst.destroy()
    })

    it('Model API -> The model is not added to Vercel, should return false', async function() {
      const data = generateFakeData({ vercelDomainId: '' })
      const inst = await Model.create(data)
      expect(inst.isAddedToVercel).to.equal(false)
      inst.destroy()
    })

  })
  
  describe('Domain Model -> Virtual -> Main', function() {
    it('Model API -> The domain is not installed, main should be the alt', async function() {
      const data = generateFakeData({ isInstalled: false })
      const inst = await Model.create(data)
      expect(inst.main).to.equal(data.alt)
      inst.destroy()
    })

    it('Model API -> The domain is installed, main should be the regular name', async function() {
      const data = generateFakeData({ isInstalled: true })
      const inst = await Model.create(data)
      expect(inst.main).to.equal(data.name)
      inst.destroy()
    })
  
  })

  describe('Domain Model -> Class Method -> Is Available', function() {
    it('Model API -> A domain that should be available for sale', async function() {
      const fakeDomain = generateFakeDomainName()
      const isAvailable = await Model.isAvailable(fakeDomain)
      expect(isAvailable).to.equal(true)
    }) 
  })

  describe('Domain Model -> Instance Method -> Order', function() {
    it('Model API -> The domain gets its ordered status toggled, and is connected to the ordering api', async function() {
      //TODO test email sending (?)
      const data = generateFakeData({ 
        name          :generateFakeDomainName(),
        vercelDomainId:null,
        isOrdered     :false,
        isError       :false
      })
      const inst = await Model.create(data)
      const addedToVercel = await inst.addToVercel()
      const ordered = await inst.order()
      expect(ordered).to.be.equal(true)
      const uInst = await MainController.get({}, { id: inst.id })
      ////console.log(777, uInst)
      expect(uInst.isOrdered).to.equal(true)
      inst.destroy()
    })
  })
  
  describe('Domain Model -> Instance Method -> Add To Vercel', function() {
    it('Model API -> The domain should be added to Vercel', async function() {
      const data = generateFakeData({ 
        name          :generateFakeDomainName(),
        vercelDomainId:null,
        isOrdered     :true,
        isBought      :true,
        isInstalled   :true //will be reset
      })
      const inst = await Model.create(data)
      const isAdded = await inst.addToVercel()
      expect(isAdded).to.equal(true)

      const uInst = await MainController.get({}, { id: inst.id })
      expect(uInst.isInstalled).to.equal(false)
      const { domain:{ id:shouldEqualVercelDomainId } }= await VercelAPI.get.domain({
        name  :data.name,
        teamId:data.vercelTeamId
      })
      expect(shouldEqualVercelDomainId).to.equal(uInst.vercelDomainId)

      inst.destroy()
    })

    it('Model API -> The domain should not be synced with vercel because it already has been', async function() {
      const data = generateFakeData({ 
        vercelDomainId:'already existing id',
      })
      const inst = await Model.create(data)
      const isAdded = await inst.addToVercel()
      expect(isAdded).to.equal(false)
      inst.destroy()
    })
  
  })

  describe('Domain Model -> Instance Method -> Delete from Vercel', function() {
    it('Model API -> The domain should be deleted from vercel', async function() {
      const data = generateFakeData({ 
        name          :generateFakeDomainName(),
        vercelDomainId:null,
        isOrdered     :true,
        isBought      :true,
        isInstalled   :true //will be reset
      })
      const inst = await Model.create(data)
      const isAdded = await inst.addToVercel()


      const deleted = await inst.deleteFromVercel()
      expect(deleted).to.equal(true)


      const uInst = await MainController.get({}, { id: inst.id })

      expect(uInst.isInstalled).to.equal(false)
      expect(uInst.vercelDomainId).to.equal(null)

      const getDeletedDomain = VercelAPI.get.domain({
        name  :data.name,
        teamId:data.vercelTeamId
      })

      const assertion = expect(getDeletedDomain).to.eventually.be.rejected.then(e =>{
        //console.log('ERROR', e.error)
        //assert(e.statusCode ===)
        expect(e.error.error.code).to.be.equal('not_found')
      })

      inst.destroy()

      return assertion
    }) 
  })

  describe('Domain Model -> Instance Method -> Get Domain Info Vercel', function() {
    it('Model API -> We should get the right info from vercel with a synced domain', async function() {
      const data = generateFakeData({ 
        name          :generateFakeDomainName(),
        vercelDomainId:null,
        isOrdered     :true,
        isBought      :true,
        isInstalled   :true //will be reset
      })
      const inst = await Model.create(data)
      const isAdded = await inst.addToVercel()

      const uInst = await MainController.get({}, { id: inst.id })

      const { id } = await uInst.getInfoFromVercel()

      expect(id).to.equal(uInst.vercelDomainId)

      inst.destroy()
    })
  
  })

  describe('Domain Model -> Hook -> Delete from Vercel', function() {
    it('Model API -> The domain should be automatically deleted from vercel before instance deletion', async function() {
      const data = generateFakeData({ 
        name          :generateFakeDomainName(),
        vercelDomainId:null,
        isOrdered     :true,
        isBought      :true,
        isInstalled   :true //will be reset
      })
      const inst = await Model.create(data)
      await inst.addToVercel()

      await inst.destroy()

      const getDeletedDomain = VercelAPI.get.domain({
        name  :data.name,
        teamId:data.vercelTeamId
      })

      const assertion = expect(getDeletedDomain).to.eventually.be.rejected.then(e =>{
        //console.log('ERROR', e.error)
        //assert(e.statusCode ===)
        expect(e.error.error.code).to.be.equal('not_found')
      })

      return assertion
    }) 
  })

  /*
  afterEach( function(){
  })

  after( function(){
  })
  */
})

describe('Website -> Domain Controller', function() {
  /*
  before( function(){
  })

  beforeEach( function(){
  })assert.exists(r1.id, 'We shouldnt deep test inclusion of empty item')
assert.exists(r2.id, 'We shouldnt deep test inclusion of empty item')
  */


  describe('Controller -> Get all', function() {
    it('Admin API -> The objects retrieved equals the objects looked for', async function() {
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
  })

  describe('Controller -> Get one', function() {
    it('Admin API -> The object retrieved correspond to the objects looked for', async function() {
      const data = generateFakeData()
      const { id } = await Model.create( data )
      const inst = await MainController.get({}, { id })
      expect(inst).to.deep.include({id, ...data})
      inst.destroy()
    })
  })

  describe('Controller -> Add', function() {
    it('Admin API -> The object created equals the specs given', async function() {
      const input = generateFakeData()
      const inst = await MainController.add({}, { input })
      expect(inst).to.deep.include(input)
      inst.destroy()
    })

  })

  describe('Controller -> Update', function() {
    it('Admin API -> The object is successfully updated', async function() {
      const data = generateFakeData()
      const { id } = await Model.create( data )
      const input = generateFakeData()
      const inst = await MainController.update({}, { id, input })
      expect(inst).to.deep.include({id, ...input})
      inst.destroy()
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



