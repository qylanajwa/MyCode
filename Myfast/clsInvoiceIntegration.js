const moment = require('moment');
const loggers = require('../../log');
const ctlAccessToken = require('./AccessToken');
const oLogicInvoice = require('../../repositories/CostingSheet/InvoiceLogic');
const clsGRPReceipt = require('../../repositories/MyFAST/GRPReceipt');
const clsGRPInvoice = require('../../repositories/MyFAST/GRPInvoice');
const clsInvoice = require('../../repositories/App_Code/clsInvoice');
const clsInvoiceDetails = require('../../../CUSTOMER/repositories/PaymentRepository/InvoiceDetails');
const oLogicIncomeCode = require('../../../CUSTOMER/repositories/CommonRepository/IncomeCodeLogic');
const oLogicCosting = require('../../repositories/CostingSheet/CostingSheetLogic')
const clsGSTIntegration2 = require('../../repositories/App_Code/clsGSTIntegration2')
const oLogicFile = require("../../repositories/File/FileLogic");
const oLogicWf = require("../../repositories/QueryRepository")
// const oLogicMasterAddress = require("../../repositories/NewApplication/MasterAddrLogic");
const oLogicAddress = require("../../repositories/AdminPanel/AddressLogic");
const oLogicTask = require('../../repositories/NewApplication/TaskListLogic')
const oLogicMasterAddr = require('../../repositories/NewApplication/MasterAddrLogic')
const Receipt = require('./Receipt');
const badDebt = require("../../../CUSTOMER/CronScheduler/BadDebtRepository")
var commanConstants = require('../../config/Constants');
const clsInvoiceIntegration_backup = require('../MyFAST/clsInvoiceIntegration_backup')
let invoiceDetailsdata = require('../../../CUSTOMER/repositories/PaymentRepository/Customers/ViewInvoices');
const oLogicLookUp = require('../../repositories/AdminPanel/LookupLogic');
const ParameterLogic = require('../../repositories/AdminPanel/ParameterLogic');

let currentdate = new Date(); //CH2023
let Now = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
const webConfig = require('../../../SCIS/webconfig');
let eInvoiceDate = webConfig.eInvoice_Date


exports.getAccessToken = async (req, res) => {
	try {
		let accessToken = await ctlAccessToken.getAccessToken();

		res.status(200).json(accessToken)
	}
	catch (err) {
		loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
		console.log(err)
	}
}

function get_eInvCallBack() {
	let hostURL = `${process.env.SERVICE_URL_ROOT_BACKEND}`
	let portURL = ''
	let eInvLink = `${hostURL}${portURL}/api/v1/einvoice`
	console.log(eInvLink)

	return eInvLink;
}

