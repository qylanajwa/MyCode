const TMStransLogic = require('../../repositories/PP2Logic/TransactionLogic')
const axios = require('axios')
const moment = require('moment');
const loggers = require('../../log');
const TMSLogic = require('../../controller/PP2/TMSAPI')
const oauth = require('axios-oauth-client');
const https = require('https');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

//staging
const CLIENT_ID = '64eeb86fef991f08d4805560'
const CLIENT_SECRET = 'nClxXxfUbaj+k/Vl0kpp3r7/LvM2i3bYmTn7gR0FI4A='
const SCOPE = 'eip-admin.tms-pp-2.all'
const TOKEN_URL = 'https://staging-gw-codelab.sirim.my/security/connect/token'
const apiURL = 'https://staging-gw-codelab.sirim.my/eip-admin/tms-pp-2/v1'

let accessToken = '';

exports.apiRoutes = {
    customer: `${apiURL}/customer `,
    pp2: `${apiURL}/pp2`,
    pp2cancel: `${apiURL}/pp2cancel `,
    quotation: `${apiURL}/quotation `,
    filetms: `${apiURL}/filetms`,
    job: `${apiURL}/Job`,
}

exports.getAccessToken = async () => {
    try {
        const getClientCredentials = oauth.client(axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        }), {
            url: TOKEN_URL,
            grant_type: 'client_credentials',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            scope: SCOPE
        })
        let auth = await getClientCredentials();
        auth.StartToken = moment(new Date()).format('YYYY-MM-DD HH:mm:00');
        auth.EndToken = moment(new Date()).add(auth.expires_in, 'seconds').subtract(60, "seconds").format('YYYY-MM-DD HH:mm:00');

        accessToken = auth
        return auth
    }
    catch (error) {
        console.log('getAccessToken error', error.message);
        loggers.logError(loggers.thisLine2() + ': ' + `${'getAccessToken error' + error}`)

        return ''
    }
}


exports.getCust = async (url, params, insert = true, rec_id = 0, ref_id = 0) => {
    let Request_json = {}
    try {
        let response;

        if (accessToken == '') {
            await this.getAccessToken()
        }
        else if (moment(new Date()).format('YYYY-MM-DD HH:mm:00') >= accessToken.EndToken) {  // refresh token
            await this.getAccessToken()
        }

        if (moment(new Date()).format('YYYY-MM-DD HH:mm:00') <= accessToken.EndToken) {
            if (insert) {
                let fullUrl = `${url}?${params}`
                Request_json = {
                    url: `${url}?`,
                    param: `${params}`,
                    body: {}
                }
                response = await axios({
                    url: fullUrl,
                    method: 'get',
                    headers: {
                        'content-type': "application/json",
                        authorization: `${accessToken.token_type} ${accessToken.access_token}`
                    }
                })

                if (response.data && response.data.response_code == '200') {
                    rec_id = await this.insertTransaction('PP2Form - GetCustomerDetail', 'GET', Request_json, response.data, '', '1')
                    console.log(response.data)
                }


            }
            else {//update table transction
                let oDataUpdate = {
                    ref_id: ref_id,
                    rec_id: rec_id
                }
                this.updateTransaction(oDataUpdate)
            }
            return {
                data: response && response.data ? response.data : [],
                rec_id: rec_id ? rec_id : '',
                Request_json: Request_json
            }
        }
        else { // did not get/renew access token
            return null
        }


    }
    catch (error) {
        console.log('Error', error.message);
        if (error && error.message == 'getaddrinfo ENOTFOUND tms-dev.sirim.my') {
            console.log(Request_json)
            return {
                Request_json: Request_json,
                error: error.message
            }
        }
        else {
            console.log(error.stack);
            return null
        }

    }
}
exports.insertTransaction = async (module, method, request_json, response_json, ref_id, Status) => {
    try {
        let req_json = {
            url: request_json && request_json.url ? request_json.url : '',
            param: request_json && request_json.param ? request_json.param : {},
            body: request_json && request_json.body ? request_json.body : {}
        }
        // save get request to db
        let transBef = {
            module,
            method,
            request_json: request_json != undefined ? JSON.stringify(req_json) : null,
            response_json: response_json != undefined ? JSON.stringify(response_json) : null,
            request_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            response_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            response_code: response_json && response_json != null && response_json.response_code != undefined ? response_json.response_code : 400,
            status: Status != null ? Status : '1',
            ref_id: ref_id
        }
        let insert = await TMStransLogic.InsertDataTMS_trans(transBef)
        return insert.rec_id || 0

    }
    catch (error) {
        console.log('Error', error.message);
        console.log(error.stack);

        return null
    }
}

