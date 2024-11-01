const sql = require('mssql')
const mainDb = require('../MainDb');
const moment = require('moment');

exports.SelectGRPReceipt_ByInvoiceNo = (invoiceNo) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'invoiceNo', sqltype: sql.NVarChar, value: invoiceNo }
        ]
        let query = `SELECT * FROM tbl_grp_receipt_res WITH (NOLOCK) WHERE invoiceNo = @invoiceNo`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}
exports.SelectGRPReceipt_ByRefereceNbr= (ReferenceNbr) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'ReferenceNbr', sqltype: sql.NVarChar, value: ReferenceNbr }
        ]
        let query = `SELECT * FROM tbl_grp_receipt_res WITH (NOLOCK) WHERE ReferenceNbr = @ReferenceNbr`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}
exports.SelectGRPReceipt_ByRefAndFlag = (PayRef, Flag, resstatus) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'PayRef', sqltype: sql.NVarChar, value: PayRef },
            { name: 'Flag', sqltype: sql.NVarChar, value: Flag },
            { name: 'resstatus', sqltype: sql.NVarChar, value: resstatus }
        ]
        let query = `SELECT * FROM tbl_grp_receipt_res WITH (NOLOCK) WHERE PaymentRef = @PayRef AND Flag = @Flag AND resStatus= @resstatus and note <> 'staging'`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectGRPReceipt_ByRef = (PayRef, resstatus) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'PayRef', sqltype: sql.NVarChar, value: PayRef },
            { name: 'resstatus', sqltype: sql.NVarChar, value: resstatus }
        ]
        let query = `SELECT * FROM tbl_grp_receipt_res WITH (NOLOCK) WHERE PaymentRef = @PayRef AND resStatus= @resstatus and note <> 'staging'`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectGRPReceiptDtl_ByRefId = (RefId) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'RefId', sqltype: sql.BigInt, value: RefId }
        ]
        let query = `SELECT * FROM tbl_grp_receipt_res_dtl WITH (NOLOCK) WHERE RefId = @RefId`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectGRPReceiptDtl_ByRecId = (RecId) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'RecId', sqltype: sql.BigInt, value: RecId }
        ]
        let query = `SELECT * FROM tbl_grp_receipt_res_dtl WITH (NOLOCK) WHERE RecId = @RecId`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectGRPReceiptCancellation_ByInvoiceNoRefId = (invoiceNo, RefId) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'invoiceNo', sqltype: sql.NVarChar, value: invoiceNo },
            { name: 'RefId', sqltype: sql.BigInt, value: RefId }
        ]
        let query = `SELECT * FROM tbl_grp_receipt_cancel WITH (NOLOCK) WHERE invoiceNo = @invoiceNo AND RefId=RefId`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

//Bank Code Details
exports.getBankCodeDetailsByPayType = async (paytype) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'paytype', sqltype: sql.VarChar, value: paytype },
        ]
        let query = `select * from tbl_sirim_bank_code where Pay_type = @paytype`;
        // logger.info(query)
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.getBankCodeDetailsByPayTypeAndDesc = async (paytype, desc) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'paytype', sqltype: sql.VarChar, value: paytype },
            { name: 'desc', sqltype: sql.NVarChar, value: desc }
        ]
        let query = `select * from tbl_sirim_bank_code where Pay_type = @paytype and Description = @desc `;
        // logger.info(query)
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.getAuditRptData_ByInvNo = (invoiceNo) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'invoiceNo', sqltype: sql.NVarChar, value: invoiceNo }
        ]
        let query = `select  top 1 t.* from tbl_sirim_Invoice_Master im
        LEFT JOIN tbl_costing c ON c.CostId= im.Costing_id
        LEFT JOIN tbl_task_list t ON t.WfId = c.WfId AND (t.TaskName like '%Audit Report%' 
        or t.TaskName like 'GCC Evaluation Report%' or t.TaskName like '%FAR%Compliance Assessment%'
	    or t.TaskName like '%FAR%Surveillance%' or t.TaskName like '%FAR%Reassessment%' or t.TaskName like '%FAR%Special Inspection%'
        or t.Taskname like 'CoPC Competency Examiner Report%')
        WHERE im.Invoice_no= @invoiceNo
        Order By TaskId DESC`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.getInvoicesbyReceiptno = (receiptno) => {
    if (receiptno) {
        let parameters = [
            { name: 'Receipt_no', sqltype: sql.NVarChar, value: receiptno }
        ]

        let query = `SELECT * FROM tbl_sirim_Invoice_Master WHERE Receipt_no=@Receipt_no `

        return new Promise((resolve, reject) => {
            mainDb.executeQuery(query, null, parameters, (error, data) => {
                if (error) {
                    return reject(`${error}, ${query}`);
                }
                return resolve(data);
            });
        });
    }
}

exports.getInvoicesTotalAmtbyReceiptno = (receiptno) => {
    if (receiptno) {
        let parameters = [
            { name: 'Receipt_no', sqltype: sql.NVarChar, value: receiptno }
        ]

        let query = `SELECT sum(Total_amount) as 'Total_Amount' FROM tbl_sirim_Invoice_Master WHERE Receipt_no=@Receipt_no `

        return new Promise((resolve, reject) => {
            mainDb.executeQuery(query, null, parameters, (error, data) => {
                if (error) {
                    return reject(`${error}, ${query}`);
                }
                return resolve(data);
            });
        });
    }
}
exports.getInvoicesDetailbyInvNo = (Invoice_master_id) => {
    if (Invoice_master_id) {
        let parameters = [
            { name: 'Invoice_master_id', sqltype: sql.Int, value: Invoice_master_id }
        ]

        let query = `SELECT * FROM tbl_sirim_Invoice_Details WHERE Invoice_master_id=@Invoice_master_id `

        return new Promise((resolve, reject) => {
            mainDb.executeQuery(query, null, parameters, (error, data) => {
                if (error) {
                    return reject(`${error}, ${query}`);
                }
                return resolve(data);
            });
        });
    }
}

