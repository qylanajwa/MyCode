const sql = require('mssql')
const mainDb = require('../MainDb');


exports.getRequisitionInfo = (docNo) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'DocNo', sqltype: sql.VarChar, value: docNo }
        ]

        let query = `select d.*, m.UOM from SIRIM_LMS.dbo.tbl_lms_Req_Hdr h, SIRIM_LMS.dbo.tbl_lms_Req_Dtl d, SIRIM_LMS.dbo.tbl_lms_Label_Master m
                    where h.DocNo=d.DocNo and m.LabelCode=d.LabelCode and h.DocNo=@DocNo `;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.getRequisitionHdr = (docNo) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'DocNo', sqltype: sql.VarChar, value: docNo }
        ]

        let query = `select * from SIRIM_LMS.dbo.tbl_lms_Req_Hdr where DocNo=@DocNo `;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.getRequisitionDtl = (docNo) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'DocNo', sqltype: sql.VarChar, value: docNo }
        ]

        let query = `select d.*, m.UOM from SIRIM_LMS.dbo.tbl_lms_Req_Hdr h, SIRIM_LMS.dbo.tbl_lms_Req_Dtl d, SIRIM_LMS.dbo.tbl_lms_Label_Master m
                    where h.DocNo=d.DocNo and m.LabelCode=d.LabelCode and h.DocNo=@DocNo `;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}