exports.postToTMS = async (req, res) => {
    let response = {}
    try {

        let Module = req.Module;
        let refid = req.ref_id;
        let url = req.url;
        let params = req.params
        let body = req.postToTMS
        let fullUrl;

        if (url.includes('?')) {
            fullUrl = `${url}`

        }
        else {
            fullUrl = `${url}?${params}`
        }

        let resIns = await this.insertUpdateDataTMS(fullUrl, 'POST', body, Module, refid)

        if (resIns.error != undefined && resIns.error != '') {
            return response = {
                response_code: 500,
                response: resIns.error,
                rec_id: resIns.rec_id,
                ...res
            }
        }
        else {
            return response = {
                response_code: 200,
                response: resIns,
                ...res
            }
        }

    }
    catch (err) {
        loggers.logError(loggers.thisLineTryCatch(err) + ': ' + err)
        console.log(err);

        return response = {
            response_code: 500,
            response: 'Failed to get data',
            error: err
        }
    }

}

exports.updateTransaction = async (data) => {
    let update = await TMStransLogic.UpdateDataTMS_trans(data)
}

exports.insertUpdateDataTMS = async (url, method = '', body = undefined, module, ref_id) => {
    let rec_id = 0
    try {

        if (accessToken == '') {
            await this.getAccessToken()
        }
        else if (moment(new Date()).format('YYYY-MM-DD HH:mm:00') >= accessToken.EndToken) {  // refresh token
            await this.getAccessToken()
        }

        if (moment(new Date()).format('YYYY-MM-DD HH:mm:00') <= accessToken.EndToken) {

            if (method.toUpperCase() != 'POST' && method.toUpperCase() != 'PUT') {
                return { status: false, rec_id, Success: false, Message: 'Method Type POST or PUT only!', Error: 'Method Type POST or PUT only!' }
            }
            let Request_json = {
                url: `${url}`,
                body: body
            }

            rec_id = await beforeToTMS(url, module, method, Request_json, undefined, undefined, ref_id, {
                url: url,
                method: method.toUpperCase(),
                data: (body) ? JSON.stringify(body) : null,
                headers: {
                    'content-type': "application/json",
                    authorization: `${accessToken.token_type} ${accessToken.access_token}`
                }
            }, accessToken) // save get request to db

            let response = {}
            if (method.toUpperCase() == 'POST') {
                response = await axios.post(url, body, {
                    headers: {
                        'content-type': "application/json",
                        authorization: `${accessToken.token_type} ${accessToken.access_token}`
                    }
                });
            }
            else { // PUT
                response = await axios.put(url, params, {
                    headers: {
                        'content-type': "application/json",
                        authorization: `${accessToken.token_type} ${accessToken.access_token}`
                    }
                });
            }
            console.log(response.data)
            let formattedResponse = response.data

            await afterToTMS(rec_id, (response.data && response.data.response_code ? response.data.response_code : response.status), formattedResponse, ref_id)// save response from dasar to db
            return {
                status: true,
                rec_id,
                ...formattedResponse
            }
        }
        else { // did not get/renew access token
            return { status: false, message: error.message }
        }

    }
    catch (error) {
        console.log('Error', error.message);
        console.log(error.stack);

        await afterToTMS(rec_id, error.response && error.response.status ? error.response.status : undefined, (error.message ? error.message : error), ref_id)// save response from dasar to db

        return {
            status: false,
            rec_id,
            error: error.message
        }
    }
}

async function beforeToTMS(reqUrl, module, method, request_json, response_code, response_json, ref_id = undefined, full_request = undefined, access_token = undefined) {
    // save get request to db
    let transBef = {
        url: reqUrl,
        module,
        method,
        request_json: JSON.stringify(request_json),
        response_code: response_code != undefined ? response_json : undefined,
        response_json: response_json != undefined ? JSON.stringify(response_json) : undefined,
        request_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
        response_date: undefined,
        status: '1',
        full_request: JSON.stringify(full_request),
        access_token: JSON.stringify(access_token),
        ref_id
    }
    let insert = await TMStransLogic.InsertDataTMS_trans(transBef)
    return insert.rec_id || 0
}

async function afterToTMS(rec_id, response_code, response_json, ref_id = undefined) {
    let transAft = {
        rec_id,
        response_code: response_code != undefined ? response_code : undefined,
        response_json: response_json != undefined ? JSON.stringify(response_json) : undefined,
        response_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
        status: '1',
        ref_id
    }
    await TMStransLogic.UpdateDataTMSTransALL(transAft)
}
