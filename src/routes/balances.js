const express = require('express');
const router = express.Router();
const { getProfile } = require('../middleware/getProfile')
const { validSchema } = require('../middleware/validSchema')
const { Op } = require("sequelize");


/**
 *  POST /balances/deposit/:userId - Deposits money into the the the balance of a client, a client can't deposit more than 25% his total of jobs to pay. (at the deposit moment)
 *
 *  @returns
 */
router.post('/deposit/:userId', getProfile, validSchema(require('../schemas/deposit.json'), [ 'params', 'body' ]), async (req, res) => {
  const { Job, Contract, Profile } = req.app.get('models')
  try {
    // Fetches the list of unpaid jobs of the userId
    const jobs = await Job.findAll({
      where: {
        [Op.or]: [
          { paid: { [Op.ne]: true } },
          { paid: { [Op.is]: null } }
        ]
      },
      attributes: [ 'price' ],
      include: {
        model: Contract, required: true, where: {
          [Op.or]: [
            { ContractorId: req.params.userId },
            { ClientId: req.params.userId },
          ],
          status: { [Op.ne]: 'terminated' },
        }
      }
    })

    console.log('jobs', jobs)
    // Gets the max amount that we allow to deposit
    const maxToPay = jobs.map(j => j.price).reduce((partial, n) => partial + n, 0) * 0.25
    if (req.body.amount > maxToPay) return res.status(400).json({
      success: false,
      message: 'You can only pay up to 25% of the due amount'
    })

    // Increments the amount of balance
    await Profile.increment({ balance: req.body.amount }, { where: { id: req.params.userId } })
    res.json({ success: true, message: 'Balance added' })
  } catch (err) {
    console.error('ERROR:', err.message || err)
    res.status(500).end()
  }
});

module.exports = router;
