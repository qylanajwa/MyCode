const sql = require('mssql')
const mainDb = require('../MainDb');

// SELECT queries


//INSERT
exports.InsertData_Customer_Hdr= (data) => {
    let column = ""
    let values = ""
    let count = 0
    let parameters = []


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
    if (data.email !== undefined && data.email !== null) {
        parameters.push({ name: 'email', sqltype: sql.NVarChar, value: data.email })
        column = column == "" ? column += "email" : column += ",email"
        values = values == "" ? values += `@email` : values += `,@email`
        count += 1
    }
    if (data.status !== undefined && data.status !== null) {
        parameters.push({ name: 'status', sqltype: sql.NVarChar, value: data.status })
        column = column == "" ? column += "status" : column += ",status"
        values = values == "" ? values += `@status` : values += `,@status`
        count += 1
    }
   
    let query = `INSERT INTO tbl_tms_res_customer_hdr (${column}) VALUES (${values});`

    if (count > 0) {
        query += `SELECT SCOPE_IDENTITY() as id`
        return new Promise((resolve, reject) => {
            mainDb.executeQuery(query, null, parameters, (error, data) => {
                if (error) {
                    return reject(`${error}, ${query}`);
                }
                return resolve(data[0]);
            });
        })
    }
}

exports.InsertData_Customer_Dtl= (data) => {
    let column = ""
    let values = ""
    let count = 0
    let parameters = []


    if (data.ref_id !== undefined && data.ref_id !== null) {
        parameters.push({ name: 'ref_id', sqltype: sql.BigInt, value: data.ref_id })
        column = column == "" ? column += "ref_id" : column += ",ref_id"
        values = values == "" ? values += `@ref_id` : values += `,@ref_id`
        count += 1
    }
    if (data.registration_id !== undefined && data.registration_id !== null) {
        parameters.push({ name: 'registration_id', sqltype: sql.Int, value: data.registration_id })
        column = column == "" ? column += "registration_id" : column += ",registration_id"
        values = values == "" ? values += `@registration_id` : values += `,@registration_id`
        count += 1
    }
    if (data.crm_id !== undefined && data.crm_id !== null) {
        parameters.push({ name: 'crm_id', sqltype: sql.Int, value: data.crm_id })
        column = column == "" ? column += "crm_id" : column += ",crm_id"
        values = values == "" ? values += `@crm_id` : values += `,@crm_id`
        count += 1
    }
    if (data.address_id !== undefined && data.address_id !== null) {
        parameters.push({ name: 'address_id', sqltype: sql.Int, value: data.address_id })
        column = column == "" ? column += "address_id" : column += ",address_id"
        values = values == "" ? values += `@address_id` : values += `,@address_id`
        count += 1
    }
    if (data.contact_id !== undefined && data.contact_id !== null) {
        parameters.push({ name: 'contact_id', sqltype: sql.Int, value: data.contact_id })
        column = column == "" ? column += "contact_id" : column += ",contact_id"
        values = values == "" ? values += `@contact_id` : values += `,@contact_id`
        count += 1
    }
    if (data.comp_type !== undefined && data.comp_type !== null) {
        parameters.push({ name: 'comp_type', sqltype: sql.Int, value: data.comp_type })
        column = column == "" ? column += "comp_type" : column += ",comp_type"
        values = values == "" ? values += `@comp_type` : values += `,@comp_type`
        count += 1
    }
    if (data.registration_no !== undefined && data.registration_no !== null) {
        parameters.push({ name: 'registration_no', sqltype: sql.NVarChar, value: data.registration_no })
        column = column == "" ? column += "registration_no" : column += ",registration_no"
        values = values == "" ? values += `@registration_no` : values += `,@registration_no`
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
    if (data.ctc_name !== undefined && data.ctc_name !== null) {
        parameters.push({ name: 'ctc_name', sqltype: sql.NVarChar, value: data.ctc_name })
        column = column == "" ? column += "ctc_name" : column += ",ctc_name"
        values = values == "" ? values += `@ctc_name` : values += `,@ctc_name`
        count += 1
    }
    if (data.ctc_designation !== undefined && data.ctc_designation !== null) {
        parameters.push({ name: 'ctc_designation', sqltype: sql.NVarChar, value: data.ctc_designation })
        column = column == "" ? column += "ctc_designation" : column += ",ctc_designation"
        values = values == "" ? values += `@ctc_designation` : values += `,@ctc_designation`
        count += 1
    }
    if (data.ctc_office_no !== undefined && data.ctc_office_no !== null) {
        parameters.push({ name: 'ctc_office_no', sqltype: sql.NVarChar, value: data.ctc_office_no })
        column = column == "" ? column += "ctc_office_no" : column += ",ctc_office_no"
        values = values == "" ? values += `@ctc_office_no` : values += `,@ctc_office_no`
        count += 1
    }
    if (data.ctc_fax_no !== undefined && data.ctc_fax_no !== null) {
        parameters.push({ name: 'ctc_fax_no', sqltype: sql.NVarChar, value: data.ctc_fax_no })
        column = column == "" ? column += "ctc_fax_no" : column += ",ctc_fax_no"
        values = values == "" ? values += `@ctc_fax_no` : values += `,@ctc_fax_no`
        count += 1
    }
    if (data.created_date !== undefined && data.created_date !== null) {
        parameters.push({ name: 'created_date', sqltype: sql.NVarChar, value: data.created_date })
        column = column == "" ? column += "created_date" : column += ",created_date"
        values = values == "" ? values += `@created_date` : values += `,@created_date`
        count += 1
    }

    let query = `INSERT INTO tbl_tms_res_customer_dtl (${column}) VALUES (${values});`

    if (count > 0) {
        query += `SELECT SCOPE_IDENTITY() as id`
        return new Promise((resolve, reject) => {
            mainDb.executeQuery(query, null, parameters, (error, data) => {
                if (error) {
                    return reject(`${error}, ${query}`);
                }
                return resolve(data[0]);
            });
        })
    }
}

// UPDATE QUERIES


