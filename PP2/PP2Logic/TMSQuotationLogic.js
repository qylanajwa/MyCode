const sql = require('mssql')
const mainDb = require('../MainDb');

//SELECT Queries
exports.SelectQuotationHdr_byRecId = (rec_id) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'rec_id', sqltype: sql.BigInt, value: rec_id }
        ]
        let query = `SELECT * FROM tbl_tms_quotation_hdr WITH (NOLOCK) WHERE rec_id=@rec_id`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectQuotationHdr_byPP2Id = (pp2_id) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'pp2_id', sqltype: sql.NVarChar, value: pp2_id }
        ]
        let query = `SELECT * FROM tbl_tms_quotation_hdr WITH (NOLOCK) WHERE pp2_id=@pp2_id`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectQuotationHdr_byQuoNo = (quotation_no) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'quotation_no', sqltype: sql.NVarChar, value: quotation_no }
        ]
        let query = `SELECT * FROM tbl_tms_quotation_hdr WITH (NOLOCK) WHERE quotation_no=@quotation_no`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectQuotationHdr_byPP2Id_QuoNo = (pp2_id, quotation_no) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'pp2_id', sqltype: sql.NVarChar, value: pp2_id },
            { name: 'quotation_no', sqltype: sql.NVarChar, value: quotation_no }
        ]
        let query = `SELECT * FROM tbl_tms_quotation_hdr WITH (NOLOCK) WHERE pp2_id=@pp2_id AND quotation_no=@quotation_no`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectQuotationHdr_byfileno_pp2id = (file_no, pp2_id) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'file_no', sqltype: sql.NVarChar, value: file_no },
            { name: 'pp2_id', sqltype: sql.NVarChar, value: pp2_id }
        ]
        let query = `SELECT * FROM tbl_tms_quotation_hdr WITH (NOLOCK) WHERE file_no=@file_no AND pp2_id=@pp2_id`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectExistedJobForPP2 = (file_no, pp2_id) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'file_no', sqltype: sql.NVarChar, value: file_no },
            { name: 'pp2_id', sqltype: sql.NVarChar, value: pp2_id }
        ]
        let query = `select qhdr.file_no,qhdr.pp2_id,qhdr.pp2_status,qdtl.job_id,qdtl.job_no,qdtl.job_status
        from tbl_tms_quotation_hdr qhdr join tbl_tms_quotation_dtl qdtl on qhdr.rec_id = qdtl.tms_quotation_hdr_id
        where qhdr.file_no=@file_no and pp2_id=@pp2_id`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectQuotationDtl_byPKRecId = (tms_quotation_hdr_id) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'tms_quotation_hdr_id', sqltype: sql.BigInt, value: tms_quotation_hdr_id }
        ]
        let query = `SELECT * FROM tbl_tms_quotation_dtl WITH (NOLOCK) WHERE tms_quotation_hdr_id=@tms_quotation_hdr_id`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectQuotationDtl_byPKRecId_job_id = (tms_quotation_hdr_id, job_id) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'tms_quotation_hdr_id', sqltype: sql.BigInt, value: tms_quotation_hdr_id },
            { name: 'job_id', sqltype: sql.BigInt, value: job_id }
        ]
        let query = `SELECT * FROM tbl_tms_quotation_dtl WITH (NOLOCK) WHERE tms_quotation_hdr_id=@tms_quotation_hdr_id AND job_id=@job_id`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectQuotationDtl_byPKRecId_tmsJob = (tms_quotation_hdr_id, job_id, job_no) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'tms_quotation_hdr_id', sqltype: sql.BigInt, value: tms_quotation_hdr_id },
            { name: 'job_id', sqltype: sql.BigInt, value: job_id },
            { name: 'job_no', sqltype: sql.NVarChar, value: job_no }
        ]
        let query = `SELECT * FROM tbl_tms_quotation_dtl WITH (NOLOCK) WHERE tms_quotation_hdr_id=@tms_quotation_hdr_id AND job_id=@job_id AND job_no=@job_no`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectQuotationDtl_byTMSJobNo = (job_no) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'job_no', sqltype: sql.NVarChar, value: job_no }
        ]
        let query = `SELECT * FROM tbl_tms_quotation_dtl WITH (NOLOCK) WHERE job_no=@job_no`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectQuotationDtl_byItem_id = (item_id) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'item_id', sqltype: sql.BigInt, value: item_id }
        ]
        let query = `SELECT * FROM tbl_tms_quotation_dtl WITH (NOLOCK) WHERE job_id=@item_id`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectJob_by_pp2Id = (pp2_id) => { //to check whether application has created job/not in TMS
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'pp2_id', sqltype: sql.NVarChar, value: pp2_id }
        ]
        let query = `select qHdr.* from tbl_pp2Form pp2 join tbl_tms_quotation_hdr qHdr 
        on pp2.pp2_id=qHdr.pp2_id
        join tbl_tms_quotation_dtl qDtl on qDtl.tms_quotation_hdr_id = qHdr.rec_id
        where pp2.pp2_id=@pp2_id`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

