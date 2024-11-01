const sql = require('mssql')
const mainDb = require('../MainDb');

//SELECT Queries
exports.SelectJobHdr_byRecId = (rec_id) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'rec_id', sqltype: sql.BigInt, value: rec_id }
        ]
        let query = `SELECT * FROM tbl_tms_job_hdr WITH (NOLOCK) WHERE rec_id=@rec_id`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectJobHdr_byJobNo = (job_no) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'job_no', sqltype: sql.NVarChar, value: job_no }
        ]
        let query = `SELECT * FROM tbl_tms_job_hdr WITH (NOLOCK) WHERE job_no=@job_no`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectJobHdr_byItem_id = (item_id) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'item_id', sqltype: sql.BigInt, value: item_id }
        ]
        let query = `SELECT * FROM tbl_tms_job_hdr WITH (NOLOCK) WHERE item_id=@item_id`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectJobHdr_byJobNo_item_id = (job_no, item_id) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'job_no', sqltype: sql.NVarChar, value: job_no },
            { name: 'item_id', sqltype: sql.BigInt, value: item_id }
        ]
        let query = `SELECT * FROM tbl_tms_job_hdr WITH (NOLOCK) WHERE job_no=@job_no AND item_id=@item_id`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectJobHdr_byJobNo_JobType = (job_no, job_type) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'job_no', sqltype: sql.NVarChar, value: job_no },
            { name: 'job_type', sqltype: sql.BigInt, value: job_type }
        ]
        let query = `SELECT * FROM tbl_tms_job_hdr WITH (NOLOCK) WHERE job_no=@job_no AND job_type=@job_type`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectJobHdr_byJobNo_JobType_itemid = (job_no, job_type, item_id) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'job_no', sqltype: sql.NVarChar, value: job_no },
            { name: 'job_type', sqltype: sql.BigInt, value: job_type },
            { name: 'item_id', sqltype: sql.BigInt, value: item_id }
        ]
        let query = `SELECT * FROM tbl_tms_job_hdr WITH (NOLOCK) WHERE job_no=@job_no AND job_type=@job_type AND item_id=@item_id`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectJobDtl_byJobHdrId = (tms_job_hdr_id) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'tms_job_hdr_id', sqltype: sql.BigInt, value: tms_job_hdr_id }
        ]
        let query = `SELECT * FROM tbl_tms_job_dtl WITH (NOLOCK) WHERE tms_job_hdr_id=@tms_job_hdr_id`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectJobDtl_byJobHdrId_TRptNo = (tms_job_hdr_id, test_report_no) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'tms_job_hdr_id', sqltype: sql.BigInt, value: tms_job_hdr_id },
            { name: 'test_report_no', sqltype: sql.NVarChar, value: test_report_no }
        ]
        let query = `SELECT * FROM tbl_tms_job_dtl WITH (NOLOCK) WHERE tms_job_hdr_id=@tms_job_hdr_id AND test_report_no=@test_report_no`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectJobDtl_byTRptNo = (test_report_no) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'test_report_no', sqltype: sql.NVarChar, value: test_report_no }
        ]
        let query = `SELECT * FROM tbl_tms_job_dtl WITH (NOLOCK) WHERE test_report_no=@test_report_no`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectJobHdr_JobDtl_ByJobIdJobNo= (jobid,jobno) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'job_id', sqltype: sql.BigInt, value: jobid },
            { name: 'jobno', sqltype: sql.NVarChar, value: jobno },

        ]
        let query = `select hdr.rec_id as jobHdrId,dtl.rec_id as testRptId,* from tbl_tms_job_hdr hdr join tbl_tms_job_dtl dtl
                     on dtl.tms_job_hdr_id = hdr.rec_id
                     where hdr.job_id=@job_id and hdr.job_no=@jobno`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}


