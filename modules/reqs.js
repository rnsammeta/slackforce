"use strict";

let auth = require("./slack-salesforce-auth"),
    force = require("./force"),
    REQS_TOKEN = process.env.SLACK_REQS_TOKEN;

exports.execute = (req, res) => {

    if (req.body.token != REQS_TOKEN) {
        res.send("Invalid token");
        return;
    }

    let slackUserId = req.body.user_id,
        oauthObj = auth.getOAuthObject(slackUserId),

        q = "SELECT Id, Name, requisition_status__c, job_title_or_job_code__c, hiring_manager__c, hiring_manager_email__c,  number_of_openings__c, new_headcount_or_replacement__c, employee_type__c, schedule__c, primary_location__c, justification__c FROM Requisition__c WHERE hiring_manager__c LIKE '%" + req.body.text + "%' order by job_title_or_job_code__c desc LIMIT 5";

    force.query(oauthObj, q)
        .then(data => {
            let reqs = JSON.parse(data).records;
            if (reqs && reqs.length > 0) {
                let attachments = [];
                reqs.forEach(function (req) {
                    let fields = [];
                    fields.push({
                        title: "Name",
                        value: req.Name,
                        short: true
                    });
                    fields.push({
                        title: "Job Code/Title",
                        value: req.job_title_or_job_code__c,
                        short: true
                    });
                    fields.push({
                        title: "Hiring Manager",
                        value: req.hiring_manager__c,
                        short: true
                    });
                    fields.push({
                        title: "Hiring Manager Email",
                        value: req.hiring_manager_email__c,
                        short: true
                    });
                    fields.push({
                        title: "Open in Salesforce:",
                        value: oauthObj.instance_url + "/" + req.Id,
                        short: false
                    });
                    attachments.push({
                        color: "#A094ED",
                        fields: fields
                    });
                });
                res.json({
                    text: "Reqs matching '" + req.body.text + "':",
                    attachments: attachments
                });
            } else {
                res.send("No reqs found for this user");
            }
        })
        .catch(error => {
            if (error.code == 401) {
                res.send(`Visit this URL to login to Salesforce: https://${req.hostname}/login/` + slackUserId);
            } else {
                res.send("An error as occurred");
            }
        });
};