const express = require('express')
const router = express.Router()
const { getProfile } = require('../middleware/getProfile')
const { Op } = require('sequelize')
const { validSchema } = require("../middleware/validSchema");


/**
 *
 * @returns a list of all unpaid jobs for a user (either a client or contractor), for active contracts only.
 */
router.get('/unpaid', getProfile, async (req, res) => {
  try {
    const { Job, Contract } = req.app.get('models')

    const contracts = await Contract.findAll({
      where: {
        [Op.or]: [
          { ContractorId: req.profile.id },
          { ClientId: req.profile.id },
        ],
        status: { [Op.ne]: 'terminated' },
      },
      include: {
        model: Job, required: true, where: {
          [Op.or]: [
            { paid: { [Op.ne]: true } },
            { paid: { [Op.is]: null } }
          ]
        }
      }
    })

    if (!contracts) return res.status(404).json({ success: false, message: 'No active contracts found' })

    let jobs = []
    contracts.map(c => c && c.Jobs).forEach(c => jobs = jobs.concat(c))
    if (!jobs.length) return res.status(404).json({ success: false, message: 'No active jobs found' })

    res.json(jobs)
  } catch (err) {
    console.error('ERROR:', err.message || err)
    res.status(500).end()
  }
})

/**
 * Pay for a job, a client can only pay if his balance >= the amount to pay. The amount should be moved from the client's balance to the contractor balance.
 *
 * @returns status 200 on success, 400 if the job has been paid, 404 if the job is not existing or not belongs to the profile_id
 */
router.post('/:job_id/pay', getProfile, validSchema(require('../schemas/post-pay.json'), [ "params" ]), async (req, res) => {
  try {
    const { Job, Contract, Profile } = req.app.get('models')
    const sequelize = req.app.get('sequelize')
    const { job_id } = req.params
    const job = await Job.findOne({
      where: { id: job_id }, include: {
        model: Contract, required: true, where: {
          [Op.or]: [
            { ContractorId: req.profile.id },
            { ClientId: req.profile.id },
          ],
          status: { [Op.ne]: 'terminated' },
        }
      }
    })
    if (!job) return res.status(404).json({ success: false, message: 'Job id not found' })
    if (job.paid) return res.status(400).json({ success: false, message: 'Job already paid' })
    if (req.profile.balance < job.price) return res.status(400).json({
      success: false,
      message: 'Insufficient balance to pay for the job'
    })

    // Starts a new transaction, because we need to be sure that both changes applied or none if something fails
    const t = await sequelize.transaction()
    try {
      await Profile.decrement({ balance: job.price }, { where: { id: req.profile.id } })
      await Job.update({ paid: true, paymentDate: new Date() }, { where: { id: job_id } })
      t.commit();
      res.status(200).json({ success: true, message: 'Payment applied' })
    } catch (err) {
      t.rollback()
    }
  } catch (err) {
    console.error('ERROR:', err.message || err)
    res.status(500).end()
  }
})

module.exports = router
