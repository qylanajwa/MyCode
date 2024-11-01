Hi there.

This is part of my code related to my previous project. I'm working for SIRIM and most of the time I developed API for backend using Node JS and Express framework. As you can see, there's 2 folder :-
i) MyFAST
ii) PP2
I will explain it one by one.

MyFast is an API involve with invoice,payment and receipt. This API connected to the third party API. One invoice has been generated, invoice's data need to be push to the third party (centralized the data).
After customer did the payment, receipt will be generated and all data related to payment and receipt will be send to the third party as well. So this API involve calculation for SST also. So this API will be the data in 
real time and if the data is failed to be push (due to any issue;connection), scheduler will pickup at night and push the data by bulk. So 'AccessToken' file is the authentication that we've used. 'GRPInvoice' and 'GRPReceipt' 
is a file that contain sql query that connected to MSSQL database. 'Receipt' and 'clsInvoiceIntegration' is the controller pr the actual API funtion.'MyFastScheduler' is the scheduler file.


PP2 is an API that require many data from other party as well to be migrate in our system. Generally it is related to a client's information. So PP2FormController is the controller, 'PP2Logic' is the logic where we can connect with
database, 'PP2' is router that connect with the API.
