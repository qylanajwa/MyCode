const sql = require('mssql')
const mainDb = require('../MainDb');

exports.InsertRequisitionTrans = (data) => {
    let column = ""
    let values = ""
    let count = 0
    let parameters = []

    if (data.DocNo !== undefined) {
        parameters.push({ name: 'DocNo', sqltype: sql.NVarChar, value: data.DocNo })
        column = column == "" ? column += "DocNo" : column += ",DocNo"
        values = values == "" ? values += `@DocNo` : values += `,@DocNo`
        count += 1
    }
    if (data.RequestDate !== undefined) {
        parameters.push({ name: 'RequestDate', sqltype: sql.NVarChar, value: data.RequestDate })
        column = column == "" ? column += "RequestDate" : column += ",RequestDate"
        values = values == "" ? values += `@RequestDate` : values += `,@RequestDate`
        count += 1
    }
    if (data.GRPID !== undefined) {
        parameters.push({ name: 'GRPID', sqltype: sql.NVarChar, value: data.GRPID })
        column = column == "" ? column += "GRPID" : column += ",GRPID"
        values = values == "" ? values += `@GRPID` : values += `,@GRPID`
        count += 1
    }
    if (data.rowNumber !== undefined) {
        parameters.push({ name: 'rowNumber', sqltype: sql.Int, value: data.rowNumber })
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
    if (data.Approved !== undefined) {
        parameters.push({ name: 'Approved', sqltype: sql.Bit, value: data.Approved })
        column = column == "" ? column += "Approved" : column += ",Approved"
        values = values == "" ? values += `@Approved` : values += `,@Approved`
        count += 1
    }
    if (data.Creator !== undefined) {
        parameters.push({ name: 'Creator', sqltype: sql.NVarChar, value: data.Creator })
        column = column == "" ? column += "Creator" : column += ",Creator"
        values = values == "" ? values += `@Creator` : values += `,@Creator`
        count += 1
    }
    if (data.Currency !== undefined) {
        parameters.push({ name: 'Currency', sqltype: sql.NVarChar, value: data.Currency })
        column = column == "" ? column += "Currency" : column += ",Currency"
        values = values == "" ? values += `@Currency` : values += `,@Currency`
        count += 1
    }
    if (data.CuryViewState !== undefined) {
        parameters.push({ name: 'CuryViewState', sqltype: sql.Bit, value: data.CuryViewState })
        column = column == "" ? column += "CuryViewState" : column += ",CuryViewState"
        values = values == "" ? values += `@CuryViewState` : values += `,@CuryViewState`
        count += 1
    }
    if (data.Customer !== undefined) {
        parameters.push({ name: 'Customer', sqltype: sql.NVarChar, value: data.Customer })
        column = column == "" ? column += "Customer" : column += ",Customer"
        values = values == "" ? values += `@Customer` : values += `,@Customer`
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
    if (data.EstExtCost !== undefined) {
        parameters.push({ name: 'EstExtCost', sqltype: sql.Decimal(10,2), value: data.EstExtCost })
        column = column == "" ? column += "EstExtCost" : column += ",EstExtCost"
        values = values == "" ? values += `@EstExtCost` : values += `,@EstExtCost`
        count += 1
    }
    if (data.Hold !== undefined) {
        parameters.push({ name: 'Hold', sqltype: sql.Bit, value: data.Hold })
        column = column == "" ? column += "Hold" : column += ",Hold"
        values = values == "" ? values += `@Hold` : values += `,@Hold`
        count += 1
    }
    if (data.Priority !== undefined) {
        parameters.push({ name: 'Priority', sqltype: sql.NVarChar, value: data.Priority })
        column = column == "" ? column += "Priority" : column += ",Priority"
        values = values == "" ? values += `@Priority` : values += `,@Priority`
        count += 1
    }
    if (data.Quoted !== undefined) {
        parameters.push({ name: 'Quoted', sqltype: sql.Bit, value: data.Quoted })
        column = column == "" ? column += "Quoted" : column += ",Quoted"
        values = values == "" ? values += `@Quoted` : values += `,@Quoted`
        count += 1
    }
    if (data.RefNbr !== undefined) {
        parameters.push({ name: 'RefNbr', sqltype: sql.NVarChar, value: data.RefNbr })
        column = column == "" ? column += "RefNbr" : column += ",RefNbr"
        values = values == "" ? values += `@RefNbr` : values += `,@RefNbr`
        count += 1
    }
    if (data.Status !== undefined) {
        parameters.push({ name: 'Status', sqltype: sql.NVarChar, value: data.Status })
        column = column == "" ? column += "Status" : column += ",Status"
        values = values == "" ? values += `@Status` : values += `,@Status`
        count += 1
    }    
    if (data.RequestJSON !== undefined) {
        parameters.push({ name: 'RequestJSON', sqltype: sql.Text, value: data.RequestJSON })
        column = column == "" ? column += "RequestJSON" : column += ",RequestJSON"
        values = values == "" ? values += `@RequestJSON` : values += `,@RequestJSON`
        count += 1
    }
    if (data.ResponseJSON !== undefined) {
        parameters.push({ name: 'ResponseJSON', sqltype: sql.Text, value: data.ResponseJSON })
        column = column == "" ? column += "ResponseJSON" : column += ",ResponseJSON"
        values = values == "" ? values += `@ResponseJSON` : values += `,@ResponseJSON`
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

    let query = `INSERT INTO tbl_grp_trans_requisition (${column}) VALUES (${values});`

    if (count > 0) {
        query += `SELECT SCOPE_IDENTITY() as RecId`
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

exports.InsertRequisitionDtlTrans = (data) => {
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
    if (data.GRPID !== undefined) {
        parameters.push({ name: 'GRPID', sqltype: sql.NVarChar, value: data.GRPID })
        column = column == "" ? column += "GRPID" : column += ",GRPID"
        values = values == "" ? values += `@GRPID` : values += `,@GRPID`
        count += 1
    }
    if (data.rowNumber !== undefined) {
        parameters.push({ name: 'rowNumber', sqltype: sql.Int, value: data.rowNumber })
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
    if (data.Account !== undefined) {
        parameters.push({ name: 'Account', sqltype: sql.NVarChar, value: data.Account })
        column = column == "" ? column += "Account" : column += ",Account"
        values = values == "" ? values += `@Account` : values += `,@Account`
        count += 1
    }
    if (data.AlternateID !== undefined) {
        parameters.push({ name: 'AlternateID', sqltype: sql.NVarChar, value: data.AlternateID })
        column = column == "" ? column += "AlternateID" : column += ",AlternateID"
        values = values == "" ? values += `@AlternateID` : values += `,@AlternateID`
        count += 1
    }
    if (data.Canceled !== undefined) {
        parameters.push({ name: 'Canceled', sqltype: sql.Bit, value: data.Canceled })
        column = column == "" ? column += "Canceled" : column += ",Canceled"
        values = values == "" ? values += `@Canceled` : values += `,@Canceled`
        count += 1
    }
    if (data.CompleteOn !== undefined) {
        parameters.push({ name: 'CompleteOn', sqltype: sql.Decimal(10,2), value: data.CompleteOn })
        column = column == "" ? column += "CompleteOn" : column += ",CompleteOn"
        values = values == "" ? values += `@CompleteOn` : values += `,@CompleteOn`
        count += 1
    }
    if (data.DescriptionDescription !== undefined) {
        parameters.push({ name: 'DescriptionDescription', sqltype: sql.NVarChar, value: data.DescriptionDescription })
        column = column == "" ? column += "DescriptionDescription" : column += ",DescriptionDescription"
        values = values == "" ? values += `@DescriptionDescription` : values += `,@DescriptionDescription`
        count += 1
    }
    if (data.DescriptionExpenseAcctID_description !== undefined) {
        parameters.push({ name: 'DescriptionExpenseAcctID_description', sqltype: sql.NVarChar, value: data.DescriptionExpenseAcctID_description })
        column = column == "" ? column += "DescriptionExpenseAcctID_description" : column += ",DescriptionExpenseAcctID_description"
        values = values == "" ? values += `@DescriptionExpenseAcctID_description` : values += `,@DescriptionExpenseAcctID_description`
        count += 1
    }
    if (data.DescriptionExpenseSubID_description !== undefined) {
        parameters.push({ name: 'DescriptionExpenseSubID_description', sqltype: sql.NVarChar, value: data.DescriptionExpenseSubID_description })
        column = column == "" ? column += "DescriptionExpenseSubID_description" : column += ",DescriptionExpenseSubID_description"
        values = values == "" ? values += `@DescriptionExpenseSubID_description` : values += `,@DescriptionExpenseSubID_description`
        count += 1
    }
    if (data.EstExtCost !== undefined) {
        parameters.push({ name: 'EstExtCost', sqltype: sql.Decimal(10,2), value: data.EstExtCost })
        column = column == "" ? column += "EstExtCost" : column += ",EstExtCost"
        values = values == "" ? values += `@EstExtCost` : values += `,@EstExtCost`
        count += 1
    }
    if (data.EstUnitCost !== undefined) {
        parameters.push({ name: 'EstUnitCost', sqltype: sql.Decimal(10,2), value: data.EstUnitCost })
        column = column == "" ? column += "EstUnitCost" : column += ",EstUnitCost"
        values = values == "" ? values += `@EstUnitCost` : values += `,@EstUnitCost`
        count += 1
    }
    if (data.InventoryID !== undefined) {
        parameters.push({ name: 'InventoryID', sqltype: sql.NVarChar, value: data.InventoryID })
        column = column == "" ? column += "InventoryID" : column += ",InventoryID"
        values = values == "" ? values += `@InventoryID` : values += `,@InventoryID`
        count += 1
    }
    if (data.LineNbr !== undefined) {
        parameters.push({ name: 'LineNbr', sqltype: sql.Int, value: data.LineNbr })
        column = column == "" ? column += "LineNbr" : column += ",LineNbr"
        values = values == "" ? values += `@LineNbr` : values += `,@LineNbr`
        count += 1
    }
    if (data.LineSource !== undefined) {
        parameters.push({ name: 'LineSource', sqltype: sql.NVarChar, value: data.LineSource })
        column = column == "" ? column += "LineSource" : column += ",LineSource"
        values = values == "" ? values += `@LineSource` : values += `,@LineSource`
        count += 1
    }
    if (data.LineType !== undefined) {
        parameters.push({ name: 'LineType', sqltype: sql.NVarChar, value: data.LineType })
        column = column == "" ? column += "LineType" : column += ",LineType"
        values = values == "" ? values += `@LineType` : values += `,@LineType`
        count += 1
    }
    if (data.ManualCost !== undefined) {
        parameters.push({ name: 'ManualCost', sqltype: sql.Bit, value: data.ManualCost })
        column = column == "" ? column += "ManualCost" : column += ",ManualCost"
        values = values == "" ? values += `@ManualCost` : values += `,@ManualCost`
        count += 1
    }
    if (data.Markup !== undefined) {
        parameters.push({ name: 'Markup', sqltype: sql.Decimal(10,6), value: data.Markup })
        column = column == "" ? column += "Markup" : column += ",Markup"
        values = values == "" ? values += `@Markup` : values += `,@Markup`
        count += 1
    }
    if (data.MaxReceipt !== undefined) {
        parameters.push({ name: 'MaxReceipt', sqltype: sql.Decimal(10,2), value: data.MaxReceipt })
        column = column == "" ? column += "MaxReceipt" : column += ",MaxReceipt"
        values = values == "" ? values += `@MaxReceipt` : values += `,@MaxReceipt`
        count += 1
    }  
    if (data.MinReceipt !== undefined) {
        parameters.push({ name: 'MinReceipt', sqltype: sql.Decimal(10,2), value: data.MinReceipt })
        column = column == "" ? column += "MinReceipt" : column += ",MinReceipt"
        values = values == "" ? values += `@MinReceipt` : values += `,@MinReceipt`
        count += 1
    }  
    if (data.OrderQty !== undefined) {
        parameters.push({ name: 'OrderQty', sqltype: sql.Decimal(10,2), value: data.OrderQty })
        column = column == "" ? column += "OrderQty" : column += ",OrderQty"
        values = values == "" ? values += `@OrderQty` : values += `,@OrderQty`
        count += 1
    }  
    if (data.PromisedDate !== undefined) {
        parameters.push({ name: 'PromisedDate', sqltype: sql.NVarChar, value: data.PromisedDate })
        column = column == "" ? column += "PromisedDate" : column += ",PromisedDate"
        values = values == "" ? values += `@PromisedDate` : values += `,@PromisedDate`
        count += 1
    }   
    if (data.ReceiptAction !== undefined) {
        parameters.push({ name: 'ReceiptAction', sqltype: sql.NVarChar, value: data.ReceiptAction })
        column = column == "" ? column += "ReceiptAction" : column += ",ReceiptAction"
        values = values == "" ? values += `@ReceiptAction` : values += `,@ReceiptAction`
        count += 1
    } 
    if (data.ReqNbr !== undefined) {
        parameters.push({ name: 'ReqNbr', sqltype: sql.NVarChar, value: data.ReqNbr })
        column = column == "" ? column += "ReqNbr" : column += ",ReqNbr"
        values = values == "" ? values += `@ReqNbr` : values += `,@ReqNbr`
        count += 1
    } 
    if (data.RequiredDate !== undefined) {
        parameters.push({ name: 'RequiredDate', sqltype: sql.NVarChar, value: data.RequiredDate })
        column = column == "" ? column += "RequiredDate" : column += ",RequiredDate"
        values = values == "" ? values += `@RequiredDate` : values += `,@RequiredDate`
        count += 1
    } 
    if (data.Sub !== undefined) {
        parameters.push({ name: 'Sub', sqltype: sql.NVarChar, value: data.Sub })
        column = column == "" ? column += "Sub" : column += ",Sub"
        values = values == "" ? values += `@Sub` : values += `,@Sub`
        count += 1
    } 
    if (data.UOM !== undefined) {
        parameters.push({ name: 'UOM', sqltype: sql.NVarChar, value: data.UOM })
        column = column == "" ? column += "UOM" : column += ",UOM"
        values = values == "" ? values += `@UOM` : values += `,@UOM`
        count += 1
    } 
    if (data.UseMarkup !== undefined) {
        parameters.push({ name: 'UseMarkup', sqltype: sql.Bit, value: data.UseMarkup })
        column = column == "" ? column += "UseMarkup" : column += ",UseMarkup"
        values = values == "" ? values += `@UseMarkup` : values += `,@UseMarkup`
        count += 1
    } 
    if (data.Warehouse !== undefined) {
        parameters.push({ name: 'Warehouse', sqltype: sql.NVarChar, value: data.Warehouse })
        column = column == "" ? column += "Warehouse" : column += ",Warehouse"
        values = values == "" ? values += `@Warehouse` : values += `,@Warehouse`
        count += 1
    } 
     

    let query = `INSERT INTO tbl_grp_trans_requisition_dtl (${column}) VALUES (${values});`

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