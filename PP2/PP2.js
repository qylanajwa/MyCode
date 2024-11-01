const express = require("express");
const router = express.Router();

const PP2Form = require('../../controller/PP2/PP2FormController');
const PP2Listing = require('../../controller/PP2/PP2Listing');
const PP2PDF = require('../../controller/PP2/PP2PDF');

router.get('/PP2Form/Page_Load', function (req, res) { PP2Form.Page_Load(req, res); }); //http://localhost:3000/api/PP2Form/page_Load?FileId=17648&LoginGUID=2F1D10EE-624E-4ED1-B70E-EBC406E7EBAB
router.get("/PP2Form/btnSearch", function (req, res) { PP2Form.btnSeacrhEmail(req, res); }); //http://localhost:3000/api/PP2Form/btnSearch?email='khalid@webgeaz.com'
router.post('/PP2Form/chkAddAbv_CheckedChanged', function (req, res) { PP2Form.chkAddAbv_CheckedChanged(req, res); }); //http://localhost:3000/api/PP2Form/chkAddAbv_CheckedChanged body=>{"Licencee":{"email":"kamil21@gmail.com","comp_name":"AB TRADING DUNYA","business_reg":"BYFO - 76HJ","address1":"NO 8, JLN TELUK PANGLIMA","address2":"TAMAN KESAS JAYA","address3":"","postcode":"798792","state":"SELANGOR","city":"AMP","country":"MALAYSIA","contact_name":"HARLEEN","contact_position":"HR","contact_phone":"016578678686","contact_fax":"98797987987","contact_mail":"kamil21@gmail.com","contact_id":"32551","cust_id":"20445","addr_id":"28911"},"Manufacturer":{"man_roc":"1191092-T","man_name":"JUJIANG DOORS & WINDOWS (M) SDN. BHD.","man_address_1":"7006, JALAN PBR 42","man_address_2":"KAWASAN PERINDUSTRIAN BUKIT RAMBAI","man_address_3":"\u00a0","man_postcode":"75250","man_city":"","man_state":"MELAKA","man_country":"MALAYSIA","man_contact_name_1":"TIEW WEI JUN","man_contact_position_1":"ADMINISTATIVE MANAGER","man_contact_phone_1":"017-6499412","man_contact_mail_1":"ecistest@Strateqgroup.com","man_contact_fax_1":"-","man_contact_name_2":"TIEW WEI JUN","man_contact_position_2":"ADMINISTATIVE MANAGER","man_contact_phone_2":"017-6499412","man_contact_mail_2":"ecistest@Strateqgroup.com","man_contact_fax_2":"-","chkAddAbv":{"Checked":true},"man_custid":"20445","man_addrid":"28911","man_contid":"32551","man_contid2":"32552"}}
router.post('/PP2Form/sLoadCountry', function (req, res) { PP2Form.sLoadCountry(req, res); });  //http://localhost:3000/api/PP2Form/sLoadCountry body=> {"Country":{"SelectedId":"1"},"State":{"SelectedId":"41"}}

router.post('/PP2Form/btnSubmit', function (req, res) { PP2Form.btnSubmit(req, res); });
//submit=> http://localhost:3000/api/PP2Form/btnSubmit?LoginGUID=2F1D10EE-624E-4ED1-B70E-EBC406E7EBAB
//draft=> http://localhost:3000/api/PP2Form/btnSubmit?LoginGUID=2F1D10EE-624E-4ED1-B70E-EBC406E7EBAB&Draft=1
//Amend=> http://localhost:3000/api/PP2Form/btnSubmit?LoginGUID=2F1D10EE-624E-4ED1-B70E-EBC406E7EBAB&Amend=1
//Cancel=> http://localhost:3000/api/PP2Form/btnSubmit?LoginGUID=2F1D10EE-624E-4ED1-B70E-EBC406E7EBAB&Cancel=1

