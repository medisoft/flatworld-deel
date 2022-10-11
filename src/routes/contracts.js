const express = require('express')
const router = express.Router()
const { Op } = require("sequelize")
const { getProfile } = require('../middleware/getProfile')
const { validSchema } = require("../middleware/validSchema");

/**
 * @param {number} id - The profile.id of a client or a contractor
 * @returns contract by id only if it belongs to the profile calling
 */
router.get('/:id', getProfile, validSchema(require('../schemas/get-contract.json'), [ "params" ]), async (req, res) => {
  try {
    const { Contract } = req.app.get('models')
    const { id } = req.params
    const contract = await Contract.findOne({
      where: {
        id, [Op.or]: [
          { ContractorId: req.profile.id },
          { ClientId: req.profile.id },
        ]
      }
    })
    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' })
    res.json(contract)
  } catch (err) {
    console.error('ERROR:', err.message || err)
    res.status(500).end()
  }
})

/**
 *
 * @returns a list of contracts belonging to a user (client or contractor), the list should only contain non terminated contracts.
 */
router.get('/', getProfile, async (req, res) => {
  try {
    const { Contract } = req.app.get('models')
    const contracts = await Contract.findAll({
      where: {
        [Op.or]: [
          { ContractorId: req.profile.id },
          { ClientId: req.profile.id },
        ],
        status: { [Op.ne]: 'terminated' }
      }
    })
    if (!contracts) return res.status(404).json({ success: false, message: 'No contracts found' })
    res.json(contracts)
  } catch (err) {
    console.error('ERROR:', err.message || err)
    res.status(500).end()
  }
})

module.exports = router