exports.putInvoice = async (invoiceNo, type = '', CRMamount = 0, standAloneCRM = false, Audit = true, masterInv = false) => {
	try {
		let JobCompletion_SST = '', eInvoice = false;

		//SEND SA CRM MANUALLY OR SEND STANDALONE PARTIAL AMOUNT (NEED RECALCULATE)
		let CRM_Manually = false;
		if ((CRM_Manually == true || standAloneCRM == true) && CRMamount > 0) {
			standAloneCRM = true;
			CRMamount = CRMamount > 0 ? CRMamount : 7177 //hardcode to send manually
		}



		// DO NOT SET THIS TO TRUE UNLESS YOU WANT TO USE CODE AT ESCISDEV THAT REQUIRE YOU TO 
		// CHANGE JSON detail/ DO CRM MANUALLY DUE TO WRONG AMOUNT SEND TO MYFAST.
		let ESCIS_SERVER = false;
		if (ESCIS_SERVER == true) {
			await clsInvoiceIntegration_backup.putInvoice(invoiceNo, type, CRMamount, standAloneCRM)
			return;
		}

		let obj = {}
		let putData = true //

		// let invoiceNo = req.body.invoiceNo
		if (!invoiceNo) {
			console.log('Invoice No. not supplied!')
			return false
		}

		let getInvoiceMaster = await oLogicInvoice.SelectInvoiceMasterbyInvoiceNo(invoiceNo)

		// standAloneCRM=true//temporary
		if (standAloneCRM == true && CRMamount == 0) { //STAND ALONE FULL AMOUNT
			await this.PushStandAloneCRM(invoiceNo, getInvoiceMaster[0])
			return;
		}



		//to cater licensee type TCFM NewApp
		let getWorkflow = await oLogicCosting.SelectWfidAndWorkflowTypeByInvNo(invoiceNo)
		if (getWorkflow != null && getWorkflow.length > 0) {
			let fileId = getInvoiceMaster[0].File_id
			let resultFile = await oLogicFile.SelectFiledDataBy_FileID(fileId).catch((e) => {
				loggers.logError(loggers.thisLine2() + ': ' + `${e}`)
				console.log(e);
			});
			let wfid = getWorkflow[0].wfid
			let appType = getWorkflow[0].AppType
			if (resultFile != null && resultFile.length > 0 && resultFile[0].LicenseeType != null && (resultFile[0].LicenseeType == 4 || resultFile[0].LicenseeType == 3) && getInvoiceMaster[0].Invoice_type == 'AP' && appType == 'NewApplication') {
				let costing_id = getInvoiceMaster[0].Costing_id
				let AuditJobComplete = await invoiceDetailsdata.getAuditJobCompleteDate(costing_id)
				if (AuditJobComplete != null && AuditJobComplete.length > 0) { //ada audit, job complete
					Audit = false;
					JobCompletion_SST = AuditJobComplete[0].ModifiedDate
					console.log('T1')
				}
				else {
					let CertRecomJobComplete = await invoiceDetailsdata.getCerRecommApproveDate_byCostid(costing_id) //xde audit and job complete
					if (CertRecomJobComplete != null && CertRecomJobComplete.length > 0) {
						Audit = false;
						JobCompletion_SST = AuditJobComplete[0].ModifiedDate
						console.log('T2')

					}
					else {
						let CertRecomJobIncomplete = await invoiceDetailsdata.getCertRecommendationJobIncomplete(wfid) //xde audit and job x complete
						if (CertRecomJobIncomplete != null && CertRecomJobIncomplete.length > 0) {
							Audit = false
							putData = false  //--permenantly
							console.log('T3')

						}
						else {//ada audit job incomplete
							Audit = true
							console.log('T4')

						}

					}

				}

			}
		}


		//ONLY ALLOW TO PUSH AP INV AFTER JOB COMPLETE!
		if (Audit == true) { //check if current task is a final audit report or not as we can't rely on task status for this case
			if (getInvoiceMaster && getInvoiceMaster.length > 0) {
				if (getInvoiceMaster[0].Invoice_type != null && getInvoiceMaster[0].Invoice_type == 'AP' && getInvoiceMaster[0].Status != '6') {
					let JobComplete = await clsGRPReceipt.getAuditRptData_ByInvNo(invoiceNo)
					if (JobComplete && JobComplete.length > 0 && JobComplete[0].Status == '2' && JobComplete[0].ModifiedDate != null) {
						JobCompletion_SST = moment(JobComplete[0].ModifiedDate).utc().format('YYYY-MM-DD')
						//proceed
					}
					else if (JobComplete[0].ModifiedDate == null || JobComplete[0].ModifiedDate == '') {
						console.log('JOB COMPLETION DATE IS NULL!')
						return;
					}
					else {
						return;
					}
				}
			}
		}

		if ((getInvoiceMaster[0].is_einvoice != null && getInvoiceMaster[0].is_einvoice != '' && getInvoiceMaster[0].is_einvoice == true) || (getInvoiceMaster[0].Invoice_date != null && getInvoiceMaster[0].Invoice_date != '' && moment(getInvoiceMaster[0].Invoice_date).utc().format('YYYY-MM-DD') >= eInvoiceDate)) {
			eInvoice = true;
		}
		//eInvoice = true //temporary for SIT
 
		//block to push all inv 2021 CR (suppose has been migrate)
		let checkdate = moment(new Date('2022-01-01')).format('YYYY-MM-DD');
		if (getInvoiceMaster[0].Invoice_type != null && getInvoiceMaster[0].Invoice_type == 'CR') {

			if (getInvoiceMaster[0].Invoice_date != null && getInvoiceMaster[0].Invoice_date != '' && getInvoiceMaster[0].Payment_date != null && getInvoiceMaster[0].Payment_date != '' && moment(getInvoiceMaster[0].Invoice_date).utc().format('YYYY-MM-DD') < checkdate && moment(getInvoiceMaster[0].Payment_date).utc().format('YYYY-MM-DD') < checkdate) {
				putData = false;
				console.log('CANNOT PUSH INV 21')
			}
			else if (getInvoiceMaster[0].Payment_date != null && getInvoiceMaster[0].Payment_date != '' && moment(getInvoiceMaster[0].Payment_date).utc().format('YYYY-MM-DD') < checkdate) {
				putData = false;
				console.log('CANNOT PUSH INV 21')
			}
			else if (getInvoiceMaster[0].Invoice_date != null && getInvoiceMaster[0].Invoice_date != '' && moment(getInvoiceMaster[0].Invoice_date).utc().format('YYYY-MM-DD') < checkdate) {
				putData = false;
				console.log('CANNOT PUSH INV 21')
			}
			else if (getInvoiceMaster[0].Invoice_date == null && getInvoiceMaster[0].Created_date != null && moment(getInvoiceMaster[0].Created_date).utc().format('YYYY-MM-DD') < checkdate) {
				putData = false;
				console.log('CANNOT PUSH INV 21')
			}
		}

		let getGST;
		let SSTDate = moment(new Date('2024-03-01')).format('YYYY-MM-DD'); //implement 6% SST if payment before march 24 and job complete after march 24 for AP only
		let SSTDate2 = moment(new Date('2024-09-01')).format('YYYY-MM-DD'); //implement 8% SST if payment before march 24 but job complete after august 24 for AP only

		if (getInvoiceMaster[0].Invoice_type == 'AP' && getInvoiceMaster[0].Status == '3' && type != 'CRM') {
			{
				let Payment = await VerifiedDate(invoiceNo)
				if (Payment.VerifiedDate && Payment.VerifiedDate < SSTDate && JobCompletion_SST >= SSTDate2) {
					getGST = 'GST8'
				}
				else if (Payment.VerifiedDate && Payment.VerifiedDate < SSTDate) {
					getGST = 'GST6'
				}
			}
		}
		else if (type == 'CRM' && getInvoiceMaster[0].Currency == 'MYR') {
			if (getInvoiceMaster[0].GSTRate == '0' || getInvoiceMaster[0].GSTRate == '0.00' || getInvoiceMaster[0].GSTRate == null || getInvoiceMaster[0].GSTRate == '0.06' || getInvoiceMaster[0].GSTRate == '6') {
				getGST = 'GST6'
			}
			else if (getInvoiceMaster[0].GSTRate == 0.08) {
				getGST = 'GST8'
			}

		}

		//CH2023
		// if (getInvoiceMaster != null && getInvoiceMaster.length > 0) {
		// 	let tempInvDate = new Date(getInvoiceMaster[0].Invoice_date).getFullYear();

		// 	if ((getInvoiceMaster[0].Invoice_type == 'CR' || getInvoiceMaster[0].Invoice_type == 'CRM') && tempInvDate < 2024 && currentdate < new Date('2024-01-09')) {
		// 		putData = true
		// 	}
		// 	else if ((getInvoiceMaster[0].Invoice_type == 'AP' || getInvoiceMaster[0].Invoice_type == 'CRM') && tempInvDate < 2024 && currentdate < new Date('2024-01-09')) {
		// 		//need to complete job first
		// 		if (Audit == false) {
		// 			putData = true 
		// 		}
		// 		else {

		// 			let JobComplete = await clsGRPReceipt.getAuditRptData_ByInvNo(invoiceNo)
		// 			if (JobComplete && JobComplete.length > 0 && JobComplete[0].Status == '2') {
		// 				let tempJobComplete = new Date(JobComplete[0].ModifiedDate).getFullYear();
		// 				if (tempJobComplete < 2024) {
		// 					putData = true 
		// 				}
		// 			}
		// 			else {
		// 				return;
		// 			}
		// 		}

		// 	}
		// 	else {
		// 		putData = false
		// 		console.log('NOT ALLOWED!')
		// 	}
		// 
		//CH2023


		//start mapping for branch, account, subaccount
		let joinData = await clsGRPInvoice.SelectJoinsTable(invoiceNo)
		let CostId;
		if (joinData && joinData.length > 0 && joinData[0].CostId) {

			CostId = joinData[0].CostId
		}
		else if (getInvoiceMaster[0].Description != 'Manual Invoice') {

			console.log("invoice No dont have costid " + invoiceNo)
			return
		}
		let getAccountData;
		let objMapping
		let arrItems = [];
		let arrmsg = []
		let isLocal = 0 //getInvoiceMaster[0].Invoice_type == 'CR' ? '1' : '0'
		let dataPass = false

		//check by manufacturer address
		// let fileId = getInvoiceMaster[0].File_id
		// let resultFile = await oLogicFile.SelectFiledDataBy_FileID(fileId).catch((e) => {
		// 	loggers.logError(loggers.thisLine2() + ': ' + `${e}`)
		// 	console.log(e);
		// });
		// let resultManufacture = await oLogicMasterAddress.SelectData_MasterAddr_byMasterRefId_type(resultFile[0].AppId, 'M').catch((e) => {
		// 	loggers.logError(loggers.thisLine2() + ': ' + `${e}`)
		// 	console.log(e);
		// });
		// if (resultManufacture) {
		// 	let resultAddrManufacture = await oLogicAddress.SelectData_Address_ByAddrID(resultManufacture[0].AddrId).catch((e) => {
		// 		loggers.logError(loggers.thisLine2() + ': ' + `${e}`)
		// 		console.log(e);
		// 	});
		// 	if (resultAddrManufacture) {
		// 		if (resultAddrManufacture[0].CountryCode == 1) {
		// 			isLocal = 1;
		// 		}
		// 	}
		// }

		//check by manufacturer address
		// let fileId = getInvoiceMaster[0].File_id
		// let resultFile = await oLogicFile.SelectFiledDataBy_FileID(fileId).catch((e) => {
		// 	loggers.logError(loggers.thisLine2() + ': ' + `${e}`)
		// 	console.log(e);
		// });
		// let resultManufacture = await oLogicMasterAddress.SelectData_MasterAddr_byMasterRefId_type(resultFile[0].AppId, 'M').catch((e) => {
		// 	loggers.logError(loggers.thisLine2() + ': ' + `${e}`)
		// 	console.log(e);
		// });
		// if (resultManufacture) {
		// 	let resultAddrManufacture = await oLogicAddress.SelectData_Address_ByAddrID(resultManufacture[0].AddrId).catch((e) => {
		// 		loggers.logError(loggers.thisLine2() + ': ' + `${e}`)
		// 		console.log(e);
		// 	});
		// 	if (resultAddrManufacture) {
		// 		if (resultAddrManufacture[0].CountryCode == 1) {
		// 			isLocal = 1;
		// 		}
		// 	}
		// }

		if (getInvoiceMaster[0].Currency.includes('MYR')) {
			isLocal = 1
		}
		else {
			isLocal = 0
		}
		let invmasterID = getInvoiceMaster[0].Id
		if (getInvoiceMaster[0].Description != null && getInvoiceMaster[0].Description.includes('Manual Invoice')) {

			// let getGST
			let detailsobj = {}
			let invoiceDetails = await oLogicInvoice.SelectInvoiceDetailsbyInvoiceMasterId(invmasterID)
			for (let x of invoiceDetails) {

				detailsobj = x
				detailsobj.Account = x.Income_code
				detailsobj.SubAccount = x.SubAccount
				let getBranch = await oLogicIncomeCode.GetAllBranch(x.Income_code, x.SubAccount)

				if (getBranch && getBranch.length >= 2) { //if branch return more than 1 value, will map by section code
					getBranch = getBranch.filter(z => {
						let branchParts = z.Branch.split('-');
						let lastPart = branchParts.pop();
						return lastPart == getInvoiceMaster[0].Invoice_no.substring(0, 3);
					});
				}
				detailsobj.Branch = getBranch && getBranch.length > 0 ? getBranch[0].Branch : ''

				// getGST = x.Gst_amount * (100 / x.Amount)
				// console.log("getGST: " + getGST)

				// if (Number.isInteger(getGST) == false) {
				// 	getGST = Math.round(getGST)
				// 	console.log("round off: " + getGST)
				// }
				// if (Number.isInteger(getGST) == true) {
				// 	if (getGST.toString().includes('6')) {
				// 		detailsobj.GSTRate = 'SST6'
				// 	} else if (getGST.toString().includes('10')) {
				// 		detailsobj.GSTRate = 'SST10'
				// 	} else {
				// 		detailsobj.GSTRate = 'SST0'
				// 	}
				// }

				//get sst rate from table
				if (x.Gst_amount && x.Gst_amount > 0) {
					if (getGST == 'GST6') {
						let getSST = await this.getSSTFx('6')
						if (getSST) {
							detailsobj.GSTRate = getSST.GSTRate
						}
					}

					else {
						let getSST = await this.getSSTFx()
						if (getSST) {
							detailsobj.GSTRate = getSST.GSTRate
						}
					}

				}
				else {
					detailsobj.GSTRate = 'SSTNT'
				}

				console.log("SSTRate: " + detailsobj.GSTRate)
				arrItems.push(detailsobj)

			}
		}
		else {

			let getCostingItems;
			let getCosting = await oLogicCosting.SelectCostingSheetNoStatus(CostId)
			if (getCosting) {

				if (getCosting.length > 1) getCosting = await oLogicCosting.SelectCostingSheet(CostId, '1')
				getCostingItems = await oLogicCosting.SelectCostingSheetItemModified(CostId)
				//insert for new app logic
				if (getCosting && getCosting.length > 0) {

					let resultTasklist = await oLogicTask.SelectData_GetTaskListby_WfId(getCosting[0].WfId).catch((e) => { loggers.logError(loggers.thisLine2() + ':' + `${e}`) })
					if (resultTasklist != null) {

						resultTasklist = resultTasklist.filter(function (a) { return a.AppId == CostId && a.TaskName.toUpperCase().includes("NEW APPLICATION 1") })
						if (resultTasklist.length > 0) {
							let resultLicencee = await oLogicAddress.SelectData_Address_ByAddrID(getInvoiceMaster[0].ApplicantAddressId).catch((e) => { loggers.logError(loggers.thisLine2() + ':' + `${e}`) })
							if (resultLicencee != null) {
								if (resultLicencee[0].CountryCode == 1) {
									let resultFile = await oLogicFile.SelectFiledDataBy_FileID(getCosting[0].FileId).catch((e) => { loggers.logError(loggers.thisLine2() + ':' + `${e}`) })
									if (resultFile) {
										let resultManufacturer = await oLogicMasterAddr.SelectData_MasterAddr_byMasterRefId_type(resultFile[0].AppId, "M").catch((e) => { loggers.logError(loggers.thisLine2() + ':' + `${e}`) })
										if (resultManufacturer != null) {
											let resultAddrManufacturer = await oLogicAddress.SelectData_Address_ByAddrID(resultManufacturer[0].AddrId).catch((e) => { loggers.logError(loggers.thisLine2() + ':' + `${e}`) })
											if (resultAddrManufacturer != null) {
												if (resultAddrManufacturer[0].CountryCode == 1) {
													getCostingItems = getCostingItems.filter(tbl => tbl.ItemType == 10 || tbl.ItemType == 172 || tbl.ItemParent == 156 || tbl.ItemParent == 155 || tbl.ItemType == 155)

												}
											}
										}
									}
								}
							}
						}
					}

					let isEIS = false
					let getFileScheme = await oLogicFile.SelectFiledDataBy_FileID(getCosting[0].FileId)
					if (getFileScheme && getFileScheme.length > 0 && getFileScheme[0].SchemeId == 19) {
						if (getCostingItems && getCostingItems.length > 0) {
							getCostingItems = getCostingItems.filter(tbl => tbl.GSTAmount > 0) 	//lump sum use this table

						} else {
							// if (getCosting[0].CurrencyId == 0 || getCosting[0].CurrencyId == null) {
							//daily rate use this table
							let lsEquipmentItems = await oLogicCosting.SelectCostingEquipment(CostId).catch((e) => { loggers.logError(loggers.thisLine2() + ':' + `${e}`) })
							if (lsEquipmentItems.length > 0) {
								isEIS = true
							}
							// }
						}

					}

					let getAppType = ''
					//mapping start here
					if (getCostingItems) {
						getCostingItems = getCostingItems.filter(item => item.IncidentalItem == 0 && item.ItemTotal > 0)
						if (getCostingItems.length > 0) {
							obj.Length = getCostingItems.length
							obj.CostingItems = getCostingItems
							let getInvoiceDetails = await oLogicInvoice.SelectInvoiceDetailsbyInvoiceMasterId(invmasterID)
							getInvoiceDetails = getInvoiceDetails.filter(item => item.Total_amount > 0)

							//16Jan23 - mapping JT consignment helmet secid=4
							let SubAcc = ''
							if (getInvoiceMaster && getInvoiceMaster.length > 0 && getInvoiceMaster[0].JobTrend != null && getInvoiceMaster[0].JobTrend.includes('60206')) {
								SubAcc = '1-R401-G-JT060206'
							}
							// else if(getInvoiceMaster && getInvoiceMaster.length > 0 && getInvoiceMaster[0].JobTrend != null && getInvoiceMaster[0].JobTrend.includes('60307')){
							// 	SubAcc = '1-R401-G-JT060307'
							// }

							let getCostingWf = await oLogicCosting.SelectCostingSheet(CostId)
							if (getCostingWf && getCostingWf.length > 0 && getCostingWf[0].WfId != null && getCostingWf[0].WfId != 0 && getCostingWf[0].WfId != '') {

								let getWfId = await oLogicWf.SelectData_WorkFlowbyWfID(getCostingWf[0].WfId)
								if (getWfId && getWfId.length > 0) {
									getAppType = getWfId[0].AppType
								}
							}

							let detailsobj = {}

							if (getAppType !== 'EISNewApplication' && getAppType !== 'FINewApplication' && getAppType !== 'NewApplication_EIS' && getAppType.toUpperCase().trim() !== 'ROUTINE PROCESS') {
								if (getInvoiceDetails && getInvoiceDetails.length == getCostingItems.length) {

									for (let x in getCostingItems) {

										detailsobj = getInvoiceDetails[x]

										let checkParent = await oLogicCosting.SelectCostingActivities_RecId(getCostingItems[x].ItemType) //check if item have parent id
										let parentid = null
										if (joinData[0].Sector_type_unitcode == 370 && getCostingItems[x].ItemType != null) { //section 370 use child costid to map
											parentid = getCostingItems[x].ItemType
										}
										else {
											if (checkParent && checkParent.length > 0 && checkParent[0].RefId != null && checkParent[0].RefId != 0) {

												parentid = checkParent[0].RefId
											}
											else {
												parentid = getCostingItems[x].ItemType
											}
										}

										//cross section; if unitcode file 152 but inv 351, follow unitcode 152
										// joinData[0].Sector_type_unitcode = 152

										getAccountData = await clsInvoice.getAccount(parentid, getCosting[0].WfId, CostId, joinData[0].Sector_type_unitcode, isLocal, SubAcc, getInvoiceMaster[0].Costing_type, getInvoiceMaster[0].JobTrend)
										if (getAccountData && getAccountData.length > 0) {

											detailsobj.Account = getAccountData[0].Account
											detailsobj.SubAccount = getAccountData[0].SubAccount
											detailsobj.Branch = getAccountData[0].Branch

											arrItems.push(detailsobj)
										}
										else {

											detailsobj.Account = ''
											detailsobj.SubAccount = ''
											detailsobj.Branch = ''
											detailsobj.ContainError = true;
											let errmsg1 = ' id = ' + '' + ' item type = ' + getCostingItems[x].ItemType + 'parent item = ' + parentid + ' wfid = ' + getCosting[0].WfId +
												' costid = ' + CostId + ' unitcode = ' + joinData[0].Sector_type_unitcode + ' islocal =' + isLocal

											arrmsg.push(errmsg1)
											arrItems.push(detailsobj)

											console.log(' id = ' + '' + ' item type = ' + getCostingItems[x].ItemType + 'parent item = ' + parentid + ' wfid = ' + getCosting[0].WfId +
												' costid = ' + CostId + ' unitcode = ' + joinData[0].Sector_type_unitcode + ' islocal =' + isLocal)

										}
									}

								}
							}
							else if (getAppType == 'EISNewApplication' || getAppType == 'FINewApplication' || getAppType == 'NewApplication_EIS' || getAppType == 'Routine Process') { //for EI/FI flow

								detailsobj = getInvoiceDetails[0]

								let checkParent = await oLogicCosting.SelectCostingActivities_RecId(getCostingItems[0].ItemType) //check if item have parent id
								let parentid = null

								if (checkParent && checkParent.length > 0 && checkParent[0].RefId != null && checkParent[0].RefId != 0) {

									parentid = checkParent[0].RefId
								}
								else {

									parentid = getCostingItems[0].ItemType
								}

								// if(getInvoiceMaster[0].Costing_type=='Witness Labelling Fee'){
								// 		getAccountData = await clsInvoice.getAccount(parentid, getCosting[0].WfId, CostId, joinData[0].Sector_type_unitcode, isLocal, SubAcc,getInvoiceMaster[0].Costing_type)
								// }
								// else{

								//check sector  // 25/3/24 - to follow master inv sector code
								// if (joinData[0].Sector_type_unitcode == 370) {
								// 	let resultFile = await oLogicFile.SelectFiledDataBy_FileID(getInvoiceMaster[0].File_id).catch((e) => { loggers.logError(loggers.thisLine2() + ':' + `${e}`) })
								// 	if (resultFile != null && resultFile.length > 0) {
								// 		let secid = resultFile[0].SecId
								// 		resultSector = await oLogicLookUp.SelectSectorTypeBySecID(secid)
								// 		if (resultSector != null && resultSector.length > 0) {
								// 			if (resultSector[0].UnitCode != '370' || resultSector[0].UnitCode != 370) {
								// 				joinData[0].Sector_type_unitcode = resultSector[0].UnitCode
								// 			}
								// 		}

								// 	}
								// }

								getAccountData = await clsInvoice.getAccount(parentid, getCosting[0].WfId, CostId, joinData[0].Sector_type_unitcode, isLocal, SubAcc)
								// }

								if (getAccountData && getAccountData.length > 0) {

									detailsobj.Account = getAccountData[0].Account
									detailsobj.SubAccount = getAccountData[0].SubAccount
									detailsobj.Branch = getAccountData[0].Branch

									arrItems.push(detailsobj)
								}
								else {

									detailsobj.Account = ''
									detailsobj.SubAccount = ''
									detailsobj.Branch = ''
									detailsobj.ContainError = true;
									let errmsg1 = ' id = ' + '' + ' item type = ' + getCostingItems[0].ItemType + 'parent item = ' + parentid + ' wfid = ' + getCosting[0].WfId +
										' costid = ' + CostId + ' unitcode = ' + joinData[0].Sector_type_unitcode + ' islocal =' + isLocal

									arrmsg.push(errmsg1)
									arrItems.push(detailsobj)

									console.log(' id = ' + '' + ' item type = ' + getCostingItems[0].ItemType + 'parent item = ' + parentid + ' wfid = ' + getCosting[0].WfId +
										' costid = ' + CostId + ' unitcode = ' + joinData[0].Sector_type_unitcode + ' islocal =' + isLocal)

								}
								// }

							}

							// objMapping = arrItems.sort((a,b)=>a.Id-b.Id);
						}

					}

					if (isEIS || getAppType == 'EISAdHoc') {
						let getInvoiceDetailsEIS = await oLogicInvoice.SelectInvoiceDetailsbyInvoiceMasterId(invmasterID);
						if (getInvoiceDetailsEIS && getInvoiceDetailsEIS.length > 0) {
							for (let x in getInvoiceDetailsEIS) {

								let detailsobjEIS = getInvoiceDetailsEIS[x]
								detailsobjEIS.Account = 61210
								detailsobjEIS.SubAccount = isLocal == 1 ? '1-R401-G-JT050103' : '1-R402-H-JT050103'
								detailsobjEIS.Branch = 'K-4-43-152'

								arrItems.push(detailsobjEIS)
							}
						}
					}

				}
			}
		}

		objMapping = arrItems
		console.log('this obj map ' + JSON.stringify(objMapping))
		//end mapping for branch, account, subaccount

		if (getInvoiceMaster && getInvoiceMaster.length) {
			let invoiceMstr = getInvoiceMaster[0]
			let getInvoiceDetails = await oLogicInvoice.SelectInvoiceDetailsbyInvoiceMasterId(invoiceMstr.Id)
			if (getInvoiceDetails && getInvoiceDetails.length > 0) {

				let getInvoiceJSON = await this.requestFormatARBilling(invoiceMstr, objMapping, type, CRMamount, getGST, eInvoice)
				if (getInvoiceJSON && !!getInvoiceJSON.status) {
					// call AR 5.2

					let getGRPRecId;
					if (type == '') {
						type = 'CR'
					}

					let crmID = ""
					let customer = ""

					if (getInvoiceMaster[0].CustCode !== null && getInvoiceMaster[0].CustCode !== '') {
						customer = getInvoiceMaster[0].CustCode
					}
					else if (getInvoiceMaster[0].Customer_id !== null && getInvoiceMaster[0].Customer_id !== '') {
						customer = getInvoiceMaster[0].Customer_id
					}
					else {
						customer = ''
					}

					// let addrID = getInvoiceMaster[0].Address_Id

					// let getAddrcrmID = await badDebt.getAddressDetailsById(addrID)
					// if (getAddrcrmID && getAddrcrmID.length > 0) {
					// 	crmID = getAddrcrmID[0].CRMAddrId
					// }

					if (customer == "" || customer == null && getInvoiceMaster[0].CRMAddrId != null && getInvoiceMaster[0].CRMAddrId != "") {
						customer = await clsInvoiceDetails.getCustcodebyCRMId(getInvoiceMaster[0].CRMAddrId)
						customer = customer[0].CustCode
						crmID = getInvoiceMaster[0].CRMAddrId
					}
					//18Jan23 - cater exist customer & crmaddid
					else if (customer != null && customer != '' && getInvoiceMaster[0].CRMAddrId != null && getInvoiceMaster[0].CRMAddrId != "") {
						customer = await clsInvoiceDetails.getCustcodebyCRMId(getInvoiceMaster[0].CRMAddrId)
						customer = customer[0].CustCode
						crmID = getInvoiceMaster[0].CRMAddrId
					}

					if (crmID == "") {
						let custCRMId = await clsInvoiceDetails.getCustcode(customer)
						let getcrmIdAddrId = await clsInvoiceDetails.getCRMId_byCustCode(customer)
						if (custCRMId && custCRMId != undefined && custCRMId != null && custCRMId[0] != null && custCRMId.length > 0 && custCRMId[0].crmid != null && custCRMId[0].crmid != '') {
							crmID = custCRMId[0].crmid
						}
						else if (getcrmIdAddrId && getcrmIdAddrId != undefined && getcrmIdAddrId != null && getcrmIdAddrId[0] != null && getcrmIdAddrId.length > 0 && getcrmIdAddrId[0].CRMAddrId != null && getcrmIdAddrId[0].CRMAddrId != '') {
							crmID = getcrmIdAddrId[0].CRMAddrId
						}
						else {
							let CRMId = ''
							let getcompany = await clsGSTIntegration2.CompStructSoapRequest(customer).catch((e) => { loggers.logError(loggers.thisLine2() + ':' + `${e}`) })
							if (getcompany && getcompany.length > 0 && getcompany[0] != null) {
								for (let co in getcompany) {
									if (getcompany[co].crmid != null) {
										CRMId = getcompany[co].crmid
									}
								}
								crmID = CRMId
							}
						}
					}

					//9Mac23 - cater for reqData json customer empty as master.custcode & master.custid ''
					if (getInvoiceJSON.obj.Customer.value == '' && customer != '') {
						getInvoiceJSON.obj.Customer.value = customer
					}

					let getInvoiceRec = await clsGRPInvoice.SelectGRPInvoice_InvoiceNoType(invoiceNo, type)

					if (getInvoiceRec && getInvoiceRec.length > 0) {

						if (getInvoiceRec[0].resId != null && getInvoiceRec[0].note == "production") {

							obj.msg = "success"
							obj.status = true
							obj.data = getInvoiceRec[0].resData
							return obj //discontinue process if data already exist
						}
						else {
							getGRPRecId = getInvoiceRec[0].RecId

							let objdata = {}

							objdata.invoiceNo = invoiceNo
							objdata.RecId = getGRPRecId
							objdata.reqData = JSON.stringify(getInvoiceJSON.obj)
							objdata.LocationID = crmID != '' && crmID != null ? crmID : getInvoiceJSON.obj.LocationID.value
							objdata.Customer = customer
							if (standAloneCRM == true) {
								objdata.Escis_Remark = 'StandAlone CRM',
									objdata.resStatus = '1',
									objdata.Flag = '3'//flag for stand alone CRM
							}

							if (objMapping && objMapping.length > 0 && objMapping.filter(tbl => tbl.ContainError != undefined && tbl.ContainError).length > 0 || (objdata.LocationID == null || objdata.LocationID == "")) {
								obj.msg = "ID1 : Incomplete mapping " + invoiceNo
								obj.status = false
								obj.data = {}
								objdata.Remark = arrmsg
								await clsGRPInvoice.UpdateGRPInvoice(objdata, type)
								return obj //discontinue process if contain incomplete data
							}
							else {
								dataPass = true
								await clsGRPInvoice.UpdateGRPInvoice(objdata, type)
							}
						}
					}
					else {

						let objdata = {}
						objdata.invoiceNo = invoiceNo
						objdata.invoiceType = type//getInvoiceMaster[0].Invoice_type
						objdata.reqData = JSON.stringify(getInvoiceJSON.obj)
						objdata.CreatedDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
						objdata.LocationID = crmID != '' && crmID != null ? crmID : getInvoiceJSON.obj.LocationID.value
						objdata.Customer = customer
						if (standAloneCRM == true) {
							objdata.Escis_Remark = 'StandAlone CRM',
								objdata.resStatus = '1',
								objdata.Flag = '3'//flag for stand alone CRM
						}

						if (objMapping && objMapping.length > 0 && objMapping.filter(tbl => tbl.ContainError != undefined && tbl.ContainError).length > 0 || (objdata.LocationID == null || objdata.LocationID == "")) {
							obj.msg = "ID1 : Incomplete mapping " + invoiceNo
							obj.status = false
							obj.data = {}
							objdata.Remark = arrmsg
							await clsGRPInvoice.InsertGRPInvoice(objdata)
							// getGRPRecId = getGRPRecId[0].RecId
							return obj //discontinue process if contain incomplete data
						}
						else {
							dataPass = true
							getGRPRecId = await clsGRPInvoice.InsertGRPInvoice(objdata)
							getGRPRecId = getGRPRecId[0].RecId
						}
					}

					let accessToken = await ctlAccessToken.getAccessToken();

					if (type == 'AP' && isLocal == false) {//disable push data for foreign AP
						dataPass = true;
					}
					//start integration process, set integration condition
					if (accessToken != null && dataPass == true) { //open integration for CR ,CRM, AP local 

						// insert - store in grp invoice tbl
						console.log('requestFormatARBilling')
						console.log(JSON.stringify(getInvoiceJSON.obj))

						let passType;
						if (type == 'AP' || type == 'CR') {
							passType = 'Invoice'

						}
						else if (type == 'CRM') {

							passType = 'Credit Memo'

							let paramsINV, note;
							paramsINV = `%24filter=CustomerOrder eq '${invoiceNo.substring(3)}' and Type eq 'Credit Memo'`
							let getInvoice = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.Invoice, paramsINV)
							loggers.logError(loggers.thisLine2() + ': ' + `${'getInvoice - putInvoice' + JSON.stringify(getInvoice)}`)

							if (getInvoice && getInvoice.length > 0) { //eInvoice - save respond from myfast
								for (let x in getInvoice) {
									await this.insertDetail(getInvoice[x], 'GET', '', JSON.stringify(getInvoice[x].obj))
								}
							}

							if (ctlAccessToken.apiRoutes.Invoice != null && ctlAccessToken.apiRoutes.Invoice != '' && ctlAccessToken.apiRoutes.Invoice.includes('moquer')) {
								note = 'staging'
							}
							else {
								note = 'production'
							}

							if (getInvoice && getInvoice.length > 1) {
								getInvoice = getInvoice.sort((a, b) => b.CreatedDateTime.value.localeCompare(a.CreatedDateTime.value));
								getInvoice = getInvoice[0]

								await this.getCRMReferenceNbr(invoiceNo, 1, getInvoiceMaster[0].Invoice_type, getInvoice, note, masterInv)
								return;
							}
							else if (getInvoice && getInvoice.length == 1) {
								getInvoice = getInvoice[0]
								await this.getCRMReferenceNbr(invoiceNo, 1, getInvoiceMaster[0].Invoice_type, getInvoice, note, masterInv)
								return;
							}

						}

						let paramsINV;
						paramsINV = `%24filter=CustomerOrder eq '${invoiceNo.substring(3)}' and Type eq '` + passType + `' and Status ne 'Closed'`
						let getInvoice = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.Invoice, paramsINV)
						loggers.logError(loggers.thisLine2() + ': ' + `${'getInvoice - putInvoice' + JSON.stringify(getInvoice)}`)

						if (getInvoice && getInvoice.length > 0) { //eInvoice - save respond from myfast
							for (let x in getInvoice) {
								await this.insertDetail(getInvoice[x], 'GET', '', JSON.stringify(getInvoice[x]))
							}
						}
						if (type == 'CRM' && CRMamount == 0) {
							let paramsINV = `%24filter=CustomerOrder eq '${invoiceNo.substring(3)}' and Type eq 'Invoice' and Status ne 'Closed'`
							let getInvoice2 = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.Invoice, paramsINV)
							loggers.logError(loggers.thisLine2() + ': ' + `${'getInvoice - putInvoice' + JSON.stringify(getInvoice)}`)

							if (getInvoice2 != null && getInvoice2.length > 0) {

								for (let x in getInvoice2) { //eInvoice - save respond from myfast
									await this.insertDetail(getInvoice2[x], 'GET', '', JSON.stringify(getInvoice2[x].obj))
								}

								getInvoiceJSON = await this.requestFormatARBilling(invoiceMstr, objMapping, type, getInvoice2 && getInvoice2.length > 0 ? getInvoice2[0].Amount.value : 0, getGST, eInvoice)
								let objdata = {}
								if (standAloneCRM == true) {
									objdata.Escis_Remark = 'StandAlone CRM',
										objdata.resStatus = '1',
										objdata.Flag = '3'//flag for stand alone CRM
								}

								objdata.invoiceNo = invoiceNo
								objdata.reqData = JSON.stringify(getInvoiceJSON.obj)
								await clsGRPInvoice.UpdateGRPInvoice(objdata, type)
							}
						}

						console.log('getInvoice' + JSON.stringify(getInvoice))
						if (getInvoice && getInvoice.length > 0) { // insert into db data get from myfast get fx

							if (getGRPRecId) {

								let mappedAcc = await this.remapAccount(getInvoice[0])

								mappedAcc.invoiceNo = invoiceNo
								mappedAcc.resData = JSON.stringify(getInvoice[0])
								mappedAcc.resStatus = "1"
								let getURL = await ctlAccessToken.apiRoutes.Account

								if (getURL != null && getURL != '' && getURL.includes('moquer')) {

									mappedAcc.note = 'staging'

								}
								else {
									mappedAcc.note = 'production'
								}

								await clsGRPInvoice.UpdateGRPInvoice(mappedAcc, type)

								let objDtl = getInvoice[0]

								for (let x in objDtl) {
									let mappedDtl = await this.remapAccountDtl(objDtl)

									mappedDtl.RefId = getGRPRecId
									mappedDtl.resId = objDtl[x].id
									mappedDtl.rowNumber = objDtl[x].rowNumber
									mappedDtl.note = objDtl[x].note
									mappedDtl.CreatedDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')

									await clsGRPInvoice.InsertGRPInvoiceDtl(mappedDtl)
								}

							}
							obj.msg = "success"
							obj.status = true
							obj.data = getInvoice[0]
							return obj
						}
						else if (((getInvoice && getInvoice.length == 0) || getInvoice == null)) { //send request to myfast then insert into db data from sent request 
							let resAccount = ''
							if (putData == true) {
								resAccount = await ctlAccessToken.putData(ctlAccessToken.apiRoutes.Invoice, '', getInvoiceJSON.obj)
								loggers.logError(loggers.thisLine2() + ': ' + `${'resAccount - putInvoice' + JSON.stringify(resAccount)}`)
								if (resAccount && resAccount.id != null && resAccount.id != '') { //eInvoice - save respond from myfast
									await this.insertDetail(resAccount, 'PUT', JSON.stringify(getInvoiceJSON.obj), JSON.stringify(resAccount))
									console.log('RETURN JSON!')
									console.log(resAccount)
								}
								if (resAccount && resAccount.id) {

									console.log('response requestFormatARBilling')
									console.log(JSON.stringify(resAccount))
									// update -store response in grp invoice tbl 

									if (getGRPRecId) {

										let mappedAcc = await this.remapAccount(resAccount)

										mappedAcc.invoiceNo = invoiceNo
										mappedAcc.resData = JSON.stringify(resAccount)
										mappedAcc.resStatus = "1"
										let getURL = await ctlAccessToken.apiRoutes.Account

										if (getURL != null && getURL != '' && getURL.includes('moquer')) {

											mappedAcc.note = 'staging'

										}
										else {
											mappedAcc.note = 'production'
										}

										await clsGRPInvoice.UpdateGRPInvoice(mappedAcc, type)

										let objDtl = resAccount.Details

										for (let x in objDtl) {
											let mappedDtl = await this.remapAccountDtl(objDtl)

											mappedDtl.RefId = getGRPRecId
											mappedDtl.resId = objDtl[x].id
											mappedDtl.rowNumber = objDtl[x].rowNumber
											mappedDtl.note = objDtl[x].note
											mappedDtl.CreatedDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')

											await clsGRPInvoice.InsertGRPInvoiceDtl(mappedDtl)
										}

									}

									obj.msg = "success"
									obj.status = true
									obj.data = resAccount
									return obj
								}
								else if (resAccount && resAccount.message != null && resAccount.status == false) {
									let mappedAcc = {}

									mappedAcc.invoiceNo = invoiceNo
									mappedAcc.resStatus = "2"
									let getURL = await ctlAccessToken.apiRoutes.Account

									if (getURL != null && getURL != '' && getURL.includes('moquer')) {

										mappedAcc.note = 'staging'

									}
									else {
										mappedAcc.note = 'production'
									}

									mappedAcc.Remark = resAccount != null && resAccount.message != '' ? resAccount.message : 'INTEGRATION WITH MYFAST FAILED!'
									console.log("error msg: " + resAccount.message)
									await clsGRPInvoice.UpdateGRPInvoice(mappedAcc, type)

									obj.msg = "ID2: " + resAccount.message
									obj.status = false
									obj.data = {}
									return obj
								}
								else {

									let paramsINV = `%24filter=CustomerOrder eq '${invoiceNo.substring(3)}'`
									let getInvoice;

									for (let x = 0; x < 2; x++) {
										getInvoice = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.Invoice, paramsINV)

									}
									loggers.logError(loggers.thisLine2() + ': ' + `${'getInvoice - putInvoice2' + JSON.stringify(getInvoice)}`)


									if (getInvoice && getInvoice.length > 0) { // insert into db data get from myfast get fx

										for (let x in getInvoice) { //eInvoice - save respond from myfast
											await this.insertDetail(getInvoice[x], 'GET', '', JSON.stringify(getInvoice[x].obj))
										}

										if (getGRPRecId) {

											let mappedAcc = await this.remapAccount(getInvoice[0])

											mappedAcc.invoiceNo = invoiceNo
											mappedAcc.resData = JSON.stringify(getInvoice[0])
											mappedAcc.resStatus = "1"
											let getURL = await ctlAccessToken.apiRoutes.Account

											if (getURL != null && getURL != '' && getURL.includes('moquer')) {

												mappedAcc.note = 'staging'

											}
											else {
												mappedAcc.note = 'production'
											}

											await clsGRPInvoice.UpdateGRPInvoice(mappedAcc, type)

											let objDtl = getInvoice.Details

											for (let x in objDtl) {
												let mappedDtl = await this.remapAccountDtl(objDtl)

												mappedDtl.RefId = getGRPRecId
												mappedDtl.resId = objDtl[x].id
												mappedDtl.rowNumber = objDtl[x].rowNumber
												mappedDtl.note = objDtl[x].note
												mappedDtl.CreatedDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')

												await clsGRPInvoice.InsertGRPInvoiceDtl(mappedDtl)
											}

											obj.msg = "success"
											obj.status = true
											obj.data = resAccount
											return obj

										}
									}
									else {

										let mappedAcc = {}

										mappedAcc.invoiceNo = invoiceNo
										mappedAcc.resStatus = "2"
										let getURL = await ctlAccessToken.apiRoutes.Account

										if (getURL != null && getURL != '' && getURL.includes('moquer')) {

											mappedAcc.note = 'staging'

										}
										else {
											mappedAcc.note = 'production'
										}

										mappedAcc.Remark = resAccount != null && resAccount.message != '' ? resAccount.message : 'INTEGRATION WITH MYFAST FAILED!'
										await clsGRPInvoice.UpdateGRPInvoice(mappedAcc, type)

										obj.msg = "ID2: " + resAccount.message
										obj.status = false
										obj.data = {}
										return obj
									}

								}

							}


						}
						else {

							let mappedAcc = {}

							mappedAcc.invoiceNo = invoiceNo
							mappedAcc.resStatus = "2"
							let getURL = await ctlAccessToken.apiRoutes.Account

							if (getURL != null && getURL != '' && getURL.includes('moquer')) {

								mappedAcc.note = 'staging'

							}
							else {
								mappedAcc.note = 'production'
							}

							mappedAcc.Remark = getInvoice != null & getInvoice.length >= 1 && getInvoice.message != '' ? getInvoice.message : 'INTEGRATION WITH MYFAST FAILED!'

							await clsGRPInvoice.UpdateGRPInvoice(mappedAcc, type)

							obj.msg = "ID2: " + getInvoice.message
							obj.status = false
							obj.data = {}
							return obj
						}
					}
				}
			}
		}
		else {

			obj.msg = "ID3: No Invoice in Invoice Master"
			obj.status = false
			obj.data = {}
			return obj
		}
	}
	catch (err) {
		loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
		console.log(err)
	}
}

