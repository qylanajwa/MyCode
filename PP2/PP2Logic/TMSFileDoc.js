const sql = require('mssql')
const mainDb = require('../MainDb');

exports.SelectFileDoc_byDocNo_DocType = (doc_no, doc_type) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'doc_no', sqltype: sql.NVarChar, value: doc_no },
            { name: 'doc_type', sqltype: sql.BigInt, value: doc_type },
        ]
        let query = `SELECT * FROM tbl_tms_file_doc WITH (NOLOCK) WHERE doc_no=@doc_no AND doc_type=@doc_type`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.InsertDataTMSFileDoc= (data) => {
    let column = ""
    let values = ""
    let count = 0
    let parameters = []

    if (data.doc_no !== undefined && data.doc_no !== null) {
        parameters.push({ name: 'doc_no', sqltype: sql.NVarChar, value: data.doc_no })
        column = column == "" ? column += "doc_no" : column += ",doc_no"
        values = values == "" ? values += `@doc_no` : values += `,@doc_no`
        count += 1
    }
    if (data.doc_type !== undefined && data.doc_type !== null) {
        parameters.push({ name: 'doc_type', sqltype: sql.BigInt, value: data.doc_type })
        column = column == "" ? column += "doc_type" : column += ",doc_type"
        values = values == "" ? values += `@doc_type` : values += `,@doc_type`
        count += 1
    }
    if (data.file_link !== undefined && data.file_link !== null) {
        parameters.push({ name: 'file_link', sqltype: sql.NVarChar, value: data.file_link })
        column = column == "" ? column += "file_link" : column += ",file_link"
        values = values == "" ? values += `@file_link` : values += `,@file_link`
        count += 1
    }
    
    let query = `INSERT INTO tbl_tms_file_doc (${column}) VALUES (${values});`

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

exports.UpdateDataTMSFileDoc = (data) => {
    if(data.rec_id) {
        let query = `UPDATE tbl_tms_file_doc SET `
        let count = 0
        let parameters = []

        if (data.doc_no != undefined && data.doc_no != null) {
            if (count > 0) { query += ',' }
            query += `doc_no = @doc_no`
            parameters.push({ name: 'doc_no', sqltype: sql.NVarChar, value: data.doc_no })
            count += 1
        }
        if (data.doc_type != undefined && data.doc_type != null) {
            if (count > 0) { query += ',' }
            query += `doc_type = @doc_type`
            parameters.push({ name: 'doc_type', sqltype: sql.BigInt, value: data.doc_type })
            count += 1
        }
        if (data.file_link != undefined && data.file_link != null) {
            if (count > 0) { query += ',' }
            query += `file_link = @file_link`
            parameters.push({ name: 'file_link', sqltype: sql.NVarChar, value: data.file_link })
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
    else return false
}

exports.UpdateDataTMSFileDoc_byDocNo_DocType = (data) => {
    let query = `UPDATE tbl_tms_file_doc SET `
    let count = 0
    let parameters = []

    if (data.file_link != undefined && data.file_link != null) {
        if (count > 0) { query += ',' }
        query += `file_link = @file_link`
        parameters.push({ name: 'file_link', sqltype: sql.NVarChar, value: data.file_link })
        count += 1
    }

    query += ` WHERE doc_no=@doc_no AND doc_type=@doc_type `
    parameters.push({ name: 'doc_no', sqltype: sql.NVarChar, value: data.doc_no })
    parameters.push({ name: 'doc_type', sqltype: sql.BigInt, value: data.doc_type })

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