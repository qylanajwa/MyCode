const moment = require('moment');
const loggers = require('../log');

const clsGRPInvoice = require('../repositories/MyFAST/GRPInvoice');
const clsGRPReceipt = require('../repositories/MyFAST/GRPReceipt');
const clsInvoiceIntegration = require('../controller/MyFAST/clsInvoiceIntegration');
const clsReceipt = require('../controller/MyFAST/Receipt');
const oLogicCosting = require('../repositories/CostingSheet/CostingSheetLogic');
let onlinePaymenteGHL = require('../../CUSTOMER/controller/PaymentModuleController/OnlinePayments/OnlinePaymentController')
const paymentRepository = require('../../CUSTOMER/repositories/PaymentRepository/Customers/PaymentRepository');
const { error } = require('../logger');
const axios = require('axios')
// const sha256 = require('sha256');
const { createHash } = require('crypto');
const querystring = require('querystring');

exports.MyFastScheduler = async () => {

    ProcessCRInvoice() //repush CR invoice status 1,2
    // ProcessAPInvoice() 
    ProcessCRInvoicePaid() //repush CR invoice status 3
    // ProcessCRInvoiceCRM()
    //ProcessInvoiceAPPrepaymentPayment()
    //ProcessBacklogCRAP()


}

exports.MyFastSchedulerTest = async () => {

    ProcessBacklogCRAP()

}

exports.MyFastSchedulerCustom = async () => {

    ProcessPushInvoice()
    //ProcessDocApplyAP()

}

exports.MyFastSchedulerDocApply = async () => {

    ProcessDocApplyAP()

}

let ProcessCRInvoice = async () => {
    try {

        //get backlog n current invoices status 1,2 CR
        let getApprovedInvoice = await clsGRPInvoice.SelectInvoiceDataApprovedCR()
        if (getApprovedInvoice && getApprovedInvoice.length > 0) {

            // getApprovedInvoice = getApprovedInvoice.filter(tbl => tbl.ReferenceNbr == null || tbl.ReferenceNbr == '')

            for (let i = 0; i < getApprovedInvoice.length; i++) {

                clsInvoiceIntegration.putInvoice(getApprovedInvoice[i].invoiceNo, 'CR')
            }
        }

    }
    catch (err) {
        loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
        console.log(err);
    }
}

let ProcessAPInvoice = async () => {
    try {

        //get backlog n current invoices status 1,2 CR
        let getApprovedInvoice = await clsGRPInvoice.SelectInvoiceDataAPDonePrepayment()
        if (getApprovedInvoice && getApprovedInvoice.length > 0) {

            getApprovedInvoice = getApprovedInvoice.filter(tbl => tbl.ReferenceNbr == null || tbl.ReferenceNbr == '')

            for (let i = 0; i < getApprovedInvoice.length; i++) {

                clsInvoiceIntegration.putInvoice(getApprovedInvoice[i].invoiceNo, 'AP')
            }
        }

    }
    catch (err) {
        loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
        console.log(err);
    }
}


let ProcessCRInvoicePaid = async () => {
    try {

        //get backlog n current invoices status 3 CR
        let GetPaidInvoice = await clsGRPInvoice.SelectInvoiceDataPaidCR_tblReceipt()
        if (GetPaidInvoice && GetPaidInvoice.length > 0) {

            //fail invoice, fail payment
            let pushInvoice = GetPaidInvoice.filter(tbl => tbl.invoiceRef == null || tbl.invoiceRef == '')

            for (let i = 0; i < pushInvoice.length; i++) {

                let resInvoice = await clsInvoiceIntegration.putInvoice(pushInvoice[i].Invoice_no, 'CR')
                if (resInvoice && resInvoice.status) {
                    clsReceipt.putReceipt(pushInvoice[i].Invoice_no, '2')
                }
                else {
                    if (resInvoice && resInvoice.msg) {
                        loggers.logError(loggers.thisLineTryCatch(resInvoice.msg) + ': ' + resInvoice.msg)
                    }
                    continue;
                }
            }

            //success invoice, fail payment. attempt repush
            let pushReceipt = GetPaidInvoice.filter(tbl => tbl.invoiceRef != null && (tbl.receiptRef == null || tbl.receiptRef == ''))

            for (let j = 0; j < pushReceipt.length; j++) {

                clsReceipt.putReceipt(pushReceipt[j].Invoice_no, '2')

            }
        }
    }
    catch (err) {
        loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
        console.log(err);
    }
}



