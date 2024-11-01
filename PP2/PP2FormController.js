const sql = require('mssql');
const async = require('async')
const moment = require('moment')
const format = require('date-format')
const logger = require('../../log')
const getUser = require('../../repositories/App_Code/getUser');
const clsDMS = require('../../repositories/DMS/DMS')
const LOEnum = require('../../repositories/App_Code/LOEnum')
const oLogicPP2 = require('../../repositories/ProductCertification/PP2Form')
const pp2Logic = require('../../repositories/PP2Logic/PP2Form')
const oLogicMasterLink = require('../../repositories/NewApplication/MasterLinkLogic');
const oLogicMasterAddr = require('../../repositories/NewApplication/MasterAddrLogic');
const oLogicCustomer = require('../../repositories/AdminPanel/CustomerLogic');
const oLogicContact = require('../../repositories/AdminPanel/ContactLogic');
const oLogicProduct = require('../../repositories/AdminPanel/ProductGroupLogic');
const oLogicStandard = require('../../repositories/AdminPanel/StandardLogic');
const oLogicStandLib = require('../../repositories/AdminPanel/StandardLibLogic');
const clsGlobal = require('../../repositories/App_Code/clsGlobal');
const oLogicFile = require('../../repositories/File/FileLogic');
const oLogicCert = require('../../repositories/Cert/CertLogic');
const oLogicAddr = require('../../repositories/AdminPanel/AddressLogic')
const oLogicCity = require('../../repositories/AdminPanel/CityLogic')
const oLogicState = require('../../repositories/AdminPanel/StateLogic')
const oLogicCountry = require('../../repositories/AdminPanel/CountryLogic')
const PP2CustomerDetails = require('../../repositories/PP2Logic/PP2CustomerDetails')
const TMSQuotationDtl = require('../../repositories/PP2Logic/TMSQuotationLogic')
const ctlAttachment1 = require('../../controller/ctlAttachment');
const getAccess = require('../PP2/AccessToken')
const queryRepo = require('../../repositories/QueryRepository.js')
const Task = require('../../repositories/App_Code/Task');
const lookupLogic = require('../../repositories/AdminPanel/LookupLogic');
const transactionLogic = require('../../repositories/PP2Logic/TransactionLogic')
const newCustRegistrationLogic = require('../../../CUSTOMER/repositories/CustomersRepository/NewCustomerRegistrationLogic');
const UpdateCPAStatus = require('../../../CUSTOMER/repositories/CustomersRepository/UpdateCPAStatus');
const utils = require('../control/utils');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const TMSTrans = require('../../controller/PP2/TMSTrans')
const TMSFileDoc = require('./TMSFileDoc');
// const apiURL = 'https://staging-gw-codelab.sirim.my/eip-admin/tms-pp-2/v1/' //staging
const apiURL = process.env.TMS_API_URL

// Global Variables
let Now = moment().format('YYYY-MM-DD HH:mm:ss');
const TMSLogic = require('../../controller/PP2/TMSAPI');
let oLogicEISNewApp = require('../../repositories/EISInspection/EISAppEISLogic');
let oLogicGen = require('../../repositories/NewApplication/AppGenLogic');

