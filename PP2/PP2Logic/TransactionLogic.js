const sql = require('mssql')
const mainDb = require('../MainDb');

exports.SelectTransactionPP2_Id = (ref_id = null, module = null, response_code = null, desc = 1) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'ref_id', sqltype: sql.BigInt, value: ref_id },
            { name: 'module', sqltype: sql.NVarChar, value: module },
            { name: 'response_code', sqltype: sql.NVarChar, value: response_code }
        ]

        let query;
        if (ref_id != null && module != null && response_code != null && desc == 1) {
            query = `select * from tbl_tms_trans where ref_id = @ref_id and module = @module and response_code <> @response_code order by response_date desc `
        }

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.InsertDataTMS_trans = (data) => {
    let column = ""
    let values = ""
    let count = 0
    let parameters = []


    if (data.module !== undefined && data.module !== null) {
        parameters.push({ name: 'module', sqltype: sql.NVarChar, value: data.module })
        column = column == "" ? column += "module" : column += ",module"
        values = values == "" ? values += `@module` : values += `,@module`
        count += 1
    }
    if (data.method !== undefined && data.method !== null) {
        parameters.push({ name: 'method', sqltype: sql.NVarChar, value: data.method })
        column = column == "" ? column += "method" : column += ",method"
        values = values == "" ? values += `@method` : values += `,@method`
        count += 1
    }
    if (data.request_json !== undefined && data.request_json !== null) {
        parameters.push({ name: 'request_json', sqltype: sql.NVarChar, value: data.request_json })
        column = column == "" ? column += "request_json" : column += ",request_json"
        values = values == "" ? values += `@request_json` : values += `,@request_json`
        count += 1
    }
    if (data.response_code !== undefined && data.response_code !== null) {
        parameters.push({ name: 'response_code', sqltype: sql.NVarChar, value: data.response_code })
        column = column == "" ? column += "response_code" : column += ",response_code"
        values = values == "" ? values += `@response_code` : values += `,@response_code`
        count += 1
    }
    if (data.response_json !== undefined && data.response_json !== null) {
        parameters.push({ name: 'response_json', sqltype: sql.NVarChar, value: data.response_json })
        column = column == "" ? column += "response_json" : column += ",response_json"
        values = values == "" ? values += `@response_json` : values += `,@response_json`
        count += 1
    }
    if (data.request_date !== undefined && data.request_date !== null) {
        parameters.push({ name: 'request_date', sqltype: sql.NVarChar, value: data.request_date })
        column = column == "" ? column += "request_date" : column += ",request_date"
        values = values == "" ? values += `@request_date` : values += `,@request_date`
        count += 1
    }
    if (data.response_date !== undefined && data.response_date !== null) {
        parameters.push({ name: 'response_date', sqltype: sql.NVarChar, value: data.response_date })
        column = column == "" ? column += "response_date" : column += ",response_date"
        values = values == "" ? values += `@response_date` : values += `,@response_date`
        count += 1
    }
    if (data.status !== undefined && data.status !== null) {
        parameters.push({ name: 'status', sqltype: sql.NVarChar, value: data.status })
        column = column == "" ? column += "status" : column += ",status"
        values = values == "" ? values += `@status` : values += `,@status`
        count += 1
    }
    if (data.ref_id !== undefined && data.ref_id !== null) {
        parameters.push({ name: 'ref_id', sqltype: sql.BigInt, value: data.ref_id })
        column = column == "" ? column += "ref_id" : column += ",ref_id"
        values = values == "" ? values += `@ref_id` : values += `,@ref_id`
        count += 1
    }
    if (data.full_request !== undefined && data.full_request !== null) {
        parameters.push({ name: 'full_request', sqltype: sql.NVarChar, value: data.full_request })
        column = column == "" ? column += "full_request" : column += ",full_request"
        values = values == "" ? values += `@full_request` : values += `,@full_request`
        count += 1
    }
    if (data.access_token !== undefined && data.access_token !== null) {
        parameters.push({ name: 'access_token', sqltype: sql.NVarChar, value: data.access_token })
        column = column == "" ? column += "access_token" : column += ",access_token"
        values = values == "" ? values += `@access_token` : values += `,@access_token`
        count += 1
    }

    let query = `INSERT INTO tbl_tms_trans (${column}) VALUES (${values});`

    if (count > 0) {
        query += `SELECT SCOPE_IDENTITY() as rec_id`
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

exports.UpdateDataTMSTransALL = (data) => {
    let query = `UPDATE tbl_tms_trans SET `
    let count = 0
    let parameters = []

    if (data.module != undefined && data.module != null) {
        if (count > 0) { query += ',' }
        query += `module = @module`
        parameters.push({ name: 'module', sqltype: sql.NVarChar, value: data.module })
        count += 1
    }
    if (data.method != undefined && data.method != null) {
        if (count > 0) { query += ',' }
        query += `method = @method`
        parameters.push({ name: 'method', sqltype: sql.NVarChar, value: data.method })
        count += 1
    }
    if (data.request_json != undefined && data.request_json != null) {
        if (count > 0) { query += ',' }
        query += `request_json = @request_json`
        parameters.push({ name: 'request_json', sqltype: sql.NVarChar, value: data.request_json })
        count += 1
    }
    if (data.response_code != undefined && data.response_code != null) {
        if (count > 0) { query += ',' }
        query += `response_code = @response_code`
        parameters.push({ name: 'response_code', sqltype: sql.NVarChar, value: data.response_code })
        count += 1
    }
    if (data.response_json != undefined && data.response_json != null) {
        if (count > 0) { query += ',' }
        query += `response_json = @response_json`
        parameters.push({ name: 'response_json', sqltype: sql.NVarChar, value: data.response_json })
        count += 1
    }
    if (data.request_date != undefined && data.request_date != null) {
        if (count > 0) { query += ',' }
        query += `request_date = @request_date`
        parameters.push({ name: 'request_date', sqltype: sql.NVarChar, value: data.request_date })
        count += 1
    }
    if (data.response_date != undefined && data.response_date != null) {
        if (count > 0) { query += ',' }
        query += `response_date = @response_date`
        parameters.push({ name: 'response_date', sqltype: sql.NVarChar, value: data.response_date })
        count += 1
    }
    if (data.status != undefined && data.status != null) {
        if (count > 0) { query += ',' }
        query += `status = @status`
        parameters.push({ name: 'status', sqltype: sql.NVarChar, value: data.status })
        count += 1
    }
    if (data.ref_id != undefined && data.ref_id != null) {
        if (count > 0) { query += ',' }
        query += `ref_id = @ref_id`
        parameters.push({ name: 'ref_id', sqltype: sql.BigInt, value: data.ref_id })
        count += 1
    }

    query += ` WHERE rec_id = @rec_id `
    parameters.push({ name: 'rec_id', sqltype: sql.BigInt, value: data.rec_id })

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

exports.UpdateDataTMS_trans = (data) => {
    let query = `UPDATE tbl_tms_trans SET `
    let count = 0
    let parameters = []

    if (data.ref_id != undefined && data.ref_id != null) {
        if (count > 0) { query += ',' }
        query += `ref_id = @ref_id`
        parameters.push({ name: 'ref_id', sqltype: sql.BigInt, value: data.ref_id })
        count += 1
    }

    query += ` WHERE rec_id = @rec_id `
    parameters.push({ name: 'rec_id', sqltype: sql.BigInt, value: data.rec_id })

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
    // }

}