exports.requestFormatARBilling = async (invoiceMaster, objMapping, type = '', CRMamount = 0, getGST, eInvoice) => {
	try {

		let resObj = {}
		let resStatus = false
		let invMaster = invoiceMaster

		if (invoiceMaster /*&& objMapping && objMapping.length > 0*/) {
			resStatus = true
		}
		else {
			return false
		}

		let amount = 0
		let currency = ''
		let customer = ''
		let customerOrder = ''
		let date = ''
		let description = ''
		let hold = eInvoice == true ? true : false //eInvoice WI 2; always need to be true
		let project = ''
		let linkBranch = ''
		let discountAmt = 0
		let gstRate = 0
		let aryDetail = []
		let roundAdj = null
		let terms = ''
		let LocationID = ''

		// if (invMaster.Invoice_type == 'CR') {
		// type = 'Invoice'
		// }
		// else { // credit term == AP
		// 	type = 'Prepayment' // Prepayment?
		// }

		if (type == '' || type == 'CR') {
			type = 'Invoice'
		}
		else if (type == 'CRM') {
			type = 'CRM'
			if (CRMamount == 0) {
				amount = invMaster.Sub_total // invMaster.Total_amount
			} else {
				amount = CRMamount //amount if partial refund

			}
		}
		else if (type == 'AP') {
			type = 'Invoice'

		}

		if (type != 'CRM') {
			if (CRMamount == 0) {
				amount = invMaster.Sub_total // invMaster.Total_amount
			}
		}
		currency = invMaster.Currency

		//17Jan23;check custcode & custid
		if (invMaster.CustCode !== null) {
			customer = invMaster.CustCode.replace(/\s/g, "")
		}
		else if (invMaster.CustCode !== null) {
			customer = invMaster.Customer_id.replace(/\s/g, "")
		}
		else {
			console.log("NO CUSTOMER FOUND!")
		}
		//customer = '00000008' // temporary for SIT
		let custCRMId = await clsInvoiceDetails.getCustcode(customer)
		let getcrmIdAddrId = await clsInvoiceDetails.getCRMId_byCustCode(customer)
		let crmID = ""

		//18Jan23 - cater exist customer & crmaddid
		if (invMaster.CRMAddrId != null && invMaster.CRMAddrId != '') {
			crmID = invMaster.CRMAddrId
		}
		else {

			if (custCRMId && custCRMId != undefined && custCRMId != null && custCRMId[0] != null && custCRMId.length > 0 && custCRMId[0].crmid != null && custCRMId[0].crmid != '') {

				crmID = custCRMId[0].crmid

			}
			else if (getcrmIdAddrId && getcrmIdAddrId != undefined && getcrmIdAddrId != null && getcrmIdAddrId[0] != null && getcrmIdAddrId.length > 0 && getcrmIdAddrId[0].CRMAddrId != null && getcrmIdAddrId[0].CRMAddrId != '') {

				crmID = getcrmIdAddrId[0].CRMAddrId

			}
			else {

				let CRMId = ''
				let getcompany = await clsGSTIntegration2.CompStructSoapRequest(customer).catch((e) => { loggers.logError(loggers.thisLine2() + ':' + `${e}`) })
				if (getcompany && getcompany.length > 0 && getcompany[0] != null) {
					for (let co in getcompany) {
						if (getcompany[co].crmid != null) {
							CRMId = getcompany[co].crmid
						}
					}
					crmID = CRMId
				}
			}
		}

		//LocationID = 'C2011003077' // temporary for SIT
		LocationID = crmID

		let truncatesecCode = invoiceMaster.Invoice_no.substring(3)
		customerOrder = truncatesecCode
		let checkdate = moment(new Date('2022-01-01')).format('YYYY-MM-DD');

		if (invoiceMaster.Invoice_type == 'AP') {
			date = invoiceMaster.Completion_date && (moment(invoiceMaster.Completion_date).utc().format('YYYY-MM-DD') > checkdate || moment(invoiceMaster.Completion_date).utc().format('YYYY-MM-DD') == checkdate) ? moment(invoiceMaster.Completion_date).utc().format('YYYY-MM-DD') : moment().format('YYYY-MM-DD')
		}
		else {
			date = (moment(invoiceMaster.Invoice_date).utc().format('YYYY-MM-DD') > checkdate || moment(invoiceMaster.Invoice_date).utc().format('YYYY-MM-DD') == checkdate) ?
				moment(invoiceMaster.Invoice_date).utc().format('YYYY-MM-DD') : moment().format('YYYY-MM-DD')
		}

		//CH2023
		//temporary for inv 2023
		// if (invoiceMaster != null) {
		// 	let tempInvDate = new Date(invoiceMaster.Invoice_date).getFullYear();
		// 	let tempPaymentDate = invoiceMaster.Payment_date != null && invoiceMaster.Payment_date != '' ?new Date(invoiceMaster.Payment_date).getFullYear() : ''


		// 	if (currentdate >=  new Date('2024-01-01') && currentdate <  new Date('09-01-2024') && (tempInvDate < 2024) && invoiceMaster.Invoice_type == 'CR') {
		// 		date = moment().format('2023-12-31')
		// 	}
		// 	else if(currentdate >=  new Date('2024-01-01') && currentdate <  new Date('09-01-2024') && invoiceMaster.Invoice_type == 'AP'){
		// 		let JobComplete = await clsGRPReceipt.getAuditRptData_ByInvNo(invoiceNo)
		// 		if (JobComplete && JobComplete.length > 0 && JobComplete[0].Status == '2') {
		// 			let tempJobComplete = new Date(JobComplete[0].ModifiedDate).getFullYear();
		// 			if (tempJobComplete < 2024) {
		// 				date = moment().format('2023-12-31')
		// 			}
		// 		}
		// 		else {
		// 			return;
		// 		}
		// 	}
		// 	else{
		// 		date = moment().format('YYYY-MM-DD')
		// 	}

		// }
		//CH2023

		//check invoice year 
		let invoiceDate = ''
		if ((moment(invoiceMaster.Invoice_date).utc().format('YYYY-MM-DD') > checkdate || moment(invoiceMaster.Invoice_date).utc().format('YYYY-MM-DD') == checkdate)) {
			invoiceDate = '2022'
		}
		else {
			invoiceDate = '2021'
		}
		description = invoiceMaster.Quotation_no
		roundAdj = invoiceMaster.RoundingAdj

		if (invMaster.DiscountTotal) {
			//get discount amount from tbl_costing 14/11/22
			discountAmt = invMaster.DiscountTotal //disc inc SST
			if (discountAmt > 0) {
				let InvCosting = await oLogicCosting.SelectCostingSheetNoStatus(invoiceMaster.Costing_id)
				if (InvCosting != null && InvCosting.length > 0)
					discountAmt = InvCosting[0].DiscountTotal //disc exc SST
			}
		}
		// if (invMaster.GSTRate) gstRate = invMaster.GSTRate

		//get sst rate from table
		if (invMaster.GSTRate && invMaster.GSTRate != '0' && invMaster.GSTRate != '0.00' && invMaster.GSTRate != '0') {
			if (getGST == 'GST6') {
				let getSST = await this.getSSTFx('6')
				if (getSST) {
					gstRate = getSST.GSTRate
				}
			}

			else {
				let getSST = await this.getSSTFx()
				if (getSST) {
					gstRate = getSST.GSTRate
				}
			}
		}
		else {
			gstRate = 'SSTNT'
		}

		let PartialHeader = 0;
		if (CRMamount > 0 && currency.toUpperCase().includes('MYR')) { //CATER FOR PARTIAL & MYR AS IT WILL SEND ONLY 1 INV ITEM
			let FullInvAmt = 0
			if (objMapping != null && objMapping.length > 0) {
				let TempoObjMapping = objMapping
				objMapping = objMapping.filter(u => u.Item_desc.toUpperCase().replace(/\s+/g, '').includes('APPLICATIONFEE'))
				if (objMapping.length == 0) {
					objMapping = TempoObjMapping[0]
				}
				else {
					objMapping = objMapping[0]
				}

			}

			//GET INV FULL AMT
			let getCreditNoteDetail = await invoiceDetailsdata.GetCreditNote_byInvNoOrCNInvNo(invoiceMaster.Invoice_no)
			if (getCreditNoteDetail != null) {
				FullInvAmt = getCreditNoteDetail.InvoiceAmount
			}

			//GET GST
			let gst = 0, Formula = 0;
			// if(invoiceMaster.GSTRate=='6' ||invoiceMaster.GSTRate=='0.06' ){
			// 	gst = 0.06
			// 	Formula = (100 + 6)/100
			// }
			// else if(invoiceMaster.GSTRate=='10' ||invoiceMaster.GSTRate=='0.10' ){
			// 	gst = 0.10
			// 	Formula = (100 + 10)/100
			// }
			// else{
			// 	gst = 0
			// }

			//get sst rate from table
			if (invoiceMaster.GSTRate && invoiceMaster.GSTRate > 0) {

				let ValPass = ''
				if (getGST == 'GST6') {
					ValPass = '6'
				}

				let getSST = await this.getSSTFx(ValPass)
				if (getSST && getSST.GST_int > 0) {
					gst = getSST.GSTToFixed
					Formula = (100 + getSST.GST_int) / 100
				}
				else {
					gst = 0
				}


			}

			//==START CALCULATION FOR REFUND==//
			let PartialRefund = CRMamount
			let Refund1 = FullInvAmt - PartialRefund
			let SST = gst > 0 ? Refund1 + (Refund1 * gst) : Refund1
			PartialHeader = FullInvAmt.toFixed(2) - SST
			let ItemPrice = Formula > 0 ? PartialHeader / Formula : PartialHeader //Reverse Calculation


			if (currency.includes('MYR')) {

				let element = objMapping
				linkBranch = element.Branch
				let item = {
					Account: {},
					Amount: {},
					DiscountAmount: { value: 0 }, //hardocde
					InventoryID: {},
					ProjectTask: {},
					Qty: {},
					Subaccount: {},
					Subitem: {},
					TaxCategory: {},
					TransactionDescription: {},
					UnitPrice: {},
					UOM: { value: 'EACH' }, //hardcode
					DeferralCode: {},
					TermEndDate: {},
					TermStartDate: {},
				}

				if (eInvoice == true) {
					item.ClassificationCode = {
						value: '022'
					}

					delete item.TermEndDate;
					delete item.TermStartDate;
					delete item.DeferralCode;
				}

				item.Account = {
					value: element ? element.Account : ''
				}
				item.Subaccount = {
					value: element ? element.SubAccount : ''
				}

				item.Amount = {
					value: ItemPrice.toFixed(2)
				}


				if (element.Item_desc.toUpperCase().replace(/\s+/g, '').includes('APPLICATIONFEE') && discountAmt > 0) {
					item.DiscountAmount = {
						//value: (element.Amount - discountAmt).toFixed(2)
						value: (discountAmt).toFixed(2)
					}
				}

				item.Qty = {
					value: '1' //always 1 for partial bcs send only 1 line item
				}

				let getTaxCategory;

				if (element.GSTRate) { //from invoice details ; manual invoice
					getTaxCategory = element.GSTRate == 'SST0' || element.GSTRate == 'SSTNT' ? 'SSTNT' : element.GSTRate
				}
				else { //from invoice mstr

					if (element.Gst_amount == 0.00) { //check gst rate at invoice details; if 0 then sstnt (to cater foreign inv manufacturer but have gst value issue)
						getTaxCategory = 'SSTNT'

					} else { // else; get sst rate from column gstrate tbl invoice mstr
						getTaxCategory = gstRate
					}

				}

				item.TaxCategory = {
					value: getTaxCategory
				}

				if (element.Item_desc) {
					item.TransactionDescription = {
						value: element.Item_desc
					}
				}

				item.UnitPrice = {
					value: ItemPrice.toFixed(2)
				}
				aryDetail.push(item)

			}
			else {

				let element = objMapping
				linkBranch = element.Branch
				let item = {
					Account: {},
					Amount: {},
					DiscountAmount: { value: 0 }, //hardocde
					InventoryID: {},
					ProjectTask: {},
					Qty: {},
					Subaccount: {},
					Subitem: {},
					TaxCategory: {},
					TransactionDescription: {},
					UnitPrice: {},
					UOM: { value: 'EACH' }, //hardcode
					DeferralCode: {},
					TermEndDate: {},
					TermStartDate: {},
				}
				if (eInvoice == true) {
					item.ClassificationCode = {
						value: '022'
					}
					delete item.TermEndDate;
					delete item.TermStartDate;
					delete item.DeferralCode;
				}

				item.Account = {
					value: element ? element.Account : ''
				}
				item.Subaccount = {
					value: element ? element.SubAccount : ''
				}

				item.Amount = {
					value: ItemPrice.toFixed(2)
				}

				//revised requirement: amount = total amount - tax (subtotal)
				if (element.Item_desc.toUpperCase().replace(/\s+/g, '').includes('APPLICATIONFEE') && discountAmt > 0) {
					item.DiscountAmount = {
						//value: (element.Amount - discountAmt).toFixed(2)
						value: (discountAmt).toFixed(2)

					}
				}


				item.Qty = {
					value: '1'
				}


				let getTaxCategory;

				if (element.GSTRate) { //from invoice details ; manual invoice
					getTaxCategory = element.GSTRate == 'SST0' || element.GSTRate == 'SSTNT' ? 'SSTNT' : element.GSTRate

				}
				else { //from invoice mstr

					if (element.Gst_amount == 0.00) { //check gst rate at invoice details; if 0 then sstnt (to cater foreign inv manufacturer but have gst value issue)

						getTaxCategory = 'SSTNT'

					} else { // else; get sst rate from column gstrate tbl invoice mstr
						getTaxCategory = gstRate
						// }
					}

				}

				item.TaxCategory = {
					value: getTaxCategory
				}


				if (element.Item_desc) {
					item.TransactionDescription = {
						value: element.Item_desc
					}
				}


				item.UnitPrice = {
					value: ItemPrice.toFixed(2)
				}


				aryDetail.push(item)
			}
		}
		else {
			if (currency.includes('MYR')) {

				for (let x in objMapping) {
					let element = objMapping[x]
					linkBranch = element.Branch
					let item = {
						Account: {},
						Amount: {},
						DiscountAmount: { value: 0 }, //hardocde
						// ExtendedPrice: {},
						InventoryID: {},
						ProjectTask: {},
						Qty: {},
						Subaccount: {},
						Subitem: {},
						TaxCategory: {},
						TransactionDescription: {},
						UnitPrice: {},
						UOM: { value: 'EACH' }, //hardcode
						DeferralCode: {},
						TermEndDate: {},
						TermStartDate: {},
					}

					if (eInvoice == true) {
						item.ClassificationCode = {
							value: '022'
						}
						delete item.TermEndDate;
						delete item.TermStartDate;
						delete item.DeferralCode;
					}

					// if (element.Income_code) {
					item.Account = {
						value: element ? element.Account : ''
					}
					item.Subaccount = {
						value: element ? element.SubAccount : ''
					}
					// }

					// if (element.Total_amount) {
					// 	item.Amount = {
					// 		value: (element.Total_amount).toFixed(2)
					// 	}
					// }

					// if (element.Item_desc.toUpperCase().replace(/\s+/g, '').includes('APPLICATIONFEE') && discountAmt > 0) {
					// 	item.DiscountAmount = {
					// 		value: (element.Total_amount - discountAmt).toFixed(2)
					// 	}
					// }
					//revised requirement: amount = sub total (total - tax)
					if (element.Amount) {
						item.Amount = {
							value: (element.Amount).toFixed(2)
						}
					}

					//revised requirement: amount = sub total (total - tax)
					if (element.Item_desc.toUpperCase().replace(/\s+/g, '').includes('APPLICATIONFEE') && discountAmt > 0) {
						item.DiscountAmount = {
							//value: (element.Amount - discountAmt).toFixed(2)
							value: (discountAmt).toFixed(2)
						}
					}


					// item.ExtendedPrice = {
					// 	value: 0
					// }

					// if (element.ManHour) {
					// 	item.Qty = {
					// 		value: element.ManHour
					// 	}
					// } else {
					// 	item.Qty = {
					// 		value: element.No_of_unit
					// 	}
					// }

					item.Qty = {
						value: element.Amount == element.Unit_price ? '1' : element.No_of_unit // by default 1 ; 16Jan23
					}

					let getTaxCategory;

					if (element.GSTRate) { //from invoice details ; manual invoice
						// if (type == 'CRM') {
						// 	getTaxCategory = 'SSTNT' //invoice 2021 no sst
						// }
						// else if (invoiceDate == '2022' || invoiceDate == '2021') {
						getTaxCategory = element.GSTRate == 'SST0' || element.GSTRate == 'SSTNT' ? 'SSTNT' : element.GSTRate
						// }

					}
					else { //from invoice mstr

						if (element.Gst_amount == 0.00) { //check gst rate at invoice details; if 0 then sstnt (to cater foreign inv manufacturer but have gst value issue)

							getTaxCategory = 'SSTNT'

						} else { // else; get sst rate from column gstrate tbl invoice mstr
							// if (type == 'CRM') {
							// 	getTaxCategory = 'SSTNT' //invoice 2021 no sst
							// }
							// else if (invoiceDate == '2022' || invoiceDate == '2021') {
							getTaxCategory = gstRate
							// }

						}

					}

					item.TaxCategory = {
						// value: element.GSTRate ? element.GSTRate : 'SST' + Number(gstRate * 100) //item.GSTRate use for manual invoice
						value: getTaxCategory
					}

					if (element.Item_desc) {
						item.TransactionDescription = {
							value: element.Item_desc
						}
					}

					if (element.Unit_price) {
						item.UnitPrice = {
							value: (element.Unit_price).toFixed(2)
						}
					}
					else {

						item.UnitPrice = {
							value: (element.Amount / element.No_of_unit).toFixed(2)
						}

					}
					aryDetail.push(item)
				}
			}
			else {

				for (let x in objMapping) {
					let element = objMapping[x]
					linkBranch = element.Branch
					let item = {
						Account: {},
						Amount: {},
						DiscountAmount: { value: 0 }, //hardocde
						// ExtendedPrice: {},
						InventoryID: {},
						ProjectTask: {},
						Qty: {},
						Subaccount: {},
						Subitem: {},
						TaxCategory: {},
						TransactionDescription: {},
						UnitPrice: {},
						UOM: { value: 'EACH' }, //hardcode
						DeferralCode: {},
						TermEndDate: {},
						TermStartDate: {},
					}

					if (eInvoice == true) {
						item.ClassificationCode = {
							value: '022'
						}
						delete item.TermEndDate;
						delete item.TermStartDate;
						delete item.DeferralCode;
					}
					// if (element.Income_code) {
					item.Account = {
						value: element ? element.Account : ''
					}
					item.Subaccount = {
						value: element ? element.SubAccount : ''
					}
					// }

					// if (element.Total_amount) {
					// 	item.Amount = {
					// 		value: (element.Total_amount).toFixed(2)
					// 	}
					// }

					// if (element.Item_desc.toUpperCase().replace(/\s+/g, '').includes('APPLICATIONFEE') && discountAmt > 0) {
					// 	item.DiscountAmount = {
					// 		value: (element.Total_amount - discountAmt).toFixed(2)
					// 	}
					// }

					//revised requirement: amount = total amount - tax (subtotal)
					if (element.Amount) {
						item.Amount = {
							value: (element.Amount).toFixed(2)
						}
					}
					//revised requirement: amount = total amount - tax (subtotal)
					if (element.Item_desc.toUpperCase().replace(/\s+/g, '').includes('APPLICATIONFEE') && discountAmt > 0) {
						item.DiscountAmount = {
							//value: (element.Amount - discountAmt).toFixed(2)
							value: (discountAmt).toFixed(2)

						}
					}


					// item.ExtendedPrice = {
					// 	value: 0
					// }

					// if (element.ManHour) {
					// 	item.Qty = {
					// 		value: element.ManHour
					// 	}
					// } else {
					// 	item.Qty = {
					// 		value: element.No_of_unit
					// 	}
					// }

					item.Qty = {
						value: element.Amount == element.Unit_price ? '1' : element.No_of_unit // by default 1 ; 16Jan23
					}


					let getTaxCategory;

					if (element.GSTRate) { //from invoice details ; manual invoice
						// if (type == 'CRM') {
						// 	getTaxCategory = 'SSTNT' //invoice 2021 no sst
						// }
						// else if (invoiceDate == '2022' || invoiceDate == '2021') {
						getTaxCategory = element.GSTRate == 'SST0' || element.GSTRate == 'SSTNT' ? 'SSTNT' : element.GSTRate
						// }

					}
					else { //from invoice mstr

						if (element.Gst_amount == 0.00) { //check gst rate at invoice details; if 0 then sstnt (to cater foreign inv manufacturer but have gst value issue)

							getTaxCategory = 'SSTNT'

						} else { // else; get sst rate from column gstrate tbl invoice mstr
							// if (type == 'CRM') {
							// 	getTaxCategory = 'SSTNT' //invoice 2021 no sst
							// }
							// else if (invoiceDate == '2022' || invoiceDate == '2021') {
							getTaxCategory = gstRate
							// }
						}

					}

					item.TaxCategory = {
						// value: element.GSTRate ? element.GSTRate : 'SST' + Number(gstRate * 100) //item.GSTRate use for manual invoice
						value: getTaxCategory
					}

					// item.custom = {
					// 	Transactions: {
					// 		TaxCategoryID: {
					// 			type: "CustomStringField",
					// 			value: getTaxCategory
					// 		}
					// 	}
					// }

					if (element.Item_desc) {
						item.TransactionDescription = {
							value: element.Item_desc
						}
					}

					if (element.Unit_price) {
						item.UnitPrice = {
							value: (element.Unit_price).toFixed(2)
						}
					}
					else {

						item.UnitPrice = {
							value: (element.Amount / element.No_of_unit).toFixed(2)
						}

					}

					aryDetail.push(item)
				}
			}
		}


		//commented - saf 9/2/2022 ; dont need submit rounding adjustment item
		// if (roundAdj && roundAdj != 0.00) { //if invoice has adjustment, amount = -adjustment

		// 	let adItem = {
		// 		Account: {},
		// 		Amount: {},
		// 		DiscountAmount: { value: '0' },
		// 		// ExtendedPrice: {},
		// 		InventoryID: {},
		// 		ProjectTask: {},
		// 		Qty: {},
		// 		Subaccount: {},
		// 		Subitem: {},
		// 		TaxCategory: {},
		// 		TransactionDescription: {},
		// 		UnitPrice: {},
		// 		UOM: { value: 'EACH' }, //hardcode
		// 		DeferralCode: {},
		// 		TermEndDate: {},
		// 		TermStartDate: {}
		// 	}

		// 	adItem.Account = {
		// 		value: '71314' //fix value for adjustment
		// 	}
		// 	adItem.Subaccount = {
		// 		value: '1-R451-G-00000000' //fix value for adjustment
		// 	}

		// 	adItem.Amount = {
		// 		value: roundAdj.toFixed(2)
		// 	}

		// 	adItem.DiscountAmount = {
		// 		value: 0.00
		// 	}

		// 	// adItem.ExtendedPrice = {
		// 	// 	value: 0.00
		// 	// }

		// 	adItem.Qty = {
		// 		value: 1 //fixed for rounding
		// 	}

		// 	adItem.TaxCategory = {
		// 		value: 'SSTNT' //fixed SST for rounding SST0
		// 	}

		// 	adItem.TransactionDescription = {
		// 		value: 'Rounding Adjustment' //fixed desc for rounding
		// 	}

		// 	adItem.UnitPrice = {
		// 		value: roundAdj.toFixed(2)
		// 	}

		// 	aryDetail.push(adItem)

		// }


		if (aryDetail.length == 0) {
			console.log('No items added to Detail array!' + invoiceMaster.Invoice_no)
		}

		let reqBody = {}

		if (currency.includes('MYR')) {
			reqBody = {
				Type: {
					value: type
				},
				Amount: {
					value: amount.toFixed(2)
				},
				Currency: {
					value: currency
				},
				Customer: {
					value: customer
				},
				CustomerOrder: {
					value: customerOrder
				},
				LocationID: {
					value: LocationID
				},
				Date: {
					value: type == 'CRM' ? moment().format('YYYY-MM-DD') : date
					// value: date //CH2023

				},
				Description: {
					value: description
				},
				Details: [],
				Hold: {
					value: hold //hardcode
				},
				Project: {
					value: 'X' //fix value
				},
				LinkBranch: {
					value: linkBranch
				}
			}
			if (eInvoice == true) {
				reqBody.custom = {
					Document: {
						AttributeCALLURL: {
							type: "CustomStringField",
							value: get_eInvCallBack()
						},
						AttributeEXTSYSTEM: {
							type: "CustomStringField",
							value: "eSCIS"
						}

					}
				}
			}
		}
		else {
			reqBody = {
				Type: {
					value: type
				},
				Amount: {
					value: amount.toFixed(2)
				},
				Currency: {
					value: currency
				},
				Customer: {
					value: customer
				},
				CustomerOrder: {
					value: customerOrder
				},
				LocationID: {
					value: LocationID
				},
				Date: {
					value: type == 'CRM' ? moment().format('YYYY-MM-DD') : date
					// value: date //CH2023

				},
				Description: {
					value: description
				},
				Details: [],
				Hold: {
					value: hold //hardcode
				},
				Project: {
					value: 'X' //fix value
				},
				LinkBranch: {
					value: linkBranch
				}
				// custom: {
				// 	Document: {
				// 		CuryID: {
				// 			type: "CustomStringField",
				// 			value: currency
				// 		}
				// 	}
				// }
			}
			if (eInvoice == true) {
				reqBody.custom = {
					Document: {
						AttributeCALLURL: {
							type: "CustomStringField",
							value: get_eInvCallBack()
						},
						AttributeEXTSYSTEM: {
							type: "CustomStringField",
							value: "eSCIS"
						}
					}
				}
			}
		}

		reqBody.Details = aryDetail

		return resObj = { status: resStatus, obj: reqBody }
	}
	catch (err) {
		loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
		console.log(err)
	}
}