const Page_Load = async (req, res) => {
    let obj = {}
    try {
        let LoginGUID;
        obj.ViewState = {};
        obj.Application = {
            file_no: '',
            license_no: '',
            ref_no: '',
            treason_pre: 0,
            treason_license: 0,
            treason_scheme: 0,
            treason_other: 0,
            treason_others_specify: '',
            test_full: 0,
            test_partial: 0,
            test_confirm: 0,
            test_others: 0,
            test_others_specify: '',
            sampling_date: null,
        }

        obj.Licencee = {
            email: '',
            comp_name: '',
            business_reg: '',
            comp_type: '',
            address1: '',
            address2: '',
            address3: '',
            postcode: '',
            state: '',
            city: '',
            country: '',
            contact_name: '',
            contact_position: '',
            contact_phone: '',
            contact_fax: '',
            contact_mail: '',
            contact_id: '',
            user_id: '',
            registration_id: '',
            crm_id: '',
            addr_id: '',
        };

        obj.Manufacturer = {
            man_roc: '',
            man_name: '',
            man_address_1: '',
            man_address_2: '',
            man_address_3: '',
            man_postcode: '',
            man_city: '',
            man_state: '',
            man_country: '',
            man_contact_name_1: '',
            man_contact_position_1: '',
            man_contact_phone_1: '',
            man_contact_mail_1: '',
            man_contact_fax_1: '',
            man_contact_name_2: '',
            man_contact_position_2: '',
            man_contact_phone_2: '',
            man_contact_mail_2: '',
            man_contact_fax_2: '',
            chkAddAbv: {
                Checked: false
            }
        };
        obj.Product = {
            product: '',
            brand: '',
            type: '',
            model: '',
            rating: '',
            size: '',
            standard: '',
            clause_test: '',
            remark: '',
            product_desc: '',
            other_tr: '',
            sirim_label_no: '',
            conformity_statement: 1, //default
            sample_qty: 0
        };

        obj.Showhide = {
            cancellation_remarks_boolean: false,
            cancellation_remarks: '',
            amend_remarks_boolean: false,
            amend_remark: '',
            btnDraft: true,
            btnSubmit: true,
            btnCancel: false,
            btnAmend: false
        }
        obj.isUseTMSData = false;


        if (typeof req.query.LoginGUID != 'undefined') {
            LoginGUID = req.query.LoginGUID;
        }
        else {
            res.status(200).send({ message: "Session Expired. Please re-login account.", status: false });
            return;
        }

        let TaskId = req.query.TaskId
        if (TaskId != 'undefined' && TaskId > 0) {
            obj.ViewState.TaskId = TaskId;
        }

        let Listing = req.query.Listing
        if (Listing != 'undefined' && Listing > 0) {
            obj.ViewState.Listing = 1
        }

        let FileId = req.query.FileId
        if (FileId != 'undefined' && FileId > 0) {
            obj.ViewState.FileId = FileId;
        }
        else {
            FileId = 0;
        }

        let JobId = req.query.JobId
        if (JobId != 'undefined' && JobId > 0) {
            obj.ViewState.JobId = JobId
        }
        else {
            JobId = 0;
        }

        let FileDetail = req.query.FileDetail
        if (FileDetail != 'undefined' && FileDetail > 0) {
            obj.ViewState.FileDetail = 1
        }
        else {
            FileDetail = 0;
        }

        let Duplicate = req.query.Duplicate
        if (Duplicate != 'undefined' && (Duplicate == '1' || Duplicate == 1)) {
            obj.ViewState.Duplicate = 1
        }
        else {
            obj.ViewState.Duplicate = 0;
        }

        let Id = req.query.Id
        if (Id != 'undefined' && Id > 0) {
            obj.ViewState.id = Id
        }
        else {
            Id = 0;
        }

        let Source = req.query.Source
        if (Source != 'undefined' && Source != '') {
            obj.ViewState.source_pp2 = Source;
        }
        else if (obj.ViewState.Listing == 1) {
            obj.ViewState.source_pp2 = 'Listing'
        }
        else {
            obj.ViewState.source_pp2 = 'FileDetail';
        }

        if (Source == 'FileDetail' || Source == 'AuditReport' || obj.ViewState.Duplicate == 1 || Id == 0) {
            obj.ViewState.pp2_status = 'New'
        }
        else if (req.query.Draft != undefined && req.query.Draft == '1') {
            obj.ViewState.pp2_status = 'Draft'
        }
        else if (req.query.Cancel != undefined && req.query.Cancel == '1') {
            obj.ViewState.pp2_status = 'Canceled'
            obj.Showhide.cancellation_remarks_boolean = true
            obj.Showhide.cancellation_remarks = ''
        }
        else if (req.query.Amend != undefined && req.query.Amend == '1') {
            obj.ViewState.pp2_status = 'Amendment'
            obj.Showhide.amend_remarks_boolean = true
            obj.Showhide.amend_remark = ''
        }
        else if (req.query.Completed != undefined && req.query.Completed == '1') {
            obj.ViewState.pp2_status = 'Completed'
        }
        else {
            if (TaskId != '') {
                obj.ViewState.pp2_status = 'Submitted (Draft)'
            }
            else {
                obj.ViewState.pp2_status = 'Submitted'
            }
        }

        let View = req.query.View
        if (View == '1' || View == 1) {
            obj.Showhide.btnDraft = false
            obj.Showhide.btnSubmit = false
            obj.Showhide.btnCancel = false
            obj.Showhide.btnAmend = false
        }

        obj.Application.Section = await sLoadSection()
        obj.Application.UsrType = await sLoadUserType()
        obj.Application.Payment = await sLoadPayment()


        //restrict the roles to do changes or submit this form
        let userProf = await getUser.GetUser_byLoginGUID(LoginGUID)
        if (userProf && userProf.length > 0) {

            let strRole = "'Auditor','Trainee Auditor','Lead Auditor','Group Leader','Consignment Officer'"; //other than these role;can view only
            let parameters = [
                { name: 'userid', sqltype: sql.NVarChar, value: userProf[0].UserId }
            ]
            let query = `SELECT DISTINCT tbl.* from tbl_user tbl JOIN tbl_user_roles tbl1
                      on tbl.UserId=tbl1.UserId WHERE tbl1.Role IN (${strRole})
                      and tbl1.Status = '1' and tbl.Status ='1' and tbl.userid = @userid ORDER BY tbl.FullName`;
            let resultPO = await queryRepo.SelectDataExecuteQuery(query, parameters).catch((e) => { logger.logError(logger.thisLine2() + ': ' + `${e}`) });

            if (resultPO == null && userProf[0].Role.toUpperCase() != 'CLERK') {
                obj.Showhide.btnDraft = false
                obj.Showhide.btnSubmit = false
                obj.Showhide.btnCancel = false
                obj.Showhide.btnAmend = false
            }
            else {
                obj.ViewState.AllowEdit = 1
            }

        }
        if (Id != '' && Id > 0 && obj.ViewState.Duplicate == 0) {
            await checkPP2Status(FileId, Id, obj) //if job not created yet, can raise amendment & cancellation
        }


        let libProdId = ''
        let getFile = await oLogicFile.SelectFiledDataBy_FileID(FileId)
        if (getFile != undefined && getFile.length > 0) {
            obj.Application.file_no = getFile[0].FileNo

            let resultScheme = await lookupLogic.SelectSchemeType(getFile[0].SchemeId)
            if(resultScheme && resultScheme.length > 0) {
                obj.scheme = resultScheme[0].SchemeName
                obj.scheme_type = resultScheme[0].Type
            }

            let getMasterLink = await oLogicMasterLink.SelectData_MasterLink_byRecId(getFile[0].AppId, "1").catch((e) => { logger.logError(logger.thisLine2() + ': ' + `${e}`) });
            if (getMasterLink != undefined && getMasterLink.length > 0) {
                if(getMasterLink[0].ProdId && getMasterLink[0].ProdId > 0) {
                    let getProduct = await oLogicProduct.SelectProductdData_byProdID(getMasterLink[0].ProdId).catch((e) => { logger.logError(logger.thisLine2() + ': ' + `${e}`) });
                    if (getProduct != undefined && getProduct.length > 0) {
                        obj.Product.product = getProduct[0].ProdName
                        libProdId = getProduct[0].LibProdId
                    }
                    else {
                        obj.Product.product = ""
                    }
    
                    let getStandard = await oLogicStandard.Select_StandardData_ProdId(getMasterLink[0].ProdId).catch((e) => { logger.logError(logger.thisLine2() + ': ' + `${e}`) });
                    let standardId = getStandard[0].StandardId
                    if (standardId != null && standardId != "") {
                        let getStandardLib = await oLogicStandLib.SelectStandardLibData_standardLibId(standardId).catch((e) => { logger.logError(logger.thisLine2() + ': ' + `${e}`) });
                        if (getStandardLib != undefined && getStandardLib.length > 0) {
                            obj.Product.standard = getStandardLib[0].StandardCode
                        }
                        else {
                            obj.Product.standard = ""
                        }
                    }
                }
                else { // EIS
                    let ResultGen = await oLogicGen.SelectData_Gen_byAppId(getMasterLink[0].AppId)
                    if(ResultGen && ResultGen.length > 0) {
                        let resultEIS = await oLogicEISNewApp.SelectDate_EIS(ResultGen[0].RefId)
                        if(resultEIS && resultEIS.length > 0) {
                            // obj.txtProjDesc = resultEIS[0].ProjDesc
                            obj.Product.product = resultEIS[0].ProjName
                            obj.Product.standard = resultEIS[0].ProjStandard
                        }
                        else {
                            obj.Product.product = ""
                            obj.Product.standard = ""
                        }
                    }
                    else {
                        obj.Product.product = ""
                        obj.Product.standard = ""
                    }
                }

                let resultMasterAddr = await oLogicMasterAddr.SelectData_MasterAddr_byMasterRefId_type(getMasterLink[0].RecId, "L")
                if (resultMasterAddr) {
                    let CustID = resultMasterAddr[0].CustId
                    obj.Licencee.cust_id = CustID
                    obj.Licencee.addr_id = resultMasterAddr[0].AddrId
                    obj.Licencee.contact_id = resultMasterAddr[0].ContactID1
                    if (resultMasterAddr[0].ContactID2) {
                        obj.Licencee.man_contid2 = resultMasterAddr[0].ContactID2
                    }

                    let resultLicencee = await oLogicCustomer.SelectData_Cust_byCustID(CustID)
                    if (resultLicencee) {
                        if (obj.ViewState.Duplicate == 1 && libProdId > 0 && FileId > 0 && CustID > 0) {
                            console.log('libprodid:' + libProdId)
                            await DuplicateFunction(libProdId, FileId, CustID, obj)
                        }
                        obj.Licencee.comp_name = resultLicencee[0].CompName
                        obj.Licencee.business_reg = resultLicencee[0].CompRoc
                        let comp_type = resultLicencee[0].Type;
                        obj.Licencee.comp_type = sLoadCompType(comp_type)

                        obj.Licencee.OrgName = resultLicencee[0].OrgType

                    }

                    let resultManuAddr = await oLogicAddr.SelectData_Address_ByAddrID(resultMasterAddr[0].AddrId)
                    if (resultManuAddr) {
                        obj.Licencee.address1 = resultManuAddr[0].Address1
                        obj.Licencee.address2 = resultManuAddr[0].Address2
                        obj.Licencee.address3 = resultManuAddr[0].Address3
                        obj.Licencee.postcode = resultManuAddr[0].PostCode
                        let getLCity = await oLogicCity.SelectData_City_ByCityID(resultManuAddr[0].City)
                        obj.Licencee.city = getLCity[0].CityName
                        let getLState = await oLogicState.SelectData_State_ByStateId(resultManuAddr[0].StateCode)
                        obj.Licencee.state = getLState[0].StateName
                        let getLCountry = await oLogicCountry.SelectData_Country_byCountryID(resultManuAddr[0].CountryCode)
                        obj.Licencee.country = getLCountry[0].CountryName
                    }

                    if (resultMasterAddr[0].ContactID1) {
                        let resultManuContact = await oLogicContact.SelectData_Contact_byContactID(resultMasterAddr[0].ContactID1)
                        if (resultManuContact) {
                            obj.Licencee.contact_name = resultManuContact[0].ContactName
                            obj.Licencee.contact_mail = resultManuContact[0].EmailAddr
                            obj.Licencee.email = resultManuContact[0].EmailAddr

                            if (resultManuContact[0].OfficeNo) {
                                let MOfficeno = resultManuContact[0].OfficeNo
                                obj.Licencee.contact_phone = MOfficeno
                            }
                            if (resultManuContact[0].FaxNo) {
                                let MFaxno = resultManuContact[0].FaxNo
                                obj.Licencee.contact_fax = MFaxno
                            }
                            obj.Licencee.contact_position = resultManuContact[0].Designation
                        }
                    }

                    let resultMasterAddrManufacturer = await oLogicMasterAddr.SelectData_MasterAddr_byMasterRefId_type(getMasterLink[0].RecId, "M")
                    if (resultMasterAddrManufacturer) {
                        let MCustID = resultMasterAddrManufacturer[0].CustId
                        obj.Manufacturer.man_custid = MCustID
                        obj.Manufacturer.man_addrid = resultMasterAddrManufacturer[0].AddrId
                        obj.Manufacturer.man_contid = resultMasterAddrManufacturer[0].ContactID1
                        if (resultMasterAddrManufacturer[0].ContactID2) {
                            obj.Manufacturer.man_contid2 = resultMasterAddrManufacturer[0].ContactID2
                        }

                        let resultManufacturer = await oLogicCustomer.SelectData_Cust_byCustID(MCustID)
                        if (resultManufacturer) {
                            obj.Manufacturer.man_name = resultManufacturer[0].CompName
                            obj.Manufacturer.man_roc = resultManufacturer[0].CompRoc
                        }

                        let resultManuAddr = await oLogicAddr.SelectData_Address_ByAddrID(resultMasterAddrManufacturer[0].AddrId)
                        if (resultManuAddr) {
                            obj.Manufacturer.man_address_1 = resultManuAddr[0].Address1
                            obj.Manufacturer.man_address_2 = resultManuAddr[0].Address2
                            obj.Manufacturer.man_address_3 = resultManuAddr[0].Address3
                            obj.Manufacturer.man_postcode = resultManuAddr[0].PostCode
                            let getMCity = await oLogicCity.SelectData_City_ByCityID(resultManuAddr[0].City)
                            obj.Manufacturer.man_city = getMCity[0].CityName
                            let getMState = await oLogicState.SelectData_State_ByStateId(resultManuAddr[0].StateCode)
                            obj.Manufacturer.man_state = getMState[0].StateName
                            let MCountry = await oLogicCountry.SelectData_Country_byCountryID(resultManuAddr[0].CountryCode)
                            obj.Manufacturer.man_country = MCountry[0].CountryName
                        }

                        if (resultMasterAddrManufacturer[0].ContactID1) {
                            let resultManuContact = await oLogicContact.SelectData_Contact_byContactID(resultMasterAddrManufacturer[0].ContactID1)
                            if (resultManuContact) {
                                obj.Manufacturer.man_contact_name_1 = resultManuContact[0].ContactName
                                obj.Manufacturer.man_contact_mail_1 = resultManuContact[0].EmailAddr
                                if (resultManuContact[0].OfficeNo) {
                                    let MOfficeno = resultManuContact[0].OfficeNo
                                    obj.Manufacturer.man_contact_phone_1 = MOfficeno
                                }
                                if (resultManuContact[0].FaxNo) {
                                    let MFaxno = resultManuContact[0].FaxNo
                                    obj.Manufacturer.man_contact_fax_1 = MFaxno
                                }
                                obj.Manufacturer.man_contact_position_1 = resultManuContact[0].Designation
                            }
                            if (resultMasterAddrManufacturer[0].ContactID2 && resultMasterAddrManufacturer[0].ContactID2 != '0') {
                                obj.Manufacturer.man_contact_name_2 = resultManuContact[0].ContactName
                                obj.Manufacturer.man_contact_mail_2 = resultManuContact[0].EmailAddr
                                if (resultManuContact[0].OfficeNo) {
                                    let MOfficeno = resultManuContact[0].OfficeNo
                                    obj.Manufacturer.man_contact_phone_2 = MOfficeno
                                }
                                if (resultManuContact[0].FaxNo) {
                                    let MFaxno = resultManuContact[0].FaxNo
                                    obj.Manufacturer.man_contact_fax_2 = MFaxno
                                }
                                obj.Manufacturer.man_contact_position_2 = resultManuContact[0].Designation
                            }
                        }
                    }
                }



            }

            if (Id > 0) {
                let getPP2Info;
                if (obj.ViewState.Duplicate == 1) {
                    getPP2Info = await oLogicPP2.SelectAllPP2Form_Id(Id).catch((e) => { logger.logError(logger.thisLine2() + ': ' + `${e}`) });
                }
                else {
                    getPP2Info = await oLogicPP2.SelectPP2Form_FileId_Id(FileId, Id).catch((e) => { logger.logError(logger.thisLine2() + ': ' + `${e}`) });
                }
                if (getPP2Info != undefined && getPP2Info.length > 0) {
                    await sLoadDetails(getPP2Info[0], obj)
                }
            }

        }

        //license_no
        let resultCert = await oLogicCert.SelectData_Cert_byFileID(FileId).catch((e) => { logger.logError(logger.thisLine2() + ': ' + `${e}`) });
        if (resultCert) {
            obj.Application.license_no = resultCert[0].CertNo;
        }
        else {
            obj.Application.license_no = ""
        }


        if (obj.ViewState.Duplicate == 1) {
            obj.ViewState.pp2_status = 'New'
            obj.Application.ref_no = ''
        }

        if (obj.Showhide.btnAmend == true) {
            obj.Showhide.cancellation_remarks_boolean = true
        }
        if (obj.Showhide.btnCancel == true) {
            obj.Showhide.amend_remarks_boolean = true
        }

        let ctlAttachment = {
            AppId: Id > 0 && obj.ViewState.Duplicate == 0 ? Id : "0",
            AppTypeId: LOEnum.LOEnum["pp2Form"],
            EventId: 0,
            FileId: FileId || 0,
            JobId: JobId || 0,
            ModCode: "PP2",
            SysMod: await clsDMS.fSystemModule('PP2'),
            UserId: await getUser.GetUserID(LoginGUID),
            WfId: 0
        }
        obj.ctlAttachment = await ctlAttachment1.sShowAttachmentLink(ctlAttachment).catch((e) => { logger.logError(logger.thisLine2() + ': ' + `${e}`) })


        res.json(obj)
    } catch (err) {
        logger.logError(logger.thisLine2() + ': ' + `${err}`)
        console.log(err);
    }
}

