const https = require('https');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const async = require('async');
// const oauth2 = require('simple-oauth2');
// const { ClientCredentials } = require('simple-oauth2');
var request = require('request');
const axios = require('axios')
const oauth = require('axios-oauth-client');
const moment = require('moment');
const loggers = require('../../log');
const axiosRetry = require('axios-retry').default;

// const CLIENT_ID = '61da80b399a95a0010cfcb82'
// const CLIENT_SECRET = 'j0zpx0rOJiEzQryCRFhNk/1fpOK2Sv2hZuyt5Em+omM='
// const SCOPE = 'finance.grp-censoft-api.all'
// const TOKEN_PATH = 'security/connect/token'
// const TOKEN_HOST = 'https://gateway-codelab.sirim.my/'
// // const TOKEN_HOST = 'https://moquer-gw-codelab.sirim.my/'
// const TOKEN_URL = 'https://gateway-codelab.sirim.my/security/connect/token'
// // const TOKEN_URL = 'https://moquer-gw-codelab.sirim.my/security/connect/token'
// const apiURL = 'https://gateway-codelab.sirim.my'
// // const apiURL = 'https://moquer-gw-codelab.sirim.my'
// const CLIENT_ID_PAYMENT = '62047becc90ca4001f9af96d'
// const CLIENT_SECRET_PAYMENT = 'fm+fCznY5iscCvdZWnAMNder6GbHpp+4yuM5cJ7KsSg='
// const SCOPE_PAYMENT = 'finance.grp-censoft-payment.all'

//staging
const CLIENT_ID = '6155f948fc1ab713b0cab58d'
const CLIENT_SECRET = '3RDIvCYGaRUqXu2iq9SIZu0qde0xjyXGwjh+MU4Q4S0='
const SCOPE = 'eip-admin.grp-censoft-api.all'
const TOKEN_PATH = 'security/connect/token'
const TOKEN_HOST = 'https://moquer-gw-codelab.sirim.my/'
const TOKEN_URL = 'https://moquer-gw-codelab.sirim.my/security/connect/token'
const apiURL = 'https://moquer-gw-codelab.sirim.my'
const CLIENT_ID_PAYMENT = '6155f948fc1ab713b0cab58d'
const CLIENT_SECRET_PAYMENT = '3RDIvCYGaRUqXu2iq9SIZu0qde0xjyXGwjh+MU4Q4S0='
const SCOPE_PAYMENT = 'eip-admin.grp-censoft-api.all'


let accessToken = ''

exports.apiRoutes = {
    // Account: `${apiURL}/finance/grp-censoft-api/v1/GRP9/1/Account`,
    // Invoice: `${apiURL}/finance/grp-censoft-api/v1/GRP9Default/1/Invoice`,
    // PaymentGet: `${apiURL}/finance/grp-censoft-api/v1/GRP9Default/1/Payment`,
    // Payment: `${apiURL}/finance/grp-censoft-payment/v1/entity/GRP9Default/1/Payment`,
    // Requisitions: `${apiURL}/finance/grp-censoft-api/v1/GRP9/1/Requisitions`,
    // Inventory: `${apiURL}/finance/grp-censoft-api/v1/GRP9/1/NonStockItem`,
    // Refund: `${apiURL}/finance/grp-censoft-api/v1/GRP9Default/1/PaymentRefund`,
    //Reverse: `${apiURL}/finance/grp-censoft-api/v1/GRP9Default/1/Invoice/ReverseInvoiceAndApplyToMemo`,
    Account: `${apiURL}/eip-admin/grp-censoft-api/v1/GRP9/1/Account`,
    Invoice: `${apiURL}/eip-admin/grp-censoft-api/v1/GRP9Default/1/Invoice`,
    PaymentGet: `${apiURL}/eip-admin/grp-censoft-api/v1/GRP9Default/1/Payment`,
    Payment: `${apiURL}/eip-admin/grp-censoft-api/v1/GRP9Default/1/Payment`, //staging
    Requisitions: `${apiURL}/eip-admin/grp-censoft-api/v1/GRP9/1/Requisitions`,
    Inventory: `${apiURL}/eip-admin/grp-censoft-api/v1/GRP9/1/NonStockItem`,
    Refund: `${apiURL}/eip-admin/grp-censoft-api/v1/GRP9Default/1/PaymentRefund`,
    //VoidPayment: `${apiURL}/finance/grp-censoft-api/v1/GRP9Default/1/Payment/CustomVoidPayment`, //prod
    //VoidPayment: `${apiURL}/eip-admin/grp-censoft-api/v1/GRP9Default/1/Payment/CustomVoidPayment`, //staging
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

exports.getAccessTokenPayment = async () => {
    try {
        const getClientCredentials = oauth.client(axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        }), {
            url: TOKEN_URL,
            grant_type: 'client_credentials',
            client_id: CLIENT_ID_PAYMENT,
            client_secret: CLIENT_SECRET_PAYMENT,
            scope: SCOPE_PAYMENT
        })
        let auth = await getClientCredentials();
        auth.StartToken = moment(new Date()).format('YYYY-MM-DD HH:mm:00');
        auth.EndToken = moment(new Date()).add(auth.expires_in, 'seconds').subtract(60, "seconds").format('YYYY-MM-DD HH:mm:00');

        accessToken = auth
        return auth
    }
    catch (error) {
        console.log('getAccessToken error', error.message);
        loggers.logError(loggers.thisLine2() + ': ' + `${'getaccessTokenPayment' + error}`)

        return ''
    }
}

