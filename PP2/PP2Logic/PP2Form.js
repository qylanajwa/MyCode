const sql = require('mssql')
const mainDb = require('../MainDb');

// SELECT queries
exports.SelectAllPP2Form = () => {
    return new Promise((resolve, reject) => {
        let query = `SELECT * FROM tbl_pp2Form WITH (NOLOCK) order by id desc`;
        mainDb.executeQuery(query, null, null, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectPP2Form_FileId_Id = (FileId, Id) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'FileId', sqltype: sql.BigInt, value: FileId },
            { name: 'Id', sqltype: sql.BigInt, value: Id }
        ]
        let query = `SELECT * FROM tbl_pp2Form WITH (NOLOCK) WHERE FileId=@FileId AND id=@Id`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectPP2Form_Id = (Id) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'Id', sqltype: sql.BigInt, value: Id }
        ]
        let query = `SELECT * FROM tbl_pp2Form WITH (NOLOCK) WHERE id=@Id`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectPP2Form_FileIdAndStatus = (FileId, status) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'FileId', sqltype: sql.BigInt, value: FileId },
            { name: 'status', sqltype: sql.NVarChar, value: status }
        ]
        let query = `SELECT * FROM tbl_pp2Form WITH (NOLOCK) WHERE FileId=@FileId and status=@status`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectPP2Form_FileId = (FileId, status) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'FileId', sqltype: sql.BigInt, value: FileId },
            { name: 'status', sqltype: sql.NVarChar, value: status }
        ]
        let query = `SELECT * FROM tbl_pp2Form WITH (NOLOCK) WHERE FileId=@FileId`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectPP2Task_AppId_FileId = (FileId, id) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'FileId', sqltype: sql.BigInt, value: FileId },
            { name: 'id', sqltype: sql.BigInt, value: id },

        ]
        let query = `select t.*,pp2.* from tbl_pp2form pp2 join tbl_task_list t on t.fileid=pp2.fileid
        where pp2.fileid=@FileId and t.status<>'2' and t.appid = @id`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectApplicant_SameProduct = (ProdId, CustId) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'ProductId', sqltype: sql.BigInt, value: ProdId },
            { name: 'CustId', sqltype: sql.BigInt, value: CustId }

        ]
        let query = `select f.fileid as 'FILEID',f.FileNo as 'FILENO',lp.ProdName,c.CertNo, tc.CompName,tc.CustId,p.LibProdId,* from tbl_file f join tbl_master_link ml on ml.RecId=f.AppId
        join tbl_product p on p.ProdId=ml.ProdId join tbl_lib_prod lp on lp.ProdId = p.LibProdId
        join tbl_file_status fs on fs.recid=f.FileStatus join tbl_scheme_type sc on sc.SchemeId = f.SchemeId
        join tbl_cert c on c.FileId = f.FileId join tbl_customer tc on tc.custid = f.CustId
        where (sc.SchemeName='Product Certification' and fs.Description in('Certified','Pre-Certification','Suspended')) or (sc.SchemeName='Batch Certification' and fs.Description <> 'Terminated')        
        and lp.Status=1 and p.Status='1' and ml.Status='1'
        and p.LibProdId=@ProductId and tc.CustId=@CustId`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectPP2Form_byFileNoANDPP2Id = (file_no, pp2_id) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'file_no', sqltype: sql.NVarChar, value: file_no },
            { name: 'pp2_id', sqltype: sql.NVarChar, value: pp2_id }
        ]
        let query = `SELECT * FROM tbl_pp2Form WITH (NOLOCK) WHERE file_no=@file_no AND pp2_id=@pp2_id`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectPP2Form_byPP2Id = (pp2_id) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'pp2_id', sqltype: sql.NVarChar, value: pp2_id }
        ]
        let query = `SELECT * FROM tbl_pp2Form WITH (NOLOCK) WHERE pp2_id=@pp2_id`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}


