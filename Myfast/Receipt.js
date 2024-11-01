const moment = require('moment');
const AppSettings = require('../../webconfig');
const loggers = require('../../log');
const ctlAccessToken = require('./AccessToken');
const oLogicInvoice = require('../../repositories/CostingSheet/InvoiceLogic');
const clsGRPReceipt = require('../../repositories/MyFAST/GRPReceipt');
const clsGRPInvoice = require('../../repositories/MyFAST/GRPInvoice');
const clsInvoice = require('../../repositories/App_Code/clsInvoice');
const clsInvoiceDetails = require('../../../CUSTOMER/repositories/PaymentRepository/InvoiceDetails');
const oLogicCosting = require('../../repositories/CostingSheet/CostingSheetLogic')
const iGSTIntegrationRepository = require('../../../CUSTOMER/repositories/IGSTIntegrationRepository/IGSTIntegrationRepository')
const clsGSTIntegration2 = require('../../repositories/App_Code/clsGSTIntegration2')
const clsPayment = require('../../../CUSTOMER/repositories/PaymentRepository/Customers/PaymentRepository')
let now = moment().format('YYYY-MM-DD HH:mm:ss');
let checkdate = moment(new Date('2022-01-01')).format('YYYY-MM-DD');
let dateGoLive = AppSettings.MYFAST_CR_GO_LIVE;
var commanConstants = require('../../config/Constants');
let invoiceDetailsdata = require('../../../CUSTOMER/repositories/PaymentRepository/Customers/ViewInvoices');
let Receipt_backup = require('../MyFAST/Receipt_backup');
const oLogicCaknaPayment = require("../../../CAKNA/repositories/CaknaPayment/CaknaPayment");

// Status : 1 - AP, type = Prepayment
// Status : 2 - AP - Doc To Apply, CR, type = Payment
// Status : 3 - Cancellation Inv (CRM)
let currentdate = new Date(); //CH2023
const oLogicFile = require("../../repositories/File/FileLogic");