async function sSaveComplete(TaskReceiver, obj, SucessfullySendToTMS = false) {
    try {
        if (SucessfullySendToTMS == true) {
            let msg = await clsGlobal.fSCISMessage(clsGlobal.SCISMessageType.UserDefined, "Application has been send to TMS").catch((e) => {
                console.log(e);
            });
            if (msg != null) {
                obj.message = msg;
                obj.status = true;
            }
        }
        else if (TaskReceiver == '' || TaskReceiver == null) {
            let msg = await clsGlobal.fSCISMessage(clsGlobal.SCISMessageType.SubmitSuccess).catch((e) => {
                console.log(e)
            })
            if (msg != null) {
                obj.message = msg;
                obj.status = true
            }
        }
        else {
            let msg = await clsGlobal.fSCISMessage(clsGlobal.SCISMessageType.UserDefined, "The task is successfully submitted to " + TaskReceiver).catch((e) => {
                console.log(e);
            });
            if (msg != null) {
                obj.message = msg;
                obj.status = true;
            }
        }
        return obj;

    } catch (err) {
        logger.logError(logger.thisLine2() + ': ' + `${err}`)
        console.log(err);
    }
}

async function sShowMsg(Msg) {
    try {
        let objMsj = {}
        let msg = ""
        msg = await clsGlobal.fSCISMessage(clsGlobal.SCISMessageType.UserDefined, Msg).catch((e) => {
            console.log(e)
        })

        if (msg == '') {
            objMsj.message = '';
            objMsj.status = true;
        }
        else {
            objMsj.message = msg;
            objMsj.status = false;
        }

        return objMsj;

    } catch (err) {
        logger.logError(logger.thisLine2() + ': ' + `${err}`)
        console.log(err);
    }
}

let chkAddAbv_CheckedChanged = async (req, res) => {
    try {
        let obj = {}
        obj.Manufacturer = {}
        let data = req.body
        let Licencee = req.body.Licencee
        if (data.Manufacturer && data.Manufacturer.chkAddAbv && data.Manufacturer.chkAddAbv.Checked && data.Licencee != undefined) {
            obj.Manufacturer = {
                man_roc: Licencee.business_reg,
                man_name: Licencee.comp_name,
                man_address_1: Licencee.address1,
                man_address_2: Licencee.address2,
                man_address_3: Licencee.address3,
                man_postcode: Licencee.postcode,
                man_city: Licencee.city,
                man_state: Licencee.state,
                man_country: Licencee.country,
                man_contact_name_1: Licencee.contact_name,
                man_contact_position_1: Licencee.contact_position,
                man_contact_phone_1: Licencee.contact_phone,
                man_contact_mail_1: Licencee.contact_mail,
                man_contact_fax_1: Licencee.contact_fax,
                man_custid: Licencee.cust_id,
                man_addrid: Licencee.addr_id,
                man_contid: Licencee.contact_id,
                man_contact_name_2: '',
                man_contact_position_2: '',
                man_contact_phone_2: '',
                man_contact_mail_2: '',
                man_contact_fax_2: '',
                chkAddAbv: {
                    Checked: true
                }
            }
        }

        res.json(obj)
    }
    catch (err) {
        logger.logError(logger.thisLineTryCatch(err) + ': ' + err)
        console.log(err)
    }
}