let ProcessCRInvoiceCRM = async () => {
    try {

        //get backlog n current invoices status 6 CRM
        let getCRM = await clsGRPInvoice.SelectInvoiceDataCRM()
        if (getCRM && getCRM.length > 0) {

            for (let i = 0; i < getCRM.length; i++) {

                let resInvoice = await clsInvoiceIntegration.putInvoice(getCRM[i].Invoice_no, 'CR')
                if (resInvoice != null && resInvoice.status) {
                    let resCRM = await clsInvoiceIntegration.putInvoice(getCRM[i].Invoice_no, 'CRM')
                    if (resCRM != null && resCRM.status) {
                        clsReceipt.putReceipt(pushInvoice[i].Invoice_no, '3')
                    }
                    else {
                        if (resInvoice && resInvoice.msg) {
                            loggers.logError(loggers.thisLineTryCatch(resInvoice.msg) + ': ' + resInvoice.msg)
                        }
                        continue;
                    }
                }
                else {
                    if (resInvoice && resInvoice.msg) {
                        loggers.logError(loggers.thisLineTryCatch(resInvoice.msg) + ': ' + resInvoice.msg)
                    }
                    continue;
                }
            }
        }

    }
    catch (err) {
        loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
        console.log(err);
    }
}


//AP 

let ProcessInvoiceAPPrepaymentPayment = async () => {
    try {

        //get backlog n current invoices status 3 AP
        let getAPpaid = await clsGRPInvoice.SelectInvoiceDataPaidAP()
        if (getAPpaid && getAPpaid.length > 0) {

            getAPpaid = getAPpaid.filter(tbl => tbl.ReferenceNbr == null || tbl.ReferenceNbr == '')

            for (let i = 0; i < getAPpaid.length; i++) {

                let resPrepayment = await clsReceipt.putReceipt(getAPpaid[i].Invoice_no, '1')

                if (resPrepayment && resPrepayment.status) {

                    let getSubmitted = await clsGRPReceipt.getAuditRptData_ByInvNo(getAPpaid[i].InvoiceNo)
                    if (getSubmitted && getSubmitted.length > 0) {
                        let intSuccess = {}
                        intSuccess.status = false
                        let pushInvoice = await clsInvoiceIntegration.putInvoice(getAPpaid[i].Invoice_no, 'AP')
                        if (pushInvoice && pushInvoice.status) {
                            intSuccess = clsReceipt.putReceipt(getAPpaid[i].Invoice_no, '2')
                        }

                        if (intSuccess.status) {
                            // Successfully pushed to MyFAST; update completion date in invoice master                    
                            // await iGSTIntegrationRepository.updateCompletionDate(getAP[i].InvoiceNo, Now).catch((error) => { logger.info(error) })

                            if (getAPpaid[i].Costing_id != null && getAPpaid[i].Costing_id != 0 && getAPpaid[i].Costing_id != "") {
                                let oDataCosting = {}
                                let objCosting = await oLogicCosting.SelectCostingSheet(getAPpaid[i].Costing_id, "1").catch((e) => { loggers.logError(loggers.thisLine2() + ': ' + `${e}`) });
                                oDataCosting.CostId = objCosting[0].CostId;
                                oDataCosting.CreditTerm = "CR";
                                oDataCosting.ModifiedDate = Now;
                                await oLogicCosting.UpdateCostingSheet(oDataCosting).catch((e) => { loggers.logError(loggers.thisLine2() + ': ' + `${e}`) });
                            }
                        }

                    }
                    else {
                        continue;
                    }
                }
                else {
                    continue;
                }
            }
        }
    }
    catch (err) {
        loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
        console.log(err);
    }
}



