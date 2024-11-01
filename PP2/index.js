const express = require("express");
const app = express();
app.disable("x-powered-by"); //disable x-powered-by

const PP2 = require("./PP2");
const TMSQuotationDetail = require("./TMSQuotationDetail");
const TMSJob = require("./TMSJob");
const TMSFileDoc = require("./TMSFileDoc");
const Download = require("./Download");
const QuotationPDF = require("./QuotationPDF");

app.use('/', PP2);
app.use('/', TMSQuotationDetail);
app.use('/', TMSJob);
app.use('/', TMSFileDoc);
app.use('/', Download);
app.use('/QuotationPDF', QuotationPDF);

module.exports = app;