//INSERT QUERIES
exports.InsertQuotationHdr = (data) => {
    let column = ""
    let values = ""
    let count = 0
    let parameters = []

    if (data.file_no !== undefined) {
        parameters.push({ name: 'file_no', sqltype: sql.NVarChar, value: data.file_no })
        column = column == "" ? column += "file_no" : column += ",file_no"
        values = values == "" ? values += `@file_no` : values += `,@file_no`
        count += 1
    }
    if (data.pp2_id !== undefined) {
        parameters.push({ name: 'pp2_id', sqltype: sql.NVarChar, value: data.pp2_id })
        column = column == "" ? column += "pp2_id" : column += ",pp2_id"
        values = values == "" ? values += `@pp2_id` : values += `,@pp2_id`
        count += 1
    }
    if (data.pp2_status !== undefined) {
        parameters.push({ name: 'pp2_status', sqltype: sql.NVarChar, value: data.pp2_status })
        column = column == "" ? column += "pp2_status" : column += ",pp2_status"
        values = values == "" ? values += `@pp2_status` : values += `,@pp2_status`
        count += 1
    }
    if (data.quotation_no !== undefined) {
        parameters.push({ name: 'quotation_no', sqltype: sql.NVarChar, value: data.quotation_no })
        column = column == "" ? column += "quotation_no" : column += ",quotation_no"
        values = values == "" ? values += `@quotation_no` : values += `,@quotation_no`
        count += 1
    }
    if (data.quotation_status !== undefined) {
        parameters.push({ name: 'quotation_status', sqltype: sql.NVarChar, value: data.quotation_status })
        column = column == "" ? column += "quotation_status" : column += ",quotation_status"
        values = values == "" ? values += `@quotation_status` : values += `,@quotation_status`
        count += 1
    }
    if (data.prepared_by !== undefined) {
        parameters.push({ name: 'prepared_by', sqltype: sql.NVarChar, value: data.prepared_by })
        column = column == "" ? column += "prepared_by" : column += ",prepared_by"
        values = values == "" ? values += `@prepared_by` : values += `,@prepared_by`
        count += 1
    }
    if (data.prepared_by_name !== undefined) {
        parameters.push({ name: 'prepared_by_name', sqltype: sql.NVarChar, value: data.prepared_by_name })
        column = column == "" ? column += "prepared_by_name" : column += ",prepared_by_name"
        values = values == "" ? values += `@prepared_by_name` : values += `,@prepared_by_name`
        count += 1
    }
    if (data.prepared_date !== undefined) { // date from tms
        parameters.push({ name: 'prepared_date', sqltype: sql.NVarChar, value: data.prepared_date })
        column = column == "" ? column += "prepared_date" : column += ",prepared_date"
        values = values == "" ? values += `@prepared_date` : values += `,@prepared_date`
        count += 1
    }
    if (data.created_date !== undefined) { // Current date (date data received from myTMS)
        parameters.push({ name: 'created_date', sqltype: sql.NVarChar, value: data.created_date })
        column = column == "" ? column += "created_date" : column += ",created_date"
        values = values == "" ? values += `@created_date` : values += `,@created_date`
        count += 1
    }
    
    let query = `INSERT INTO tbl_tms_quotation_hdr (${column}) VALUES (${values});`
    if (count > 0) {
        query += `SELECT SCOPE_IDENTITY() as rec_id`
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

exports.InsertQuotationDtl = (data) => {
    let column = ""
    let values = ""
    let count = 0
    let parameters = []

    if (data.job_id !== undefined) {
        parameters.push({ name: 'job_id', sqltype: sql.BigInt, value: data.job_id })
        column = column == "" ? column += "job_id" : column += ",job_id"
        values = values == "" ? values += `@job_id` : values += `,@job_id`
        count += 1
    }
    if (data.job_no !== undefined) {
        parameters.push({ name: 'job_no', sqltype: sql.NVarChar, value: data.job_no })
        column = column == "" ? column += "job_no" : column += ",job_no"
        values = values == "" ? values += `@job_no` : values += `,@job_no`
        count += 1
    }
    if (data.job_status !== undefined) {
        parameters.push({ name: 'job_status', sqltype: sql.NVarChar, value: data.job_status })
        column = column == "" ? column += "job_status" : column += ",job_status"
        values = values == "" ? values += `@job_status` : values += `,@job_status`
        count += 1
    }
    if (data.tms_quotation_hdr_id !== undefined) {
        parameters.push({ name: 'tms_quotation_hdr_id', sqltype: sql.BigInt, value: data.tms_quotation_hdr_id })
        column = column == "" ? column += "tms_quotation_hdr_id" : column += ",tms_quotation_hdr_id"
        values = values == "" ? values += `@tms_quotation_hdr_id` : values += `,@tms_quotation_hdr_id`
        count += 1
    }
    
    let query = `INSERT INTO tbl_tms_quotation_dtl (${column}) VALUES (${values});`
    if (count > 0) {
        query += `SELECT SCOPE_IDENTITY() as rec_id`
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

//UPDATE QUERIES
exports.UpdateQuotationHdr = (data) => {
    if(data.rec_id !== undefined && data.rec_id !== null) {
        let query = `UPDATE tbl_tms_quotation_hdr SET `
        let count = 0
        let parameters = []

        if (data.file_no !== undefined && data.file_no !== null) {
            if (count > 0) { query += ',' }
            query += `file_no = @file_no`
            parameters.push({ name: 'file_no', sqltype: sql.NVarChar, value: data.file_no })
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
        if (data.quotation_no !== undefined && data.quotation_no !== null) {
            if (count > 0) { query += ',' }
            query += `quotation_no = @quotation_no`
            parameters.push({ name: 'quotation_no', sqltype: sql.NVarChar, value: data.quotation_no })
            count += 1
        }
        if (data.quotation_status !== undefined && data.quotation_status !== null) {
            if (count > 0) { query += ',' }
            query += `quotation_status = @quotation_status`
            parameters.push({ name: 'quotation_status', sqltype: sql.NVarChar, value: data.quotation_status })
            count += 1
        }
        if (data.prepared_by !== undefined && data.prepared_by !== null) {
            if (count > 0) { query += ',' }
            query += `prepared_by = @prepared_by`
            parameters.push({ name: 'prepared_by', sqltype: sql.NVarChar, value: data.prepared_by })
            count += 1
        }
        if (data.prepared_by_name !== undefined && data.prepared_by_name !== null) {
            if (count > 0) { query += ',' }
            query += `prepared_by_name = @prepared_by_name`
            parameters.push({ name: 'prepared_by_name', sqltype: sql.NVarChar, value: data.prepared_by_name })
            count += 1
        }
        if (data.prepared_date !== undefined && data.prepared_date !== null) {
            if (count > 0) { query += ',' }
            query += `prepared_date = @prepared_date`
            parameters.push({ name: 'prepared_date', sqltype: sql.NVarChar, value: data.prepared_date })
            count += 1
        }
        if (data.created_date !== undefined && data.created_date !== null) {
            if (count > 0) { query += ',' }
            query += `created_date = @created_date`
            parameters.push({ name: 'created_date', sqltype: sql.NVarChar, value: data.created_date })
            count += 1
        }

        query += ` WHERE rec_id = @rec_id`
        parameters.push({ name: 'rec_id', sqltype: sql.BigInt, value: data.rec_id })

        if (count > 0) {
            return new Promise((resolve, reject) => {
                mainDb.executeQuery(query, null, parameters, (error, data) => {
                    if (error) {
                        return reject(`${error}, ${query}`);
                    }
                    return resolve(data);
                });
            })
        }
    }
    else return false 
}

exports.UpdateQuotationHdr_byfileno_pp2id = (data) => {
    let query = `UPDATE tbl_tms_quotation_hdr SET `
    let count = 0
    let parameters = []

    if (data.pp2_status !== undefined && data.pp2_status !== null) {
        if (count > 0) { query += ',' }
        query += `pp2_status = @pp2_status`
        parameters.push({ name: 'pp2_status', sqltype: sql.NVarChar, value: data.pp2_status })
        count += 1
    }
    if (data.quotation_no !== undefined && data.quotation_no !== null) {
        if (count > 0) { query += ',' }
        query += `quotation_no = @quotation_no`
        parameters.push({ name: 'quotation_no', sqltype: sql.NVarChar, value: data.quotation_no })
        count += 1
    }
    if (data.quotation_status !== undefined && data.quotation_status !== null) {
        if (count > 0) { query += ',' }
        query += `quotation_status = @quotation_status`
        parameters.push({ name: 'quotation_status', sqltype: sql.NVarChar, value: data.quotation_status })
        count += 1
    }
    if (data.prepared_by !== undefined && data.prepared_by !== null) {
        if (count > 0) { query += ',' }
        query += `prepared_by = @prepared_by`
        parameters.push({ name: 'prepared_by', sqltype: sql.NVarChar, value: data.prepared_by })
        count += 1
    }
    if (data.prepared_by_name !== undefined && data.prepared_by_name !== null) {
        if (count > 0) { query += ',' }
        query += `prepared_by_name = @prepared_by_name`
        parameters.push({ name: 'prepared_by_name', sqltype: sql.NVarChar, value: data.prepared_by_name })
        count += 1
    }
    if (data.prepared_date !== undefined && data.prepared_date !== null) {
        if (count > 0) { query += ',' }
        query += `prepared_date = @prepared_date`
        parameters.push({ name: 'prepared_date', sqltype: sql.NVarChar, value: data.prepared_date })
        count += 1
    }
    if (data.created_date !== undefined && data.created_date !== null) {
        if (count > 0) { query += ',' }
        query += `created_date = @created_date`
        parameters.push({ name: 'created_date', sqltype: sql.NVarChar, value: data.created_date })
        count += 1
    }

    query += ` WHERE file_no = @file_no AND pp2_id=@pp2_id`
    parameters.push({ name: 'file_no', sqltype: sql.NVarChar, value: data.file_no })
    parameters.push({ name: 'pp2_id', sqltype: sql.NVarChar, value: data.pp2_id })

    if (count > 0) {
        return new Promise((resolve, reject) => {
            mainDb.executeQuery(query, null, parameters, (error, data) => {
                if (error) {
                    return reject(`${error}, ${query}`);
                }
                return resolve(data);
            });
        })
    }
}

exports.UpdateQuotationDtl = (data) => {
    if(data.rec_id !== undefined && data.rec_id !== null) {
        let query = `UPDATE tbl_tms_quotation_dtl SET `
        let count = 0
        let parameters = []

        if (data.job_id !== undefined && data.job_id !== null) {
            if (count > 0) { query += ',' }
            query += `job_id = @job_id`
            parameters.push({ name: 'job_id', sqltype: sql.BigInt, value: data.job_id })
            count += 1
        }
        if (data.job_no !== undefined && data.job_no !== null) {
            if (count > 0) { query += ',' }
            query += `job_no = @job_no`
            parameters.push({ name: 'job_no', sqltype: sql.NVarChar, value: data.job_no })
            count += 1
        }
        if (data.job_status !== undefined && data.job_status !== null) {
            if (count > 0) { query += ',' }
            query += `job_status = @job_status`
            parameters.push({ name: 'job_status', sqltype: sql.NVarChar, value: data.job_status })
            count += 1
        }
        if (data.tms_quotation_hdr_id !== undefined && data.tms_quotation_hdr_id !== null) {
            if (count > 0) { query += ',' }
            query += `tms_quotation_hdr_id = @tms_quotation_hdr_id`
            parameters.push({ name: 'tms_quotation_hdr_id', sqltype: sql.BigInt, value: data.tms_quotation_hdr_id })
            count += 1
        }

        query += ` WHERE rec_id = @rec_id`
        parameters.push({ name: 'rec_id', sqltype: sql.BigInt, value: data.rec_id })

        if (count > 0) {
            return new Promise((resolve, reject) => {
                mainDb.executeQuery(query, null, parameters, (error, data) => {
                    if (error) {
                        return reject(`${error}, ${query}`);
                    }
                    return resolve(data);
                });
            })
        }
    }
    else return false 
}