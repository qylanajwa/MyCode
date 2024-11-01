const sql = require('mssql')
const mainDb = require('../MainDb');
const moment = require('moment');

exports.SelectGRPInvoice_InvoiceNo = (invoiceNo) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'invoiceNo', sqltype: sql.NVarChar, value: invoiceNo }
        ]
        let query = `SELECT * FROM tbl_grp_invoice_res WITH (NOLOCK) WHERE invoiceNo = @invoiceNo`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectGRPInvoiceDtl_Method_id = (id, Method) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'id', sqltype: sql.NVarChar, value: id },
            { name: 'Method', sqltype: sql.NVarChar, value: Method },

        ]
        let query = `SELECT * FROM tbl_grp_invoice_res_detail WITH (NOLOCK) WHERE id = @id and Method = @Method`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectGRPInvoice_InvReport = (req) => {
    return new Promise((resolve, reject) => {

        let query = `select * from (

            select distinct im.Id,im.Quotation_no,--imd.Income_code ,imd.SubAccount,
            im.JobTrend,--imd.Item_desc ,
            im.Customer_id,im.Company_name,im.ApplicantCountry ,im.Invoice_no,im.Receipt_no,im.Costing_type,im.Invoice_type,im.File_no,im.Costing_id,
            im.Sector_type_unitcode as SectionCode,
            CASE WHEN im.Sector_type_unitcode IS NOT NULL THEN
            (SELECT TOP 1 SectionName from tbl_section s, tbl_sector_type st
            WHERE s.SectionCode=st.Type and st.UnitCode=im.Sector_type_unitcode and st.Status='1')
            ELSE '' END 'Section',
            CASE WHEN im.SecId IS NOT NULL AND im.SecId <> '' THEN
            (SELECT st.SectorName FROM tbl_sector_type st where st.SecId=im.SecId)
            WHEN im.File_id IS NOT NULL AND im.File_id <> '' THEN
            (SELECT st.SectorName FROM tbl_sector_type st, tbl_file f WITH (NOLOCK) where st.SecId=f.SecId and f.FileId=im.File_id)
            ELSE '' END 'SectorName',
            CASE WHEN im.Costing_type LIKE '%Renewal%' AND im.File_id IS NOT NULL THEN
            (SELECT ou.FullName from tbl_file oof WITH (NOLOCK), tbl_master_link oml WITH (NOLOCK), tbl_user ou WITH (NOLOCK)
            where im.File_id=oof.FileId and oof.AppId=oml.RecId and oml.OfficerId=ou.UserId)
            WHEN im.Costing_id IS NOT NULL AND EXISTS (select 1 from tbl_costing c WITH (NOLOCK) where c.CostId=im.Costing_id) THEN
            (SELECT u.FullName FROM tbl_costing c WITH (NOLOCK), tbl_user u WITH (NOLOCK) where c.CreatedBy=u.UserId and c.CostId=im.Costing_id)
            WHEN im.Prepared_by IS NOT NULL THEN im.Prepared_by ELSE '' END 'Officer',
            --imd.Unit_price,
            im.Sub_total,im.Sub_total_rm,im.Gst_amount_rm ,im.Total_amount,im.Total_amount_rm,im.Currency,im.Invoice_date AS 'InvoiceDate',
            ISNULL(CONVERT(VARCHAR(10), im.Completion_date, 103),'') AS 'Completion_date',
            CASE WHEN im.Status=3 THEN 'PAID' ELSE 'UNPAID' END 'InvoiceStatus',
            ISNULL((SELECT TOP 1 gi.ReferenceNbr from tbl_grp_invoice_res gi WITH (NOLOCK) where gi.invoiceNo=im.Invoice_no
            and gi.invoiceType='CR' --and gi.note='production'
            and (gi.ReferenceNbr is not null and gi.ReferenceNbr <>'')),'') AS 'InvoiceReferenceNbr',
            ISNULL((SELECT TOP 1 gi.Remark from tbl_grp_invoice_res gi WITH (NOLOCK) where gi.invoiceNo=im.Invoice_no
            and gi.invoiceType='CR' --and gi.note='production'  --added on 2022.10.31
            and (gi.ReferenceNbr is not null and gi.ReferenceNbr <>'')),'') AS 'InvoiceError',
            ISNULL((SELECT TOP 1 gr.ReferenceNbr from tbl_grp_receipt_res gr WITH (NOLOCK) where gr.invoiceNo=im.Invoice_no and
            (gr.ReferenceNbr is not null and gr.ReferenceNbr <>'')),'') AS 'ReceiptReferenceNbr',
           
            CASE WHEN EXISTS( SELECT TOP 1 gr.NewPaymentRef FROM tbl_grp_receipt_res gr  WHERE gr.invoiceNo = im.Invoice_no AND gr.ReferenceNbr IS NOT NULL AND gr.PaymentRef <> '' and gr.NewPaymentRef IS NOT NULL)
            THEN (SELECT TOP 1 gr.NewPaymentRef FROM tbl_grp_receipt_res gr WHERE gr.invoiceNo = im.Invoice_no AND gr.ReferenceNbr IS NOT NULL AND gr.PaymentRef <> '')
              WHEN EXISTS( SELECT TOP 1 gr.PaymentRef FROM tbl_grp_receipt_res gr  WHERE gr.PaymentRef is not null and
             gr.invoiceNo = im.Invoice_no AND 
             gr.ReferenceNbr IS NOT NULL AND gr.PaymentRef <> '' )--and invoiceNo='1522340076Z')
             THEN (SELECT TOP 1 gr.PaymentRef FROM tbl_grp_receipt_res gr WHERE gr.invoiceNo = im.Invoice_no AND gr.ReferenceNbr IS NOT NULL AND gr.PaymentRef <> '')
             ELSE ''
             END AS 'Paymentref',
             
			CASE WHEN EXISTS ( SELECT 1 FROM tbl_grp_receipt_res WITH (NOLOCK) WHERE invoiceNo = im.invoice_no AND resId IS NOT NULL AND resStatus = '1' AND flag = '2')
			THEN '1'
			ELSE '0'
			END AS 'Flag'

            from tbl_sirim_Invoice_Master im WITH (NOLOCK)--, tbl_sirim_Invoice_Details imd
            --where im.Id = imd.Invoice_master_id AND
            WHERE im.Status in (1,2,3) and im.Invoice_type = 'CR' and im.Total_amount_rm > 0
            AND im.Invoice_date >= '2022-01-01 00:00:00'`

        if (req.from != null && req.to != '') {
            let fromDate = req.from + ' 00:00:00';
            let toDate = req.to + ' 23:59:59';
            query += `AND im.Invoice_date between '${fromDate}' AND '${toDate}'`
        }

        query += `UNION

        select distinct im.Id, im.Quotation_no,
        --imd.Income_code, imd.SubAccount,
        im.JobTrend,
        --imd.Item_desc,
        im.Customer_id, im.Company_name, im.ApplicantCountry, im.Invoice_no, im.Receipt_no, im.Costing_type, im.Invoice_type, im.File_no, im.Costing_id,
        im.Sector_type_unitcode as SectionCode,
        CASE WHEN im.Sector_type_unitcode IS NOT NULL THEN
            (SELECT TOP 1 SectionName from tbl_section s, tbl_sector_type st
        WHERE s.SectionCode = st.Type and st.UnitCode = im.Sector_type_unitcode and st.Status = '1')
        ELSE '' END 'Section',
        CASE WHEN im.SecId IS NOT NULL AND im.SecId <> '' THEN
            (SELECT st.SectorName FROM tbl_sector_type st where st.SecId = im.SecId)
        WHEN im.File_id IS NOT NULL AND im.File_id <> '' THEN
        (SELECT st.SectorName FROM tbl_sector_type st, tbl_file f where st.SecId = f.SecId and f.FileId = im.File_id)
        ELSE '' END 'SectorName',
        CASE WHEN im.Costing_id IS NOT NULL AND EXISTS(select 1 from tbl_costing c WITH(NOLOCK) where c.CostId = im.Costing_id) THEN
            (SELECT u.FullName FROM tbl_costing c WITH(NOLOCK), tbl_user u where c.CreatedBy = u.UserId and c.CostId = im.Costing_id)
        WHEN im.Prepared_by IS NOT NULL THEN im.Prepared_by
        ELSE '' END 'Officer',
        --imd.Unit_price,
        im.Sub_total, im.Sub_total_rm, im.Gst_amount_rm, im.Total_amount, im.Total_amount_rm, im.Currency, im.Invoice_date AS 'InvoiceDate',
        
        CASE WHEN CONVERT(VARCHAR(10), im.Completion_date, 103) IS NOT NULL THEN CONVERT(VARCHAR(10), im.Completion_date, 103)
        WHEN CONVERT(VARCHAR(10), t.ModifiedDate, 103) IS NOT NULL THEN CONVERT(VARCHAR(10), t.ModifiedDate, 103)
        ELSE '' END AS 'Completion_date',

		CASE WHEN EXISTS ( SELECT 1 FROM tbl_grp_receipt_res WITH (NOLOCK) WHERE invoiceNo = im.invoice_no AND resId IS NOT NULL AND resStatus = '1' AND flag = '2')
		THEN '1'
		ELSE '0'
		END AS 'Flag',

        
                CASE WHEN im.Status = 3 THEN 'PAID'
        ELSE 'UNPAID' END 'InvoiceStatus',
        ISNULL((SELECT TOP 1 gi.ReferenceNbr from tbl_grp_invoice_res gi WITH(NOLOCK) where gi.invoiceNo = im.Invoice_no
        and gi.invoiceType = 'AP' --and gi.note = 'production'
        and(gi.ReferenceNbr is not null and gi.ReferenceNbr <> '')), '') AS 'InvoiceReferenceNbr',
        ISNULL((SELECT TOP 1 gi.Remark from tbl_grp_invoice_res gi WITH(NOLOCK) where gi.invoiceNo = im.Invoice_no
        and gi.invoiceType = 'AP' --and gi.note = 'production'  --added on 2022.10.31
        and(gi.ReferenceNbr is not null and gi.ReferenceNbr <> '')), '') AS 'InvoiceError',
        ISNULL((SELECT TOP 1 gr.ReferenceNbr from tbl_grp_receipt_res gr WITH(NOLOCK) where gr.invoiceNo = im.Invoice_no and
        (gr.ReferenceNbr is not null and gr.ReferenceNbr <> '')), '') AS 'ReceiptReferenceNbr',

        CASE WHEN EXISTS( SELECT TOP 1 gr.NewPaymentRef FROM tbl_grp_receipt_res gr  WHERE gr.invoiceNo = im.Invoice_no AND gr.ReferenceNbr IS NOT NULL AND gr.PaymentRef <> '' and gr.NewPaymentRef IS NOT NULL)
        THEN (SELECT TOP 1 gr.NewPaymentRef FROM tbl_grp_receipt_res gr WHERE gr.invoiceNo = im.Invoice_no AND gr.ReferenceNbr IS NOT NULL AND gr.PaymentRef <> '')
          WHEN EXISTS( SELECT TOP 1 gr.PaymentRef FROM tbl_grp_receipt_res gr  WHERE gr.PaymentRef is not null and
         gr.invoiceNo = im.Invoice_no AND 
         gr.ReferenceNbr IS NOT NULL AND gr.PaymentRef <> '' )--and invoiceNo='1522340076Z')
         THEN (SELECT TOP 1 gr.PaymentRef FROM tbl_grp_receipt_res gr WHERE gr.invoiceNo = im.Invoice_no AND gr.ReferenceNbr IS NOT NULL AND gr.PaymentRef <> '')
         ELSE ''
         END AS 'Paymentref'

         from tbl_sirim_Invoice_Master im WITH(NOLOCK), tbl_costing c WITH(NOLOCK), tbl_task_list t WITH(NOLOCK)--, tbl_sirim_Invoice_Details imd
         --where im.Id = imd.Invoice_master_id AND
         where im.Costing_id = c.CostId and ISNUMERIC(im.Costing_id) = 1 and im.Status = 3 and im.Total_amount_rm > 0
         and im.Invoice_type = 'AP'and exists(select 1 from tbl_task_list WITH(NOLOCK) where WfId = c.WfId and
         (TaskName like '%Audit Report%PC Approval%' or TaskName like 'GCC Evaluation Report%' or TaskName like '%FAR%Compliance Assessment%'
         or TaskName like '%FAR%Surveillance%' or TaskName like '%FAR%Reassessment%' or TaskName
         like '%FAR%Special Inspection%')
         and status = '2')
         and not exists(select 1 from tbl_task_list WITH(NOLOCK) where WfId = c.WfId and
         (TaskName like '%Audit Report%PC Approval%' or TaskName like 'GCC Evaluation Report%' or TaskName like '%FAR%Compliance Assessment%'
         or TaskName like '%FAR%Surveillance%' or TaskName like '%FAR%Reassessment%' or TaskName
         like '%FAR%Special Inspection%')
         and status in ('1', '3'))
         and c.WfId = t.WfId and
         (t.TaskName like '%Audit Report%PC Approval%' or t.TaskName like 'GCC Evaluation Report%' or t.TaskName like '%FAR%Compliance Assessment%'
         or t.TaskName like '%FAR%Surveillance%' or t.TaskName like '%FAR%Reassessment%' or t.TaskName like '%FAR%Special Inspection%')
         and t.Status = '2'
         and t.ModifiedDate = (select MIN(t2.ModifiedDate) from tbl_task_list t2 WITH(NOLOCK) where t2.WfId = c.WfId and
         (t2.TaskName like '%Audit Report%PC Approval%' or t2.TaskName like 'GCC Evaluation Report%' or t2.TaskName like '%FAR%Compliance Assessment%'
         or t2.TaskName like '%FAR%Surveillance%' or t2.TaskName like '%FAR%Reassessment%' or t2.TaskName like '%FAR%Special Inspection%')
         and t2.Status = '2')
         AND CONVERT(VARCHAR(7), t.ModifiedDate, 126) >= '2022-01'`

        if (req.from != null && req.to != '') {
            let fromDate = req.from + ' 00:00:00';
            let toDate = req.to + ' 23:59:59';
            query += `AND CONVERT(VARCHAR(19), t.ModifiedDate, 120) between '${fromDate}' AND '${toDate}'`
        }

        query += ` )z WHERE z.InvoiceReferenceNbr is not null `

        if (req.Company_name != null && req.Company_name != '') {
            query += ` AND z.Company_name LIKE '%${req.Company_name}%'`
        }
        if (req.SectionCode != null && req.SectionCode != '') {
            query += ` AND z.SectionCode = '${req.SectionCode}'`
        }
        if (req.InvoiceStatus != null && req.InvoiceStatus != '') {
            query += ` AND z.InvoiceStatus = '${req.InvoiceStatus}'`
        }


        mainDb.executeQuery(query, null, null, (error, data) => {
            console.log(query)
            if (error) {
                return reject(`${error}, ${query} `);
            }
            return resolve(data);
        });
    })
}

