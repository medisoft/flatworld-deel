const express = require('express');
const router = express.Router();
const { getProfile } = require('../middleware/getProfile')
const { Op } = require("sequelize");
const _ = require('lodash')
const { validSchema } = require("../middleware/validSchema");

/**
 * GET /admin/best-profession?start=<date>&end=<date>
 *
 * @param {date} [start] - The start date, if not specified, starts since 1970
 * @param {date} [end] - The end date, if not specified, uses NOW
 * @returns the profession that earned the most money (sum of jobs paid) for any contactor that worked in the query time range.
 */
router.get('/best-profession', getProfile, validSchema(require('../schemas/best-profession.json'), [ "query" ]), async (req, res) => {
  const { Job, Contract, Profile } = req.app.get('models')
  try {
    // Fetches all the jobs with their contractors
    const jobs = await Job.findAll({
      where: {
        paid: true,
        paymentDate: { [Op.between]: [ req.query.start || new Date(0), req.query.end || new Date() ] }
      },
      include: {
        model: Contract, required: true, attributes: [ 'ContractorId', 'ClientId' ]
      }
    })
    // Fetches all the profiles that are contractors. We don't want clients, because the profession that interest us is in the contractors
    const profiles = await Profile.findAll({
      where: {
        id: { [Op.in]: [ ...new Set(jobs.map(j => j.Contract.ContractorId)) ] }
      },
      attributes: [ 'profession', 'id' ]
    })

    // Creates the list of prices
    const professionList = {}
    jobs.forEach(j => {
      const profile = profiles.find(p => p.id === j.Contract.ContractorId)
      if (!professionList[profile.profession])
        professionList[profile.profession] = +j.price;
      else
        professionList[profile.profession] += +j.price
    })

    // Sorts by best paid profession DESC
    let profession = Object.entries(professionList)
      .sort(([ , a ], [ , b ]) => b - a)
      .reduce((r, [ k, v ]) => ({ ...r, [k]: v }), {});

    res.json(Object.keys(profession)[0])
  } catch (err) {
    console.error('ERROR:', err.message || err)
    res.status(500).end()
  }
});

/**
 * GET /admin/best-clients?start=<date>&end=<date>&limit=<integer>
 *
 * @param {date} [start] - The start date, if not specified, starts since 1970
 * @param {date} [end] - The end date, if not specified, uses NOW
 * @param {integer} [limit] - The amount if records to return. Defaults to 2
 *
 * @returns the clients the paid the most for jobs in the query time period. limit query parameter should be applied, default limit is 2.
 */
router.get('/best-clients', getProfile, validSchema(require('../schemas/best-clients.json'), [ "query" ]), async (req, res) => {
  const { Job, Contract, Profile } = req.app.get('models')
  try {
    // Fetches the list of contractors that have paid job
    const jobs = await Job.findAll({
      where: {
        paid: true,
        paymentDate: { [Op.between]: [ req.query.start || new Date(0), req.query.end || new Date() ] }
      },
      include: {
        model: Contract, required: true, attributes: [ 'ContractorId', 'ClientId' ]
      }
    })

    // Do the sum of the amount paid per client. We expect the client pays and the contractor no because the contractor is the worker that makes jobs for the client
    const paidByClient = {}
    jobs.forEach(j => {
      if (!paidByClient[j.Contract.ClientId])
        paidByClient[j.Contract.ClientId] = j.price
      else
        paidByClient[j.Contract.ClientId] += j.price
    })

    // Returns the top paid of the list
    let paidByClientSorted = _(paidByClient)
      .map((v, k) => Object.assign({ id: k, paid: v }))
      .sortBy('paid').reverse().value().slice(0, req.query.limit || 2)

    // Fetches only the first N clients sorted by amount paid descendant
    const profiles = (await Profile.findAll({
      where: { id: { [Op.in]: paidByClientSorted.map(p => p.id) } },
      attributes: [ 'id', 'firstName', 'lastName' ]
    })).map(p => Object.assign({ id: p.id, fullName: `${p.firstName} ${p.lastName}` }))

    // Maps the client id and full name, with the amount paid
    const clients = paidByClientSorted.map(p => Object.assign({}, profiles.find(pr => pr.id === +p.id), { paid: p.paid }))

    res.json(clients)
  } catch (err) {
    console.error('ERROR:', err.message || err)
    res.status(500).end()
  }
});

module.exports = router;