exports.remapAccount = async (resAccount) => {
	try {

		let remapdata = {}
		remapdata.resId = resAccount.id
		remapdata.note = resAccount.note
		remapdata.custom = resAccount.custom ? resAccount.custom.value : resAccount.custom

		remapdata.Amount = resAccount.Amount ? resAccount.Amount.value : resAccount.Amount
		remapdata.Balance = resAccount.Balance ? resAccount.Balance.value : resAccount.Balance
		remapdata.BillingPrinted = resAccount.BillingPrinted ? resAccount.BillingPrinted.value : resAccount.BillingPrinted
		remapdata.CreatedDateTime = resAccount.CreatedDateTime ? moment(resAccount.CreatedDateTime.value).format('YYYY-MM-DD HH:mm:ss') : resAccount.CreatedDateTime
		remapdata.Currency = resAccount.Currency ? resAccount.Currency.value : resAccount.Currency
		remapdata.CustomerOrder = resAccount.CustomerOrder ? resAccount.CustomerOrder.value : resAccount.CustomerOrder
		remapdata.Customer = resAccount.Customer ? resAccount.Customer.value : resAccount.Customer
		remapdata.Date = resAccount.Date ? moment(resAccount.Date.value).format('YYYY-MM-DD HH:mm:ss') : resAccount.Date
		remapdata.Description = resAccount.Description ? resAccount.Description.value : resAccount.Description
		remapdata.DueDate = resAccount.DueDate ? moment(resAccount.DueDate.value).format('YYYY-MM-DD HH:mm:ss') : resAccount.DueDate
		remapdata.Hold = resAccount.Hold ? resAccount.Hold.value : resAccount.Hold
		remapdata.LastModifiedDateTime = resAccount.LastModifiedDateTime ? moment(resAccount.LastModifiedDateTime.value).format('YYYY-MM-DD HH:mm:ss') : resAccount.LastModifiedDateTime
		remapdata.LinkARAccount = resAccount.LinkARAccount ? resAccount.LinkARAccount.value : resAccount.LinkARAccount
		remapdata.LinkARSubAccount = resAccount.LinkARSubAccount ? resAccount.LinkARSubAccount.value : resAccount.LinkARSubAccount
		remapdata.LinkBranch = resAccount.LinkBranch ? resAccount.LinkBranch.value : resAccount.LinkBranch
		remapdata.OriginalDocument = resAccount.OriginalDocument ? resAccount.OriginalDocument.value : resAccount.OriginalDocument
		remapdata.PostPeriod = resAccount.PostPeriod ? resAccount.PostPeriod.value : resAccount.PostPeriod
		remapdata.Project = resAccount.Project ? resAccount.Project.value : resAccount.Project
		remapdata.ReferenceNbr = resAccount.ReferenceNbr ? resAccount.ReferenceNbr.value : resAccount.ReferenceNbr
		remapdata.Status = resAccount.Status ? resAccount.Status.value : resAccount.Status
		remapdata.TaxTotal = resAccount.TaxTotal ? resAccount.TaxTotal.value : resAccount.TaxTotal
		remapdata.Terms = resAccount.Terms ? resAccount.Terms.value : resAccount.Terms
		remapdata.Type = resAccount.Type ? resAccount.Type.value : resAccount.Type

		return remapdata
	}
	catch (err) {
		loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
		console.log(err)
	}
}

