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
        q = "SELECT Id, Name, Job_Title_or_Job_Code__c, Hiring_Manager_Name__c, Hiring_Manager_Email__c FROM tobase__Requisition__c WHERE Hiring_Manager_Email__c LIKE '%" + req.body.text + "%' LIMIT 5";

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
                        value: req.Job_Title_or_Job_Code__c,
                        short: true
                    });
                    fields.push({
                        title: "Hiring Manager",
                        value: req.Hiring_Manager_Name__c,
                        short: true
                    });
                    fields.push({
                        title: "Hiring Manager Email",
                        value: req.Hiring_Manager_Email__c,
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