let ProcessBacklogCRAP = async () => { //backlog 2021
    try {

        //get backlog 2021 CR, AP
        let getInvoices = await clsGRPInvoice.SelectBacklogInvoices()
        if (getInvoices && getInvoices.length > 0) {

            //push backlog CR
            let CRInvoices = getInvoices.filter(tbl => tbl.Invoice_type == 'CR' && tbl.Completion_date != null &&
                (tbl.ReceiptRef == null || tbl.ReceiptRef == '' || tbl.InvRef == null || tbl.InvRef == ''))
            if (CRInvoices && CRInvoices.length > 0) {

                for (let i = 0; i < CRInvoices.length; i++) {

                    let resInvoice = await clsInvoiceIntegration.putInvoice(CRInvoices[i].Invoice_no, 'CR')
                    if (resInvoice && resInvoice.status) {
                        clsReceipt.putReceipt(CRInvoices[i].Invoice_no, '2')
                    }
                    else {
                        if (resInvoice && resInvoice.msg) {
                            loggers.logError(loggers.thisLineTryCatch(resInvoice.msg) + ': ' + resInvoice.msg)
                        }
                        continue;
                    }
                }
            }

            //push backlog AP
            let APInvoices = getInvoices.filter(tbl => tbl.Invoice_type == 'AP' && tbl.Completion_date != null &&
                (tbl.ReceiptRef == null || tbl.ReceiptRef == '' || tbl.InvRef == null || tbl.InvRef == ''))

            if (APInvoices && APInvoices.length > 0) {

                for (let i = 0; i < APInvoices.length; i++) {

                    let resInvoice = await clsInvoiceIntegration.putInvoice(APInvoices[i].Invoice_no, 'AP')
                    if (resInvoice && resInvoice.status) {
                        let intSuccess = clsReceipt.putReceipt(APInvoices[i].Invoice_no, '2')

                        if (intSuccess.status) {
                            // Successfully pushed to MyFAST; update completion date in invoice master                    
                            // await iGSTIntegrationRepository.updateCompletionDate(getAP[i].InvoiceNo, Now).catch((error) => { logger.info(error) })

                            if (APInvoices[i].Costing_id != null && APInvoices[i].Costing_id != 0 && APInvoices[i].Costing_id != "") {
                                let oDataCosting = {}
                                let objCosting = await oLogicCosting.SelectCostingSheet(APInvoices[i].Costing_id, "1").catch((e) => { loggers.logError(loggers.thisLine2() + ': ' + `${e}`) });
                                oDataCosting.CostId = objCosting[0].CostId;
                                oDataCosting.CreditTerm = "CR";
                                oDataCosting.ModifiedDate = Now;
                                await oLogicCosting.UpdateCostingSheet(oDataCosting).catch((e) => { loggers.logError(loggers.thisLine2() + ': ' + `${e}`) });
                            }
                        }
                    }
                    else {
                        if (resInvoice && resInvoice.msg) {
                            loggers.logError(loggers.thisLineTryCatch(resInvoice.msg) + ': ' + resInvoice.msg)
                        }
                        continue;
                    }
                }
            }

        }

    }
    catch (err) {
        loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
        console.log(err);
    }
}

let ProcessCustom = async () => {
    try {


        let getInvoices = await clsGRPInvoice.SelectCustomInvoices()
        if (getInvoices && getInvoices.length > 0) {

            for (let i = 0; i < getInvoices.length; i++) {

                if (getInvoices[i].invoiceType == 'CR') {
                    let pushGetInv = await clsInvoiceIntegration.putInvoice(getInvoices[i].invoiceNo, 'CR')
                    if (pushGetInv && pushGetInv.status) {

                        console.log('success ' + getInvoices[i].invoiceNo)

                    }
                }
                else {

                    let pushAPPrepayment = await clsReceipt.putReceipt(getInvoices[i].invoiceNo, '1')
                    if (pushAPPrepayment && pushAPPrepayment.status) {

                        console.log('success AP' + getInvoices[i].invoiceNo)

                    }
                }
            }

        }

        console.log('complete')

    }
    catch (err) {
        loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
        console.log(err);
    }
}