// INSERT QUERIES
exports.InsertData_pp2Form = (data) => {
    let column = ""
    let values = ""
    let count = 0
    let parameters = []


    if (data.FileId !== undefined && data.FileId !== null) {
        parameters.push({ name: 'FileId', sqltype: sql.BigInt, value: data.FileId })
        column = column == "" ? column += "FileId" : column += ",FileId"
        values = values == "" ? values += `@FileId` : values += `,@FileId`
        count += 1
    }
    if (data.JobId !== undefined && data.JobId !== null) {
        parameters.push({ name: 'JobId', sqltype: sql.BigInt, value: data.JobId })
        column = column == "" ? column += "JobId" : column += ",JobId"
        values = values == "" ? values += `@JobId` : values += `,@JobId`
        count += 1
    }
    if (data.wfid !== undefined && data.wfid !== null) {
        parameters.push({ name: 'wfid', sqltype: sql.BigInt, value: data.wfid })
        column = column == "" ? column += "wfid" : column += ",wfid"
        values = values == "" ? values += `@wfid` : values += `,@wfid`
        count += 1
    }
    if (data.status !== undefined && data.status !== null) {
        parameters.push({ name: 'status', sqltype: sql.Char, value: data.status })
        column = column == "" ? column += "status" : column += ",status"
        values = values == "" ? values += `@status` : values += `,@status`
        count += 1
    }
    if (data.to_section !== undefined && data.to_section !== null) {
        parameters.push({ name: 'to_section', sqltype: sql.Int, value: data.to_section })
        column = column == "" ? column += "to_section" : column += ",to_section"
        values = values == "" ? values += `@to_section` : values += `,@to_section`
        count += 1
    }
    if (data.user_type !== undefined && data.user_type !== null) {
        parameters.push({ name: 'user_type', sqltype: sql.NVarChar, value: data.user_type })
        column = column == "" ? column += "user_type" : column += ",user_type"
        values = values == "" ? values += `@user_type` : values += `,@user_type`
        count += 1
    }
    if (data.enquiry_id !== undefined && data.enquiry_id !== null) {
        parameters.push({ name: 'enquiry_id', sqltype: sql.Int, value: data.enquiry_id })
        column = column == "" ? column += "enquiry_id" : column += ",enquiry_id"
        values = values == "" ? values += `@enquiry_id` : values += `,@enquiry_id`
        count += 1
    }
    if (data.cr_id !== undefined && data.cr_id !== null) {
        parameters.push({ name: 'cr_id', sqltype: sql.Int, value: data.cr_id })
        column = column == "" ? column += "cr_id" : column += ",cr_id"
        values = values == "" ? values += `@cr_id` : values += `,@cr_id`
        count += 1
    }
    if (data.quot_id !== undefined && data.quot_id !== null) {
        parameters.push({ name: 'quot_id', sqltype: sql.Int, value: data.quot_id })
        column = column == "" ? column += "quot_id" : column += ",quot_id"
        values = values == "" ? values += `@quot_id` : values += `,@quot_id`
        count += 1
    }
    if (data.contact_id !== undefined && data.contact_id !== null) {
        parameters.push({ name: 'contact_id', sqltype: sql.Int, value: data.contact_id })
        column = column == "" ? column += "contact_id" : column += ",contact_id"
        values = values == "" ? values += `@contact_id` : values += `,@contact_id`
        count += 1
    }
    if (data.cust_id !== undefined && data.cust_id !== null) {
        parameters.push({ name: 'cust_id', sqltype: sql.Int, value: data.cust_id })
        column = column == "" ? column += "cust_id" : column += ",cust_id"
        values = values == "" ? values += `@cust_id` : values += `,@cust_id`
        count += 1
    }
    if (data.addr_id !== undefined && data.addr_id !== null) {
        parameters.push({ name: 'addr_id', sqltype: sql.Int, value: data.addr_id })
        column = column == "" ? column += "addr_id" : column += ",addr_id"
        values = values == "" ? values += `@addr_id` : values += `,@addr_id`
        count += 1
    }
    if (data.file_no !== undefined && data.file_no !== null) {
        parameters.push({ name: 'file_no', sqltype: sql.NVarChar, value: data.file_no })
        column = column == "" ? column += "file_no" : column += ",file_no"
        values = values == "" ? values += `@file_no` : values += `,@file_no`
        count += 1
    }
    if (data.license_no !== undefined && data.license_no !== null) {
        parameters.push({ name: 'license_no', sqltype: sql.NVarChar, value: data.license_no })
        column = column == "" ? column += "license_no" : column += ",license_no"
        values = values == "" ? values += `@license_no` : values += `,@license_no`
        count += 1
    }
    if (data.ref_no !== undefined && data.ref_no !== null) {
        parameters.push({ name: 'ref_no', sqltype: sql.NVarChar, value: data.ref_no })
        column = column == "" ? column += "ref_no" : column += ",ref_no"
        values = values == "" ? values += `@ref_no` : values += `,@ref_no`
        count += 1
    }
    if (data.payment_id !== undefined && data.payment_id !== null) {
        parameters.push({ name: 'payment_id', sqltype: sql.Int, value: data.payment_id })
        column = column == "" ? column += "payment_id" : column += ",payment_id"
        values = values == "" ? values += `@payment_id` : values += `,@payment_id`
        count += 1
    }
    if (data.sample_qty !== undefined && data.sample_qty !== null) {
        parameters.push({ name: 'sample_qty', sqltype: sql.NVarChar, value: data.sample_qty })
        column = column == "" ? column += "sample_qty" : column += ",sample_qty"
        values = values == "" ? values += `@sample_qty` : values += `,@sample_qty`
        count += 1
    }
    if (data.sampling_date !== undefined && data.sampling_date !== null) {
        parameters.push({ name: 'sampling_date', sqltype: sql.NVarChar, value: data.sampling_date })
        column = column == "" ? column += "sampling_date" : column += ",sampling_date"
        values = values == "" ? values += `@sampling_date` : values += `,@sampling_date`
        count += 1
    }
    if (data.treason_pre !== undefined && data.treason_pre !== null) {
        parameters.push({ name: 'treason_pre', sqltype: sql.Bit, value: data.treason_pre })
        column = column == "" ? column += "treason_pre" : column += ",treason_pre"
        values = values == "" ? values += `@treason_pre` : values += `,@treason_pre`
        count += 1
    }
    if (data.treason_license !== undefined && data.treason_license !== null) {
        parameters.push({ name: 'treason_license', sqltype: sql.Bit, value: data.treason_license })
        column = column == "" ? column += "treason_license" : column += ",treason_license"
        values = values == "" ? values += `@treason_license` : values += `,@treason_license`
        count += 1
    }
    if (data.treason_scheme !== undefined && data.treason_scheme !== null) {
        parameters.push({ name: 'treason_scheme', sqltype: sql.Bit, value: data.treason_scheme })
        column = column == "" ? column += "treason_scheme" : column += ",treason_scheme"
        values = values == "" ? values += `@treason_scheme` : values += `,@treason_scheme`
        count += 1
    }
    if (data.treason_other !== undefined && data.treason_other !== null) {
        parameters.push({ name: 'treason_other', sqltype: sql.Bit, value: data.treason_other })
        column = column == "" ? column += "treason_other" : column += ",treason_other"
        values = values == "" ? values += `@treason_other` : values += `,@treason_other`
        count += 1
    }
    if (data.treason_others_specify !== undefined && data.treason_others_specify !== null) {
        parameters.push({ name: 'treason_others_specify', sqltype: sql.NVarChar, value: data.treason_others_specify })
        column = column == "" ? column += "treason_others_specify" : column += ",treason_others_specify"
        values = values == "" ? values += `@treason_others_specify` : values += `,@treason_others_specify`
        count += 1
    }
    if (data.test_full !== undefined && data.test_full !== null) {
        parameters.push({ name: 'test_full', sqltype: sql.Bit, value: data.test_full })
        column = column == "" ? column += "test_full" : column += ",test_full"
        values = values == "" ? values += `@test_full` : values += `,@test_full`
        count += 1
    }
    if (data.test_partial !== undefined && data.test_partial !== null) {
        parameters.push({ name: 'test_partial', sqltype: sql.Bit, value: data.test_partial })
        column = column == "" ? column += "test_partial" : column += ",test_partial"
        values = values == "" ? values += `@test_partial` : values += `,@test_partial`
        count += 1
    }
    if (data.test_confirm !== undefined && data.test_confirm !== null) {
        parameters.push({ name: 'test_confirm', sqltype: sql.Bit, value: data.test_confirm })
        column = column == "" ? column += "test_confirm" : column += ",test_confirm"
        values = values == "" ? values += `@test_confirm` : values += `,@test_confirm`
        count += 1
    }
    if (data.test_others !== undefined && data.test_others !== null) {
        parameters.push({ name: 'test_others', sqltype: sql.Bit, value: data.test_others })
        column = column == "" ? column += "test_others" : column += ",test_others"
        values = values == "" ? values += `@test_others` : values += `,@test_others`
        count += 1
    }
    if (data.test_others_specify !== undefined && data.test_others_specify !== null) {
        parameters.push({ name: 'test_others_specify', sqltype: sql.NVarChar, value: data.test_others_specify })
        column = column == "" ? column += "test_others_specify" : column += ",test_others_specify"
        values = values == "" ? values += `@test_others_specify` : values += `,@test_others_specify`
        count += 1
    }
    if (data.business_reg !== undefined && data.business_reg !== null) {
        parameters.push({ name: 'business_reg', sqltype: sql.NVarChar, value: data.business_reg })
        column = column == "" ? column += "business_reg" : column += ",business_reg"
        values = values == "" ? values += `@business_reg` : values += `,@business_reg`
        count += 1
    }
    if (data.comp_name !== undefined && data.comp_name !== null) {
        parameters.push({ name: 'comp_name', sqltype: sql.NVarChar, value: data.comp_name })
        column = column == "" ? column += "comp_name" : column += ",comp_name"
        values = values == "" ? values += `@comp_name` : values += `,@comp_name`
        count += 1
    }
    if (data.address1 !== undefined && data.address1 !== null) {
        parameters.push({ name: 'address1', sqltype: sql.NVarChar, value: data.address1 })
        column = column == "" ? column += "address1" : column += ",address1"
        values = values == "" ? values += `@address1` : values += `,@address1`
        count += 1
    }
    if (data.address2 !== undefined && data.address2 !== null) {
        parameters.push({ name: 'address2', sqltype: sql.NVarChar, value: data.address2 })
        column = column == "" ? column += "address2" : column += ",address2"
        values = values == "" ? values += `@address2` : values += `,@address2`
        count += 1
    }
    if (data.address3 !== undefined && data.address3 !== null) {
        parameters.push({ name: 'address3', sqltype: sql.NVarChar, value: data.address3 })
        column = column == "" ? column += "address3" : column += ",address3"
        values = values == "" ? values += `@address3` : values += `,@address3`
        count += 1
    }
    if (data.postcode !== undefined && data.postcode !== null) {
        parameters.push({ name: 'postcode', sqltype: sql.NVarChar, value: data.postcode })
        column = column == "" ? column += "postcode" : column += ",postcode"
        values = values == "" ? values += `@postcode` : values += `,@postcode`
        count += 1
    }
    if (data.city !== undefined && data.city !== null) {
        parameters.push({ name: 'city', sqltype: sql.NVarChar, value: data.city })
        column = column == "" ? column += "city" : column += ",city"
        values = values == "" ? values += `@city` : values += `,@city`
        count += 1
    }
    if (data.state !== undefined && data.state !== null) {
        parameters.push({ name: 'state', sqltype: sql.NVarChar, value: data.state })
        column = column == "" ? column += "state" : column += ",state"
        values = values == "" ? values += `@state` : values += `,@state`
        count += 1
    }
    if (data.country !== undefined && data.country !== null) {
        parameters.push({ name: 'country', sqltype: sql.NVarChar, value: data.country })
        column = column == "" ? column += "country" : column += ",country"
        values = values == "" ? values += `@country` : values += `,@country`
        count += 1
    }
    if (data.contact_name !== undefined && data.contact_name !== null) {
        parameters.push({ name: 'contact_name', sqltype: sql.NVarChar, value: data.contact_name })
        column = column == "" ? column += "contact_name" : column += ",contact_name"
        values = values == "" ? values += `@contact_name` : values += `,@contact_name`
        count += 1
    }
    if (data.contact_position !== undefined && data.contact_position !== null) {
        parameters.push({ name: 'contact_position', sqltype: sql.NVarChar, value: data.contact_position })
        column = column == "" ? column += "contact_position" : column += ",contact_position"
        values = values == "" ? values += `@contact_position` : values += `,@contact_position`
        count += 1
    }
    if (data.contact_phone !== undefined && data.contact_phone !== null) {
        parameters.push({ name: 'contact_phone', sqltype: sql.NVarChar, value: data.contact_phone })
        column = column == "" ? column += "contact_phone" : column += ",contact_phone"
        values = values == "" ? values += `@contact_phone` : values += `,@contact_phone`
        count += 1
    }
    if (data.contact_fax !== undefined && data.contact_fax !== null) {
        parameters.push({ name: 'contact_fax', sqltype: sql.NVarChar, value: data.contact_fax })
        column = column == "" ? column += "contact_fax" : column += ",contact_fax"
        values = values == "" ? values += `@contact_fax` : values += `,@contact_fax`
        count += 1
    }
    if (data.contact_mail !== undefined && data.contact_mail !== null) {
        parameters.push({ name: 'contact_mail', sqltype: sql.NVarChar, value: data.contact_mail })
        column = column == "" ? column += "contact_mail" : column += ",contact_mail"
        values = values == "" ? values += `@contact_mail` : values += `,@contact_mail`
        count += 1
    }
    if (data.manufacturer_id !== undefined && data.manufacturer_id !== null) {
        parameters.push({ name: 'manufacturer_id', sqltype: sql.Int, value: data.manufacturer_id })
        column = column == "" ? column += "manufacturer_id" : column += ",manufacturer_id"
        values = values == "" ? values += `@manufacturer_id` : values += `,@manufacturer_id`
        count += 1
    }
    if (data.product !== undefined && data.product !== null) {
        parameters.push({ name: 'product', sqltype: sql.NVarChar, value: data.product })
        column = column == "" ? column += "product" : column += ",product"
        values = values == "" ? values += `@product` : values += `,@product`
        count += 1
    }
    if (data.brand !== undefined && data.brand !== null) {
        parameters.push({ name: 'brand', sqltype: sql.NVarChar, value: data.brand })
        column = column == "" ? column += "brand" : column += ",brand"
        values = values == "" ? values += `@brand` : values += `,@brand`
        count += 1
    }
    if (data.type !== undefined && data.type !== null) {
        parameters.push({ name: 'type', sqltype: sql.NVarChar, value: data.type })
        column = column == "" ? column += "type" : column += ",type"
        values = values == "" ? values += `@type` : values += `,@type`
        count += 1
    }
    if (data.model !== undefined && data.model !== null) {
        parameters.push({ name: 'model', sqltype: sql.NVarChar, value: data.model })
        column = column == "" ? column += "model" : column += ",model"
        values = values == "" ? values += `@model` : values += `,@model`
        count += 1
    }
    if (data.rating !== undefined && data.rating !== null) {
        parameters.push({ name: 'rating', sqltype: sql.NVarChar, value: data.rating })
        column = column == "" ? column += "rating" : column += ",rating"
        values = values == "" ? values += `@rating` : values += `,@rating`
        count += 1
    }
    if (data.size !== undefined && data.size !== null) {
        parameters.push({ name: 'size', sqltype: sql.NVarChar, value: data.size })
        column = column == "" ? column += "size" : column += ",size"
        values = values == "" ? values += `@size` : values += `,@size`
        count += 1
    }
    if (data.standard !== undefined && data.standard !== null) {
        parameters.push({ name: 'standard', sqltype: sql.NVarChar, value: data.standard })
        column = column == "" ? column += "standard" : column += ",standard"
        values = values == "" ? values += `@standard` : values += `,@standard`
        count += 1
    }
    if (data.clause_test !== undefined && data.clause_test !== null) {
        parameters.push({ name: 'clause_test', sqltype: sql.NVarChar, value: data.clause_test })
        column = column == "" ? column += "clause_test" : column += ",clause_test"
        values = values == "" ? values += `@clause_test` : values += `,@clause_test`
        count += 1
    }
    if (data.remark !== undefined && data.remark !== null) {
        parameters.push({ name: 'remark', sqltype: sql.NVarChar, value: data.remark })
        column = column == "" ? column += "remark" : column += ",remark"
        values = values == "" ? values += `@remark` : values += `,@remark`
        count += 1
    }
    if (data.product_desc !== undefined && data.product_desc !== null) {
        parameters.push({ name: 'product_desc', sqltype: sql.NVarChar, value: data.product_desc })
        column = column == "" ? column += "product_desc" : column += ",product_desc"
        values = values == "" ? values += `@product_desc` : values += `,@product_desc`
        count += 1
    }
    if (data.other_tr !== undefined && data.other_tr !== null) {
        parameters.push({ name: 'other_tr', sqltype: sql.NVarChar, value: data.other_tr })
        column = column == "" ? column += "other_tr" : column += ",other_tr"
        values = values == "" ? values += `@other_tr` : values += `,@other_tr`
        count += 1
    }
    if (data.sirim_label_no !== undefined && data.sirim_label_no !== null) {
        parameters.push({ name: 'sirim_label_no', sqltype: sql.NVarChar, value: data.sirim_label_no })
        column = column == "" ? column += "sirim_label_no" : column += ",sirim_label_no"
        values = values == "" ? values += `@sirim_label_no` : values += `,@sirim_label_no`
        count += 1
    }
    if (data.conformity_statement !== undefined && data.conformity_statement !== null) {
        parameters.push({ name: 'conformity_statement', sqltype: sql.Int, value: data.conformity_statement })
        column = column == "" ? column += "conformity_statement" : column += ",conformity_statement"
        values = values == "" ? values += `@conformity_statement` : values += `,@conformity_statement`
        count += 1
    }

    if (data.status_id !== undefined && data.status_id !== null) {
        parameters.push({ name: 'status_id', sqltype: sql.Int, value: data.status_id })
        column = column == "" ? column += "status_id" : column += ",status_id"
        values = values == "" ? values += `@status_id` : values += `,@status_id`
        count += 1
    }
    if (data.PdfURL !== undefined && data.PdfURL !== null) {
        parameters.push({ name: 'PdfURL', sqltype: sql.NVarChar, value: data.PdfURL })
        column = column == "" ? column += "PdfURL" : column += ",PdfURL"
        values = values == "" ? values += `@PdfURL` : values += `,@PdfURL`
        count += 1
    }
    if (data.created_on !== undefined && data.created_on !== null) {
        parameters.push({ name: 'created_on', sqltype: sql.NVarChar, value: data.created_on })
        column = column == "" ? column += "created_on" : column += ",created_on"
        values = values == "" ? values += `@created_on` : values += `,@created_on`
        count += 1
    }
    if (data.created_by !== undefined && data.created_by !== null) {
        parameters.push({ name: 'created_by', sqltype: sql.Int, value: data.created_by })
        column = column == "" ? column += "created_by" : column += ",created_by"
        values = values == "" ? values += `@created_by` : values += `,@created_by`
        count += 1
    }
    if (data.id_TMS !== undefined && data.id_TMS !== null) {
        parameters.push({ name: 'id_TMS', sqltype: sql.BigInt, value: data.id_TMS })
        column = column == "" ? column += "id_TMS" : column += ",id_TMS"
        values = values == "" ? values += `@id_TMS` : values += `,@id_TMS`
        count += 1
    }
    if (data.modifiedby !== undefined && modifiedby.id_TMS !== null) {
        parameters.push({ name: 'modifiedby', sqltype: sql.Int, value: data.modifiedby })
        column = column == "" ? column += "modifiedby" : column += ",modifiedby"
        values = values == "" ? values += `@modifiedby` : values += `,@modifiedby`
        count += 1
    }
    if (data.response_code !== undefined && data.response_code !== null) {
        parameters.push({ name: 'response_code', sqltype: sql.NVarChar, value: data.response_code })
        column = column == "" ? column += "response_code" : column += ",response_code"
        values = values == "" ? values += `@response_code` : values += `,@response_code`
        count += 1
    }
    if (data.response !== undefined && data.response !== null) {
        parameters.push({ name: 'response', sqltype: sql.NVarChar, value: data.response })
        column = column == "" ? column += "response" : column += ",response"
        values = values == "" ? values += `@response` : values += `,@response`
        count += 1
    }
    if (data.pp2_id !== undefined && data.pp2_id !== null) {
        parameters.push({ name: 'pp2_id', sqltype: sql.NVarChar, value: data.pp2_id })
        column = column == "" ? column += "pp2_id" : column += ",pp2_id"
        values = values == "" ? values += `@pp2_id` : values += `,@pp2_id`
        count += 1
    }
    if (data.pp2_status !== undefined && data.pp2_status !== null) {
        parameters.push({ name: 'pp2_status', sqltype: sql.NVarChar, value: data.pp2_status })
        column = column == "" ? column += "pp2_status" : column += ",pp2_status"
        values = values == "" ? values += `@pp2_status` : values += `,@pp2_status`
        count += 1
    }
    if (data.registration_id !== undefined && data.registration_id !== null) {
        parameters.push({ name: 'registration_id', sqltype: sql.NVarChar, value: data.registration_id })
        column = column == "" ? column += "registration_id" : column += ",registration_id"
        values = values == "" ? values += `@registration_id` : values += `,@registration_id`
        count += 1
    }
    if (data.source_pp2 !== undefined && data.source_pp2 !== null) {
        parameters.push({ name: 'source_pp2', sqltype: sql.NVarChar, value: data.source_pp2 })
        column = column == "" ? column += "source_pp2" : column += ",source_pp2"
        values = values == "" ? values += `@source_pp2` : values += `,@source_pp2`
        count += 1
    }
    if (data.email !== undefined && data.email !== null) {
        parameters.push({ name: 'email', sqltype: sql.NVarChar, value: data.email })
        column = column == "" ? column += "email" : column += ",email"
        values = values == "" ? values += `@email` : values += `,@email`
        count += 1
    }
    if (data.requested_by !== undefined && data.requested_by !== null) {
        parameters.push({ name: 'requested_by', sqltype: sql.NVarChar, value: data.requested_by })
        column = column == "" ? column += "requested_by" : column += ",requested_by"
        values = values == "" ? values += `@requested_by` : values += `,@requested_by`
        count += 1
    }
    if (data.man_roc !== undefined && data.man_roc !== null) {
        parameters.push({ name: 'man_roc', sqltype: sql.NVarChar, value: data.man_roc })
        column = column == "" ? column += "man_roc" : column += ",man_roc"
        values = values == "" ? values += `@man_roc` : values += `,@man_roc`
        count += 1
    }
    if (data.man_name !== undefined && data.man_name !== null) {
        parameters.push({ name: 'man_name', sqltype: sql.NVarChar, value: data.man_name })
        column = column == "" ? column += "man_name" : column += ",man_name"
        values = values == "" ? values += `@man_name` : values += `,@man_name`
        count += 1
    }
    if (data.man_address_1 !== undefined && data.man_address_1 !== null) {
        parameters.push({ name: 'man_address_1', sqltype: sql.NVarChar, value: data.man_address_1 })
        column = column == "" ? column += "man_address_1" : column += ",man_address_1"
        values = values == "" ? values += `@man_address_1` : values += `,@man_address_1`
        count += 1
    }
    if (data.man_address_2 !== undefined && data.man_address_2 !== null) {
        parameters.push({ name: 'man_address_2', sqltype: sql.NVarChar, value: data.man_address_2 })
        column = column == "" ? column += "man_address_2" : column += ",man_address_2"
        values = values == "" ? values += `@man_address_2` : values += `,@man_address_2`
        count += 1
    }
    if (data.man_address_3 !== undefined && data.man_address_3 !== null) {
        parameters.push({ name: 'man_address_3', sqltype: sql.NVarChar, value: data.man_address_3 })
        column = column == "" ? column += "man_address_3" : column += ",man_address_3"
        values = values == "" ? values += `@man_address_3` : values += `,@man_address_3`
        count += 1
    }
    if (data.man_postcode !== undefined && data.man_postcode !== null) {
        parameters.push({ name: 'man_postcode', sqltype: sql.NVarChar, value: data.man_postcode })
        column = column == "" ? column += "man_postcode" : column += ",man_postcode"
        values = values == "" ? values += `@man_postcode` : values += `,@man_postcode`
        count += 1
    }
    if (data.man_city !== undefined && data.man_city !== null) {
        parameters.push({ name: 'man_city', sqltype: sql.NVarChar, value: data.man_city })
        column = column == "" ? column += "man_city" : column += ",man_city"
        values = values == "" ? values += `@man_city` : values += `,@man_city`
        count += 1
    }
    if (data.man_state !== undefined && data.man_state !== null) {
        parameters.push({ name: 'man_state', sqltype: sql.NVarChar, value: data.man_state })
        column = column == "" ? column += "man_state" : column += ",man_state"
        values = values == "" ? values += `@man_state` : values += `,@man_state`
        count += 1
    }
    if (data.man_country !== undefined && data.man_country !== null) {
        parameters.push({ name: 'man_country', sqltype: sql.NVarChar, value: data.man_country })
        column = column == "" ? column += "man_country" : column += ",man_country"
        values = values == "" ? values += `@man_country` : values += `,@man_country`
        count += 1
    }
    if (data.man_contact_name_1 !== undefined && data.man_contact_name_1 !== null) {
        parameters.push({ name: 'man_contact_name_1', sqltype: sql.NVarChar, value: data.man_contact_name_1 })
        column = column == "" ? column += "man_contact_name_1" : column += ",man_contact_name_1"
        values = values == "" ? values += `@man_contact_name_1` : values += `,@man_contact_name_1`
        count += 1
    }
    if (data.man_contact_position_1 !== undefined && data.man_contact_position_1 !== null) {
        parameters.push({ name: 'man_contact_position_1', sqltype: sql.NVarChar, value: data.man_contact_position_1 })
        column = column == "" ? column += "man_contact_position_1" : column += ",man_contact_position_1"
        values = values == "" ? values += `@man_contact_position_1` : values += `,@man_contact_position_1`
        count += 1
    }
    if (data.man_contact_phone_1 !== undefined && data.man_contact_phone_1 !== null) {
        parameters.push({ name: 'man_contact_phone_1', sqltype: sql.NVarChar, value: data.man_contact_phone_1 })
        column = column == "" ? column += "man_contact_phone_1" : column += ",man_contact_phone_1"
        values = values == "" ? values += `@man_contact_phone_1` : values += `,@man_contact_phone_1`
        count += 1
    }
    if (data.man_contact_mail_1 !== undefined && data.man_contact_mail_1 !== null) {
        parameters.push({ name: 'man_contact_mail_1', sqltype: sql.NVarChar, value: data.man_contact_mail_1 })
        column = column == "" ? column += "man_contact_mail_1" : column += ",man_contact_mail_1"
        values = values == "" ? values += `@man_contact_mail_1` : values += `,@man_contact_mail_1`
        count += 1
    }
    if (data.man_contact_fax_1 !== undefined && data.man_contact_fax_1 !== null) {
        parameters.push({ name: 'man_contact_fax_1', sqltype: sql.NVarChar, value: data.man_contact_fax_1 })
        column = column == "" ? column += "man_contact_fax_1" : column += ",man_contact_fax_1"
        values = values == "" ? values += `@man_contact_fax_1` : values += `,@man_contact_fax_1`
        count += 1
    }
    if (data.man_contact_name_2 !== undefined && data.man_contact_name_2 !== null) {
        parameters.push({ name: 'man_contact_name_2', sqltype: sql.NVarChar, value: data.man_contact_name_2 })
        column = column == "" ? column += "man_contact_name_2" : column += ",man_contact_name_2"
        values = values == "" ? values += `@man_contact_name_2` : values += `,@man_contact_name_2`
        count += 1
    }
    if (data.man_contact_position_2 !== undefined && data.man_contact_position_2 !== null) {
        parameters.push({ name: 'man_contact_position_2', sqltype: sql.NVarChar, value: data.man_contact_position_2 })
        column = column == "" ? column += "man_contact_position_2" : column += ",man_contact_position_2"
        values = values == "" ? values += `@man_contact_position_2` : values += `,@man_contact_position_2`
        count += 1
    }
    if (data.man_contact_phone_2 !== undefined && data.man_contact_phone_2 !== null) {
        parameters.push({ name: 'man_contact_phone_2', sqltype: sql.NVarChar, value: data.man_contact_phone_2 })
        column = column == "" ? column += "man_contact_phone_2" : column += ",man_contact_phone_2"
        values = values == "" ? values += `@man_contact_phone_2` : values += `,@man_contact_phone_2`
        count += 1
    }
    if (data.man_contact_mail_2 !== undefined && data.man_contact_mail_2 !== null) {
        parameters.push({ name: 'man_contact_mail_2', sqltype: sql.NVarChar, value: data.man_contact_mail_2 })
        column = column == "" ? column += "man_contact_mail_2" : column += ",man_contact_mail_2"
        values = values == "" ? values += `@man_contact_mail_2` : values += `,@man_contact_mail_2`
        count += 1
    }
    if (data.man_contact_fax_2 !== undefined && data.man_contact_fax_2 !== null) {
        parameters.push({ name: 'man_contact_fax_2', sqltype: sql.NVarChar, value: data.man_contact_fax_2 })
        column = column == "" ? column += "man_contact_fax_2" : column += ",man_contact_fax_2"
        values = values == "" ? values += `@man_contact_fax_2` : values += `,@man_contact_fax_2`
        count += 1
    }
    if (data.comp_type !== undefined && data.comp_type !== null) {
        parameters.push({ name: 'comp_type', sqltype: sql.NVarChar, value: data.comp_type })
        column = column == "" ? column += "comp_type" : column += ",comp_type"
        values = values == "" ? values += `@comp_type` : values += `,@comp_type`
        count += 1
    }
    if (data.ManufacturerIsLicencee !== undefined && data.ManufacturerIsLicencee !== null) {
        parameters.push({ name: 'ManufacturerIsLicencee', sqltype: sql.Char, value: data.ManufacturerIsLicencee })
        column = column == "" ? column += "ManufacturerIsLicencee" : column += ",ManufacturerIsLicencee"
        values = values == "" ? values += `@ManufacturerIsLicencee` : values += `,@ManufacturerIsLicencee`
        count += 1
    }

    let query = `INSERT INTO tbl_pp2Form (${column}) VALUES (${values});`

    if (count > 0) {
        query += `SELECT SCOPE_IDENTITY() as id`
        return new Promise((resolve, reject) => {
            mainDb.executeQuery(query, null, parameters, (error, data) => {
                if (error) {
                    console.log(error)
                    return reject(`${error}, ${query}`);
                }
                return resolve(data[0]);
            });
        })
    }
}