exports.remapAccountDtl = async (objDtl) => {
	try {

		let remapdata = {}

		remapdata.Balance = objDtl.Balance ? objDtl.Balance.value : objDtl.Balance,
			remapdata.Branch = objDtl.Branch ? objDtl.Branch.value : objDtl.Branch,
			remapdata.custom = objDtl.custom ? objDtl.custom.value : objDtl.custom,

			remapdata.Account = objDtl.Account ? objDtl.Account.value : objDtl.Account
		remapdata.Amount = objDtl.Amount ? objDtl.Amount.value : objDtl.Amount
		remapdata.DeferralCode = objDtl.DeferralCode ? objDtl.DeferralCode.value : objDtl.DeferralCode
		remapdata.DiscountAmount = objDtl.DiscountAmount ? objDtl.DiscountAmount.value : objDtl.DiscountAmount
		// remapdata.ExtendedPrice = objDtl.ExtendedPrice ? objDtl.ExtendedPrice.value : objDtl.ExtendedPrice
		remapdata.InventoryID = objDtl.InventoryID ? objDtl.InventoryID.value : objDtl.InventoryID
		remapdata.LastModifiedDateTime = objDtl.LastModifiedDateTime ? moment(objDtl.LastModifiedDateTime.value).format('YYYY-MM-DD HH:mm:ss') : objDtl.LastModifiedDateTime
		remapdata.LineNbr = objDtl.LineNbr ? objDtl.LineNbr.value : objDtl.LineNbr
		remapdata.ProjectTask = objDtl.ProjectTask ? objDtl.ProjectTask.value : objDtl.ProjectTask
		remapdata.Qty = objDtl.Qty ? objDtl.Qty.value : objDtl.Qty
		remapdata.Subaccount = objDtl.Subaccount ? objDtl.Subaccount.value : objDtl.Subaccount
		remapdata.TaxCategory = objDtl.TaxCategory ? objDtl.TaxCategory.value : objDtl.TaxCategory
		remapdata.TermEndDate = objDtl.TermEndDate ? moment(objDtl.TermEndDate.value).format('YYYY-MM-DD HH:mm:ss') : objDtl.TermEndDate
		remapdata.TermStartDate = objDtl.TermStartDate ? moment(objDtl.TermStartDate.value).format('YYYY-MM-DD HH:mm:ss') : objDtl.TermStartDate
		remapdata.TransactionDescription = objDtl.TransactionDescription ? objDtl.TransactionDescription.value : objDtl.TransactionDescription
		remapdata.UnitPrice = objDtl.UnitPrice ? objDtl.UnitPrice.value : objDtl.UnitPrice
		remapdata.UOM = objDtl.UOM ? objDtl.UOM.value : objDtl.UOM


		return remapdata
	}
	catch (err) {
		loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
		console.log(err)
	}
}
exports.insertDetail = async (objDtl, Method, req = '', res = '') => {
	try {
		let insertDtl = 1

		if (Method.toUpperCase() == 'GET') {
			let getInvDtl = await clsGRPInvoice.SelectGRPInvoiceDtl_Method_id(objDtl.id, Method).catch((e) => { loggers.logError(loggers.thisLine2() + ':' + `${e}`) })
			if (getInvDtl && getInvDtl.length > 0) {
				insertDtl = 0;
			}
		}
		else { //always save 'put' record

		}

		if (insertDtl == 1) {
			let remapdata = {
				id: objDtl.id,
				rowNumber: objDtl.rowNumber ? objDtl.rowNumber : '',
				note: objDtl.note ? objDtl.note : '',
				Amount: objDtl.Amount && objDtl.Amount.value ? objDtl.Amount.value : '',
				Balance: objDtl.Balance && objDtl.Balance.value ? objDtl.Balance.value : 0.00,
				BillingPeriod: objDtl.BillingPeriod && objDtl.BillingPeriod.value ? objDtl.BillingPeriod.value : '',
				BillingPrinted: objDtl.BillingPrinted && objDtl.BillingPrinted.value == true ? 1 : objDtl.BillingPrinted && objDtl.BillingPrinted.value == false ? false : '',
				ClassificationCode: objDtl.Details && objDtl.Details[0].ClassificationCode && objDtl.Details[0].ClassificationCode.value ? objDtl.Details[0].ClassificationCode.value : '',
				CreatedDateTime: objDtl.CreatedDateTime && objDtl.CreatedDateTime.value ? objDtl.CreatedDateTime.value : '',
				Currency: objDtl.Currency && objDtl.Currency.value ? objDtl.Currency.value : '',
				Customer: objDtl.Customer && objDtl.Customer.value ? objDtl.Customer.value : '',
				CustomerOrder: objDtl.CustomerOrder && objDtl.CustomerOrder.value ? objDtl.CustomerOrder.value : '',
				Date: objDtl.Date && objDtl.Date.value ? objDtl.Date.value : '',
				Description: objDtl.Description && objDtl.Description.value ? objDtl.Description.value : '',
				DigitalSign: objDtl.DigitalSign && objDtl.DigitalSign.value ? objDtl.DigitalSign.value : '',
				DueDate: objDtl.DueDate && objDtl.DueDate.value ? objDtl.DueDate.value : '',
				FrequencyofBilling: objDtl.FrequencyofBilling && objDtl.FrequencyofBilling.value ? objDtl.FrequencyofBilling.value : '',
				Hold: objDtl.Hold && objDtl.Hold.value == true ? true : objDtl.Hold && objDtl.Hold.value == false ? false : '',
				LastModifiedDateTime: objDtl.LastModifiedDateTime && objDtl.LastModifiedDateTime.value ? objDtl.LastModifiedDateTime.value : '',
				LinkARAccount: objDtl.LinkARAccount && objDtl.LinkARAccount.value ? objDtl.LinkARAccount.value : '',
				LinkARSubAccount: objDtl.LinkARSubAccount && objDtl.LinkARSubAccount.value ? objDtl.LinkARSubAccount.value : '',
				LinkBranch: objDtl.LinkBranch && objDtl.LinkBranch.value ? objDtl.LinkBranch.value : '',
				LocationID: objDtl.LocationID && objDtl.LocationID.value ? objDtl.LocationID.value : '',
				OriginalDocument: objDtl.OriginalDocument && objDtl.OriginalDocument.value ? objDtl.OriginalDocument.value : '',
				PostPeriod: objDtl.PostPeriod && objDtl.PostPeriod.value ? objDtl.PostPeriod.value : '',
				Project: objDtl.Project && objDtl.Project.value ? objDtl.Project.value : '',
				ReferenceNbr: objDtl.ReferenceNbr && objDtl.ReferenceNbr.value ? objDtl.ReferenceNbr.value : '',
				Status: objDtl.Status && objDtl.Status.value ? objDtl.Status.value : '',
				TaxTotal: objDtl.TaxTotal && objDtl.TaxTotal.value ? objDtl.TaxTotal.value : 0,
				Terms: objDtl.Terms && objDtl.Terms.value ? objDtl.Terms.value : '',
				Type: objDtl.Type && objDtl.Type.value ? objDtl.Type.value : '',
				custom: objDtl.custom && objDtl.custom.Document && objDtl.custom.Document.AttributeCALLURL && objDtl.custom.Document.AttributeCALLURL.value ? objDtl.custom.Document.AttributeCALLURL.value : '',
				CreatedDate: Now,
				ModifiedDate: Now,
				Method: Method.toUpperCase(),
				reqJSON: req ? req : null,
				resJSON: res ? res : null
			}

			await clsGRPInvoice.InsertGRPInvoiceDetail(remapdata).catch((e) => { loggers.logError(loggers.thisLine2() + ':' + `${e}`) })
		}
	}
	catch (err) {
		loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
		console.log(err)
	}
}