exports.putReceipt = async (InvNo, Status = "", partialRefundAmt = 0, invoiceNoNew = '') => {
    // exports.putReceipt = async (req, res) => { // InvNo only
    try {
        // DO NOT SET THIS TO TRUE UNLESS YOU WANT TO USE CODE AT ESCISDEV THAT REQUIRE YOU TO
        // CHANGE JSON detail/ DO CRM MANUALLY DUE TO WRONG AMOUNT SEND TO MYFAST.
        let ESCIS_SERVER = false;
        if (ESCIS_SERVER == true) {
            await Receipt_backup.putReceipt(InvNo, Status, partialRefundAmt = 0, invoiceNoNew = '')
            return;
        }

        let NewPaymentRef = ''
        let Description = ''
        let NoOpenInv = false;
        let obj = {}
        let invoiceNo = InvNo
        let mixInvType = false
        let docApply = false
        let msg = null
        let pass = false //indicator pass or failed to docapply
        // let invoiceNo = req.body.invoiceNo
        // let Status = req.body.Status
        let putDataPayment = true //change here
        let exceptional = false // true if inv AP job complete > 1/3/24 but prepayment < 1/3/24 ; SST 8%
        if (!invoiceNo) {
            console.log('Invoice No. not supplied!')
            return false
        }
        let getInvoiceMaster
        if (invoiceNoNew != '') {
            getInvoiceMaster = await oLogicInvoice.SelectInvoiceMasterbyInvoiceNo(invoiceNoNew)
        }
        else {
            getInvoiceMaster = await oLogicInvoice.SelectInvoiceMasterbyInvoiceNo(invoiceNo)
            let getNewPaymentRef_Desc = await getNewPaymentRef(invoiceNo)

            if (getNewPaymentRef_Desc != null && getNewPaymentRef_Desc.Description != '' && getNewPaymentRef_Desc.NewPaymentRef && getNewPaymentRef_Desc.NewPaymentRef != '' && getNewPaymentRef_Desc.NewPaymentRef != '-' && getNewPaymentRef_Desc.NewPaymentRef != undefined) {
                Description = getNewPaymentRef_Desc.Description
                NewPaymentRef = getNewPaymentRef_Desc.NewPaymentRef
            }
            else {
                let getVerifiedDate = await VerifiedDate(invoiceNo)
                if (getVerifiedDate && getVerifiedDate.VerifiedDate != '' && getVerifiedDate.VerifiedDate < '2024-01-01' && Status == '2' && getInvoiceMaster[0].Invoice_type == 'AP' ) {
                    //allow to proceed the process since this inv was generated on 2021
                }
                else if (getVerifiedDate && getVerifiedDate.VerifiedDate != '' && getVerifiedDate.VerifiedDate < '2024-01-01' && Status == '1' && getInvoiceMaster[0].Invoice_type == 'AP' ) {
                    putDataPayment = false // allow only to get prepayment data from myfast in case no data in grp receipt
                }
                else if (Status !== '3') {
                    console.log('Description' + getNewPaymentRef_Desc.Description + ' ,' + 'NewPaymentRef' + getNewPaymentRef_Desc.NewPaymentRef)
                    return false
                }

            }
        }

        //CH2023
        // if (getInvoiceMaster != null && getInvoiceMaster.length>0) {
        //     let tempInvDate = new Date(getInvoiceMaster[0].Invoice_date).getFullYear();
        // 	let tempPaymentDate = getInvoiceMaster[0].Payment_date != null && getInvoiceMaster[0].Payment_date != '' ?new Date(getInvoiceMaster[0].Payment_date).getFullYear() : ''

        //     if (getInvoiceMaster[0].Invoice_type == 'CR' && tempPaymentDate < 2024 && currentdate < new Date('2024-01-09')) {
        //         putDataPayment = false //
        //     }
        //     else if (getInvoiceMaster[0].Invoice_type == 'AP' && tempPaymentDate < 2024 && Status != '3' && currentdate < new Date('2024-01-09')) {
        //         if (Status == '1'){
        //             putDataPayment = false //
        //          }
        //         else{//status 2 need to complete job first
        //             let fileId = getInvoiceMaster[0].File_id
        //             let resultFile = await oLogicFile.SelectFiledDataBy_FileID(fileId).catch((e) => {loggers.logError(loggers.thisLine2() + ': ' + `${e}`)
        //             console.log(e);});
        //             if (resultFile != null && resultFile.length > 0 && resultFile[0].LicenseeType != null && resultFile[0].LicenseeType == 4) {
        //                 putDataPayment = false //
        //             }

        //             else{
        //                 let JobComplete = await clsGRPReceipt.getAuditRptData_ByInvNo(invoiceNo)
        //                 if (JobComplete && JobComplete.length > 0 && JobComplete[0].Status == '2') {
        //                     let tempJobComplete = new Date(JobComplete[0].ModifiedDate).getFullYear();
        //                     if (tempJobComplete < 2024){
        //                         putDataPayment = false //
        //                     }
        //                 }
        //                 else {
        //                     putDataPayment = false
        //                     console.log('NOT ALLLOWED!')
        //                     return;
        //                 }
        //             }

        //         }

        //     }
        //     else{
        //         putDataPayment = false
        //         console.log('NOT ALLLOWED!')
        //     }
        // }
        //CH2023


        //NEW LOGIC ADD 10/1/24
        let cur_date = moment().format("YYYY-MM-DD")
        let newMethd = 0
        if ((Status == '2' && getInvoiceMaster[0].Invoice_type == 'CR') || (getInvoiceMaster[0].Invoice_type == 'AP')) {
            let getVerifiedDate = await VerifiedDate(invoiceNo)
            if (getVerifiedDate && getVerifiedDate.VerifiedDate != '') {
                if (cur_date >= getVerifiedDate.VerifiedDate) {
                    console.log('putDataPayment: ' + getVerifiedDate.VerifiedDate)
                    console.log('SUCESS!')
                    putDataPayment = true //change here

                    if (getVerifiedDate.VerifiedDate >= '2024-01-01') {
                        newMethd = 1 //json and get will use bank recon method
                    }
                    else {
                        newMethd = 0 //json and get will use old method
                    }
                    console.log('NewMethod : ' + newMethd)
                }
                else {
                    console.log('FAILED 1')
                    putDataPayment = false //permenant
                    return;
                }
            }
            else {
                console.log('FAILED 2')
                putDataPayment = false //permenant
                return;
            }
        }
        else if (Status == '3') {
            newMethd = 3
        }




        let invStatus = await this.checkInvoice(newMethd, invoiceNo, Status, pass)

        if (getInvoiceMaster && getInvoiceMaster.length) {
            let invoiceMstr = getInvoiceMaster[0]

            if (invoiceMstr.Invoice_type == 'AP' && invoiceMstr.InvBalance != null) {
                exceptional = true;
            }

            //temporary 13Feb2023 to repush docapply
            //--check status inv open or not
            if (Status == '2') {
                let accessToken = await ctlAccessToken.getAccessToken();

                let paramsINV = `%24filter=CustomerOrder eq '${invoiceMstr.Invoice_no.substring(3)}' `
                // let paramsINV = `%24filter=CustomerOrder eq '${invoiceMstr.Invoice_no.substring(3)+'A'}' ` // inv alphabet
                let getmyfastInv = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.Invoice, paramsINV)
                if (getmyfastInv && getmyfastInv.length > 0) {
                    let getOpenInv = getmyfastInv.filter(tbl => tbl.Status.value == 'Open' && tbl.Type.value == 'Invoice')
                    if (getOpenInv && getOpenInv.length > 0) {
                        if (invoiceMstr.invoice_type == 'AP') {
                            let resultGRPReceipt = await clsGRPReceipt.SelectGRPReceipt_ByInvoiceNo(invoiceNo);
                            if (resultGRPReceipt != null && resultGRPReceipt.length > 0 && resultGRPReceipt[0].PaymentRef == invoiceMstr.Receipt_no.substring(3) || ((moment(invoiceMstr.Invoice_date).utc().format('YYYY-MM-DD') < checkdate) && (moment(invoiceMstr.Payment_date).utc().format('YYYY-MM-DD') < checkdate))) {
                                let objUpd = {
                                    invoiceNo: invoiceNo,
                                    resStatus: '2',
                                    RecId: resultGRPReceipt[0].RecId
                                }
                                let update = await clsGRPReceipt.UpdateGRPReceipt(objUpd);
                            }
                            else {
                                let objUpd = {
                                    invoiceNo: invoiceNo,
                                    resStatus: '2',
                                    Escis_Remark: 'Different PaymentRef!',
                                    RecId: resultGRPReceipt[0].RecId

                                }
                                let update = await clsGRPReceipt.UpdateGRPReceipt(objUpd);
                                return false;

                            }
                        }

                    }
                    else if (getmyfastInv != null && getmyfastInv.length > 0 && getmyfastInv[0].Status.value == 'Closed' && getmyfastInv[0].Type.value == 'Invoice') {
                        NoOpenInv = true;

                    }
                    else {
                        console.log("NO OPEN INV: " + invoiceNo)
                        pass = true
                    }

                }
                else {
                    console.log("NO OPEN INV: " + invoiceNo)
                    pass = true
                }
            }

            //Added by Aida 10/05/2022 - to cater if inv type got two process ( ap + cr) based on one receipt
            let getInvType = await clsGRPReceipt.getInvoiceTypebyReceiptno(invoiceMstr.Receipt_no)
            if (getInvType != null && getInvType.length > 1) {
                mixInvType = true
            }

            let invoiceDetails = await oLogicInvoice.SelectInvoiceDetailsbyInvoiceMasterId(invoiceMstr.Id)

            // mapping for Payment Method, Bank_Code
            let bankAccountCode = ""
            let bankDesc = ""
            let BankDtl = []

            if (invoiceMstr.Payment_mode == "CHEQUE" || invoiceMstr.Payment_mode == "Cheque") {
                bankAccountCode = "CHQ"
                bankDesc = "CHEQUE"
            }
            else if (invoiceMstr.Payment_mode == "Cash") {
                bankAccountCode = "CSH"
                bankDesc = "CASH"
            }
            else if (invoiceMstr.Payment_mode == "Credit Card" || invoiceMstr.Payment_mode == "Credit Card (Visa/Mastercard/Amex)") {
                if (invoiceMstr.Payment_type == "Offline") {
                    bankAccountCode = "CRD";
                } else {
                    bankAccountCode = "CDR";
                }
            }
            else if (invoiceMstr.Payment_mode == "JOMPAY" || invoiceMstr.Payment_mode == "JomPAY") { bankAccountCode = "JOMPAY" }
            else if (invoiceMstr.Payment_mode == "CHEQUE DEPOSIT" || invoiceMstr.Payment_mode && invoiceMstr.Payment_mode.toUpperCase() == "BANK IN CHEQUE") {
                bankAccountCode = "CHQ"
                bankDesc = "BANK IN CHEQUE"
            }
            else if (invoiceMstr.Payment_mode == "IBG") { bankAccountCode = "OTH" }
            else if (invoiceMstr.Payment_mode == "IBG/EFT") { bankAccountCode = "OTH" }
            else if (invoiceMstr.Payment_mode == "Telegraphic Transfer" || invoiceMstr.Payment_mode && invoiceMstr.Payment_mode.trim() == "Bank Draft/Postal Order/EFT/IBG/RENTAS/TT/CDM") { bankAccountCode = "OTH" }
            else if (invoiceMstr.Payment_mode && invoiceMstr.Payment_mode.toUpperCase() == "BANK IN CASH") {
                bankAccountCode = "CSH"
                bankDesc = "BANK IN CASH"
            }
            else if (invoiceMstr.Payment_type == "Online") {
                if (invoiceMstr.Payment_mode.slice(0, 2) == "DD" || invoiceMstr.Payment_mode == '3~bankwire' || invoiceMstr.Payment_mode == 'FPX') {
                    bankAccountCode = "FPX"
                } else if (invoiceMstr.Payment_mode.slice(0, 2) == "CC" || invoiceMstr.Payment_mode == '5~creditcard') {
                    bankAccountCode = "CDR"
                } else if (invoiceMstr.Payment_mode.slice(0, 2) == "WA" || invoiceMstr.Payment_mode == 'E-Wallet') {
                    bankAccountCode = "EWALLET"
                    bankDesc = "EWALLET"

                }
            }


            else bankAccountCode = '';

            console.log("Bank Pay Type: " + bankAccountCode)
            let getBankCodeDtl
            if (bankDesc != null && bankDesc != "") {
                getBankCodeDtl = await clsGRPReceipt.getBankCodeDetailsByPayTypeAndDesc(bankAccountCode, bankDesc);
            } else {
                getBankCodeDtl = await clsGRPReceipt.getBankCodeDetailsByPayType(bankAccountCode);
            }

            if (getBankCodeDtl) {
                console.log("Bank Details " + JSON.stringify(getBankCodeDtl))
                BankDtl.push({ Pay_type: getBankCodeDtl[0].Pay_type, Bank_code: getBankCodeDtl[0].Bank_code })
            }
            console.log("BankDtl: " + JSON.stringify(BankDtl))
            //end mapping Payment Method, Bank_Code

            if (invoiceDetails && invoiceDetails.length > 0) {
                //Receipt
                let resultReceipt;
                if (invStatus) {
                    resultReceipt = await this.requestFormatARReceipt(exceptional, newMethd, NewPaymentRef, Description, invoiceMstr, invoiceDetails, invoiceNo, Status, BankDtl, mixInvType, partialRefundAmt) // old inv 2021
                } else {
                    resultReceipt = await this.requestFormatARReceipt2(exceptional, newMethd, NewPaymentRef, Description, invoiceMstr, invoiceDetails, invoiceNo, Status, BankDtl, mixInvType, partialRefundAmt) // new inv > 2021
                }

                if (resultReceipt.data && resultReceipt.data.length == 0 && resultReceipt.msg != '') {
                    obj = {
                        status: false,
                        data: [],
                        msg: resultReceipt.msg,
                        service_type: ''
                    }
                    console.log(obj)
                    return obj;

                }
                else {
                    if (resultReceipt && !!resultReceipt.status) {
                        //check if there's no doctoapply
                        let numDocApply = resultReceipt.obj.DocumentsToApply != undefined && resultReceipt.obj.DocumentsToApply.length > 0 ? resultReceipt.obj.DocumentsToApply.length : 0
                        console.log(numDocApply)

                        if (numDocApply == 0 && Status == 2) {
                            putDataPayment = false //permenant
                        }

                        //checking tbl_grp_receipt_res
                        let resultGRPReceipt = await clsGRPReceipt.SelectGRPReceipt_ByInvoiceNo(invoiceNo);

                        //insert tbl_grp_receipt_ress
                        let rcp = {}
                        let RecId = 0
                        if (resultGRPReceipt !== null && resultGRPReceipt.length > 0) {
                            RecId = resultGRPReceipt[0].RecId
                            rcp.RecId = RecId
                            rcp.invoiceNo = invoiceNo //kaksyu add
                            rcp.Flag = Status
                            rcp.Mix = mixInvType
                            rcp.resStatus = '2'
                            if (numDocApply == 0 && resultReceipt.docApply == false && Status == '2') {
                                rcp.Remark = "escis:No DocToApply!"
                            }
                            rcp.reqData = JSON.stringify(resultReceipt.obj)

                            await clsGRPReceipt.UpdateGRPReceipt(rcp);
                        } else {
                            rcp.Flag = Status
                            rcp.invoiceNo = invoiceNo
                            rcp.invoiceType = invoiceMstr.Payment_type
                            rcp.reqData = JSON.stringify(resultReceipt.obj)
                            rcp.Mix = mixInvType
                            rcp.CreatedDate = now
                            rcp.ModifiedDate = now
                            rcp.resStatus = '2'
                            if (numDocApply == 0 && resultReceipt.docApply == false && Status == '2') {
                                rcp.Remark = "escis:No DocToApply!"
                            }
                            RecId = await clsGRPReceipt.InsertGRPReceipt(rcp);
                        }

                        // call AR 5.3
                        if ((numDocApply > 0 && Status == '2' && resultReceipt.docApply == true) || (Status != '2' && resultReceipt.docApply == false)) {
                            let accessToken = await ctlAccessToken.getAccessTokenPayment();
                            if (accessToken != null) {

                                console.log('requestFormatARReceipt')
                                console.log(JSON.stringify(resultReceipt.obj))

                                let type = ""
                                if (Status == "1" || mixInvType == true || invoiceMstr.Invoice_type == 'AP') {
                                    type = "Prepayment"
                                } else if (Status == "3") {
                                    type = "CRM"
                                } else {
                                    type = "Payment"
                                }

                                let getPayment;

                                if (newMethd == 0) {
                                    // check ada buat cancellation ke tak
                                    let payStatus = "Voided"
                                    let paramsReceipt = `%24filter=PaymentRef eq '${invoiceMstr.Receipt_no != null ? (invoiceMstr.Receipt_no).substring(3) : ""}' and Status ne '${payStatus}' and Type eq '${type}'`
                                    console.log('paramsReceipt' + paramsReceipt)

                                    let accessToken = ''
                                    accessToken = await ctlAccessToken.getAccessToken();
                                    getPayment = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.PaymentGet, paramsReceipt)
                                    loggers.logError(loggers.thisLine2() + ': ' + `${'getPayment - putReceipt' + JSON.stringify(getPayment)}`)
                                }
                                else if (newMethd == 1) {
                                    let paramsReceipt = `%24filter=cf.String(f='Document.AttributeEXTREFNO') eq '${invoiceMstr.Receipt_no != null ? (invoiceMstr.Receipt_no).substring(3) : ""}' and Status ne 'Voided'`
                                    console.log('paramsReceipt' + paramsReceipt)

                                    let accessToken = ''
                                    accessToken = await ctlAccessToken.getAccessToken();
                                    getPayment = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.PaymentGet, paramsReceipt)
                                    loggers.logError(loggers.thisLine2() + ': ' + `${'getPaymentNewMethod - putReceipt' + JSON.stringify(getPayment)}`)
                                }

                                if (getPayment != null && getPayment.length > 0 && Status == '1' && getPayment[0].PaymentAmount.value >= invoiceMstr.Total_amount) {
                                    putDataPayment = false //permenant
                                }
                                if (((invoiceMstr.Invoice_type == 'AP' || mixInvType == true) && Status == "2" && getPayment != null && getPayment.length > 0 && getPayment[0].Status.value == 'Closed' && invoiceMstr.Total_amount == getPayment[0].PaymentAmount.value)) { //CR24 check if ada balance && payment tak sama
                                    console.log("CLOSE RECEIPT, AMOUNT TALLY!")
                                }
                                //invoice2021 check receipt
                                else if (invoiceMstr.Invoice_type == 'AP' && (moment(invoiceMstr.Invoice_date).utc().format('YYYY-MM-DD') < checkdate || moment(invoiceMstr.Payment_date).utc().format('YYYY-MM-DD') < checkdate)) {
                                    //check in myfast

                                    if (newMethd == 0) {
                                        let type = "Prepayment"
                                        let payStatus = "Voided"
                                        let paramsReceipt = ''
                                        if (moment(invoiceMstr.Payment_date).utc().format('YYYY-MM-DD') < checkdate) {
                                            paramsReceipt = `%24filter=PaymentRef eq '${invoiceMstr.Invoice_no != null ? (invoiceMstr.Invoice_no).substring(3) : ""}' and Status ne '${payStatus}' and Type eq '${type}'`
                                        }
                                        else if (moment(invoiceMstr.Payment_date).utc().format('YYYY-MM-DD') >= checkdate) {
                                            paramsReceipt = `%24filter=PaymentRef eq '${invoiceMstr.Receipt_no != null ? (invoiceMstr.Receipt_no).substring(3) : ""}' and Status ne '${payStatus}' and Type eq '${type}'`
                                        }

                                        let accessToken = ''
                                        accessToken = await ctlAccessToken.getAccessToken();
                                        getPayment = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.PaymentGet, paramsReceipt)
                                        loggers.logError(loggers.thisLine2() + ': ' + `${'getPayment - checkInvoice' + JSON.stringify(getPayment)}`)

                                        console.log('getPayment2021' + JSON.stringify(getPayment))
                                    }
                                    else if (newMethd == 1) {
                                        let paramsReceipt = `%24filter=cf.String(f='Document.AttributeEXTREFNO') eq '${invoiceMstr.Receipt_no != null ? (invoiceMstr.Receipt_no).substring(3) : ""}' and Status ne 'Voided'`
                                        console.log('paramsReceipt' + paramsReceipt)

                                        let accessToken = ''
                                        accessToken = await ctlAccessToken.getAccessToken();
                                        getPayment = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.PaymentGet, paramsReceipt)
                                        loggers.logError(loggers.thisLine2() + ': ' + `${'getPaymentNewMethod - putReceipt' + JSON.stringify(getPayment)}`)
                                    }
                                    //if receipt already closed and exist many one-to-one inv tie to it
                                    if (getPayment !== null && getPayment.length > 0) {
                                        let getPayment2 = getPayment.filter(tbl => tbl.PaymentAmount.value == invoiceMstr.Total_amount)
                                        if (getPayment2.length == 0) {
                                            let getPayment3 = getPayment.filter(tbl => tbl.PaymentAmount.value > invoiceMstr.Total_amount)
                                            getPayment = getPayment3
                                        }
                                        else {
                                            getPayment = getPayment2
                                        }
                                    }
                                    if (Status == "2" && getPayment != null && getPayment.length > 0 && getPayment[0].Status.value == 'Closed' && invoiceMstr.Total_amount == getPayment[0].PaymentAmount.value) {
                                        console.log("CLOSE RECEIPT, AMOUNT TALLY!")
                                    }
                                    else if (Status == '1' && getPayment != null && getPayment.length > 0 && invoiceMstr.Total_amount == getPayment[0].PaymentAmount.value && invoiceMstr.Currency == 'MYR') {
                                        //get the payment
                                    }
                                    else if (Status == '1' && getPayment != null && getPayment.length > 0 && invoiceMstr.Currency != 'MYR') {
                                        //get the payment
                                    }
                                    else {
                                        getPayment = null

                                    }
                                    //putDataPayment = false //permenant



                                }
                                else if (getPayment != null && getPayment.length > 0 && getPayment[0].Status.value == 'Closed' && NoOpenInv == true && moment(invoiceMstr.Invoice_date).utc().format('YYYY-MM-DD') > checkdate && Status == '2') { //both inv & receipt closed
                                    //just update the table grp
                                }
                                else if (invoiceMstr.Invoice_type == 'AP' && mixInvType == false && Status == "2" && NoOpenInv == true) { //All AP & mix complete + incomplete job
                                    //just update the table grp
                                    pass = true
                                }
                                //Cater for DocApply AP and AP + CR (mix) & for Doc Apply CRM
                                else if (((invoiceMstr.Invoice_type == 'AP' || mixInvType == true) && Status == "2" && (resultReceipt.seperate == false || (getPayment != null && getPayment.length > 0 && getPayment[0].AppliedToDocuments != null && getPayment[0].AppliedToDocuments.value == undefined))) || Status == "3") {
                                    console.log("applydocnull")
                                    getPayment = null
                                }

                                console.log('getPayment' + JSON.stringify(getPayment))
                                // if (invoiceMstr.Currency != null && invoiceMstr.Currency != '' && invoiceMstr.Currency.trim() == 'MYR') { //open integration point Payment for AP & CR Local only 11/2/2022
                                let resAccount = null
                                if (getPayment && getPayment.length > 0) { //check if exist in myFast
                                    resAccount = getPayment[0]
                                }
                                else if (getPayment && getPayment.message != undefined) {
                                    putDataPayment = false // off integration if server myfast error
                                    return obj = {
                                        status: false,
                                        data: [],
                                        msg: 'Cannot get from MYFAST!!',
                                        service_type: ''
                                    }
                                }
                                else {
                                    //Added by Aida 10/05/2022 - to cater if inv type got two process ( ap + cr) based on one receipt
                                    if ((invoiceMstr.Invoice_type == 'AP' || mixInvType == true) && Status == "2") {
                                        if (resultReceipt.docApply == true) {
                                            let Apply = true
                                            if (Status == "2") { //check status inv before docapply
                                                // let accessToken = await ctlAccessToken.getAccessToken();
                                                let paramsINV = `%24filter=CustomerOrder eq '${invoiceNo.substring(3)}' and Type eq 'Invoice' and Status ne 'Closed'`
                                                // let paramsINV = `%24filter=CustomerOrder eq '${invoiceNo.substring(3)+'A'}' and Type eq 'Invoice' and Status ne 'Closed'` // inv alphabet
                                                let getOpenInv = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.Invoice, paramsINV)
                                                loggers.logError(loggers.thisLine2() + ': ' + `${'getOpenInv - putInvoice' + JSON.stringify(getOpenInv)}`)
                                                getOpenInv = getOpenInv.filter(tbl => tbl.Status.value == "Open")
                                                if (getOpenInv != null && getOpenInv.length > 0) {
                                                    Apply = true;
                                                }
                                                else {
                                                    let paramsINV = `%24filter=CustomerOrder eq '${invoiceNo.substring(3)}' and Type eq 'Invoice' and Status eq 'Closed'`
                                                    // let paramsINV = `%24filter=CustomerOrder eq '${invoiceNo.substring(3)+'A'}' and Type eq 'Invoice' and Status eq 'Closed'` // inv alphabet
                                                    let getCloseInv = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.Invoice, paramsINV)
                                                    loggers.logError(loggers.thisLine2() + ': ' + `${'getCloseInv - putInvoice' + JSON.stringify(getCloseInv)}`)
                                                    getCloseInv = getCloseInv.filter(tbl => tbl.Status.value == "Closed")
                                                    Apply = false
                                                    console.log("inv mix closed!")
                                                    let resultGRPReceipt = await clsGRPReceipt.SelectGRPReceipt_ByInvoiceNo(InvNo)

                                                    let PayRef = invoiceMstr.Receipt_no != null ? (invoiceMstr.Receipt_no).substring(3) : ""
                                                    if (mixInvType) { Flag = "1" }

                                                    let chkPaymenGRP = await clsGRPReceipt.SelectGRPReceipt_ByRef(PayRef, "1")
                                                    if (getCloseInv && getCloseInv.length > 0) {
                                                        //update grp_receipt//
                                                        let resitDtl = {}
                                                        resitDtl.RecId = resultGRPReceipt[0].RecId
                                                        resitDtl.ReferenceNbr = resultGRPReceipt[0].PrepaymentReferenceNbr != '' ? resultGRPReceipt[0].PrepaymentReferenceNbr : ''
                                                        resitDtl.Flag = '2'
                                                        resitDtl.resStatus = '1'
                                                        resitDtl.resId = getCloseInv[0].id
                                                        resitDtl.invoiceNo = InvNo
                                                        resitDtl.Escis_Remark = 'Inv Closed!'
                                                        resitDtl.ReferenceNbr = getPayment != null && getPayment.ReferenceNbr != null ? getPayment.ReferenceNbr : chkPaymenGRP != null && chkPaymenGRP.length > 0 && chkPaymenGRP[0].ReferenceNbr != null && chkPaymenGRP[0].ReferenceNbr != '' ? chkPaymenGRP[0].ReferenceNbr : ''
                                                        resitDtl.PaymentRef = chkPaymenGRP != null && chkPaymenGRP.length > 0 && chkPaymenGRP[0].PaymentRef != null && chkPaymenGRP[0].PaymentRef != '' ? chkPaymenGRP[0].PaymentRef : ''
                                                        await clsGRPReceipt.UpdateGRPReceipt(resitDtl)
                                                        return;
                                                    }
                                                }
                                            }
                                            if (Apply == true) {
                                                let accessToken = ''
                                                accessToken = await ctlAccessToken.getAccessTokenPayment();

                                                let isValid = false;
                                                if (Status == "2" && moment(invoiceMstr.Invoice_date).utc().format('YYYY-MM-DD') >= checkdate && moment(invoiceMstr.Payment_date).utc().format('YYYY-MM-DD') >= checkdate && resultReceipt.obj.Type.value != 'Prepayment') {
                                                    isValid = await this.DocApplyValidation(newMethd, resultReceipt.obj)
                                                }
                                                else {
                                                    isValid = true;
                                                }

                                                if (putDataPayment == true && isValid == true) {
                                                    resAccount = await ctlAccessToken.putDataPayment(ctlAccessToken.apiRoutes.Payment, '', resultReceipt.obj)
                                                    loggers.logError(loggers.thisLine2() + ': ' + `${'resAccount - putReceipt' + JSON.stringify(resAccount)}`)
                                                }

                                                if (resAccount && resAccount.id) { msg = 'Completed DocToApply AP!' }
                                            }

                                        } else {
                                            msg = 'Invoice details not tally with DocToApply items!'
                                        }
                                    } else {
                                        if (Status != "3") { // if Payment & Prepayment only
                                            let PayRef = invoiceMstr.Receipt_no != null ? (invoiceMstr.Receipt_no).substring(3) : ""
                                            let Flag = Status
                                            if (mixInvType) { Flag = "1" } //

                                            let chkPaymenGRP = await clsGRPReceipt.SelectGRPReceipt_ByRefAndFlag(PayRef, Flag, "1")
                                            if (chkPaymenGRP != null && chkPaymenGRP.length > 0) { // if data already exist for inv Receipt No
                                                let paramsReceipt;
                                                let accessToken = ''
                                                accessToken = await ctlAccessToken.getAccessToken();

                                                if (newMethd == 0) {
                                                    // check ada buat cancellation ke tak
                                                    let payStatus = "Voided"
                                                    paramsReceipt = `%24filter=PaymentRef eq '${invoiceMstr.Receipt_no != null ? (invoiceMstr.Receipt_no).substring(3) : ""}' and Status ne '${payStatus}' and Type eq '${type}'`
                                                    console.log('paramsReceipt' + paramsReceipt)

                                                }
                                                else if (newMethd == 1) {
                                                    paramsReceipt = `%24filter=cf.String(f='Document.AttributeEXTREFNO') eq '${invoiceMstr.Receipt_no != null ? (invoiceMstr.Receipt_no).substring(3) : ""}' and Status ne 'Voided'`
                                                    console.log('paramsReceipt' + paramsReceipt)
                                                }

                                                getPayment = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.PaymentGet, paramsReceipt)
                                                loggers.logError(loggers.thisLine2() + ': ' + `${'getPayment - putReceipt2' + JSON.stringify(getPayment)}`)
                                                if (getPayment && getPayment.length > 0) {
                                                    resAccount = getPayment[0]
                                                }

                                            } else {
                                                if (Status == "1" || (Status == "2" && resultReceipt.docApply == true)) {
                                                    let Apply = true;
                                                    if (Status == "2" && resultReceipt.docApply == true) { //check status inv before docapply
                                                        // let accessToken = await ctlAccessToken.getAccessToken();
                                                        let paramsINV = `%24filter=CustomerOrder eq '${invoiceNo.substring(3)}' and Type eq 'Invoice' and Status ne 'Closed'`
                                                        // let paramsINV = `%24filter=CustomerOrder eq '${invoiceNo.substring(3)+'A'}' and Type eq 'Invoice' and Status ne 'Closed'` // inv alphabet

                                                        let getOpenInv = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.Invoice, paramsINV)
                                                        loggers.logError(loggers.thisLine2() + ': ' + `${'getOpenInv - putInvoice' + JSON.stringify(getOpenInv)}`)
                                                        getOpenInv = getOpenInv != null && getOpenInv.length > 0 ? getOpenInv.filter(tbl => tbl.Status.value == "Open") : null
                                                        if (getOpenInv != null && getOpenInv.length > 0) {
                                                            Apply = true;
                                                        }
                                                        else {
                                                            let paramsINV = `%24filter=CustomerOrder eq '${invoiceNo.substring(3)}' and Type eq 'Invoice' and Status eq 'Closed'`
                                                            // let paramsINV = `%24filter=CustomerOrder eq '${invoiceNo.substring(3)+'A'}' and Type eq 'Invoice' and Status eq 'Closed'` // inv alphabet
                                                            let getCloseInv = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.Invoice, paramsINV)
                                                            loggers.logError(loggers.thisLine2() + ': ' + `${'getCloseInv - putInvoice' + JSON.stringify(getCloseInv)}`)
                                                            getCloseInv = getCloseInv != null && getCloseInv.length > 0 ? getCloseInv.filter(tbl => tbl.Status.value == "Closed") : null

                                                            Apply = false

                                                            let resultGRPReceipt = await clsGRPReceipt.SelectGRPReceipt_ByInvoiceNo(InvNo)

                                                            let PayRef = invoiceMstr.Receipt_no != null ? (invoiceMstr.Receipt_no).substring(3) : ""
                                                            if (mixInvType) { Flag = "1" }
                                                            let chkPaymenGRP = await clsGRPReceipt.SelectGRPReceipt_ByRef(PayRef, "1")
                                                            if (getCloseInv && getCloseInv.length > 0) {
                                                                //update grp_receipt//
                                                                let resitDtl = {}
                                                                resitDtl.RecId = resultGRPReceipt[0].RecId
                                                                resitDtl.ReferenceNbr = resultGRPReceipt[0].PrepaymentReferenceNbr != '' ? resultGRPReceipt[0].PrepaymentReferenceNbr : ''
                                                                resitDtl.Flag = '2'
                                                                resitDtl.resStatus = '1'
                                                                resitDtl.resId = getCloseInv[0].id
                                                                resitDtl.invoiceNo = InvNo
                                                                resitDtl.Escis_Remark = 'Inv Closed!'
                                                                resitDtl.ReferenceNbr = getPayment != null && getPayment.ReferenceNbr != null ? getPayment.ReferenceNbr : chkPaymenGRP != null && chkPaymenGRP.length > 0 && chkPaymenGRP[0].ReferenceNbr != null && chkPaymenGRP[0].ReferenceNbr != '' ? chkPaymenGRP[0].ReferenceNbr : ''
                                                                resitDtl.PaymentRef = chkPaymenGRP != null && chkPaymenGRP.length > 0 && chkPaymenGRP[0].PaymentRef != null && chkPaymenGRP[0].PaymentRef != '' ? chkPaymenGRP[0].PaymentRef : ''
                                                                await clsGRPReceipt.UpdateGRPReceipt(resitDtl)
                                                                console.log("INVOICE CLOSE!")
                                                                return;
                                                            }
                                                        }
                                                    }
                                                    if (Apply == true) {
                                                        // push to myFast if prepayment, payment with complete docApply, CRM
                                                        accessToken = ''
                                                        accessToken = await ctlAccessToken.getAccessTokenPayment();
                                                        console.log("hereee")

                                                        let isValid = false;
                                                        if (Status == "2" && moment(invoiceMstr.Invoice_date).utc().format('YYYY-MM-DD') >= checkdate && resultReceipt.obj.Type.value != 'Prepayment') {
                                                            isValid = await this.DocApplyValidation(newMethd, resultReceipt.obj)
                                                        }
                                                        else {
                                                            isValid = true;
                                                        }

                                                        if (putDataPayment == true && isValid == true) {
                                                            resAccount = await ctlAccessToken.putDataPayment(ctlAccessToken.apiRoutes.Payment, '', resultReceipt.obj)
                                                            loggers.logError(loggers.thisLine2() + ': ' + `${'resAccount - putReceipt2' + JSON.stringify(resAccount)}`)
                                                        }
                                                        //resAccount = ''
                                                    }

                                                }
                                                if (resAccount && resAccount.id) { } else { // if fail, try to get 2x

                                                    let paramsReceipt = ''
                                                    accessToken = ''
                                                    accessToken = await ctlAccessToken.getAccessToken();
                                                    if (newMethd == 0) {
                                                        let payStatus = "Voided"
                                                        paramsReceipt = `%24filter=PaymentRef eq '${invoiceMstr.Receipt_no != null ? (invoiceMstr.Receipt_no).substring(3) : ""}' and Status ne '${payStatus}' and Type eq '${type}'`
                                                        console.log('paramsReceipt' + paramsReceipt)

                                                    }
                                                    else if (newMethd == 1) {
                                                        paramsReceipt = `%24filter=cf.String(f='Document.AttributeEXTREFNO') eq '${invoiceMstr.Receipt_no != null ? (invoiceMstr.Receipt_no).substring(3) : ""}' and Status ne 'Voided'`
                                                        console.log('paramsReceipt' + paramsReceipt)
                                                    }

                                                    for (let x = 0; x < 2; x++) {
                                                        getPayment = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.PaymentGet, paramsReceipt)
                                                    }
                                                    loggers.logError(loggers.thisLine2() + ': ' + `${'getPayment - putReceipt3' + JSON.stringify(getPayment)}`)

                                                    if (getPayment && getPayment.length > 0) {
                                                        resAccount = getPayment[0]
                                                    }
                                                }
                                            }
                                        }
                                        else if (partialRefundAmt > 0) {
                                            accessToken = ''
                                            accessToken = await ctlAccessToken.getAccessTokenPayment();

                                            let isValid = false;
                                            if (Status == "2" && moment(invoiceMstr.Invoice_date).utc().format('YYYY-MM-DD') >= checkdate && resultReceipt.obj.Type.value != 'Prepayment') {
                                                isValid = await this.DocApplyValidation(newMethd, resultReceipt.obj)
                                            }
                                            else {
                                                isValid = true;
                                            }

                                            if (putDataPayment == true && isValid == true) {
                                                resAccount = await ctlAccessToken.putDataPayment(ctlAccessToken.apiRoutes.Payment, '', resultReceipt.obj)
                                                loggers.logError(loggers.thisLine2() + ': ' + `${'resAccount - putReceipt2' + JSON.stringify(resAccount)}`)
                                            }
                                        }
                                        else { // if invoice Cancellation
                                            accessToken = ''
                                            accessToken = await ctlAccessToken.getAccessTokenPayment();
                                            //hawari ask for change api use to do cancellation 27/9/22
                                            let isValid = false;
                                            if (Status == "2" && moment(invoiceMstr.Invoice_date).utc().format('YYYY-MM-DD') >= checkdate && resultReceipt.obj.Type.value != 'Prepayment') {
                                                isValid = await this.DocApplyValidation(newMethd, resultReceipt.obj)
                                            }
                                            else {
                                                isValid = true;
                                            }

                                            if (putDataPayment == true && isValid == true) {
                                                resAccount = await ctlAccessToken.putDataPayment(ctlAccessToken.apiRoutes.Payment, '', resultReceipt.obj)
                                                loggers.logError(loggers.thisLine2() + ': ' + `${'resAccount - putReceipt2' + JSON.stringify(resAccount)}`)
                                            }
                                            //ori code 27/9/22
                                            // resAccount = await ctlAccessToken.putDataReverse(ctlAccessToken.apiRoutes.Reverse, '', resultReceipt.obj)
                                            // loggers.logError(loggers.thisLine2() + ': ' + `${'resAccount - putReceipt3' + JSON.stringify(resAccount)}`)

                                        }
                                    }
                                }

                                console.log('resAccount' + JSON.stringify(resAccount))
                                // let body = {}
                                //13Feb23; checking success apply or not after get response from myfast
                                if (Status == '2') {
                                    if (resAccount && resAccount.status == false) {

                                    }

                                    else if (resAccount && resAccount.id && Status == '2' && resAccount.Status.value == 'Closed' || resAccount && resAccount.Hold.value == true
                                    ) {
                                        pass = true;
                                        console.log("ALREADY APPLY!")
                                    }
                                    else if (resAccount && resAccount.id && Status == '2' && resAccount.DocumentsToApply && resAccount.DocumentsToApply.length > 0 && resAccount.DocumentsToApply[0].id) {
                                        pass = true;
                                        console.log("SUCESS DOC APPLY!")
                                        console.log(resAccount.DocumentsToApply)
                                    }
                                    else if (pass == false) {
                                        console.log("error " + invoiceNo)
                                    }
                                }

                                //28Feb23
                                if (newMethd == 1) {
                                    if (resAccount != undefined && (resAccount.message == undefined || resAccount.message == null)) {
                                        if ((((resAccount && resAccount.id && Status == '1') || pass == true) && resAccount != null && resAccount.custom != undefined && resAccount.custom.Document != null && resAccount.custom.Document.AttributeEXTREFNO != null && resAccount.custom.Document.AttributeEXTREFNO.value != null && resAccount.custom.Document.AttributeEXTREFNO.value != undefined && resAccount.custom.Document.AttributeEXTREFNO.value == invoiceMstr.Receipt_no.substring(3) || resAccount.PaymentRef.value == invoiceMstr.Receipt_no.substring(3)) ||
                                            (((resAccount && resAccount.id && Status == '1') || pass == true) && moment(invoiceMstr.Invoice_date).utc().format('YYYY-MM-DD') < checkdate)) //if inv 2021
                                        {
                                            let body = {
                                                RecId: RecId,
                                                resId: resAccount.id,
                                                note: resAccount.note,
                                                ApplicationDate: resAccount.ApplicationDate.value != undefined ? moment(resAccount.ApplicationDate.value).format('YYYY-MM-DD HH:mm:ss') : undefined,
                                                AppliedToDocuments: resAccount.AppliedToDocuments.value != undefined ? resAccount.AppliedToDocuments.value : undefined,
                                                ARAccount: resAccount.ARAccount.value != undefined ? resAccount.ARAccount.value : undefined,
                                                ARSubaccount: resAccount.ARSubaccount.value != undefined ? resAccount.ARSubaccount.value : undefined,
                                                Branch: resAccount.Branch.value != undefined ? resAccount.Branch.value : undefined,
                                                CardAccountNbr: resAccount.CardAccountNbr.value != undefined ? resAccount.CardAccountNbr.value : undefined,
                                                CashAccount: resAccount.CashAccount.value != undefined ? resAccount.CashAccount.value : undefined,
                                                CurrencyID: resAccount.CurrencyID.value != undefined ? resAccount.CurrencyID.value : undefined,
                                                CustomerID: resAccount.CustomerID.value != undefined ? resAccount.CustomerID.value : undefined,
                                                Description: resAccount.Description.value != undefined ? resAccount.Description.value : undefined,
                                                Hold: resAccount.Hold.value != undefined ? resAccount.Hold.value : undefined,
                                                PaymentAmount: resAccount.PaymentAmount.value != undefined ? resAccount.PaymentAmount.value : undefined,
                                                PaymentMethod: resAccount.PaymentMethod.value != undefined ? resAccount.PaymentMethod.value : undefined,
                                                PaymentRef: invoiceMstr.Receipt_no.substring(3),
                                                ReferenceNbr: resAccount.ReferenceNbr.value != undefined ? resAccount.ReferenceNbr.value : undefined,
                                                Status: resAccount.Status.value != undefined ? resAccount.Status.value : undefined,
                                                Type: resAccount.Type.value != undefined ? resAccount.Type.value : undefined,
                                                custom: resAccount.custom.value != undefined ? resAccount.custom.value : undefined,
                                                resData: JSON.stringify(resAccount),
                                                ModifiedDate: now,
                                                resStatus: "1",//"SUCCESS",
                                                NewPaymentRef: resAccount.PaymentRef.value != undefined ? resAccount.PaymentRef.value : undefined,
                                            }

                                            if (Status == "1") {
                                                body.PrepaymentReferenceNbr = resAccount.ReferenceNbr.value != undefined ? resAccount.ReferenceNbr.value : undefined
                                            }

                                            if (RecId != undefined && RecId != null && RecId != 0) {
                                                //kaksyu add
                                                body.invoiceNo = invoiceNo
                                                await clsGRPReceipt.UpdateGRPReceipt(body);
                                            }

                                            return obj = {
                                                status: true,
                                                data: resAccount,
                                                msg: 'OK!',
                                                service_type: 'confirmServiceDelivery'
                                            }
                                        }
                                        else if (moment(invoiceMstr.Payment_date).utc().format('YYYY-MM-DD') > dateGoLive && (Status == '1' || Status == '2') && resultReceipt && resultReceipt.obj && resultReceipt.obj.Type &&
                                            resultReceipt.obj.Type.value == 'Prepayment') {
                                            let body = {
                                                RecId: RecId,
                                                resId: resAccount.id,
                                                note: resAccount.note,
                                                ApplicationDate: resAccount.ApplicationDate.value != undefined ? moment(resAccount.ApplicationDate.value).format('YYYY-MM-DD HH:mm:ss') : undefined,
                                                AppliedToDocuments: resAccount.AppliedToDocuments.value != undefined ? resAccount.AppliedToDocuments.value : undefined,
                                                ARAccount: resAccount.ARAccount.value != undefined ? resAccount.ARAccount.value : undefined,
                                                ARSubaccount: resAccount.ARSubaccount.value != undefined ? resAccount.ARSubaccount.value : undefined,
                                                Branch: resAccount.Branch.value != undefined ? resAccount.Branch.value : undefined,
                                                CardAccountNbr: resAccount.CardAccountNbr.value != undefined ? resAccount.CardAccountNbr.value : undefined,
                                                CashAccount: resAccount.CashAccount.value != undefined ? resAccount.CashAccount.value : undefined,
                                                CurrencyID: resAccount.CurrencyID.value != undefined ? resAccount.CurrencyID.value : undefined,
                                                CustomerID: resAccount.CustomerID.value != undefined ? resAccount.CustomerID.value : undefined,
                                                Description: resAccount.Description.value != undefined ? resAccount.Description.value : undefined,
                                                Hold: resAccount.Hold.value != undefined ? resAccount.Hold.value : undefined,
                                                PaymentAmount: resAccount.PaymentAmount.value != undefined ? resAccount.PaymentAmount.value : undefined,
                                                PaymentMethod: resAccount.PaymentMethod.value != undefined ? resAccount.PaymentMethod.value : undefined,
                                                PaymentRef: invoiceMstr.Receipt_no.substring(3),
                                                ReferenceNbr: resAccount.ReferenceNbr.value != undefined ? resAccount.ReferenceNbr.value : undefined,
                                                Status: resAccount.Status.value != undefined ? resAccount.Status.value : undefined,
                                                Type: resAccount.Type.value != undefined ? resAccount.Type.value : undefined,
                                                custom: resAccount.custom.value != undefined ? resAccount.custom.value : undefined,
                                                resData: JSON.stringify(resAccount),
                                                ModifiedDate: now,
                                                resStatus: "1",//"SUCCESS",
                                                NewPaymentRef: resAccount.PaymentRef.value != undefined ? resAccount.PaymentRef.value : undefined,
                                            }

                                            if (Status == "1") {
                                                body.PrepaymentReferenceNbr = resAccount.ReferenceNbr.value != undefined ? resAccount.ReferenceNbr.value : undefined
                                            }

                                            if (RecId != undefined && RecId != null && RecId != 0) {
                                                //kaksyu add
                                                body.invoiceNo = invoiceNo
                                                await clsGRPReceipt.UpdateGRPReceipt(body);
                                            }

                                            return obj = {
                                                status: true,
                                                data: resAccount,
                                                msg: 'OK!',
                                                service_type: 'confirmServiceDelivery'
                                            }

                                        }
                                        else if (invoiceMstr.Invoice_type == 'AP' && resAccount && resAccount.id && Status == '2' && pass == true && moment(invoiceMstr.Payment_date).utc().format('YYYY-MM-DD') < checkdate) {
                                            {
                                                let body = {
                                                    RecId: RecId,
                                                    resId: resAccount.id,
                                                    note: resAccount.note,
                                                    ApplicationDate: resAccount.ApplicationDate.value != undefined ? moment(resAccount.ApplicationDate.value).format('YYYY-MM-DD HH:mm:ss') : undefined,
                                                    AppliedToDocuments: resAccount.AppliedToDocuments.value != undefined ? resAccount.AppliedToDocuments.value : undefined,
                                                    ARAccount: resAccount.ARAccount.value != undefined ? resAccount.ARAccount.value : undefined,
                                                    ARSubaccount: resAccount.ARSubaccount.value != undefined ? resAccount.ARSubaccount.value : undefined,
                                                    Branch: resAccount.Branch.value != undefined ? resAccount.Branch.value : undefined,
                                                    CardAccountNbr: resAccount.CardAccountNbr.value != undefined ? resAccount.CardAccountNbr.value : undefined,
                                                    CashAccount: resAccount.CashAccount.value != undefined ? resAccount.CashAccount.value : undefined,
                                                    CurrencyID: resAccount.CurrencyID.value != undefined ? resAccount.CurrencyID.value : undefined,
                                                    CustomerID: resAccount.CustomerID.value != undefined ? resAccount.CustomerID.value : undefined,
                                                    Description: resAccount.Description.value != undefined ? resAccount.Description.value : undefined,
                                                    Hold: resAccount.Hold.value != undefined ? resAccount.Hold.value : undefined,
                                                    PaymentAmount: resAccount.PaymentAmount.value != undefined ? resAccount.PaymentAmount.value : undefined,
                                                    PaymentMethod: resAccount.PaymentMethod.value != undefined ? resAccount.PaymentMethod.value : undefined,
                                                    PaymentRef: invoiceMstr.Receipt_no.substring(3),
                                                    ReferenceNbr: resAccount.ReferenceNbr.value != undefined ? resAccount.ReferenceNbr.value : undefined,
                                                    Status: resAccount.Status.value != undefined ? resAccount.Status.value : undefined,
                                                    Type: resAccount.Type.value != undefined ? resAccount.Type.value : undefined,
                                                    custom: resAccount.custom.value != undefined ? resAccount.custom.value : undefined,
                                                    resData: JSON.stringify(resAccount),
                                                    ModifiedDate: now,
                                                    resStatus: "1",//"SUCCESS"
                                                    NewPaymentRef: resAccount.PaymentRef.value != undefined ? resAccount.PaymentRef.value : undefined,

                                                }

                                                if (RecId != undefined && RecId != null && RecId != 0) {
                                                    //kaksyu add
                                                    body.invoiceNo = invoiceNo
                                                    await clsGRPReceipt.UpdateGRPReceipt(body);
                                                }

                                                return obj = {
                                                    status: true,
                                                    data: resAccount,
                                                    msg: 'OK!',
                                                    service_type: 'confirmServiceDelivery'
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        let body = {}

                                        if (resultGRPReceipt !== null && resultGRPReceipt.length > 0 && resultGRPReceipt[0].resStatus == "1" && resultGRPReceipt[0].Flag == "2") {
                                            //payment already success
                                        } else {

                                            if (resAccount) {
                                                msg = resAccount.message
                                            }

                                            let resStat = "2"
                                            let resData, Type, ReferenceNbr, resId;
                                            if (Status == "3") { //check if CRM
                                                if (resAccount && resAccount == 204) { // success push DocApply
                                                    msg = 'Completed DocToApply CRM!'
                                                    resStat = "1"
                                                }
                                                else if (msg && msg.includes("Reference Nbr")) {     // already DocApply CRM
                                                    msg = 'Completed DocToApply CRM!'
                                                    resStat = "1"
                                                }
                                                else if (resAccount && resAccount.id && resAccount.Type.value == 'Credit Memo') {
                                                    resStat = "1"
                                                    resData = JSON.stringify(resAccount)
                                                    Type = 'Credit Memo'
                                                    ReferenceNbr = resAccount.ReferenceNbr.value != undefined ? resAccount.ReferenceNbr.value : null
                                                    resId = resAccount.id
                                                }
                                                else {
                                                    msg = 'Failed DocToApply CRM!'
                                                }
                                            }

                                            if (Status == '3' && resAccount) {
                                                body = {
                                                    RecId: RecId,
                                                    resStatus: resStat,
                                                    Remark: msg,
                                                    resData: resData,
                                                    Type: Type,
                                                    ReferenceNbr: ReferenceNbr,
                                                    resId: resId
                                                }

                                            }
                                            else {

                                                body = {
                                                    RecId: RecId,
                                                    resStatus: resStat,
                                                    Remark: msg,
                                                }

                                            }
                                            if (RecId != undefined && RecId != null && RecId != 0) {
                                                body.invoiceNo = invoiceNo //kaksyu add
                                                body.Escis_Remark = resAccount == null ? 'INTEGRATION FAILED!!!' : ''
                                                await clsGRPReceipt.UpdateGRPReceipt(body);
                                            }
                                        }

                                        return obj = {
                                            status: false,
                                            data: [],
                                            msg: 'Error!',
                                            service_type: ''
                                        }
                                    }
                                }
                                else if (newMethd == 0 || Status == '3') {
                                    if ((((resAccount && resAccount.id && Status == '1') || pass == true) && resAccount.PaymentRef.value == invoiceMstr.Receipt_no.substring(3)) ||
                                        (((resAccount && resAccount.id && Status == '1') || pass == true) && moment(invoiceMstr.Invoice_date).utc().format('YYYY-MM-DD') < checkdate)) //if inv 2021
                                    {
                                        let body = {
                                            RecId: RecId,
                                            resId: resAccount.id,
                                            note: resAccount.note,
                                            ApplicationDate: resAccount.ApplicationDate.value != undefined ? moment(resAccount.ApplicationDate.value).format('YYYY-MM-DD HH:mm:ss') : undefined,
                                            AppliedToDocuments: resAccount.AppliedToDocuments.value != undefined ? resAccount.AppliedToDocuments.value : undefined,
                                            ARAccount: resAccount.ARAccount.value != undefined ? resAccount.ARAccount.value : undefined,
                                            ARSubaccount: resAccount.ARSubaccount.value != undefined ? resAccount.ARSubaccount.value : undefined,
                                            Branch: resAccount.Branch.value != undefined ? resAccount.Branch.value : undefined,
                                            CardAccountNbr: resAccount.CardAccountNbr.value != undefined ? resAccount.CardAccountNbr.value : undefined,
                                            CashAccount: resAccount.CashAccount.value != undefined ? resAccount.CashAccount.value : undefined,
                                            CurrencyID: resAccount.CurrencyID.value != undefined ? resAccount.CurrencyID.value : undefined,
                                            CustomerID: resAccount.CustomerID.value != undefined ? resAccount.CustomerID.value : undefined,
                                            Description: resAccount.Description.value != undefined ? resAccount.Description.value : undefined,
                                            Hold: resAccount.Hold.value != undefined ? resAccount.Hold.value : undefined,
                                            PaymentAmount: resAccount.PaymentAmount.value != undefined ? resAccount.PaymentAmount.value : undefined,
                                            PaymentMethod: resAccount.PaymentMethod.value != undefined ? resAccount.PaymentMethod.value : undefined,
                                            PaymentRef: resAccount.PaymentRef.value != undefined ? resAccount.PaymentRef.value : undefined,
                                            ReferenceNbr: resAccount.ReferenceNbr.value != undefined ? resAccount.ReferenceNbr.value : undefined,
                                            Status: resAccount.Status.value != undefined ? resAccount.Status.value : undefined,
                                            Type: resAccount.Type.value != undefined ? resAccount.Type.value : undefined,
                                            custom: resAccount.custom.value != undefined ? resAccount.custom.value : undefined,
                                            resData: JSON.stringify(resAccount),
                                            ModifiedDate: now,
                                            resStatus: "1"//"SUCCESS"
                                        }

                                        if (Status == "1") {
                                            body.PrepaymentReferenceNbr = resAccount.ReferenceNbr.value != undefined ? resAccount.ReferenceNbr.value : undefined
                                        }

                                        if (RecId != undefined && RecId != null && RecId != 0) {
                                            //kaksyu add
                                            body.invoiceNo = invoiceNo
                                            await clsGRPReceipt.UpdateGRPReceipt(body);
                                        }

                                        return obj = {
                                            status: true,
                                            data: resAccount,
                                            msg: 'OK!',
                                            service_type: 'confirmServiceDelivery'
                                        }
                                    }
                                    else if (invoiceMstr.Invoice_type == 'AP' && resAccount && resAccount.id && Status == '2' && pass == true && moment(invoiceMstr.Payment_date).utc().format('YYYY-MM-DD') < checkdate) {
                                        {
                                            let body = {
                                                RecId: RecId,
                                                resId: resAccount.id,
                                                note: resAccount.note,
                                                ApplicationDate: resAccount.ApplicationDate.value != undefined ? moment(resAccount.ApplicationDate.value).format('YYYY-MM-DD HH:mm:ss') : undefined,
                                                AppliedToDocuments: resAccount.AppliedToDocuments.value != undefined ? resAccount.AppliedToDocuments.value : undefined,
                                                ARAccount: resAccount.ARAccount.value != undefined ? resAccount.ARAccount.value : undefined,
                                                ARSubaccount: resAccount.ARSubaccount.value != undefined ? resAccount.ARSubaccount.value : undefined,
                                                Branch: resAccount.Branch.value != undefined ? resAccount.Branch.value : undefined,
                                                CardAccountNbr: resAccount.CardAccountNbr.value != undefined ? resAccount.CardAccountNbr.value : undefined,
                                                CashAccount: resAccount.CashAccount.value != undefined ? resAccount.CashAccount.value : undefined,
                                                CurrencyID: resAccount.CurrencyID.value != undefined ? resAccount.CurrencyID.value : undefined,
                                                CustomerID: resAccount.CustomerID.value != undefined ? resAccount.CustomerID.value : undefined,
                                                Description: resAccount.Description.value != undefined ? resAccount.Description.value : undefined,
                                                Hold: resAccount.Hold.value != undefined ? resAccount.Hold.value : undefined,
                                                PaymentAmount: resAccount.PaymentAmount.value != undefined ? resAccount.PaymentAmount.value : undefined,
                                                PaymentMethod: resAccount.PaymentMethod.value != undefined ? resAccount.PaymentMethod.value : undefined,
                                                PaymentRef: resAccount.PaymentRef.value != undefined ? resAccount.PaymentRef.value : undefined,
                                                ReferenceNbr: resAccount.ReferenceNbr.value != undefined ? resAccount.ReferenceNbr.value : undefined,
                                                Status: resAccount.Status.value != undefined ? resAccount.Status.value : undefined,
                                                Type: resAccount.Type.value != undefined ? resAccount.Type.value : undefined,
                                                custom: resAccount.custom.value != undefined ? resAccount.custom.value : undefined,
                                                resData: JSON.stringify(resAccount),
                                                ModifiedDate: now,
                                                resStatus: "1"//"SUCCESS"
                                            }

                                            if (RecId != undefined && RecId != null && RecId != 0) {
                                                //kaksyu add
                                                body.invoiceNo = invoiceNo
                                                await clsGRPReceipt.UpdateGRPReceipt(body);
                                            }

                                            return obj = {
                                                status: true,
                                                data: resAccount,
                                                msg: 'OK!',
                                                service_type: 'confirmServiceDelivery'
                                            }
                                        }
                                    }
                                    else {
                                        let body = {}

                                        if (resultGRPReceipt !== null && resultGRPReceipt.length > 0 && resultGRPReceipt[0].resStatus == "1" && resultGRPReceipt[0].Flag == "2") {
                                            //payment already success
                                        } else {

                                            if (resAccount) {
                                                msg = resAccount.message
                                            }

                                            let resStat = "2"
                                            let resData, Type, ReferenceNbr, resId;
                                            if (Status == "3") { //check if CRM
                                                if (resAccount && resAccount == 204) { // success push DocApply
                                                    msg = 'Completed DocToApply CRM!'
                                                    resStat = "1"
                                                }
                                                else if (msg && msg.includes("Reference Nbr")) {     // already DocApply CRM
                                                    msg = 'Completed DocToApply CRM!'
                                                    resStat = "1"
                                                }
                                                else if (resAccount && resAccount.id && resAccount.Type.value == 'Credit Memo') {
                                                    resStat = "1"
                                                    resData = JSON.stringify(resAccount)
                                                    Type = 'Credit Memo'
                                                    ReferenceNbr = resAccount.ReferenceNbr.value != undefined ? resAccount.ReferenceNbr.value : null
                                                    resId = resAccount.id
                                                }
                                                else {
                                                    msg = 'Failed DocToApply CRM!'
                                                }
                                            }

                                            if (Status == '3' && resAccount) {
                                                body = {
                                                    RecId: RecId,
                                                    resStatus: resStat,
                                                    Remark: msg,
                                                    resData: resData,
                                                    Type: Type,
                                                    ReferenceNbr: ReferenceNbr,
                                                    resId: resId
                                                }

                                            }
                                            else {

                                                body = {
                                                    RecId: RecId,
                                                    resStatus: resStat,
                                                    Remark: msg,
                                                }

                                            }
                                            if (RecId != undefined && RecId != null && RecId != 0) {
                                                body.invoiceNo = invoiceNo //kaksyu add
                                                await clsGRPReceipt.UpdateGRPReceipt(body);
                                            }
                                        }

                                        return obj = {
                                            status: false,
                                            data: [],
                                            msg: 'Error!',
                                            service_type: ''
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                return obj;
            }
        }
    }
    catch (err) {
        loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
        console.log(err)
    }
}

exports.requestFormatARReceipt = async (exceptional, newMethd, NewPaymentRef, Description, invoiceMaster, invoiceDetail, InvNo, status, BankDtl, mixInvType, PartialRefundAmount = 0) => {
    try {
        let chkdate = moment(new Date('2022-01-01 00:00:00')).format('YYYY-MM-DD HH:mm:ss');
        let resStatus = true
        let invMaster = invoiceMaster
        let type = ''
        let arAccount = ''
        let arSubaccount = ''
        let applicationDate = ''
        let branch = ''
        let customerID = ''
        let paymentMethod = ''
        let cashAccount = ''
        let paymentAmount = 0
        let paymentRef = ''
        let description = ''
        let currency = ''
        let aryDoc = []
        let onHold = false
        let isDocApply = false
        let resObj = {}

        if (status == "3") {
            // Cancellation Inv
            type = 'Credit Memo'//'Invoice'//'CRM'
        } else {
            if (invMaster.Invoice_type == 'AP' || mixInvType == true) {
                // if AP or AP + CR (mix), type = Prepayment, if CR type = Payment
                type = 'Prepayment'
            } else {
                type = 'Payment'
            }
        }

        //onHold value - foreign - true, local - false
        if (invoiceMaster.Currency != null && invoiceMaster.Currency != '' && invoiceMaster.Currency.trim() != 'MYR') {
            onHold = true
        } else {
            onHold = false
        }

        //applicationDate = invoiceMaster.Payment_date ? moment(invoiceMaster.Payment_date).utc().format('YYYY-MM-DD') : moment().format('YYYY-MM-DD')
        let CustCode = invoiceMaster.CustCode != null ? invoiceMaster.CustCode : ""
        let crmID = ""
        if (CustCode != null && CustCode != '' && invoiceMaster.CRMAddrId != null && invoiceMaster.CRMAddrId != "") { //check existance of crmaddrid & custcode in tbl address
            CustCode = await clsInvoiceDetails.getCustcodebyCRMId(invoiceMaster.CRMAddrId)
            if (CustCode != null && CustCode.length > 1) {
                let AddrId = invoiceMaster.ApplicantAddressId
                CustCode = await clsInvoiceDetails.getCustcodebyCRMId(invoiceMaster.CRMAddrId, AddrId)
                CustCode = CustCode[0].CustCode
                if (CustCode == '' || CustCode != invoiceMaster.CustCode) {
                    CustCode = invoiceMaster.CustCode
                }

            }
            else {
                if (CustCode == '' || CustCode != invoiceMaster.CustCode) {
                    CustCode = invoiceMaster.CustCode
                }
                else {
                    CustCode = CustCode[0].CustCode
                    crmID = invoiceMaster.CRMAddrId
                    if (CustCode == null || crmID == null || crmID == '' || CustCode == '') { //concern about inactive custcode during push to myfast
                        //return error msg here
                        return obj = {
                            status: true,
                            data: [],
                            msg: 'Company not found!',
                        }
                    }

                }
            }

        }

        customerID = CustCode

        let custCRMId = await clsInvoiceDetails.getCustcode(CustCode)

        if (invoiceMaster.CRMAddrId != null && invoiceMaster.CRMAddrId != '') { //18Jan23 - get from master table
            crmID = invoiceMaster.CRMAddrId
        }
        else {
            if (custCRMId != null && custCRMId.length > 0 && custCRMId[0].crmid != undefined && custCRMId[0].crmid != null && custCRMId[0].crmid != '') {
                crmID = custCRMId[0].crmid
            } else {
                let getcrmIdAddrId = await clsInvoiceDetails.getCRMId_byCustCode(CustCode)
                if (getcrmIdAddrId != null && getcrmIdAddrId.length > 0 && getcrmIdAddrId[0].CRMAddrId != undefined && getcrmIdAddrId[0].CRMAddrId != null && getcrmIdAddrId[0].CRMAddrId != '') {
                    crmID = getcrmIdAddrId[0].CRMAddrId
                } else {
                    let getcompany = await clsGSTIntegration2.CompStructSoapRequest(CustCode).catch((e) => { loggers.logError(loggers.thisLine2() + ':' + `${e}`) })
                    if (getcompany && getcompany.length > 0 && getcompany[0] != null) {
                        for (let co in getcompany) {
                            if (getcompany[co].crmid != null) {
                                crmID = getcompany[co].crmid
                            }
                        }
                    }
                }

            }
        }


        // customerID = crmID
        paymentMethod = BankDtl != null && BankDtl.length > 0 ? BankDtl[0].Pay_type : ""
        cashAccount = BankDtl != null && BankDtl.length > 0 ? BankDtl[0].Bank_code : "" // get from tbl_sirim_bank_code
        // paymentAmount = (invoiceMaster.Total_amount).toFixed(2)
        paymentRef = invoiceMaster.Receipt_no != null ? (invoiceMaster.Receipt_no).substring(3) : "-"
        // paymentRef = NewPaymentRef
        loggers.logError(loggers.thisLine2() + ': ' + 'Receipt paymentRef (fx1):' + invoiceMaster.Receipt_no + '; InvNo: ' + InvNo)

        //description = invoiceMaster.Costing_type != null && invoiceMaster.Costing_type != '' ? invoiceMaster.Costing_type : invoiceMaster.Description
        // description = 'eSCIS payment'
        if (newMethd == 1) {
            description = Description
        }
        else if (newMethd == 0) {
            description = 'eSCIS payment'
        }
        currency = invoiceMaster.Currency || ""


        // if (invoiceMaster.Payment_mode == "CHEQUE") { // cheque no -  tbl_sirim_payment_history
        //     if (invoiceMaster.Order_no != null && invoiceMaster.Order_no != '') {
        //         let resPayment = await iGSTIntegrationRepository.getPaymentDetails(invoiceMaster.Order_no)
        //         if (resPayment != null && resPayment.length > 0 && resPayment[0].Cheque_no != null && resPayment[0].Cheque_no != '') {
        //             description = resPayment[0].Cheque_no
        //         }
        //     }
        // } else if (invoiceMaster.Payment_mode == "IBG" || invoiceMaster.Payment_mode == "IBG/EFT" || invoiceMaster.Payment_mode.slice(0, 2) == "DD" || invoiceMaster.Payment_mode.slice(0, 2) == "CC") {
        //     if (invoiceMaster.Order_no != null && invoiceMaster.Order_no != '') {
        //         let getFPXId = await clsPayment.getOnlineOrderDataLikeOrderNo(invoiceMaster.Order_no);
        //         if (getFPXId != null && getFPXId.length > 0 && getFPXId[0] != undefined && getFPXId[0].mp_txnid != undefined && getFPXId[0].mp_txnid != null && getFPXId[0].mp_txnid != '') {
        //             description = resPayment[0].mp_txnid
        //         }
        //     }
        // }

        if (invoiceMaster.Branch == null || invoiceMaster.Branch == "") {
            if (InvNo.substring(0, 3) == "152") {
                branch = "K-4-43-152"
            } else if (InvNo.substring(0, 3) == "351") {
                branch = "K-4-43-351"
            } else if (InvNo.substring(0, 3) == "153") {
                branch = "K-4-43-153"
            }
        } else {
            branch = invoiceMaster.Branch || ""
        }

        let receiptDate = ""
        let defTime = moment(new Date()).format('YYYY-MM-DD');
        if (invoiceMaster.Payment_date != undefined && invoiceMaster.Payment_date != null) {

            if (moment(invoiceMaster.Payment_date).utc().format('YYYY-MM-DD HH:mm:ss') < chkdate) {
                receiptDate = defTime + "T00:00:00";
                applicationDate = moment().format('YYYY-MM-DD')
            } else {
                //ORI CODE
                // defTime = moment(invoiceMaster.Payment_date).utc().format('YYYY-MM-DD'); // store localTime
                // receiptDate = defTime + "T00:00:00";
                // applicationDate = moment(invoiceMaster.Payment_date).utc().format('YYYY-MM-DD');
                if (moment(invoiceMaster.Payment_date).utc().format('YYYY-MM-DD HH:mm:ss') < now) { //if payment_date<current date, get current date
                    receiptDate = now;
                    applicationDate = moment().format('YYYY-MM-DD')
                } else {
                    defTime = moment(invoiceMaster.Payment_date).utc().format('YYYY-MM-DD'); // store localTime
                    receiptDate = moment(invoiceMaster.Payment_date).utc().format('YYYY-MM-DD');
                    applicationDate = moment(invoiceMaster.Payment_date).utc().format('YYYY-MM-DD');
                }
            }
        } else {
            receiptDate = defTime + "T00:00:00";
            applicationDate = moment().format('YYYY-MM-DD')
        }

        //CH2023
        //temporary for inv 2023
        // if (invoiceMaster != null) {
        //     let tempInvDate = new Date(invoiceMaster.Invoice_date).getFullYear();
        //     let tempPaymentDate = invoiceMaster.Payment_date != null && invoiceMaster.Payment_date != '' ? new Date(invoiceMaster.Payment_date).getFullYear() : ''

        //     if (currentdate >= new Date('2024-01-01') && currentdate < new Date('09-01-2024') && (tempInvDate < 2024 || (tempPaymentDate != '' && tempPaymentDate < 2024))) {
        //         applicationDate = moment().format('2023-12-31')
        //         receiptDate = moment().format('2023-12-31 00:00:00')
        //     }
        //     else if (currentdate > new Date('2024-01-13') && (tempInvDate < 2024 || (tempPaymentDate != '' && tempPaymentDate < 2024))) {
        //         applicationDate = moment().format('YYYY-MM-DD')
        //         receiptDate = moment().format('YYYY-MM-DD HH:MM:ss')
        //     }
        // }
        //CH2023


        //syu 12/5/2022 - to cater CN  where receiptno in inv master is cleared after head approved
        if (status == 3) {
            let resultcrdnote = await invoiceDetailsdata.GetCreditNote_byId(invoiceMaster.Id)
            if (resultcrdnote && resultcrdnote[0].CNReceiptNo) {
                invoiceMaster.Receipt_no = resultcrdnote[0].CNReceiptNo
            }
        }
        let getInvoiceAmt = await clsGRPReceipt.getInvoicesbyReceiptno(invoiceMaster.Receipt_no)
        getInvoiceAmt = getInvoiceAmt.filter(tbl => tbl.Status == '3')


        //without rounding
        // if (getInvoiceAmt != null && getInvoiceAmt.length > 0) {
        //     let totalAll = 0
        //     for (let x in getInvoiceAmt) {
        //         let getinvNo = await clsGRPReceipt.getInvoicesDetailbyInvNo(getInvoiceAmt[x].Id)
        //         let discountTotal = 0
        //         let totalItem = 0
        //         for (let y in getinvNo) {
        //             totalItem = getinvNo[y].Total_amount + totalItem
        //         }
        //         totalAll = totalItem + totalAll
        //         //      if (getInvoiceAmt && getInvoiceAmt[x].DiscountTotal > 0) {
        //         //     discountTotal = 0//getInvoiceAmt[x].DiscountTotal --En.Hawari 6/9/2022 request to send full amount for receipt, myfast will calculate on its  own
        //         // }
        //         // //let Amt = Number(getInvoiceList[x].Total_amount)
        //         // paymentAmount += getInvoiceAmt[x].Total_amount - discountTotal //.toFixed(2)
        //         //

        //     }
        //     paymentAmount = totalAll.toFixed(2)
        // }

        //with rounding @ full amount
        if (getInvoiceAmt != null && getInvoiceAmt.length > 0) {
            for (let x in getInvoiceAmt) {
                let discountTotal = 0
                if (getInvoiceAmt && getInvoiceAmt[x].DiscountTotal > 0) {
                    //discountTotal = 0
                    discountTotal = getInvoiceAmt[x].DiscountTotal
                    //En.Hawari 6/9/2022 request to send full amount for receipt, myfast will calculate on its  own
                    //myfast not calculate discount, so need to send disc 16/2/23
                }
                //let Amt = Number(getInvoiceList[x].Total_amount)
                paymentAmount += getInvoiceAmt[x].Total_amount - discountTotal //.toFixed(2)
            }
            paymentAmount = paymentAmount.toFixed(2)
        }
        let refNbr = ''
        let reqBody = {}
        refNbr = InvNo
        let DocToApply = []
        // let getInvoiceList = await clsGRPReceipt.getInvoicesbyReceiptnoAndInvType(invoiceMaster.Receipt_no, invoiceMaster.Invoice_type);
        if (status == "3") {
            let getInvData = await clsGRPInvoice.SelectGRPInvoice_InvoiceNo(InvNo)
            if (getInvData != null && getInvData.length > 0) {
                let getBillingData = getInvData.filter(item => item.invoiceType !== null && item.invoiceType != 'CRM' && item.invoiceType != 'Offline')

                if (getBillingData != null && getBillingData.length > 0) {

                    for (let x in getBillingData) {
                        let item = {
                            AmountPaid: {},
                            DocType: {},
                            ReferenceNbr: {},
                        }

                        item.AmountPaid = {
                            value: PartialRefundAmount > 0 ? PartialRefundAmount : getBillingData[x].Amount != null ? getBillingData[x].Amount.toFixed(2) : 0

                            // value: PartialRefundAmount > 0 ? PartialRefundAmount : (invoiceMaster.Total_amount).toFixed(2)//getBillingData[x].Amount != null ? getBillingData[x].Amount.toFixed(2) : 0
                        }

                        item.DocType = {
                            value: 'Invoice'
                        }

                        item.ReferenceNbr = {
                            value: InvNo
                        }

                        DocToApply.push(item)
                    }
                }
            }
        } else { //if not cancellation
            if ((invMaster.Invoice_type == 'AP' || mixInvType == true) && status == "2") {
                isDocApply = true
            }

            let getInvoiceList = await clsGRPReceipt.getInvoicesbyReceiptno(invoiceMaster.Receipt_no)
            getInvoiceList = getInvoiceList.filter(tbl => tbl.Status == '3')
            //  getInvoiceList = getInvoiceList.filter(tbl=>tbl.Invoice_no!="") //temporary to push invoice that have more than 1 record in tbl_sirim_inv_master but one of it dont have invoiceNo
            if (getInvoiceList != null && getInvoiceList.length > 0) {
                for (let i in getInvoiceList) {
                    InvNo = getInvoiceList[i].Invoice_no

                    let discountTotal = 0
                    if (getInvoiceList && getInvoiceList[i].DiscountTotal > 0) {
                        discountTotal = getInvoiceList[i].DiscountTotal  //myfast not calculate discount, so need to send disc 16/2/23
                        //discountTotal = 0-->-En.Hawari 6/9/2022 request to send full amount for receipt, myfast will calculate on its  own
                    }

                    let getInvData = await clsGRPInvoice.SelectGRPInvoice_InvoiceNo(InvNo)
                    if (getInvData != null && getInvData.length > 0) {
                        let getBillingData = getInvData.filter(item => item.invoiceType !== null && item.invoiceType != 'CRM' && item.invoiceType != 'Offline' && item.invoiceType != 'Online')

                        if (getBillingData != null && getBillingData.length > 0) {

                            arAccount = getBillingData[0].LinkARAccount
                            arSubaccount = getBillingData[0].LinkARSubAccount
                            branch = getBillingData[0].LinkBranch

                            for (let x in getBillingData) {
                                let item = {
                                    // AmountPaid: {},
                                    DocType: {},
                                    ReferenceNbr: {},
                                }

                                //15Feb2023; foreign not send amount during doc apply
                                if (invoiceMaster.Currency == 'MYR') {

                                    let AmountToApply;
                                    if (exceptional == true) {
                                        AmountToApply = getInvoiceList[i].Ori_total_amount.toFixed(2) - discountTotal
                                    }
                                    else {
                                        AmountToApply = getInvoiceList[i].Total_amount.toFixed(2) - discountTotal
                                    }
                                    item.AmountPaid = {
                                        value: AmountToApply //getBillingData[x].Amount != null ? getBillingData[x].Amount.toFixed(2) : 0 //paymentAmount
                                    }
                                }

                                item.DocType = {
                                    value: 'Invoice'
                                }

                                item.ReferenceNbr = {
                                    value: InvNo
                                }

                                DocToApply.push(item)
                            }
                        }
                    }
                }

                if (getInvoiceList.length == DocToApply.length) {
                    isDocApply = true
                } else {
                    console.log('Invoice details not tally with DocumentsToApply items!')
                    isDocApply = false
                }
            }
        }

        console.log('DocumentsToApply :  ' + JSON.stringify(DocToApply))

        if (DocToApply.length == 0) {
            console.log('No items added to DocumentsToApply array!')
        }

        if ((invMaster.Invoice_type == 'AP' || mixInvType == true) && status !== "3") {
            if (newMethd == 1) {
                reqBody = {
                    Type: {
                        value: type
                    },
                    ReferenceNbr: {
                        value: refNbr
                    },
                    ApplicationDate: {
                        value: moment().format('YYYY-MM-DD') // use current date
                        // value: applicationDate// CH2023

                    },
                    custom: {
                        Document: {
                            AttributeEXTREFNO: {
                                type: "String",
                                value: paymentRef
                            }
                        }
                    },
                    DocumentsToApply: DocToApply
                }
            }
            else if (newMethd == 0) {
                reqBody = {
                    Type: {
                        value: type
                    },
                    ReferenceNbr: {
                        value: refNbr
                    },
                    ApplicationDate: {
                        value: moment().format('YYYY-MM-DD') // use current date
                        // value: applicationDate// CH2023

                    },
                    DocumentsToApply: DocToApply
                }
            }

        } else {
            if (status == "3") { // cancel CRM
                reqBody = {
                    // entity: {
                    Type: {
                        value: type
                    },
                    ReferenceNbr: {
                        value: refNbr
                    },
                    ApplicationDate: {
                        value: moment().format('YYYY-MM-DD') + "T00:00:00"
                        // value: applicationDate //CH2023

                    },
                    DocumentsToApply: DocToApply
                    // }
                }
            } else {
                // CR & not mix inv type (CR + AP)
                if (newMethd == 1) {
                    if (currency != null && currency != '' && currency.trim() != 'MYR') {
                        reqBody = {
                            Type: {
                                value: type
                            },
                            ARAccount: {
                                value: arAccount
                            },
                            ARSubaccount: {
                                value: arSubaccount
                            },
                            ApplicationDate: {
                                value: applicationDate
                            },
                            Branch: {
                                value: branch
                            },
                            CurrencyID: {
                                value: currency
                            },
                            CustomerID: {
                                value: customerID
                            },
                            LocationID: {
                                value: crmID
                            },
                            PaymentMethod: {
                                value: paymentMethod
                            },
                            CashAccount: {
                                value: cashAccount
                            },
                            Hold: {
                                value: onHold
                            },
                            PaymentAmount: {
                                value: paymentAmount
                            },
                            PaymentRef: {
                                value: NewPaymentRef
                            },
                            Description: {
                                value: description
                            },
                            custom: {
                                Document: {
                                    AttributeTRANSDATE: {
                                        type: "CustomDateTimeField",
                                        value: receiptDate
                                    },
                                    AttributeCURYID: {
                                        type: "CustomStringField",
                                        value: currency.trim()
                                    },
                                    AttributeEXTREFNO: {
                                        type: "String",
                                        value: paymentRef
                                    }
                                }
                            },
                            DocumentsToApply: DocToApply
                        }
                    }
                    else {
                        reqBody = {
                            Type: {
                                value: type
                            },
                            ARAccount: {
                                value: arAccount
                            },
                            ARSubaccount: {
                                value: arSubaccount
                            },
                            ApplicationDate: {
                                value: applicationDate
                            },
                            Branch: {
                                value: branch
                            },
                            CurrencyID: {
                                value: currency
                            },
                            CustomerID: {
                                value: customerID
                            },
                            LocationID: {
                                value: crmID
                            },
                            PaymentMethod: {
                                value: paymentMethod
                            },
                            CashAccount: {
                                value: cashAccount
                            },
                            Hold: {
                                value: onHold
                            },
                            PaymentAmount: {
                                value: paymentAmount
                            },
                            PaymentRef: {
                                value: NewPaymentRef
                            },
                            Description: {
                                value: description
                            },
                            custom: {
                                Document: {
                                    AttributeTRANSDATE: {
                                        type: "CustomDateTimeField",
                                        value: receiptDate
                                    },
                                    AttributeEXTREFNO: {
                                        type: "String",
                                        value: paymentRef
                                    }
                                }
                            },
                            DocumentsToApply: DocToApply
                        }
                    }

                }
                else if (newMethd == 0) {
                    if (currency != null && currency != '' && currency.trim() != 'MYR') {
                        reqBody = {
                            Type: {
                                value: type
                            },
                            ARAccount: {
                                value: arAccount
                            },
                            ARSubaccount: {
                                value: arSubaccount
                            },
                            ApplicationDate: {
                                value: applicationDate
                            },
                            Branch: {
                                value: branch
                            },
                            CurrencyID: {
                                value: currency
                            },
                            CustomerID: {
                                value: customerID
                            },
                            LocationID: {
                                value: crmID
                            },
                            PaymentMethod: {
                                value: paymentMethod
                            },
                            CashAccount: {
                                value: cashAccount
                            },
                            Hold: {
                                value: onHold
                            },
                            PaymentAmount: {
                                value: paymentAmount
                            },
                            PaymentRef: {
                                value: paymentRef
                            },
                            Description: {
                                value: description
                            },
                            custom: {
                                Document: {
                                    AttributeTRANSDATE: {
                                        type: "CustomDateTimeField",
                                        value: receiptDate
                                    },
                                    AttributeCURYID: {
                                        type: "CustomStringField",
                                        value: currency.trim()
                                    }
                                }
                            },
                            DocumentsToApply: DocToApply
                        }
                    }
                    else {
                        reqBody = {
                            Type: {
                                value: type
                            },
                            ARAccount: {
                                value: arAccount
                            },
                            ARSubaccount: {
                                value: arSubaccount
                            },
                            ApplicationDate: {
                                value: applicationDate
                            },
                            Branch: {
                                value: branch
                            },
                            CurrencyID: {
                                value: currency
                            },
                            CustomerID: {
                                value: customerID
                            },
                            LocationID: {
                                value: crmID
                            },
                            PaymentMethod: {
                                value: paymentMethod
                            },
                            CashAccount: {
                                value: cashAccount
                            },
                            Hold: {
                                value: onHold
                            },
                            PaymentAmount: {
                                value: paymentAmount
                            },
                            PaymentRef: {
                                value: paymentRef
                            },
                            Description: {
                                value: description
                            },
                            custom: {
                                Document: {
                                    AttributeTRANSDATE: {
                                        type: "CustomDateTimeField",
                                        value: receiptDate
                                    }
                                }
                            },
                            DocumentsToApply: DocToApply
                        }
                    }
                }

            }
        }
        if (status == '1' || (mixInvType == false && invMaster.Invoice_type == 'CR' && status == '2')) {
            loggers.logError(loggers.thisLine2() + ': ' + 'Receipt paymentRef (formatAR fx):' + reqBody.PaymentRef.value + '; InvNo: ' + InvNo)
        }
        return resObj = { status: resStatus, obj: reqBody, docApply: isDocApply }

    }
    catch (err) {
        loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
        console.log(err)
    }
}

exports.requestFormatARReceipt2 = async (exceptional, newMethd, NewPaymentRef, Description, invoiceMaster, invoiceDetail, InvNo, status, BankDtl, mixInvType, PartialRefundAmount = 0) => {
    try {
        let InvoiceNo = InvNo
        let chkdate = moment(new Date('2022-01-01 00:00:00')).format('YYYY-MM-DD HH:mm:ss');
        let resStatus = true
        let invMaster = invoiceMaster
        let type = ''
        let arAccount = ''
        let arSubaccount = ''
        let applicationDate = ''
        let branch = ''
        let customerID = ''
        let paymentMethod = ''
        let cashAccount = ''
        let paymentAmount = 0
        let paymentRef = ''
        let description = ''
        let currency = ''
        let onHold = false
        let isDocApply = false
        let DocToApply = []
        let resObj = {}
        let refNbr = ''
        let reqBody = {}
        let seperate = false
        let mixInv_seperateByType = false; //mix type inv but all AP already push & closed, pending to push all CR only
        goto1: {
            if (seperate == false) {
                if (status == "3") {
                    // Cancellation Inv
                    type = 'Credit Memo'//'Invoice'//'CRM'
                } else {
                    if ((invMaster.Invoice_type == 'AP' || mixInvType == true) && mixInv_seperateByType == false) {
                        // if AP or AP + CR, type = Prepayment, if CR type = Payment
                        type = 'Prepayment'
                    } else {
                        type = 'Payment'
                    }
                }

                //onHold value - foreign - true, local - false
                if (invoiceMaster.Currency != null && invoiceMaster.Currency != '' && invoiceMaster.Currency.trim() != 'MYR') {
                    onHold = true
                } else {
                    onHold = false
                }

                //applicationDate = invoiceMaster.Payment_date ? moment(invoiceMaster.Payment_date).utc().format('YYYY-MM-DD') : moment().format('YYYY-MM-DD')
                let CustCode = invoiceMaster.CustCode != null ? invoiceMaster.CustCode : ""
                let crmID = ""
                if (CustCode != null && CustCode != '' && invoiceMaster.CRMAddrId != null && invoiceMaster.CRMAddrId != "") { //check existance of crmaddrid & custcode in tbl address
                    CustCode = await clsInvoiceDetails.getCustcodebyCRMId(invoiceMaster.CRMAddrId)
                    if (CustCode != null && CustCode.length > 1) {
                        let AddrId = invoiceMaster.ApplicantAddressId
                        CustCode = await clsInvoiceDetails.getCustcodebyCRMId(invoiceMaster.CRMAddrId, AddrId)
                        CustCode = CustCode[0].CustCode
                        if (CustCode == '' || CustCode != invoiceMaster.CustCode) {
                            CustCode = invoiceMaster.CustCode
                        }

                    }
                    else {
                        if (CustCode == '' || CustCode != invoiceMaster.CustCode) {
                            CustCode = invoiceMaster.CustCode
                        }
                        else {
                            if (CustCode == '' || CustCode != invoiceMaster.CustCode) {
                                CustCode = invoiceMaster.CustCode
                            }
                            else {
                                CustCode = CustCode[0].CustCode
                                crmID = invoiceMaster.CRMAddrId
                                if (CustCode == null || crmID == null || crmID == '' || CustCode == '') { //concern about inactive custcode during push to myfast
                                    //return error msg here
                                    return obj = {
                                        status: true,
                                        data: [],
                                        msg: 'Company not found!',
                                    }
                                }

                            }
                        }

                    }

                }

                customerID = CustCode

                let custCRMId = await clsInvoiceDetails.getCustcode(CustCode)

                if (invoiceMaster.CRMAddrId != null && invoiceMaster.CRMAddrId != '') { //18Jan23 - get from master table
                    crmID = invoiceMaster.CRMAddrId
                }
                else {
                    if (custCRMId != null && custCRMId.length > 0 && custCRMId[0].crmid != undefined && custCRMId[0].crmid != null && custCRMId[0].crmid != '') {
                        crmID = custCRMId[0].crmid
                    } else {
                        let getcrmIdAddrId = await clsInvoiceDetails.getCRMId_byCustCode(CustCode)
                        if (getcrmIdAddrId != null && getcrmIdAddrId.length > 0 && getcrmIdAddrId[0].CRMAddrId != undefined && getcrmIdAddrId[0].CRMAddrId != null && getcrmIdAddrId[0].CRMAddrId != '') {
                            crmID = getcrmIdAddrId[0].CRMAddrId
                        } else {
                            let getcompany = await clsGSTIntegration2.CompStructSoapRequest(CustCode).catch((e) => { loggers.logError(loggers.thisLine2() + ':' + `${e}`) })
                            if (getcompany && getcompany.length > 0 && getcompany[0] != null) {
                                for (let co in getcompany) {
                                    if (getcompany[co].crmid != null) {
                                        crmID = getcompany[co].crmid
                                    }
                                }
                            }
                        }
                    }
                }

                // customerID = crmID
                paymentMethod = BankDtl != null && BankDtl.length > 0 ? BankDtl[0].Pay_type : ""
                cashAccount = BankDtl != null && BankDtl.length > 0 ? BankDtl[0].Bank_code : "" // get from tbl_sirim_bank_code
                // paymentAmount = (invoiceMaster.Total_amount).toFixed(2)
                paymentRef = invoiceMaster.Receipt_no != null ? (invoiceMaster.Receipt_no).substring(3) : "-"
                loggers.logError(loggers.thisLine2() + ': ' + 'Receipt paymentRef (fx2-1):' + invoiceMaster.Receipt_no + '; InvNo: ' + InvNo)

                //description = invoiceMaster.Costing_type != null && invoiceMaster.Costing_type != '' ? invoiceMaster.Costing_type : invoiceMaster.Description
                // description = 'eSCIS payment'
                if (newMethd == 1) {
                    description = Description
                }
                else if (newMethd == 0) {
                    description = 'eSCIS payment'
                }

                currency = invoiceMaster.Currency || ""

                // if (invoiceMaster.Payment_mode == "CHEQUE") { // cheque no -  tbl_sirim_payment_history
                //     if (invoiceMaster.Order_no != null && invoiceMaster.Order_no != '') {
                //         let resPayment = await iGSTIntegrationRepository.getPaymentDetails(invoiceMaster.Order_no)
                //         if (resPayment != null && resPayment.length > 0 && resPayment[0].Cheque_no != null && resPayment[0].Cheque_no != '') {
                //             description = resPayment[0].Cheque_no
                //         }
                //     }
                // } else if (invoiceMaster.Payment_mode == "IBG" || invoiceMaster.Payment_mode == "IBG/EFT") {
                //     if (invoiceMaster.Order_no != null && invoiceMaster.Order_no != '') {
                //         let getFPXId = await clsPayment.getOnlineOrderDataLikeOrderNo(invoiceMaster.Order_no);
                //         if (getFPXId != null && getFPXId.length > 0 && getFPXId[0] != undefined && getFPXId[0].mp_txnid != undefined && getFPXId[0].mp_txnid != null && getFPXId[0].mp_txnid != '') {
                //             description = getFPXId[0].mp_txnid
                //         }
                //     }
                // }

                if (invoiceMaster.Branch == null || invoiceMaster.Branch == "") {
                    if (InvNo.substring(0, 3) == "152") {
                        branch = "K-4-43-152"
                    } else if (InvNo.substring(0, 3) == "351") {
                        branch = "K-4-43-351"
                    } else if (InvNo.substring(0, 3) == "153") {
                        branch = "K-4-43-153"
                    }
                } else {
                    branch = invoiceMaster.Branch || ""
                }

                let receiptDate = ""
                let defTime = moment(new Date()).format('YYYY-MM-DD');
                if (invoiceMaster.Payment_date != undefined && invoiceMaster.Payment_date != null) {
                    if (moment(invoiceMaster.Payment_date).utc().format('YYYY-MM-DD HH:mm:ss') < chkdate) {
                        receiptDate = defTime + "T00:00:00";
                        applicationDate = moment().format('YYYY-MM-DD')
                    } else {
                        //ori code
                        // defTime = moment(invoiceMaster.Payment_date).utc().format('YYYY-MM-DD'); // store localTime
                        // receiptDate = defTime + "T00:00:00";
                        // applicationDate = moment(invoiceMaster.Payment_date).utc().format('YYYY-MM-DD');
                        if (moment(invoiceMaster.Payment_date).utc().format('YYYY-MM-DD HH:mm:ss') < now) { //if payment_date<current date, get current date
                            receiptDate = now;
                            applicationDate = moment().format('YYYY-MM-DD')
                        } else {
                            defTime = moment(invoiceMaster.Payment_date).utc().format('YYYY-MM-DD'); // store localTime
                            receiptDate = moment(invoiceMaster.Payment_date).utc().format('YYYY-MM-DD');
                            applicationDate = moment(invoiceMaster.Payment_date).utc().format('YYYY-MM-DD');
                        }
                    }

                } else {
                    receiptDate = defTime + "T00:00:00";
                    applicationDate = moment().format('YYYY-MM-DD')
                }

                //CH2023
                //temporary for inv 2023
                // if (invoiceMaster != null) {
                //     let tempInvDate = new Date(invoiceMaster.Invoice_date).getFullYear();
                //     let tempPaymentDate = invoiceMaster.Payment_date != null && invoiceMaster.Payment_date != '' ? new Date(invoiceMaster.Payment_date).getFullYear() : ''

                //     if (currentdate >= new Date('2024-01-01') && new Date(currentdate < '09-01-2024') && (tempInvDate < 2024 || (tempPaymentDate != '' && tempPaymentDate < 2024))) {
                //         applicationDate = moment().format('2023-12-31')
                //         receiptDate = moment().format('2023-12-31 00:00:00')
                //     }
                //     else if (currentdate > new Date('2024-01-13') && (tempInvDate < 2024 || (tempPaymentDate != '' && tempPaymentDate < 2024))) {
                //         applicationDate = moment().format('YYYY-MM-DD')
                //         receiptDate = moment().format('YYYY-MM-DD HH:MM:ss')
                //     }
                // }
                //CH2023

                // paymentAmount based on receipt
                //syu 12/5/2022 - to cater CN where receiptno in inv master is cleared after head approved
                if (status == 3) {
                    let resultcrdnote = await invoiceDetailsdata.GetCreditNote_byId(invoiceMaster.Id)
                    if (resultcrdnote != null && resultcrdnote.length > 0 && resultcrdnote[0].CNReceiptNo) {
                        invoiceMaster.Receipt_no = resultcrdnote[0].CNReceiptNo
                    }
                }

                let getInvoiceAmt = []
                if (invoiceMaster.Receipt_no != null || invoiceMaster.Receipt_no != '') {
                    getInvoiceAmt = await clsGRPReceipt.getInvoicesbyReceiptno(invoiceMaster.Receipt_no)
                    if (getInvoiceAmt && getInvoiceAmt.length > 0) {
                        getInvoiceAmt = getInvoiceAmt.filter(tbl => tbl.Status == '3')

                    }
                }

                //check inv 2021 & payment 2022 exist in myfast or not
                if (moment(invoiceMaster.Invoice_date).utc().format('YYYY-MM-DD') < checkdate) {
                    if (getInvoiceAmt != null && getInvoiceAmt.length > 0) {
                        for (let c in getInvoiceAmt) {
                            if (moment(getInvoiceAmt[c].Invoice_date).utc().format('YYYY-MM-DD') < checkdate && getInvoiceAmt[c].Invoice_type == 'AP') {
                                let discountTotal = 0
                                if (getInvoiceAmt && getInvoiceAmt[c].DiscountTotal > 0) {
                                    discountTotal = getInvoiceAmt[c].DiscountTotal //myfast not calculate discount, so need to send disc 16/2/23
                                    //discountTotal = 0 //En.Hawari 6/9/2022 request to send full amount for receipt, myfast will calculate on its  own
                                }
                                //check in myfast
                                let type = "Prepayment"
                                let payStatus = "Voided"
                                let paramsReceipt = `%24filter=PaymentRef eq '${getInvoiceAmt[c].Invoice_no != null ? (getInvoiceAmt[c].Invoice_no).substring(3) : ""}' and Status ne '${payStatus}' and Type eq '${type}'`

                                let accessToken = ''
                                accessToken = await ctlAccessToken.getAccessToken();
                                let getPayment = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.PaymentGet, paramsReceipt)
                                loggers.logError(loggers.thisLine2() + ': ' + `${'getPayment - checkInvoice' + JSON.stringify(getPayment)}`)

                                console.log('getPayment2021' + JSON.stringify(getPayment))

                                if (getPayment !== null && getPayment.length == 0) { //check if exist in myFast
                                    paymentAmount += getInvoiceAmt[c].Total_amount - discountTotal //.toFixed(2)

                                }


                            }

                        }
                        paymentAmount = paymentAmount.toFixed(2)

                    }
                }

                if (paymentAmount == 0.00) {
                    paymentAmount = 0
                    if (mixInv_seperateByType == true) {
                        getInvoiceAmt = getInvoiceAmt.filter(tbl => tbl.Invoice_type == 'CR')

                    }
                    //with rounding @ full amount
                    if (getInvoiceAmt != null && getInvoiceAmt.length > 0) {
                        for (let x in getInvoiceAmt) {
                            let discountTotal = 0
                            if (getInvoiceAmt && getInvoiceAmt[x].DiscountTotal > 0) {
                                //discountTotal = 0
                                discountTotal = getInvoiceAmt[x].DiscountTotal
                                //En.Hawari 6/9/2022 request to send full amount for receipt, myfast will calculate on its  own
                                //myfast not calculate discount, so need to send disc 16/2/23
                            }
                            //let Amt = Number(getInvoiceList[x].Total_amount)
                            paymentAmount += getInvoiceAmt[x].Total_amount - discountTotal //.toFixed(2)
                        }

                        paymentAmount = paymentAmount.toFixed(2)
                    }

                }


                //without rounding
                // if (getInvoiceAmt != null && getInvoiceAmt.length > 0) {
                //     let totalAll = 0
                //     for (let x in getInvoiceAmt) {
                //         let getinvNo = await clsGRPReceipt.getInvoicesDetailbyInvNo(getInvoiceAmt[x].Id)
                //         let discountTotal = 0
                //         let totalItem = 0
                //         for (let y in getinvNo) {
                //             totalItem = getinvNo[y].Total_amount + totalItem
                //         }
                //         totalAll = totalItem + totalAll
                //         //      if (getInvoiceAmt && getInvoiceAmt[x].DiscountTotal > 0) {
                //         //     discountTotal = 0//getInvoiceAmt[x].DiscountTotal --En.Hawari 6/9/2022 request to send full amount for receipt, myfast will calculate on its  own
                //         // }
                //         // //let Amt = Number(getInvoiceList[x].Total_amount)
                //         // paymentAmount += getInvoiceAmt[x].Total_amount - discountTotal //.toFixed(2)
                //         //

                //     }
                //     paymentAmount = totalAll.toFixed(2)
                // }


                if (status !== "1") {
                    if ((invMaster.Invoice_type == 'AP' || mixInvType == true) && status == "2") {
                        isDocApply = true
                    }

                    let resultGRPReceipt = await clsGRPReceipt.SelectGRPReceipt_ByInvoiceNo(InvNo)
                    if (resultGRPReceipt != null && resultGRPReceipt[0].ReferenceNbr != undefined && resultGRPReceipt[0].ReferenceNbr != null && status !== "3") {
                        if (resultGRPReceipt[0].ReferenceNbr.includes('CN') && resultGRPReceipt[0].PrepaymentReferenceNbr != null) {
                            refNbr = resultGRPReceipt[0].PrepaymentReferenceNbr

                        }
                        else {
                            refNbr = resultGRPReceipt[0].ReferenceNbr
                        }
                    } else {
                        if (status == "3") {
                            let getCRM = await clsGRPInvoice.SelectGRPInvoice_InvoiceNo(InvNo)

                            getCRM = getCRM.filter(item => item.invoiceType !== null && item.invoiceType == 'CRM')

                            if (getCRM != null && getCRM.length > 0) {
                                refNbr = getCRM[0].ReferenceNbr
                            } else {
                                console.log('No ReferenceNbr in tbl_grp_invoice_res!')
                            }
                        } else {
                            console.log('No ReferenceNbr in tbl_grp_receipt_res!')
                        }

                    }

                    //get prepayment refnbr if mix type
                    if (refNbr == '' && mixInvType == true && status == '2') {
                        let getInvoiceList = await clsGRPReceipt.getInvoicesbyReceiptno(invoiceMaster.Receipt_no)
                        getInvoiceList = getInvoiceList.filter(tbl => tbl.Invoice_type == "AP")
                        let get_AP_invoiceNo = getInvoiceList[0].Invoice_no
                        let recordAPinv = await clsGRPReceipt.SelectGRPReceipt_ByInvoiceNo(get_AP_invoiceNo);
                        if (recordAPinv != null && recordAPinv.length > 0 && recordAPinv[0].PrepaymentReferenceNbr != '' && recordAPinv[0].PrepaymentReferenceNbr != null) {
                            refNbr = recordAPinv[0].PrepaymentReferenceNbr
                        }

                    }
                    if (status == "3") {
                        //cancellation per invoice
                        let getInvData = await clsGRPInvoice.SelectGRPInvoice_InvoiceNo(InvNo)
                        if (getInvData != null && getInvData.length > 0) {
                            let getBillingData = getInvData.filter(item => item.invoiceType !== null && item.invoiceType != 'CRM' && item.invoiceType != 'Offline')

                            if (getBillingData != null && getBillingData.length > 0) {

                                for (let x in getBillingData) {
                                    let item = {
                                        AmountPaid: {},
                                        DocType: {},
                                        ReferenceNbr: {},
                                    }

                                    item.AmountPaid = {
                                        value: PartialRefundAmount > 0 ? PartialRefundAmount : getBillingData[x].Amount != null ? getBillingData[x].Amount.toFixed(2) : 0
                                        // value: PartialRefundAmount > 0 ? PartialRefundAmount : (invoiceMaster.Total_amount).toFixed(2)
                                    }

                                    item.DocType = {
                                        value: 'Invoice'
                                    }

                                    item.ReferenceNbr = {
                                        value: getBillingData[x].ReferenceNbr != null ? getBillingData[x].ReferenceNbr : ''
                                    }

                                    DocToApply.push(item)
                                }
                            }
                        }
                    }
                    else { //if not cancellation
                        let getInvoiceList = await clsGRPReceipt.getInvoicesbyReceiptno(invoiceMaster.Receipt_no)
                        getInvoiceList = getInvoiceList.filter(tbl => tbl.Status == '3')
                        if (invoiceMaster.Receipt_no == '') {
                            console.log("Cannot find invoiceNo via ReceiptNo!")
                        }
                        // getInvoiceList = getInvoiceList.filter(tbl=>tbl.Invoice_no!="") //temporary to push invoice that have more than 1 record in tbl_sirim_inv_master but one of it dont have invoiceNo


                        // check inv status closed/open
                        if (getInvoiceList != null && getInvoiceList.length > 0 && mixInv_seperateByType == false) {
                            for (let i in getInvoiceList) {
                                InvNo = getInvoiceList[i].Invoice_no
                                if (status == '2' && mixInvType == false && getInvoiceList[0].Invoice_type == 'AP') { //check if all invtype same in one receipt, docapply seperately
                                    seperate = true
                                    break goto1;
                                }
                                else if (status == '2' && mixInvType == false && getInvoiceList[0].Invoice_type == 'CR') {
                                    let getPayment;
                                    if (newMethd == 0) {
                                        let type = "Payment"
                                        let payStatus = "Voided"
                                        let paramsReceipt = `%24filter=PaymentRef eq '${(getInvoiceList[0].Receipt_no).substring(3)}' and Status ne '${payStatus}' and Type eq '${type}'`

                                        let accessToken = ''
                                        accessToken = await ctlAccessToken.getAccessToken();
                                        getPayment = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.PaymentGet, paramsReceipt)
                                        loggers.logError(loggers.thisLine2() + ': ' + `${'getPayment - checkInvoice' + JSON.stringify(getPayment)}`)
                                    }
                                    else if (newMethd == 1) {
                                        let paramsReceipt = `%24filter=cf.String(f='Document.AttributeEXTREFNO') eq '${(getInvoiceList[0].Receipt_no).substring(3)}' and Status ne 'Voided'`
                                        console.log('paramsReceipt' + paramsReceipt)

                                        let accessToken = ''
                                        accessToken = await ctlAccessToken.getAccessToken();
                                        getPayment = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.PaymentGet, paramsReceipt)
                                        loggers.logError(loggers.thisLine2() + ': ' + `${'getPaymentNewMethod - putReceipt' + JSON.stringify(getPayment)}`)
                                    }
                                    if (getPayment != null && getPayment.length > 0) {
                                        getPayment = getPayment.filter(tbl => tbl.paymentAmount != invoiceMaster.Total_amount)
                                        if (getPayment != null) {
                                            seperate = true
                                            break goto1;
                                        }

                                    }

                                }
                                else if (status == '2' && mixInvType == true) { // check inv status if mixtype, if close inv exist in 1 receipt, docapply seperately
                                    let paramsINV = `%24filter=CustomerOrder eq '${getInvoiceList[i].Invoice_no.substring(3)}' and Type eq 'Invoice' and Status eq 'Closed'`
                                    // let paramsINV = `%24filter=CustomerOrder eq '${getInvoiceList[i].Invoice_no.substring(3)+'A'}' and Type eq 'Invoice' and Status eq 'Closed'` // inv alphabet

                                    let getCloseInv = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.Invoice, paramsINV)
                                    if (getCloseInv != null && getCloseInv.length > 0) {
                                        getCloseInv = getCloseInv.filter(tbl => tbl.Amount.value == getInvoiceList[i].Total_amount)
                                        loggers.logError(loggers.thisLine2() + ': ' + `${'getOpenInv - putInvoice' + JSON.stringify(getCloseInv)}`)
                                        if (getCloseInv != null && getCloseInv.length > 0) {
                                            seperate = true
                                            break goto1;
                                        }
                                    }

                                }
                            }
                        }



                        if (getInvoiceList != null && getInvoiceList.length > 0) {
                            if (mixInv_seperateByType == true) {
                                getInvoiceList = getInvoiceList.filter(tbl => tbl.Invoice_type == 'CR')
                            }
                            for (let i in getInvoiceList) {
                                InvNo = getInvoiceList[i].Invoice_no

                                let discountTotal = 0
                                if (getInvoiceList && getInvoiceList[i].DiscountTotal > 0) {
                                    discountTotal = getInvoiceList[i].DiscountTotal  //myfast not calculate discount, so need to send disc 16/2/23
                                    //discountTotal = 0//getInvoiceList[i].DiscountTotal-->En.Hawari 6/9/2022 request to send full amount for receipt, myfast will calculate on its  own
                                }

                                let getInvData = await clsGRPInvoice.SelectGRPInvoice_InvoiceNo(InvNo)
                                if (getInvData != null && getInvData.length > 0) {
                                    let getBillingData = getInvData.filter(item => item.invoiceType !== null && item.invoiceType != 'CRM' && item.ReferenceNbr !== null && item.invoiceType != 'Offline' && item.invoiceType != 'Online' && item.Status != 'Closed')
                                    //tempo
                                    if (discountTotal > 0) {
                                        paymentAmount = getBillingData[0].Amount //if myfast return without rounding //if have discount
                                    }
                                    if (getBillingData != null && getBillingData.length > 0) {

                                        arAccount = getBillingData[0].LinkARAccount
                                        arSubaccount = getBillingData[0].LinkARSubAccount
                                        branch = getBillingData[0].LinkBranch

                                        for (let x in getBillingData) {
                                            let item = {
                                                // AmountPaid: {},
                                                DocType: {},
                                                ReferenceNbr: {},
                                            }
                                            //15Feb2023; foreign not send amount during doc apply
                                            if (invoiceMaster.Currency == 'MYR') {
                                                let AmountToApply;
                                                if (exceptional == true) {
                                                    AmountToApply = getInvoiceList[i].Ori_total_amount.toFixed(2) - discountTotal
                                                }
                                                else {
                                                    AmountToApply = getInvoiceList[i].Total_amount.toFixed(2) - discountTotal
                                                }
                                                item.AmountPaid = {
                                                    value: AmountToApply
                                                }
                                            }


                                            item.DocType = {
                                                value: 'Invoice'
                                            }


                                            item.ReferenceNbr = {
                                                value: getBillingData[x].ReferenceNbr != null ? getBillingData[x].ReferenceNbr : ''
                                            }

                                            DocToApply.push(item)
                                        }
                                    }
                                }
                            }
                            console.log("invMaster: " + getInvoiceList.length)
                            console.log("DocApply: " + DocToApply.length)
                            if (getInvoiceList.length == DocToApply.length) {
                                isDocApply = true
                            } else {
                                seperate = true
                                loggers.logError(loggers.thisLine2() + ': ' + 'Invoice details not tally with DocumentsToApply items!')
                                console.log('Invoice details not tally with DocumentsToApply items!')
                                isDocApply = false
                                break goto1;
                            }
                        }
                    }

                    console.log('DocumentsToApply :  ' + JSON.stringify(DocToApply))

                    if (DocToApply.length == 0) {
                        console.log('No items added to DocumentsToApply array!')
                    }
                }

                if (status == "1" || (mixInvType == true && isDocApply == false) && mixInv_seperateByType == false) { // For Inv Type AP & Mix Type Inv (AP + CR)
                    if (newMethd == 1) {
                        if (currency != null && currency != '' && currency.trim() != 'MYR') { // if foreign Currency
                            reqBody = {
                                Type: {
                                    value: "Prepayment"
                                },
                                ApplicationDate: {
                                    value: applicationDate
                                },
                                Branch: {
                                    value: branch
                                },
                                CurrencyID: {
                                    value: currency
                                },
                                CustomerID: {
                                    value: customerID
                                },
                                LocationID: {
                                    value: crmID
                                },
                                PaymentMethod: {
                                    value: paymentMethod
                                },
                                CashAccount: {
                                    value: cashAccount
                                },
                                Hold: {
                                    value: onHold
                                },
                                PaymentAmount: {
                                    value: paymentAmount
                                },
                                PaymentRef: {
                                    value: NewPaymentRef
                                },
                                Description: {
                                    value: description
                                },
                                custom: {
                                    Document: {
                                        AttributeTRANSDATE: {
                                            type: "CustomDateTimeField",
                                            value: receiptDate
                                        },
                                        AttributeCURYID: {
                                            type: "CustomStringField",
                                            value: currency.trim()
                                        },
                                        AttributeEXTREFNO: {
                                            type: "String",
                                            value: paymentRef
                                        }
                                    }
                                }
                            }
                        } else {
                            reqBody = {
                                Type: {
                                    value: "Prepayment"
                                },
                                ApplicationDate: {
                                    value: applicationDate
                                },
                                Branch: {
                                    value: branch
                                },
                                CurrencyID: {
                                    value: currency
                                },
                                CustomerID: {
                                    value: customerID
                                },
                                LocationID: {
                                    value: crmID
                                },
                                PaymentMethod: {
                                    value: paymentMethod
                                },
                                CashAccount: {
                                    value: cashAccount
                                },
                                Hold: {
                                    value: onHold
                                },
                                PaymentAmount: {
                                    value: paymentAmount
                                },
                                PaymentRef: {
                                    value: NewPaymentRef
                                },
                                Description: {
                                    value: description
                                },
                                custom: {
                                    Document: {
                                        AttributeTRANSDATE: {
                                            type: "CustomDateTimeField",
                                            value: receiptDate
                                        },
                                        AttributeEXTREFNO: {
                                            type: "String",
                                            value: paymentRef
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else if (newMethd == 0) {
                        if (currency != null && currency != '' && currency.trim() != 'MYR') { // if foreign Currency
                            reqBody = {
                                Type: {
                                    value: "Prepayment"
                                },
                                ApplicationDate: {
                                    value: applicationDate
                                },
                                Branch: {
                                    value: branch
                                },
                                CurrencyID: {
                                    value: currency
                                },
                                CustomerID: {
                                    value: customerID
                                },
                                LocationID: {
                                    value: crmID
                                },
                                PaymentMethod: {
                                    value: paymentMethod
                                },
                                CashAccount: {
                                    value: cashAccount
                                },
                                Hold: {
                                    value: onHold
                                },
                                PaymentAmount: {
                                    value: paymentAmount
                                },
                                PaymentRef: {
                                    value: paymentRef
                                },
                                Description: {
                                    value: description
                                },
                                custom: {
                                    Document: {
                                        AttributeTRANSDATE: {
                                            type: "CustomDateTimeField",
                                            value: receiptDate
                                        },
                                        AttributeCURYID: {
                                            type: "CustomStringField",
                                            value: currency.trim()
                                        }
                                    }
                                }
                            }
                        } else {
                            reqBody = {
                                Type: {
                                    value: "Prepayment"
                                },
                                ApplicationDate: {
                                    value: applicationDate
                                },
                                Branch: {
                                    value: branch
                                },
                                CurrencyID: {
                                    value: currency
                                },
                                CustomerID: {
                                    value: customerID
                                },
                                LocationID: {
                                    value: crmID
                                },
                                PaymentMethod: {
                                    value: paymentMethod
                                },
                                CashAccount: {
                                    value: cashAccount
                                },
                                Hold: {
                                    value: onHold
                                },
                                PaymentAmount: {
                                    value: paymentAmount
                                },
                                PaymentRef: {
                                    value: paymentRef
                                },
                                Description: {
                                    value: description
                                },
                                custom: {
                                    Document: {
                                        AttributeTRANSDATE: {
                                            type: "CustomDateTimeField",
                                            value: receiptDate
                                        }
                                    }
                                }
                            }
                        }
                    }


                } else { // status 2 - After Billing // status 3 - Cancel CRM
                    if ((invMaster.Invoice_type == 'AP' || mixInvType == true) && status !== "3" && isDocApply == true && mixInv_seperateByType == false) {
                        if (newMethd == 1) {
                            reqBody = {
                                Type: {
                                    value: type
                                },
                                ApplicationDate: {
                                    value: moment().format('YYYY-MM-DD') // use current date
                                    // value: applicationDate// CH2023

                                },
                                ReferenceNbr: {
                                    value: refNbr
                                },
                                custom: {
                                    Document: {
                                        AttributeEXTREFNO: {
                                            type: "String",
                                            value: paymentRef
                                        }
                                    }
                                },
                                DocumentsToApply: DocToApply
                            }
                        }
                        else if (newMethd == 0) {
                            reqBody = {
                                Type: {
                                    value: type
                                },
                                ApplicationDate: {
                                    value: moment().format('YYYY-MM-DD') // use current date
                                    // value: applicationDate// CH2023

                                },
                                ReferenceNbr: {
                                    value: refNbr
                                },
                                DocumentsToApply: DocToApply
                            }
                        }

                    }
                    else {
                        if (status == "3") { // cancel CRM
                            reqBody = {
                                //entity: {
                                Type: {
                                    value: type
                                },
                                ReferenceNbr: {
                                    value: refNbr
                                },
                                ApplicationDate: {
                                    value: moment().format('YYYY-MM-DD') + "T00:00:00"
                                    // value: applicationDate //CH2023
                                },
                                DocumentsToApply: DocToApply
                            }
                            // }
                        } else if (invMaster.Invoice_type == 'CR' && status == "2" && mixInvType == false) { // CR
                            if (newMethd == 1) {
                                if (currency != null && currency != '' && currency.trim() != 'MYR') { // if foreign Currency
                                    reqBody = {
                                        Type: {
                                            value: type
                                        },
                                        ARAccount: {
                                            value: arAccount
                                        },
                                        ARSubaccount: {
                                            value: arSubaccount
                                        },
                                        ApplicationDate: {
                                            value: applicationDate
                                        },
                                        Branch: {
                                            value: branch
                                        },
                                        CurrencyID: {
                                            value: currency
                                        },
                                        CustomerID: {
                                            value: customerID
                                        },
                                        LocationID: {
                                            value: crmID
                                        },
                                        PaymentMethod: {
                                            value: paymentMethod
                                        },
                                        CashAccount: {
                                            value: cashAccount
                                        },
                                        Hold: {
                                            value: onHold
                                        },
                                        PaymentAmount: {
                                            value: paymentAmount
                                        },
                                        PaymentRef: {
                                            value: NewPaymentRef
                                        },
                                        Description: {
                                            value: description
                                        },
                                        custom: {
                                            Document: {
                                                AttributeTRANSDATE: {
                                                    type: "CustomDateTimeField",
                                                    value: receiptDate
                                                },
                                                AttributeCURYID: {
                                                    type: "CustomStringField",
                                                    value: currency.trim()
                                                },
                                                AttributeEXTREFNO: {
                                                    type: "String",
                                                    value: paymentRef
                                                }
                                            }
                                        },
                                        DocumentsToApply: DocToApply
                                    }
                                } else {
                                    reqBody = {
                                        Type: {
                                            value: type
                                        },
                                        ARAccount: {
                                            value: arAccount
                                        },
                                        ARSubaccount: {
                                            value: arSubaccount
                                        },
                                        ApplicationDate: {
                                            value: applicationDate
                                        },
                                        Branch: {
                                            value: branch
                                        },
                                        CurrencyID: {
                                            value: currency
                                        },
                                        CustomerID: {
                                            value: customerID
                                        },
                                        LocationID: {
                                            value: crmID
                                        },
                                        PaymentMethod: {
                                            value: paymentMethod
                                        },
                                        CashAccount: {
                                            value: cashAccount
                                        },
                                        Hold: {
                                            value: onHold
                                        },
                                        PaymentAmount: {
                                            value: paymentAmount
                                        },
                                        PaymentRef: {
                                            value: NewPaymentRef
                                        },
                                        Description: {
                                            value: description
                                        },
                                        custom: {
                                            Document: {
                                                AttributeTRANSDATE: {
                                                    type: "CustomDateTimeField",
                                                    value: receiptDate
                                                },
                                                AttributeEXTREFNO: {
                                                    type: "String",
                                                    value: paymentRef
                                                }
                                            }
                                        },
                                        DocumentsToApply: DocToApply
                                    }
                                }
                            }
                            else if (newMethd == 0) {
                                if (currency != null && currency != '' && currency.trim() != 'MYR') { // if foreign Currency
                                    reqBody = {
                                        Type: {
                                            value: type
                                        },
                                        ARAccount: {
                                            value: arAccount
                                        },
                                        ARSubaccount: {
                                            value: arSubaccount
                                        },
                                        ApplicationDate: {
                                            value: applicationDate
                                        },
                                        Branch: {
                                            value: branch
                                        },
                                        CurrencyID: {
                                            value: currency
                                        },
                                        CustomerID: {
                                            value: customerID
                                        },
                                        LocationID: {
                                            value: crmID
                                        },
                                        PaymentMethod: {
                                            value: paymentMethod
                                        },
                                        CashAccount: {
                                            value: cashAccount
                                        },
                                        Hold: {
                                            value: onHold
                                        },
                                        PaymentAmount: {
                                            value: paymentAmount
                                        },
                                        PaymentRef: {
                                            value: paymentRef
                                        },
                                        Description: {
                                            value: description
                                        },
                                        custom: {
                                            Document: {
                                                AttributeTRANSDATE: {
                                                    type: "CustomDateTimeField",
                                                    value: receiptDate
                                                },
                                                AttributeCURYID: {
                                                    type: "CustomStringField",
                                                    value: currency.trim()
                                                }
                                            }
                                        },
                                        DocumentsToApply: DocToApply
                                    }
                                } else {
                                    reqBody = {
                                        Type: {
                                            value: type
                                        },
                                        ARAccount: {
                                            value: arAccount
                                        },
                                        ARSubaccount: {
                                            value: arSubaccount
                                        },
                                        ApplicationDate: {
                                            value: applicationDate
                                        },
                                        Branch: {
                                            value: branch
                                        },
                                        CurrencyID: {
                                            value: currency
                                        },
                                        CustomerID: {
                                            value: customerID
                                        },
                                        LocationID: {
                                            value: crmID
                                        },
                                        PaymentMethod: {
                                            value: paymentMethod
                                        },
                                        CashAccount: {
                                            value: cashAccount
                                        },
                                        Hold: {
                                            value: onHold
                                        },
                                        PaymentAmount: {
                                            value: paymentAmount
                                        },
                                        PaymentRef: {
                                            value: paymentRef
                                        },
                                        Description: {
                                            value: description
                                        },
                                        custom: {
                                            Document: {
                                                AttributeTRANSDATE: {
                                                    type: "CustomDateTimeField",
                                                    value: receiptDate
                                                }
                                            }
                                        },
                                        DocumentsToApply: DocToApply
                                    }
                                }
                            }


                        }
                        else if (mixInv_seperateByType == true) {
                            if (newMethd == 1) {
                                if (currency != null && currency != '' && currency.trim() != 'MYR') { // if foreign Currency
                                    reqBody = {
                                        Type: {
                                            value: type
                                        },
                                        ApplicationDate: {
                                            value: applicationDate
                                        },
                                        Branch: {
                                            value: branch
                                        },
                                        CurrencyID: {
                                            value: currency
                                        },
                                        CustomerID: {
                                            value: customerID
                                        },
                                        LocationID: {
                                            value: crmID
                                        },
                                        PaymentMethod: {
                                            value: paymentMethod
                                        },
                                        CashAccount: {
                                            value: cashAccount
                                        },
                                        Hold: {
                                            value: onHold
                                        },
                                        PaymentAmount: {
                                            value: paymentAmount
                                        },
                                        PaymentRef: {
                                            value: NewPaymentRef
                                        },
                                        Description: {
                                            value: description
                                        },
                                        custom: {
                                            Document: {
                                                AttributeTRANSDATE: {
                                                    type: "CustomDateTimeField",
                                                    value: receiptDate
                                                },
                                                AttributeCURYID: {
                                                    type: "CustomStringField",
                                                    value: currency.trim()
                                                },
                                                AttributeEXTREFNO: {
                                                    type: "String",
                                                    value: paymentRef
                                                }
                                            }
                                        },
                                        DocumentsToApply: DocToApply
                                    }
                                } else {
                                    reqBody = {
                                        Type: {
                                            value: type
                                        },
                                        ApplicationDate: {
                                            value: applicationDate
                                        },
                                        Branch: {
                                            value: branch
                                        },
                                        CurrencyID: {
                                            value: currency
                                        },
                                        CustomerID: {
                                            value: customerID
                                        },
                                        LocationID: {
                                            value: crmID
                                        },
                                        PaymentMethod: {
                                            value: paymentMethod
                                        },
                                        CashAccount: {
                                            value: cashAccount
                                        },
                                        Hold: {
                                            value: onHold
                                        },
                                        PaymentAmount: {
                                            value: paymentAmount
                                        },
                                        PaymentRef: {
                                            value: NewPaymentRef
                                        },
                                        Description: {
                                            value: description
                                        },
                                        custom: {
                                            Document: {
                                                AttributeTRANSDATE: {
                                                    type: "CustomDateTimeField",
                                                    value: receiptDate
                                                },
                                                AttributeEXTREFNO: {
                                                    type: "String",
                                                    value: paymentRef
                                                }
                                            }
                                        },
                                        DocumentsToApply: DocToApply
                                    }
                                }
                            }
                            else if (newMethd == 0) {
                                if (currency != null && currency != '' && currency.trim() != 'MYR') { // if foreign Currency
                                    reqBody = {
                                        Type: {
                                            value: type
                                        },
                                        ApplicationDate: {
                                            value: applicationDate
                                        },
                                        Branch: {
                                            value: branch
                                        },
                                        CurrencyID: {
                                            value: currency
                                        },
                                        CustomerID: {
                                            value: customerID
                                        },
                                        LocationID: {
                                            value: crmID
                                        },
                                        PaymentMethod: {
                                            value: paymentMethod
                                        },
                                        CashAccount: {
                                            value: cashAccount
                                        },
                                        Hold: {
                                            value: onHold
                                        },
                                        PaymentAmount: {
                                            value: paymentAmount
                                        },
                                        PaymentRef: {
                                            value: paymentRef
                                        },
                                        Description: {
                                            value: description
                                        },
                                        custom: {
                                            Document: {
                                                AttributeTRANSDATE: {
                                                    type: "CustomDateTimeField",
                                                    value: receiptDate
                                                },
                                                AttributeCURYID: {
                                                    type: "CustomStringField",
                                                    value: currency.trim()
                                                }
                                            }
                                        },
                                        DocumentsToApply: DocToApply
                                    }
                                } else {
                                    reqBody = {
                                        Type: {
                                            value: type
                                        },
                                        ApplicationDate: {
                                            value: applicationDate
                                        },
                                        Branch: {
                                            value: branch
                                        },
                                        CurrencyID: {
                                            value: currency
                                        },
                                        CustomerID: {
                                            value: customerID
                                        },
                                        LocationID: {
                                            value: crmID
                                        },
                                        PaymentMethod: {
                                            value: paymentMethod
                                        },
                                        CashAccount: {
                                            value: cashAccount
                                        },
                                        Hold: {
                                            value: onHold
                                        },
                                        PaymentAmount: {
                                            value: paymentAmount
                                        },
                                        PaymentRef: {
                                            value: paymentRef
                                        },
                                        Description: {
                                            value: description
                                        },
                                        custom: {
                                            Document: {
                                                AttributeTRANSDATE: {
                                                    type: "CustomDateTimeField",
                                                    value: receiptDate
                                                }
                                            }
                                        },
                                        DocumentsToApply: DocToApply
                                    }
                                }
                            }
                        }

                    }
                }
                if (status == '1' || (mixInvType == false && invMaster.Invoice_type == 'CR' && status == '2')) {
                    loggers.logError(loggers.thisLine2() + ': ' + 'Receipt paymentRef (formatAR2-1 fx):' + reqBody.PaymentRef.value + '; InvNo: ' + InvoiceNo)
                }
                return resObj = { status: resStatus, obj: reqBody, docApply: isDocApply, seperate: seperate }
            }


        }

        if (seperate == true && status == '2' && (mixInvType == true || invMaster.Invoice_type == 'AP')) { //docapply per invoice
            let DocToApply = []

            if (invMaster.Invoice_type == 'AP' || mixInvType == true) {
                type = 'Prepayment'
            }

            //get prepayment refnbr if mix type
            if (refNbr == '' && (mixInvType == true || invMaster.Invoice_type == 'AP') && status == '2') {
                let getInvoiceList = await clsGRPReceipt.getInvoicesbyReceiptno(invoiceMaster.Receipt_no)
                getInvoiceList = getInvoiceList.filter(tbl => tbl.Invoice_type == "AP")
                let get_AP_invoiceNo = getInvoiceList[0].Invoice_no
                let recordAPinv = await clsGRPReceipt.SelectGRPReceipt_ByInvoiceNo(get_AP_invoiceNo);
                if (recordAPinv != null && recordAPinv.length > 0 && recordAPinv[0].PrepaymentReferenceNbr != '' && recordAPinv[0].PrepaymentReferenceNbr != null) {
                    refNbr = recordAPinv[0].PrepaymentReferenceNbr
                }

            }


            // paymentAmount based on receipt
            // let getInvoiceAmt = await clsGRPReceipt.getInvoicesbyReceiptno(invoiceMaster.Receipt_no)
            // getInvoiceAmt = getInvoiceAmt.filter(tbl => tbl.Status == '3')
            // //with rounding @ full amount
            // if (getInvoiceAmt != null && getInvoiceAmt.length > 0) {
            //     for (let x in getInvoiceAmt) {
            //         let discountTotal = 0
            //         if (getInvoiceAmt && getInvoiceAmt[x].DiscountTotal > 0) {
            //             discountTotal = 0//getInvoiceAmt[x].DiscountTotal --En.Hawari 6/9/2022 request to send full amount for receipt, myfast will calculate on its  own
            //         }
            //         //let Amt = Number(getInvoiceList[x].Total_amount)
            //         paymentAmount += getInvoiceAmt[x].Total_amount - discountTotal //.toFixed(2)
            //     }
            //     paymentAmount = paymentAmount.toFixed(2)
            // }

            let getInvoiceMaster = await oLogicInvoice.SelectInvoiceMasterbyInvoiceNo(InvoiceNo)
            let getInvData = await clsGRPInvoice.SelectGRPInvoice_InvoiceNo(InvoiceNo)
            if (getInvData != null && getInvData.length > 0) {
                let getBillingData = getInvData.filter(item => item.invoiceType !== null && item.invoiceType != 'CRM' && item.invoiceType != 'Offline' && item.invoiceType != 'Online')
                if (getBillingData != null && getBillingData.length > 0) {
                    for (let x in getBillingData) {
                        if ((invMaster.DiscountTotal == 0.00 || invMaster.DiscountTotal == null) && invMaster.Currency == 'MYR') {
                            if ((getBillingData[x].Amount != getInvoiceMaster[0].Total_amount || getBillingData[x].ReferenceNbr == null || getBillingData[x].ReferenceNbr == '') && exceptional == false) { //if amount in tbl_grp_inv <> tbl_Sirim_inv_master, do not proceed to push

                                putDataPayment = false //permenant
                                console.log("UNABLE PUT DATA PAYMENT!")
                            }
                            else {

                                let item = {
                                    // AmountPaid: {},
                                    DocType: {},
                                    ReferenceNbr: {},
                                }

                                //15Feb2023; foreign not send amount during doc apply
                                if (invoiceMaster.Currency == 'MYR') {
                                    if (exceptional == true) {
                                        AmountToApply = getInvoiceMaster[0].Ori_total_amount.toFixed(2)
                                    }
                                    else {
                                        AmountToApply = getInvoiceMaster[0].Total_amount.toFixed(2)
                                    }
                                    item.AmountPaid = {
                                        value: AmountToApply ? AmountToApply : 0

                                    }
                                }


                                item.DocType = {
                                    value: 'Invoice'
                                }

                                item.ReferenceNbr = {
                                    value: getBillingData[x].ReferenceNbr != null ? getBillingData[x].ReferenceNbr : ''
                                }

                                DocToApply.push(item)
                            }
                        }
                        else {

                            let item = {
                                // AmountPaid: {},
                                DocType: {},
                                ReferenceNbr: {},
                            }

                            //15Feb2023; foreign not send amount during doc apply
                            if (invoiceMaster.Currency == 'MYR') {
                                if (exceptional == true) {
                                    AmountToApply = getInvoiceMaster[0].Ori_total_amount.toFixed(2)
                                }
                                else {
                                    AmountToApply = getInvoiceMaster[0].Total_amount.toFixed(2)
                                }
                                item.AmountPaid = {
                                    value: AmountToApply ? AmountToApply : 0

                                }
                            }



                            item.DocType = {
                                value: 'Invoice'
                            }

                            item.ReferenceNbr = {
                                value: getBillingData[x].ReferenceNbr != null ? getBillingData[x].ReferenceNbr : ''
                            }

                            DocToApply.push(item)
                        }
                    }


                }
            }

            //check type of current inv
            let currentInvType = await clsGRPInvoice.SelectMasterInvoice_Type(InvoiceNo)
            if (currentInvType[0].Invoice_type == 'CR' || currentInvType[0].Invoice_type == 'AP') {
                isDocApply = true
                if (newMethd == 1) {
                    reqBody = {
                        // entity: {
                        Type: {
                            value: type
                        },
                        ApplicationDate: {
                            value: moment().format('YYYY-MM-DD') + "T00:00:00"
                            // value: applicationDate// CH2023

                        },
                        ReferenceNbr: {
                            value: refNbr //prepaymentrefnbr
                        },
                        custom: {
                            Document: {
                                AttributeEXTREFNO: {
                                    type: "String",
                                    value: paymentRef
                                }
                            }
                        },
                        DocumentsToApply: DocToApply
                        // }
                    }
                }
                else if (newMethd == 0) {
                    reqBody = {
                        // entity: {
                        Type: {
                            value: type
                        },
                        ApplicationDate: {
                            value: moment().format('YYYY-MM-DD') + "T00:00:00"
                            // value: applicationDate// CH2023

                        },
                        ReferenceNbr: {
                            value: refNbr //prepaymentrefnbr
                        },
                        DocumentsToApply: DocToApply
                        // }
                    }
                }

            }
            return resObj = { status: resStatus, obj: reqBody, docApply: isDocApply, seperate: seperate }
        }
        else if (seperate == true && status == '2' && invMaster.Invoice_type == 'CR') { //push payment per inv CR

            let getInvoiceMaster = await oLogicInvoice.SelectInvoiceMasterbyInvoiceNo(InvoiceNo)
            if (getInvoiceMaster != null && getInvoiceMaster.length > 0 && (getInvoiceMaster[0].Status == '3' || getInvoiceMaster[0].Status == '1')) {
                if (exceptional == true) {
                    paymentAmount = getInvoiceMaster[0].Ori_total_amount
                }
                else {
                    paymentAmount = getInvoiceMaster[0].Total_amount
                }

            }
            let getInvData = await clsGRPInvoice.SelectGRPInvoice_InvoiceNo(InvoiceNo)
            if (getInvData != null && getInvData.length > 0) {
                let getBillingData = getInvData.filter(item => item.invoiceType !== null && item.invoiceType != 'CRM' && item.ReferenceNbr !== null && item.invoiceType != 'Offline' && item.invoiceType != 'Online')
                if (getBillingData != null && getBillingData.length > 0) {
                    arAccount = getBillingData[0].LinkARAccount
                    arSubaccount = getBillingData[0].LinkARSubAccount
                    branch = getBillingData[0].LinkBranch

                    for (let x in getBillingData) {
                        let item = {
                            // AmountPaid: {},
                            DocType: {},
                            ReferenceNbr: {},
                        }

                        //15Feb2023; foreign not send amount during doc apply
                        if (invoiceMaster.Currency == 'MYR') {

                            item.AmountPaid = {
                                value: paymentAmount.toFixed(2)
                                // value: getBillingData[x].Amount != null ? getBillingData[x].Amount.toFixed(2) : 0 //paymentAmount //if have discount
                            }
                        }


                        item.DocType = {
                            value: 'Invoice'
                        }


                        item.ReferenceNbr = {
                            value: getBillingData[x].ReferenceNbr != null ? getBillingData[x].ReferenceNbr : ''
                        }

                        DocToApply.push(item)
                    }
                }
            }
            //onHold value - foreign - true, local - false
            if (invoiceMaster.Currency != null && invoiceMaster.Currency != '' && invoiceMaster.Currency.trim() != 'MYR') {
                onHold = true
            } else {
                onHold = false
            }

            //applicationDate = invoiceMaster.Payment_date ? moment(invoiceMaster.Payment_date).utc().format('YYYY-MM-DD') : moment().format('YYYY-MM-DD')
            let CustCode = invoiceMaster.CustCode != null ? invoiceMaster.CustCode : ""
            let crmID = ""
            if (CustCode != null && CustCode != '' && invoiceMaster.CRMAddrId != null && invoiceMaster.CRMAddrId != "") { //check existance of crmaddrid & custcode in tbl address
                CustCode = await clsInvoiceDetails.getCustcodebyCRMId(invoiceMaster.CRMAddrId)
                if (CustCode != null && CustCode.length > 1) {
                    let AddrId = invoiceMaster.ApplicantAddressId
                    CustCode = await clsInvoiceDetails.getCustcodebyCRMId(invoiceMaster.CRMAddrId, AddrId)
                    CustCode = CustCode[0].CustCode
                    if (CustCode == '' || CustCode != invoiceMaster.CustCode) {
                        CustCode = invoiceMaster.CustCode
                    }

                }
                else {
                    if (CustCode == '' || CustCode != invoiceMaster.CustCode) {
                        CustCode = invoiceMaster.CustCode
                    }
                    else {
                        CustCode = CustCode[0].CustCode
                        crmID = invoiceMaster.CRMAddrId
                        if (CustCode == null || crmID == null || crmID == '' || CustCode == '') { //concern about inactive custcode during push to myfast
                            //return error msg here
                            return obj = {
                                status: true,
                                data: [],
                                msg: 'Company not found!',
                            }
                        }
                    }
                }

            }

            customerID = CustCode

            let custCRMId = await clsInvoiceDetails.getCustcode(CustCode)

            if (invoiceMaster.CRMAddrId != null && invoiceMaster.CRMAddrId != '') { //18Jan23 - get from master table
                crmID = invoiceMaster.CRMAddrId
            }
            else {
                if (custCRMId != null && custCRMId.length > 0 && custCRMId[0].crmid != undefined && custCRMId[0].crmid != null && custCRMId[0].crmid != '') {
                    crmID = custCRMId[0].crmid
                } else {
                    let getcrmIdAddrId = await clsInvoiceDetails.getCRMId_byCustCode(CustCode)
                    if (getcrmIdAddrId != null && getcrmIdAddrId.length > 0 && getcrmIdAddrId[0].CRMAddrId != undefined && getcrmIdAddrId[0].CRMAddrId != null && getcrmIdAddrId[0].CRMAddrId != '') {
                        crmID = getcrmIdAddrId[0].CRMAddrId
                    } else {
                        let getcompany = await clsGSTIntegration2.CompStructSoapRequest(CustCode).catch((e) => { loggers.logError(loggers.thisLine2() + ':' + `${e}`) })
                        if (getcompany && getcompany.length > 0 && getcompany[0] != null) {
                            for (let co in getcompany) {
                                if (getcompany[co].crmid != null) {
                                    crmID = getcompany[co].crmid
                                }
                            }
                        }
                    }
                }
            }
            // customerID = crmID
            paymentMethod = BankDtl != null && BankDtl.length > 0 ? BankDtl[0].Pay_type : ""
            cashAccount = BankDtl != null && BankDtl.length > 0 ? BankDtl[0].Bank_code : "" // get from tbl_sirim_bank_code
            // paymentAmount = (invoiceMaster.Total_amount).toFixed(2)

            paymentRef = invoiceMaster.Receipt_no != null ? (invoiceMaster.Receipt_no).substring(3) : "-"
            loggers.logError(loggers.thisLine2() + ': ' + 'Receipt paymentRef (fx2-2):' + invoiceMaster.Receipt_no + '; InvNo: ' + InvNo)

            if (newMethd == 1) {
                description = Description
            }
            else if (newMethd == 0) {
                description = 'eSCIS payment'
            }

            //description = invoiceMaster.Costing_type != null && invoiceMaster.Costing_type != '' ? invoiceMaster.Costing_type : invoiceMaster.Description
            // description = 'eSCIS payment'
            currency = invoiceMaster.Currency || ""

            // if (invoiceMaster.Payment_mode == "CHEQUE") { // cheque no -  tbl_sirim_payment_history
            //     if (invoiceMaster.Order_no != null && invoiceMaster.Order_no != '') {
            //         let resPayment = await iGSTIntegrationRepository.getPaymentDetails(invoiceMaster.Order_no)
            //         if (resPayment != null && resPayment.length > 0 && resPayment[0].Cheque_no != null && resPayment[0].Cheque_no != '') {
            //             description = resPayment[0].Cheque_no
            //         }
            //     }
            // } else if (invoiceMaster.Payment_mode == "IBG" || invoiceMaster.Payment_mode == "IBG/EFT") {
            //     if (invoiceMaster.Order_no != null && invoiceMaster.Order_no != '') {
            //         let getFPXId = await clsPayment.getOnlineOrderDataLikeOrderNo(invoiceMaster.Order_no);
            //         if (getFPXId != null && getFPXId.length > 0 && getFPXId[0] != undefined && getFPXId[0].mp_txnid != undefined && getFPXId[0].mp_txnid != null && getFPXId[0].mp_txnid != '') {
            //             description = resPayment[0].mp_txnid
            //         }
            //     }
            // }

            if (invoiceMaster.Branch == null || invoiceMaster.Branch == "") {
                if (InvNo.substring(0, 3) == "152") {
                    branch = "K-4-43-152"
                } else if (InvNo.substring(0, 3) == "351") {
                    branch = "K-4-43-351"
                } else if (InvNo.substring(0, 3) == "153") {
                    branch = "K-4-43-153"
                }
            } else {
                branch = invoiceMaster.Branch || ""
            }

            let receiptDate = ""
            let defTime = moment(new Date()).format('YYYY-MM-DD');
            if (invoiceMaster.Payment_date != undefined && invoiceMaster.Payment_date != null) {
                if (moment(invoiceMaster.Payment_date).utc().format('YYYY-MM-DD HH:mm:ss') < chkdate) {
                    receiptDate = defTime + "T00:00:00";
                    applicationDate = moment().format('YYYY-MM-DD')
                } else {
                    //ori code
                    // defTime = moment(invoiceMaster.Payment_date).utc().format('YYYY-MM-DD'); // store localTime
                    // receiptDate = defTime + "T00:00:00";
                    // applicationDate = moment(invoiceMaster.Payment_date).utc().format('YYYY-MM-DD');
                    if (moment(invoiceMaster.Payment_date).utc().format('YYYY-MM-DD HH:mm:ss') < now) { //if payment_date<current date, get current date
                        receiptDate = now;
                        applicationDate = moment().format('YYYY-MM-DD')
                    } else {
                        defTime = moment(invoiceMaster.Payment_date).utc().format('YYYY-MM-DD'); // store localTime
                        receiptDate = moment(invoiceMaster.Payment_date).utc().format('YYYY-MM-DD');
                        applicationDate = moment(invoiceMaster.Payment_date).utc().format('YYYY-MM-DD');
                    }
                }

            } else {
                receiptDate = defTime + "T00:00:00";
                applicationDate = moment().format('YYYY-MM-DD')
            }

            //CH2023
            //temporary for inv 2023
            // if (invoiceMaster != null) {
            //     let tempInvDate = new Date(invoiceMaster.Invoice_date).getFullYear();
            //     let tempPaymentDate = invoiceMaster.Payment_date != null && invoiceMaster.Payment_date != '' ? new Date(invoiceMaster.Payment_date).getFullYear() : ''


            //     if (currentdate >= new Date('2024-01-01') && currentdate < new Date('09-01-2024') && (tempInvDate < 2024 || (tempPaymentDate != '' && tempPaymentDate < 2024))) {
            //         applicationDate = moment().format('2023-12-31')
            //         receiptDate = moment().format('2023-12-31 00:00:00')
            //     }
            //     else if (currentdate > new Date('2024-01-13') && (tempInvDate < 2024 || (tempPaymentDate != '' && tempPaymentDate < 2024))) {
            //         applicationDate = moment().format('YYYY-MM-DD')
            //         receiptDate = moment().format('YYYY-MM-DD HH:MM:ss')
            //     }
            // }
            //CH2023

            //syu 12/5/2022 - to cater CN  where receiptno in inv master is cleared after head approved
            if (status == 3) {
                let resultcrdnote = await invoiceDetailsdata.GetCreditNote_byId(invoiceMaster.Id)
                if (resultcrdnote && resultcrdnote[0].CNReceiptNo) {
                    invoiceMaster.Receipt_no = resultcrdnote[0].CNReceiptNo
                }
            }

            if (newMethd == 1) {
                if (currency != null && currency != '' && currency.trim() != 'MYR') { // if foreign Currency
                    reqBody = {
                        Type: {
                            value: type
                        },
                        ARAccount: {
                            value: arAccount
                        },
                        ARSubaccount: {
                            value: arSubaccount
                        },
                        ApplicationDate: {
                            value: applicationDate
                        },
                        Branch: {
                            value: branch
                        },
                        CurrencyID: {
                            value: currency
                        },
                        CustomerID: {
                            value: customerID
                        },
                        LocationID: {
                            value: crmID
                        },
                        PaymentMethod: {
                            value: paymentMethod
                        },
                        CashAccount: {
                            value: cashAccount
                        },
                        Hold: {
                            value: onHold
                        },
                        PaymentAmount: {
                            value: paymentAmount
                        },
                        PaymentRef: {
                            value: NewPaymentRef
                        },
                        Description: {
                            value: description
                        },
                        custom: {
                            Document: {
                                AttributeTRANSDATE: {
                                    type: "CustomDateTimeField",
                                    value: receiptDate
                                },
                                AttributeCURYID: {
                                    type: "CustomStringField",
                                    value: currency.trim()
                                },
                                AttributeEXTREFNO: {
                                    type: "String",
                                    value: paymentRef
                                }
                            }
                        },
                        DocumentsToApply: DocToApply
                    }
                } else {
                    reqBody = {
                        Type: {
                            value: type
                        },
                        ARAccount: {
                            value: arAccount
                        },
                        ARSubaccount: {
                            value: arSubaccount
                        },
                        ApplicationDate: {
                            value: applicationDate
                        },
                        Branch: {
                            value: branch
                        },
                        CurrencyID: {
                            value: currency
                        },
                        CustomerID: {
                            value: customerID
                        },
                        LocationID: {
                            value: crmID
                        },
                        PaymentMethod: {
                            value: paymentMethod
                        },
                        CashAccount: {
                            value: cashAccount
                        },
                        Hold: {
                            value: onHold
                        },
                        PaymentAmount: {
                            value: paymentAmount
                        },
                        PaymentRef: {
                            value: NewPaymentRef
                        },
                        Description: {
                            value: description
                        },
                        custom: {
                            Document: {
                                AttributeTRANSDATE: {
                                    type: "CustomDateTimeField",
                                    value: receiptDate
                                },
                                AttributeEXTREFNO: {
                                    type: "String",
                                    value: paymentRef
                                }
                            }
                        },
                        DocumentsToApply: DocToApply
                    }
                }
            }
            else if (newMethd == 0) {
                if (currency != null && currency != '' && currency.trim() != 'MYR') { // if foreign Currency
                    reqBody = {
                        Type: {
                            value: type
                        },
                        ARAccount: {
                            value: arAccount
                        },
                        ARSubaccount: {
                            value: arSubaccount
                        },
                        ApplicationDate: {
                            value: applicationDate
                        },
                        Branch: {
                            value: branch
                        },
                        CurrencyID: {
                            value: currency
                        },
                        CustomerID: {
                            value: customerID
                        },
                        LocationID: {
                            value: crmID
                        },
                        PaymentMethod: {
                            value: paymentMethod
                        },
                        CashAccount: {
                            value: cashAccount
                        },
                        Hold: {
                            value: onHold
                        },
                        PaymentAmount: {
                            value: paymentAmount
                        },
                        PaymentRef: {
                            value: paymentRef
                        },
                        Description: {
                            value: description
                        },
                        custom: {
                            Document: {
                                AttributeTRANSDATE: {
                                    type: "CustomDateTimeField",
                                    value: receiptDate
                                },
                                AttributeCURYID: {
                                    type: "CustomStringField",
                                    value: currency.trim()
                                }
                            }
                        },
                        DocumentsToApply: DocToApply
                    }
                } else {
                    reqBody = {
                        Type: {
                            value: type
                        },
                        ARAccount: {
                            value: arAccount
                        },
                        ARSubaccount: {
                            value: arSubaccount
                        },
                        ApplicationDate: {
                            value: applicationDate
                        },
                        Branch: {
                            value: branch
                        },
                        CurrencyID: {
                            value: currency
                        },
                        CustomerID: {
                            value: customerID
                        },
                        LocationID: {
                            value: crmID
                        },
                        PaymentMethod: {
                            value: paymentMethod
                        },
                        CashAccount: {
                            value: cashAccount
                        },
                        Hold: {
                            value: onHold
                        },
                        PaymentAmount: {
                            value: paymentAmount
                        },
                        PaymentRef: {
                            value: paymentRef
                        },
                        Description: {
                            value: description
                        },
                        custom: {
                            Document: {
                                AttributeTRANSDATE: {
                                    type: "CustomDateTimeField",
                                    value: receiptDate
                                }
                            }
                        },
                        DocumentsToApply: DocToApply
                    }
                }
            }

            if (status == '1' || (mixInvType == false && invMaster.Invoice_type == 'CR' && status == '2')) {
                loggers.logError(loggers.thisLine2() + ': ' + 'Receipt paymentRef (formatAR2-2 fx):' + reqBody.PaymentRef.value + '; InvNo: ' + InvoiceNo)
            }
            return resObj = { status: resStatus, obj: reqBody, docApply: true, seperate: seperate }
        }



    }
    catch (err) {
        loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
        console.log(err)
    }
}

// exports.getReceiptCancelation = async (InvNo, CancelType = "") => {
//     try {
//         let obj = {}
//         let invoiceNo = InvNo

//         //Receipt Info
//         let resultGRPReceipt = await clsGRPReceipt.SelectGRPReceipt_ByInvoiceNo(invoiceNo);

//         if (resultGRPReceipt != null && resultGRPReceipt.length > 0) {

//             let RefId = resultGRPReceipt[0].RecId
//             let type = resultGRPReceipt[0].Type != null ? resultGRPReceipt[0].Type : ""
//             let refNbr = resultGRPReceipt[0].ReferenceNbr // Returned from Receipt
//             let status = "Voided"

//             let params = `%24filter=Status eq '${status}'&ReferenceNbr eq '${refNbr}'&Type eq '${type}'`

//             let resAccount = ''//await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.Payment, params)
//             if (resAccount) {
//                 console.log('Result :  ' + JSON.stringify(resAccount))

//                 let objCancelation = resAccount

//                 let resultGRPReceipt = await clsGRPReceipt.SelectGRPReceiptCancellation_ByInvoiceNoRefId(invoiceNo, RefId);

//                 if (resultGRPReceipt != null && resultGRPReceipt.length > 0) { } else {
//                     for (let x of objCancelation) {
//                         let body = {
//                             invoiceNo: invoiceNo,
//                             RefId: RefId,
//                             resId: x.id,
//                             rowNumber: x.rowNumber,
//                             note: x.note,
//                             ApplicationDate: x.ApplicationDate.value != undefined ? moment(x.ApplicationDate.value).format('YYYY-MM-DD HH:mm:ss') : undefined,
//                             AppliedToDocuments: x.AppliedToDocuments.value != undefined ? x.AppliedToDocuments.value : undefined,
//                             ARAccount: x.ARAccount.value != undefined ? x.ARAccount.value : undefined,
//                             ARSubaccount: x.ARSubaccount.value != undefined ? x.ARSubaccount.value : undefined,
//                             Branch: x.Branch.value != undefined ? x.Branch.value : undefined,
//                             CardAccountNbr: x.CardAccountNbr.value != undefined ? x.CardAccountNbr.value : undefined,
//                             CashAccount: x.CashAccount.value != undefined ? x.CashAccount.value : undefined,
//                             CurrencyID: x.CurrencyID.value != undefined ? x.CurrencyID.value : undefined,
//                             CustomerID: x.CustomerID.value != undefined ? x.CustomerID.value : undefined,
//                             Description: x.Description.value != undefined ? x.Description.value : undefined,
//                             Hold: x.Hold.value != undefined ? x.Hold.value : undefined,
//                             PaymentAmount: x.PaymentAmount.value != undefined ? x.PaymentAmount.value : undefined,
//                             PaymentMethod: x.PaymentMethod.value != undefined ? x.PaymentMethod.value : undefined,
//                             PaymentRef: invoiceMstr.Receipt_no.substring(3),
//                             NewPaymentRef: x.PaymentRef.value != undefined ? x.PaymentRef.value : undefined,
//                             ReferenceNbr: x.ReferenceNbr.value != undefined ? x.ReferenceNbr.value : undefined,
//                             Status: x.Status.value != undefined ? x.Status.value : undefined,
//                             Type: x.Type.value != undefined ? x.Type.value : undefined,
//                             custom: x.custom.value != undefined ? x.custom.value : undefined,
//                             resData: JSON.stringify(resAccount),
//                             reqData: params,
//                             ModifiedDate: now,
//                             CreatedDate: now
//                         }

//                         await clsGRPReceipt.InsertGRPReceiptCancelation(body);
//                     }
//                 }

//                 return obj = {
//                     status: true,
//                     data: resAccount
//                 }
//             } else {
//                 return obj = {
//                     status: false,
//                     data: resAccount || [],
//                     msg: 'No Result!'
//                 }
//             }
//         } else {
//             return obj = {
//                 status: false,
//                 data: [],
//                 msg: 'Receipt Details not exist!'
//             }
//         }
//     }
//     catch (err) {
//         loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
//         console.log(err)
//     }
// }

exports.checkInvoice = async (newMethd, invoiceNo, Status, pass) => {
    try {

        let checkdate = moment(new Date('2022-01-01 00:00:00')).format('YYYY-MM-DD HH:mm:ss');
        let oldData = false

        let getInvoiceMaster = await oLogicInvoice.SelectInvoiceMasterbyInvoiceNo(invoiceNo)
        if (getInvoiceMaster) {

            let getIGST = await iGSTIntegrationRepository.getigstDetails(invoiceNo)

            if (moment(getInvoiceMaster[0].Created_date).utc().format('YYYY-MM-DD HH:mm:ss') < checkdate) {

                if (getInvoiceMaster[0].Invoice_type == 'AP') {
                    //proses AP yg belum task completion receipt dah push ke igst (receiptdate)

                    let checkGRPAP = await clsGRPInvoice.SelectGRPInvoice_InvoiceNoType(invoiceNo, 'AP')

                    if (getInvoiceMaster[0].Status == '3' && checkGRPAP == null && getIGST != null && getIGST.length > 0) {
                        if (getIGST[0].service_type != undefined && getIGST[0].service_type.includes('confirmServiceDeliveryInclusiveTaxinvoice') && getIGST[0].ResponceCode == 1) {
                            oldData = true
                        }
                    }

                }
                else if (getInvoiceMaster[0].Invoice_type == 'CR') {
                    //proses CR yg belum byr invoice dah push ke igst (invoiceno); to get old data invoice n push manual to erp

                    let checkGRPCR = await clsGRPInvoice.SelectGRPInvoice_InvoiceNoType(invoiceNo, 'CR')

                    if ((getInvoiceMaster[0].Status == '1' || getInvoiceMaster[0].Status == '2') && checkGRPCR == null) {

                        oldData = true
                    }

                }

            }
            else {
                // use normal process
            }

            // Add checking if AP, payment date <= 2021, insert prepayment data to tbl_grp_receipt_res - Added on 22/04/2022
            if (getInvoiceMaster[0].Invoice_type == 'AP' && moment(getInvoiceMaster[0].Payment_date).utc().format('YYYY-MM-DD HH:mm:ss') < checkdate) {

                let type = "Prepayment"
                let payStatus = "Voided"
                let paramsReceipt = `%24filter=PaymentRef eq '${getInvoiceMaster[0].Invoice_no != null ? (getInvoiceMaster[0].Invoice_no).substring(3) : ""}' and Status ne '${payStatus}' and Type eq '${type}'`

                let accessToken = ''
                accessToken = await ctlAccessToken.getAccessToken();
                let getPayment = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.PaymentGet, paramsReceipt)
                loggers.logError(loggers.thisLine2() + ': ' + `${'getPayment - checkInvoice' + JSON.stringify(getPayment)}`)

                console.log('paramsReceipt' + paramsReceipt)
                console.log('getPayment' + JSON.stringify(getPayment))

                let resAccount = null
                if (getPayment && getPayment.length > 0) { //check if exist in myFast
                    resAccount = getPayment[0]
                }

                let body = {}
                let RecId = 0
                let resultGRPReceipt = await clsGRPReceipt.SelectGRPReceipt_ByInvoiceNo(getInvoiceMaster[0].Invoice_no);
                //kaksyu add
                body.invoiceNo = invoiceNo

                //13Feb23; checking success apply or not after get response from myfast
                if (Status == '2') {
                    if (resAccount && resAccount.status == false) {

                    }

                    else if (resAccount && resAccount.id && Status == '2' && resAccount.Status.value == 'Closed' || resAccount && resAccount.Hold.value == true
                    ) {
                        pass = true;
                        console.log("ALREADY APPLY!")
                    }
                    else if (resAccount && resAccount.id && Status == '2' && resAccount.DocumentsToApply && resAccount.DocumentsToApply.length > 0 && resAccount.DocumentsToApply[0].id) {
                        pass = true;
                        console.log("SUCESS DOC APPLY!")
                        console.log(resAccount.DocumentsToApply)
                    }
                    else if (pass == false) {
                        console.log("error " + invoiceNo)
                    }
                }

                //28Feb23
                if (newMethd == 1) {
                    if (((resAccount && resAccount.id && Status == '1') || pass == true) && (resAccount.custom.Document.AttributeEXTREFNO.value == getInvoiceMaster[0].Receipt_no.substring(3) || resAccount.PaymentRef.value == invoiceMstr.Receipt_no.substring(3))) {
                        if (resultGRPReceipt == null) {
                            body = {
                                resId: resAccount.id,
                                note: resAccount.note,
                                ApplicationDate: resAccount.ApplicationDate.value != undefined ? moment(resAccount.ApplicationDate.value).format('YYYY-MM-DD HH:mm:ss') : undefined,
                                AppliedToDocuments: resAccount.AppliedToDocuments.value != undefined ? resAccount.AppliedToDocuments.value : resAccount.PaymentAmount.value != undefined ? resAccount.PaymentAmount.value : undefined,
                                ARAccount: resAccount.ARAccount.value != undefined ? resAccount.ARAccount.value : undefined,
                                ARSubaccount: resAccount.ARSubaccount.value != undefined ? resAccount.ARSubaccount.value : undefined,
                                Branch: resAccount.Branch.value != undefined ? resAccount.Branch.value : undefined,
                                CardAccountNbr: resAccount.CardAccountNbr.value != undefined ? resAccount.CardAccountNbr.value : undefined,
                                CashAccount: resAccount.CashAccount.value != undefined ? resAccount.CashAccount.value : undefined,
                                CurrencyID: resAccount.CurrencyID.value != undefined ? resAccount.CurrencyID.value : undefined,
                                CustomerID: resAccount.CustomerID.value != undefined ? resAccount.CustomerID.value : undefined,
                                Description: resAccount.Description.value != undefined ? resAccount.Description.value : undefined,
                                Hold: resAccount.Hold.value != undefined ? resAccount.Hold.value : undefined,
                                PaymentAmount: resAccount.PaymentAmount.value != undefined ? resAccount.PaymentAmount.value : undefined,
                                PaymentMethod: resAccount.PaymentMethod.value != undefined ? resAccount.PaymentMethod.value : undefined,
                                PaymentRef: resAccount.custom.Document.AttributeEXTREFNO.value != undefined ? resAccount.custom.Document.AttributeEXTREFNO.value : undefined,
                                ReferenceNbr: resAccount.ReferenceNbr.value != undefined ? resAccount.ReferenceNbr.value : undefined,
                                Status: resAccount.Status.value != undefined ? resAccount.Status.value : undefined,
                                Type: resAccount.Type.value != undefined ? resAccount.Type.value : undefined,
                                custom: resAccount.custom.value != undefined ? resAccount.custom.value : undefined,
                                resData: JSON.stringify(resAccount),
                                ModifiedDate: now,
                                CreatedDate: now,
                                Flag: "1",
                                resStatus: "1",//"SUCCESS"
                                PrepaymentReferenceNbr: resAccount.ReferenceNbr.value != undefined ? resAccount.ReferenceNbr.value : undefined,
                                NewPaymentRef: resAccount.PaymentRef.value != undefined ? resAccount.PaymentRef.value : undefined,

                            }

                            RecId = await clsGRPReceipt.InsertGRPReceipt(body);

                        } else {
                            resultGRPReceipt = resultGRPReceipt.filter(tbl => tbl.ReferenceNbr == null && tbl.Flag == '2' && tbl.resStatus == '2')

                            if (resultGRPReceipt !== null && resultGRPReceipt.length > 0) {
                                RecId = resultGRPReceipt[0].RecId

                                body = {
                                    RecId: RecId,
                                    resId: resAccount.id,
                                    note: resAccount.note,
                                    ApplicationDate: resAccount.ApplicationDate.value != undefined ? moment(resAccount.ApplicationDate.value).format('YYYY-MM-DD HH:mm:ss') : undefined,
                                    AppliedToDocuments: resAccount.AppliedToDocuments.value != undefined ? resAccount.AppliedToDocuments.value : undefined,
                                    ARAccount: resAccount.ARAccount.value != undefined ? resAccount.ARAccount.value : undefined,
                                    ARSubaccount: resAccount.ARSubaccount.value != undefined ? resAccount.ARSubaccount.value : undefined,
                                    Branch: resAccount.Branch.value != undefined ? resAccount.Branch.value : undefined,
                                    CardAccountNbr: resAccount.CardAccountNbr.value != undefined ? resAccount.CardAccountNbr.value : undefined,
                                    CashAccount: resAccount.CashAccount.value != undefined ? resAccount.CashAccount.value : undefined,
                                    CurrencyID: resAccount.CurrencyID.value != undefined ? resAccount.CurrencyID.value : undefined,
                                    CustomerID: resAccount.CustomerID.value != undefined ? resAccount.CustomerID.value : undefined,
                                    Description: resAccount.Description.value != undefined ? resAccount.Description.value : undefined,
                                    Hold: resAccount.Hold.value != undefined ? resAccount.Hold.value : undefined,
                                    PaymentAmount: resAccount.PaymentAmount.value != undefined ? resAccount.PaymentAmount.value : undefined,
                                    PaymentMethod: resAccount.PaymentMethod.value != undefined ? resAccount.PaymentMethod.value : undefined,
                                    PaymentRef: getInvoiceMaster[0].Receipt_no.substring(3),
                                    ReferenceNbr: resAccount.ReferenceNbr.value != undefined ? resAccount.ReferenceNbr.value : undefined,
                                    Status: resAccount.Status.value != undefined ? resAccount.Status.value : undefined,
                                    Type: resAccount.Type.value != undefined ? resAccount.Type.value : undefined,
                                    custom: resAccount.custom.value != undefined ? resAccount.custom.value : undefined,
                                    resData: JSON.stringify(resAccount),
                                    ModifiedDate: now,
                                    PrepaymentReferenceNbr: resAccount.ReferenceNbr.value != undefined ? resAccount.ReferenceNbr.value : undefined,
                                    NewPaymentRef: resAccount.PaymentRef.value != undefined ? resAccount.PaymentRef.value : undefined,
                                }

                                if (RecId != undefined && RecId != null && RecId != 0) {
                                    body.invoiceNo = invoiceNo //kaksyu add
                                    await clsGRPReceipt.UpdateGRPReceipt(body);
                                }
                            }
                        }

                    }
                }
                else if (newMethd == 0) {
                    if (((resAccount && resAccount.id && Status == '1') || pass == true) && resAccount.PaymentRef.value == getInvoiceMaster[0].Receipt_no.substring(3)) {
                        if (resultGRPReceipt == null) {
                            body = {
                                resId: resAccount.id,
                                note: resAccount.note,
                                ApplicationDate: resAccount.ApplicationDate.value != undefined ? moment(resAccount.ApplicationDate.value).format('YYYY-MM-DD HH:mm:ss') : undefined,
                                AppliedToDocuments: resAccount.AppliedToDocuments.value != undefined ? resAccount.AppliedToDocuments.value : undefined,
                                ARAccount: resAccount.ARAccount.value != undefined ? resAccount.ARAccount.value : undefined,
                                ARSubaccount: resAccount.ARSubaccount.value != undefined ? resAccount.ARSubaccount.value : undefined,
                                Branch: resAccount.Branch.value != undefined ? resAccount.Branch.value : undefined,
                                CardAccountNbr: resAccount.CardAccountNbr.value != undefined ? resAccount.CardAccountNbr.value : undefined,
                                CashAccount: resAccount.CashAccount.value != undefined ? resAccount.CashAccount.value : undefined,
                                CurrencyID: resAccount.CurrencyID.value != undefined ? resAccount.CurrencyID.value : undefined,
                                CustomerID: resAccount.CustomerID.value != undefined ? resAccount.CustomerID.value : undefined,
                                Description: resAccount.Description.value != undefined ? resAccount.Description.value : undefined,
                                Hold: resAccount.Hold.value != undefined ? resAccount.Hold.value : undefined,
                                PaymentAmount: resAccount.PaymentAmount.value != undefined ? resAccount.PaymentAmount.value : undefined,
                                PaymentMethod: resAccount.PaymentMethod.value != undefined ? resAccount.PaymentMethod.value : undefined,
                                PaymentRef: resAccount.PaymentRef.value != undefined ? resAccount.PaymentRef.value : undefined,
                                ReferenceNbr: resAccount.ReferenceNbr.value != undefined ? resAccount.ReferenceNbr.value : undefined,
                                Status: resAccount.Status.value != undefined ? resAccount.Status.value : undefined,
                                Type: resAccount.Type.value != undefined ? resAccount.Type.value : undefined,
                                custom: resAccount.custom.value != undefined ? resAccount.custom.value : undefined,
                                resData: JSON.stringify(resAccount),
                                ModifiedDate: now,
                                CreatedDate: now,
                                Flag: "1",
                                resStatus: "1",//"SUCCESS"
                                PrepaymentReferenceNbr: resAccount.ReferenceNbr.value != undefined ? resAccount.ReferenceNbr.value : undefined
                            }

                            RecId = await clsGRPReceipt.InsertGRPReceipt(body);

                        } else {
                            resultGRPReceipt = resultGRPReceipt.filter(tbl => tbl.ReferenceNbr == null && tbl.Flag == '2' && tbl.resStatus == '2')

                            if (resultGRPReceipt !== null && resultGRPReceipt.length > 0) {
                                RecId = resultGRPReceipt[0].RecId

                                body = {
                                    RecId: RecId,
                                    resId: resAccount.id,
                                    note: resAccount.note,
                                    ApplicationDate: resAccount.ApplicationDate.value != undefined ? moment(resAccount.ApplicationDate.value).format('YYYY-MM-DD HH:mm:ss') : undefined,
                                    AppliedToDocuments: resAccount.AppliedToDocuments.value != undefined ? resAccount.AppliedToDocuments.value : undefined,
                                    ARAccount: resAccount.ARAccount.value != undefined ? resAccount.ARAccount.value : undefined,
                                    ARSubaccount: resAccount.ARSubaccount.value != undefined ? resAccount.ARSubaccount.value : undefined,
                                    Branch: resAccount.Branch.value != undefined ? resAccount.Branch.value : undefined,
                                    CardAccountNbr: resAccount.CardAccountNbr.value != undefined ? resAccount.CardAccountNbr.value : undefined,
                                    CashAccount: resAccount.CashAccount.value != undefined ? resAccount.CashAccount.value : undefined,
                                    CurrencyID: resAccount.CurrencyID.value != undefined ? resAccount.CurrencyID.value : undefined,
                                    CustomerID: resAccount.CustomerID.value != undefined ? resAccount.CustomerID.value : undefined,
                                    Description: resAccount.Description.value != undefined ? resAccount.Description.value : undefined,
                                    Hold: resAccount.Hold.value != undefined ? resAccount.Hold.value : undefined,
                                    PaymentAmount: resAccount.PaymentAmount.value != undefined ? resAccount.PaymentAmount.value : undefined,
                                    PaymentMethod: resAccount.PaymentMethod.value != undefined ? resAccount.PaymentMethod.value : undefined,
                                    PaymentRef: resAccount.PaymentRef.value != undefined ? resAccount.PaymentRef.value : undefined,
                                    ReferenceNbr: resAccount.ReferenceNbr.value != undefined ? resAccount.ReferenceNbr.value : undefined,
                                    Status: resAccount.Status.value != undefined ? resAccount.Status.value : undefined,
                                    Type: resAccount.Type.value != undefined ? resAccount.Type.value : undefined,
                                    custom: resAccount.custom.value != undefined ? resAccount.custom.value : undefined,
                                    resData: JSON.stringify(resAccount),
                                    ModifiedDate: now,
                                    PrepaymentReferenceNbr: resAccount.ReferenceNbr.value != undefined ? resAccount.ReferenceNbr.value : undefined
                                }

                                if (RecId != undefined && RecId != null && RecId != 0) {
                                    body.invoiceNo = invoiceNo //kaksyu add
                                    await clsGRPReceipt.UpdateGRPReceipt(body);
                                }
                            }
                        }
                    }
                }

            }

            return oldData
        }
        else {

            return false

        }

    } catch (err) {
        loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
        console.log(err)
    }
}

exports.putSingleReceipt = async (req, res) => {
    try {

        let invoice = null
        let invoiceArray = null
        if (req.body && req.body.length > 0) {
            invoiceArray = req.body
        }
        else {
            invoice = req.body.invoiceNo
        }

        let status = req.body.status || ""

        if (invoiceArray) { // bulk

            for (let data = 0; data < invoiceArray.length; data++) {
                if (commanConstants.EnableIGST == commanConstants.Yes) {
                    this.putReceipt(invoiceArray[data].invoiceNo, invoiceArray[data].status)
                }
            }

        } else { // single data
            if (commanConstants.EnableIGST == commanConstants.Yes) {
                this.putReceipt(invoice, status)
            }
        }


        res.status(200).json("ok")
    }
    catch (err) {
        loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
        console.log(err)
    }
}

exports.DocApplyValidation = async (newMethd, obj1) => {
    try {
        let Valid = false;
        let receipt_no, paymentRef, invNo;

        if (obj1 != null) { //if type payment
            if (obj1.Type && obj1.Type.value != '' && obj1.Type.value == 'Payment') {
                if (obj1.DocumentsToApply != undefined) {
                    if (obj1.DocumentsToApply && obj1.DocumentsToApply.length > 0 && obj1.DocumentsToApply[0].ReferenceNbr && obj1.DocumentsToApply[0].ReferenceNbr.value != '') {
                        let invRefNo = obj1.DocumentsToApply[0].ReferenceNbr.value
                        let getGRPInv = await clsGRPInvoice.SelectGRPInvoice_ReferenceNbr(invRefNo)
                        if (getGRPInv != null && getGRPInv.length > 0) {
                            invNo = getGRPInv[0].invoiceNo
                            let getInvoiceMaster = await oLogicInvoice.SelectInvoiceMasterbyInvoiceNo(invNo)
                            if (getInvoiceMaster != null && getInvoiceMaster.length > 0) {
                                receipt_no = getInvoiceMaster[0].Receipt_no
                            }
                            if (obj1.PaymentRef && obj1.PaymentRef.value != '' && obj1.PaymentRef.value != null) {
                                paymentRef = obj1.PaymentRef.value
                                if (ConsistAdditionalAlphabet(paymentRef) == true) {
                                    paymentRef = paymentRef.substring(0, paymentRef.length - 1)
                                }

                                if (newMethd == 1) {
                                    if (receipt_no.includes(obj1.custom.Document.AttributeEXTREFNO.value)) {
                                        Valid = true;
                                    }
                                }
                                else if (newMethd == 0) {

                                    if (receipt_no.includes(paymentRef)) {
                                        Valid = true;
                                    }
                                }
                            }
                            // else{ //paymentref null
                            //     Valid = true
                            // }
                        }

                    }
                }
                loggers.logError(loggers.thisLine2() + ': ' + 'Receipt paymentRef (DocApplyValidation-1 fx):' + paymentRef + '; InvNo: ' + invNo)
            }
            else if (obj1.Type && obj1.Type.value != '' && obj1.Type.value == 'Prepayment') {
                if (obj1.DocumentsToApply != undefined) {
                    if (obj1.DocumentsToApply && obj1.DocumentsToApply.length > 0 && obj1.DocumentsToApply[0].ReferenceNbr && obj1.DocumentsToApply[0].ReferenceNbr.value != '') {
                        let invRefNo = obj1.DocumentsToApply[0].ReferenceNbr.value
                        let getGRPInv = await clsGRPInvoice.SelectGRPInvoice_ReferenceNbr(invRefNo)
                        if (getGRPInv != null && getGRPInv.length > 0) {
                            invNo = getGRPInv[0].invoiceNo
                            let getInvoiceMaster = await oLogicInvoice.SelectInvoiceMasterbyInvoiceNo(invNo)
                            if (getInvoiceMaster != null && getInvoiceMaster.length > 0) {
                                receipt_no = getInvoiceMaster[0].Receipt_no
                            }
                            if (obj1.ReferenceNbr && obj1.ReferenceNbr.value != '') {
                                let Reference_no = obj1.ReferenceNbr.value
                                let resultGRPReceipt = await clsGRPReceipt.SelectGRPReceipt_ByRefereceNbr(Reference_no);
                                paymentRef = resultGRPReceipt && resultGRPReceipt.length > 0 && resultGRPReceipt[0].PaymentRef != '' ? resultGRPReceipt[0].PaymentRef : ''

                                if (ConsistAdditionalAlphabet(paymentRef) == true) {
                                    paymentRef = paymentRef.substring(0, paymentRef.length - 1)
                                }
                                if (newMethd == 1) {
                                    if (receipt_no.includes(obj1.custom.Document.AttributeEXTREFNO.value)) {
                                        Valid = true;
                                    }
                                }
                                else if (newMethd == 0) {
                                    if (receipt_no.includes(paymentRef)) {
                                        Valid = true;
                                    }
                                }

                            }

                        }

                    }
                }
                loggers.logError(loggers.thisLine2() + ': ' + 'Receipt paymentRef (DocApplyValidation-2 fx):' + paymentRef + '; InvNo: ' + invNo)
            }
        }

        return Valid;

    } catch (err) {
        loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
        console.log(err)
    }
}

function ConsistAdditionalAlphabet(str) {
    return /[a-yA-Y]/.test(str);

}

let getNewPaymentRef = async (invNo) => {
    try {
        let NewObj = {
            NewPaymentRef: '',
            Description: ''
        }

        let getInvoiceMaster = await oLogicInvoice.SelectInvoiceMasterbyInvoiceNo(invNo)
        if (getInvoiceMaster && getInvoiceMaster.length > 0) {
            let Payment_type = getInvoiceMaster[0].Payment_type
            let Payment_Mode = getInvoiceMaster[0].Payment_mode

            let getInvNo = (await oLogicInvoice.SelectInvoiceMasterbyReceiptNo(getInvoiceMaster[0].Receipt_no)).filter(tbl => tbl.Status == '3')
            NewObj.Description = getInvNo != null ? getInvNo.map(item => item.Invoice_no.substring(3)).join(',') : '';


            if (Payment_type && Payment_type.toUpperCase() == 'OFFLINE') {
                let OtherMode = ['BANK IN CASH', 'TELEGRAPHIC TRANSFER', 'IBG', 'JOMPAY', 'BANK TRANSFER', 'Bank Draft/Postal Order/EFT/IBG/RENTAS/TT/CDM'];

                let getPaymentOffline = await iGSTIntegrationRepository.getPaymentDetails(getInvoiceMaster)
                if (Payment_Mode.toUpperCase() == 'CASH') {
                    NewObj.NewPaymentRef = 'CSH'
                }
                else if (Payment_Mode.toUpperCase().includes('CHEQUE')) {
                    let Cheque_no = getPaymentOffline && getPaymentOffline[0].Cheque_no ? getPaymentOffline[0].Cheque_no : ''

                    // UAT - remove trim cheque no
                    // let Cheque = getPaymentOffline && getPaymentOffline[0].Cheque_no ? getPaymentOffline[0].Cheque_no : ''
                    // if (Cheque != '' && (Cheque.includes(',') || Cheque.includes('&'))) {
                    //     Cheque_no = (Cheque.match(/\d+/g) || []).map(part => part.slice(0, 6));
                    // }
                    // else {
                    //     Cheque_no = Cheque ? Cheque.trim().replace(/[^0-9]/g, '').slice(0, 6) : ''
                    // }
                    // UAT - remove trim cheque no

                    NewObj.NewPaymentRef = Cheque_no ? Cheque_no : ''
                }
                else if (Payment_Mode.toUpperCase().includes('CREDIT CARD')) {
                    NewObj.NewPaymentRef = 'VISA/MASTER/AMEX'
                }
                else if (OtherMode.some(mode => Payment_Mode.toUpperCase().trim().includes(mode))) {
                    NewObj.NewPaymentRef = getInvoiceMaster[0].Payment_ref
                }

            }
            else if (Payment_type && Payment_type.toUpperCase() == 'ONLINE') {
                let PaymentMode_CC = ['CC - GHLDA', 'CC - PBB3', 'CC - PBB3_M', 'CREDIT CARD','CC - MYDEBITCNP'];
                let PaymentMode_FPX_WALLER = ['DD - FPXD', 'DD - FPXDB2B', 'WA - BOOST', 'WA - GRABPAY', 'WA - TOUCHNGO', 'E-WALLET', 'FPX'];

                let getOnline = await clsPayment.getOrderData(getInvoiceMaster[0].Order_no)
                NewObj.Description = getInvoiceMaster != null ? getInvoiceMaster[0].Order_no : ''
                if (PaymentMode_CC.some(mode => Payment_Mode.toUpperCase().includes(mode))) {
                    NewObj.NewPaymentRef = getOnline && getOnline[0].mp_txnid
                }
                else if (PaymentMode_FPX_WALLER.some(mode => Payment_Mode.toUpperCase().includes(mode))) {
                    NewObj.NewPaymentRef = getOnline && getOnline[0].mp_BankRefNo
                }

                if (getOnline && getOnline.length > 0 && getOnline[0].mp_siteid == 'CAKNA') {
                    if (getOnline[0].mp_txnid != null && getOnline[0].mp_txnid != '' && getOnline[0].mp_txnid != '-' && (getOnline[0].mp_BankRefNo == null || getOnline[0].mp_BankRefNo == '-')) {
                        NewObj.NewPaymentRef = getOnline[0].mp_txnid
                    }

                }
            }

            //check whether cakna payment or not
            let getCaknaPayment = await oLogicCaknaPayment.SelectData_CaknaPayment_byOrderNo(getInvoiceMaster[0].Order_no)
            if (getCaknaPayment && getCaknaPayment.length > 0) {
                NewObj.Description = getInvoiceMaster != null ? getInvoiceMaster[0].Order_no : ''
            }

        }



        return NewObj;

    } catch (err) {
        loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
        console.log(err)
    }
}

let VerifiedDate = async (invNo) => {
    try {
        let NewObj = {
            VerifiedDate: '',
        }

        let getInvoiceMaster = await oLogicInvoice.SelectInvoiceMasterbyInvoiceNo(invNo)
        if (getInvoiceMaster && getInvoiceMaster.length > 0) {
            let Payment_type = getInvoiceMaster[0].Payment_type
            let Payment_Mode = getInvoiceMaster[0].Payment_mode

            if (Payment_type.toUpperCase() == 'OFFLINE') {
                let OtherMode = ['BANK IN CASH', 'TELEGRAPHIC TRANSFER', 'IBG', 'JOMPAY', 'BANK TRANSFER', 'Bank Draft/Postal Order/EFT/IBG/RENTAS/TT/CDM', 'CHEQUE DEPOSIT', 'BANK IN CHEQUE'];

                if (Payment_Mode.toUpperCase() == 'CASH' || Payment_Mode.toUpperCase() == 'CHEQUE' || Payment_Mode.toUpperCase() == ('CREDIT CARD') || Payment_Mode.toUpperCase() == ('CREDIT CARD (VISA/MASTERCARD/AMEX)')) {
                    NewObj.VerifiedDate = moment(getInvoiceMaster[0].Payment_date).utc().format('YYYY-MM-DD')
                }
                else if (OtherMode.some(mode => Payment_Mode.toUpperCase().trim().includes(mode))) {
                    NewObj.VerifiedDate = moment(getInvoiceMaster[0].verified_date_ph).utc().format('YYYY-MM-DD')
                }
                else {
                    NewObj.VerifiedDate = ''
                }

            }
            else if (Payment_type.toUpperCase() == 'ONLINE') {
                let PaymentMode_CC = ['CC - GHLDA', 'CC - PBB3', 'CC - PBB3_M', 'CREDIT CARD','CC - MYDEBITCNP'];
                let PaymentMode_FPX_WALLER = ['DD - FPXD', 'DD - FPXDB2B', 'WA - BOOST', 'WA - GRABPAY', 'WA - TOUCHNGO', 'E-WALLET', 'FPX'];

                if (PaymentMode_CC.some(mode => Payment_Mode.toUpperCase().includes(mode)) || PaymentMode_FPX_WALLER.some(mode => Payment_Mode.toUpperCase().includes(mode))) {
                    NewObj.VerifiedDate = moment(getInvoiceMaster[0].Payment_date).utc().format('YYYY-MM-DD')
                }
                else {
                    NewObj.VerifiedDate = ''
                }
            }

        }

        return NewObj;

    } catch (err) {
        // loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
        console.log(err)
    }
}


// exports.VoidPayment = async (invoiceNo) => {
//     try {
//         let resAccount = null;
//         let reqBody = {}
//         accessToken = ''
//         accessToken = await ctlAccessToken.getAccessToken();
//         let resultGRPReceipt = await clsGRPReceipt.SelectGRPReceipt_ByInvoiceNo(invoiceNo);
//         if (resultGRPReceipt != null && resultGRPReceipt[0].ReferenceNbr != undefined && resultGRPReceipt[0].ReferenceNbr != null) {
//             reqBody = {
//                 entity: {
//                     ReferenceNbr: {
//                         value: resultGRPReceipt[0].ReferenceNbr
//                     },
//                     Type: {
//                         value: resultGRPReceipt[0].Type
//                     },
//                     Hold: {
//                         value: false
//                     }
//                 },
//                 custom: {
//                     Document: {
//                         UsrVoidReason: {
//                             type: "CustomStringField",
//                             value: ""
//                         }
//                     }
//                 }

//             }
//             resAccount = await ctlAccessToken.VoidPayment(ctlAccessToken.apiRoutes.VoidPayment, '', reqBody)
//             loggers.logError(loggers.thisLine2() + ': ' + `${'resAccount - voidPayment' + JSON.stringify(resAccount)}`)
//         }
//         else {
//             console.log('No ReferenceNbr in tbl_grp_receipt_res!')
//             return false;

//         }




//     } catch (err) {
//         loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
//         console.log(err)
//     }
// }