const btnSubmit = async (req, res) => {
    let obj = {}
    try {
        let UseTMSData = req.query.isUseTMSData || false;
        let data = req.body;
        let FileId = data.ViewState.FileId || 0;
        let Id = data.ViewState.id || ''
        let LoginGUID, intCurrentUserId;
        let TaskId = data.ViewState && data.ViewState.TaskId || '';
        let objRes = {}
        let Draft = req.query.Draft == 1 || req.query.Draft == '1' ? 1 : '';
        let Amend = req.query.Amend == 1 || req.query.Amend == '1' ? 1 : '';
        let Cancel = req.query.Cancel == 1 || req.query.Cancel == '1' ? 1 : '';
        let Submit = req.query.Submit == 1 || req.query.Submit == '1' ? 1 : '';
        let Duplicate = data.ViewState.Duplicate;
        let AttachmentInfo = [];
        let Taskname = '';

        if (data.ctlAttachment.AttachmentInfo !== undefined) {
            AttachmentInfo = data.ctlAttachment.AttachmentInfo
        }

        if (Submit !== undefined && Submit == 1) {
            Submit = 1
        }
        else {
            Submit = 0;
        }

        let getUserData;
        if (typeof req.query.LoginGUID != 'undefined') {
            LoginGUID = req.query.LoginGUID;
            getUserData = await getUser.GetUser_byLoginGUID(LoginGUID).catch(e => console.log(e))
            if (getUserData != null) {
                let sirimUsername = getUserData[0].UserName
                data.requested_by = sirimUsername
                intCurrentUserId = getUserData[0].UserId
            }
            else {
                res.status(200).send({ message: "Staff Not Exist!", status: false });
                return;
            }
        }
        else {
            res.status(200).send({ message: "Session Expired. Please re-login account.", status: false });
            return;
        }


        if (data.FileList != undefined && data.FileList.SelectedFileId != null && data.FileList.SelectedFileId != '' && Duplicate == 1 && data.FileList.SelectedFileId != FileId) {
            FileId = data.FileList.SelectedFileId
            data.ViewState.FileId = data.FileList.SelectedFileId
            data.Application.file_no = data.FileList.SelectedFileNo
            data.Showhide.amend_remark == ''
            data.Showhide.cancellation_remarks == ''
        }

        //check email same/not with file detail email
        if (data.Licencee.email != data.Licencee.contact_mail) {
            res.status(200).send({ message: "myTMS email is different with contact email!", status: false });
            return;
        }
        else {
            let LicenceeEmail = await CheckExistanceOfEmailInEscis(data.Licencee.cust_id, data.Licencee.email)
            let ManufacturerEmail = await CheckExistanceOfEmailInEscis(data.Manufacturer.man_custid, data.Licencee.email)
            if (LicenceeEmail == false && ManufacturerEmail == false) {
                res.status(200).send({ message: "Email not exist in escis. Please register at Customer Registration page!", status: false });
                return;
            }
        }


        objRes = DataMapping(data)

        //checking payment
        let payment = objRes.payment_id
        switch (payment) {
            case "Testing costs paid by Manufacturer":
                objRes.payment_id = 1;
                break;
            case "Subcontracting Test":
                objRes.payment_id = 2;
                break;
            case "Internal Billing":
                objRes.payment_id = 3;
                break;
            case "Testing costs paid by Applicant":
                objRes.payment_id = 4;
                break;
            default:
                objRes.payment_id = 0;
        }

        //comp_type
        objRes.comp_type = objRes.comp_type.comptype_value
        if (Amend == 1) {
            objRes.pp2_status = 'Amendment'
            if (data.Showhide && data.Showhide.amend_remark == '') {
                res.status(200).send({ message: "Please insert amendment remark!", status: false });
                return;
            }
        }
        else if (Cancel == 1) {
            objRes.pp2_status = 'Canceled'
            if (data.Showhide && data.Showhide.cancellation_remarks == '') {
                res.status(200).send({ message: "Please insert cancellation remark!", status: false });
                return;
            }
            else if (objRes.file_no == '' || objRes.file_no == undefined) {
                res.status(200).send({ message: 'Please provide file no!', status: false });
                return;
            }
        }
        else {
            objRes.pp2_status = 'Submitted'
        }

        if (FileId > 0) {
            let getFile = await oLogicFile.SelectFiledDataBy_FileID(FileId)
            if (getFile != null && getFile.length > 0) {
                let masterAddr = queryRepo.SelectData_MasterAddr_byMasterRefId_type(getFile[0].AppId, 'M', '1')
                if (masterAddr != null && masterAddr.length > 0) {
                    objRes.manufacturer_id = masterAddr[0].CustId
                }
            }
        }

        if (objRes.ref_no == undefined || objRes.ref_no == '') {
            Taskname = 'PP2 Form (Draft)'
            objRes.pp2_status = 'Draft'

        }
        else if (objRes.ref_no != '' && Draft == 1) {
            if (data.ViewState.pp2_status == 'Submitted') {
                Taskname = 'PP2 Form Submitted (Draft)'
                objRes.pp2_status = 'Submitted (Draft)'
            }
            else if (data.ViewState.pp2_status == 'Amendment') {
                Taskname = 'PP2 Form Amendment (Draft)'
                objRes.pp2_status = 'Amendment (Draft)'
            }
            else if (data.ViewState.pp2_status == 'Canceled' || data.ViewState.pp2_status == 'Rejected') {
                Taskname = 'PP2 Form Canceled (Draft)'
                objRes.pp2_status = 'Canceled (Draft)'
            }
        }

        if (Submit == '1' || Amend == '1' || Cancel == '1') {
            let ValidationMsg = await sValid(objRes)
            if (ValidationMsg != '') {
                res.status(200).send({ message: ValidationMsg, status: false });
                return;
            }

        }

        if (FileId > 0 && FileId != "" && Id > 0 && Id != "" && Duplicate == 0) {
            objRes.id = Id
            objRes.modifiedby = intCurrentUserId
            objRes.modifiedDate = Now
            if (Draft == 1) {
                // objRes.pp2_status = 'Draft'
                //only save data in our db without send to TMS
                await oLogicPP2.updatePP2FormById(objRes)
                if (TaskId != null && TaskId > 0) {
                    let getTask = await queryRepo.SelectData_TaskList_BytaskId(TaskId)
                    if (getTask != null && getTask.length > 0) {
                        Taskname = getTask[0].TaskName
                    }
                }
                await Task.InsertTask(Id, FileId, Taskname, intCurrentUserId, "", 0, 0, false, "1", "", TaskId, LoginGUID).catch(e => console.log(e))
                TaskReceiver = await getUser.GetUserName(intCurrentUserId).catch(e => console.log(e))
                await sSaveComplete(TaskReceiver, obj)

            }
            else {
                await oLogicPP2.updatePP2FormById(objRes)
                await sSaveComplete(null, obj)
            }
        }
        else {
            objRes.amend_remark = ''
            objRes.cancellation_remarks = ''
            objRes.created_by = intCurrentUserId
            objRes.created_on = Now
            if (Draft == 1) {
                // objRes.pp2_status = 'Draft'
                //only save data in our db without send to TMS
                if (objRes.to_section == '') {
                    objRes.to_section = null
                }
                let insertTbl = await oLogicPP2.InsertData_pp2Form(objRes)
                if (insertTbl.id > 0) {
                    objRes.id = insertTbl.id
                    if (TaskId != null && TaskId > 0) {
                        let getTask = await queryRepo.SelectData_TaskList_BytaskId(TaskId)
                        if (getTask != null && getTask.length > 0) {
                            Taskname = getTask[0].TaskName
                        }
                    }
                    await Task.InsertTask(insertTbl.id, FileId, Taskname, intCurrentUserId, "", 0, 0, false, "1", "", TaskId, LoginGUID).catch(e => console.log(e))
                    TaskReceiver = await getUser.GetUserName(intCurrentUserId).catch(e => console.log(e))
                    await sSaveComplete(TaskReceiver, obj)
                }
            }
            else {
                let insertTbl = await oLogicPP2.InsertData_pp2Form(objRes)
                if (insertTbl.id > 0) {
                    objRes.id = insertTbl.id
                    await sSaveComplete(null, obj)
                }

            }

        }

        if (Draft != 1) {
            if (Cancel == 1) {
                // body send to TMS
                let objTrans = {
                    file_no: objRes.file_no,
                    pp2_id: objRes.pp2_id,//5851 ,
                    cancellation_confirmation: 1,
                    cancellation_remarks: data.Showhide && data.Showhide.cancellation_remarks != '' ? data.Showhide.cancellation_remarks : '',
                    cancellation_by: data.requested_by,
                    method: 'post_pp2_cancellation'
                }

                await ctlAttachment1.sUpdateAttachment(objRes.id, FileId, 0, 0, AttachmentInfo).catch((e) => { logger.logError(logger.thisLine2() + ': ' + `${e}`) })
                objTrans.attachment = await GetAttachmentLink(objRes.id, FileId, 0, AttachmentInfo)

                let tempObj = {
                    postToTMS: objTrans,
                    url: `${apiURL}/pp2cancel?`,
                    params: '',
                    Module: 'PP2 - Cancellation',
                    ref_id: objRes.id
                }

                let postToTMS = await getAccess.postToTMS(tempObj, obj)
                if (postToTMS && postToTMS.response_code == 200) {
                    let objpp2Form = {
                        pp2_id: postToTMS.response && postToTMS.response.pp2_id,
                        ref_no: postToTMS.response && postToTMS.response.pp2_id,
                        pp2_status: postToTMS.response && postToTMS.response.pp2_status,
                        response: postToTMS.response && postToTMS.response.response,
                        response_code: postToTMS.response_code && postToTMS.response.response_code,
                        registration_id: postToTMS.registration_id && postToTMS.response.registration_id,
                        id: objRes.id
                    }
                    await oLogicPP2.updatePP2FormById(objpp2Form)

                    let objTMStrans = {
                        ref_id: objRes.id,
                        rec_id: postToTMS.response && postToTMS.response.rec_id
                    }
                    await transactionLogic.UpdateDataTMSTransALL(objTMStrans)
                    await sSaveComplete(null, obj, true)

                    let downloadPDFStatus = await getDocFromTMS(objpp2Form.pp2_id)
                }
                else {
                    let objpp2Form = {
                        pp2_status: 'Submitted',
                        response: postToTMS.response,
                        response_code: postToTMS.response_code,
                        id: objRes.id
                    }
                    await oLogicPP2.updatePP2FormById(objpp2Form)
                    let objTMStrans = {
                        ref_id: objRes.id,
                        rec_id: postToTMS.rec_id,
                        response_code: postToTMS.response_code,
                    }
                    await transactionLogic.UpdateDataTMSTransALL(objTMStrans)

                }
            }
            else { //amend or submit
                // body send to TMS
                let objTemp = Object.assign({}, objRes)

                let { crm_id, man_contid2, chkAddAbv, contact_id, user_id, FileId, Duplicate, source_pp2, pp2_status, user_type,
                    ManufacturerIsLicencee, created_by, created_on, man_contid, man_addrid, man_custid, id, ddlAddressType, ddlApplicant,
                    compType,
                    ...objTrans1 } = objTemp


                await CreateObjSendToTMS(objTrans1, UseTMSData)
                if (Amend == 1 && objRes.amend_remark != '' && Duplicate == 0) {
                    objTrans1.amend_remark = objRes.amend_remark
                }
                objTrans1.method = 'post_pp2_details'
                objTrans1.email = objRes.email//'khalid@webgeaz.com'
                objTrans1.requested_by = data.requested_by
                objTrans1.to_section = objRes.to_section
                objTrans1.requested_by_create = {
                    name: getUserData != null && getUserData.length > 0 ? getUserData[0].FullName : '',
                    section: getUserData != null && getUserData.length > 0 ? getUserData[0].Section : '',
                    designation: getUserData != null && getUserData.length > 0 ? getUserData[0].Designation : '',
                    employee_no: getUserData != null && getUserData.length > 0 ? getUserData[0].EmpNo : '',
                    mobile_no: getUserData != null && getUserData.length > 0 ? getUserData[0].MobileNo : '',
                    office_no: getUserData != null && getUserData.length > 0 ? getUserData[0].OfficeNo : '',
                }

                await ctlAttachment1.sUpdateAttachment(objRes.id, FileId, 0, 0, AttachmentInfo).catch((e) => { logger.logError(logger.thisLine2() + ': ' + `${e}`) })
                objTrans1.attachment = await GetAttachmentLink(objRes.id, FileId, 0, AttachmentInfo)

                let tempObj = {
                    postToTMS: objTrans1,
                    url: `${apiURL}/pp2`,
                    params: '',
                    Module: 'PP2 - Post Details',
                    ref_id: objRes.id
                }

                let postToTMS = await getAccess.postToTMS(tempObj, obj)
                if (postToTMS && postToTMS.response_code == 200) {
                    let objpp2Form = {
                        pp2_id: postToTMS.response && postToTMS.response.pp2_id,
                        ref_no: postToTMS.response && postToTMS.response.pp2_id,
                        pp2_status: postToTMS.response && postToTMS.response.pp2_status,
                        response: postToTMS.response && postToTMS.response.response,
                        response_code: postToTMS.response_code && postToTMS.response.response_code,
                        registration_id: postToTMS.response && postToTMS.response.registration_id && postToTMS.response.registration_id,
                        id: objRes.id
                    }
                    await oLogicPP2.updatePP2FormById(objpp2Form)

                    let objTMStrans = {
                        ref_id: objRes.id,
                        rec_id: postToTMS.response && postToTMS.response.rec_id
                    }
                    await transactionLogic.UpdateDataTMSTransALL(objTMStrans)

                    //update registrationid to tbl address
                    // if (objTemp.addr_id != '' && objTemp.addr_id != null) {
                    //     let objAddr = {
                    //         AddrId: objTemp.addr_id,
                    //         registration_id: postToTMS.response.registration_id
                    //     }
                    //     await oLogicAddr.UpdateDate_Address(objAddr)
                    // }

                    await sSaveComplete(null, obj, true)

                    // get pp2 doc from tms
                    let downloadPDFStatus = await getDocFromTMS(objpp2Form.pp2_id)
                }
                else {
                    // if (postToTMS && postToTMS.response_code == 500 && postToTMS.response != '') {
                    //     let msg = await clsGlobal.fSCISMessage(clsGlobal.SCISMessageType.UserDefined, postToTMS.response).catch((e) => {
                    //         console.log(e);
                    //     });
                    //     if (msg != null) {
                    //         obj.message = msg;
                    //         obj.status = true;
                    //     }
                    // }
                    let objpp2Form = {
                        pp2_status: 'Submitted',
                        response: postToTMS.response,
                        response_code: postToTMS.response_code,
                        id: objRes.id
                    }
                    await oLogicPP2.updatePP2FormById(objpp2Form)
                    let objTMStrans = {
                        ref_id: objRes.id,
                        rec_id: postToTMS.rec_id,
                        response_code: postToTMS.response_code,
                    }
                    await transactionLogic.UpdateDataTMSTransALL(objTMStrans)

                }

            }
        }
        else{ //draft
            await ctlAttachment1.sUpdateAttachment(objRes.id, FileId, 0, 0, AttachmentInfo).catch((e) => { logger.logError(logger.thisLine2() + ': ' + `${e}`) })
        }

        if (TaskId != '' && (Submit == 1 || Amend == 1 || Cancel == 1)) {
            await Task.UpdateTaskPreviousTask(TaskId, LoginGUID)
        }


        res.json(obj)
    } catch (err) {
        obj.status = false;
        obj.message = 'Failed to Save Information!';
        console.log(err)
        logger.logError(logger.thisLine2() + ': ' + `${err}`)
        obj.Error = err.message ? (err.message).substring(0, 200) : err.substring(0, 200)
        return res.json(obj)
    }
}

