
const CronJob = require('cron').CronJob;
const logger = require('../../logger');
const myfastCron = require('../../CronScheduler/MyFastCronScheduler')

const myFast = new CronJob('30 14 * * *', () => {
    logger.info('MyFast Scheduler Start');
    // myfastCron.MyFastScheduler()
}, null, true);
//BadDebt.stop();


const myFastCustom = new CronJob('00 20 * * *', () => {
    logger.info('MyFast Custom Scheduler Start');
    myfastCron.MyFastSchedulerCustom()
}, null, true);

const myFastDocApply = new CronJob('00 00 * * *', () => {
    logger.info('MyFast Doc Apply Scheduler Start');
    myfastCron.MyFastSchedulerDocApply()
}, null, true);

const eGHLCallBackStatus = new CronJob('00 22 * * *', () => {
    logger.info('MyFast Doc Apply Scheduler Start');
    myfastCron.eGHLCallBack_Push()
}, null, true);
const eGHLPendingCallBackStatus = new CronJob('00 23 * * *', () => {
    logger.info('MyFast Doc Apply Scheduler Start');
    myfastCron.eGHLCallBack_PendingStatus()
}, null, true);
module.exports = {
    myFastCustom,
    myFast,
    myFastDocApply
}