exports.putSingleInvoice = async (req, res) => {
	try {

		let invoice = null
		let invoiceArray = null
		if (req.body && req.body.length > 0) {

			invoiceArray = req.body

		}
		else {

			invoice = req.body.invoiceNo
		}

		let type = 'CR'
		if (req.body.type != undefined) {

			type = req.body.type

		}

		if (invoiceArray) {

			for (let data = 0; data < invoiceArray.length; data++) {
				if (commanConstants.EnableIGST == commanConstants.Yes) {
					this.putInvoice(invoiceArray[data].invoiceNo, invoiceArray[data].type)
				}
			}

		} else {
			if (commanConstants.EnableIGST == commanConstants.Yes) {
				this.putInvoice(invoice, type)
			}
		}
		res.status(200).json("ok")
	}
	catch (err) {
		loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
		console.log(err)
	}
}


exports.putSingleCRM = async (req, res = null) => {
	try {

		let invoice = null
		let invoiceArray = null

		invoice = req

		let type = 'CRM'


		if (invoiceArray) {

			for (let data = 0; data < invoiceArray.length; data++) {


				let paramsINV = `%24filter=CustomerOrder eq '${invoiceArray[data].invoiceNo.substring(3)}' and Type eq 'Credit Memo' and Status ne 'Closed'`
				let getInvoice = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.Invoice, paramsINV)
				loggers.logError(loggers.thisLine2() + ': ' + `${'getInvoice - putSingleCRM' + JSON.stringify(getInvoice)}`)

				console.log('getInvoice' + JSON.stringify(getInvoice))

				if (getInvoice && getInvoice.length > 0) { //eInvoice - save respond from myfast
					for (let x in getInvoice) {
						await this.insertDetail(getInvoice[x], 'GET', '', JSON.stringify(getInvoice[x].obj))
					}
				}

				if ((getInvoice && getInvoice.length == 0) || getInvoice == null) { //send request to myfast then insert into db data from sent request 

					let getInvoiceData = await clsGRPInvoice.SelectReqData(invoiceArray[data].invoiceNo)
					if (getInvoiceData && getInvoiceData.length > 0) {
						getInvoiceData = JSON.parse(getInvoiceData[0].reqData)

						if (getInvoiceData != '' && getInvoiceData.Type.value == 'Invoice') {
							getInvoiceData.Type.value = 'CRM'
						}
					}
					else {
						return;
					}
					if (putData == true) {
						let resAccount = await ctlAccessToken.putData(ctlAccessToken.apiRoutes.Invoice, '', getInvoiceData)
						if (resAccount && resAccount.id != null && resAccount.id != '') {  //eInvoice - save respond from myfast
							await this.insertDetail(resAccount, 'PUT', JSON.stringify(getInvoiceJSON), JSON.stringify(resAccount))
						}
						if (resAccount && resAccount.id) {

							console.log('response requestFormatARBilling')
							console.log(JSON.stringify(resAccount))
							// update -store response in grp invoice tbl 


							let mappedAcc = await this.remapAccount(resAccount)

							mappedAcc.reqData = getInvoiceData
							mappedAcc.invoiceNo = invoiceArray[data].invoiceNo
							mappedAcc.Type = 'CRM'
							mappedAcc.resData = JSON.stringify(resAccount)
							mappedAcc.resStatus = "1"
							let getURL = await ctlAccessToken.apiRoutes.Account

							if (getURL != null && getURL != '' && getURL.includes('moquer')) {

								mappedAcc.note = 'staging'

							}
							else {
								mappedAcc.note = 'production'
							}

							await clsGRPInvoice.InsertGRPInvoice(mappedAcc)

							let objDtl = resAccount.Details

							for (let x in objDtl) {
								let mappedDtl = await this.remapAccountDtl(objDtl)

								mappedDtl.RefId = getGRPRecId
								mappedDtl.resId = objDtl[x].id
								mappedDtl.rowNumber = objDtl[x].rowNumber
								mappedDtl.note = objDtl[x].note
								mappedDtl.CreatedDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')

								await clsGRPInvoice.InsertGRPInvoiceDtl(mappedDtl)
							}


							obj.msg = "success"
							obj.status = true
							obj.data = resAccount
							return obj
						}
					}

				}
				else {

					let mappedAcc = {}

					mappedAcc.invoiceNo = invoiceNo
					mappedAcc.resStatus = "2"
					let getURL = await ctlAccessToken.apiRoutes.Account

					if (getURL != null && getURL != '' && getURL.includes('moquer')) {

						mappedAcc.note = 'staging'

					}
					else {
						mappedAcc.note = 'production'
					}

					mappedAcc.Remark = getInvoice != null & getInvoice.length >= 1 && getInvoice.message != '' ? getInvoice.message : 'INTEGRATION WITH MYFAST FAILED!'

					await clsGRPInvoice.UpdateGRPInvoice(mappedAcc, type)

					obj.msg = "ID2: " + getInvoice.message
					obj.status = false
					obj.data = {}
					return obj
				}

				await Receipt.putReceipt(invoiceArray[data].invoiceNo, '3')
			}

		} else {

			let paramsINV = `%24filter=CustomerOrder eq '${invoice.substring(3)}' and Type eq 'Credit Memo' and Status ne 'Closed'`
			let getInvoice = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.Invoice, paramsINV)
			loggers.logError(loggers.thisLine2() + ': ' + `${'getInvoice - putSingleCRM2' + JSON.stringify(getInvoice)}`)

			if (getInvoice && getInvoice.length > 0) { //eInvoice - save respond from myfast
				for (let x in getInvoice) {
					await this.insertDetail(getInvoice[x], 'GET', '', JSON.stringify(getInvoice[x].obj))
				}
			}

			console.log('getInvoice' + JSON.stringify(getInvoice))
			if ((getInvoice && getInvoice.length == 0) || getInvoice == null) { //send request to myfast then insert into db data from sent request 

				let getInvoiceData = await clsGRPInvoice.SelectReqData((invoice))
				if (getInvoiceData && getInvoiceData.length > 0) {
					getInvoiceData = JSON.parse(getInvoiceData[0].reqData)

					if (getInvoiceData != '' && getInvoiceData.Type.value == 'Invoice') {
						getInvoiceData.Type.value = 'CRM'
					}
				}
				else {
					return;
				}
				if (putData == true) {
					let resAccount = await ctlAccessToken.putData(ctlAccessToken.apiRoutes.Invoice, '', getInvoiceData)
					if (resAccount && resAccount.id != null && resAccount.id != '') {  //eInvoice - save respond from myfast
						await this.insertDetail(resAccount, 'PUT', JSON.stringify(getInvoiceData), JSON.stringify(resAccount))
					}
					if (resAccount && resAccount.id) {

						console.log('response requestFormatARBilling')
						console.log(JSON.stringify(resAccount))
						// update -store response in grp invoice tbl 


						let mappedAcc = await this.remapAccount(resAccount)

						mappedAcc.reqData = getInvoiceData
						mappedAcc.invoiceNo = invoice
						mappedAcc.type = 'CRM'
						mappedAcc.resData = JSON.stringify(resAccount)
						mappedAcc.resStatus = "1"
						let getURL = await ctlAccessToken.apiRoutes.Account

						if (getURL != null && getURL != '' && getURL.includes('moquer')) {

							mappedAcc.note = 'staging'

						}
						else {
							mappedAcc.note = 'production'
						}

						let dataReturn = await clsGRPInvoice.InsertGRPInvoice(mappedAcc)
						let getGRPRecId = dataReturn[0].RecId

						let objDtl = resAccount.Details

						for (let x in objDtl) {
							let mappedDtl = await this.remapAccountDtl(objDtl)

							mappedDtl.RefId = getGRPRecId
							mappedDtl.resId = objDtl[x].id
							mappedDtl.rowNumber = objDtl[x].rowNumber
							mappedDtl.note = objDtl[x].note
							mappedDtl.CreatedDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')

							await clsGRPInvoice.InsertGRPInvoiceDtl(mappedDtl)
						}


						obj.msg = "success"
						obj.status = true
						obj.data = resAccount
						return obj
					}
				}

			}
			else {

				let mappedAcc = {}

				mappedAcc.invoiceNo = invoice
				mappedAcc.resStatus = "2"
				let getURL = await ctlAccessToken.apiRoutes.Account

				if (getURL != null && getURL != '' && getURL.includes('moquer')) {

					mappedAcc.note = 'staging'

				}
				else {
					mappedAcc.note = 'production'
				}

				mappedAcc.Remark = getInvoice != null & getInvoice.length >= 1 && getInvoice.message != '' ? getInvoice.message : 'INTEGRATION WITH MYFAST FAILED!'

				await clsGRPInvoice.UpdateGRPInvoice(mappedAcc, type)

				obj.msg = "ID2: " + getInvoice.message
				obj.status = false
				obj.data = {}
				return obj
			}

			await Receipt.putReceipt(invoice, '3')


		}
		//res.status(200).json("ok")
	}
	catch (err) {
		loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
		console.log(err)
	}
}

