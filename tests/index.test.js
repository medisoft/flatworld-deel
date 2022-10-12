const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;

chai.use(chaiHttp)

const server = require('../src/app');

describe('Run the tests', () => {
  it('Expect /admin/best-profession to work without params', async () => {
    const data = await chai.request(server)
      .get('/admin/best-profession')
      .set('profile_id', 1)
    expect(data).to.be.an('object')
    expect(data).to.have.property('body')
    const body = data.body;
    expect(body).to.be.an('string')
  })
  it('Expect /admin/best-profession to work with start', async () => {
    const data = await chai.request(server)
      .get('/admin/best-profession')
      .query('start', new Date(0))
      .set('profile_id', 1)
    expect(data).to.be.an('object')
    expect(data).to.have.property('body')
    const body = data.body;
    expect(body).to.be.an('string')
  })
  it('Expect /admin/best-profession to work with end', async () => {
    const data = await chai.request(server)
      .get('/admin/best-profession')
      .query('end', new Date())
      .set('profile_id', 1)
    expect(data).to.be.an('object')
    expect(data).to.have.property('body')
    const body = data.body;
    expect(body).to.be.an('string')
  })
  it('Expect /admin/best-profession to work with start and end', async () => {
    const data = await chai.request(server)
      .get('/admin/best-profession')
      .query('start', new Date(0))
      .query('end', new Date())
      .set('profile_id', 1)
    expect(data).to.be.an('object')
    expect(data).to.have.property('body')
    const body = data.body;
    expect(body).to.be.an('string')
  })

  it('Expect /deposit/:userId to fail with invalid userId', async () => {
    const data = await chai.request(server)
      .post('/balances/deposit/a')
      .set('profile_id', 1)
      .send({ amount: 50 })
    expect(data).to.be.an('object')
    expect(data).to.have.property('body')
    const body = data.body;
    expect(body).to.be.an('object')
    expect(body).to.have.property('success')
    expect(body.success).to.be.a('boolean')
    expect(body.success).to.be.false
  })

  it('Expect /deposit/:userId to fail with to high amount', async () => {
    const data = await chai.request(server)
      .post('/balances/deposit/1')
      .set('profile_id', 1)
      .send({ amount: 5000 })
    expect(data).to.be.an('object')
    expect(data).to.have.property('body')
    const body = data.body;
    expect(body).to.be.an('object')
    expect(body).to.have.property('success')
    expect(body.success).to.be.a('boolean')
    expect(body.success).to.be.false
  })


})
