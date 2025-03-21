const express = require("express");
const UsaStateCountry_controller = require("../../controllers/us_state_country/UsaStateCountry.controller");
const usa_state_country_routes = express.Router();


usa_state_country_routes.get("/all", UsaStateCountry_controller.getCurrentDataCountry);

module.exports = usa_state_country_routes;