exports.getDataAccount = async (url, params, body = undefined) => {
    try {
        // url: "https://moquer-gw-codelab.sirim.my/eip-admin/grp-censoft-api/v1/GRP9/1/Account?$filter=AccountCD eq '61301'"

        // let queryString = Object.keys(params).map(key => key + '=' + params[key]).join('&');

        if (accessToken == '') {
            await this.getAccessToken()
        }
        else if (moment(new Date()).format('YYYY-MM-DD HH:mm:00') >= accessToken.EndToken) {  // refresh token
            await this.getAccessToken()
        }

        if (moment(new Date()).format('YYYY-MM-DD HH:mm:00') <= accessToken.EndToken) {
            let client = axios.create();
            axiosRetry(client, {
                retries: 3, onRetry: () => {
                    console.log('retrying')
                },
                retryDelay: () => 10000
            })
            let response = await client.get(`${url}?${params}`, {
                //method: 'get',
                data: (body) ? JSON.parse(body) : null,
                headers: {
                    'content-type': "application/json",
                    authorization: `${accessToken.token_type} ${accessToken.access_token}`
                }
            })

            return response.data
        }
        else { // did not get/renew access token
            return null
        }
    }
    catch (error) {
        console.log('Error', error.message);
        console.log(error.stack);

        return null
    }
}