let ProcessDocApplyAP = async () => {
    try {

        //get failed DocApply for AP invoices
        let getDocApply = await clsGRPReceipt.SelectDocApplyList()
        //let getDocApply = await clsGRPInvoice.SelectCustomInvoices()
        if (getDocApply && getDocApply.length > 0) {

            for (let i = 0; i < getDocApply.length; i++) {
                await clsReceipt.putReceipt(getDocApply[i].invoiceNo, '2')
                await new Promise(resolve => setTimeout(resolve, 15000)); // 15 seconds delay
            }
        }
        console.log('complete Doc Apply')
    }
    catch (err) {
        loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
        console.log(err);
    }
}



let ProcessPushInvoice = async () => {
    try {

        //repush invoice AP / CR depend on flag
        let getInv3 = await clsGRPInvoice.SelectCustomInvoices()
        let getInv = getInv3.filter(tbl => tbl.remark == 'tbl_grp_invoice')
        let getInv2 = getInv3.filter(tbl => tbl.remark == 'tbl_grp_receipt' && tbl.flag != null)
        if (getInv && getInv.length > 0) {
            for (let i = 0; i < getInv.length; i++) {
                // for (let i = 0; i < 101; i++) {
                await clsInvoiceIntegration.putInvoice(getInv[i].invoiceNo, getInv[i].invoiceType);
                await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds delay
            }
        }
        if (getInv2 && getInv2.length > 0) {
            for (let i = 0; i < getInv2.length; i++) {
                // for (let i = 0; i < 101; i++) {
                await clsReceipt.putReceipt(getInv2[i].invoiceNo, getInv2[i].flag);
                await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds delay
            }
        }
        console.log('complete Push Invoices')
    }
    catch (err) {
        loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
        console.log(err);
    }
}
let oLogicInvMaster = require('../../CUSTOMER/repositories/PaymentRepository/Customers/ViewInvoices')
let oLogicOnlinePayment = require('../../CUSTOMER/controller/PaymentModuleController/OnlinePayments/OnlinePaymentController')
exports.eGHLCallBackScheduler = async (req, res) => {
    let objeGHL = {}
    try {
        let mp_orderno = req.query.OrderNo
        let dataQuery = await paymentRepository.getOrderData(mp_orderno)
        if (dataQuery) {
            let resultInvMaster
            let result = dataQuery[0].invoiceNo ? dataQuery[0].invoiceNo.replace(/\s+/g, '').split(",") : ''
            if (result && result.length > 0) {
                let newresult = "('" + result.join("'" + ',' + "'") + "')";
                let InvArr = []
                for (let x in result) {
                    let Invproperty = {}
                    if (result[x].includes('I') || result[x].includes('Q')) {
                        Invproperty = await paymentRepository.getInvoice_byQuotationNo(result[x])
                    } else {
                        Invproperty = await paymentRepository.getInvMaster_byInvoiceNo_prop(result[x])
                    }
                    InvArr.push(Invproperty)
                }
                resultInvMaster = InvArr
            } else {
                resultInvMaster = await paymentRepository.getInvMaster_byInvoice_no(dataQuery[0].invoiceNo)
            }
            //resultInvMaster = await oLogicInvMaster.InvoiceMasterdetails(dataQuery[0].invoiceNo)

            if (resultInvMaster && resultInvMaster.length > 0) {
                const eGHLPaymentURL = process.env.NEXT_PUBLIC_EGHL_PAYMENTURL;
                const eGHLPaymentPswd = process.env.NEXT_PUBLIC_EGHL_SERVICEPSWD;
                let queryRequestData = {
                    TransactionType: "QUERY",
                    PymtMethod: '',
                    ServiceID: process.env.NEXT_PUBLIC_EGHL_SERVICEID,
                    PaymentID: dataQuery[0].mp_description,
                    Amount: parseFloat(dataQuery[0].mp_amount).toFixed(2),
                    CurrencyCode: resultInvMaster[0].Currency,
                    HashValue: ""
                }
                let hashkey = eGHLPaymentPswd + queryRequestData.ServiceID + queryRequestData.PaymentID + queryRequestData.Amount + queryRequestData.CurrencyCode
                queryRequestData.HashValue = createHash('sha256').update(hashkey).digest('hex');

                let urlQuery = `${eGHLPaymentURL}?TransactionType=${queryRequestData.TransactionType}&PymtMethod=${queryRequestData.PymtMethod}&ServiceID=${queryRequestData.ServiceID}&PaymentID=${queryRequestData.PaymentID}&Amount=${queryRequestData.Amount}&CurrencyCode=${queryRequestData.CurrencyCode}&HashValue=${queryRequestData.HashValue}`
                console.log(urlQuery)
                let response = await axios({
                    url: urlQuery,
                    method: 'get',
                    headers: {
                        'content-type': "application/x-www-form-urlencoded"
                    }
                })
                console.log(JSON.stringify(response.data))


                if (response.data) {
                    let newresult1 = querystring.parse(response.data, '&', '=');
                    //for (let i in resultInvMaster) {
                    let data = {}
                    data.ServiceID = newresult1.ServiceID
                    data.OrderNumber = newresult1.OrderNumber ? newresult1.OrderNumber : mp_orderno
                    data.Param6 = dataQuery[0].mp_orderid
                    data.Amount = newresult1.Amount
                    data.PaymentID = newresult1.PaymentID
                    data.Param7 = dataQuery[0].mp_email
                    data.TxnStatus = newresult1.TxnStatus || "-"
                    data.TxnMessage = newresult1.TxnMessage.replace("'", "`") || "-"
                    data.TxnID = newresult1.TxnID || "-"
                    data.IssuingBank = newresult1.IssuingBank || "-"
                    data.Acquirer = newresult1.Acquirer ? `${newresult1.PymtMethod} - ${newresult1.Acquirer}` : ''
                    data.HashValue = newresult1.HashValue
                    data.mp_responsebody = JSON.stringify(newresult1)
                    data.mp_HashValue2 = newresult1.HashValue2 || "-"
                    data.mp_BankRefNo = newresult1.BankRefNo || "-"
                    //data.Invoice_master_id = resultInvMaster[i].Id
                    let UpdateData = await oLogicOnlinePayment.onlinePaymentCallback(data)
                    if (UpdateData) {
                        objeGHL.Result = UpdateData
                    }
                    //}
                    objeGHL.newresult1 = newresult1
                    //res.json(objeGHL)
                    return objeGHL
                }
            } else {
                objeGHL.msg = 'Invoice or Order No. Not found'
                objeGHL.Status = 'FAILED'
                return objeGHL
            }
        }
    }
    catch (err) {
        loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
        console.log(err);
    }
}
exports.eGHLCallBackGetStatus = async (req, res) => {
    let objeGHL = {}
    try {
        let mp_orderno = req.query.OrderNo
        let dataQuery = await paymentRepository.getOrderData(mp_orderno)
        if (dataQuery && dataQuery.length > 0) {
            let resultInvMaster
            let result = dataQuery[0].invoiceNo ? dataQuery[0].invoiceNo.replace(/\s+/g, '').split(",") : ''
            if (result && result.length > 0) {
                let newresult = "('" + result.join("'" + ',' + "'") + "')";
                let InvArr = []
                for (let x in result) {
                    let Invproperty = {}
                    if (result[x].includes('I') || result[x].includes('Q')) {
                        Invproperty = await paymentRepository.getInvoice_byQuotationNo(result[x])
                    } else {
                        Invproperty = await paymentRepository.getInvMaster_byInvoiceNo_prop(result[x])
                    }
                    InvArr.push(Invproperty)
                }
                resultInvMaster = InvArr
            } else {
                resultInvMaster = await paymentRepository.getInvMaster_byInvoice_no(dataQuery[0].invoiceNo)
            }
            //resultInvMaster = await oLogicInvMaster.InvoiceMasterdetails(dataQuery[0].invoiceNo)

            if (resultInvMaster && resultInvMaster.length > 0) {
                const eGHLPaymentURL = process.env.NEXT_PUBLIC_EGHL_PAYMENTURL;
                const eGHLPaymentPswd = process.env.NEXT_PUBLIC_EGHL_SERVICEPSWD;
                let queryRequestData = {
                    TransactionType: "QUERY",
                    PymtMethod: '',
                    ServiceID: process.env.NEXT_PUBLIC_EGHL_SERVICEID,
                    PaymentID: dataQuery[0].mp_description,
                    Amount: parseFloat(dataQuery[0].mp_amount).toFixed(2),
                    CurrencyCode: resultInvMaster[0].Currency,
                    HashValue: ""
                }
                let hashkey = eGHLPaymentPswd + queryRequestData.ServiceID + queryRequestData.PaymentID + queryRequestData.Amount + queryRequestData.CurrencyCode
                queryRequestData.HashValue = createHash('sha256').update(hashkey).digest('hex');

                let urlQuery = `${eGHLPaymentURL}?TransactionType=${queryRequestData.TransactionType}&PymtMethod=${queryRequestData.PymtMethod}&ServiceID=${queryRequestData.ServiceID}&PaymentID=${queryRequestData.PaymentID}&Amount=${queryRequestData.Amount}&CurrencyCode=${queryRequestData.CurrencyCode}&HashValue=${queryRequestData.HashValue}`
                console.log(urlQuery)
                let response = await axios({
                    url: urlQuery,
                    method: 'get',
                    headers: {
                        'content-type': "application/x-www-form-urlencoded"
                    }
                })
                console.log(JSON.stringify(response.data))


                if (response.data) {
                    let newresult1 = querystring.parse(response.data, '&', '=');
                    let MappingRes = []
                    for (let i in resultInvMaster) {
                        let data = {}
                        data.ServiceID = newresult1.ServiceID
                        data.OrderNumber = newresult1.OrderNumber ? newresult1.OrderNumber : mp_orderno
                        data.Param6 = dataQuery[0].mp_orderid
                        data.Amount = newresult1.Amount
                        data.PaymentID = newresult1.PaymentID
                        data.Param7 = dataQuery[0].mp_email
                        data.TxnStatus = newresult1.TxnStatus || "-"
                        data.TxnMessage = newresult1.TxnMessage.replace("'", "`") || "-"
                        data.TxnID = newresult1.TxnID || "-"
                        data.IssuingBank = newresult1.IssuingBank || "-"
                        data.Acquirer = newresult1.Acquirer ? `${newresult1.PymtMethod} - ${newresult1.Acquirer}` : ""
                        data.HashValue = newresult1.HashValue
                        data.mp_responsebody = JSON.stringify(newresult1)
                        data.mp_HashValue2 = newresult1.HashValue2 || "-"
                        data.mp_BankRefNo = newresult1.BankRefNo || "-"
                        data.Invoice_master_id = resultInvMaster[i].Id
                        MappingRes.push(data)

                    }

                    objeGHL.MappingResult = MappingRes
                    objeGHL.newresult1 = newresult1
                    return res.json(objeGHL)
                }
            } else {
                objeGHL.msg = 'Invoice or Order No. Not found'
                objeGHL.Status = 'FAILED'
                return res.json(objeGHL)
            }
        }
    }
    catch (err) {
        loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
        console.log(err);
    }
}
exports.eGHLCallBack_Push = async (req, res) => {
    ///for tansaction_status=Pending Authorisation
    try {
        let objCallback = {}
        let ArrList = []
        let getList = await paymentRepository.getInvMaster_byStatus('7')
        if (getList) {
            for (let i in getList) {
                objCallback.query = {
                    OrderNo: getList[i].Order_no
                }
                objCallback = await this.eGHLCallBackScheduler(objCallback, res)
            }

        } else {
            objCallback.msg = 'No invoice Pending for Bank Authorization'
            objCallback.Status = true
        }

        res.json(objCallback)
    } catch (err) {
        loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
        console.log(err);
    }
}
exports.eGHLCallBack_PendingStatus = async (req, res) => {
    ///for tansaction_status=Pending 
    try {
        let objCallback = {}
        let ArrList = []
        let getList = await paymentRepository.getInvOnlinePyment_byTransStatus()
        if (getList) {
            for (let i in getList) {
                objCallback = {}
                objCallback.query = {
                    OrderNo: getList[i].mp_orderno
                }
                objCallback = await this.eGHLCallBackScheduler(objCallback, res)
            }

        } else {
            objCallback.msg = 'No invoice Pending'
            objCallback.Status = true
        }

        res.json(objCallback)
    } catch (err) {
        loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
        console.log(err);
    }
}