// UPDATE QUERIES
exports.updatePP2FormById = (data) => {

    if (data.id !== undefined && data.id !== null) {

        let query = `UPDATE tbl_pp2Form SET `
        let count = 0
        let parameters = []

        if (data.FileId !== undefined && data.FileId !== null) {
            if (count > 0) { query += ',' }
            query += `FileId = @FileId`
            parameters.push({ name: 'FileId', sqltype: sql.BigInt, value: data.FileId })
            count += 1
        }
        if (data.JobId !== undefined && data.JobId !== null) {
            if (count > 0) { query += ',' }
            query += `JobId = @JobId`
            parameters.push({ name: 'JobId', sqltype: sql.BigInt, value: data.JobId })
            count += 1
        }
        if (data.wfid !== undefined && data.wfid !== null) {
            if (count > 0) { query += ',' }
            query += `wfid = @wfid`
            parameters.push({ name: 'wfid', sqltype: sql.BigInt, value: data.wfid })
            count += 1
        }
        if (data.status !== undefined && data.status !== null) {
            if (count > 0) { query += ',' }
            query += `status = @status`
            parameters.push({ name: 'status', sqltype: sql.Char, value: data.status })
            count += 1
        }
        if (data.ModifiedBy !== undefined && data.ModifiedBy !== null) {
            if (count > 0) { query += ',' }
            query += `ModifiedBy = @ModifiedBy`
            parameters.push({ name: 'ModifiedBy', sqltype: sql.Int, value: data.ModifiedBy })
            count += 1
        }
        if (data.to_section !== undefined && data.to_section !== null) {
            if (count > 0) { query += ',' }
            query += `to_section = @to_section`
            parameters.push({ name: 'to_section', sqltype: sql.Int, value: data.to_section })
            count += 1
        }
        if (data.user_type !== undefined && data.user_type !== null) {
            if (count > 0) { query += ',' }
            query += `user_type = @user_type`
            parameters.push({ name: 'user_type', sqltype: sql.NVarChar, value: data.user_type })
            count += 1
        }
        if (data.enquiry_id !== undefined && data.enquiry_id !== null) {
            if (count > 0) { query += ',' }
            query += `enquiry_id = @enquiry_id`
            parameters.push({ name: 'enquiry_id', sqltype: sql.Int, value: data.enquiry_id })
            count += 1
        }
        if (data.cr_id !== undefined && data.cr_id !== null) {
            if (count > 0) { query += ',' }
            query += `cr_id = @cr_id`
            parameters.push({ name: 'cr_id', sqltype: sql.Int, value: data.cr_id })
            count += 1
        }
        if (data.quot_id !== undefined && data.quot_id !== null) {
            if (count > 0) { query += ',' }
            query += `quot_id = @quot_id`
            parameters.push({ name: 'quot_id', sqltype: sql.Int, value: data.quot_id })
            count += 1
        }
        if (data.contact_id !== undefined && data.contact_id !== null) {
            if (count > 0) { query += ',' }
            query += `contact_id = @contact_id`
            parameters.push({ name: 'contact_id', sqltype: sql.Int, value: data.contact_id })
            count += 1
        }
        if (data.cust_id !== undefined && data.cust_id !== null) {
            if (count > 0) { query += ',' }
            query += `cust_id = @cust_id`
            parameters.push({ name: 'cust_id', sqltype: sql.Int, value: data.cust_id })
            count += 1
        }
        if (data.addr_id !== undefined && data.addr_id !== null) {
            if (count > 0) { query += ',' }
            query += `addr_id = @addr_id`
            parameters.push({ name: 'addr_id', sqltype: sql.Int, value: data.addr_id })
            count += 1
        }
        if (data.file_no !== undefined && data.file_no !== null) {
            if (count > 0) { query += ',' }
            query += `file_no = @file_no`
            parameters.push({ name: 'file_no', sqltype: sql.NVarChar, value: data.file_no })
            count += 1
        }
        if (data.license_no !== undefined && data.license_no !== null) {
            if (count > 0) { query += ',' }
            query += `license_no = @license_no`
            parameters.push({ name: 'license_no', sqltype: sql.NVarChar, value: data.license_no })
            count += 1
        }
        if (data.ref_no !== undefined && data.ref_no !== null) {
            if (count > 0) { query += ',' }
            query += `ref_no = @ref_no`
            parameters.push({ name: 'ref_no', sqltype: sql.NVarChar, value: data.ref_no })
            count += 1
        }
        if (data.payment_id !== undefined && data.payment_id !== null) {
            if (count > 0) { query += ',' }
            query += `payment_id = @payment_id`
            parameters.push({ name: 'payment_id', sqltype: sql.Int, value: data.payment_id })
            count += 1
        }
        if (data.sample_qty !== undefined && data.sample_qty !== null) {
            if (count > 0) { query += ',' }
            query += `sample_qty = @sample_qty`
            parameters.push({ name: 'sample_qty', sqltype: sql.NVarChar, value: data.sample_qty })
            count += 1
        }
        if (data.sampling_date !== undefined) {
            if (count > 0) { query += ',' }
            query += `sampling_date = @sampling_date`
            parameters.push({ name: 'sampling_date', sqltype: sql.NVarChar, value: data.sampling_date })
            count += 1
        }
        if (data.treason_pre !== undefined && data.treason_pre !== null) {
            if (count > 0) { query += ',' }
            query += `treason_pre = @treason_pre`
            parameters.push({ name: 'treason_pre', sqltype: sql.Int, value: data.treason_pre })
            count += 1
        }
        if (data.treason_license !== undefined && data.treason_license !== null) {
            if (count > 0) { query += ',' }
            query += `treason_license = @treason_license`
            parameters.push({ name: 'treason_license', sqltype: sql.Int, value: data.treason_license })
            count += 1
        }
        if (data.treason_scheme !== undefined && data.treason_scheme !== null) {
            if (count > 0) { query += ',' }
            query += `treason_scheme = @treason_scheme`
            parameters.push({ name: 'treason_scheme', sqltype: sql.Int, value: data.treason_scheme })
            count += 1
        }
        if (data.treason_other !== undefined && data.treason_other !== null) {
            if (count > 0) { query += ',' }
            query += `treason_other = @treason_other`
            parameters.push({ name: 'treason_other', sqltype: sql.Int, value: data.treason_other })
            count += 1
        }
        if (data.treason_others_specify !== undefined && data.treason_others_specify !== null) {
            if (count > 0) { query += ',' }
            query += `treason_others_specify = @treason_others_specify`
            parameters.push({ name: 'treason_others_specify', sqltype: sql.NVarChar, value: data.treason_others_specify })
            count += 1
        }
        if (data.test_full !== undefined && data.test_full !== null) {
            if (count > 0) { query += ',' }
            query += `test_full = @test_full`
            parameters.push({ name: 'test_full', sqltype: sql.Int, value: data.test_full })
            count += 1
        }
        if (data.test_partial !== undefined && data.test_partial !== null) {
            if (count > 0) { query += ',' }
            query += `test_partial = @test_partial`
            parameters.push({ name: 'test_partial', sqltype: sql.Int, value: data.test_partial })
            count += 1
        }
        if (data.test_confirm !== undefined && data.test_confirm !== null) {
            if (count > 0) { query += ',' }
            query += `test_confirm = @test_confirm`
            parameters.push({ name: 'test_confirm', sqltype: sql.Int, value: data.test_confirm })
            count += 1
        }
        if (data.test_others !== undefined && data.test_others !== null) {
            if (count > 0) { query += ',' }
            query += `test_others = @test_others`
            parameters.push({ name: 'test_others', sqltype: sql.Int, value: data.test_others })
            count += 1
        }
        if (data.test_others_specify !== undefined && data.test_others_specify !== null) {
            if (count > 0) { query += ',' }
            query += `test_others_specify = @test_others_specify`
            parameters.push({ name: 'test_others_specify', sqltype: sql.NVarChar, value: data.test_others_specify })
            count += 1
        }
        if (data.business_reg !== undefined && data.business_reg !== null) {
            if (count > 0) { query += ',' }
            query += `business_reg = @business_reg`
            parameters.push({ name: 'business_reg', sqltype: sql.NVarChar, value: data.business_reg })
            count += 1
        }
        if (data.comp_name !== undefined && data.comp_name !== null) {
            if (count > 0) { query += ',' }
            query += `comp_name = @comp_name`
            parameters.push({ name: 'comp_name', sqltype: sql.NVarChar, value: data.comp_name })
            count += 1
        }
        if (data.address1 !== undefined && data.address1 !== null) {
            if (count > 0) { query += ',' }
            query += `address1 = @address1`
            parameters.push({ name: 'address1', sqltype: sql.NVarChar, value: data.address1 })
            count += 1
        }
        if (data.address2 !== undefined && data.address2 !== null) {
            if (count > 0) { query += ',' }
            query += `address2 = @address2`
            parameters.push({ name: 'address2', sqltype: sql.NVarChar, value: data.address2 })
            count += 1
        }
        if (data.address3 !== undefined && data.address3 !== null) {
            if (count > 0) { query += ',' }
            query += `address3 = @address3`
            parameters.push({ name: 'address3', sqltype: sql.NVarChar, value: data.address3 })
            count += 1
        }
        if (data.postcode !== undefined && data.postcode !== null) {
            if (count > 0) { query += ',' }
            query += `postcode = @postcode`
            parameters.push({ name: 'postcode', sqltype: sql.NVarChar, value: data.postcode })
            count += 1
        }
        if (data.city !== undefined && data.city !== null) {
            if (count > 0) { query += ',' }
            query += `city = @city`
            parameters.push({ name: 'city', sqltype: sql.NVarChar, value: data.city })
            count += 1
        }
        if (data.state !== undefined && data.state !== null) {
            if (count > 0) { query += ',' }
            query += `state = @state`
            parameters.push({ name: 'state', sqltype: sql.NVarChar, value: data.state })
            count += 1
        }
        if (data.country !== undefined && data.country !== null) {
            if (count > 0) { query += ',' }
            query += `country = @country`
            parameters.push({ name: 'country', sqltype: sql.NVarChar, value: data.country })
            count += 1
        }
        if (data.contact_name !== undefined && data.contact_name !== null) {
            if (count > 0) { query += ',' }
            query += `contact_name = @contact_name`
            parameters.push({ name: 'contact_name', sqltype: sql.NVarChar, value: data.contact_name })
            count += 1
        }
        if (data.contact_position !== undefined && data.contact_position !== null) {
            if (count > 0) { query += ',' }
            query += `contact_position = @contact_position`
            parameters.push({ name: 'contact_position', sqltype: sql.NVarChar, value: data.contact_position })
            count += 1
        }
        if (data.contact_phone !== undefined && data.contact_phone !== null) {
            if (count > 0) { query += ',' }
            query += `contact_phone = @contact_phone`
            parameters.push({ name: 'contact_phone', sqltype: sql.NVarChar, value: data.contact_phone })
            count += 1
        }
        if (data.contact_fax !== undefined && data.contact_fax !== null) {
            if (count > 0) { query += ',' }
            query += `contact_fax = @contact_fax`
            parameters.push({ name: 'contact_fax', sqltype: sql.NVarChar, value: data.contact_fax })
            count += 1
        }
        if (data.contact_mail !== undefined && data.contact_mail !== null) {
            if (count > 0) { query += ',' }
            query += `contact_mail = @contact_mail`
            parameters.push({ name: 'contact_mail', sqltype: sql.NVarChar, value: data.contact_mail })
            count += 1
        }
        if (data.manufacturer_id !== undefined && data.manufacturer_id !== null) {
            if (count > 0) { query += ',' }
            query += `manufacturer_id = @manufacturer_id`
            parameters.push({ name: 'manufacturer_id', sqltype: sql.Int, value: data.manufacturer_id })
            count += 1
        }
        if (data.product !== undefined && data.product !== null) {
            if (count > 0) { query += ',' }
            query += `product = @product`
            parameters.push({ name: 'product', sqltype: sql.NVarChar, value: data.product })
            count += 1
        }
        if (data.brand !== undefined && data.brand !== null) {
            if (count > 0) { query += ',' }
            query += `brand = @brand`
            parameters.push({ name: 'brand', sqltype: sql.NVarChar, value: data.brand })
            count += 1
        }
        if (data.type !== undefined && data.type !== null) {
            if (count > 0) { query += ',' }
            query += `type = @type`
            parameters.push({ name: 'type', sqltype: sql.NVarChar, value: data.type })
            count += 1
        }
        if (data.model !== undefined && data.model !== null) {
            if (count > 0) { query += ',' }
            query += `model = @model`
            parameters.push({ name: 'model', sqltype: sql.NVarChar, value: data.model })
            count += 1
        }
        if (data.rating !== undefined && data.rating !== null) {
            if (count > 0) { query += ',' }
            query += `rating = @rating`
            parameters.push({ name: 'rating', sqltype: sql.NVarChar, value: data.rating })
            count += 1
        }
        if (data.size !== undefined && data.size !== null) {
            if (count > 0) { query += ',' }
            query += `size = @size`
            parameters.push({ name: 'size', sqltype: sql.NVarChar, value: data.size })
            count += 1
        }
        if (data.standard !== undefined && data.standard !== null) {
            if (count > 0) { query += ',' }
            query += `standard = @standard`
            parameters.push({ name: 'standard', sqltype: sql.NVarChar, value: data.standard })
            count += 1
        }
        if (data.clause_test !== undefined && data.clause_test !== null) {
            if (count > 0) { query += ',' }
            query += `clause_test = @clause_test`
            parameters.push({ name: 'clause_test', sqltype: sql.NVarChar, value: data.clause_test })
            count += 1
        }
        if (data.remark !== undefined && data.remark !== null) {
            if (count > 0) { query += ',' }
            query += `remark = @remark`
            parameters.push({ name: 'remark', sqltype: sql.NVarChar, value: data.remark })
            count += 1
        }
        if (data.product_desc !== undefined && data.product_desc !== null) {
            if (count > 0) { query += ',' }
            query += `product_desc = @product_desc`
            parameters.push({ name: 'product_desc', sqltype: sql.NVarChar, value: data.product_desc })
            count += 1
        }
        if (data.other_tr !== undefined && data.other_tr !== null) {
            if (count > 0) { query += ',' }
            query += `other_tr = @other_tr`
            parameters.push({ name: 'other_tr', sqltype: sql.NVarChar, value: data.other_tr })
            count += 1
        }
        if (data.sirim_label_no !== undefined && data.sirim_label_no !== null) {
            if (count > 0) { query += ',' }
            query += `sirim_label_no = @sirim_label_no`
            parameters.push({ name: 'sirim_label_no', sqltype: sql.NVarChar, value: data.sirim_label_no })
            count += 1
        }
        if (data.conformity_statement !== undefined && data.conformity_statement !== null) {
            if (count > 0) { query += ',' }
            query += `conformity_statement = @conformity_statement`
            parameters.push({ name: 'conformity_statement', sqltype: sql.Int, value: data.conformity_statement })
            count += 1
        }
        if (data.modifiedby !== undefined && data.modifiedby !== null) {
            if (count > 0) { query += ',' }
            query += `modifiedby = @modifiedby`
            parameters.push({ name: 'modifiedby', sqltype: sql.Int, value: data.modifiedby })
            count += 1
        }
        if (data.created_by !== undefined && data.created_by !== null) {
            if (count > 0) { query += ',' }
            query += `created_by = @created_by`
            parameters.push({ name: 'created_by', sqltype: sql.Int, value: data.created_by })
            count += 1
        }
        if (data.status_id !== undefined && data.status_id !== null) {
            if (count > 0) { query += ',' }
            query += `status_id = @status_id`
            parameters.push({ name: 'status_id', sqltype: sql.Int, value: data.status_id })
            count += 1
        }
        if (data.PdfURL !== undefined && data.PdfURL !== null) {
            if (count > 0) { query += ',' }
            query += `PdfURL = @PdfURL`
            parameters.push({ name: 'PdfURL', sqltype: sql.NVarChar, value: data.PdfURL })
            count += 1
        }
        if (data.modifiedDate !== undefined && data.modifiedDate !== null) {
            if (count > 0) { query += ',' }
            query += `modifiedDate = @modifiedDate`
            parameters.push({ name: 'modifiedDate', sqltype: sql.NVarChar, value: data.modifiedDate })
            count += 1
        }
        if (data.created_on !== undefined && data.created_on !== null) {
            if (count > 0) { query += ',' }
            query += `created_on = @created_on`
            parameters.push({ name: 'created_on', sqltype: sql.NVarChar, value: data.created_on })
            count += 1
        }
        if (data.id_TMS !== undefined && data.id_TMS !== null) {
            if (count > 0) { query += ',' }
            query += `id_TMS = @id_TMS`
            parameters.push({ name: 'id_TMS', sqltype: sql.BigInt, value: data.id_TMS })
            count += 1
        }
        if (data.pp2_id !== undefined && data.pp2_id !== null) {
            if (count > 0) { query += ',' }
            query += `pp2_id = @pp2_id`
            parameters.push({ name: 'pp2_id', sqltype: sql.NVarChar, value: data.pp2_id })
            count += 1
        }
        if (data.pp2_status !== undefined && data.pp2_status !== null) {
            if (count > 0) { query += ',' }
            query += `pp2_status = @pp2_status`
            parameters.push({ name: 'pp2_status', sqltype: sql.NVarChar, value: data.pp2_status })
            count += 1
        }
        if (data.registration_id !== undefined && data.registration_id !== null) {
            if (count > 0) { query += ',' }
            query += `registration_id = @registration_id`
            parameters.push({ name: 'registration_id', sqltype: sql.NVarChar, value: data.registration_id })
            count += 1
        }
        if (data.response_code !== undefined && data.response_code !== null) {
            if (count > 0) { query += ',' }
            query += `response_code = @response_code`
            parameters.push({ name: 'response_code', sqltype: sql.NVarChar, value: data.response_code })
            count += 1
        }
        if (data.response !== undefined && data.response !== null) {
            if (count > 0) { query += ',' }
            query += `response = @response`
            parameters.push({ name: 'response', sqltype: sql.NVarChar, value: data.response })
            count += 1
        }

        if (data.source_pp2 !== undefined && data.source_pp2 !== null) {
            if (count > 0) { query += ',' }
            query += `source_pp2 = @source_pp2`
            parameters.push({ name: 'source_pp2', sqltype: sql.NVarChar, value: data.source_pp2 })
            count += 1
        }
        if (data.email !== undefined && data.email !== null) {
            if (count > 0) { query += ',' }
            query += `email = @email`
            parameters.push({ name: 'email', sqltype: sql.NVarChar, value: data.email })
            count += 1
        }
        if (data.requested_by !== undefined && data.requested_by !== null) {
            if (count > 0) { query += ',' }
            query += `requested_by = @requested_by`
            parameters.push({ name: 'requested_by', sqltype: sql.NVarChar, value: data.requested_by })
            count += 1
        }
        if (data.man_roc !== undefined && data.man_roc !== null) {
            if (count > 0) { query += ',' }
            query += `man_roc = @man_roc`
            parameters.push({ name: 'man_roc', sqltype: sql.NVarChar, value: data.man_roc })
            count += 1
        }
        if (data.man_name !== undefined && data.man_name !== null) {
            if (count > 0) { query += ',' }
            query += `man_name = @man_name`
            parameters.push({ name: 'man_name', sqltype: sql.NVarChar, value: data.man_name })
            count += 1
        }
        if (data.man_address_1 !== undefined && data.man_address_1 !== null) {
            if (count > 0) { query += ',' }
            query += `man_address_1 = @man_address_1`
            parameters.push({ name: 'man_address_1', sqltype: sql.NVarChar, value: data.man_address_1 })
            count += 1
        }
        if (data.man_address_2 !== undefined && data.man_address_2 !== null) {
            if (count > 0) { query += ',' }
            query += `man_address_2 = @man_address_2`
            parameters.push({ name: 'man_address_2', sqltype: sql.NVarChar, value: data.man_address_2 })
            count += 1
        }
        if (data.man_address_3 !== undefined && data.man_address_3 !== null) {
            if (count > 0) { query += ',' }
            query += `man_address_3 = @man_address_3`
            parameters.push({ name: 'man_address_3', sqltype: sql.NVarChar, value: data.man_address_3 })
            count += 1
        }

        if (data.man_postcode !== undefined && data.man_postcode !== null) {
            if (count > 0) { query += ',' }
            query += `man_postcode = @man_postcode`
            parameters.push({ name: 'man_postcode', sqltype: sql.NVarChar, value: data.man_postcode })
            count += 1
        }
        if (data.man_city !== undefined && data.man_city !== null) {
            if (count > 0) { query += ',' }
            query += `man_city = @man_city`
            parameters.push({ name: 'man_city', sqltype: sql.NVarChar, value: data.man_city })
            count += 1
        }
        if (data.man_state !== undefined && data.man_state !== null) {
            if (count > 0) { query += ',' }
            query += `man_state = @man_state`
            parameters.push({ name: 'man_state', sqltype: sql.NVarChar, value: data.man_state })
            count += 1
        }
        if (data.man_country !== undefined && data.man_country !== null) {
            if (count > 0) { query += ',' }
            query += `man_country = @man_country`
            parameters.push({ name: 'man_country', sqltype: sql.NVarChar, value: data.man_country })
            count += 1
        }
        if (data.man_contact_name_1 !== undefined && data.man_contact_name_1 !== null) {
            if (count > 0) { query += ',' }
            query += `man_contact_name_1 = @man_contact_name_1`
            parameters.push({ name: 'man_contact_name_1', sqltype: sql.NVarChar, value: data.man_contact_name_1 })
            count += 1
        }
        if (data.man_contact_position_1 !== undefined && data.man_contact_position_1 !== null) {
            if (count > 0) { query += ',' }
            query += `man_contact_position_1 = @man_contact_position_1`
            parameters.push({ name: 'man_contact_position_1', sqltype: sql.NVarChar, value: data.man_contact_position_1 })
            count += 1
        }
        if (data.man_contact_phone_1 !== undefined && data.man_contact_phone_1 !== null) {
            if (count > 0) { query += ',' }
            query += `man_contact_phone_1 = @man_contact_phone_1`
            parameters.push({ name: 'man_contact_phone_1', sqltype: sql.NVarChar, value: data.man_contact_phone_1 })
            count += 1
        }
        if (data.man_contact_mail_1 !== undefined && data.man_contact_mail_1 !== null) {
            if (count > 0) { query += ',' }
            query += `man_contact_mail_1 = @man_contact_mail_1`
            parameters.push({ name: 'man_contact_mail_1', sqltype: sql.NVarChar, value: data.man_contact_mail_1 })
            count += 1
        }
        if (data.man_contact_fax_1 !== undefined && data.man_contact_fax_1 !== null) {
            if (count > 0) { query += ',' }
            query += `man_contact_fax_1 = @man_contact_fax_1`
            parameters.push({ name: 'man_contact_fax_1', sqltype: sql.NVarChar, value: data.man_contact_fax_1 })
            count += 1
        }
        if (data.man_contact_name_2 !== undefined && data.man_contact_name_2 !== null) {
            if (count > 0) { query += ',' }
            query += `man_contact_name_2 = @man_contact_name_2`
            parameters.push({ name: 'man_contact_name_2', sqltype: sql.NVarChar, value: data.man_contact_name_2 })
            count += 1
        }
        if (data.man_contact_position_2 !== undefined && data.man_contact_position_2 !== null) {
            if (count > 0) { query += ',' }
            query += `man_contact_position_2 = @man_contact_position_2`
            parameters.push({ name: 'man_contact_position_2', sqltype: sql.NVarChar, value: data.man_contact_position_2 })
            count += 1
        }
        if (data.man_contact_phone_2 !== undefined && data.man_contact_phone_2 !== null) {
            if (count > 0) { query += ',' }
            query += `man_contact_phone_2 = @man_contact_phone_2`
            parameters.push({ name: 'man_contact_phone_2', sqltype: sql.NVarChar, value: data.man_contact_phone_2 })
            count += 1
        }
        if (data.man_contact_mail_2 !== undefined && data.man_contact_mail_2 !== null) {
            if (count > 0) { query += ',' }
            query += `man_contact_mail_2 = @man_contact_mail_2`
            parameters.push({ name: 'man_contact_mail_2', sqltype: sql.NVarChar, value: data.man_contact_mail_2 })
            count += 1
        }
        if (data.man_contact_fax_2 !== undefined && data.man_contact_fax_2 !== null) {
            if (count > 0) { query += ',' }
            query += `man_contact_fax_2 = @man_contact_fax_2`
            parameters.push({ name: 'man_contact_fax_2', sqltype: sql.NVarChar, value: data.man_contact_fax_2 })
            count += 1
        }
        if (data.comp_type !== undefined && data.comp_type !== null) {
            if (count > 0) { query += ',' }
            query += `comp_type = @comp_type`
            parameters.push({ name: 'comp_type', sqltype: sql.NVarChar, value: data.comp_type })
            count += 1
        }
        if (data.ManufacturerIsLicencee !== undefined && data.ManufacturerIsLicencee !== null) {
            if (count > 0) { query += ',' }
            query += `ManufacturerIsLicencee = @ManufacturerIsLicencee`
            parameters.push({ name: 'ManufacturerIsLicencee', sqltype: sql.Char, value: data.ManufacturerIsLicencee })
            count += 1
        }
        query += ` WHERE id = @id`
        parameters.push({ name: 'id', sqltype: sql.BigInt, value: data.id })

        if (count > 0) {
            return new Promise((resolve, reject) => {
                mainDb.executeQuery(query, null, parameters, (error, data) => {
                    if (error) {
                        return reject(`${error}, ${query}`);
                    }
                    return resolve(true);
                });
            })
        }
    }
    return false
}