router.get('/PP2Listing', function (req, res) { PP2Listing.Page_Load(req, res); });  //http://localhost:3000/api/PP2/PP2Listing?LoginGUID=2F1D10EE-624E-4ED1-B70E-EBC406E7EBAB
// http://localhost:3000/api/PP2/PP2Listing?LoginGUID=EDB78E26-F1CF-429E-8C72-59A1F5C8445F&Entry=10&Page=1&ParamSearch=&OrderByColumn=PP2No/FileNo/LicenseNo/ReferenceNo/CompanyName/ContactEmail/Product/PP2Status/Process/PP2FormStatus/SubmittedDate&OrderBySort=asc/desc
router.get('/Failed_SelectAll', function (req, res) { PP2Listing.Failed_SelectAll(req, res); });  //http://localhost:3000/api/PP2/Failed_SelectAll?LoginGUID=EDB78E26-F1CF-429E-8C72-59A1F5C8445F&ParamSearch=


//Load Duplicate => http://localhost:3000/api/PP2/PP2Form/Page_Load?FileId=117&LoginGUID=2F1D10EE-624E-4ED1-B70E-EBC406E7EBAB&Duplicate=1

router.put("/PP2Form", function (req, res) { PP2Form.UpdatePP2Status(req, res); });  //http://localhost:3000/api/PP2/PP2Form body=> {"file_no":"P5-013997","pp2_id":5584,"pp2_status":"Complete"}

router.post('/BtnRepushPP2', function (req, res) { PP2Listing.BtnRepushPP2(req, res); });   //http://localhost:3000/api/PP2/BtnRepushPP2?LoginGUID=2F1D10EE-624E-4ED1-B70E-EBC406E7EBAB body=>{"gv_pp2List":[{"PP2No":"455","FileNo":"P5-000247","LicenseNo":"PA055806","ReferenceNo":"","FileID":"117","CompanyName":"WEBGEAZ SDN. BHD.","ContactEmail":"khalid@web.com","Product":"HOT ROLLED RIBBED WELDABLE REINFORCING STEEL","LinkURLViewQuotation":{"name":"","link":""},"PP2FormStatus":"FAILED","Process":"CANCEL","Error":"{\"response_code\":400,\"error\":\"Applicant not exist. Please add details applicant. Parameter comp_name is required.\",\"response\":\"Bad Request\"}","LinkURLViewJob":[],"SubmittedDate":"2023-10-11 18:02:00","PP2Status":"Submitted","LinkURLDuplicate":"\/PP2\/NewApplication?FileId=117&Id=455&Duplicate=1","LinkURLParam":"\/PP2\/NewApplication?FileId=117&Id=455&PP2Status=Submitted&Listing=1"},{"PP2No":"453","FileNo":"P5-000247","LicenseNo":"PA055806","ReferenceNo":"","FileID":"117","CompanyName":"WEBGEAZ SDN. BHD.","ContactEmail":"khalid@web.com","Product":"HOT ROLLED RIBBED WELDABLE REINFORCING STEEL","LinkURLViewQuotation":{"name":"","link":""},"PP2FormStatus":"FAILED","Process":"CANCEL","Error":"{\"response_code\":400,\"error\":\"Applicant not exist. Please add details applicant. Parameter comp_name is required.\",\"response\":\"Bad Request\"}","LinkURLViewJob":[],"SubmittedDate":"2023-10-11 17:51:00","PP2Status":"Submitted","LinkURLDuplicate":"\/PP2\/NewApplication?FileId=117&Id=453&Duplicate=1","LinkURLParam":"\/PP2\/NewApplication?FileId=117&Id=453&PP2Status=Submitted&Listing=1"}]}

router.get('/PP2PDF', function (req, res) { PP2PDF.Page_load(req, res); });//http://localhost:3000/api/PP2/PP2PDF?LoginGUID=2F1D10EE-624E-4ED1-B70E-EBC406E7EBAB

router.post('/getAttchmentLink', function (req, res) { PP2Form.TestGetAttchmentLink(req, res); }); //http://localhost:3006/api/PP2/getAttchmentLink body=>{"Fileid":"24234","Appid":"2672","AttachmentInfo":{"AppId":"2672","AppTypeId":90,"EventId":0,"FileId":"24234","JobId":0,"ModCode":"PP2","SysMod":14,"UserId":38,"WfId":0,"UseSID":false,"AppType":"pp2Form"}}
module.exports = router;