exports.putData = async (url, params, body = undefined) => {
    try {
        // url: "https://moquer-gw-codelab.sirim.my/eip-admin/grp-censoft-api/v1/GRP9/1/Account?$filter=AccountCD eq '61301'"

        // let queryString = Object.keys(params).map(key => key + '=' + params[key]).join('&');

        if (accessToken == '') {
            await this.getAccessToken()
        }
        else if (moment(new Date()).format('YYYY-MM-DD HH:mm:00') >= accessToken.EndToken) {  // refresh token
            await this.getAccessToken()
        }

        if (moment(new Date()).format('YYYY-MM-DD HH:mm:00') <= accessToken.EndToken) {
            let response = await axios({
                url: `${url}?${params}`,
                method: 'put',
                data: (body) ? JSON.stringify(body) : null,
                headers: {
                    'content-type': "application/json",
                    authorization: `${accessToken.token_type} ${accessToken.access_token}`
                }
            })
            return response.data
        }
        else { // did not get/renew access token
            return { status: false, message: error.message }
        }
    }
    catch (error) {
        // console.log('Error', JSON.stringify(error.response.data));
        return { status: false, message: error.response != undefined && error.response.data != undefined && error.response.data.exceptionMessage != undefined && error.response.data.exceptionMessage != null ? JSON.stringify(error.response.data.exceptionMessage).trim().substring(0, 4000).replace(/'/g, '"') : "[ERR_NORESP_APISOURCE] Api Source Service unavailable!" }
    }
}

exports.putDataPayment = async (url, params, body = undefined) => {
    try {
        // url: "https://moquer-gw-codelab.sirim.my/eip-admin/grp-censoft-api/v1/GRP9/1/Account?$filter=AccountCD eq '61301'"

        // let queryString = Object.keys(params).map(key => key + '=' + params[key]).join('&');

        if (accessToken == '') {
            await this.getAccessTokenPayment()
        }
        else if (moment(new Date()).format('YYYY-MM-DD HH:mm:00') >= accessToken.EndToken) {  // refresh token
            await this.getAccessTokenPayment()
        }

        if (moment(new Date()).format('YYYY-MM-DD HH:mm:00') <= accessToken.EndToken) {
            let response = await axios({
                url: `${url}?${params}`,
                method: 'put',
                data: (body) ? JSON.stringify(body) : null,
                headers: {
                    'content-type': "application/json",
                    authorization: `${accessToken.token_type} ${accessToken.access_token}`
                }
            })
            return response.data
        }
        else { // did not get/renew access token
            console.log('Error', error.message);
            // console.log(error.stack);

            return { status: false, message: error.message }
        }
    }
    catch (error) {
        console.log('Error', JSON.stringify(error.response.data));
        return { status: false, message: error.response.data != undefined && error.response.data.exceptionMessage != undefined && error.response.data.exceptionMessage != null ? JSON.stringify(error.response.data.exceptionMessage).trim().substring(0, 2000).replace(/'/g, '"') : "[ERR_NORESP_APISOURCE] Api Source Service unavailable!" }
    }
}

exports.putDataReverse = async (url, params, body = undefined) => {
    try {
        // url: "https://moquer-gw-codelab.sirim.my/eip-admin/grp-censoft-api/v1/GRP9/1/Account?$filter=AccountCD eq '61301'"

        // let queryString = Object.keys(params).map(key => key + '=' + params[key]).join('&');

        if (accessToken == '') {
            await this.getAccessToken()
        }
        else if (moment(new Date()).format('YYYY-MM-DD HH:mm:00') >= accessToken.EndToken) {  // refresh token
            await this.getAccessToken()
        }

        if (moment(new Date()).format('YYYY-MM-DD HH:mm:00') <= accessToken.EndToken) {
            let response = await axios({
                url: `${url}?${params}`,
                method: 'post',
                data: (body) ? JSON.stringify(body) : null,
                headers: {
                    'content-type': "application/json",
                    authorization: `${accessToken.token_type} ${accessToken.access_token}`
                }
            })
            return response.status
        }
        else { // did not get/renew access token
            return { status: false, message: error.message }
        }
    }
    catch (error) {
        // console.log('Error', JSON.stringify(error.response.data));
        return { status: false, message: error.response != undefined && error.response.data != undefined && error.response.data.exceptionMessage != undefined && error.response.data.exceptionMessage != null ? JSON.stringify(error.response.data.exceptionMessage).trim().substring(0, 4000).replace(/'/g, '"') : "[ERR_NORESP_APISOURCE] Api Source Service unavailable!" }
    }
}

// exports.VoidPayment = async (url, params, body = undefined) => {
//     try {
//         // url: " https://moquer-gw-codelab.sirim.my/eipadmin/grp-censoft-api/v1/GRP9Default/1/Payment/ CustomVoidPayment"

//         if (accessToken == '') {
//             await this.getAccessTokenPayment()
//         }
//         else if (moment(new Date()).format('YYYY-MM-DD HH:mm:00') >= accessToken.EndToken) {  // refresh token
//             await this.getAccessTokenPayment()
//         }

//         if (moment(new Date()).format('YYYY-MM-DD HH:mm:00') <= accessToken.EndToken) {
//             let response = await axios({
//                 url: `${url}?${params}`,
//                 method: 'post',
//                 data: (body) ? JSON.stringify(body) : null,
//                 headers: {
//                     'content-type': "application/json",
//                     authorization: `${accessToken.token_type} ${accessToken.access_token}`
//                 }
//             })
//             return response.status
//         }
//         else { // did not get/renew access token
//             return { status: false, message: error.message }
//         }
//     }
//     catch (error) {
//         // console.log('Error', JSON.stringify(error.response.data));
//         return { status: false, message: error.response != undefined && error.response.data != undefined && error.response.data.exceptionMessage != undefined && error.response.data.exceptionMessage != null ? JSON.stringify(error.response.data.exceptionMessage).trim().substring(0, 4000).replace(/'/g, '"') : "[ERR_NORESP_APISOURCE] Api Source Service unavailable!" }
//     }
// }