exports.putSingleCRMver1 = async (req, res) => {
	try {

		let invoice = null
		let invoiceArray = null
		if (req.body && req.body.length > 0) {

			invoiceArray = req.body

		}
		else {

			invoice = req.body.invoiceNo
		}

		let type = 'CRM'
		if (req.body.type != undefined) {

			type = req.body.type

		}

		if (invoiceArray) {

			for (let data = 0; data < invoiceArray.length; data++) {
				if (commanConstants.EnableIGST == commanConstants.Yes) {
					await this.putInvoice(invoiceArray[data].invoiceNo, invoiceArray[data].type)
					await Receipt.putReceipt(invoiceArray[data].invoiceNo, '3')
				}

			}

		} else {
			if (commanConstants.EnableIGST == commanConstants.Yes) {
				await this.putInvoice(invoice, type)
				await Receipt.putReceipt(invoice, '3')
			}


		}
		res.status(200).json("ok")
	}
	catch (err) {
		loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
		console.log(err)
	}
}

exports.StatusCRM = async (invoiceNo) => {
	//stand alone CRM if receipt & inv in myfast close
	/* 7APR23- NO NEED TO CHECK BOTH STATUS CLOSE, ONLY CHECK THE EXISTANCE (HAWARI REQUEST) */
	try {
		let currentInv = false, passInv = false;
		let checkdate = moment(new Date('2022-01-01')).format('YYYY');
		let getInvoiceMaster = await oLogicInvoice.SelectInvoiceMasterbyInvoiceNo(invoiceNo);
		let invoiceMstr = getInvoiceMaster[0];
		let invoiceDate = moment(invoiceMstr.Invoice_date).format('YYYY');

		if (invoiceDate >= checkdate) {
			currentInv = true;
		}
		else {
			passInv = false; //invoice 2021
		}

		//check Invoice status ( get from myfast)
		let invOpen = true, receiptOpen = true;
		let accessTokenInv = await ctlAccessToken.getAccessToken();
		let paramsINV = `%24filter=CustomerOrder eq '${invoiceNo.substring(3)}' and Type eq 'Invoice'`
		let getInvoice = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.Invoice, paramsINV)
		loggers.logError(loggers.thisLine2() + ': ' + `${'getInvoice - Check CRM Status' + JSON.stringify(getInvoice)}`)
		if (getInvoice && getInvoice.length > 0) {
			// let getInvoice1 = getInvoice.filter(tbl => tbl.Status.value == 'Closed')
			// if (getInvoice1.length == getInvoice.length) {
			invOpen = false //inv close
			// }

			if (getInvoice && getInvoice.length > 0) { //eInvoice - save respond from myfast
				for (let x in getInvoice) {
					await this.insertDetail(getInvoice[x], 'GET', '', JSON.stringify(getInvoice[x].obj))
				}
			}
		}
		else {
			loggers.logError(loggers.thisLine2() + ': ' + `${'open inv exist!' + JSON.stringify(invoiceNo)}`)
		}

		//check Receipt status ( get from myfast)
		let getReceiptNo;
		if (currentInv == true) {
			if (invoiceMstr.Receipt_no == '') {
				getReceiptNo = await clsGRPInvoice.SelectCreditNote_InvoiceId(invoiceMstr.Id)
				invoiceMstr.Receipt_no = getReceiptNo[0].CNReceiptNo
			}
			// let accessTokenReceipt = await ctlAccessToken.getAccessTokenPayment();
			let paramsReceipt = `%24filter=PaymentRef eq '${invoiceMstr.Receipt_no != null ? (invoiceMstr.Receipt_no).substring(3) : ""}'`
			let getPayment = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.PaymentGet, paramsReceipt)
			loggers.logError(loggers.thisLine2() + ': ' + `${'getReceipt- Check CRM Status' + JSON.stringify(getPayment)}`)
			if (getPayment && getPayment.length > 0) {
				getPayment = getPayment.filter(tbl => tbl.Type.value != 'Voided Payment' || tbl.Type.value != 'Voided Prepayment' || tbl.Status.value != 'Voided' || tbl.Status.value != 'Voided Payment' || tbl.Status.value != 'Voided Prepayment')
				let getPayment1 = getPayment.filter(tbl => tbl.Type.value == 'Prepayment' || tbl.Type.value == 'Payment')
				if (getPayment1.length == getPayment.length) {
					receiptOpen = false //inv close
				}
			}
			else {
				loggers.logError(loggers.thisLine2() + ': ' + `${'open receipt exist!' + JSON.stringify(invoiceNo)}`)
			}
		}

		if (receiptOpen == false && invOpen == false) { return true; }
		else { return false; }

	}
	catch (err) {
		loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
		console.log(err)
	}
}