exports.SelectGRPReceipt_ReceiptReport = (req) => {
    return new Promise((resolve, reject) => {

        let query = `select * from (
            SELECT Order_no,Payment_type,Payment_mode,JobTrend,File_no,License_no,job_id,MasterInvoiceNo,Customer_id,Company_name,Currency,
            CASE WHEN im.verified_date_ph is null then im.Payment_date
            else ISNULL(im.verified_date_ph,'')  end as ReceiptDate,Receipt_no,Invoice_no,
            ISNULL(im.Invoice_date,'') AS 'InvoiceDate',ISNULL(im.Completion_date,'') AS 'Completion_date',Total_amount,Total_amount_rm,Sub_total,Sub_total_rm,Gst_amount_rm,Invoice_type,Sector_type_unitcode as SectionCode
            ,ISNULL((SELECT TOP 1 gi.ReferenceNbr from tbl_grp_invoice_res gi where gi.invoiceNo=im.Invoice_no and 
            (gi.ReferenceNbr is not null and gi.ReferenceNbr <>'')),'') AS 'InvoiceReferenceNbr',
            ISNULL((SELECT TOP 1 gr.ReferenceNbr from tbl_grp_receipt_res gr where gr.invoiceNo=im.Invoice_no and 
            (gr.ReferenceNbr is not null and gr.ReferenceNbr <>'')),'') AS 'ReceiptReferenceNbr',
            CASE WHEN EXISTS( SELECT TOP 1 gr.NewPaymentRef FROM tbl_grp_receipt_res gr  WHERE gr.invoiceNo = im.Invoice_no AND gr.ReferenceNbr IS NOT NULL AND gr.PaymentRef <> '' and gr.NewPaymentRef IS NOT NULL) 
			THEN (SELECT TOP 1 gr.NewPaymentRef FROM tbl_grp_receipt_res gr WHERE gr.invoiceNo = im.Invoice_no AND gr.ReferenceNbr IS NOT NULL AND gr.PaymentRef <> '')
			 WHEN EXISTS( SELECT TOP 1 gr.PaymentRef FROM tbl_grp_receipt_res gr  WHERE gr.invoiceNo = im.Invoice_no AND gr.ReferenceNbr IS NOT NULL AND gr.PaymentRef <> '') 
			THEN (SELECT TOP 1 gr.PaymentRef FROM tbl_grp_receipt_res gr WHERE gr.invoiceNo = im.Invoice_no AND gr.ReferenceNbr IS NOT NULL AND gr.PaymentRef <> '')
			ELSE '' 
			END AS 'Paymentref',
            Case when exists (select invoiceNo from tbl_grp_receipt_res rr where rr.invoiceNo=im.Invoice_no and rr.Flag='2' and rr.resStatus='1' and (rr.PaymentRef is not null or rr.ReferenceNbr is not null) and (rr.Type is null or rr.Type in('Prepayment','Payment')) )
            THEN '1'
            ELSE '0'
            END AS Flag
            FROM tbl_sirim_invoice_master im
            where
            Status IN (3)
            AND Invoice_type = 'CR'
           AND YEAR(
			CASE 
            WHEN im.verified_date_ph IS NULL THEN im.Payment_date
            ELSE ISNULL(im.verified_date_ph, '')
            END) >= '2022'  AND MONTH(
             CASE 
            WHEN im.verified_date_ph IS NULL THEN im.Payment_date
            ELSE ISNULL(im.verified_date_ph, '')
             END
            ) IN ('1','2','3','4','5','6','7','8','9','10','11','12') 
             AND Payment_type = 'offline'
            
            UNION
            SELECT Order_no,Payment_type,Payment_mode,JobTrend,File_no,License_no,job_id,MasterInvoiceNo,Customer_id,Company_name,Currency,
            CASE WHEN im.verified_date_ph is null then im.Payment_date
            else ISNULL(im.verified_date_ph,'')  end as ReceiptDate,Receipt_no,Invoice_no,
            ISNULL(im.Invoice_date,'') AS 'InvoiceDate',ISNULL( im.Completion_date, '') AS 'Completion_date',Total_amount,Total_amount_rm,Sub_total,Sub_total_rm,Gst_amount_rm,Invoice_type,Sector_type_unitcode as SectionCode
            ,ISNULL((SELECT TOP 1 gi.ReferenceNbr from tbl_grp_invoice_res gi where gi.invoiceNo=im.Invoice_no and 
            (gi.ReferenceNbr is not null and gi.ReferenceNbr <>'')),'') AS 'InvoiceReferenceNbr',
            ISNULL((SELECT TOP 1 gr.ReferenceNbr from tbl_grp_receipt_res gr where gr.invoiceNo=im.Invoice_no and 
            (gr.ReferenceNbr is not null and gr.ReferenceNbr <>'')),'') AS 'ReceiptReferenceNbr',
            CASE WHEN EXISTS( SELECT TOP 1 gr.NewPaymentRef FROM tbl_grp_receipt_res gr  WHERE gr.invoiceNo = im.Invoice_no AND gr.ReferenceNbr IS NOT NULL AND gr.PaymentRef <> '' and gr.NewPaymentRef IS NOT NULL) 
			THEN (SELECT TOP 1 gr.NewPaymentRef FROM tbl_grp_receipt_res gr WHERE gr.invoiceNo = im.Invoice_no AND gr.ReferenceNbr IS NOT NULL AND gr.PaymentRef <> '')
			 WHEN EXISTS( SELECT TOP 1 gr.PaymentRef FROM tbl_grp_receipt_res gr  WHERE gr.invoiceNo = im.Invoice_no AND gr.ReferenceNbr IS NOT NULL AND gr.PaymentRef <> '') 
			THEN (SELECT TOP 1 gr.PaymentRef FROM tbl_grp_receipt_res gr WHERE gr.invoiceNo = im.Invoice_no AND gr.ReferenceNbr IS NOT NULL AND gr.PaymentRef <> '')
			ELSE '' 
			END AS 'Paymentref',
            Case when exists (select invoiceNo from tbl_grp_receipt_res rr where rr.invoiceNo=im.Invoice_no and rr.Flag='2' and rr.resStatus='1' and (rr.PaymentRef is not null or rr.ReferenceNbr is not null) and (rr.Type is null or rr.Type in('Prepayment','Payment')) )
            THEN '1'
            ELSE '0'
            END AS Flag
            FROM tbl_sirim_invoice_master im
            where
            Status IN (3)
            AND Invoice_type = 'AP'
             AND YEAR(
			CASE 
            WHEN im.verified_date_ph IS NULL THEN im.Payment_date
            ELSE ISNULL(im.verified_date_ph, '')
            END) >= '2022'  AND MONTH(
            CASE 
                WHEN im.verified_date_ph IS NULL THEN im.Payment_date
                ELSE ISNULL(im.verified_date_ph, '')
            END
            ) IN ('1','2','3','4','5','6','7','8','9','10','11','12')  and Payment_type = 'offline'
            
            UNION
            SELECT Order_no,Payment_type,Payment_mode,JobTrend,File_no,License_no,job_id,MasterInvoiceNo,Customer_id,Company_name,Currency,ISNULL(im.Payment_date,'') as ReceiptDate,Receipt_no,Invoice_no,
            ISNULL( im.Invoice_date,'') AS 'InvoiceDate',ISNULL(im.Completion_date,'') AS 'Completion_date',Total_amount,Total_amount_rm,Sub_total,Sub_total_rm,Gst_amount_rm,Invoice_type,Sector_type_unitcode as SectionCode
            ,ISNULL((SELECT TOP 1 gi.ReferenceNbr from tbl_grp_invoice_res gi where gi.invoiceNo=im.Invoice_no and 
            (gi.ReferenceNbr is not null and gi.ReferenceNbr <>'')),'') AS 'InvoiceReferenceNbr',
            ISNULL((SELECT TOP 1 gr.ReferenceNbr from tbl_grp_receipt_res gr where gr.invoiceNo=im.Invoice_no and 
            (gr.ReferenceNbr is not null and gr.ReferenceNbr <>'')),'') AS 'ReceiptReferenceNbr',
            CASE WHEN EXISTS( SELECT TOP 1 gr.NewPaymentRef FROM tbl_grp_receipt_res gr  WHERE gr.invoiceNo = im.Invoice_no AND gr.ReferenceNbr IS NOT NULL AND gr.PaymentRef <> '' and gr.NewPaymentRef IS NOT NULL) 
			THEN (SELECT TOP 1 gr.NewPaymentRef FROM tbl_grp_receipt_res gr WHERE gr.invoiceNo = im.Invoice_no AND gr.ReferenceNbr IS NOT NULL AND gr.PaymentRef <> '')
			 WHEN EXISTS( SELECT TOP 1 gr.PaymentRef FROM tbl_grp_receipt_res gr  WHERE gr.invoiceNo = im.Invoice_no AND gr.ReferenceNbr IS NOT NULL AND gr.PaymentRef <> '') 
			THEN (SELECT TOP 1 gr.PaymentRef FROM tbl_grp_receipt_res gr WHERE gr.invoiceNo = im.Invoice_no AND gr.ReferenceNbr IS NOT NULL AND gr.PaymentRef <> '')
			ELSE '' 
			END AS 'Paymentref',
            Case when exists (select invoiceNo from tbl_grp_receipt_res rr where rr.invoiceNo=im.Invoice_no and rr.Flag='2' and rr.resStatus='1' and (rr.PaymentRef is not null or rr.ReferenceNbr is not null) and (rr.Type is null or rr.Type in('Prepayment','Payment')) )
            THEN '1'
            ELSE '0'
            END AS Flag
            FROM tbl_sirim_invoice_master im
            where
            Status IN (3)
            AND Invoice_type = 'CR'
            AND YEAR(Payment_date) >= '2022'  AND MONTH(Payment_date) IN ('1','2','3','4','5','6','7','8','9','10','11','12') and Payment_type = 'online'
            
            UNION
            SELECT Order_no,Payment_type,Payment_mode,JobTrend,File_no,License_no,job_id,MasterInvoiceNo,Customer_id,Company_name,Currency,ISNULL(im.Payment_date,'') as ReceiptDate,Receipt_no,Invoice_no,
            ISNULL(im.Invoice_date,'') AS 'InvoiceDate',ISNULL(im.Completion_date,'') AS 'Completion_date',Total_amount,Total_amount_rm,Sub_total,Sub_total_rm,Gst_amount_rm,Invoice_type,Sector_type_unitcode as SectionCode
            ,ISNULL((SELECT TOP 1 gi.ReferenceNbr from tbl_grp_invoice_res gi where gi.invoiceNo=im.Invoice_no and 
            (gi.ReferenceNbr is not null and gi.ReferenceNbr <>'')),'') AS 'InvoiceReferenceNbr',
            ISNULL((SELECT TOP 1 gr.ReferenceNbr from tbl_grp_receipt_res gr where gr.invoiceNo=im.Invoice_no and 
            (gr.ReferenceNbr is not null and gr.ReferenceNbr <>'')),'') AS 'ReceiptReferenceNbr',
            CASE WHEN EXISTS( SELECT TOP 1 gr.NewPaymentRef FROM tbl_grp_receipt_res gr  WHERE gr.invoiceNo = im.Invoice_no AND gr.ReferenceNbr IS NOT NULL AND gr.PaymentRef <> '' and gr.NewPaymentRef IS NOT NULL) 
			THEN (SELECT TOP 1 gr.NewPaymentRef FROM tbl_grp_receipt_res gr WHERE gr.invoiceNo = im.Invoice_no AND gr.ReferenceNbr IS NOT NULL AND gr.PaymentRef <> '')
			 WHEN EXISTS( SELECT TOP 1 gr.PaymentRef FROM tbl_grp_receipt_res gr  WHERE gr.invoiceNo = im.Invoice_no AND gr.ReferenceNbr IS NOT NULL AND gr.PaymentRef <> '') 
			THEN (SELECT TOP 1 gr.PaymentRef FROM tbl_grp_receipt_res gr WHERE gr.invoiceNo = im.Invoice_no AND gr.ReferenceNbr IS NOT NULL AND gr.PaymentRef <> '')
			ELSE '' 
			END AS 'Paymentref',
            Case when exists (select invoiceNo from tbl_grp_receipt_res rr where rr.invoiceNo=im.Invoice_no and rr.Flag='2' and rr.resStatus='1' and (rr.PaymentRef is not null or rr.ReferenceNbr is not null) and (rr.Type is null or rr.Type in('Prepayment','Payment')) )
            THEN '1'
            ELSE '0'
            END AS Flag
            FROM tbl_sirim_invoice_master im
            where
            Status IN (3)
            AND Invoice_type = 'AP'
            AND YEAR(Payment_date) >= '2022'  AND MONTH(Payment_date) IN ('1','2','3','4','5','6','7','8','9','10','11','12') and Payment_type = 'online')z where z.Paymentref is not null `

        if (req.from != null && req.to != '') {
            let fromDate = req.from + ' 00:00:00';;
            let toDate = req.to + ' 23:59:59';
            query += ` AND z.ReceiptDate between '${fromDate}' AND '${toDate}' `
        }
        if (req.Company_name != null && req.Company_name != '') {
            query += ` AND z.Company_name LIKE '%${req.Company_name}%'`
        }
         if (req.SectionCode != null && req.SectionCode != '') {
            query += ` AND z.SectionCode = '${req.SectionCode}'`
        }
       

        mainDb.executeQuery(query, null, null, (error, data) => {
            console.log(query)
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.getInvoiceTypebyReceiptno = (receiptno) => {
    if (receiptno) {
        let parameters = [
            { name: 'Receipt_no', sqltype: sql.NVarChar, value: receiptno }
        ]

        let query = `SELECT DISTINCT Invoice_type FROM tbl_sirim_Invoice_Master WHERE Receipt_no=@Receipt_no `

        return new Promise((resolve, reject) => {
            mainDb.executeQuery(query, null, parameters, (error, data) => {
                if (error) {
                    return reject(`${error}, ${query}`);
                }
                return resolve(data);
            });
        });
    }
}

exports.getInvoicesbyReceiptnoAndInvType = (receiptno, invType) => {
    if (receiptno) {
        let parameters = [
            { name: 'Receipt_no', sqltype: sql.NVarChar, value: receiptno },
            { name: 'invoiceType', sqltype: sql.NVarChar, value: invType }
        ]

        let query = `SELECT * FROM tbl_sirim_Invoice_Master WHERE Receipt_no=@Receipt_no AND Invoice_type=@invoiceType`

        return new Promise((resolve, reject) => {
            mainDb.executeQuery(query, null, parameters, (error, data) => {
                if (error) {
                    return reject(`${error}, ${query}`);
                }
                return resolve(data);
            });
        });
    }
}

exports.getGrpReceiptByInvNo_InvType = (InvNo, Type) => {
    if (InvNo) {
        let parameters = [
            { name: 'InvNo', sqltype: sql.NVarChar, value: InvNo },
            { name: 'Type', sqltype: sql.NVarChar, value: Type }
        ]

        let query = `SELECT * FROM tbl_grp_receipt_res WHERE invoiceNo=@InvNo AND Type=@Type`

        return new Promise((resolve, reject) => {
            mainDb.executeQuery(query, null, parameters, (error, data) => {
                if (error) {
                    return reject(`${error}, ${query}`);
                }
                return resolve(data);
            });
        });
    }
}

exports.SelectDocApplyList = () => {
    return new Promise((resolve, reject) => {
        let parameters;

        let query = `EXEC GetMyFastDocApply`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

// insert
exports.InsertGRPReceipt = (data) => {
     //insert transaction
     if (data.invoiceNo !== undefined) {
        this.InsertGRPReceipt_trans(data)
    }
    //end

    let column = ""
    let values = ""
    let count = 0
    let parameters = []

    if (data.resId !== undefined) {
        parameters.push({ name: 'resId', sqltype: sql.NVarChar, value: data.resId })
        column = column == "" ? column += "resId" : column += ",resId"
        values = values == "" ? values += `@resId` : values += `,@resId`
        count += 1
    }
    if (data.invoiceNo !== undefined) {
        parameters.push({ name: 'invoiceNo', sqltype: sql.NVarChar, value: data.invoiceNo })
        column = column == "" ? column += "invoiceNo" : column += ",invoiceNo"
        values = values == "" ? values += `@invoiceNo` : values += `,@invoiceNo`
        count += 1
    }
    if (data.invoiceType !== undefined) {
        parameters.push({ name: 'invoiceType', sqltype: sql.NVarChar, value: data.invoiceType })
        column = column == "" ? column += "invoiceType" : column += ",invoiceType"
        values = values == "" ? values += `@invoiceType` : values += `,@invoiceType`
        count += 1
    }
    if (data.note !== undefined) {
        parameters.push({ name: 'note', sqltype: sql.NVarChar, value: data.note })
        column = column == "" ? column += "note" : column += ",note"
        values = values == "" ? values += `@note` : values += `,@note`
        count += 1
    }
    if (data.ApplicationDate !== undefined) {
        parameters.push({ name: 'ApplicationDate', sqltype: sql.NVarChar, value: data.ApplicationDate })
        column = column == "" ? column += "ApplicationDate" : column += ",ApplicationDate"
        values = values == "" ? values += `@ApplicationDate` : values += `,@ApplicationDate`
        count += 1
    }
    if (data.AppliedToDocuments !== undefined) {
        parameters.push({ name: 'AppliedToDocuments', sqltype: sql.NVarChar, value: data.AppliedToDocuments })
        column = column == "" ? column += "AppliedToDocuments" : column += ",AppliedToDocuments"
        values = values == "" ? values += `@AppliedToDocuments` : values += `,@AppliedToDocuments`
        count += 1
    }
    if (data.ARAccount !== undefined) {
        parameters.push({ name: 'ARAccount', sqltype: sql.NVarChar, value: data.ARAccount })
        column = column == "" ? column += "ARAccount" : column += ",ARAccount"
        values = values == "" ? values += `@ARAccount` : values += `,@ARAccount`
        count += 1
    }
    if (data.ARSubaccount !== undefined) {
        parameters.push({ name: 'ARSubaccount', sqltype: sql.NVarChar, value: data.ARSubaccount })
        column = column == "" ? column += "ARSubaccount" : column += ",ARSubaccount"
        values = values == "" ? values += `@ARSubaccount` : values += `,@ARSubaccount`
        count += 1
    }
    if (data.Branch !== undefined) {
        parameters.push({ name: 'Branch', sqltype: sql.NVarChar, value: data.Branch })
        column = column == "" ? column += "Branch" : column += ",Branch"
        values = values == "" ? values += `@Branch` : values += `,@Branch`
        count += 1
    }
    if (data.CardAccountNbr !== undefined) {
        parameters.push({ name: 'CardAccountNbr', sqltype: sql.NVarChar, value: data.CardAccountNbr })
        column = column == "" ? column += "CardAccountNbr" : column += ",CardAccountNbr"
        values = values == "" ? values += `@CardAccountNbr` : values += `,@CardAccountNbr`
        count += 1
    }
    if (data.CashAccount !== undefined) {
        parameters.push({ name: 'CashAccount', sqltype: sql.NVarChar, value: data.CashAccount })
        column = column == "" ? column += "CashAccount" : column += ",CashAccount"
        values = values == "" ? values += `@CashAccount` : values += `,@CashAccount`
        count += 1
    }
    if (data.CurrencyID !== undefined) {
        parameters.push({ name: 'CurrencyID', sqltype: sql.NVarChar, value: data.CurrencyID })
        column = column == "" ? column += "CurrencyID" : column += ",CurrencyID"
        values = values == "" ? values += `@CurrencyID` : values += `,@CurrencyID`
        count += 1
    }
    if (data.CustomerID !== undefined) {
        parameters.push({ name: 'CustomerID', sqltype: sql.NVarChar, value: data.CustomerID })
        column = column == "" ? column += "CustomerID" : column += ",CustomerID"
        values = values == "" ? values += `@CustomerID` : values += `,@CustomerID`
        count += 1
    }
    if (data.Description !== undefined) {
        parameters.push({ name: 'Description', sqltype: sql.NVarChar, value: data.Description })
        column = column == "" ? column += "Description" : column += ",Description"
        values = values == "" ? values += `@Description` : values += `,@Description`
        count += 1
    }
    if (data.Hold !== undefined) {
        parameters.push({ name: 'Hold', sqltype: sql.Bit, value: data.Hold })
        column = column == "" ? column += "Hold" : column += ",Hold"
        values = values == "" ? values += `@Hold` : values += `,@Hold`
        count += 1
    }
    if (data.PaymentAmount !== undefined) {
        // parameters.push({ name: 'PaymentAmount', sqltype: sql.Decimal(18, 2), value: data.PaymentAmount })
        parameters.push({ name: 'PaymentAmount', sqltype: sql.Float, value: data.PaymentAmount })
        column = column == "" ? column += "PaymentAmount" : column += ",PaymentAmount"
        values = values == "" ? values += `@PaymentAmount` : values += `,@PaymentAmount`
        count += 1
    }
    if (data.PaymentMethod !== undefined) {
        parameters.push({ name: 'PaymentMethod', sqltype: sql.NVarChar, value: data.PaymentMethod })
        column = column == "" ? column += "PaymentMethod" : column += ",PaymentMethod"
        values = values == "" ? values += `@PaymentMethod` : values += `,@PaymentMethod`
        count += 1
    }
    if (data.PaymentRef !== undefined) {
        parameters.push({ name: 'PaymentRef', sqltype: sql.NVarChar, value: data.PaymentRef })
        column = column == "" ? column += "PaymentRef" : column += ",PaymentRef"
        values = values == "" ? values += `@PaymentRef` : values += `,@PaymentRef`
        count += 1
    }
    if (data.ReferenceNbr !== undefined) {
        parameters.push({ name: 'ReferenceNbr', sqltype: sql.NVarChar, value: data.ReferenceNbr })
        column = column == "" ? column += "ReferenceNbr" : column += ",ReferenceNbr"
        values = values == "" ? values += `@ReferenceNbr` : values += `,@ReferenceNbr`
        count += 1
    }
    if (data.PrepaymentReferenceNbr !== undefined) {
        parameters.push({ name: 'PrepaymentReferenceNbr', sqltype: sql.NVarChar, value: data.PrepaymentReferenceNbr })
        column = column == "" ? column += "PrepaymentReferenceNbr" : column += ",PrepaymentReferenceNbr"
        values = values == "" ? values += `@PrepaymentReferenceNbr` : values += `,@PrepaymentReferenceNbr`
        count += 1
    }
    if (data.Status !== undefined) {
        parameters.push({ name: 'Status', sqltype: sql.NVarChar, value: data.Status })
        column = column == "" ? column += "Status" : column += ",Status"
        values = values == "" ? values += `@Status` : values += `,@Status`
        count += 1
    }
    if (data.Type !== undefined) {
        parameters.push({ name: 'Type', sqltype: sql.NVarChar, value: data.Type })
        column = column == "" ? column += "Type" : column += ",Type"
        values = values == "" ? values += `@Type` : values += `,@Type`
        count += 1
    }
    if (data.custom !== undefined) {
        parameters.push({ name: 'custom', sqltype: sql.NVarChar, value: data.custom })
        column = column == "" ? column += "custom" : column += ",custom"
        values = values == "" ? values += `@custom` : values += `,@custom`
        count += 1
    }
    if (data.reqData !== undefined) {
        parameters.push({ name: 'reqData', sqltype: sql.Text, value: data.reqData })
        column = column == "" ? column += "reqData" : column += ",reqData"
        values = values == "" ? values += `@reqData` : values += `,@reqData`
        count += 1
    }
    if (data.resData !== undefined) {
        parameters.push({ name: 'resData', sqltype: sql.Text, value: data.resData })
        column = column == "" ? column += "resData" : column += ",resData"
        values = values == "" ? values += `@resData` : values += `,@resData`
        count += 1
    }
    if (data.resStatus !== undefined) {
        parameters.push({ name: 'resStatus', sqltype: sql.NVarChar, value: data.resStatus })
        column = column == "" ? column += "resStatus" : column += ",resStatus"
        values = values == "" ? values += `@resStatus` : values += `,@resStatus`
        count += 1
    }
    if (data.Flag !== undefined) {
        parameters.push({ name: 'Flag', sqltype: sql.NVarChar, value: data.Flag })
        column = column == "" ? column += "Flag" : column += ",Flag"
        values = values == "" ? values += `@Flag` : values += `,@Flag`
        count += 1
    }
    if (data.CreatedDate !== undefined) {
        parameters.push({ name: 'CreatedDate', sqltype: sql.NVarChar, value: data.CreatedDate })
        column = column == "" ? column += "CreatedDate" : column += ",CreatedDate"
        values = values == "" ? values += `@CreatedDate` : values += `,@CreatedDate`
        count += 1
    }
    if (data.ModifiedDate !== undefined) {
        parameters.push({ name: 'ModifiedDate', sqltype: sql.NVarChar, value: data.ModifiedDate })
        column = column == "" ? column += "ModifiedDate" : column += ",ModifiedDate"
        values = values == "" ? values += `@ModifiedDate` : values += `,@ModifiedDate`
        count += 1
    }
    if (data.Remark !== undefined) {
        parameters.push({ name: 'Remark', sqltype: sql.NVarChar, value: data.Remark })
        column = column == "" ? column += "Remark" : column += ",Remark"
        values = values == "" ? values += `@Remark` : values += `,@Remark`
        count += 1
    }
    if (data.Mix !== undefined) {
        parameters.push({ name: 'Mix', sqltype: sql.Bit, value: data.Mix })
        column = column == "" ? column += "Mix" : column += ",Mix"
        values = values == "" ? values += `@Mix` : values += `,@Mix`
        count += 1
    }
    if (data.NewPaymentRef !== undefined) {
        parameters.push({ name: 'NewPaymentRef', sqltype: sql.NVarChar, value: data.NewPaymentRef })
        column = column == "" ? column += "NewPaymentRef" : column += ",NewPaymentRef"
        values = values == "" ? values += `@NewPaymentRef` : values += `,@NewPaymentRef`
        count += 1
    }

    let query = `INSERT INTO tbl_grp_receipt_res (${column}) VALUES (${values});`

    if (count > 0) {
        query += `SELECT SCOPE_IDENTITY() as RecId`
        return new Promise((resolve, reject) => {
            mainDb.executeQuery(query, null, parameters, (error, data) => {
                if (error) {
                    return reject(`${error}, ${query}`);
                }
                console.log(data[0].RecId)
                return resolve(data[0].RecId);
            });
        })
    }
}

exports.InsertGRPReceiptDtl = (data) => {
    let column = ""
    let values = ""
    let count = 0
    let parameters = []

    if (data.RefId !== undefined) {
        parameters.push({ name: 'RefId', sqltype: sql.BigInt, value: data.RefId })
        column = column == "" ? column += "RefId" : column += ",RefId"
        values = values == "" ? values += `@RefId` : values += `,@RefId`
        count += 1
    }
    if (data.resId !== undefined) {
        parameters.push({ name: 'resId', sqltype: sql.NVarChar, value: data.resId })
        column = column == "" ? column += "resId" : column += ",resId"
        values = values == "" ? values += `@resId` : values += `,@resId`
        count += 1
    }
    if (data.rowNumber !== undefined) {
        parameters.push({ name: 'rowNumber', sqltype: sql.BigInt, value: data.rowNumber })
        column = column == "" ? column += "rowNumber" : column += ",rowNumber"
        values = values == "" ? values += `@rowNumber` : values += `,@rowNumber`
        count += 1
    }
    if (data.note !== undefined) {
        parameters.push({ name: 'note', sqltype: sql.NVarChar, value: data.note })
        column = column == "" ? column += "note" : column += ",note"
        values = values == "" ? values += `@note` : values += `,@note`
        count += 1
    }
    if (data.AmountPaid !== undefined) {
        parameters.push({ name: 'AmountPaid', sqltype: sql.Decimal, value: data.AmountPaid })
        column = column == "" ? column += "AmountPaid" : column += ",AmountPaid"
        values = values == "" ? values += `@AmountPaid` : values += `,@AmountPaid`
        count += 1
    }
    if (data.BalanceWriteOff !== undefined) {
        parameters.push({ name: 'BalanceWriteOff', sqltype: sql.Decimal, value: data.BalanceWriteOff })
        column = column == "" ? column += "BalanceWriteOff" : column += ",BalanceWriteOff"
        values = values == "" ? values += `@BalanceWriteOff` : values += `,@BalanceWriteOff`
        count += 1
    }
    if (data.CustomerOrder !== undefined) {
        parameters.push({ name: 'CustomerOrder', sqltype: sql.NVarChar, value: data.CustomerOrder })
        column = column == "" ? column += "CustomerOrder" : column += ",CustomerOrder"
        values = values == "" ? values += `@CustomerOrder` : values += `,@CustomerOrder`
        count += 1
    }
    if (data.Description !== undefined) {
        parameters.push({ name: 'Description', sqltype: sql.NVarChar, value: data.Description })
        column = column == "" ? column += "Description" : column += ",Description"
        values = values == "" ? values += `@Description` : values += `,@Description`
        count += 1
    }
    if (data.DocType !== undefined) {
        parameters.push({ name: 'DocType', sqltype: sql.NVarChar, value: data.DocType })
        column = column == "" ? column += "DocType" : column += ",DocType"
        values = values == "" ? values += `@DocType` : values += `,@DocType`
        count += 1
    }
    if (data.ReferenceNbr !== undefined) {
        parameters.push({ name: 'ReferenceNbr', sqltype: sql.NVarChar, value: data.ReferenceNbr })
        column = column == "" ? column += "ReferenceNbr" : column += ",ReferenceNbr"
        values = values == "" ? values += `@ReferenceNbr` : values += `,@ReferenceNbr`
        count += 1
    }
    if (data.WriteOffReasonCode !== undefined) {
        parameters.push({ name: 'WriteOffReasonCode', sqltype: sql.NVarChar, value: data.WriteOffReasonCode })
        column = column == "" ? column += "WriteOffReasonCode" : column += ",WriteOffReasonCode"
        values = values == "" ? values += `@WriteOffReasonCode` : values += `,@WriteOffReasonCode`
        count += 1
    }
    if (data.custom !== undefined) {
        parameters.push({ name: 'custom', sqltype: sql.NVarChar, value: data.custom })
        column = column == "" ? column += "custom" : column += ",custom"
        values = values == "" ? values += `@custom` : values += `,@custom`
        count += 1
    }
    if (data.CreatedDate !== undefined) {
        parameters.push({ name: 'CreatedDate', sqltype: sql.NVarChar, value: data.CreatedDate })
        column = column == "" ? column += "CreatedDate" : column += ",CreatedDate"
        values = values == "" ? values += `@CreatedDate` : values += `,@CreatedDate`
        count += 1
    }
    if (data.ModifiedDate !== undefined) {
        parameters.push({ name: 'ModifiedDate', sqltype: sql.NVarChar, value: data.ModifiedDate })
        column = column == "" ? column += "ModifiedDate" : column += ",ModifiedDate"
        values = values == "" ? values += `@ModifiedDate` : values += `,@ModifiedDate`
        count += 1
    }

    let query = `INSERT INTO tbl_grp_receipt_res_dtl (${column}) VALUES (${values});`

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

exports.InsertGRPReceiptCancelation = (data) => {
    let column = ""
    let values = ""
    let count = 0
    let parameters = []

    if (data.RefId !== undefined) {
        parameters.push({ name: 'RefId', sqltype: sql.BigInt, value: data.RefId })
        column = column == "" ? column += "RefId" : column += ",RefId"
        values = values == "" ? values += `@RefId` : values += `,@RefId`
        count += 1
    }
    if (data.resId !== undefined) {
        parameters.push({ name: 'resId', sqltype: sql.NVarChar, value: data.resId })
        column = column == "" ? column += "resId" : column += ",resId"
        values = values == "" ? values += `@resId` : values += `,@resId`
        count += 1
    }
    if (data.invoiceNo !== undefined) {
        parameters.push({ name: 'invoiceNo', sqltype: sql.NVarChar, value: data.invoiceNo })
        column = column == "" ? column += "invoiceNo" : column += ",invoiceNo"
        values = values == "" ? values += `@invoiceNo` : values += `,@invoiceNo`
        count += 1
    }

    if (data.note !== undefined) {
        parameters.push({ name: 'note', sqltype: sql.NVarChar, value: data.note })
        column = column == "" ? column += "note" : column += ",note"
        values = values == "" ? values += `@note` : values += `,@note`
        count += 1
    }
    if (data.ApplicationDate !== undefined) {
        parameters.push({ name: 'ApplicationDate', sqltype: sql.NVarChar, value: data.ApplicationDate })
        column = column == "" ? column += "ApplicationDate" : column += ",ApplicationDate"
        values = values == "" ? values += `@ApplicationDate` : values += `,@ApplicationDate`
        count += 1
    }
    if (data.AppliedToDocuments !== undefined) {
        parameters.push({ name: 'AppliedToDocuments', sqltype: sql.NVarChar, value: data.AppliedToDocuments })
        column = column == "" ? column += "AppliedToDocuments" : column += ",AppliedToDocuments"
        values = values == "" ? values += `@AppliedToDocuments` : values += `,@AppliedToDocuments`
        count += 1
    }
    if (data.ARAccount !== undefined) {
        parameters.push({ name: 'ARAccount', sqltype: sql.NVarChar, value: data.ARAccount })
        column = column == "" ? column += "ARAccount" : column += ",ARAccount"
        values = values == "" ? values += `@ARAccount` : values += `,@ARAccount`
        count += 1
    }
    if (data.ARSubaccount !== undefined) {
        parameters.push({ name: 'ARSubaccount', sqltype: sql.NVarChar, value: data.ARSubaccount })
        column = column == "" ? column += "ARSubaccount" : column += ",ARSubaccount"
        values = values == "" ? values += `@ARSubaccount` : values += `,@ARSubaccount`
        count += 1
    }
    if (data.Branch !== undefined) {
        parameters.push({ name: 'Branch', sqltype: sql.NVarChar, value: data.Branch })
        column = column == "" ? column += "Branch" : column += ",Branch"
        values = values == "" ? values += `@Branch` : values += `,@Branch`
        count += 1
    }
    if (data.CardAccountNbr !== undefined) {
        parameters.push({ name: 'CardAccountNbr', sqltype: sql.NVarChar, value: data.CardAccountNbr })
        column = column == "" ? column += "CardAccountNbr" : column += ",CardAccountNbr"
        values = values == "" ? values += `@CardAccountNbr` : values += `,@CardAccountNbr`
        count += 1
    }
    if (data.CashAccount !== undefined) {
        parameters.push({ name: 'CashAccount', sqltype: sql.NVarChar, value: data.CashAccount })
        column = column == "" ? column += "CashAccount" : column += ",CashAccount"
        values = values == "" ? values += `@CashAccount` : values += `,@CashAccount`
        count += 1
    }
    if (data.CurrencyID !== undefined) {
        parameters.push({ name: 'CurrencyID', sqltype: sql.NVarChar, value: data.CurrencyID })
        column = column == "" ? column += "CurrencyID" : column += ",CurrencyID"
        values = values == "" ? values += `@CurrencyID` : values += `,@CurrencyID`
        count += 1
    }
    if (data.CustomerID !== undefined) {
        parameters.push({ name: 'CustomerID', sqltype: sql.NVarChar, value: data.CustomerID })
        column = column == "" ? column += "CustomerID" : column += ",CustomerID"
        values = values == "" ? values += `@CustomerID` : values += `,@CustomerID`
        count += 1
    }
    if (data.Description !== undefined) {
        parameters.push({ name: 'Description', sqltype: sql.NVarChar, value: data.Description })
        column = column == "" ? column += "Description" : column += ",Description"
        values = values == "" ? values += `@Description` : values += `,@Description`
        count += 1
    }
    if (data.Hold !== undefined) {
        parameters.push({ name: 'Hold', sqltype: sql.Bit, value: data.Hold })
        column = column == "" ? column += "Hold" : column += ",Hold"
        values = values == "" ? values += `@Hold` : values += `,@Hold`
        count += 1
    }
    if (data.PaymentAmount !== undefined) {
        // parameters.push({ name: 'PaymentAmount', sqltype: sql.Decimal(18, 2), value: data.PaymentAmount })
        parameters.push({ name: 'PaymentAmount', sqltype: sql.Float, value: data.PaymentAmount })
        column = column == "" ? column += "PaymentAmount" : column += ",PaymentAmount"
        values = values == "" ? values += `@PaymentAmount` : values += `,@PaymentAmount`
        count += 1
    }
    if (data.PaymentMethod !== undefined) {
        parameters.push({ name: 'PaymentMethod', sqltype: sql.NVarChar, value: data.PaymentMethod })
        column = column == "" ? column += "PaymentMethod" : column += ",PaymentMethod"
        values = values == "" ? values += `@PaymentMethod` : values += `,@PaymentMethod`
        count += 1
    }
    if (data.PaymentRef !== undefined) {
        parameters.push({ name: 'PaymentRef', sqltype: sql.NVarChar, value: data.PaymentRef })
        column = column == "" ? column += "PaymentRef" : column += ",PaymentRef"
        values = values == "" ? values += `@PaymentRef` : values += `,@PaymentRef`
        count += 1
    }
    if (data.ReferenceNbr !== undefined) {
        parameters.push({ name: 'ReferenceNbr', sqltype: sql.NVarChar, value: data.ReferenceNbr })
        column = column == "" ? column += "ReferenceNbr" : column += ",ReferenceNbr"
        values = values == "" ? values += `@ReferenceNbr` : values += `,@ReferenceNbr`
        count += 1
    }
    if (data.Status !== undefined) {
        parameters.push({ name: 'Status', sqltype: sql.NVarChar, value: data.Status })
        column = column == "" ? column += "Status" : column += ",Status"
        values = values == "" ? values += `@Status` : values += `,@Status`
        count += 1
    }
    if (data.Type !== undefined) {
        parameters.push({ name: 'Type', sqltype: sql.NVarChar, value: data.Type })
        column = column == "" ? column += "Type" : column += ",Type"
        values = values == "" ? values += `@Type` : values += `,@Type`
        count += 1
    }
    if (data.custom !== undefined) {
        parameters.push({ name: 'custom', sqltype: sql.NVarChar, value: data.custom })
        column = column == "" ? column += "custom" : column += ",custom"
        values = values == "" ? values += `@custom` : values += `,@custom`
        count += 1
    }
    if (data.reqData !== undefined) {
        parameters.push({ name: 'reqData', sqltype: sql.Text, value: data.reqData })
        column = column == "" ? column += "reqData" : column += ",reqData"
        values = values == "" ? values += `@reqData` : values += `,@reqData`
        count += 1
    }
    if (data.resData !== undefined) {
        parameters.push({ name: 'resData', sqltype: sql.Text, value: data.resData })
        column = column == "" ? column += "resData" : column += ",resData"
        values = values == "" ? values += `@resData` : values += `,@resData`
        count += 1
    }
    if (data.CreatedDate !== undefined) {
        parameters.push({ name: 'CreatedDate', sqltype: sql.NVarChar, value: data.CreatedDate })
        column = column == "" ? column += "CreatedDate" : column += ",CreatedDate"
        values = values == "" ? values += `@CreatedDate` : values += `,@CreatedDate`
        count += 1
    }
    if (data.ModifiedDate !== undefined) {
        parameters.push({ name: 'ModifiedDate', sqltype: sql.NVarChar, value: data.ModifiedDate })
        column = column == "" ? column += "ModifiedDate" : column += ",ModifiedDate"
        values = values == "" ? values += `@ModifiedDate` : values += `,@ModifiedDate`
        count += 1
    }

    let query = `INSERT INTO tbl_grp_receipt_cancel (${column}) VALUES (${values});`

    if (count > 0) {
        query += `SELECT SCOPE_IDENTITY() as RecId`
        return new Promise((resolve, reject) => {
            mainDb.executeQuery(query, null, parameters, (error, data) => {
                if (error) {
                    return reject(`${error}, ${query}`);
                }
                return resolve(data[0].RecId);
            });
        })
    }
}

// update
exports.UpdateGRPReceipt = (data) => {
    //insert transaction
    if (data.RecId !== undefined && data.RecId !== null) {
        this.InsertGRPReceipt_trans(data)
    }
    //end

    if (data.RecId !== undefined && data.RecId !== null) {

        let query = `UPDATE tbl_grp_receipt_res SET `
        let count = 0
        let parameters = []

        if (data.resId !== undefined && data.resId !== null) {
            if (count > 0) { query += ',' }
            query += `resId = @resId`
            parameters.push({ name: 'resId', sqltype: sql.NVarChar, value: data.resId })
            count += 1
        }
        if (data.invoiceNo !== undefined && data.invoiceNo !== null) {
            if (count > 0) { query += ',' }
            query += `invoiceNo = @invoiceNo`
            parameters.push({ name: 'invoiceNo', sqltype: sql.NVarChar, value: data.invoiceNo })
            count += 1
        }
        if (data.invoiceType !== undefined && data.invoiceType !== null) {
            if (count > 0) { query += ',' }
            query += `invoiceType = @invoiceType`
            parameters.push({ name: 'invoiceType', sqltype: sql.NVarChar, value: data.invoiceType })
            count += 1
        }
        if (data.note !== undefined && data.note !== null) {
            if (count > 0) { query += ',' }
            query += `note = @note`
            parameters.push({ name: 'note', sqltype: sql.NVarChar, value: data.note })
            count += 1
        }
        if (data.ApplicationDate !== undefined && data.ApplicationDate !== null) {
            if (count > 0) { query += ',' }
            query += `ApplicationDate = @ApplicationDate`
            parameters.push({ name: 'ApplicationDate', sqltype: sql.NVarChar, value: data.ApplicationDate })
            count += 1
        }
        if (data.AppliedToDocuments !== undefined && data.AppliedToDocuments !== null) {
            if (count > 0) { query += ',' }
            query += `AppliedToDocuments = @AppliedToDocuments`
            parameters.push({ name: 'AppliedToDocuments', sqltype: sql.NVarChar, value: data.AppliedToDocuments })
            count += 1
        }
        if (data.ARAccount !== undefined && data.ARAccount !== null) {
            if (count > 0) { query += ',' }
            query += `ARAccount = @ARAccount`
            parameters.push({ name: 'ARAccount', sqltype: sql.NVarChar, value: data.ARAccount })
            count += 1
        }
        if (data.ARSubaccount !== undefined && data.ARSubaccount !== null) {
            if (count > 0) { query += ',' }
            query += `ARSubaccount = @ARSubaccount`
            parameters.push({ name: 'ARSubaccount', sqltype: sql.NVarChar, value: data.ARSubaccount })
            count += 1
        }
        if (data.Branch !== undefined && data.Branch !== null) {
            if (count > 0) { query += ',' }
            query += `Branch = @Branch`
            parameters.push({ name: 'Branch', sqltype: sql.NVarChar, value: data.Branch })
            count += 1
        }
        if (data.CardAccountNbr !== undefined && data.CardAccountNbr !== null) {
            if (count > 0) { query += ',' }
            query += `CardAccountNbr = @CardAccountNbr`
            parameters.push({ name: 'CardAccountNbr', sqltype: sql.NVarChar, value: data.CardAccountNbr })
            count += 1
        }
        if (data.CashAccount !== undefined && data.CashAccount !== null) {
            if (count > 0) { query += ',' }
            query += `CashAccount = @CashAccount`
            parameters.push({ name: 'CashAccount', sqltype: sql.NVarChar, value: data.CashAccount })
            count += 1
        }
        if (data.CurrencyID !== undefined && data.CurrencyID !== null) {
            if (count > 0) { query += ',' }
            query += `CurrencyID = @CurrencyID`
            parameters.push({ name: 'CurrencyID', sqltype: sql.NVarChar, value: data.CurrencyID })
            count += 1
        }
        if (data.CustomerID !== undefined && data.CustomerID !== null) {
            if (count > 0) { query += ',' }
            query += `CustomerID = @CustomerID`
            parameters.push({ name: 'CustomerID', sqltype: sql.NVarChar, value: data.CustomerID })
            count += 1
        }
        if (data.Description !== undefined && data.Description !== null) {
            if (count > 0) { query += ',' }
            query += `Description = @Description`
            parameters.push({ name: 'Description', sqltype: sql.NVarChar, value: data.Description })
            count += 1
        }
        if (data.Hold !== undefined && data.Hold !== null) {
            if (count > 0) { query += ',' }
            query += `Hold = @Hold`
            parameters.push({ name: 'Hold', sqltype: sql.Bit, value: data.Hold })
            count += 1
        }
        if (data.PaymentAmount !== undefined && data.PaymentAmount !== null) {
            if (count > 0) { query += ',' }
            query += `PaymentAmount = @PaymentAmount`
            parameters.push({ name: 'PaymentAmount', sqltype: sql.Float, value: data.PaymentAmount })
            count += 1
        }
        if (data.PaymentMethod !== undefined && data.PaymentMethod !== null) {
            if (count > 0) { query += ',' }
            query += `PaymentMethod = @PaymentMethod`
            parameters.push({ name: 'PaymentMethod', sqltype: sql.NVarChar, value: data.PaymentMethod })
            count += 1
        }
        if (data.PaymentRef !== undefined && data.PaymentRef !== null) {
            if (count > 0) { query += ',' }
            query += `PaymentRef = @PaymentRef`
            parameters.push({ name: 'PaymentRef', sqltype: sql.NVarChar, value: data.PaymentRef })
            count += 1
        }
        if (data.ReferenceNbr !== undefined && data.ReferenceNbr !== null) {
            if (count > 0) { query += ',' }
            query += `ReferenceNbr = @ReferenceNbr`
            parameters.push({ name: 'ReferenceNbr', sqltype: sql.NVarChar, value: data.ReferenceNbr })
            count += 1
        }
        if (data.PrepaymentReferenceNbr !== undefined && data.PrepaymentReferenceNbr !== null) {
            if (count > 0) { query += ',' }
            query += `PrepaymentReferenceNbr = @PrepaymentReferenceNbr`
            parameters.push({ name: 'PrepaymentReferenceNbr', sqltype: sql.NVarChar, value: data.PrepaymentReferenceNbr })
            count += 1
        }
        if (data.Status !== undefined && data.Status !== null) {
            if (count > 0) { query += ',' }
            query += `Status = @Status`
            parameters.push({ name: 'Status', sqltype: sql.NVarChar, value: data.Status })
            count += 1
        }
        if (data.Type !== undefined && data.Type !== null) {
            if (count > 0) { query += ',' }
            query += `Type = @Type`
            parameters.push({ name: 'Type', sqltype: sql.NVarChar, value: data.Type })
            count += 1
        }
        if (data.custom !== undefined && data.custom !== null) {
            if (count > 0) { query += ',' }
            query += `custom = @custom`
            parameters.push({ name: 'custom', sqltype: sql.NVarChar, value: data.custom })
            count += 1
        }
        if (data.reqData !== undefined && data.reqData !== null) {
            if (count > 0) { query += ',' }
            query += `reqData = @reqData`
            parameters.push({ name: 'reqData', sqltype: sql.Text, value: data.reqData })
            count += 1
        }
        if (data.resData !== undefined && data.resData !== null) {
            if (count > 0) { query += ',' }
            query += `resData = @resData`
            parameters.push({ name: 'resData', sqltype: sql.Text, value: data.resData })
            count += 1
        }
        if (data.resStatus !== undefined && data.resStatus !== null) {
            if (count > 0) { query += ',' }
            query += `resStatus = @resStatus`
            parameters.push({ name: 'resStatus', sqltype: sql.NVarChar, value: data.resStatus })
            count += 1
        }
        if (data.Flag !== undefined && data.Flag !== null) {
            if (count > 0) { query += ',' }
            query += `Flag = @Flag`
            parameters.push({ name: 'Flag', sqltype: sql.NVarChar, value: data.Flag })
            count += 1
        }
        if (data.ModifiedDate !== undefined && data.ModifiedDate !== null) {
            if (count > 0) { query += ',' }
            query += `ModifiedDate = @ModifiedDate`
            parameters.push({ name: 'ModifiedDate', sqltype: sql.NVarChar, value: data.ModifiedDate })
            count += 1
        }
        if (data.Remark !== undefined && data.Remark !== null) {
            if (count > 0) { query += ',' }
            query += `Remark = @Remark`
            parameters.push({ name: 'Remark', sqltype: sql.NVarChar, value: data.Remark })
            count += 1
        }
        if (data.Mix !== undefined && data.Mix !== null) {
            if (count > 0) { query += ',' }
            query += `Mix = @Mix`
            parameters.push({ name: 'Mix', sqltype: sql.Bit, value: data.Mix })
            count += 1
        }
        if (data.Escis_Remark !== undefined && data.Escis_Remark !== null) {
            if (count > 0) { query += ',' }
            query += `Escis_Remark = @Escis_Remark`
            parameters.push({ name: 'Escis_Remark', sqltype: sql.NVarChar, value: data.Escis_Remark })
            count += 1
        }
        if (data.NewPaymentRef !== undefined && data.NewPaymentRef !== null) {
            if (count > 0) { query += ',' }
            query += `NewPaymentRef = @NewPaymentRef`
            parameters.push({ name: 'NewPaymentRef', sqltype: sql.NVarChar, value: data.NewPaymentRef })
            count += 1
        }

        query += ` WHERE RecId = @RecId and invoiceNo = @invoiceNo`
        parameters.push({ name: 'RecId', sqltype: sql.BigInt, value: data.RecId })

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

exports.UpdateGRPReceiptDtl = (data) => {

    if (data.RecId !== undefined && data.RecId !== null) {

        let query = `UPDATE tbl_grp_receipt_res_dtl SET `
        let count = 0
        let parameters = []

        if (data.RefId !== undefined && data.RefId !== null) {
            if (count > 0) { query += ',' }
            query += `RefId = @RefId`
            parameters.push({ name: 'RefId', sqltype: sql.BigInt, value: data.RefId })
            count += 1
        }
        if (data.resId !== undefined && data.resId !== null) {
            if (count > 0) { query += ',' }
            query += `resId = @resId`
            parameters.push({ name: 'resId', sqltype: sql.NVarChar, value: data.resId })
            count += 1
        }
        if (data.rowNumber !== undefined && data.rowNumber !== null) {
            if (count > 0) { query += ',' }
            query += `rowNumber = @rowNumber`
            parameters.push({ name: 'rowNumber', sqltype: sql.BigInt, value: data.rowNumber })
            count += 1
        }
        if (data.note !== undefined && data.note !== null) {
            if (count > 0) { query += ',' }
            query += `note = @note`
            parameters.push({ name: 'note', sqltype: sql.NVarChar, value: data.note })
            count += 1
        }
        if (data.AmountPaid !== undefined && data.AmountPaid !== null) {
            if (count > 0) { query += ',' }
            query += `AmountPaid = @AmountPaid`
            parameters.push({ name: 'AmountPaid', sqltype: sql.Decimal, value: data.AmountPaid })
            count += 1
        }
        if (data.BalanceWriteOff !== undefined && data.BalanceWriteOff !== null) {
            if (count > 0) { query += ',' }
            query += `BalanceWriteOff = @BalanceWriteOff`
            parameters.push({ name: 'BalanceWriteOff', sqltype: sql.Decimal, value: data.BalanceWriteOff })
            count += 1
        }
        if (data.CustomerOrder !== undefined && data.CustomerOrder !== null) {
            if (count > 0) { query += ',' }
            query += `CustomerOrder = @CustomerOrder`
            parameters.push({ name: 'CustomerOrder', sqltype: sql.NVarChar, value: data.CustomerOrder })
            count += 1
        }
        if (data.Description !== undefined && data.Description !== null) {
            if (count > 0) { query += ',' }
            query += `Description = @Description`
            parameters.push({ name: 'Description', sqltype: sql.NVarChar, value: data.Description })
            count += 1
        }
        if (data.DocType !== undefined && data.DocType !== null) {
            if (count > 0) { query += ',' }
            query += `DocType = @DocType`
            parameters.push({ name: 'DocType', sqltype: sql.NVarChar, value: data.DocType })
            count += 1
        }
        if (data.ReferenceNbr !== undefined && data.ReferenceNbr !== null) {
            if (count > 0) { query += ',' }
            query += `ReferenceNbr = @ReferenceNbr`
            parameters.push({ name: 'ReferenceNbr', sqltype: sql.NVarChar, value: data.ReferenceNbr })
            count += 1
        }
        if (data.WriteOffReasonCode !== undefined && data.WriteOffReasonCode !== null) {
            if (count > 0) { query += ',' }
            query += `WriteOffReasonCode = @WriteOffReasonCode`
            parameters.push({ name: 'WriteOffReasonCode', sqltype: sql.NVarChar, value: data.WriteOffReasonCode })
            count += 1
        }
        if (data.custom !== undefined && data.custom !== null) {
            if (count > 0) { query += ',' }
            query += `custom = @custom`
            parameters.push({ name: 'custom', sqltype: sql.NVarChar, value: data.custom })
            count += 1
        }
        if (data.ModifiedDate !== undefined && data.ModifiedDate !== null) {
            if (count > 0) { query += ',' }
            query += `ModifiedDate = @ModifiedDate`
            parameters.push({ name: 'ModifiedDate', sqltype: sql.NVarChar, value: data.ModifiedDate })
            count += 1
        }

        query += ` WHERE RecId = @RecId`
        parameters.push({ name: 'RecId', sqltype: sql.BigInt, value: data.RecId })

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

exports.UpdatePaymentFlag = (PaymentRef) => {
    let parameters = [
        { name: 'PaymentRef', sqltype: sql.NVarChar, value: PaymentRef },
    ]

    let query = `UPDATE tbl_grp_receipt_res
    SET resStatus = '2' where PaymentRef=@PaymentRef
        `

    return new Promise((resolve, reject) => {
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    });

}

exports.InsertGRPReceipt_trans = (data) => {
    let column = ""
    let values = ""
    let count = 0
    let parameters = []

    if (data.resId !== undefined) {
        parameters.push({ name: 'resId', sqltype: sql.NVarChar, value: data.resId })
        column = column == "" ? column += "resId" : column += ",resId"
        values = values == "" ? values += `@resId` : values += `,@resId`
        count += 1
    }
    if (data.invoiceNo !== undefined) {
        parameters.push({ name: 'invoiceNo', sqltype: sql.NVarChar, value: data.invoiceNo })
        column = column == "" ? column += "invoiceNo" : column += ",invoiceNo"
        values = values == "" ? values += `@invoiceNo` : values += `,@invoiceNo`
        count += 1
    }
    if (data.invoiceType !== undefined) {
        parameters.push({ name: 'invoiceType', sqltype: sql.NVarChar, value: data.invoiceType })
        column = column == "" ? column += "invoiceType" : column += ",invoiceType"
        values = values == "" ? values += `@invoiceType` : values += `,@invoiceType`
        count += 1
    }
    if (data.note !== undefined) {
        parameters.push({ name: 'note', sqltype: sql.NVarChar, value: data.note })
        column = column == "" ? column += "note" : column += ",note"
        values = values == "" ? values += `@note` : values += `,@note`
        count += 1
    }
    if (data.ApplicationDate !== undefined) {
        parameters.push({ name: 'ApplicationDate', sqltype: sql.NVarChar, value: data.ApplicationDate })
        column = column == "" ? column += "ApplicationDate" : column += ",ApplicationDate"
        values = values == "" ? values += `@ApplicationDate` : values += `,@ApplicationDate`
        count += 1
    }
    if (data.AppliedToDocuments !== undefined) {
        parameters.push({ name: 'AppliedToDocuments', sqltype: sql.NVarChar, value: data.AppliedToDocuments })
        column = column == "" ? column += "AppliedToDocuments" : column += ",AppliedToDocuments"
        values = values == "" ? values += `@AppliedToDocuments` : values += `,@AppliedToDocuments`
        count += 1
    }
    if (data.ARAccount !== undefined) {
        parameters.push({ name: 'ARAccount', sqltype: sql.NVarChar, value: data.ARAccount })
        column = column == "" ? column += "ARAccount" : column += ",ARAccount"
        values = values == "" ? values += `@ARAccount` : values += `,@ARAccount`
        count += 1
    }
    if (data.ARSubaccount !== undefined) {
        parameters.push({ name: 'ARSubaccount', sqltype: sql.NVarChar, value: data.ARSubaccount })
        column = column == "" ? column += "ARSubaccount" : column += ",ARSubaccount"
        values = values == "" ? values += `@ARSubaccount` : values += `,@ARSubaccount`
        count += 1
    }
    if (data.Branch !== undefined) {
        parameters.push({ name: 'Branch', sqltype: sql.NVarChar, value: data.Branch })
        column = column == "" ? column += "Branch" : column += ",Branch"
        values = values == "" ? values += `@Branch` : values += `,@Branch`
        count += 1
    }
    if (data.CardAccountNbr !== undefined) {
        parameters.push({ name: 'CardAccountNbr', sqltype: sql.NVarChar, value: data.CardAccountNbr })
        column = column == "" ? column += "CardAccountNbr" : column += ",CardAccountNbr"
        values = values == "" ? values += `@CardAccountNbr` : values += `,@CardAccountNbr`
        count += 1
    }
    if (data.CashAccount !== undefined) {
        parameters.push({ name: 'CashAccount', sqltype: sql.NVarChar, value: data.CashAccount })
        column = column == "" ? column += "CashAccount" : column += ",CashAccount"
        values = values == "" ? values += `@CashAccount` : values += `,@CashAccount`
        count += 1
    }
    if (data.CurrencyID !== undefined) {
        parameters.push({ name: 'CurrencyID', sqltype: sql.NVarChar, value: data.CurrencyID })
        column = column == "" ? column += "CurrencyID" : column += ",CurrencyID"
        values = values == "" ? values += `@CurrencyID` : values += `,@CurrencyID`
        count += 1
    }
    // if (data.CustomerID !== undefined) {
    //     parameters.push({ name: 'CustomerID', sqltype: sql.NVarChar, value: data.CustomerID })
    //     column = column == "" ? column += "CustomerID" : column += ",CustomerID"
    //     values = values == "" ? values += `@CustomerID` : values += `,@CustomerID`
    //     count += 1
    // }
    if (data.Description !== undefined) {
        parameters.push({ name: 'Description', sqltype: sql.NVarChar, value: data.Description })
        column = column == "" ? column += "Description" : column += ",Description"
        values = values == "" ? values += `@Description` : values += `,@Description`
        count += 1
    }
    if (data.Hold !== undefined) {
        parameters.push({ name: 'Hold', sqltype: sql.Bit, value: data.Hold })
        column = column == "" ? column += "Hold" : column += ",Hold"
        values = values == "" ? values += `@Hold` : values += `,@Hold`
        count += 1
    }
    if (data.PaymentAmount !== undefined) {
        // parameters.push({ name: 'PaymentAmount', sqltype: sql.Decimal(18, 2), value: data.PaymentAmount })
        parameters.push({ name: 'PaymentAmount', sqltype: sql.Float, value: data.PaymentAmount })
        column = column == "" ? column += "PaymentAmount" : column += ",PaymentAmount"
        values = values == "" ? values += `@PaymentAmount` : values += `,@PaymentAmount`
        count += 1
    }
    // if (data.PaymentMethod !== undefined) {
    //     parameters.push({ name: 'PaymentMethod', sqltype: sql.NVarChar, value: data.PaymentMethod })
    //     column = column == "" ? column += "PaymentMethod" : column += ",PaymentMethod"
    //     values = values == "" ? values += `@PaymentMethod` : values += `,@PaymentMethod`
    //     count += 1
    // }
    if (data.PaymentRef !== undefined) {
        parameters.push({ name: 'PaymentRef', sqltype: sql.NVarChar, value: data.PaymentRef })
        column = column == "" ? column += "PaymentRef" : column += ",PaymentRef"
        values = values == "" ? values += `@PaymentRef` : values += `,@PaymentRef`
        count += 1
    }
    if (data.ReferenceNbr !== undefined) {
        parameters.push({ name: 'ReferenceNbr', sqltype: sql.NVarChar, value: data.ReferenceNbr })
        column = column == "" ? column += "ReferenceNbr" : column += ",ReferenceNbr"
        values = values == "" ? values += `@ReferenceNbr` : values += `,@ReferenceNbr`
        count += 1
    }
    if (data.PrepaymentReferenceNbr !== undefined) {
        parameters.push({ name: 'PrepaymentReferenceNbr', sqltype: sql.NVarChar, value: data.PrepaymentReferenceNbr })
        column = column == "" ? column += "PrepaymentReferenceNbr" : column += ",PrepaymentReferenceNbr"
        values = values == "" ? values += `@PrepaymentReferenceNbr` : values += `,@PrepaymentReferenceNbr`
        count += 1
    }
    if (data.Status !== undefined) {
        parameters.push({ name: 'Status', sqltype: sql.NVarChar, value: data.Status })
        column = column == "" ? column += "Status" : column += ",Status"
        values = values == "" ? values += `@Status` : values += `,@Status`
        count += 1
    }
    if (data.Type !== undefined) {
        parameters.push({ name: 'Type', sqltype: sql.NVarChar, value: data.Type })
        column = column == "" ? column += "Type" : column += ",Type"
        values = values == "" ? values += `@Type` : values += `,@Type`
        count += 1
    }
    // if (data.custom !== undefined) {
    //     parameters.push({ name: 'custom', sqltype: sql.NVarChar, value: data.custom })
    //     column = column == "" ? column += "custom" : column += ",custom"
    //     values = values == "" ? values += `@custom` : values += `,@custom`
    //     count += 1
    // }
    if (data.reqData !== undefined) {
        parameters.push({ name: 'reqData', sqltype: sql.Text, value: data.reqData })
        column = column == "" ? column += "reqData" : column += ",reqData"
        values = values == "" ? values += `@reqData` : values += `,@reqData`
        count += 1
    }
    if (data.resData !== undefined) {
        parameters.push({ name: 'resData', sqltype: sql.Text, value: data.resData })
        column = column == "" ? column += "resData" : column += ",resData"
        values = values == "" ? values += `@resData` : values += `,@resData`
        count += 1
    }
    if (data.resStatus !== undefined) {
        parameters.push({ name: 'resStatus', sqltype: sql.NVarChar, value: data.resStatus })
        column = column == "" ? column += "resStatus" : column += ",resStatus"
        values = values == "" ? values += `@resStatus` : values += `,@resStatus`
        count += 1
    }
    if (data.Flag !== undefined) {
        parameters.push({ name: 'Flag', sqltype: sql.NVarChar, value: data.Flag })
        column = column == "" ? column += "Flag" : column += ",Flag"
        values = values == "" ? values += `@Flag` : values += `,@Flag`
        count += 1
    }

    parameters.push({ name: 'CreatedDate', sqltype: sql.NVarChar, value: moment().format('YYYY-MM-DD HH:mm:ss') })
    column = column == "" ? column += "CreatedDate" : column += ",CreatedDate"
    values = values == "" ? values += `@CreatedDate` : values += `,@CreatedDate`
    count += 1


    parameters.push({ name: 'ModifiedDate', sqltype: sql.NVarChar, value: moment().format('YYYY-MM-DD HH:mm:ss') })
    column = column == "" ? column += "ModifiedDate" : column += ",ModifiedDate"
    values = values == "" ? values += `@ModifiedDate` : values += `,@ModifiedDate`
    count += 1

    if (data.Remark !== undefined) {
        parameters.push({ name: 'Remark', sqltype: sql.NVarChar, value: data.Remark })
        column = column == "" ? column += "Remark" : column += ",Remark"
        values = values == "" ? values += `@Remark` : values += `,@Remark`
        count += 1
    }
    if (data.Mix !== undefined) {
        parameters.push({ name: 'Mix', sqltype: sql.Bit, value: data.Mix })
        column = column == "" ? column += "Mix" : column += ",Mix"
        values = values == "" ? values += `@Mix` : values += `,@Mix`
        count += 1
    }

    let query = `INSERT INTO tbl_grp_receipt_res_trans (${column}) VALUES (${values});`

    if (count > 0) {
        query += `SELECT SCOPE_IDENTITY() as RecId`
        return new Promise((resolve, reject) => {
            mainDb.executeQuery(query, null, parameters, (error, data) => {
                if (error) {
                    console.log(error)
                    return reject(`${error}, ${query}`);
                }
                return resolve(data[0].RecId);
            });
        })
    }
}