exports.SelectCreditNote_InvoiceId = (Id) => {
    return new Promise((resolve, reject) => {
        let parameters = [{ name: 'Id', sqltype: sql.BigInt, value: Id }];
        let query = `SELECT * FROM tbl_credit_note WITH(NOLOCK) WHERE InvoiceId = @Id`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query} `);
            }
            return resolve(data);
        });
    });
};

exports.SelectGRPInvoice_InvoiceNoType = (invoiceNo, type) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'invoiceNo', sqltype: sql.NVarChar, value: invoiceNo },
            { name: 'invoiceType', sqltype: sql.NVarChar, value: type }
        ]
        let query = `SELECT * FROM tbl_grp_invoice_res WITH(NOLOCK) WHERE invoiceNo = @invoiceNo AND invoiceType = @invoiceType`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query} `);
            }
            return resolve(data);
        });
    })
}

exports.SelectGRPInvoice_ReferenceNbr = (ReferenceNbr) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'ReferenceNbr', sqltype: sql.NVarChar, value: ReferenceNbr }
        ]
        let query = `SELECT * FROM tbl_grp_invoice_res WITH(NOLOCK) WHERE ReferenceNbr = @ReferenceNbr`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query} `);
            }
            return resolve(data);
        });
    })
}

exports.SelectMasterInvoice_Type = (invoiceNo) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'invoiceNo', sqltype: sql.NVarChar, value: invoiceNo }
        ]
        let query = `SELECT Invoice_type FROM tbl_sirim_Invoice_Master WITH(NOLOCK) WHERE Invoice_no = @invoiceNo`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query} `);
            }
            return resolve(data);
        });
    })
}

exports.SelectInvNo_MasterInv = (invoiceNo) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'invoiceNo', sqltype: sql.NVarChar, value: invoiceNo }
        ]
        let query = `SELECT * FROM tbl_sirim_Invoice_Master WITH(NOLOCK) WHERE Invoice_no = @invoiceNo`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query} `);
            }
            return resolve(data);
        });
    })
}


exports.SelectGRPreqData_InvoiceNoType = (invoiceNo, type) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'invoiceNo', sqltype: sql.NVarChar, value: invoiceNo },
            { name: 'invoiceType', sqltype: sql.NVarChar, value: type }
        ]
        let query = `SELECT reqData FROM tbl_grp_invoice_res WITH(NOLOCK) WHERE invoiceNo = @invoiceNo AND invoiceType = @invoiceType`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query} `);
            }
            return resolve(data[0].reqData);
        });
    })
}

exports.SelectJoinsTable = (invoiceNo) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'invoiceNo', sqltype: sql.NVarChar, value: invoiceNo }
        ]
        let query = `SELECT 
      CASE WHEN c.WfId IS NOT NULL THEN c.WfId
    ELSE(SELECT cost.WfId FROM tbl_quotation quote join tbl_costing cost on cost.CostId = quote.CostId AND quote.QuoteNo = i.Costing_id) 
      END AS WfId,
        CASE WHEN c.CostId IS NOT NULL THEN c.CostId
    ELSE(SELECT q.CostId FROM tbl_quotation q where q.QuoteNo = i.Costing_id) 
      END AS CostId,
        i.Sector_type_unitcode, i.Quotation_no from tbl_sirim_Invoice_Master i 
      left join tbl_costing c on CAST(c.CostId as varchar(10)) = CAST(i.Costing_id as varchar(10))
      where i.Invoice_no = @invoiceNo`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query} `);
            }
            return resolve(data);
        });
    })
}

exports.SelectGRPInvoiceDtl_RefId = (invoiceNo) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'invoiceNo', sqltype: sql.NVarChar, value: invoiceNo }
        ]
        let query = `select * from tbl_grp_invoice_res_dtl dtl, tbl_grp_invoice_res inv where dtl.RefId = inv.RecId
      and inv.invoiceNo = @invoiceNo`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query} `);
            }
            return resolve(data);
        });
    })
}

exports.SelectGRPInvoiceDtl = (RefId) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'RefId', sqltype: sql.BigInt, value: RefId }
        ]
        let query = `select * from tbl_grp_invoice_res_dtl dtl where dtl.RefId = @RefId`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query} `);
            }
            return resolve(data);
        });
    })
}

exports.GetPaidInvoice = (Invoice_no) => {
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'Invoice_no', sqltype: sql.NVarChar, value: Invoice_no }
        ]
        let query = `select status from tbl_sirim_Invoice_Master where Invoice_no = @Invoice_no`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query} `);
            }
            return resolve(data);
        });
    })
}