exports.PushStandAloneCRM = async (invoiceNo, getInvoiceMaster) => {
	//stand alone CRM if receipt & inv in myfast close
	try {
		let get = false;
		let putData = true //;
		let resAccount;
		// let StandAloneCRM = await this.StatusCRM(invoiceNo)
		// console.log("Status SA CRM" +StandAloneCRM)
		let getGRPRecId = []
		let getInvoiceRec = await clsGRPInvoice.SelectGRPInvoice_InvoiceNoType(invoiceNo, getInvoiceMaster.Invoice_type)
		let getReceiptRec = await clsGRPReceipt.SelectGRPReceipt_ByInvoiceNo(invoiceNo)
		let getInvoiceCRM = await clsGRPInvoice.SelectGRPInvoice_InvoiceNoType(invoiceNo, 'CRM')
		if (getInvoiceRec && getInvoiceRec.length > 0 && getReceiptRec && getReceiptRec.length > 0) {
			let getJSON = JSON.parse(getInvoiceRec[0].reqData)
			let JSONCRM = {
				...getJSON,
				Type: {
					value: 'CRM'
				},
				Date: {
					value: moment().format('YYYY-MM-DD')
				}
			}
			console.log(JSONCRM)
			if (putData == true) {
				resAccount = await ctlAccessToken.putData(ctlAccessToken.apiRoutes.Invoice, '', JSONCRM)
				if (resAccount && resAccount.id != null && resAccount.id != '') {  //eInvoice - save respond from myfast
					await this.insertDetail(resAccount, 'PUT', JSON.stringify(JSONCRM), JSON.stringify(resAccount))
				}
			}
			// let paramsINV = `%24filter=CustomerOrder eq '${invoiceNo.substring(3)}' and Type eq 'Credit Memo' and Status ne 'Closed'`
			// let resAccount = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.Invoice, paramsINV)
			loggers.logError(loggers.thisLine2() + ': ' + `${'getInvoice - STANDALONE CRM' + JSON.stringify(resAccount)}`)

			if (get == true) {
				if (resAccount && resAccount.length > 0 && resAccount[0].id) {//get
					let objdata = {
						invoiceNo: invoiceNo,
						invoiceType: 'CRM',
						reqData: JSON.stringify(JSONCRM),
						CreatedDate: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
						Customer: getInvoiceRec[0].Customer,
						Escis_Remark: 'StandAlone CRM',
						resStatus: '1',
						Flag: '3',//flag for stand alone CRM
						resData: JSON.stringify(resAccount),
						resId: resAccount[0].id,
						Amount: resAccount[0].Amount.value,
						ReferenceNbr: resAccount[0].ReferenceNbr.value
					}
					if (getInvoiceCRM != null && getInvoiceCRM.length > 0) {
						getGRPRecId = await clsGRPInvoice.UpdateGRPInvoice(objdata, 'CRM')

					}
					else {
						getGRPRecId = await clsGRPInvoice.InsertGRPInvoice(objdata)
					}

					if (getGRPRecId == true) { return; }
					else { loggers.logError(loggers.thisLine2() + ': ' + `${'Error stand alone CRM' + invoiceNo}`) }
				}
			}
			else {
				if (resAccount && resAccount.id) {//put
					let objdata = {
						invoiceNo: invoiceNo,
						invoiceType: 'CRM',
						reqData: JSON.stringify(JSONCRM),
						CreatedDate: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
						Customer: getInvoiceRec[0].Customer,
						Escis_Remark: 'StandAlone CRM',
						resStatus: '1',
						Flag: '3',//flag for stand alone CRM
						resData: JSON.stringify(resAccount),
						resId: resAccount.id,
						Amount: resAccount.Amount.value,
						ReferenceNbr: resAccount.ReferenceNbr.value
					}
					if (getInvoiceCRM != null && getInvoiceCRM.length > 0) {
						getGRPRecId = await clsGRPInvoice.UpdateGRPInvoice(objdata, 'CRM')

					}
					else {
						getGRPRecId = await clsGRPInvoice.InsertGRPInvoice(objdata)
					}

					if (getGRPRecId == true) { return; }
					else { loggers.logError(loggers.thisLine2() + ': ' + `${'Error stand alone CRM' + invoiceNo}`) }
				}
				else { //failed to push SA
					let objdata = {
						invoiceNo: invoiceNo,
						invoiceType: 'CRM',
						reqData: JSON.stringify(JSONCRM),
						CreatedDate: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
						Customer: getInvoiceRec[0].Customer,
						Escis_Remark: 'StandAlone CRM',
						resStatus: '2',
						Flag: '3',//flag for stand alone CRM
						Remark: resAccount != null && resAccount.message != '' ? resAccount.message : 'INTEGRATION WITH MYFAST FAILED!'

					}
					if (getInvoiceCRM != null && getInvoiceCRM.length > 0) {
						getGRPRecId = await clsGRPInvoice.UpdateGRPInvoice(objdata, 'CRM')

					}
					else {
						getGRPRecId = await clsGRPInvoice.InsertGRPInvoice(objdata)
					}
				}
			}
		}
	}
	catch (err) {
		loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
		console.log(err)
	}
}

exports.getCRMReferenceNbr = async (invoiceNo, skip = 0, invType = null, getInv = null, note = 'production', masterInv = false) => {
	try {
		let CRMRefNbr = ''


		if (skip == 1) {
			let getCreditNoteDetail;
			//check credit note type
			if (masterInv == true) {
				getCreditNoteDetail = await invoiceDetailsdata.GetCreditNote_byInvNoOrCNInvNo_MasterInv(invoiceNo)
			}
			else {
				getCreditNoteDetail = await invoiceDetailsdata.GetCreditNote_byInvNoOrCNInvNo(invoiceNo)

			}
			if (getCreditNoteDetail) {
				let CancelInvType = getCreditNoteDetail.Cancel_Invoice_Receipt
				let getGRPInvoice = await clsGRPInvoice.SelectGRPInvoice_InvoiceNoType(invoiceNo, 'CRM')

				let objUpdGrpInv = {
					resId: getInv.id,
					note: note,
					Customer: getInv.Customer.value,
					resData: JSON.stringify(getInv),
					Amount: getInv.Amount.value,
					Currency: getInv.Currency.value,
					CustomerOrder: getInv.CustomerOrder.value,
					LastModifiedDateTime: moment(getInv.LastModifiedDateTime.value).format('YYYY-MM-DD HH:mm:ss'),
					ModifiedDate: Now,
					ReferenceNbr: getInv.ReferenceNbr.value,
					resStatus: '1',
					invoiceNo: invoiceNo,
					invoiceType: 'CRM'
				}

				if (getGRPInvoice && getGRPInvoice.length > 0) {
					if (invType == 'CR' && CancelInvType == 'I') {
						await clsGRPInvoice.UpdateGRPInvoice(objUpdGrpInv, 'CRM')
						let getReceiptRec = await clsGRPReceipt.getGrpReceiptByInvNo_InvType(invoiceNo, 'Credit Memo')
						let ObjUpdateGrpReceipt = {
							resId: getInv.id,
							note: note,
							Description: 'eSCIS payment',
							ReferenceNbr: getInv.ReferenceNbr.value,
							Type: 'Credit Memo',
							ModifiedDate: Now,
							resStatus: '1',
							Flag: '3',
							Escis_Remark: 'Existing CRM in myfast!',
							resData: JSON.stringify(getInv),
							invoiceNo: invoiceNo,
						}
						if (getReceiptRec && getReceiptRec.length > 0) {
							ObjUpdateGrpReceipt = {
								...ObjUpdateGrpReceipt,
								RecId: getReceiptRec[0].RecId
							}
							await clsGRPReceipt.UpdateGRPReceipt(ObjUpdateGrpReceipt)
						}
						else {
							await clsGRPReceipt.InsertGRPReceipt(ObjUpdateGrpReceipt)
						}
					}
					else if ((invType == 'CR' && CancelInvType == 'I/R') || (invType == 'AP' && CancelInvType == 'I/R')) {
						objUpdGrpInv = {
							...objUpdGrpInv,
							Flag: '3',
							Escis_Remark: 'StandAlone CRM'
						}
						await clsGRPInvoice.UpdateGRPInvoice(objUpdGrpInv, 'CRM')
					}
				}
				else {
					if (invType == 'CR' && CancelInvType == 'I') {
						await clsGRPInvoice.InsertGRPInvoice(objUpdGrpInv)

						let getReceiptRec = await clsGRPReceipt.getGrpReceiptByInvNo_InvType(invoiceNo, 'Credit Memo')
						let ObjUpdateGrpReceipt = {
							resId: getInv.id,
							note: note,
							Description: 'eSCIS payment',
							ReferenceNbr: getInv.ReferenceNbr.value,
							Type: 'Credit Memo',
							ModifiedDate: Now,
							resStatus: '1',
							Flag: '3',
							Escis_Remark: 'Existing CRM in myfast!',
							resData: JSON.stringify(getInv),
							invoiceNo: invoiceNo

						}
						if (getReceiptRec && getReceiptRec.length > 0) {
							await clsGRPReceipt.UpdateGRPReceipt(ObjUpdateGrpReceipt)
						}
						else {
							ObjUpdateGrpReceipt = {
								...ObjUpdateGrpReceipt,
								invoiceNo: invoiceNo
							}
							await clsGRPReceipt.InsertGRPReceipt(ObjUpdateGrpReceipt)
						}
					}
					else if ((invType == 'CR' && CancelInvType == 'I/R') || (invType == 'AP' && CancelInvType == 'I/R')) {
						objUpdGrpInv = {
							...objUpdGrpInv,
							invoiceNo: invoiceNo,
							Flag: '3',
							Escis_Remark: 'StandAlone CRM'
						}
						await clsGRPInvoice.InsertGRPInvoice(objUpdGrpInv)
					}
				}
			}
			else {
				return;
			}
		}
		else {
			let getGRPInvoice = await clsGRPInvoice.SelectGRPInvoice_InvoiceNoType(invoiceNo, 'CRM')
			if (getGRPInvoice && getGRPInvoice.length > 0) {

				getGRPInvoice = getGRPInvoice.filter(tbl => tbl.resId != '' && tbl.resId != null && tbl.ReferenceNbr != null && tbl.ReferenceNbr != '' && tbl.ReferenceNbr.includes('CN'))

				if (getGRPInvoice && getGRPInvoice.length > 0) {
					return CRMRefNbr = getGRPInvoice[0].ReferenceNbr
				}
				else {//get from myfast
					let accessToken = await ctlAccessToken.getAccessToken();
					let paramsINV = `%24filter=CustomerOrder eq '${invoiceNo.substring(3)}' and Type eq 'Credit Memo'`
					let getInvoice2 = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.Invoice, paramsINV)
					if (getInvoice2 && getInvoice2.length > 0) { //eInvoice - save respond from myfast
						for (let x in getInvoice2) {
							await this.insertDetail(getInvoice2[x], 'GET', '', JSON.stringify(getInvoice2[x].obj))
						}
					}
					if (getInvoice2 && getInvoice2.length > 1) {
						getInvoice2 = getInvoice2.sort((a, b) => b.CreatedDateTime.value.localeCompare(a.CreatedDateTime.value));
						return CRMRefNbr = getInvoice2[0].ReferenceNbr.value
					}
					else if (getInvoice2 && getInvoice2.length == 1) {
						return CRMRefNbr = getInvoice2[0].ReferenceNbr.value
					}
					else {
						return;
					}


				}
			}
			else {
				let accessToken = await ctlAccessToken.getAccessToken();
				let paramsINV = `%24filter=CustomerOrder eq '${invoiceNo.substring(3)}' and Type eq 'Credit Memo'`
				let getInvoice2 = await ctlAccessToken.getDataAccount(ctlAccessToken.apiRoutes.Invoice, paramsINV)
				if (getInvoice2 && getInvoice2.length > 0) { //eInvoice - save respond from myfast
					for (let x in getInvoice2) {
						await this.insertDetail(getInvoice2[x], 'GET', '', JSON.stringify(getInvoice2[x].obj))
					}
				}
				if (getInvoice2 && getInvoice2.length > 1) {
					getInvoice2 = getInvoice2.sort((a, b) => b.CreatedDateTime.value.localeCompare(a.CreatedDateTime.value));
					return CRMRefNbr = getInvoice2[0].ReferenceNbr.value
				}
				else if (getInvoice2 && getInvoice2.length == 1) {
					return CRMRefNbr = getInvoice2[0].ReferenceNbr.value
				}
				else {
					return;
				}
			}
		}




	}
	catch (err) {
		loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
		console.log(err)
	}
}

exports.getSSTFx = async (Value = '') => {
	try {
		let objRate = {
			GSTRate: 'SSTNT',
			GSTToFixed: 0.00,
			GST_int: 0
		}

		if (Value == '6') {//SST6
			let getSST = await ParameterLogic.Select_ParameterbyParamCode_Status('1', 'STD', false, true)
			if (getSST && getSST.length > 0) {
				let SSTRate = getSST[0].ParamValue // 6.00
				objRate.GSTRate = "SST" + SSTRate //SST6
				objRate.GSTToFixed = SSTRate.toFixed(2) / 100 //0.06
				objRate.GST_int = SSTRate //6
			}
		}
		else {
			let getSST = await ParameterLogic.Select_ParameterbyParamCode_Status('1', 'STD', true)
			if (getSST && getSST.length > 0) {
				let SSTRate = getSST[0].ParamValue // 8.00
				objRate.GSTRate = "SST" + SSTRate //SST8
				objRate.GSTToFixed = SSTRate.toFixed(2) / 100 //0.08
				objRate.GST_int = SSTRate //8
			}
		}


		return objRate;

	}
	catch (err) {
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
				let PaymentMode_CC = ['CC - GHLDA', 'CC - PBB3', 'CC - PBB3_M', 'CREDIT CARD'];
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

