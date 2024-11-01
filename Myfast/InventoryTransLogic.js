const sql = require('mssql')
const mainDb = require('../MainDb');

exports.InsertInventoryTrans = (data) => {
    let column = ""
    let values = ""
    let count = 0
    let parameters = []

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
    if (data.BaseUnit !== undefined) {
        parameters.push({ name: 'BaseUnit', sqltype: sql.NVarChar, value: data.BaseUnit })
        column = column == "" ? column += "BaseUnit" : column += ",BaseUnit"
        values = values == "" ? values += `@BaseUnit` : values += `,@BaseUnit`
        count += 1
    }
    if (data.CurrentCost !== undefined) {
        parameters.push({ name: 'CurrentCost', sqltype: sql.Decimal(10,6), value: data.CurrentCost })
        column = column == "" ? column += "CurrentCost" : column += ",CurrentCost"
        values = values == "" ? values += `@CurrentCost` : values += `,@CurrentCost`
        count += 1
    }
    if (data.DefaultPrice !== undefined) {
        parameters.push({ name: 'DefaultPrice', sqltype: sql.Decimal(10,6), value: data.DefaultPrice })
        column = column == "" ? column += "DefaultPrice" : column += ",DefaultPrice"
        values = values == "" ? values += `@DefaultPrice` : values += `,@DefaultPrice`
        count += 1
    }
    if (data.DeferralAccount !== undefined) {
        parameters.push({ name: 'DeferralAccount', sqltype: sql.NVarChar, value: data.DeferralAccount })
        column = column == "" ? column += "DeferralAccount" : column += ",DeferralAccount"
        values = values == "" ? values += `@DeferralAccount` : values += `,@DeferralAccount`
        count += 1
    }
    if (data.DeferralSubaccount !== undefined) {
        parameters.push({ name: 'DeferralSubaccount', sqltype: sql.NVarChar, value: data.DeferralSubaccount })
        column = column == "" ? column += "DeferralSubaccount" : column += ",DeferralSubaccount"
        values = values == "" ? values += `@DeferralSubaccount` : values += `,@DeferralSubaccount`
        count += 1
    }
    if (data.Description !== undefined) {
        parameters.push({ name: 'Description', sqltype: sql.NVarChar, value: data.Description })
        column = column == "" ? column += "Description" : column += ",Description"
        values = values == "" ? values += `@Description` : values += `,@Description`
        count += 1
    }
    if (data.EffectiveDate !== undefined) {
        parameters.push({ name: 'EffectiveDate', sqltype: sql.NVarChar, value: data.EffectiveDate })
        column = column == "" ? column += "EffectiveDate" : column += ",EffectiveDate"
        values = values == "" ? values += `@EffectiveDate` : values += `,@EffectiveDate`
        count += 1
    }
    if (data.ExpenseAccount !== undefined) {
        parameters.push({ name: 'ExpenseAccount', sqltype: sql.NVarChar, value: data.ExpenseAccount })
        column = column == "" ? column += "ExpenseAccount" : column += ",ExpenseAccount"
        values = values == "" ? values += `@ExpenseAccount` : values += `,@ExpenseAccount`
        count += 1
    }
    if (data.ExpenseAccrualAccount !== undefined) {
        parameters.push({ name: 'ExpenseAccrualAccount', sqltype: sql.NVarChar, value: data.ExpenseAccrualAccount })
        column = column == "" ? column += "ExpenseAccrualAccount" : column += ",ExpenseAccrualAccount"
        values = values == "" ? values += `@ExpenseAccrualAccount` : values += `,@ExpenseAccrualAccount`
        count += 1
    }
    if (data.ExpenseAccrualSubaccount !== undefined) {
        parameters.push({ name: 'ExpenseAccrualSubaccount', sqltype: sql.NVarChar, value: data.ExpenseAccrualSubaccount })
        column = column == "" ? column += "ExpenseAccrualSubaccount" : column += ",ExpenseAccrualSubaccount"
        values = values == "" ? values += `@ExpenseAccrualSubaccount` : values += `,@ExpenseAccrualSubaccount`
        count += 1
    }
    if (data.ExpenseSubaccount !== undefined) {
        parameters.push({ name: 'ExpenseSubaccount', sqltype: sql.NVarChar, value: data.ExpenseSubaccount })
        column = column == "" ? column += "ExpenseSubaccount" : column += ",ExpenseSubaccount"
        values = values == "" ? values += `@ExpenseSubaccount` : values += `,@ExpenseSubaccount`
        count += 1
    }
    if (data.InventoryID !== undefined) {
        parameters.push({ name: 'InventoryID', sqltype: sql.NVarChar, value: data.InventoryID })
        column = column == "" ? column += "InventoryID" : column += ",InventoryID"
        values = values == "" ? values += `@InventoryID` : values += `,@InventoryID`
        count += 1
    }
    if (data.ItemClass !== undefined) {
        parameters.push({ name: 'ItemClass', sqltype: sql.NVarChar, value: data.ItemClass })
        column = column == "" ? column += "ItemClass" : column += ",ItemClass"
        values = values == "" ? values += `@ItemClass` : values += `,@ItemClass`
        count += 1
    }
    if (data.ItemStatus !== undefined) {
        parameters.push({ name: 'ItemStatus', sqltype: sql.NVarChar, value: data.ItemStatus })
        column = column == "" ? column += "ItemStatus" : column += ",ItemStatus"
        values = values == "" ? values += `@ItemStatus` : values += `,@ItemStatus`
        count += 1
    }
    if (data.ItemType !== undefined) {
        parameters.push({ name: 'ItemType', sqltype: sql.NVarChar, value: data.ItemType })
        column = column == "" ? column += "ItemType" : column += ",ItemType"
        values = values == "" ? values += `@ItemType` : values += `,@ItemType`
        count += 1
    }
    if (data.LastCost !== undefined) {
        parameters.push({ name: 'LastCost', sqltype: sql.Decimal(10,6), value: data.LastCost })
        column = column == "" ? column += "LastCost" : column += ",LastCost"
        values = values == "" ? values += `@LastCost` : values += `,@LastCost`
        count += 1
    }
    if (data.LastModifiedDateTime !== undefined) {
        parameters.push({ name: 'LastModifiedDateTime', sqltype: sql.NVarChar, value: data.LastModifiedDateTime })
        column = column == "" ? column += "LastModifiedDateTime" : column += ",LastModifiedDateTime"
        values = values == "" ? values += `@LastModifiedDateTime` : values += `,@LastModifiedDateTime`
        count += 1
    }
    if (data.PendingCost !== undefined) {
        parameters.push({ name: 'PendingCost', sqltype: sql.Decimal(10,6), value: data.PendingCost })
        column = column == "" ? column += "PendingCost" : column += ",PendingCost"
        values = values == "" ? values += `@PendingCost` : values += `,@PendingCost`
        count += 1
    }
    if (data.PendingCostDate !== undefined) {
        parameters.push({ name: 'PendingCostDate', sqltype: sql.NVarChar, value: data.PendingCostDate })
        column = column == "" ? column += "PendingCostDate" : column += ",PendingCostDate"
        values = values == "" ? values += `@PendingCostDate` : values += `,@PendingCostDate`
        count += 1
    }
    if (data.POAccrualAccount !== undefined) {
        parameters.push({ name: 'POAccrualAccount', sqltype: sql.NVarChar, value: data.POAccrualAccount })
        column = column == "" ? column += "POAccrualAccount" : column += ",POAccrualAccount"
        values = values == "" ? values += `@POAccrualAccount` : values += `,@POAccrualAccount`
        count += 1
    }  
    if (data.POAccrualSubaccount !== undefined) {
        parameters.push({ name: 'POAccrualSubaccount', sqltype: sql.NVarChar, value: data.POAccrualSubaccount })
        column = column == "" ? column += "POAccrualSubaccount" : column += ",POAccrualSubaccount"
        values = values == "" ? values += `@POAccrualSubaccount` : values += `,@POAccrualSubaccount`
        count += 1
    }  
    if (data.PostingClass !== undefined) {
        parameters.push({ name: 'PostingClass', sqltype: sql.NVarChar, value: data.PostingClass })
        column = column == "" ? column += "PostingClass" : column += ",PostingClass"
        values = values == "" ? values += `@PostingClass` : values += `,@PostingClass`
        count += 1
    }  
    if (data.PriceClass !== undefined) {
        parameters.push({ name: 'PriceClass', sqltype: sql.NVarChar, value: data.PriceClass })
        column = column == "" ? column += "PriceClass" : column += ",PriceClass"
        values = values == "" ? values += `@PriceClass` : values += `,@PriceClass`
        count += 1
    }  
    if (data.PurchasePriceVarianceAccount !== undefined) {
        parameters.push({ name: 'PurchasePriceVarianceAccount', sqltype: sql.NVarChar, value: data.PurchasePriceVarianceAccount })
        column = column == "" ? column += "PurchasePriceVarianceAccount" : column += ",PurchasePriceVarianceAccount"
        values = values == "" ? values += `@PurchasePriceVarianceAccount` : values += `,@PurchasePriceVarianceAccount`
        count += 1
    }  
    if (data.PurchasePriceVarianceSubaccount !== undefined) {
        parameters.push({ name: 'PurchasePriceVarianceSubaccount', sqltype: sql.NVarChar, value: data.PurchasePriceVarianceSubaccount })
        column = column == "" ? column += "PurchasePriceVarianceSubaccount" : column += ",PurchasePriceVarianceSubaccount"
        values = values == "" ? values += `@PurchasePriceVarianceSubaccount` : values += `,@PurchasePriceVarianceSubaccount`
        count += 1
    }  
    if (data.ReasonCodeSubaccount !== undefined) {
        parameters.push({ name: 'ReasonCodeSubaccount', sqltype: sql.NVarChar, value: data.ReasonCodeSubaccount })
        column = column == "" ? column += "ReasonCodeSubaccount" : column += ",ReasonCodeSubaccount"
        values = values == "" ? values += `@ReasonCodeSubaccount` : values += `,@ReasonCodeSubaccount`
        count += 1
    }    
    if (data.RequireReceipt !== undefined) {
        parameters.push({ name: 'RequireReceipt', sqltype: sql.Bit, value: data.RequireReceipt })
        column = column == "" ? column += "RequireReceipt" : column += ",RequireReceipt"
        values = values == "" ? values += `@RequireReceipt` : values += `,@RequireReceipt`
        count += 1
    }    
    if (data.RequireShipment !== undefined) {
        parameters.push({ name: 'RequireShipment', sqltype: sql.Bit, value: data.RequireShipment })
        column = column == "" ? column += "RequireShipment" : column += ",RequireShipment"
        values = values == "" ? values += `@RequireShipment` : values += `,@RequireShipment`
        count += 1
    }
    if (data.SalesAccount !== undefined) {
        parameters.push({ name: 'SalesAccount', sqltype: sql.NVarChar, value: data.SalesAccount })
        column = column == "" ? column += "SalesAccount" : column += ",SalesAccount"
        values = values == "" ? values += `@SalesAccount` : values += `,@SalesAccount`
        count += 1
    } 
    if (data.SalesSubaccount !== undefined) {
        parameters.push({ name: 'SalesSubaccount', sqltype: sql.NVarChar, value: data.SalesSubaccount })
        column = column == "" ? column += "SalesSubaccount" : column += ",SalesSubaccount"
        values = values == "" ? values += `@SalesSubaccount` : values += `,@SalesSubaccount`
        count += 1
    } 
    if (data.TaxCategory !== undefined) {
        parameters.push({ name: 'TaxCategory', sqltype: sql.NVarChar, value: data.TaxCategory })
        column = column == "" ? column += "TaxCategory" : column += ",TaxCategory"
        values = values == "" ? values += `@TaxCategory` : values += `,@TaxCategory`
        count += 1
    } 
    if (data.Volume !== undefined) {
        parameters.push({ name: 'Volume', sqltype: sql.Decimal(10,6), value: data.Volume })
        column = column == "" ? column += "Volume" : column += ",Volume"
        values = values == "" ? values += `@Volume` : values += `,@Volume`
        count += 1
    }
    if (data.VolumeUOM !== undefined) {
        parameters.push({ name: 'VolumeUOM', sqltype: sql.NVarChar, value: data.VolumeUOM })
        column = column == "" ? column += "VolumeUOM" : column += ",VolumeUOM"
        values = values == "" ? values += `@VolumeUOM` : values += `,@VolumeUOM`
        count += 1
    }
    if (data.Weight !== undefined) {
        parameters.push({ name: 'Weight', sqltype: sql.Decimal(10,6), value: data.Weight })
        column = column == "" ? column += "Weight" : column += ",Weight"
        values = values == "" ? values += `@Weight` : values += `,@Weight`
        count += 1
    }
    if (data.WeightUOM !== undefined) {
        parameters.push({ name: 'WeightUOM', sqltype: sql.NVarChar, value: data.WeightUOM })
        column = column == "" ? column += "WeightUOM" : column += ",WeightUOM"
        values = values == "" ? values += `@WeightUOM` : values += `,@WeightUOM`
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

    let query = `INSERT INTO tbl_grp_trans_inventory (${column}) VALUES (${values});`

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