exports.GetInvoiceList = (obj) => {
    return new Promise((resolve, reject) => {
        //let parameters;

        //let query = `exec GetMyFastInvoice`;
        let query;
        console.log("value:" + obj)
        if (obj.dateFromReceipt == null || obj.dateFromReceipt == undefined || obj.dateFromReceipt == "") {
            obj.dateFromReceipt = null;
        }
        if (obj.dateToReceipt == null || obj.dateToReceipt == undefined || obj.dateToReceipt == "") {
            obj.dateToReceipt = null;
        }
        let parameters = [
            { name: 'dateFromInvoice', sqltype: sql.NVarChar, value: obj.dateFromInvoice },
            { name: 'dateToInvoice', sqltype: sql.NVarChar, value: obj.dateToInvoice },
            { name: 'dateFromReceipt', sqltype: sql.NVarChar, value: obj.dateFromReceipt },
            { name: 'dateToReceipt', sqltype: sql.NVarChar, value: obj.dateToReceipt },
            { name: 'InvStatus', sqltype: sql.NVarChar, value: obj.InvoiceStatus }
        ]
        console.log(parameters)

        if(obj.dateFromReceipt == null && obj.dateToReceipt == null){
            query = `exec getERPListByInvDate @dateFromInvoice, @dateToInvoice, @InvStatus`;
        }
        else{
            query = `exec getERPList @dateFromInvoice, @dateToInvoice, @InvStatus, @dateFromReceipt, @dateToReceipt`;
        }


        //     let query = `
        //     SELECT * FROM (
        //         select distinct im.Invoice_no as invoiceNo, im.Invoice_date AS invoiceDate, im.Payment_date AS receiptDate, 
        //         im.Company_name as Customer,
        //         case
        //             when im.Status = '1' then 'Approved'
        //             when im.Status = '2' then 'Payment Pending Verification'
        //             when im.Status = '3' then 'Paid'
        //         end as invoiceStatus,
        //         im.Payment_status as receiptStatus, 
        //         case
        //             when i.resid is not null and i.resid <> '' then '1' else '0' 
        //         end As Flag, im.Invoice_type as invoiceType, 
        //         case 
        //             when im.Status in ('1','2') Then 
        //             case
        //                 when i.ReferenceNbr is not null Then '1' Else '0'
        //             end
        //             when im.Status in ('3') Then
        //             Case
        //                 when i.ReferenceNbr is not null and r.ReferenceNbr is not null Then '1' Else '0'
        //             End
        //             end as resStatus, im.Costing_id AS CostId, im.Receipt_no as receiptNo, i.Remark as InvoiceError,
        //     case when r.Remark is not null then r.remark
        //         else ISNULL(r.Remark, '') end as ReceiptError, '1' As Part
        //         from tbl_sirim_Invoice_Master im
        //         left join tbl_grp_invoice_res i on i.invoiceNo = im.Invoice_no
        //         left join tbl_grp_receipt_res r on r.invoiceNo = im.Invoice_no and r.invoiceNo = i.invoiceNo
        //         where i.invoiceNo = im.Invoice_no
        //   and r.invoiceNo=im.Invoice_no
        //         and im.Status in ('1','2','3') and im.Invoice_type = 'CR' `

        //     if (obj.dateFromInvoice && obj.dateToInvoice) {
        //         //query += `and (im.Invoice_date between CAST(@dateFromInvoice as date) and CAST(@dateToInvoice as date) )`
        //         query += `and CONVERT(date,im.invoice_date) between @dateFromInvoice and @dateToInvoice`
        //     }

        //     if (obj.dateFromReceipt && obj.dateToReceipt) {
        //         //query += `	and (im.Payment_date between CAST(@dateFromReceipt as date) and CAST(@dateToReceipt as date) ) `
        //         query += `and CONVERT(date,im.Payment_date) between @dateFromReceipt and @dateToReceipt`

        //     }

        //     query += `
        //     --GET invoice CR yang tak wujud
        //     UNION
        //      select distinct im.Invoice_no as invoiceNo, im.Invoice_date AS invoiceDate, im.Payment_date AS receiptDate, 
        //    im.Company_name as Customer,
        //    case
        //        when im.Status = '1' then 'Approved'
        //        when im.Status = '2' then 'Payment Pending Verification'
        //        when im.Status = '3' then 'Paid'
        //    end as invoiceStatus,
        //    im.Payment_status as receiptStatus, 
        //    case
        //        when IM.Invoice_no not in (select invoiceno from tbl_grp_invoice_res where resid is not null and resid <> '') then '1' else '0' 
        //    end As Flag, im.Invoice_type as invoiceType, 
        //   '0' as resStatus, im.Costing_id AS CostId, im.Receipt_no as receiptNo,case  when exists (select invoiceNo,Remark from tbl_grp_invoice_res where invoiceno=im.invoice_no) then (select remark from tbl_grp_invoice_res where invoiceno=im.invoice_no) 
        //    else '' end as InvoiceError,
        //    '' as ReceiptError, '2' As Part
        //    from tbl_sirim_Invoice_Master im
        //    where im.Status in ('1','2','3') and im.Invoice_type = 'CR'
        //    and im.Invoice_no not in (select invoiceno from tbl_grp_invoice_res where resid is not null and resid <> '')`

        //     if (obj.dateFromInvoice && obj.dateToInvoice) {
        //         //query += `and (im.Invoice_date between CAST(@dateFromInvoice as date) and CAST(@dateToInvoice as date) )`
        //         query += `and CONVERT(date,im.invoice_date) between @dateFromInvoice and @dateToInvoice`
        //     }

        //     if (obj.dateFromReceipt && obj.dateToReceipt) {
        //         //query += `	and (im.Payment_date between CAST(@dateFromReceipt as date) and CAST(@dateToReceipt as date) ) `
        //         query += `and CONVERT(date,im.Payment_date) between @dateFromReceipt and @dateToReceipt`
        //     }

        //     query += `
        //     --GET invoice status 6 & crm
        //     UNION
        //     select distinct im.Invoice_no as invoiceNo, im.Invoice_date AS invoiceDate, im.Payment_date AS receiptDate, 
        //     im.Company_name as Customer,
        //     'Cancelled' as invoiceStatus,
        //     im.Payment_status as receiptStatus, 
        //     case
        //         when i.invoiceType = 'CRM' and i.resid is not null and i.resid <> '' then '1' else '0' 
        //     end As Flag, i.invoiceType as invoiceType, 
        //     case 
        //         when im.Status in ('6') Then
        //         Case
        //         when i.invoiceType = 'CRM' and r.Type = 'Credit Memo' and i.ReferenceNbr is not null and r.ReferenceNbr is not null or r.resStatus ='1' Then '1' Else '0'
        //         End
        //     end as resStatus, im.Costing_id AS CostId, 	case 
        //     when im.Receipt_no is null or im.receipt_no ='' and im.Id in (select InvoiceId from tbl_credit_note where InvoiceId = im.Id)
        //     Then (select distinct cnReceiptNo from tbl_credit_note where InvoiceId = im.Id and cnReceiptNo is not null and cnReceiptNo <>'')
        //     when im.Receipt_no is not null and im.receipt_no <>'' Then im.Receipt_no
        //     else ''
        //     end as receiptNo, i.Remark as InvoiceError, 
        //     ISNULL(r.Remark, '') as ReceiptError, '3' As Part
        //     from tbl_sirim_Invoice_Master im
        //     left join tbl_grp_invoice_res i on i.invoiceNo = im.Invoice_no
        //     left join tbl_grp_receipt_res r on r.invoiceNo = im.Invoice_no and r.invoiceNo = i.invoiceNo
        //     where i.invoiceNo = im.Invoice_no
        //     and im.Status in ('6') and im.Invoice_type = 'CR' and i.invoiceType = 'CRM'`

        //     if (obj.dateFromInvoice && obj.dateToInvoice) {
        //         //query += `and (im.Invoice_date between CAST(@dateFromInvoice as date) and CAST(@dateToInvoice as date) )`
        //         query += `and CONVERT(date,im.invoice_date) between @dateFromInvoice and @dateToInvoice`
        //     }

        //     if (obj.dateFromReceipt && obj.dateToReceipt) {
        //         //query += `	and (im.Payment_date between CAST(@dateFromReceipt as date) and CAST(@dateToReceipt as date) ) `
        //         query += `and CONVERT(date,im.Payment_date) between @dateFromReceipt and @dateToReceipt`
        //     }

        //     query += `
        //     --GET invoice status 3 & ap
        //     UNION
        //     --tak wujud dlm table grp invoice:AP
        //    select distinct im.Invoice_no as invoiceNo, im.Invoice_date AS invoiceDate, im.Payment_date AS receiptDate,
        //      im.Company_name as Customer,
        //      Case
        //          When im.Status = '3' Then 'Paid'
        //      End as invoiceStatus,
        //      im.Payment_status as receiptStatus,
        //      r.Flag As Flag,
        //      'AP' as invoiceType,
        //      case
        //      when im.Invoice_no not in (select invoiceNo from tbl_grp_receipt_res where invoiceno=im.invoice_no and resid is not null) then '0' --tak wujud dlm resit
        //      WHEN im.Invoice_type = 'AP' and im.Status = '3' and r.ReferenceNbr IS null THEN '0' --tak berjaya prepayment dalam grp resit
        //      WHEN r.resid is null and im.invoice_no in (select invoiceNo from tbl_grp_invoice_res where invoiceno=im.invoice_no and resid is not null) then '0' --tak berjaya dlm resit tp berjaya inv
        //      WHEN r.resid is not null and im.invoice_no in (select invoiceNo from tbl_grp_invoice_res where invoiceno=im.invoice_no and resid is not null) and (r.flag<>'2' and r.resstatus<>'1' or r.flag='2'and r.resStatus='2') then '0' --tak berjaya doc apply
        //      WHEN r.resid is not null and im.invoice_no in (select invoiceNo from tbl_grp_invoice_res where invoiceno=im.invoice_no and resid is not null) and ( r.flag='1' and r.resStatus='1') then '0' --tak berjaya doc apply

        // WHEN r.type is not null and r.flag='1' and im.Invoice_no not in (select invoiceNo from tbl_grp_invoice_res where invoiceno=im.invoice_no and resid is not null) --tak berjaya inv (after job complete)
        //      and im.Invoice_no in -----job completion
        //      (select distinct im.invoice_no
        //      from tbl_sirim_invoice_master im 
        //      join tbl_costing c on c.costid=im.costing_id
        //      join tbl_task_list tl on c.wfid=tl.wfid
        //      where 
        //       im.invoice_type='AP'
        //      and im.Status=3 and im.total_amount_rm>0
        //      and exists (select 1 from tbl_task_list where WfId=c.WfId and
        //      (TaskName like '%Audit Report%' or TaskName like 'GCC Evaluation Report%' or TaskName like '%FAR%Compliance Assessment%'
        //      or TaskName like '%FAR%Surveillance%' or TaskName like '%FAR%Reassessment%' or TaskName like '%FAR%Special Inspection%')
        //      and status = '2')
        //      and not exists (select 1 from tbl_task_list where WfId=c.WfId and
        //      (TaskName like '%Audit Report%' or TaskName like 'GCC Evaluation Report%' or TaskName like '%FAR%Compliance Assessment%'
        //      or TaskName like '%FAR%Surveillance%' or TaskName like '%FAR%Reassessment%' or TaskName like '%FAR%Special Inspection%')
        //      and status in ('1','3'))
        //      and tl.Status='2'
        //      and tl.ModifiedDate = (select MAX(t2.ModifiedDate) from tbl_task_list t2 where t2.WfId=c.WfId and
        //      (t2.TaskName like '%Audit Report%' or t2.TaskName like 'GCC Evaluation Report%' or t2.TaskName like '%FAR%Compliance Assessment%'
        //      or t2.TaskName like '%FAR%Surveillance%' or t2.TaskName like '%FAR%Reassessment%' or t2.TaskName like '%FAR%Special Inspection%')
        //      and t2.Status = '2')
        //      and year(tl.modifiedDate)>='2022')
        //      then '0'
        //      when r.ReferenceNbr is not null and r.resId is not null and r.resStatus='1' and r.flag='2' and r.invoiceNo in(select invoiceno from tbl_grp_invoice_res where resId is not null and resid <>'')
        //  then '1' --berjaya docapply & inv
        //  when r.ReferenceNbr is not null and r.resId is not null and im.Invoice_no not in  (select distinct im.invoice_no
        //      from tbl_sirim_invoice_master im 
        //      join tbl_costing c on c.costid=im.costing_id
        //      join tbl_task_list tl on c.wfid=tl.wfid
        //      where 
        //       im.invoice_type='AP'
        //      and im.Status=3 and im.total_amount_rm>0
        //      and exists (select 1 from tbl_task_list where WfId=c.WfId and
        //      (TaskName like '%Audit Report%' or TaskName like 'GCC Evaluation Report%' or TaskName like '%FAR%Compliance Assessment%'
        //      or TaskName like '%FAR%Surveillance%' or TaskName like '%FAR%Reassessment%' or TaskName like '%FAR%Special Inspection%')
        //      and status = '2')
        //      and not exists (select 1 from tbl_task_list where WfId=c.WfId and
        //      (TaskName like '%Audit Report%' or TaskName like 'GCC Evaluation Report%' or TaskName like '%FAR%Compliance Assessment%'
        //      or TaskName like '%FAR%Surveillance%' or TaskName like '%FAR%Reassessment%' or TaskName like '%FAR%Special Inspection%')
        //      and status in ('1','3'))
        //      and tl.Status='2'
        //      and tl.ModifiedDate = (select MAX(t2.ModifiedDate) from tbl_task_list t2 where t2.WfId=c.WfId and
        //      (t2.TaskName like '%Audit Report%' or t2.TaskName like 'GCC Evaluation Report%' or t2.TaskName like '%FAR%Compliance Assessment%'
        //      or t2.TaskName like '%FAR%Surveillance%' or t2.TaskName like '%FAR%Reassessment%' or t2.TaskName like '%FAR%Special Inspection%')
        //      and t2.Status = '2')
        //      and year(tl.modifiedDate)>='2022') then '1'

        //      else '0'
        //      end as resStatus
        //      , im.Costing_id AS CostId, im.Receipt_no as receiptNo,  case
        //      when exists (select invoiceNo,Remark from tbl_grp_invoice_res where invoiceno=im.invoice_no) then (select remark from tbl_grp_invoice_res where invoiceno=im.invoice_no) 
        //  else '' end as InvoiceError,
        //  case when r.remark is not null and r.remark <> '' then r.remark
        //      else ISNULL(r.Remark, '') end as ReceiptError, '4' As Part
        //      from tbl_sirim_Invoice_Master im
        //      left join tbl_grp_receipt_res r on r.invoiceNo = im.Invoice_no 
        //      where 
        //      --r.invoiceNo = im.Invoice_no and
        //      --and r.ReferenceNbr is not null and r.resId is not null
        //       im.Status in ('3') and im.Invoice_type = 'AP'`

        //     if (obj.dateFromInvoice && obj.dateToInvoice) {
        //         //query += `and (im.Invoice_date between CAST(@dateFromInvoice as date) and CAST(@dateToInvoice as date) )`
        //         query += `and CONVERT(date,im.invoice_date) between @dateFromInvoice and @dateToInvoice`
        //     }

        //     if (obj.dateFromReceipt && obj.dateToReceipt) {
        //         //query += `	and (im.Payment_date between CAST(@dateFromReceipt as date) and CAST(@dateToReceipt as date) ) `
        //         query += `and CONVERT(date,im.Payment_date) between @dateFromReceipt and @dateToReceipt`
        //     }

        //     query += ` UNION
        //     --tak wujud dlm table grp receipt:AP
        //     select distinct im.Invoice_no as invoiceNo, im.Invoice_date AS invoiceDate, im.Payment_date AS receiptDate,
        //     im.Company_name as Customer,
        //     Case
        //         When im.Status = '3' Then 'Paid'
        //     End as invoiceStatus,
        //     im.Payment_status as receiptStatus,
        //     '1' As Flag,
        //     'AP' as invoiceType,
        //     case
        //     WHEN im.Invoice_type = 'AP' and im.Status = '3' and r.Type IS null THEN '0'
        //     end as resStatus, im.Costing_id AS CostId, im.Receipt_no as receiptNo,
        //     case  when exists (select invoiceNo,Remark from tbl_grp_invoice_res where invoiceno=im.invoice_no) then (select remark from tbl_grp_invoice_res where invoiceno=im.invoice_no) 
        //     else '' end as InvoiceError,
        //    case when r.remark is not null and r.remark <> '' then r.remark
        //    else ISNULL(r.Remark, '') end as ReceiptError, '5' As Part
        //     from tbl_sirim_Invoice_Master im
        //     left join tbl_grp_receipt_res r on r.invoiceNo = im.Invoice_no 
        //     where r.invoiceNo = im.Invoice_no
        //      and r.ReferenceNbr is null and r.resId is null
        //     and im.Status in ('3') and im.Invoice_type = 'AP'`

        //     if (obj.dateFromInvoice && obj.dateToInvoice) {
        //         //query += `and (im.Invoice_date between CAST(@dateFromInvoice as date) and CAST(@dateToInvoice as date) )`
        //         query += `and CONVERT(date,im.invoice_date) between @dateFromInvoice and @dateToInvoice`
        //     }

        //     if (obj.dateFromReceipt && obj.dateToReceipt) {
        //         //query += `	and (im.Payment_date between CAST(@dateFromReceipt as date) and CAST(@dateToReceipt as date) ) `
        //         query += `and CONVERT(date,im.Payment_date) between @dateFromReceipt and @dateToReceipt`
        //     }
        //     query += ` ) Z where resStatus =@InvStatus`

        // console.log(query)
        // console.log(parameters)

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectInvoiceDataApprovedCR = () => {
    return new Promise((resolve, reject) => {
        let parameters;

        let query = `
        select ir.* from tbl_sirim_Invoice_Master i 
        left join tbl_grp_invoice_res ir on ir.invoiceNo = i.Invoice_no 
        where i.status in ('1','2') and i.Invoice_type = 'CR'
        and year(i.Created_date) > 2021 and MONTH(i.Created_date) >= 1
		    and ir.invoiceType not in ('CRM','offline','online')
        and ir.ReferenceNbr is null
		    and ir.note <>'staging'`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    });
};

exports.SelectInvoiceDataApprovedCR = () => {
    return new Promise((resolve, reject) => {
        let parameters;

        let query = `
      select ir.* from tbl_sirim_Invoice_Master i 
      left join tbl_grp_invoice_res ir on ir.invoiceNo = i.Invoice_no 
      where i.status in ('1','2') and i.Invoice_type = 'CR'
      and year(i.Created_date) > 2021 and MONTH(i.Created_date) >= 1
  and ir.invoiceType not in ('CRM','offline','online')
      and ir.ReferenceNbr is null
  and ir.note <>'staging'`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectInvoiceDataPaidCR = () => {
    return new Promise((resolve, reject) => {
        let parameters;

        let query = `
      select * from tbl_sirim_Invoice_Master i 
      left join tbl_grp_invoice_res ir on ir.invoiceNo = i.Invoice_no 
      where i.status in ('3') and i.Invoice_type = 'CR'
      and year(i.Created_date) > 2021 and MONTH(i.Created_date) >= 1`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectInvoiceDataPaidCR_tblReceipt = () => {
    return new Promise((resolve, reject) => {
        let parameters;

        let query = `
      select m.Invoice_no,iv.ReferenceNbr as invoiceRef,rr.ReferenceNbr as receiptRef,m.status,iv.invoiceType,m.Payment_date from tbl_sirim_Invoice_Master m join tbl_grp_invoice_res iv
      on m.Invoice_no=iv.invoiceNo join tbl_grp_receipt_res rr on m.Invoice_no=rr.invoiceNo
      where m.Invoice_type='CR' and  year(m.Payment_date) > 2021 and MONTH(m.Payment_date) >= 1
      and (iv.ReferenceNbr is null or rr.ReferenceNbr is null )
      and m.status='3' and iv.invoiceType not in ('CRM','offline','online','AP')`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectCRAPInvoice = (invoiceNo) => { //7/9/2022
    return new Promise((resolve, reject) => {
        let parameters = [
            { name: 'invoiceNo', sqltype: sql.NVarChar, value: invoiceNo }
        ]
        let query = `select * from tbl_grp_invoice_res where invoiceNo 
      like '@invoiceNo%'`;
        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectCustomOffline = () => { //7/9/2022
    return new Promise((resolve, reject) => {
        let parameters;

        let query = `
      select REPLACE(invoiceNo,'-Test','') as invoice_No, * from tbl_grp_invoice_res where resid is null and invoiceType in('online','offline')
      and invoiceNo like '%test%'
      order by invoiceNo  `;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}


exports.SelectInvoiceDataCRM = () => {
    return new Promise((resolve, reject) => {
        let parameters;

        let query =
            //`select distinct * from  (select cn.CreditNoteDate,cn.InvoiceNo,m.Invoice_no from tbl_credit_note cn
            //     join tbl_sirim_Invoice_Master m
            //     on cn.InvoiceId=m.Id
            //     where m.status='6'
            //     and not existS(select invoiceno from tbl_grp_invoice_res where invoiceType='CRM' and invoiceno = m.Invoice_no)
            //     and cn.CreditNoteDate>='2022-01-01'
            //     and cn.CNInvoiceNo NOT LIKE '%I%' and m.Invoice_no not like '%I%'
            //     --and cn.CNInvoiceNo  LIKE 'I%' OR m.Invoice_no  like 'I%'
            //     --and cn.InvoiceNo='1522214511Z'

            //     union

            //     select cn.CreditNoteDate,cn.InvoiceNo,m.Invoice_no from tbl_credit_note cn
            //     join tbl_sirim_Invoice_Master m
            //     on cn.InvoiceId=m.Id
            //     join tbl_grp_invoice_res i
            //     on i.invoiceNo=m.Invoice_no
            //     where m.status='6'
            //     and exists (select invoiceno from tbl_grp_invoice_res where resId is null and invoiceNo=m.Invoice_no and type='CRM')
            //     and cn.CreditNoteDate>='2022-01-01'
            //     and cn.CNInvoiceNo NOT LIKE '%I%' and m.Invoice_no not like '%I%'
            //     and i.invoiceType='CRM'
            //     --and cn.CNInvoiceNo  LIKE 'I%' OR m.Invoice_no  like 'I%'
            //     --and cn.InvoiceNo='3512100920Z'
            //     ) z
            //     --where z.Invoice_no='1532209934Z'
            //     order by z.CreditNoteDate 
            //     `
            `select  cn.CreditNoteDate,cn.InvoiceNo,i.invoiceNo as Invoice_no from tbl_grp_invoice_res i join tbl_credit_note cn 
      on cn.invoiceno = i.invoiceno where i.reqData like '%invoice_master_id%'`

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectInvoiceDocApplyCRM = () => {
    return new Promise((resolve, reject) => {
        let parameters;

        let query = `/*FAILED DOC APPLY CRM*/
  select distinct * from(select rr.invoiceNo as 'invoiceNo',m.Invoice_date,ir.Remark as 'Remark','Part 1' as 'Part' from tbl_sirim_Invoice_Master m
      join tbl_grp_receipt_res rr on m.Invoice_no=rr.invoiceNo
      join tbl_grp_invoice_res ir on m.Invoice_no=ir.invoiceNo
      where m.status='6' and rr.flag='3' and rr.resStatus='2'
      and ir.resId is not null  and ir.invoiceType='CRM' and ir.ReferenceNbr <>'NO_OPENITEM'
      and rr.invoiceNo not like 'I%' and year(m.Invoice_date)>'2021' and rr.Escis_Remark is null and ir.Remark <> 'CRM closed!'
      UNION
      /*TAK DOC APPPLY LAGI -- tak wujud dlm table resit*/
      select m.Invoice_no as 'invoiceNo',m.Invoice_date,ir.Remark as 'Remark','Part 2' as 'Part' from tbl_sirim_Invoice_Master m
      join tbl_grp_invoice_res ir on m.Invoice_no=ir.invoiceNo
      where m.status='6' 
      and ir.resId is not null  and ir.invoiceType='CRM' and ir.ReferenceNbr <>'NO_OPENITEM'
      and year(m.Invoice_date)>'2021' 
  and invoiceNo not in (select invoiceNo from tbl_grp_receipt_res where invoiceNo=m.Invoice_no and flag='3' and resStatus='1')
  and invoiceNo not in (select invoiceNo from tbl_grp_invoice_res where invoiceNo=m.Invoice_no and invoiceType in ('AP','CR') and Remark='CRM closed!')
  and invoiceNo not in (select invoiceNo from tbl_grp_invoice_res where invoiceNo=m.Invoice_no and invoiceType ='CRM' and Remark<>'CRM closed!')


  and ir.Escis_Remark is null and ir.invoiceNo not like 'I%')z -- where z.Remark is null `

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectInvoiceDataPaidAP = () => {
    return new Promise((resolve, reject) => {
        let parameters;

        let query = `
      select i.Invoice_no from tbl_sirim_Invoice_Master i 
      where i.status in ('3') and i.Invoice_type = 'AP'
      and year(i.Created_date) > 2021 and MONTH(i.Created_date) >= 1`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectBacklogInvoices = () => {
    return new Promise((resolve, reject) => {
        let parameters;

        let query = `exec GetMyFastBacklog`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.SelectCustomInvoices = () => {
    return new Promise((resolve, reject) => {
        let parameters;

        let query = `exec GetMyFastCustom`;

        mainDb.executeQuery(query, null, parameters, (error, data) => {
            if (error) {
                return reject(`${error}, ${query}`);
            }
            return resolve(data);
        });
    })
}

exports.InsertGRPInvoice = (data) => {
    //insert transaction
    if (data.invoiceNo !== undefined) {
        this.InsertGRPInvoice_trans(data)
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
    if (data.BalancebyDocuments !== undefined) {
        parameters.push({ name: 'BalancebyDocuments', sqltype: sql.Float, value: data.BalancebyDocuments })
        column = column == "" ? column += "BalancebyDocuments" : column += ",BalancebyDocuments"
        values = values == "" ? values += `@BalancebyDocuments` : values += `,@BalancebyDocuments`
        count += 1
    }
    if (data.BalanceDiscrepancy !== undefined) {
        parameters.push({ name: 'BalanceDiscrepancy', sqltype: sql.Float, value: data.BalanceDiscrepancy })
        column = column == "" ? column += "BalanceDiscrepancy" : column += ",BalanceDiscrepancy"
        values = values == "" ? values += `@BalanceDiscrepancy` : values += `,@BalanceDiscrepancy`
        count += 1
    }
    if (data.CompanyBranch !== undefined) {
        parameters.push({ name: 'CompanyBranch', sqltype: sql.NVarChar, value: data.CompanyBranch })
        column = column == "" ? column += "CompanyBranch" : column += ",CompanyBranch"
        values = values == "" ? values += `@CompanyBranch` : values += `,@CompanyBranch`
        count += 1
    }
    if (data.CurrentBalance !== undefined) {
        parameters.push({ name: 'CurrentBalance', sqltype: sql.Float, value: data.CurrentBalance })
        column = column == "" ? column += "CurrentBalance" : column += ",CurrentBalance"
        values = values == "" ? values += `@CurrentBalance` : values += `,@CurrentBalance`
        count += 1
    }
    if (data.Customer !== undefined) {
        parameters.push({ name: 'Customer', sqltype: sql.NVarChar, value: data.Customer })
        column = column == "" ? column += "Customer" : column += ",Customer"
        values = values == "" ? values += `@Customer` : values += `,@Customer`
        count += 1
    }
    if (data.Period !== undefined) {
        parameters.push({ name: 'Period', sqltype: sql.NVarChar, value: data.Period })
        column = column == "" ? column += "Period" : column += ",Period"
        values = values == "" ? values += `@Period` : values += `,@Period`
        count += 1
    }
    if (data.PrepaymentBalance !== undefined) {
        parameters.push({ name: 'PrepaymentBalance', sqltype: sql.Float, value: data.PrepaymentBalance })
        column = column == "" ? column += "PrepaymentBalance" : column += ",PrepaymentBalance"
        values = values == "" ? values += `@PrepaymentBalance` : values += `,@PrepaymentBalance`
        count += 1
    }
    if (data.RetainedBalance !== undefined) {
        parameters.push({ name: 'RetainedBalance', sqltype: sql.Float, value: data.RetainedBalance })
        column = column == "" ? column += "RetainedBalance" : column += ",RetainedBalance"
        values = values == "" ? values += `@RetainedBalance` : values += `,@RetainedBalance`
        count += 1
    }
    //
    if (data.Amount !== undefined) {
        parameters.push({ name: 'Amount', sqltype: sql.Float, value: data.Amount })
        column = column == "" ? column += "Amount" : column += ",Amount"
        values = values == "" ? values += `@Amount` : values += `,@Amount`
        count += 1
    }
    if (data.Balance !== undefined) {
        parameters.push({ name: 'Balance', sqltype: sql.Float, value: data.Balance })
        column = column == "" ? column += "Balance" : column += ",Balance"
        values = values == "" ? values += `@Balance` : values += `,@Balance`
        count += 1
    }
    if (data.BillingPrinted !== undefined) {
        parameters.push({ name: 'BillingPrinted', sqltype: sql.Bit, value: data.BillingPrinted })
        column = column == "" ? column += "BillingPrinted" : column += ",BillingPrinted"
        values = values == "" ? values += `@BillingPrinted` : values += `,@BillingPrinted`
        count += 1
    }
    if (data.CreatedDateTime !== undefined) {
        parameters.push({ name: 'CreatedDateTime', sqltype: sql.NVarChar, value: data.CreatedDateTime })
        column = column == "" ? column += "CreatedDateTime" : column += ",CreatedDateTime"
        values = values == "" ? values += `@CreatedDateTime` : values += `,@CreatedDateTime`
        count += 1
    }
    if (data.Currency !== undefined) {
        parameters.push({ name: 'Currency', sqltype: sql.NVarChar, value: data.Currency })
        column = column == "" ? column += "Currency" : column += ",Currency"
        values = values == "" ? values += `@Currency` : values += `,@Currency`
        count += 1
    }
    if (data.CustomerOrder !== undefined) {
        parameters.push({ name: 'CustomerOrder', sqltype: sql.NVarChar, value: data.CustomerOrder })
        column = column == "" ? column += "CustomerOrder" : column += ",CustomerOrder"
        values = values == "" ? values += `@CustomerOrder` : values += `,@CustomerOrder`
        count += 1
    }
    if (data.Date !== undefined) {
        parameters.push({ name: 'Date', sqltype: sql.NVarChar, value: data.Date })
        column = column == "" ? column += "Date" : column += ",Date"
        values = values == "" ? values += `@Date` : values += `,@Date`
        count += 1
    }
    if (data.DueDate !== undefined) {
        parameters.push({ name: 'DueDate', sqltype: sql.NVarChar, value: data.DueDate })
        column = column == "" ? column += "DueDate" : column += ",DueDate"
        values = values == "" ? values += `@DueDate` : values += `,@DueDate`
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
    if (data.LastModifiedDateTime !== undefined) {
        parameters.push({ name: 'LastModifiedDateTime', sqltype: sql.NVarChar, value: data.LastModifiedDateTime })
        column = column == "" ? column += "LastModifiedDateTime" : column += ",LastModifiedDateTime"
        values = values == "" ? values += `@LastModifiedDateTime` : values += `,@LastModifiedDateTime`
        count += 1
    }
    if (data.LinkARAccount !== undefined) {
        parameters.push({ name: 'LinkARAccount', sqltype: sql.NVarChar, value: data.LinkARAccount })
        column = column == "" ? column += "LinkARAccount" : column += ",LinkARAccount"
        values = values == "" ? values += `@LinkARAccount` : values += `,@LinkARAccount`
        count += 1
    }
    if (data.LinkARSubAccount !== undefined) {
        parameters.push({ name: 'LinkARSubAccount', sqltype: sql.NVarChar, value: data.LinkARSubAccount })
        column = column == "" ? column += "LinkARSubAccount" : column += ",LinkARSubAccount"
        values = values == "" ? values += `@LinkARSubAccount` : values += `,@LinkARSubAccount`
        count += 1
    }
    if (data.LinkBranch !== undefined) {
        parameters.push({ name: 'LinkBranch', sqltype: sql.NVarChar, value: data.LinkBranch })
        column = column == "" ? column += "LinkBranch" : column += ",LinkBranch"
        values = values == "" ? values += `@LinkBranch` : values += `,@LinkBranch`
        count += 1
    }
    if (data.OriginalDocument !== undefined) {
        parameters.push({ name: 'OriginalDocument', sqltype: sql.NVarChar, value: data.OriginalDocument })
        column = column == "" ? column += "OriginalDocument" : column += ",OriginalDocument"
        values = values == "" ? values += `@OriginalDocument` : values += `,@OriginalDocument`
        count += 1
    }
    if (data.PostPeriod !== undefined) {
        parameters.push({ name: 'PostPeriod', sqltype: sql.NVarChar, value: data.PostPeriod })
        column = column == "" ? column += "PostPeriod" : column += ",PostPeriod"
        values = values == "" ? values += `@PostPeriod` : values += `,@PostPeriod`
        count += 1
    }
    if (data.Project !== undefined) {
        parameters.push({ name: 'Project', sqltype: sql.NVarChar, value: data.Project })
        column = column == "" ? column += "Project" : column += ",Project"
        values = values == "" ? values += `@Project` : values += `,@Project`
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
    if (data.TaxTotal !== undefined) {
        parameters.push({ name: 'TaxTotal', sqltype: sql.Float, value: data.TaxTotal })
        column = column == "" ? column += "TaxTotal" : column += ",TaxTotal"
        values = values == "" ? values += `@TaxTotal` : values += `,@TaxTotal`
        count += 1
    }
    if (data.Terms !== undefined) {
        parameters.push({ name: 'Terms', sqltype: sql.NVarChar, value: data.Terms })
        column = column == "" ? column += "Terms" : column += ",Terms"
        values = values == "" ? values += `@Terms` : values += `,@Terms`
        count += 1
    }
    if (data.Type !== undefined) {
        parameters.push({ name: 'Type', sqltype: sql.NVarChar, value: data.Type })
        column = column == "" ? column += "Type" : column += ",Type"
        values = values == "" ? values += `@Type` : values += `,@Type`
        count += 1
    }
    //
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
    if (data.Remark !== undefined) {
        parameters.push({ name: 'Remark', sqltype: sql.Text, value: data.Remark })
        column = column == "" ? column += "Remark" : column += ",Remark"
        values = values == "" ? values += `@Remark` : values += `,@Remark`
        count += 1
    }
    if (data.Escis_Remark !== undefined) {
        parameters.push({ name: 'Escis_Remark', sqltype: sql.NVarChar, value: data.Escis_Remark })
        column = column == "" ? column += "Escis_Remark" : column += ",Escis_Remark"
        values = values == "" ? values += `@Escis_Remark` : values += `,@Escis_Remark`
        count += 1
    }

    let query = `INSERT INTO tbl_grp_invoice_res (${column}) VALUES (${values});`

    if (count > 0) {
        query += `SELECT SCOPE_IDENTITY() as RecId`
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

exports.InsertGRPInvoiceDtl = (data) => {
    let column = ""
    let values = ""
    let count = 0
    let parameters = []

    if (data.RecId !== undefined) {
        parameters.push({ name: 'RecId', sqltype: sql.BigInt, value: data.RecId })
        column = column == "" ? column += "RecId" : column += ",RecId"
        values = values == "" ? values += `@RecId` : values += `,@RecId`
        count += 1
    }
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
    if (data.Balance !== undefined) {
        parameters.push({ name: 'Balance', sqltype: sql.Float, value: data.Balance })
        column = column == "" ? column += "Balance" : column += ",Balance"
        values = values == "" ? values += `@Balance` : values += `,@Balance`
        count += 1
    }
    if (data.Branch !== undefined) {
        parameters.push({ name: 'Branch', sqltype: sql.NVarChar, value: data.Branch })
        column = column == "" ? column += "Branch" : column += ",Branch"
        values = values == "" ? values += `@Branch` : values += `,@Branch`
        count += 1
    }
    if (data.CashDiscountTaken !== undefined) {
        parameters.push({ name: 'CashDiscountTaken', sqltype: sql.Float, value: data.CashDiscountTaken })
        column = column == "" ? column += "CashDiscountTaken" : column += ",CashDiscountTaken"
        values = values == "" ? values += `@CashDiscountTaken` : values += `,@CashDiscountTaken`
        count += 1
    }
    if (data.Customer !== undefined) {
        parameters.push({ name: 'Customer', sqltype: sql.NVarChar, value: data.Customer })
        column = column == "" ? column += "Customer" : column += ",Customer"
        values = values == "" ? values += `@Customer` : values += `,@Customer`
        count += 1
    }
    if (data.CustomerInvoiceNbrPaymentNbr !== undefined) {
        parameters.push({ name: 'CustomerInvoiceNbrPaymentNbr', sqltype: sql.NVarChar, value: data.CustomerInvoiceNbrPaymentNbr })
        column = column == "" ? column += "CustomerInvoiceNbrPaymentNbr" : column += ",CustomerInvoiceNbrPaymentNbr"
        values = values == "" ? values += `@CustomerInvoiceNbrPaymentNbr` : values += `,@CustomerInvoiceNbrPaymentNbr`
        count += 1
    }
    if (data.Date !== undefined) {
        parameters.push({ name: 'Date', sqltype: sql.NVarChar, value: data.Date })
        column = column == "" ? column += "Date" : column += ",Date"
        values = values == "" ? values += `@Date` : values += `,@Date`
        count += 1
    }
    if (data.Description !== undefined) {
        parameters.push({ name: 'Description', sqltype: sql.NVarChar, value: data.Description })
        column = column == "" ? column += "Description" : column += ",Description"
        values = values == "" ? values += `@Description` : values += `,@Description`
        count += 1
    }
    if (data.DueDate !== undefined) {
        parameters.push({ name: 'DueDate', sqltype: sql.NVarChar, value: data.DueDate })
        column = column == "" ? column += "DueDate" : column += ",DueDate"
        values = values == "" ? values += `@DueDate` : values += `,@DueDate`
        count += 1
    }
    if (data.OriginalDocument !== undefined) {
        parameters.push({ name: 'OriginalDocument', sqltype: sql.NVarChar, value: data.OriginalDocument })
        column = column == "" ? column += "OriginalDocument" : column += ",OriginalDocument"
        values = values == "" ? values += `@OriginalDocument` : values += `,@OriginalDocument`
        count += 1
    }
    if (data.OriginalRetainage !== undefined) {
        parameters.push({ name: 'OriginalRetainage', sqltype: sql.Float, value: data.OriginalRetainage })
        column = column == "" ? column += "OriginalRetainage" : column += ",OriginalRetainage"
        values = values == "" ? values += `@OriginalRetainage` : values += `,@OriginalRetainage`
        count += 1
    }
    if (data.OriginAmount !== undefined) {
        parameters.push({ name: 'OriginAmount', sqltype: sql.Float, value: data.OriginAmount })
        column = column == "" ? column += "OriginAmount" : column += ",OriginAmount"
        values = values == "" ? values += `@OriginAmount` : values += `,@OriginAmount`
        count += 1
    }
    if (data.PaymentMethod !== undefined) {
        parameters.push({ name: 'PaymentMethod', sqltype: sql.NVarChar, value: data.PaymentMethod })
        column = column == "" ? column += "PaymentMethod" : column += ",PaymentMethod"
        values = values == "" ? values += `@PaymentMethod` : values += `,@PaymentMethod`
        count += 1
    }
    if (data.PostPeriod !== undefined) {
        parameters.push({ name: 'PostPeriod', sqltype: sql.NVarChar, value: data.PostPeriod })
        column = column == "" ? column += "PostPeriod" : column += ",PostPeriod"
        values = values == "" ? values += `@PostPeriod` : values += `,@PostPeriod`
        count += 1
    }
    if (data.ReferenceNbr !== undefined) {
        parameters.push({ name: 'ReferenceNbr', sqltype: sql.NVarChar, value: data.ReferenceNbr })
        column = column == "" ? column += "ReferenceNbr" : column += ",ReferenceNbr"
        values = values == "" ? values += `@ReferenceNbr` : values += `,@ReferenceNbr`
        count += 1
    }
    if (data.RetainageInvoice !== undefined) {
        parameters.push({ name: 'RetainageInvoice', sqltype: sql.Bit, value: data.RetainageInvoice })
        column = column == "" ? column += "RetainageInvoice" : column += ",RetainageInvoice"
        values = values == "" ? values += `@RetainageInvoice` : values += `,@RetainageInvoice`
        count += 1
    }
    if (data.Status !== undefined) {
        parameters.push({ name: 'Status', sqltype: sql.NVarChar, value: data.Status })
        column = column == "" ? column += "Status" : column += ",Status"
        values = values == "" ? values += `@Status` : values += `,@Status`
        count += 1
    }
    if (data.TotalAmount !== undefined) {
        parameters.push({ name: 'TotalAmount', sqltype: sql.Float, value: data.TotalAmount })
        column = column == "" ? column += "TotalAmount" : column += ",TotalAmount"
        values = values == "" ? values += `@TotalAmount` : values += `,@TotalAmount`
        count += 1
    }
    if (data.TypeDisplayDocType !== undefined) {
        parameters.push({ name: 'TypeDisplayDocType', sqltype: sql.NVarChar, value: data.TypeDisplayDocType })
        column = column == "" ? column += "TypeDisplayDocType" : column += ",TypeDisplayDocType"
        values = values == "" ? values += `@TypeDisplayDocType` : values += `,@TypeDisplayDocType`
        count += 1
    }
    if (data.UnreleasedRetainage !== undefined) {
        parameters.push({ name: 'UnreleasedRetainage', sqltype: sql.Float, value: data.UnreleasedRetainage })
        column = column == "" ? column += "UnreleasedRetainage" : column += ",UnreleasedRetainage"
        values = values == "" ? values += `@UnreleasedRetainage` : values += `,@UnreleasedRetainage`
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
    //
    if (data.Account !== undefined) {
        parameters.push({ name: 'Account', sqltype: sql.Int, value: data.Account })
        column = column == "" ? column += "Account" : column += ",Account"
        values = values == "" ? values += `@Account` : values += `,@Account`
        count += 1
    }

    if (data.Amount !== undefined) {
        parameters.push({ name: 'Amount', sqltype: sql.Float, value: data.Amount })
        column = column == "" ? column += "Amount" : column += ",Amount"
        values = values == "" ? values += `@Amount` : values += `,@Amount`
        count += 1
    }
    if (data.DeferralCode !== undefined) {
        parameters.push({ name: 'DeferralCode', sqltype: sql.NVarChar, value: data.DeferralCode })
        column = column == "" ? column += "DeferralCode" : column += ",DeferralCode"
        values = values == "" ? values += `@DeferralCode` : values += `,@DeferralCode`
        count += 1
    }
    if (data.DiscountAmount !== undefined) {
        parameters.push({ name: 'DiscountAmount', sqltype: sql.Float, value: data.DiscountAmount })
        column = column == "" ? column += "DiscountAmount" : column += ",DiscountAmount"
        values = values == "" ? values += `@DiscountAmount` : values += `,@DiscountAmount`
        count += 1
    }

    if (data.ExtendedPrice !== undefined) {
        parameters.push({ name: 'ExtendedPrice', sqltype: sql.Float, value: data.ExtendedPrice })
        column = column == "" ? column += "ExtendedPrice" : column += ",ExtendedPrice"
        values = values == "" ? values += `@ExtendedPrice` : values += `,@ExtendedPrice`
        count += 1
    }

    if (data.InventoryID !== undefined) {
        parameters.push({ name: 'InventoryID', sqltype: sql.NVarChar, value: data.InventoryID })
        column = column == "" ? column += "InventoryID" : column += ",InventoryID"
        values = values == "" ? values += `@InventoryID` : values += `,@InventoryID`
        count += 1
    }

    if (data.LastModifiedDateTime !== undefined) {
        parameters.push({ name: 'LastModifiedDateTime', sqltype: sql.NVarChar, value: data.LastModifiedDateTime })
        column = column == "" ? column += "LastModifiedDateTime" : column += ",LastModifiedDateTime"
        values = values == "" ? values += `@LastModifiedDateTime` : values += `,@LastModifiedDateTime`
        count += 1
    }

    if (data.LineNbr !== undefined) {
        parameters.push({ name: 'LineNbr', sqltype: sql.Int, value: data.LineNbr })
        column = column == "" ? column += "LineNbr" : column += ",LineNbr"
        values = values == "" ? values += `@LineNbr` : values += `,@LineNbr`
        count += 1
    }

    if (data.ProjectTask !== undefined) {
        parameters.push({ name: 'ProjectTask', sqltype: sql.NVarChar, value: data.ProjectTask })
        column = column == "" ? column += "ProjectTask" : column += ",ProjectTask"
        values = values == "" ? values += `@ProjectTask` : values += `,@ProjectTask`
        count += 1
    }

    if (data.Qty !== undefined) {
        parameters.push({ name: 'Qty', sqltype: sql.Int, value: data.Qty })
        column = column == "" ? column += "Qty" : column += ",Qty"
        values = values == "" ? values += `@Qty` : values += `,@Qty`
        count += 1
    }

    if (data.Subaccount !== undefined) {
        parameters.push({ name: 'Subaccount', sqltype: sql.NVarChar, value: data.Subaccount })
        column = column == "" ? column += "Subaccount" : column += ",Subaccount"
        values = values == "" ? values += `@Subaccount` : values += `,@Subaccount`
        count += 1
    }

    if (data.TaxCategory !== undefined) {
        parameters.push({ name: 'TaxCategory', sqltype: sql.NVarChar, value: data.TaxCategory })
        column = column == "" ? column += "TaxCategory" : column += ",TaxCategory"
        values = values == "" ? values += `@TaxCategory` : values += `,@TaxCategory`
        count += 1
    }

    if (data.TermEndDate !== undefined) {
        parameters.push({ name: 'TermEndDate', sqltype: sql.NVarChar, value: data.TermEndDate })
        column = column == "" ? column += "TermEndDate" : column += ",TermEndDate"
        values = values == "" ? values += `@TermEndDate` : values += `,@TermEndDate`
        count += 1
    }

    if (data.TermStartDate !== undefined) {
        parameters.push({ name: 'TermStartDate', sqltype: sql.NVarChar, value: data.TermStartDate })
        column = column == "" ? column += "TermStartDate" : column += ",TermStartDate"
        values = values == "" ? values += `@TermStartDate` : values += `,@TermStartDate`
        count += 1
    }

    if (data.TransactionDescription !== undefined) {
        parameters.push({ name: 'TransactionDescription', sqltype: sql.NVarChar, value: data.TransactionDescription })
        column = column == "" ? column += "TransactionDescription" : column += ",TransactionDescription"
        values = values == "" ? values += `@TransactionDescription` : values += `,@TransactionDescription`
        count += 1
    }

    if (data.UnitPrice !== undefined) {
        parameters.push({ name: 'UnitPrice', sqltype: sql.Float, value: data.UnitPrice })
        column = column == "" ? column += "UnitPrice" : column += ",UnitPrice"
        values = values == "" ? values += `@UnitPrice` : values += `,@UnitPrice`
        count += 1
    }

    if (data.UOM !== undefined) {
        parameters.push({ name: 'UOM', sqltype: sql.NVarChar, value: data.UOM })
        column = column == "" ? column += "UOM" : column += ",UOM"
        values = values == "" ? values += `@UOM` : values += `,@UOM`
        count += 1
    }
    let query = `INSERT INTO tbl_grp_invoice_res_dtl (${column}) VALUES (${values});`

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


exports.InsertGRPInvoiceDetail = (data) => {
    //insert transaction
    if (data.invoiceNo !== undefined) {
        this.InsertGRPInvoice_trans(data)
    }
    //end

    let column = ""
    let values = ""
    let count = 0
    let parameters = []

    if (data.id !== undefined) {
        parameters.push({ name: 'id', sqltype: sql.NVarChar, value: data.id })
        column = column == "" ? column += "id" : column += ",id"
        values = values == "" ? values += `@id` : values += `,@id`
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
    if (data.Amount !== undefined) {
        parameters.push({ name: 'Amount', sqltype: sql.Float, value: data.Amount })
        column = column == "" ? column += "Amount" : column += ",Amount"
        values = values == "" ? values += `@Amount` : values += `,@Amount`
        count += 1
    }
    if (data.Balance !== undefined) {
        parameters.push({ name: 'Balance', sqltype: sql.Float, value: data.Balance })
        column = column == "" ? column += "Balance" : column += ",Balance"
        values = values == "" ? values += `@Balance` : values += `,@Balance`
        count += 1
    }
    if (data.BillingPeriod !== undefined) {
        parameters.push({ name: 'BillingPeriod', sqltype: sql.NVarChar, value: data.BillingPeriod })
        column = column == "" ? column += "BillingPeriod" : column += ",BillingPeriod"
        values = values == "" ? values += `@BillingPeriod` : values += `,@BillingPeriod`
        count += 1
    }
    if (data.BillingPrinted !== undefined) {
        parameters.push({ name: 'BillingPrinted', sqltype: sql.NVarChar, value: data.BillingPrinted })
        column = column == "" ? column += "BillingPrinted" : column += ",BillingPrinted"
        values = values == "" ? values += `@BillingPrinted` : values += `,@BillingPrinted`
        count += 1
    }
    if (data.ClassificationCode !== undefined) {
        parameters.push({ name: 'ClassificationCode', sqltype: sql.NVarChar, value: data.ClassificationCode })
        column = column == "" ? column += "ClassificationCode" : column += ",ClassificationCode"
        values = values == "" ? values += `@ClassificationCode` : values += `,@ClassificationCode`
        count += 1
    }
    if (data.CreatedDateTime !== undefined) {
        parameters.push({ name: 'CreatedDateTime', sqltype: sql.NVarChar, value: data.CreatedDateTime })
        column = column == "" ? column += "CreatedDateTime" : column += ",CreatedDateTime"
        values = values == "" ? values += `@CreatedDateTime` : values += `,@CreatedDateTime`
        count += 1
    }
    if (data.Currency !== undefined) {
        parameters.push({ name: 'Currency', sqltype: sql.NVarChar, value: data.Currency })
        column = column == "" ? column += "Currency" : column += ",Currency"
        values = values == "" ? values += `@Currency` : values += `,@Currency`
        count += 1
    }
    if (data.Customer !== undefined) {
        parameters.push({ name: 'Customer', sqltype: sql.NVarChar, value: data.Customer })
        column = column == "" ? column += "Customer" : column += ",Customer"
        values = values == "" ? values += `@Customer` : values += `,@Customer`
        count += 1
    }
    if (data.CustomerOrder !== undefined) {
        parameters.push({ name: 'CustomerOrder', sqltype: sql.NVarChar, value: data.CustomerOrder })
        column = column == "" ? column += "CustomerOrder" : column += ",CustomerOrder"
        values = values == "" ? values += `@CustomerOrder` : values += `,@CustomerOrder`
        count += 1
    }
    //
    if (data.Date !== undefined) {
        parameters.push({ name: 'Date', sqltype: sql.NVarChar, value: data.Date })
        column = column == "" ? column += "Date" : column += ",Date"
        values = values == "" ? values += `@Date` : values += `,@Date`
        count += 1
    }
    if (data.Description !== undefined) {
        parameters.push({ name: 'Description', sqltype: sql.NVarChar, value: data.Description })
        column = column == "" ? column += "Description" : column += ",Description"
        values = values == "" ? values += `@Description` : values += `,@Description`
        count += 1
    }
    if (data.DigitalSign !== undefined) {
        parameters.push({ name: 'DigitalSign', sqltype: sql.NVarChar, value: data.DigitalSign })
        column = column == "" ? column += "DigitalSign" : column += ",DigitalSign"
        values = values == "" ? values += `@DigitalSign` : values += `,@DigitalSign`
        count += 1
    }
    if (data.DueDate !== undefined) {
        parameters.push({ name: 'DueDate', sqltype: sql.NVarChar, value: data.DueDate })
        column = column == "" ? column += "DueDate" : column += ",DueDate"
        values = values == "" ? values += `@DueDate` : values += `,@DueDate`
        count += 1
    }
    if (data.FrequencyofBilling !== undefined) {
        parameters.push({ name: 'FrequencyofBilling', sqltype: sql.NVarChar, value: data.FrequencyofBilling })
        column = column == "" ? column += "FrequencyofBilling" : column += ",FrequencyofBilling"
        values = values == "" ? values += `@FrequencyofBilling` : values += `,@FrequencyofBilling`
        count += 1
    }
    if (data.Hold !== undefined) {
        parameters.push({ name: 'Hold', sqltype: sql.NVarChar, value: data.Hold })
        column = column == "" ? column += "Hold" : column += ",Hold"
        values = values == "" ? values += `@Hold` : values += `,@Hold`
        count += 1
    }
    if (data.LastModifiedDateTime !== undefined) {
        parameters.push({ name: 'LastModifiedDateTime', sqltype: sql.NVarChar, value: data.LastModifiedDateTime })
        column = column == "" ? column += "LastModifiedDateTime" : column += ",LastModifiedDateTime"
        values = values == "" ? values += `@LastModifiedDateTime` : values += `,@LastModifiedDateTime`
        count += 1
    }
    if (data.LinkARAccount !== undefined) {
        parameters.push({ name: 'LinkARAccount', sqltype: sql.NVarChar, value: data.LinkARAccount })
        column = column == "" ? column += "LinkARAccount" : column += ",LinkARAccount"
        values = values == "" ? values += `@LinkARAccount` : values += `,@LinkARAccount`
        count += 1
    }
    if (data.LinkARSubAccount !== undefined) {
        parameters.push({ name: 'LinkARSubAccount', sqltype: sql.NVarChar, value: data.LinkARSubAccount })
        column = column == "" ? column += "LinkARSubAccount" : column += ",LinkARSubAccount"
        values = values == "" ? values += `@LinkARSubAccount` : values += `,@LinkARSubAccount`
        count += 1
    }
    if (data.LinkBranch !== undefined) {
        parameters.push({ name: 'LinkBranch', sqltype: sql.NVarChar, value: data.LinkBranch })
        column = column == "" ? column += "LinkBranch" : column += ",LinkBranch"
        values = values == "" ? values += `@LinkBranch` : values += `,@LinkBranch`
        count += 1
    }

    if (data.LocationID !== undefined) {
        parameters.push({ name: 'LocationID', sqltype: sql.NVarChar, value: data.LocationID })
        column = column == "" ? column += "LocationID" : column += ",LocationID"
        values = values == "" ? values += `@LocationID` : values += `,@LocationID`
        count += 1
    }
    if (data.OriginalDocument !== undefined) {
        parameters.push({ name: 'OriginalDocument', sqltype: sql.NVarChar, value: data.OriginalDocument })
        column = column == "" ? column += "OriginalDocument" : column += ",OriginalDocument"
        values = values == "" ? values += `@OriginalDocument` : values += `,@OriginalDocument`
        count += 1
    }
    if (data.PostPeriod !== undefined) {
        parameters.push({ name: 'PostPeriod', sqltype: sql.NVarChar, value: data.PostPeriod })
        column = column == "" ? column += "PostPeriod" : column += ",PostPeriod"
        values = values == "" ? values += `@PostPeriod` : values += `,@PostPeriod`
        count += 1
    }
    if (data.Project !== undefined) {
        parameters.push({ name: 'Project', sqltype: sql.NVarChar, value: data.Project })
        column = column == "" ? column += "Project" : column += ",Project"
        values = values == "" ? values += `@Project` : values += `,@Project`
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
    if (data.TaxTotal !== undefined) {
        parameters.push({ name: 'TaxTotal', sqltype: sql.Float, value: data.TaxTotal })
        column = column == "" ? column += "TaxTotal" : column += ",TaxTotal"
        values = values == "" ? values += `@TaxTotal` : values += `,@TaxTotal`
        count += 1
    }
    if (data.Terms !== undefined) {
        parameters.push({ name: 'Terms', sqltype: sql.NVarChar, value: data.Terms })
        column = column == "" ? column += "Terms" : column += ",Terms"
        values = values == "" ? values += `@Terms` : values += `,@Terms`
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
    if (data.Method !== undefined) {
        parameters.push({ name: 'Method', sqltype: sql.NVarChar, value: data.Method })
        column = column == "" ? column += "Method" : column += ",Method"
        values = values == "" ? values += `@Method` : values += `,@Method`
        count += 1
    }
    if (data.reqJSON !== undefined) {
        parameters.push({ name: 'reqJSON', sqltype: sql.NVarChar, value: data.reqJSON })
        column = column == "" ? column += "reqJSON" : column += ",reqJSON"
        values = values == "" ? values += `@reqJSON` : values += `,@reqJSON`
        count += 1
    }
    if (data.resJSON !== undefined) {
        parameters.push({ name: 'resJSON', sqltype: sql.NVarChar, value: data.resJSON })
        column = column == "" ? column += "resJSON" : column += ",resJSON"
        values = values == "" ? values += `@resJSON` : values += `,@resJSON`
        count += 1
    }


    let query = `INSERT INTO tbl_grp_invoice_res_detail (${column}) VALUES (${values});`
    console.log(query)
    console.log(`${values}`)
    if (count > 0) {
        return new Promise((resolve, reject) => {
            mainDb.executeQuery(query, null, parameters, (error, data) => {
                if (error) {
                    console.log(error)
                    return reject(`${error}, ${query}`);
                }
                return resolve(true);
            });
        })
    }
}



// UPDATE QUERIES
exports.UpdateGRPInvoice = (data, invoiceType) => {
    //insert transaction
    if (data.invoiceNo !== undefined && data.invoiceNo !== null) {
        this.InsertGRPInvoice_trans(data, invoiceType)
    }
    //end

    if (data.invoiceNo !== undefined && data.invoiceNo !== null) {
        let query = `UPDATE tbl_grp_invoice_res SET `
        let count = 0
        let parameters = []

        if (data.resId !== undefined && data.resId !== null) {
            if (count > 0) { query += ',' }
            query += `resId = @resId`
            parameters.push({ name: 'resId', sqltype: sql.NVarChar, value: data.resId })
            count += 1
        }
        if (data.note !== undefined && data.note !== null) {
            if (count > 0) { query += ',' }
            query += `note = @note`
            parameters.push({ name: 'note', sqltype: sql.NVarChar, value: data.note })
            count += 1
        }
        if (data.BalancebyDocuments !== undefined && data.BalancebyDocuments !== null) {
            if (count > 0) { query += ',' }
            query += `BalancebyDocuments = @BalancebyDocuments`
            parameters.push({ name: 'BalancebyDocuments', sqltype: sql.Float, value: data.BalancebyDocuments })
            count += 1
        }
        if (data.BalanceDiscrepancy !== undefined && data.BalanceDiscrepancy !== null) {
            if (count > 0) { query += ',' }
            query += `BalanceDiscrepancy = @BalanceDiscrepancy`
            parameters.push({ name: 'BalanceDiscrepancy', sqltype: sql.Float, value: data.BalanceDiscrepancy })
            count += 1
        }
        if (data.CurrentBalance !== undefined && data.CurrentBalance !== null) {
            if (count > 0) { query += ',' }
            query += `CurrentBalance = @CurrentBalance`
            parameters.push({ name: 'CurrentBalance', sqltype: sql.Float, value: data.CurrentBalance })
            count += 1
        }
        if (data.Customer !== undefined && data.Customer !== null) {
            if (count > 0) { query += ',' }
            query += `Customer = @Customer`
            parameters.push({ name: 'Customer', sqltype: sql.NVarChar, value: data.Customer })
            count += 1
        }
        if (data.Period !== undefined && data.Period !== null) {
            if (count > 0) { query += ',' }
            query += `Period = @Period`
            parameters.push({ name: 'Period', sqltype: sql.NVarChar, value: data.Period })
            count += 1
        }
        if (data.PrepaymentBalance !== undefined && data.PrepaymentBalance !== null) {
            if (count > 0) { query += ',' }
            query += `PrepaymentBalance = @PrepaymentBalance`
            parameters.push({ name: 'PrepaymentBalance', sqltype: sql.Float, value: data.PrepaymentBalance })
            count += 1
        }
        if (data.RetainedBalance !== undefined && data.RetainedBalance !== null) {
            if (count > 0) { query += ',' }
            query += `RetainedBalance = @RetainedBalance`
            parameters.push({ name: 'RetainedBalance', sqltype: sql.Float, value: data.RetainedBalance })
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
        if (data.ModifiedDate !== undefined && data.ModifiedDate !== null) {
            if (count > 0) { query += ',' }
            query += `ModifiedDate = @ModifiedDate`
            parameters.push({ name: 'ModifiedDate', sqltype: sql.NVarChar, value: data.ModifiedDate })
            count += 1
        }
        if (data.Amount !== undefined && data.Amount !== null) {
            if (count > 0) { query += ',' }
            query += `Amount = @Amount`
            parameters.push({ name: 'Amount', sqltype: sql.Float, value: data.Amount })
            count += 1
        }

        if (data.Balance !== undefined && data.Balance !== null) {
            if (count > 0) { query += ',' }
            query += `Balance = @Balance`
            parameters.push({ name: 'Balance', sqltype: sql.Float, value: data.Balance })
            count += 1
        }

        if (data.BillingPrinted !== undefined && data.BillingPrinted !== null) {
            if (count > 0) { query += ',' }
            query += `BillingPrinted = @BillingPrinted`
            parameters.push({ name: 'BillingPrinted', sqltype: sql.Bit, value: data.BillingPrinted })
            count += 1
        }

        if (data.CreatedDateTime !== undefined && data.CreatedDateTime !== null) {
            if (count > 0) { query += ',' }
            query += `CreatedDateTime = @CreatedDateTime`
            parameters.push({ name: 'CreatedDateTime', sqltype: sql.NVarChar, value: data.CreatedDateTime })
            count += 1
        }

        if (data.Currency !== undefined && data.Currency !== null) {
            if (count > 0) { query += ',' }
            query += `Currency = @Currency`
            parameters.push({ name: 'Currency', sqltype: sql.NVarChar, value: data.Currency })
            count += 1
        }

        if (data.CustomerOrder !== undefined && data.CustomerOrder !== null) {
            if (count > 0) { query += ',' }
            query += `CustomerOrder = @CustomerOrder`
            parameters.push({ name: 'CustomerOrder', sqltype: sql.NVarChar, value: data.CustomerOrder })
            count += 1
        }

        if (data.Date !== undefined && data.Date !== null) {
            if (count > 0) { query += ',' }
            query += `Date = @Date`
            parameters.push({ name: 'Date', sqltype: sql.NVarChar, value: data.Date })
            count += 1
        }

        if (data.Description !== undefined && data.Description !== null) {
            if (count > 0) { query += ',' }
            query += `Description = @Description`
            parameters.push({ name: 'Description', sqltype: sql.NVarChar, value: data.Description })
            count += 1
        }

        if (data.DueDate !== undefined && data.DueDate !== null) {
            if (count > 0) { query += ',' }
            query += `DueDate = @DueDate`
            parameters.push({ name: 'DueDate', sqltype: sql.NVarChar, value: data.DueDate })
            count += 1
        }

        if (data.Hold !== undefined && data.Hold !== null) {
            if (count > 0) { query += ',' }
            query += `Hold = @Hold`
            parameters.push({ name: 'Hold', sqltype: sql.Bit, value: data.Hold })
            count += 1
        }

        if (data.LastModifiedDateTime !== undefined && data.LastModifiedDateTime !== null) {
            if (count > 0) { query += ',' }
            query += `LastModifiedDateTime = @LastModifiedDateTime`
            parameters.push({ name: 'LastModifiedDateTime', sqltype: sql.NVarChar, value: data.LastModifiedDateTime })
            count += 1
        }

        if (data.LinkARAccount !== undefined && data.LinkARAccount !== null) {
            if (count > 0) { query += ',' }
            query += `LinkARAccount = @LinkARAccount`
            parameters.push({ name: 'LinkARAccount', sqltype: sql.NVarChar, value: data.LinkARAccount })
            count += 1
        }

        if (data.LinkARSubAccount !== undefined && data.LinkARSubAccount !== null) {
            if (count > 0) { query += ',' }
            query += `LinkARSubAccount = @LinkARSubAccount`
            parameters.push({ name: 'LinkARSubAccount', sqltype: sql.NVarChar, value: data.LinkARSubAccount })
            count += 1
        }

        if (data.LinkBranch !== undefined && data.LinkBranch !== null) {
            if (count > 0) { query += ',' }
            query += `LinkBranch = @LinkBranch`
            parameters.push({ name: 'LinkBranch', sqltype: sql.NVarChar, value: data.LinkBranch })
            count += 1
        }

        if (data.OriginalDocument !== undefined && data.OriginalDocument !== null) {
            if (count > 0) { query += ',' }
            query += `OriginalDocument = @OriginalDocument`
            parameters.push({ name: 'OriginalDocument', sqltype: sql.NVarChar, value: data.OriginalDocument })
            count += 1
        }

        if (data.PostPeriod !== undefined && data.PostPeriod !== null) {
            if (count > 0) { query += ',' }
            query += `PostPeriod = @PostPeriod`
            parameters.push({ name: 'PostPeriod', sqltype: sql.NVarChar, value: data.PostPeriod })
            count += 1
        }

        if (data.Project !== undefined && data.Project !== null) {
            if (count > 0) { query += ',' }
            query += `Project = @Project`
            parameters.push({ name: 'Project', sqltype: sql.NVarChar, value: data.Project })
            count += 1
        }

        if (data.ReferenceNbr !== undefined && data.ReferenceNbr !== null) {
            if (count > 0) { query += ',' }
            query += `ReferenceNbr = @ReferenceNbr`
            parameters.push({ name: 'ReferenceNbr', sqltype: sql.NVarChar, value: data.ReferenceNbr })
            count += 1
        }

        if (data.Status !== undefined && data.Status !== null) {
            if (count > 0) { query += ',' }
            query += `Status = @Status`
            parameters.push({ name: 'Status', sqltype: sql.NVarChar, value: data.Status })
            count += 1
        }

        if (data.TaxTotal !== undefined && data.TaxTotal !== null) {
            if (count > 0) { query += ',' }
            query += `TaxTotal = @TaxTotal`
            parameters.push({ name: 'TaxTotal', sqltype: sql.Float, value: data.TaxTotal })
            count += 1
        }

        if (data.Terms !== undefined && data.Terms !== null) {
            if (count > 0) { query += ',' }
            query += `Terms = @Terms`
            parameters.push({ name: 'Terms', sqltype: sql.NVarChar, value: data.Terms })
            count += 1
        }

        if (data.Type !== undefined && data.Type !== null) {
            if (count > 0) { query += ',' }
            query += `Type = @Type`
            parameters.push({ name: 'Type', sqltype: sql.NVarChar, value: data.Type })
            count += 1
        }
        if (data.Remark !== undefined && data.Remark !== null) {
            if (count > 0) { query += ',' }
            query += `Remark = @Remark`
            parameters.push({ name: 'Remark', sqltype: sql.Text, value: data.Remark })
            count += 1
        }
        if (data.Escis_Remark !== undefined && data.Escis_Remark !== null) {
            if (count > 0) { query += ',' }
            query += `Escis_Remark = @Escis_Remark`
            parameters.push({ name: 'Escis_Remark', sqltype: sql.NVarChar, value: data.Escis_Remark })
            count += 1
        }
        if (data.Flag !== undefined && data.Flag !== null) {
            if (count > 0) { query += ',' }
            query += `Flag = @Flag`
            parameters.push({ name: 'Flag', sqltype: sql.Char, value: data.Flag })
            count += 1
        }
        if (data.resStatus !== undefined && data.resStatus !== null) {
            if (count > 0) { query += ',' }
            query += `resStatus = @resStatus`
            parameters.push({ name: 'resStatus', sqltype: sql.Char, value: data.resStatus })
            count += 1
        }

        query += ` WHERE invoiceNo = @invoiceNo and invoiceType = @invoiceType`
        parameters.push({ name: 'invoiceNo', sqltype: sql.NVarChar, value: data.invoiceNo })
        parameters.push({ name: 'invoiceType', sqltype: sql.NVarChar, value: invoiceType })
        console.log("Selected query", query)
        console.log("Selected query", data)


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
    else {

        console.log('Undefined invoiceNo')
        return false
    }
}

exports.UpdateGRPInvoiceDtl = (data) => {

    if (data.RefId !== undefined && data.RefId !== null) {
        let query = `UPDATE tbl_grp_invoice_res_dtl SET `
        let count = 0
        let parameters = []

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
        if (data.Account !== undefined && data.Account !== null) {
            if (count > 0) { query += ',' }
            query += `Account = @Account`
            parameters.push({ name: 'Account', sqltype: sql.Int, value: data.Account })
            count += 1
        }
        if (data.Amount !== undefined && data.Amount !== null) {
            if (count > 0) { query += ',' }
            query += `Amount = @Amount`
            parameters.push({ name: 'Amount', sqltype: sql.Float, value: data.Amount })
            count += 1
        }
        if (data.DeferralCode !== undefined && data.DeferralCode !== null) {
            if (count > 0) { query += ',' }
            query += `DeferralCode = @DeferralCode`
            parameters.push({ name: 'DeferralCode', sqltype: sql.NVarChar, value: data.DeferralCode })
            count += 1
        }
        if (data.DiscountAmount !== undefined && data.DiscountAmount !== null) {
            if (count > 0) { query += ',' }
            query += `DiscountAmount = @DiscountAmount`
            parameters.push({ name: 'DiscountAmount', sqltype: sql.Float, value: data.DiscountAmount })
            count += 1
        }
        if (data.ExtendedPrice !== undefined && data.ExtendedPrice !== null) {
            if (count > 0) { query += ',' }
            query += `ExtendedPrice = @ExtendedPrice`
            parameters.push({ name: 'ExtendedPrice', sqltype: sql.Float, value: data.ExtendedPrice })
            count += 1
        }
        if (data.InventoryID !== undefined && data.InventoryID !== null) {
            if (count > 0) { query += ',' }
            query += `InventoryID = @InventoryID`
            parameters.push({ name: 'InventoryID', sqltype: sql.NVarChar, value: data.InventoryID })
            count += 1
        }
        if (data.LastModifiedDateTime !== undefined && data.LastModifiedDateTime !== null) {
            if (count > 0) { query += ',' }
            query += `LastModifiedDateTime = @LastModifiedDateTime`
            parameters.push({ name: 'LastModifiedDateTime', sqltype: sql.NVarChar, value: data.LastModifiedDateTime })
            count += 1
        }
        if (data.custom !== undefined && data.custom !== null) {
            if (count > 0) { query += ',' }
            query += `custom = @custom`
            parameters.push({ name: 'custom', sqltype: sql.NVarChar, value: data.custom })
            count += 1
        }
        if (data.LineNbr !== undefined && data.LineNbr !== null) {
            if (count > 0) { query += ',' }
            query += `LineNbr = @LineNbr`
            parameters.push({ name: 'LineNbr', sqltype: sql.Int, value: data.LineNbr })
            count += 1
        }
        if (data.ProjectTask !== undefined && data.ProjectTask !== null) {
            if (count > 0) { query += ',' }
            query += `ProjectTask = @ProjectTask`
            parameters.push({ name: 'ProjectTask', sqltype: sql.NVarChar, value: data.ProjectTask })
            count += 1
        }
        if (data.Qty !== undefined && data.Qty !== null) {
            if (count > 0) { query += ',' }
            query += `Qty = @Qty`
            parameters.push({ name: 'Qty', sqltype: sql.Int, value: data.Qty })
            count += 1
        }
        if (data.Subaccount !== undefined && data.Subaccount !== null) {
            if (count > 0) { query += ',' }
            query += `Subaccount = @Subaccount`
            parameters.push({ name: 'Subaccount', sqltype: sql.NVarChar, value: data.Subaccount })
            count += 1
        }

        if (data.TaxCategory !== undefined && data.TaxCategory !== null) {
            if (count > 0) { query += ',' }
            query += `TaxCategory = @TaxCategory`
            parameters.push({ name: 'TaxCategory', sqltype: sql.NVarChar, value: data.TaxCategory })
            count += 1
        }

        if (data.TermEndDate !== undefined && data.TermEndDate !== null) {
            if (count > 0) { query += ',' }
            query += `TermEndDate = @TermEndDate`
            parameters.push({ name: 'TermEndDate', sqltype: sql.NVarChar, value: data.TermEndDate })
            count += 1
        }

        if (data.TermStartDate !== undefined && data.TermStartDate !== null) {
            if (count > 0) { query += ',' }
            query += `TermStartDate = @TermStartDate`
            parameters.push({ name: 'TermStartDate', sqltype: sql.NVarChar, value: data.TermStartDate })
            count += 1
        }

        if (data.TransactionDescription !== undefined && data.TransactionDescription !== null) {
            if (count > 0) { query += ',' }
            query += `TransactionDescription = @TransactionDescription`
            parameters.push({ name: 'TransactionDescription', sqltype: sql.NVarChar, value: data.TransactionDescription })
            count += 1
        }

        if (data.UnitPrice !== undefined && data.UnitPrice !== null) {
            if (count > 0) { query += ',' }
            query += `UnitPrice = @UnitPrice`
            parameters.push({ name: 'UnitPrice', sqltype: sql.Float, value: data.UnitPrice })
            count += 1
        }

        if (data.UOM !== undefined && data.UOM !== null) {
            if (count > 0) { query += ',' }
            query += `UOM = @UOM`
            parameters.push({ name: 'UOM', sqltype: sql.NVarChar, value: data.UOM })
            count += 1
        }


        if (data.Branch !== undefined && data.Branch !== null) {
            if (count > 0) { query += ',' }
            query += `Branch = @Branch`
            parameters.push({ name: 'Branch', sqltype: sql.NVarChar, value: data.Branch })
            count += 1
        }

        query += ` WHERE RefId = @RefId`
        parameters.push({ name: 'RefId', sqltype: sql.BigInt, value: data.RefId })

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
    } else {

        console.log('Undefined invoiceNo')
        return false
    }
}

// exports.UpdateCRMInvoice = (InvoiceNo) => {

//     if (InvoiceNo !== undefined && InvoiceNo !== null) {
//         let query = `UPDATE tbl_invoicetocancel SET Status='Closed'`
//         let count = 0
//         let parameters = []

//         query += ` WHERE invoiceNo = @InvoiceNo`
//         parameters.push({ name: 'InvoiceNo', sqltype: sql.BigInt, value: InvoiceNo })

//         if (count > 0) {
//             return new Promise((resolve, reject) => {
//                 mainDb.executeQuery(query, null, parameters, (error, data) => {
//                     if (error) {
//                         return reject(`${error}, ${query}`);
//                     }
//                     return resolve(true);
//                 });
//             })
//         }
//     }
//     return false
// }


exports.UpdateCRMInvoice = (InvoiceNo) => {
    let parameters = [
        { name: 'InvoiceNo', sqltype: sql.NVarChar, value: InvoiceNo },
    ]

    let query = `UPDATE tbl_invoicetocancel
  SET Status = 'NEW' where InvoiceNo=@InvoiceNo
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


exports.UpdateGRPInvoiceByRecId = (data) => {

    if (data.RecId !== undefined && data.RecId !== null) {
        let query = `UPDATE tbl_grp_invoice_res SET `
        let count = 0
        let parameters = []

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
    } else {

        console.log('Undefined invoiceNo')
        return false
    }
}

exports.InsertGRPInvoice_trans = (data, invoiceType) => {
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
    // if (data.BalancebyDocuments !== undefined) {
    //     parameters.push({ name: 'BalancebyDocuments', sqltype: sql.Float, value: data.BalancebyDocuments })
    //     column = column == "" ? column += "BalancebyDocuments" : column += ",BalancebyDocuments"
    //     values = values == "" ? values += `@BalancebyDocuments` : values += `,@BalancebyDocuments`
    //     count += 1
    // }
    // if (data.BalanceDiscrepancy !== undefined) {
    //     parameters.push({ name: 'BalanceDiscrepancy', sqltype: sql.Float, value: data.BalanceDiscrepancy })
    //     column = column == "" ? column += "BalanceDiscrepancy" : column += ",BalanceDiscrepancy"
    //     values = values == "" ? values += `@BalanceDiscrepancy` : values += `,@BalanceDiscrepancy`
    //     count += 1
    // }
    // if (data.CompanyBranch !== undefined) {
    //     parameters.push({ name: 'CompanyBranch', sqltype: sql.NVarChar, value: data.CompanyBranch })
    //     column = column == "" ? column += "CompanyBranch" : column += ",CompanyBranch"
    //     values = values == "" ? values += `@CompanyBranch` : values += `,@CompanyBranch`
    //     count += 1
    // }
    // if (data.CurrentBalance !== undefined) {
    //     parameters.push({ name: 'CurrentBalance', sqltype: sql.Float, value: data.CurrentBalance })
    //     column = column == "" ? column += "CurrentBalance" : column += ",CurrentBalance"
    //     values = values == "" ? values += `@CurrentBalance` : values += `,@CurrentBalance`
    //     count += 1
    // }
    if (data.Customer !== undefined) {
        parameters.push({ name: 'Customer', sqltype: sql.NVarChar, value: data.Customer })
        column = column == "" ? column += "Customer" : column += ",Customer"
        values = values == "" ? values += `@Customer` : values += `,@Customer`
        count += 1
    }
    // if (data.Period !== undefined) {
    //     parameters.push({ name: 'Period', sqltype: sql.NVarChar, value: data.Period })
    //     column = column == "" ? column += "Period" : column += ",Period"
    //     values = values == "" ? values += `@Period` : values += `,@Period`
    //     count += 1
    // }

    parameters.push({ name: 'CreatedDate', sqltype: sql.NVarChar, value: moment().format('YYYY-MM-DD HH:mm:ss') })
    column = column == "" ? column += "CreatedDate" : column += ",CreatedDate"
    values = values == "" ? values += `@CreatedDate` : values += `,@CreatedDate`
    count += 1


    parameters.push({ name: 'ModifiedDate', sqltype: sql.NVarChar, value: moment().format('YYYY-MM-DD HH:mm:ss') })
    column = column == "" ? column += "ModifiedDate" : column += ",ModifiedDate"
    values = values == "" ? values += `@ModifiedDate` : values += `,@ModifiedDate`
    count += 1


    if (data.Amount !== undefined) {
        parameters.push({ name: 'Amount', sqltype: sql.Float, value: data.Amount })
        column = column == "" ? column += "Amount" : column += ",Amount"
        values = values == "" ? values += `@Amount` : values += `,@Amount`
        count += 1
    }
    if (data.Balance !== undefined) {
        parameters.push({ name: 'Balance', sqltype: sql.Float, value: data.Balance })
        column = column == "" ? column += "Balance" : column += ",Balance"
        values = values == "" ? values += `@Balance` : values += `,@Balance`
        count += 1
    }
    // if (data.BillingPrinted !== undefined) {
    //     parameters.push({ name: 'BillingPrinted', sqltype: sql.Bit, value: data.BillingPrinted })
    //     column = column == "" ? column += "BillingPrinted" : column += ",BillingPrinted"
    //     values = values == "" ? values += `@BillingPrinted` : values += `,@BillingPrinted`
    //     count += 1
    // }
    // if (data.CreatedDateTime !== undefined) {
    //     parameters.push({ name: 'CreatedDateTime', sqltype: sql.NVarChar, value: data.CreatedDateTime })
    //     column = column == "" ? column += "CreatedDateTime" : column += ",CreatedDateTime"
    //     values = values == "" ? values += `@CreatedDateTime` : values += `,@CreatedDateTime`
    //     count += 1
    // }
    if (data.Currency !== undefined) {
        parameters.push({ name: 'Currency', sqltype: sql.NVarChar, value: data.Currency })
        column = column == "" ? column += "Currency" : column += ",Currency"
        values = values == "" ? values += `@Currency` : values += `,@Currency`
        count += 1
    }
    if (data.CustomerOrder !== undefined) {
        parameters.push({ name: 'CustomerOrder', sqltype: sql.NVarChar, value: data.CustomerOrder })
        column = column == "" ? column += "CustomerOrder" : column += ",CustomerOrder"
        values = values == "" ? values += `@CustomerOrder` : values += `,@CustomerOrder`
        count += 1
    }
    // if (data.Date !== undefined) {
    //     parameters.push({ name: 'Date', sqltype: sql.NVarChar, value: data.Date })
    //     column = column == "" ? column += "Date" : column += ",Date"
    //     values = values == "" ? values += `@Date` : values += `,@Date`
    //     count += 1
    // }
    // if (data.DueDate !== undefined) {
    //     parameters.push({ name: 'DueDate', sqltype: sql.NVarChar, value: data.DueDate })
    //     column = column == "" ? column += "DueDate" : column += ",DueDate"
    //     values = values == "" ? values += `@DueDate` : values += `,@DueDate`
    //     count += 1
    // }
    if (data.Description !== undefined) {
        parameters.push({ name: 'Description', sqltype: sql.NVarChar, value: data.Description })
        column = column == "" ? column += "Description" : column += ",Description"
        values = values == "" ? values += `@Description` : values += `,@Description`
        count += 1
    }
    // if (data.Hold !== undefined) {
    //     parameters.push({ name: 'Hold', sqltype: sql.Bit, value: data.Hold })
    //     column = column == "" ? column += "Hold" : column += ",Hold"
    //     values = values == "" ? values += `@Hold` : values += `,@Hold`
    //     count += 1
    // }
    // if (data.LastModifiedDateTime !== undefined) {
    //     parameters.push({ name: 'LastModifiedDateTime', sqltype: sql.NVarChar, value: data.LastModifiedDateTime })
    //     column = column == "" ? column += "LastModifiedDateTime" : column += ",LastModifiedDateTime"
    //     values = values == "" ? values += `@LastModifiedDateTime` : values += `,@LastModifiedDateTime`
    //     count += 1
    // }
    if (data.LinkARAccount !== undefined) {
        parameters.push({ name: 'LinkARAccount', sqltype: sql.NVarChar, value: data.LinkARAccount })
        column = column == "" ? column += "LinkARAccount" : column += ",LinkARAccount"
        values = values == "" ? values += `@LinkARAccount` : values += `,@LinkARAccount`
        count += 1
    }
    if (data.LinkARSubAccount !== undefined) {
        parameters.push({ name: 'LinkARSubAccount', sqltype: sql.NVarChar, value: data.LinkARSubAccount })
        column = column == "" ? column += "LinkARSubAccount" : column += ",LinkARSubAccount"
        values = values == "" ? values += `@LinkARSubAccount` : values += `,@LinkARSubAccount`
        count += 1
    }
    if (data.LinkBranch !== undefined) {
        parameters.push({ name: 'LinkBranch', sqltype: sql.NVarChar, value: data.LinkBranch })
        column = column == "" ? column += "LinkBranch" : column += ",LinkBranch"
        values = values == "" ? values += `@LinkBranch` : values += `,@LinkBranch`
        count += 1
    }
    // if (data.OriginalDocument !== undefined) {
    //     parameters.push({ name: 'OriginalDocument', sqltype: sql.NVarChar, value: data.OriginalDocument })
    //     column = column == "" ? column += "OriginalDocument" : column += ",OriginalDocument"
    //     values = values == "" ? values += `@OriginalDocument` : values += `,@OriginalDocument`
    //     count += 1
    // }
    // if (data.PostPeriod !== undefined) {
    //     parameters.push({ name: 'PostPeriod', sqltype: sql.NVarChar, value: data.PostPeriod })
    //     column = column == "" ? column += "PostPeriod" : column += ",PostPeriod"
    //     values = values == "" ? values += `@PostPeriod` : values += `,@PostPeriod`
    //     count += 1
    // }
    // if (data.Project !== undefined) {
    //     parameters.push({ name: 'Project', sqltype: sql.NVarChar, value: data.Project })
    //     column = column == "" ? column += "Project" : column += ",Project"
    //     values = values == "" ? values += `@Project` : values += `,@Project`
    //     count += 1
    // }
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
    if (data.TaxTotal !== undefined) {
        parameters.push({ name: 'TaxTotal', sqltype: sql.Float, value: data.TaxTotal })
        column = column == "" ? column += "TaxTotal" : column += ",TaxTotal"
        values = values == "" ? values += `@TaxTotal` : values += `,@TaxTotal`
        count += 1
    }
    if (data.Terms !== undefined) {
        parameters.push({ name: 'Terms', sqltype: sql.NVarChar, value: data.Terms })
        column = column == "" ? column += "Terms" : column += ",Terms"
        values = values == "" ? values += `@Terms` : values += `,@Terms`
        count += 1
    }
    if (data.Type !== undefined) {
        parameters.push({ name: 'Type', sqltype: sql.NVarChar, value: data.Type })
        column = column == "" ? column += "Type" : column += ",Type"
        values = values == "" ? values += `@Type` : values += `,@Type`
        count += 1
    }
    //
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
    if (data.Remark !== undefined) {
        parameters.push({ name: 'Remark', sqltype: sql.Text, value: data.Remark })
        column = column == "" ? column += "Remark" : column += ",Remark"
        values = values == "" ? values += `@Remark` : values += `,@Remark`
        count += 1
    }

    let query = `INSERT INTO tbl_grp_invoice_res_trans (${column}) VALUES (${values});`

    if (count > 0) {
        query += `SELECT SCOPE_IDENTITY() as RecId`
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