const btnSeacrhEmail = async (req, res) => {
    try {
        let obj = {}
        let resR = '';
        let Licencee = {};
        let APIresponse;
        let email = req.query.email
        let LcustId = req.query.LcustId
        let McustId = req.query.McustId

        if (email != '' && email != null) {

            if (email.includes("'")) //check if param includes single quotes
            {
                email = email.replace(/['"]/g, '')
            }

            if (typeof LcustId == 'undefined') {
                res.status(200).send({ message: "Please provide Licencee comp name!", status: false });
                return;
            }

            if (LcustId.includes("'")) {
                LcustId = LcustId.replace("'", "")
            }

            if (typeof McustId == 'undefined') {
                res.status(200).send({ message: "Please provide Manufacturer comp name!", status: false });
                return;
            }

            if (McustId.includes("'")) {
                McustId = McustId.replace("'", "")
            }

            //check existance of email to the company(Licencee & Manufacturer) in escis
            let LicenceeEmail = await CheckExistanceOfEmailInEscis(LcustId, email)
            let ManufacturerEmail = await CheckExistanceOfEmailInEscis(McustId, email)
            if (LicenceeEmail == false && ManufacturerEmail == false) {
                res.status(200).send({ message: "Email not exist in escis. Please register at Customer Registration page!", status: false });
                return;
            }

            let UserDetail = await getAccess.getCust(`${apiURL}/customer`, 'email=' + email, true);
            if (UserDetail != null && UserDetail.data && UserDetail.data.registration && UserDetail.rec_id) {
                let recid_transaction = UserDetail.rec_id
                APIresponse = UserDetail.data
                StoreDetails(APIresponse, recid_transaction)
                Licencee = JSON.parse(JSON.stringify(UserDetail.data.registration))
                Licencee = await Remap(Licencee)
                console.log(Licencee)
                resR = await sShowMsg('')

            }
            else if (UserDetail != null && UserDetail.data && UserDetail.data.error != null) {
                let res_json = {
                    response_code: 400,
                    response: UserDetail.data.error
                }
                await getAccess.insertTransaction('PP2Form - GetCustomerDetail', 'GET', UserDetail.Request_json, res_json, '', '3')
                resR = await sShowMsg(UserDetail.data.error)
            }
            else {
                resR = await sShowMsg('Error to connect!')
                let res_json = {
                    response_code: 500,
                    response: UserDetail.error
                }
                await getAccess.insertTransaction('PP2Form - GetCustomerDetail', 'GET', UserDetail.Request_json, res_json, '', '3')
            }

        }
        else {
            resR = await sShowMsg('Please insert Email!')
        }


        if (resR) {
            obj = {
                status: resR.status,
                message: resR.message,
                APIresponse: APIresponse,
                Licencee: Licencee != null ? Licencee : {},
            }
        }
        res.json(obj)
    }

    catch (err) {
        logger.logError(logger.thisLine2() + ': ' + `${err}`)
        console.log(err);
    }
}

let StoreDetails = async (data, transaction_recid) => {
    try {
        let datainsertCustHdr = {
            ...data,
            status: data.status.value,
            email: data.email.value
        }

        let insertCustHdr = await PP2CustomerDetails.InsertData_Customer_Hdr(datainsertCustHdr)

        if (insertCustHdr.id != '' && data.registration.length > 0) {
            let UserDetail = await getAccess.getCust(`${apiURL}/customer`, 'email=' + datainsertCustHdr.email, true, transaction_recid, insertCustHdr.id);
            data.registration.forEach(async obj => {
                let oDataCustDtl = {
                    ...obj,
                    comp_type: await MappingCompTypeTMS_ESCIS(obj.comp_type),
                    created_date: Now,
                    ref_id: insertCustHdr.id
                }
                let insertCustDetail = await PP2CustomerDetails.InsertData_Customer_Dtl(oDataCustDtl)
            })
        }

    }
    catch (err) {
        logger.logError(logger.thisLine2() + ': ' + `${err}`)
        console.log(err);
    }
}

function DataMapping(data) {
    let objRes = {}
    let Application = data.Application
    let Licencee = data.Licencee
    let Manufacturer = data.Manufacturer
    let Product = data.Product
    let ViewState = data.ViewState
    let Showhide = data.Showhide
    objRes = {
        ...Application,
        ...Licencee,
        ...Manufacturer,
        ...Product,
        ...ViewState,
        requested_by: data.requested_by != '' ? data.requested_by : '',
        user_type: Application.UsrType && Application.UsrType.SelectedValue != '' ? Application.UsrType.SelectedValue : '',
        to_section: Application.Section && Application.Section.section_to_selectedId != '' ? Application.Section.section_to_selectedId : '',
        payment_id: Application.Payment && Application.Payment.Payment_SelectedValue != '' ? Application.Payment.Payment_SelectedValue : '',
        ManufacturerIsLicencee: Manufacturer.chkAddAbv && Manufacturer.chkAddAbv.Checked == true ? '1' : '0',
        Manufacturer_clone: data.Manufacturer_clone ? data.Manufacturer_clone : undefined,
        Licencee_clone: data.Licencee_clone ? data.Licencee_clone : undefined,
        cancellation_remarks: Showhide.cancellation_remarks != '' ? Showhide.cancellation_remarks : '',
        amend_remark: Showhide.amend_remark != '' ? Showhide.amend_remark : ''
    }
    delete objRes['Section']
    delete objRes['UsrType']
    delete objRes['Payment']


    //   if(Manufacturer != undefined){
    //     objRes = Object.assign(Manufacturer)
    //    }
    //    if(Product!= undefined){
    //     objRes = Object.assign(Product)
    //    }

    console.log(objRes)
    return objRes;
}

async function Remap(data) {

    data = data.map(function (obj) {

        // Assign new key
        // if(obj.)
        obj.comp_type = sLoadCompType(obj.comp_type)

        obj['contact_name'] = obj['ctc_name'];
        obj['contact_fax'] = obj['ctc_fax_no'];
        obj['contact_phone'] = obj['ctc_office_no'];
        obj['contact_position'] = obj['ctc_designation'];
        obj['business_reg'] = obj['registration_no'];


        // Delete old key
        delete obj['ctc_name'];
        delete obj['ctc_office_no'];
        delete obj['ctc_designation'];
        delete obj['ctc_fax_no'];
        delete obj['registration_no'];

        return obj;
    });


    console.log(data);
    return data;


}

async function sLoadSection(Id = '') {
    try {
        let ddlSection1 = {
            ddlSection: [],
            section_to_selectedValue: '',
            section_to_selectedId: ''
        }
        ddlSection1.ddlSection = [
            {
                "Value": '139 - Mechanical & Automotive Section',
                "Id": 139
            },
            {
                "Value": '141 - Radio Frequency & Electromagnetic Compatibility Section',
                "Id": 141
            },
            {
                "Value": '142 - Electrical & Electronics 1 Section',
                "Id": 142
            },
            {
                "Value": '212 - Electrical & Electronics 2 Section',
                "Id": 212
            },
            {
                "Value": '143 - Civil & Construction Section',
                "Id": 143
            },

            {
                "Value": '144 - Fire Protection Section',
                "Id": 144
            },
            {
                "Value": '145 - Technical & Calibration Section',
                "Id": 145
            },
            {
                "Value": '213 - Technical Support Service (Electrical) Section',
                "Id": 213
            },
            {
                "Value": '147 - Penang Branch Office',
                "Id": 147
            },
            {
                "Value": '148 - Johor Branch Office',
                "Id": 148
            },
            {
                "Value": '149 - Sabah Branch Office',
                "Id": 149
            },

            {
                "Value": '150 - Sarawak Branch Office',
                "Id": 150
            },
            {
                "Value": '279 - Sales and Business Development (Testing) Section',
                "Id": 279
            },
            {
                "Value": '308 - Materials Integrity Section',
                "Id": 308
            },
            {
                "Value": '367 - Chemical, Polymer and Composite Section',
                "Id": 367
            }
        ];

        if (Id != '') {
            let result = ddlSection1.ddlSection.find(item => item.Id == Id)
            ddlSection1.section_to_selectedId = result.Id,
                ddlSection1.section_to_selectedValue = result.Value
        }

        return ddlSection1;
    }
    catch (err) {
        console.log(err);
    }
}


function sLoadCompType(CompType) {
    let objcomptype = {}


    //comptype_value (store in table)
    //comptype_text (display to UI)
    switch (CompType) {
        case 'L':
            objcomptype.comptype_text = 'Licencee';
            objcomptype.comptype_value = 'L';
            break;
        case 'M':
            objcomptype.comptype_text = 'Manufacturer';
            objcomptype.comptype_value = 'M';
            break;
        case 'F':
            objcomptype.comptype_text = 'Factory';
            objcomptype.comptype_value = 'F';
            break;
        case 'T':
            objcomptype.comptype_text = 'Trading';
            objcomptype.comptype_value = 'T';
            break;
        case 'B':
            objcomptype.comptype_text = 'Branch';
            objcomptype.comptype_value = 'B';
            break;
        case 'S':
            objcomptype.comptype_text = 'Site';
            objcomptype.comptype_value = 'S';
            break;
        case 'V':
            objcomptype.comptype_text = 'Service Facility';
            objcomptype.comptype_value = 'V';
            break;
        case 'W':
            objcomptype.comptype_text = 'Warehouse';
            objcomptype.comptype_value = 'W';
            break;
        case 'E':
            objcomptype.comptype_text = 'Employer';
            objcomptype.comptype_value = 'E';
            break;
        case 'A':
            objcomptype.comptype_text = 'Agent';
            objcomptype.comptype_value = 'A';
            break;
        case 'I':
            objcomptype.comptype_text = 'Individual';
            objcomptype.comptype_value = 'I';
            break;
        case 'Local Company':
        case '1':
            objcomptype.comptype_text = 'Local Company';
            objcomptype.comptype_value = 1;
            break;
        case 'Government':
        case '2':
            objcomptype.comptype_text = 'Government';
            objcomptype.comptype_value = 2;
            break;
        case 'Foreign Company':
        case '3':
            objcomptype.comptype_text = 'Foreign Company';
            objcomptype.comptype_value = 3;
            break;
        case 'Individual':
        case '4':
            objcomptype.comptype_text = 'Individual';
            objcomptype.comptype_value = 4;
            break;
        case 'Local Company - GLC':
        case '5':
            objcomptype.comptype_text = 'Local Company - GLC';
            objcomptype.comptype_value = 5;
            break;
        case 'Local Company - MNC':
        case '6':
            objcomptype.comptype_text = 'Local Company - MNC';
            objcomptype.comptype_value = 6;
            break;
        case 'Organization/Association':
        case '7':
            objcomptype.comptype_text = 'Organization/Association';
            objcomptype.comptype_value = 7;
            break;
        case 'Koperasi':
        case '8':
            objcomptype.comptype_text = 'Koperasi';
            objcomptype.comptype_value = 8;
            break;
        case 'Company Registered Under State Regency':
        case '9':
            objcomptype.comptype_text = 'Company Registered Under State Regency';
            objcomptype.comptype_value = 9;
            break;
        case 'Government':
        case '10':
            objcomptype.comptype_text = 'Professional and Technical Services';
            objcomptype.comptype_value = 10; break;
        case 'Local Company - SME':
        case '11':
            objcomptype.comptype_text = 'Local Company - SME';
            objcomptype.comptype_value = 11;
            break;


    }


    return objcomptype;
}

async function sLoadUserType(Id = '') {
    try {
        let objUsrType = {
            UserType: [],
            SelectedValue: '',
            SelectedId: ''
        }

        objUsrType.UserType = [
            {
                "Value": "PCID",
                "Id": "PCID"
            }
            // ,
            // {
            //     "Value": "Internal",
            //     "Id": "Internal"
            // }
        ]

        if (objUsrType.UserType.length == 1) {
            objUsrType.SelectedId = objUsrType.UserType[0].Id,
                objUsrType.SelectedValue = objUsrType.UserType[0].Value
        }
        else if (Id != '') {
            let result = objUsrType.UserType.find(item => item.Id == Id)
            objUsrType.SelectedId = result.Id,
                objUsrType.SelectedValue = result.Value
        }

        return objUsrType;
    }
    catch (err) {
        console.log(err);
    }
}

async function sLoadPayment(Id = '') {
    try {
        let objPayment = {
            ddlPayment: [
                {
                    "Id": "1",
                    "Value": "Testing costs paid by Manufacturer"
                },
                {
                    "Id": "2",
                    "Value": "Subcontracting Test"
                },
                {
                    "Id": "3",
                    "Value": "Internal Billing"
                },
                {
                    "Id": "4",
                    "Value": "Testing costs paid by Applicant"
                }
            ],
            Payment_SelectedValue: '',
            Payment_SelectedId: ''
        }

        if (Id != '') {
            let result = objPayment.ddlPayment.find(item => item.Id == Id)
            objPayment.Payment_SelectedId = result.Id
            objPayment.Payment_SelectedValue = result.Value
        }


        return objPayment;
    }
    catch (err) {
        console.log(err);
    }
}

const sLoadCountry = async (req, res) => {
    try {
        let obj = {}
        let Country = []
        let resultCountry = await oLogicCountry.SelectData_Country().catch((e) => { logger.logError(logger.thisLine2() + ': ' + `${e}`) })
        if (resultCountry != null) {
            resultCountry.filter(country => country.Status == '1')
            Country = resultCountry.map(val => {
                return {
                    value: val.CountryId,
                    label: val.CountryName
                }
            });
        }
        if (obj.Country == null) obj.Country = {}
        obj.Country = {
            ddlCountry: Country,
            SelectedValue: '',
            SelectedId: ''
        }

        if (req.body.Country && req.body.Country.SelectedId != undefined) {
            let State = []
            let StateResult = await oLogicState.SelectData_State_ByCounty_Id(req.body.Country.SelectedId).catch((e) => { console.log(e) });
            if (StateResult !== null) {
                StateResult = StateResult.filter(state => state.Status == '1')
                State = StateResult.map(val => {
                    return {
                        value: val.StateId,
                        label: val.StateName,
                    }
                });
            }
            if (obj.State == null) obj.State = {}
            obj.State = {
                ddlState: State,
                SelectedValue: '',
                SelectedId: '',
            }
        }

        if (req.body.State && req.body.State.SelectedId != undefined) {
            let resultcity = await oLogicCity.SelectData_City_byStateID(req.body.State.SelectedId).catch((e) => { logger.logError(logger.thisLine2() + ': ' + `${e}`) })
            if (resultcity) {
                resultcity = resultcity.filter(city => city.Status == '1' && city.CityName != '')
                City = resultcity.map(item => {
                    return {
                        value: item.RecId,
                        label: item.CityName,
                    }
                })
            }

            if (obj.City == null) obj.City = {}
            obj.City = {
                ddlCity: City,
                SelectedValue: '',
                SelectedId: '',
            }
        }



        res.json(obj)
    }
    catch (err) {
        logger.logError(logger.thisLineTryCatch(err) + ': ' + err)
        console.log(err)
    }
}

async function sLoadDetails(Dtl, obj) {
    try {
        if (Dtl != null) {

            //********************************APPLICATION TAB**************************************** */
            obj.Application = {
                ...obj.Application,
                file_no: Dtl.file_no != null && Dtl.file_no != '' ? Dtl.file_no : '',
                license_no: Dtl.license_no != null && Dtl.license_no != '' ? Dtl.license_no : '',
                treason_pre: Dtl.treason_pre != null && Dtl.treason_pre == 1 ? 1 : 0,
                treason_license: Dtl.treason_license != null && Dtl.treason_license == 1 ? 1 : 0,
                treason_scheme: Dtl.treason_scheme != null && Dtl.treason_scheme == 1 ? 1 : 0,
                treason_other: Dtl.treason_other != null && Dtl.treason_other == 1 ? 1 : 0,
                treason_others_specify: Dtl.treason_others_specify != null && Dtl.treason_others_specify != '' ? Dtl.treason_others_specify : '',
                test_full: Dtl.test_full != null && Dtl.test_full == 1 ? 1 : 0,
                test_partial: Dtl.test_partial != null && Dtl.test_partial == 1 ? 1 : 0,
                test_confirm: Dtl.test_confirm != null && Dtl.test_confirm == 1 ? 1 : 0,
                test_others: Dtl.test_others != null && Dtl.test_others == 1 ? 1 : 0,
                test_others_specify: Dtl.test_others_specify != null && Dtl.test_others_specify != '' ? Dtl.test_others_specify : '',
                sampling_date: Dtl.sampling_date != null && Dtl.sampling_date != '' ? moment(Dtl.sampling_date).utc().format('YYYY-MM-DD') : null,
                ref_no: obj.ViewState.Duplicate == 0 && Dtl.pp2_id != null && Dtl.pp2_id != '' ? Dtl.pp2_id : '',
            }

            if (Dtl.pp2_id != '' && Dtl.pp2_id != null && Dtl.pp2_id != 0 && Dtl.pp2_id != '0' && obj.ViewState.Duplicate == 0) {
                obj.Showhide.btnSubmit = false;
            }

            //Section
            if (Dtl.to_section != null) {
                obj.Application.Section = await sLoadSection(Dtl.to_section)
            }

            //userType
            if (Dtl.user_type != null && Dtl.user_type != '') {
                obj.Application.UsrType = await sLoadUserType(Dtl.user_type)
            }

            //payment
            if (Dtl.payment_id != null && Dtl.payment_id != "") {
                obj.Application.Payment = await sLoadPayment(Dtl.payment_id)
            }

            //********************************PRODUCT TAB**************************************** */
            obj.Product = {
                ...obj.Product,
                product: Dtl.product != null && Dtl.product != '' ? Dtl.product : '',
                brand: Dtl.brand != null && Dtl.brand != '' ? Dtl.brand : '',
                type: Dtl.type != null && Dtl.type != '' ? Dtl.type : '',
                model: Dtl.model != null && Dtl.model != '' ? Dtl.model : '',
                rating: Dtl.rating != null && Dtl.rating != '' ? Dtl.rating : '',
                size: Dtl.size != null && Dtl.size != '' ? Dtl.size : '',
                standard: Dtl.standard != null && Dtl.standard != '' ? Dtl.standard : '',
                clause_test: Dtl.clause_test != null && Dtl.clause_test != '' ? Dtl.clause_test : '',
                remark: Dtl.remark != null && Dtl.remark != '' ? Dtl.remark : '',
                product_desc: Dtl.product_desc != null && Dtl.product_desc != '' ? Dtl.product_desc : '',
                other_tr: Dtl.other_tr != null && Dtl.other_tr != '' ? Dtl.other_tr : '',
                sirim_label_no: Dtl.sirim_label_no != null && Dtl.sirim_label_no != '' ? Dtl.sirim_label_no : '',
                conformity_statement: Dtl.conformity_statement != null && Dtl.conformity_statement != '' ? Dtl.conformity_statement : 1,
                sample_qty: Dtl.sample_qty != null && Dtl.sample_qty != '' ? Dtl.sample_qty : '',
            }

            //********************************LICENCEE TAB**************************************** */
            obj.Licencee = {
                ...obj.Licencee,
                email: Dtl.email != null && Dtl.email != '' ? Dtl.email : '',
                comp_name: Dtl.comp_name != null && Dtl.comp_name != '' ? Dtl.comp_name : '',
                business_reg: Dtl.business_reg != null && Dtl.business_reg != '' ? Dtl.business_reg : '',
                comp_type: Dtl.comp_type != null && Dtl.comp_type != '' ? Dtl.comp_type : '',
                address1: Dtl.address1 != null && Dtl.address1 != '' ? Dtl.address1 : '',
                address2: Dtl.address2 != null && Dtl.address2 != '' ? Dtl.address2 : '',
                address3: Dtl.address3 != null && Dtl.address3 != '' ? Dtl.address3 : '',
                postcode: Dtl.postcode != null && Dtl.postcode != '' ? Dtl.postcode : '',
                state: Dtl.state != null && Dtl.state != '' ? Dtl.state : '',
                city: Dtl.city != null && Dtl.city != '' ? Dtl.city : '',
                country: Dtl.country != null && Dtl.country != '' ? Dtl.country : '',
                contact_name: Dtl.contact_name != null && Dtl.contact_name != '' ? Dtl.contact_name : '',
                contact_position: Dtl.contact_position != null && Dtl.contact_position != '' ? Dtl.contact_position : '',
                contact_phone: Dtl.contact_phone != null && Dtl.contact_phone != '' ? Dtl.contact_phone : '',
                contact_fax: Dtl.contact_fax != null && Dtl.contact_fax != '' ? Dtl.contact_fax : '',
                contact_mail: Dtl.contact_mail != null && Dtl.contact_mail != '' ? Dtl.contact_mail : '',
                contact_id: Dtl.contact_id != null && Dtl.contact_id != '' ? Dtl.contact_id : '',
                user_id: Dtl.user_id != null && Dtl.user_id != '' ? Dtl.user_id : '',
                registration_id: Dtl.registration_id != null && Dtl.registration_id != '' ? Dtl.registration_id : '',
                crm_id: Dtl.crm_id != null && Dtl.crm_id != '' ? Dtl.crm_id : '',
                addr_id: Dtl.addr_id != null && Dtl.addr_id != '' ? Dtl.addr_id : '',
                cust_id: Dtl.cust_id != null && Dtl.cust_id != '' ? Dtl.cust_id : '',
                comp_type: Dtl.comp_type != null && Dtl.comp_type != '' ? Dtl.comp_type : ''
            }


            //********************************MANUFACTURER TAB**************************************** */
            obj.Manufacturer = {
                ...obj.Manufacturer,
                man_roc: Dtl.man_roc != null && Dtl.man_roc != '' ? Dtl.man_roc : '',
                man_name: Dtl.man_name != null && Dtl.man_name != '' ? Dtl.man_name : '',
                man_address_1: Dtl.man_address_1 != null && Dtl.man_address_1 != '' ? Dtl.man_address_1 : '',
                man_address_2: Dtl.man_address_2 != null && Dtl.man_address_2 != '' ? Dtl.man_address_2 : '',
                man_address_3: Dtl.man_address_3 != null && Dtl.man_address_3 != '' ? Dtl.man_address_3 : '',
                man_postcode: Dtl.man_postcode != null && Dtl.man_postcode != '' ? Dtl.man_postcode : '',
                man_city: Dtl.man_city != null && Dtl.man_city != '' ? Dtl.man_city : '',
                man_state: Dtl.man_state != null && Dtl.man_state != '' ? Dtl.man_state : '',
                man_country: Dtl.man_country != null && Dtl.man_country != '' ? Dtl.man_country : '',
                man_contact_name_1: Dtl.man_contact_name_1 != null && Dtl.man_contact_name_1 != '' ? Dtl.man_contact_name_1 : '',
                man_contact_position_1: Dtl.man_contact_position_1 != null && Dtl.man_contact_position_1 != '' ? Dtl.man_contact_position_1 : '',
                man_contact_phone_1: Dtl.man_contact_phone_1 != null && Dtl.man_contact_phone_1 != '' ? Dtl.man_contact_phone_1 : '',
                man_contact_mail_1: Dtl.man_contact_mail_1 != null && Dtl.man_contact_mail_1 != '' ? Dtl.man_contact_mail_1 : '',
                man_contact_fax_1: Dtl.man_contact_fax_1 != null && Dtl.man_contact_fax_1 != '' ? Dtl.man_contact_fax_1 : '',
                man_contact_name_2: Dtl.man_contact_name_2 != null && Dtl.man_contact_name_2 != '' ? Dtl.man_contact_name_2 : '',
                man_contact_position_2: Dtl.man_contact_position_2 != null && Dtl.man_contact_position_2 != '' ? Dtl.man_contact_position_2 : '',
                man_contact_phone_2: Dtl.man_contact_phone_2 != null && Dtl.man_contact_phone_2 != '' ? Dtl.man_contact_phone_2 : '',
                man_contact_mail_2: Dtl.man_contact_mail_2 != null && Dtl.man_contact_mail_2 != '' ? Dtl.man_contact_mail_2 : '',
                man_contact_fax_2: Dtl.man_contact_fax_2 != null && Dtl.man_contact_fax_2 != '' ? Dtl.man_contact_fax_2 : '',
                man_custid: Dtl.man_custid != null && Dtl.man_custid != '' ? Dtl.man_custid : '',
                man_addrid: Dtl.man_addrid != null && Dtl.man_addrid != '' ? Dtl.man_addrid : '',
                man_contid: Dtl.man_contid != null && Dtl.man_contid != '' ? Dtl.man_contid : '',
                man_contid2: Dtl.man_contid2 != null && Dtl.man_contid2 != '' ? Dtl.man_contid2 : ''
            }

            if (Dtl.ManufacturerIsLicencee == '1') {
                obj.Manufacturer.chkAddAbv.Checked = true
            }
            else {
                obj.Manufacturer.chkAddAbv.Checked = false
            }

            /********************************VIEWSTATE TAB**************************************** */
            if (obj.ViewState.Duplicate == 0) {
                obj.ViewState.FileId = Dtl.FileId != null && Dtl.FileId != '' ? Dtl.FileId : ''
            }
            obj.ViewState.source_pp2 = Dtl.source_pp2 != null && Dtl.source_pp2 != '' ? Dtl.source_pp2 : ''
            // if(Dtl.pp2_status.includes('Draft') == false || Dtl.pp2_status == 'Canceled (Draft)' ){
            obj.ViewState.pp2_status = Dtl.pp2_status != null && Dtl.pp2_status != '' ? Dtl.pp2_status : ''

            if (obj.ViewState.pp2_status.toUpperCase().includes('JOB GENERATED')) //end of process PP2
            {
                obj.Showhide.btnAmend = false;
                obj.Showhide.btnCancel = false;
                obj.Showhide.btnSubmit = false;
                obj.Showhide.btnDraft = false;
            }
            // }
            obj.ViewState.pp2_id = obj.ViewState.Duplicate == 0 && Dtl.pp2_id != null && Dtl.pp2_id != '' ? Dtl.pp2_id : ''


            obj.Showhide.cancellation_remarks = Dtl.cancellation_remarks != null && Dtl.cancellation_remarks != '' ? Dtl.cancellation_remarks : ''
            obj.Showhide.amend_remark = Dtl.amend_remark != null && Dtl.amend_remark != '' ? Dtl.amend_remark : ''

            obj.Licencee.comp_type = sLoadCompType(Dtl.comp_type)

            let CheckData = /[1-9]/i.test(Dtl.comp_type) //if comptype int, comptype from TMS, alphabet from ESCIS
            if (CheckData == true) {
                obj.isUseTMSData = true
            }
            console.log(obj)

        }

    } catch (err) {
        logger.logError(logger.thisLine2() + ': ' + `${err}`)
        console.log(err);
    }
}

async function checkPP2Status(FileId, Id, obj) {
    try {
        let getPP2Info = await oLogicPP2.SelectPP2Form_FileId_Id(FileId, Id).catch((e) => { logger.logError(logger.thisLine2() + ': ' + `${e}`) });
        if (getPP2Info != undefined && getPP2Info.length > 0) {
            let pp2_id = getPP2Info[0].pp2_id
            let fileno = getPP2Info[0].file_no
            if (pp2_id != null && pp2_id != '') {
                let checkJobCreated = await TMSQuotationDtl.SelectExistedJobForPP2(fileno, pp2_id)
                if (checkJobCreated != null) { //job already created
                    obj.Showhide = {
                        btnDraft: false,
                        btnSubmit: false,
                        btnCancel: false,
                        btnAmend: false,
                    }
                }
                else {
                    if (obj.ViewState.Listing == 1 && obj.ViewState.AllowEdit == 1) { //can amend or cancel only through listing
                        obj.Showhide.btnAmend = true
                        obj.Showhide.btnCancel = true
                    }
                    else if (obj.ViewState.FileDetail == 1) {
                        obj.Showhide.btnSubmit = false
                        obj.Showhide.btnDraft = false
                    }

                }
            }


        }
        return obj;
    } catch (err) {
        logger.logError(logger.thisLine2() + ': ' + `${err}`)
        console.log(err);
    }
}

async function DuplicateFunction(LibProdId, FileId = '', CustId = '', obj) {
    try {
        //Load FileNo that has same product
        let ddlFile = []
        let FileList = {
            ddlFile: [],
            SelectedFileId: '',
            SelectedFileNo: ''
        }

        let getFileListing = await oLogicPP2.SelectApplicant_SameProduct(LibProdId, CustId)
        if (getFileListing != null && getFileListing.length > 0) {
            ddlFile = getFileListing.map(val => {
                return {
                    FileId: val.FILEID,
                    FileNo: val.FILENO
                }
            });
        }

        FileList.ddlFile = ddlFile

        if (FileId != '') {
            let result = ddlFile.find(item => item.FileId == FileId)
            FileList.SelectedFileId = result.FileId,
                FileList.SelectedFileNo = result.FileNo
            obj.ViewState.FileId = FileList.SelectedFileId
        }


        obj.FileList = FileList;



    } catch (err) {
        logger.logError(logger.thisLine2() + ': ' + `${err}`)
        console.log(err);
    }
}

async function CreateObjSendToTMS(objRes, UseTMSData) {
    if (objRes != null) {
        objRes.manufacturer = {
            roc: objRes.man_roc,
            name: objRes.man_name,
            address_1: objRes.man_address_1,
            address_2: objRes.man_address_2,
            address_3: objRes.man_address_3,
            postcode: objRes.man_postcode,
            city: objRes.man_city,
            state: objRes.man_state,
            country: objRes.man_country,
            contact_name_1: objRes.man_contact_name_1,
            contact_position_1: objRes.man_contact_position_1,
            contact_phone_1: objRes.man_contact_phone_1,
            contact_mail_1: objRes.man_contact_mail_1,
            contact_fax_1: objRes.man_contact_fax_1,
            contact_name_2: objRes.man_contact_name_2,
            contact_position_2: objRes.man_contact_position_2,
            contact_phone_2: objRes.man_contact_phone_2,
            contact_mail_2: objRes.man_contact_mail_2,
            contact_fax_2: objRes.man_contact_fax_2,

        }
        // let getAdress = await oLogicAddr.SelectData_Address_ByAddrID(objRes.addr_id)
        // if (getAdress != null && getAdress.length > 0 && getAdress[0].registration_id !== null) {
        //     registration_id = getAdress[0].registration_id
        //     objRes.registration_id = getAdress[0].registration_id

        let registration_id;
        let CountCompRoc = 1;
        let OldCompRoc = '';
        let getCompRoc = await oLogicCustomer.SelectData_Cust_byCustID(objRes.cust_id)
        if (getCompRoc != null && getCompRoc.length > 0 && getCompRoc[0].CompRoc_old != null) {
            CountCompRoc = 2
            OldCompRoc = getCompRoc[0].CompRoc_old
        }

        let UserDetail = await getAccess.getCust(`${apiURL}/customer`, 'email=' + objRes.email, true);
        if (UserDetail != null && UserDetail.data && UserDetail.data.registration && UserDetail.rec_id) {
            if (CountCompRoc == 2) {
                UserDetail.data.registration = UserDetail.data.registration.filter(item => (item.registration_no == objRes.business_reg || item.registration_no == OldCompRoc) && item.address1 == objRes.address1 && item.address2 == objRes.address2 && item.address3 == objRes.address3)
            }
            else {
                UserDetail.data.registration = UserDetail.data.registration.filter(item => item.registration_no == objRes.business_reg && item.address1 == objRes.address1 && item.address2 == objRes.address2 && item.address3 == objRes.address3)
            }
            if (UserDetail.data.registration.length > 0) {
                registration_id = UserDetail.data.registration[0].registration_id
                objRes.registration_id = UserDetail.data.registration[0].registration_id
            }
        }


        if (UseTMSData == 'true' || (objRes.registration_id != undefined && objRes.registration_id != '')) { //use data from TMS
            objRes.applicant = {
                registration_id: objRes.registration_id
            }

        }
        else {//use data from ESCIS
            //get registrationid from tbl address

            let compType;
            let CheckData = /[1-9]/i.test(objRes.comp_type) //if comptype int, comptype from TMS, alphabet from ESCIS
            if (CheckData == false) {
                compType = await MappingCompTypeTMS_ESCIS(objRes.OrgName)
            }
            objRes.applicant = {
                registration_id: registration_id != null && registration_id != '' ? registration_id : null,
                comp_type: compType,//default,
                registration_no: objRes.business_reg,
                comp_name: objRes.comp_name,
                address1: objRes.address1,
                address2: objRes.address2,
                address3: objRes.address3,
                postcode: objRes.postcode,
                city: objRes.city,
                state: objRes.state,
                country: objRes.country,
                ctc_name: objRes.contact_name,
                ctc_designation: objRes.contact_position,
                ctc_office_no: objRes.contact_phone,
                ctc_fax_no: objRes.contact_fax,
                // comp_name,business_reg, address1, address2, address3, postcode, state, city, country, contact_name
            }
        }
        delete objRes['registration_id']
        delete objRes['comp_type']
        delete objRes['OrgName']
        // delete objRes['business_reg']
        delete objRes['comp_name']
        delete objRes['address1']
        delete objRes['address2']
        delete objRes['address3']
        delete objRes['postcode']
        delete objRes['city']
        delete objRes['state']
        delete objRes['country']
        delete objRes['contact_name']
        delete objRes['contact_phone']
        delete objRes['contact_fax']
        delete objRes['contact_position']
        delete objRes['contact_mail']
        delete objRes['cust_id']

        delete objRes['Manufacturer_clone']
        delete objRes['TaskId']
        delete objRes['man_roc']
        delete objRes['man_name']
        delete objRes['man_address_1']
        delete objRes['man_address_2']
        delete objRes['man_address_3']
        delete objRes['man_city']
        delete objRes['man_contact_fax_1']
        delete objRes['man_state']
        delete objRes['man_postcode']
        delete objRes['man_country']
        delete objRes['man_contact_fax_2']
        delete objRes['man_contact_mail_1']
        delete objRes['man_contact_mail_2']
        delete objRes['man_contact_name_1']
        delete objRes['man_contact_name_2']
        delete objRes['man_contact_position_1']
        delete objRes['Manufacturer_clone']
        delete objRes['man_contact_position_2']
        delete objRes['man_contact_phone_1']
        delete objRes['man_contact_phone_2']
        delete objRes['addr_id']
        delete objRes['AllowEdit']
        delete objRes['Listing']
        delete objRes['Licencee_clone']

        return objRes;
    }
}

async function sValid(objRes) {
    let msg = ''
    if (objRes != null) {
        if (objRes.email == '' || objRes.email == undefined) {
            msg = 'Please provide email!'
        }
        else if (objRes.to_section == '' || objRes.to_section == undefined) {
            msg = 'Please select section!'
        }
        if (objRes.file_no == '' || objRes.file_no == undefined) {
            msg = 'Please provide file no!'
        }
        else if (objRes.product == '' || objRes.product == undefined) {
            msg = 'Please select product!'
        }
        else if (objRes.comp_name == '' || objRes.comp_name == undefined) {
            msg = 'Please select Applicant!'
        }
        else if (objRes.man_name == '' || objRes.man_name == undefined) {
            msg = 'Please select Manufacture!'
        }
        else if (objRes.user_type == '' || objRes.user_type == undefined) {
            msg = 'Please select user type!'
        }
        else if (objRes.test_others == 1 && objRes.test_others_specify == '') {
            msg = 'Please specify the type of test for others!'
        }
        else if (objRes.treason_other == 1 && objRes.treason_others_specify == '') {
            msg = 'Please justify the reason of testing for others!'
        }
        else if (objRes.email == '') {
            msg = 'Please provide Email ID myTMS!'
        }
        else if (objRes.payment_id == 0) {
            msg = 'Please select payment type!'
        }

    }
    return msg;
}


async function MappingCompTypeTMS_ESCIS(OrgName) {
    let compTypeTMS;
    if (OrgName != '') {
        if (OrgName.includes('ASSOC')) {
            compTypeTMS = 7
        }
        else if (OrgName.includes('ENT')) {
            compTypeTMS = 0
        }
        else if (OrgName.includes('GOV')) {
            compTypeTMS = 2
        }
        else if (OrgName.includes('IND')) {
            compTypeTMS = 4
        }
        else if (OrgName.includes('INT')) {
            compTypeTMS = 3
        }
        else if (OrgName.includes('SSC')) {
            compTypeTMS = 9
        }
        else if (OrgName.includes('SME')) {
            compTypeTMS = 11
        }

    }
    return compTypeTMS;
}


// function ConvertToString(data)
// {
//     if(data!=null && data!= undefined){
//         Object.keys(data).forEach((item) => {
//         if(typeof data[item] == "number" ) {
//                 data[item] = data[item].toString()
//          }
//         })
//     }

//     return data;
// }

// function dataPostDetail(data){
//     let objPostDtl={
//         "to_section":data.to_section,
//         "email":data.email,
//         // "registration_id":data.registration_id,
//         "file_no":data.file_no,
//         // "pp2_id":data.pp2_id,
//         "requested_by":data.requested_by,

//         "license_no":data.license_no,
//         "ref_no":data.ref_no,
//         "payment_id":data.payment_id,
//         "sample_qty":data.sample_qty,
//         "sampling_date":data.sampling_date,
//         "treason_pre":data.treason_pre,

//         "treason_license":data.treason_license,
//         "treason_scheme":data.treason_scheme,
//         "treason_other":data.treason_other,
//         "treason_others_specify":data.treason_others_specify,
//         "test_partial":data.test_partial,
//         "test_confirm":data.test_confirm,

//         "test_others":data.test_others,
//         "test_others_specify":data.test_others_specify,
//         "business_reg":data.business_reg,
//         "comp_name":data.comp_name,
//         "address1":data.address1,
//         "address2":data.address2,

//         "address3":data.address3,
//         "city":data.city,
//         "state":data.state,
//         "country":data.country,
//         "contact_name":data.contact_name,
//         "contact_position":data.contact_position,

//         "contact_phone":data.contact_phone,
//         "contact_fax":data.contact_fax,
//         "product":data.product,
//         "brand":data.brand,
//         "type":data.type,
//         "model":data.model,

//         "rating":data.rating,
//         "size":data.size,
//         "standard":data.standard,
//         "clause_test":data.clause_test,
//         "remark":data.remark,
//         "product_desc":data.product_desc,

//         "man_roc":data.man_roc,
//         "man_name":data.man_name,
//         "man_address_1":data.man_address_1,
//         "man_address_2":data.man_address_2,
//         "man_address_3":data.man_address_3,
//         "man_postcode":data.man_postcode,

//         "man_city":data.man_city,
//         "man_state":data.man_state,
//         "man_country":data.man_country,
//         "man_contact_name_1":data.man_contact_name_1,
//         "man_contact_position_1":data.man_contact_position_1,
//         "man_contact_phone_1":data.man_contact_phone_1,

//         "man_contact_mail_1":data.man_contact_mail_1,
//         "man_contact_fax_1":data.man_contact_fax_1,
//         "man_contact_name_2":data.man_contact_name_2,
//         "man_contact_position_2":data.man_contact_position_2,
//         "man_contact_phone_2":data.man_contact_phone_2,
//         "man_contact_mail_2":data.man_contact_mail_2,

//         "man_contact_fax_2":data.man_contact_fax_2,


//     }
//     return objPostDtl;
// }

async function GetAttachmentLink(AppId = 0, FileId = 0, WfId = 0, AttachmentInfo) {
    let ctlAttachment = {
        AppId: AppId,
        AppTypeId: AttachmentInfo.AppTypeId,
        EventId: AttachmentInfo.EventId,
        FileId: FileId,
        JobId: AttachmentInfo.JobId,
        ModCode: AttachmentInfo.ModCode,
        SysMod: AttachmentInfo.SysMod,
        UserId: AttachmentInfo.UserId,
        WfId: WfId
    }

    let AttachmentLink = []

    let ctlAttachmentlist = await ctlAttachment1.sShowAttachmentLink(ctlAttachment)
    if (ctlAttachmentlist && ctlAttachmentlist.gvSCISRecord && ctlAttachmentlist.gvSCISRecord.length > 0) {
        let filteredRecords = ctlAttachmentlist.gvSCISRecord.filter(record => !record.DocType.toUpperCase().includes('TMS QUOTATION') && !record.DocType.toUpperCase().includes('TMS TEST REPORT') );
        for (let item of filteredRecords) {
            let data = {
                id: ctlAttachment.AppId,
                FileId: ctlAttachment.FileId,
                AttId: item.AttId,
                FileName: item.FileName
            }
            let encdata = utils.encrypt(JSON.stringify(data))
            let url = utils.getHostNameAPI()

            AttachmentLink.push({ AttachmentLink: `${url.hostURL}${url.portURL}/api/PP2/Download?enc=${encdata.encryptedData}&iv=${encdata.iv}`, FileName: item.FileName })

        }
    }

    return AttachmentLink
}

async function CheckExistanceOfEmailInEscis(custid, TMSemail) {
    let resultCust = await oLogicContact.SelectData_Contact_byCustID(custid)
    if (resultCust != null && resultCust.length > 0) {
        // function emailExists(TMSemail) {
        //     return resultSirimUser.some(function (el) {
        //         return el.EmailAddr == TMSemail
        //     })
        // }

        for (let i = 0; i < resultCust.length; i++) {
            if (resultCust[i].EmailAddr == TMSemail) { return true; }
        }
        return false;

    }
    else {
        return false;
    }
}


let UpdatePP2Status = async (req, res) => {
    // save request to transaction table
    let transId = await TMSTrans.InsertTransaction('TMS Update PP2 Status', req)

    let response = {}
    try {
        let file_no = req.body.file_no
        let pp2_id = req.body.pp2_id
        let pp2_status = req.body.pp2_status

        if (utils.checkField(file_no) == false) {
            response = { response_code: 400, response: 'Failed to insert data', error: 'File Number cannot be empty' }
            await TMSTrans.UpdateTransaction(transId, response, '3')
            return res.json(response)
        }
        if (utils.checkField(pp2_id) == false) {
            response = { response_code: 400, response: 'Failed to insert data', error: 'PP2 Id cannot be empty' }
            await TMSTrans.UpdateTransaction(transId, response, '3')
            return res.json(response)
        }
        if (utils.checkField(pp2_status) == false) {
            response = { response_code: 400, response: 'Failed to insert data', error: 'PP2 Status cannot be empty' }
            await TMSTrans.UpdateTransaction(transId, response, '3')
            return res.json(response)
        }

        if (!await checkPP2Form(file_no, pp2_id)) {
            response = { response_code: 400, response: 'Failed to insert data', error: `PP2 record not exist for ${file_no} with PP2 ID: ${pp2_id}` }
            await TMSTrans.UpdateTransaction(transId, response, '3')
            return res.json(response)
        }

        let getUpdateData = await UpdatePP2Form(file_no, pp2_id, pp2_status)
        if (getUpdateData == true) {
            response = {
                response_code: 200,
                response: 'Successful update PP2 status',
                error: ''
            }
            let downloadPDFStatus = await getDocFromTMS(pp2_id)
        }
        else {
            response = {
                response_code: 500,
                response: 'Failed to update PP2 status',
                error: ''
            }
        }

        // update to tms trans
        await TMSTrans.UpdateTransaction(transId, response, '1')

        return res.json(response)
    }
    catch (err) {
        // loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
        console.log(err);
        response = {
            response_code: 500,
            response: 'Failed to insert data',
            error: err.message
        }
        // update to tms trans
        await TMSTrans.UpdateTransaction(transId, response, '3')

        return res.json(response)
    }
}

async function UpdatePP2Form(file_no, pp2_id, pp2_status) {
    let resPP2Form = await pp2Logic.SelectPP2Form_byFileNoANDPP2Id(file_no, pp2_id)
    if (resPP2Form && resPP2Form.length > 0) {
        let oDataPP2 = {
            id: resPP2Form[0].id,
            pp2_status
        }
        let UpdStatus = await oLogicPP2.updatePP2FormById(oDataPP2)
        if (UpdStatus == true) return true;
    }
    else
        return false;
}

async function checkPP2Form(file_no, pp2_id) {
    let resPP2 = await pp2Logic.SelectPP2Form_byFileNoANDPP2Id(file_no, pp2_id)
    return resPP2 && resPP2.length > 0 ? true : false
}

async function getDocFromTMS(doc_no, LoginGUID) {
    // doc_type: 1 = PP2, job_type: 1 = PP2
    try {
        return await TMSFileDoc.ExportToAttachmentDocTMS(doc_no, 1, 1, LoginGUID)
    }
    catch (err) {
        logger.logError(logger.thisLineTryCatch(err) + ': ' + err)
        console.log(err);
        return {
            status: false,
            message: err.message || err
        }
    }
}

let TestGetAttchmentLink = async (req, res) => {
    try {
        let objTrans1 = {}

        let AppId = req.body.AppId;
        let FileId = req.body.FileId;
        let AttachmentInfo = req.body.AttachmentInfo;

        objTrans1.attachment = await GetAttachmentLink(AppId, FileId, 0, AttachmentInfo)


        return res.json(objTrans1)
    }
    catch (err) {
        // loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
        console.log(err);
        return res.json(objTrans1)
    }
}
module.exports = {
    Page_Load,
    chkAddAbv_CheckedChanged,
    btnSubmit,
    btnSeacrhEmail,
    sLoadCountry,
    UpdatePP2Status,
    TestGetAttchmentLink,
    getDocFromTMS
}