//INSERT QUERIES
exports.InsertJobHdr = (data) => {
    let column = ""
    let values = ""
    let count = 0
    let parameters = []

    if (data.item_id !== undefined) {
        parameters.push({ name: 'item_id', sqltype: sql.BigInt, value: data.item_id })
        column = column == "" ? column += "item_id" : column += ",item_id"
        values = values == "" ? values += `@item_id` : values += `,@item_id`
        count += 1
    }
    if (data.job_no !== undefined) {
        parameters.push({ name: 'job_no', sqltype: sql.NVarChar, value: data.job_no })
        column = column == "" ? column += "job_no" : column += ",job_no"
        values = values == "" ? values += `@job_no` : values += `,@job_no`
        count += 1
    }
    if (data.job_type !== undefined) {
        parameters.push({ name: 'job_type', sqltype: sql.BigInt, value: data.job_type })
        column = column == "" ? column += "job_type" : column += ",job_type"
        values = values == "" ? values += `@job_type` : values += `,@job_type`
        count += 1
    }
    if (data.job_id !== undefined) {
        parameters.push({ name: 'job_id', sqltype: sql.BigInt, value: data.job_id })
        column = column == "" ? column += "job_id" : column += ",job_id"
        values = values == "" ? values += `@job_id` : values += `,@job_id`
        count += 1
    }
    if (data.job_status !== undefined) {
        parameters.push({ name: 'job_status', sqltype: sql.NVarChar, value: data.job_status })
        column = column == "" ? column += "job_status" : column += ",job_status"
        values = values == "" ? values += `@job_status` : values += `,@job_status`
        count += 1
    }
    if (data.hold_status !== undefined) {
        parameters.push({ name: 'hold_status', sqltype: sql.BigInt, value: data.hold_status })
        column = column == "" ? column += "hold_status" : column += ",hold_status"
        values = values == "" ? values += `@hold_status` : values += `,@hold_status`
        count += 1
    }
    if (data.hold_remarks !== undefined) {
        parameters.push({ name: 'hold_remarks', sqltype: sql.NVarChar, value: data.hold_remarks })
        column = column == "" ? column += "hold_remarks" : column += ",hold_remarks"
        values = values == "" ? values += `@hold_remarks` : values += `,@hold_remarks`
        count += 1
    }
    if (data.hold_date !== undefined) {
        parameters.push({ name: 'hold_date', sqltype: sql.NVarChar, value: data.hold_date })
        column = column == "" ? column += "hold_date" : column += ",hold_date"
        values = values == "" ? values += `@hold_date` : values += `,@hold_date`
        count += 1
    }
    if (data.job_link !== undefined) {
        parameters.push({ name: 'job_link', sqltype: sql.NVarChar, value: data.job_link })
        column = column == "" ? column += "job_link" : column += ",job_link"
        values = values == "" ? values += `@job_link` : values += `,@job_link`
        count += 1
    }
    if (data.pic !== undefined) {
        parameters.push({ name: 'pic', sqltype: sql.NVarChar, value: data.pic })
        column = column == "" ? column += "pic" : column += ",pic"
        values = values == "" ? values += `@pic` : values += `,@pic`
        count += 1
    }
    if (data.pic_name !== undefined) {
        parameters.push({ name: 'pic_name', sqltype: sql.NVarChar, value: data.pic_name })
        column = column == "" ? column += "pic_name" : column += ",pic_name"
        values = values == "" ? values += `@pic_name` : values += `,@pic_name`
        count += 1
    }
    if (data.pic_phone !== undefined) {
        parameters.push({ name: 'pic_phone', sqltype: sql.NVarChar, value: data.pic_phone })
        column = column == "" ? column += "pic_phone" : column += ",pic_phone"
        values = values == "" ? values += `@pic_phone` : values += `,@pic_phone`
        count += 1
    }
    if (data.pic_email !== undefined) {
        parameters.push({ name: 'pic_email', sqltype: sql.NVarChar, value: data.pic_email })
        column = column == "" ? column += "pic_email" : column += ",pic_email"
        values = values == "" ? values += `@pic_email` : values += `,@pic_email`
        count += 1
    }
    if (data.modified_date !== undefined) {
        parameters.push({ name: 'modified_date', sqltype: sql.NVarChar, value: data.modified_date })
        column = column == "" ? column += "modified_date" : column += ",modified_date"
        values = values == "" ? values += `@modified_date` : values += `,@modified_date`
        count += 1
    }
    if (data.due_date !== undefined) {
        parameters.push({ name: 'due_date', sqltype: sql.NVarChar, value: data.due_date })
        column = column == "" ? column += "due_date" : column += ",due_date"
        values = values == "" ? values += `@due_date` : values += `,@due_date`
        count += 1
    }
    
    let query = `INSERT INTO tbl_tms_job_hdr (${column}) VALUES (${values});`
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

exports.InsertJobDtl = (data) => {
    let column = ""
    let values = ""
    let count = 0
    let parameters = []

    if (data.test_report_no !== undefined) {
        parameters.push({ name: 'test_report_no', sqltype: sql.NVarChar, value: data.test_report_no })
        column = column == "" ? column += "test_report_no" : column += ",test_report_no"
        values = values == "" ? values += `@test_report_no` : values += `,@test_report_no`
        count += 1
    }
    if (data.test_report_status !== undefined) {
        parameters.push({ name: 'test_report_status', sqltype: sql.NVarChar, value: data.test_report_status })
        column = column == "" ? column += "test_report_status" : column += ",test_report_status"
        values = values == "" ? values += `@test_report_status` : values += `,@test_report_status`
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
    if (data.prepared_date !== undefined) {
        parameters.push({ name: 'prepared_date', sqltype: sql.NVarChar, value: data.prepared_date })
        column = column == "" ? column += "prepared_date" : column += ",prepared_date"
        values = values == "" ? values += `@prepared_date` : values += `,@prepared_date`
        count += 1
    }
    if (data.approved_date !== undefined) {
        parameters.push({ name: 'approved_date', sqltype: sql.NVarChar, value: data.approved_date })
        column = column == "" ? column += "approved_date" : column += ",approved_date"
        values = values == "" ? values += `@approved_date` : values += `,@approved_date`
        count += 1
    }
    if (data.tms_job_hdr_id !== undefined) {
        parameters.push({ name: 'tms_job_hdr_id', sqltype: sql.BigInt, value: data.tms_job_hdr_id })
        column = column == "" ? column += "tms_job_hdr_id" : column += ",tms_job_hdr_id"
        values = values == "" ? values += `@tms_job_hdr_id` : values += `,@tms_job_hdr_id`
        count += 1
    }
    if (data.test_report_link !== undefined) {
        parameters.push({ name: 'test_report_link', sqltype: sql.NVarChar, value: data.test_report_link })
        column = column == "" ? column += "test_report_link" : column += ",test_report_link"
        values = values == "" ? values += `@test_report_link` : values += `,@test_report_link`
        count += 1
    }
    if (data.tr_folder_link !== undefined) {
        parameters.push({ name: 'tr_folder_link', sqltype: sql.NVarChar, value: data.tr_folder_link })
        column = column == "" ? column += "tr_folder_link" : column += ",tr_folder_link"
        values = values == "" ? values += `@tr_folder_link` : values += `,@tr_folder_link`
        count += 1
    }
    
    let query = `INSERT INTO tbl_tms_job_dtl (${column}) VALUES (${values});`
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
exports.UpdateJobHdr = (data) => {
    if(data.rec_id !== undefined && data.rec_id !== null) {
        let query = `UPDATE tbl_tms_job_hdr SET `
        let count = 0
        let parameters = []

        if (data.item_id !== undefined && data.item_id !== null) {
            if (count > 0) { query += ',' }
            query += `item_id = @item_id`
            parameters.push({ name: 'item_id', sqltype: sql.BigInt, value: data.item_id })
            count += 1
        }
        if (data.job_no !== undefined && data.job_no !== null) {
            if (count > 0) { query += ',' }
            query += `job_no = @job_no`
            parameters.push({ name: 'job_no', sqltype: sql.NVarChar, value: data.job_no })
            count += 1
        }
        if (data.job_type !== undefined && data.job_type !== null) {
            if (count > 0) { query += ',' }
            query += `job_type = @job_type`
            parameters.push({ name: 'job_type', sqltype: sql.BigInt, value: data.job_type })
            count += 1
        }
        if (data.job_id !== undefined && data.job_id !== null) {
            if (count > 0) { query += ',' }
            query += `job_id = @job_id`
            parameters.push({ name: 'job_id', sqltype: sql.BigInt, value: data.job_id })
            count += 1
        }
        if (data.job_status !== undefined && data.job_status !== null) {
            if (count > 0) { query += ',' }
            query += `job_status = @job_status`
            parameters.push({ name: 'job_status', sqltype: sql.NVarChar, value: data.job_status })
            count += 1
        }
        if (data.hold_status !== undefined && data.hold_status !== null) {
            if (count > 0) { query += ',' }
            query += `hold_status = @hold_status`
            parameters.push({ name: 'hold_status', sqltype: sql.BigInt, value: data.hold_status })
            count += 1
        }
        if (data.hold_remarks !== undefined && data.hold_remarks !== null) {
            if (count > 0) { query += ',' }
            query += `hold_remarks = @hold_remarks`
            parameters.push({ name: 'hold_remarks', sqltype: sql.NVarChar, value: data.hold_remarks })
            count += 1
        }
        if (data.job_link !== undefined && data.job_link !== null) {
            if (count > 0) { query += ',' }
            query += `job_link = @job_link`
            parameters.push({ name: 'job_link', sqltype: sql.NVarChar, value: data.job_link })
            count += 1
        }
        if (data.pic !== undefined && data.pic !== null) {
            if (count > 0) { query += ',' }
            query += `pic = @pic`
            parameters.push({ name: 'pic', sqltype: sql.NVarChar, value: data.pic })
            count += 1
        }
        if (data.pic_name !== undefined && data.pic_name !== null) {
            if (count > 0) { query += ',' }
            query += `pic_name = @pic_name`
            parameters.push({ name: 'pic_name', sqltype: sql.NVarChar, value: data.pic_name })
            count += 1
        }
        if (data.pic_phone !== undefined && data.pic_phone !== null) {
            if (count > 0) { query += ',' }
            query += `pic_phone = @pic_phone`
            parameters.push({ name: 'pic_phone', sqltype: sql.NVarChar, value: data.pic_phone })
            count += 1
        }
        if (data.pic_email !== undefined && data.pic_email !== null) {
            if (count > 0) { query += ',' }
            query += `pic_email = @pic_email`
            parameters.push({ name: 'pic_email', sqltype: sql.NVarChar, value: data.pic_email })
            count += 1
        }
        if (data.modified_date !== undefined && data.modified_date !== null) {
            if (count > 0) { query += ',' }
            query += `modified_date = @modified_date`
            parameters.push({ name: 'modified_date', sqltype: sql.NVarChar, value: data.modified_date })
            count += 1
        }
        if (data.due_date !== undefined && data.due_date !== null) {
            if (count > 0) { query += ',' }
            query += `due_date = @due_date`
            parameters.push({ name: 'due_date', sqltype: sql.NVarChar, value: data.due_date })
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

exports.UpdateJobHdr_byJobNo = (data) => {
    let query = `UPDATE tbl_tms_job_hdr SET `
    let count = 0
    let parameters = []

    if (data.item_id !== undefined && data.item_id !== null) {
        if (count > 0) { query += ',' }
        query += `item_id = @item_id`
        parameters.push({ name: 'item_id', sqltype: sql.BigInt, value: data.item_id })
        count += 1
    }
    if (data.job_type !== undefined && data.job_type !== null) {
        if (count > 0) { query += ',' }
        query += `job_type = @job_type`
        parameters.push({ name: 'job_type', sqltype: sql.BigInt, value: data.job_type })
        count += 1
    }
    if (data.job_id !== undefined && data.job_id !== null) {
        if (count > 0) { query += ',' }
        query += `job_id = @job_id`
        parameters.push({ name: 'job_id', sqltype: sql.BigInt, value: data.job_id })
        count += 1
    }
    if (data.job_status !== undefined && data.job_status !== null) {
        if (count > 0) { query += ',' }
        query += `job_status = @job_status`
        parameters.push({ name: 'job_status', sqltype: sql.NVarChar, value: data.job_status })
        count += 1
    }
    if (data.hold_status !== undefined && data.hold_status !== null) {
        if (count > 0) { query += ',' }
        query += `hold_status = @hold_status`
        parameters.push({ name: 'hold_status', sqltype: sql.BigInt, value: data.hold_status })
        count += 1
    }
    if (data.hold_remarks !== undefined && data.hold_remarks !== null) {
        if (count > 0) { query += ',' }
        query += `hold_remarks = @hold_remarks`
        parameters.push({ name: 'hold_remarks', sqltype: sql.NVarChar, value: data.hold_remarks })
        count += 1
    }
    if (data.job_link !== undefined && data.job_link !== null) {
        if (count > 0) { query += ',' }
        query += `job_link = @job_link`
        parameters.push({ name: 'job_link', sqltype: sql.NVarChar, value: data.job_link })
        count += 1
    }
    if (data.pic !== undefined && data.pic !== null) {
        if (count > 0) { query += ',' }
        query += `pic = @pic`
        parameters.push({ name: 'pic', sqltype: sql.NVarChar, value: data.pic })
        count += 1
    }
    if (data.pic_name !== undefined && data.pic_name !== null) {
        if (count > 0) { query += ',' }
        query += `pic_name = @pic_name`
        parameters.push({ name: 'pic_name', sqltype: sql.NVarChar, value: data.pic_name })
        count += 1
    }
    if (data.pic_phone !== undefined && data.pic_phone !== null) {
        if (count > 0) { query += ',' }
        query += `pic_phone = @pic_phone`
        parameters.push({ name: 'pic_phone', sqltype: sql.NVarChar, value: data.pic_phone })
        count += 1
    }
    if (data.pic_email !== undefined && data.pic_email !== null) {
        if (count > 0) { query += ',' }
        query += `pic_email = @pic_email`
        parameters.push({ name: 'pic_email', sqltype: sql.NVarChar, value: data.pic_email })
        count += 1
    }
    if (data.modified_date !== undefined && data.modified_date !== null) {
        if (count > 0) { query += ',' }
        query += `modified_date = @modified_date`
        parameters.push({ name: 'modified_date', sqltype: sql.NVarChar, value: data.modified_date })
        count += 1
    }
    if (data.due_date !== undefined && data.due_date !== null) {
        if (count > 0) { query += ',' }
        query += `due_date = @due_date`
        parameters.push({ name: 'due_date', sqltype: sql.NVarChar, value: data.due_date })
        count += 1
    }

    query += ` WHERE job_no = @job_no`
    parameters.push({ name: 'job_no', sqltype: sql.NVarChar, value: data.job_no })

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

exports.UpdateJobHdr_byJobNo_job_type_item_id = (data) => {
    let query = `UPDATE tbl_tms_job_hdr SET `
    let count = 0
    let parameters = []

    if (data.job_id !== undefined && data.job_id !== null) {
        if (count > 0) { query += ',' }
        query += `job_id = @job_id`
        parameters.push({ name: 'job_id', sqltype: sql.BigInt, value: data.job_id })
        count += 1
    }
    if (data.job_status !== undefined && data.job_status !== null) {
        if (count > 0) { query += ',' }
        query += `job_status = @job_status`
        parameters.push({ name: 'job_status', sqltype: sql.NVarChar, value: data.job_status })
        count += 1
    }
    if (data.hold_status !== undefined && data.hold_status !== null) {
        if (count > 0) { query += ',' }
        query += `hold_status = @hold_status`
        parameters.push({ name: 'hold_status', sqltype: sql.BigInt, value: data.hold_status })
        count += 1
    }
    if (data.hold_remarks !== undefined && data.hold_remarks !== null) {
        if (count > 0) { query += ',' }
        query += `hold_remarks = @hold_remarks`
        parameters.push({ name: 'hold_remarks', sqltype: sql.NVarChar, value: data.hold_remarks })
        count += 1
    }
    if (data.hold_date !== undefined && data.hold_date !== null) {
        if (count > 0) { query += ',' }
        query += `hold_date = @hold_date`
        parameters.push({ name: 'hold_date', sqltype: sql.NVarChar, value: data.hold_date })
        count += 1
    }
    if (data.job_link !== undefined && data.job_link !== null) {
        if (count > 0) { query += ',' }
        query += `job_link = @job_link`
        parameters.push({ name: 'job_link', sqltype: sql.NVarChar, value: data.job_link })
        count += 1
    }
    if (data.pic !== undefined && data.pic !== null) {
        if (count > 0) { query += ',' }
        query += `pic = @pic`
        parameters.push({ name: 'pic', sqltype: sql.NVarChar, value: data.pic })
        count += 1
    }
    if (data.pic_name !== undefined && data.pic_name !== null) {
        if (count > 0) { query += ',' }
        query += `pic_name = @pic_name`
        parameters.push({ name: 'pic_name', sqltype: sql.NVarChar, value: data.pic_name })
        count += 1
    }
    if (data.pic_phone !== undefined && data.pic_phone !== null) {
        if (count > 0) { query += ',' }
        query += `pic_phone = @pic_phone`
        parameters.push({ name: 'pic_phone', sqltype: sql.NVarChar, value: data.pic_phone })
        count += 1
    }
    if (data.pic_email !== undefined && data.pic_email !== null) {
        if (count > 0) { query += ',' }
        query += `pic_email = @pic_email`
        parameters.push({ name: 'pic_email', sqltype: sql.NVarChar, value: data.pic_email })
        count += 1
    }
    if (data.modified_date !== undefined && data.modified_date !== null) {
        if (count > 0) { query += ',' }
        query += `modified_date = @modified_date`
        parameters.push({ name: 'modified_date', sqltype: sql.NVarChar, value: data.modified_date })
        count += 1
    }
    if (data.due_date !== undefined && data.due_date !== null) {
        if (count > 0) { query += ',' }
        query += `due_date = @due_date`
        parameters.push({ name: 'due_date', sqltype: sql.NVarChar, value: data.due_date })
        count += 1
    }

    query += ` WHERE job_no = @job_no AND job_type=@job_type AND item_id=@item_id`
    parameters.push({ name: 'job_no', sqltype: sql.NVarChar, value: data.job_no })
    parameters.push({ name: 'job_type', sqltype: sql.BigInt, value: data.job_type })
    parameters.push({ name: 'item_id', sqltype: sql.NVarChar, value: data.item_id })

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

exports.UpdateJobDtl = (data) => {
    if(data.rec_id !== undefined && data.rec_id !== null) {
        let query = `UPDATE tbl_tms_job_dtl SET `
        let count = 0
        let parameters = []

        if (data.test_report_no !== undefined && data.test_report_no !== null) {
            if (count > 0) { query += ',' }
            query += `test_report_no = @test_report_no`
            parameters.push({ name: 'test_report_no', sqltype: sql.NVarChar, value: data.test_report_no })
            count += 1
        }
        if (data.test_report_status !== undefined && data.test_report_status !== null) {
            if (count > 0) { query += ',' }
            query += `test_report_status = @test_report_status`
            parameters.push({ name: 'test_report_status', sqltype: sql.NVarChar, value: data.test_report_status })
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
        if (data.approved_date !== undefined && data.approved_date !== null) {
            if (count > 0) { query += ',' }
            query += `approved_date = @approved_date`
            parameters.push({ name: 'approved_date', sqltype: sql.NVarChar, value: data.approved_date })
            count += 1
        }
        if (data.tms_job_hdr_id !== undefined && data.tms_job_hdr_id !== null) {
            if (count > 0) { query += ',' }
            query += `tms_job_hdr_id = @tms_job_hdr_id`
            parameters.push({ name: 'tms_job_hdr_id', sqltype: sql.BigInt, value: data.tms_job_hdr_id })
            count += 1
        }
        if (data.test_report_link !== undefined && data.test_report_link !== null) {
            if (count > 0) { query += ',' }
            query += `test_report_link = @test_report_link`
            parameters.push({ name: 'test_report_link', sqltype: sql.NVarChar, value: data.test_report_link })
            count += 1
        }
        if (data.tr_folder_link !== undefined && data.tr_folder_link !== null) {
            if (count > 0) { query += ',' }
            query += `tr_folder_link = @tr_folder_link`
            parameters.push({ name: 'tr_folder_link', sqltype: sql.NVarChar, value: data.tr_folder_link })
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