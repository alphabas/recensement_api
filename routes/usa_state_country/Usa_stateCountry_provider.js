const express = require("express")
const all_usa_state_country_routes = require("./usa_state_country.routes")
const all_usa_state_country_router = express.Router()

all_usa_state_country_router.use("/", all_usa_state_country_routes)

module.exports = all_usa_state_country_router