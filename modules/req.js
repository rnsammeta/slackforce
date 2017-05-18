"use strict";

let auth = require("./slack-salesforce-auth"),
    force = require("./force"),
    REQ_TOKEN = process.env.SLACK_REQ_TOKEN;

exports.execute = (req, res) => {

    if (req.body.token != REQ_TOKEN) {
        res.send("Invalid token");
        return;
    }

    let slackUserId = req.body.user_id,
        oauthObj = auth.getOAuthObject(slackUserId),
        q = "SELECT Id, tobase__Requisition_Number__c, Hiring_Manager_Name__c, Hiring_Manager_Email__c, Number_of_Openings__c, New_Headcount_or_Replacement__c,  Job_Title_or_Job_Code__c, Employee_Type__c, Schedule__c, Primary_Location__c, Justification__c FROM tobase__Requisition__c WHERE tobase__Requisition_Number__c LIKE '%" + req.body.text + "%' LIMIT 1";

    force.query(oauthObj, q)
        .then(data => {
            let reqs = JSON.parse(data).records;
            if (reqs && reqs.length > 0) {
                let attachments = [];
                reqs.forEach(function (req) {
                    let fields = [];
                    fields.push({
                        title: "Name",
                        value: req.tobase__Requisition_Number__c,
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
                        title: "Number of Openings",
                        value: req.Number_of_Openings__c,
                        short: true
                    });
                    fields.push({
                        title: "New Headcount or Replacement",
                        value: req.New_Headcount_or_Replacement__c,
                        short: true
                    });
                    fields.push({
                        title: "Employee Type",
                        value: req.Employee_Type__c,
                        short: true
                    });
                    fields.push({
                        title: "Schedule",
                        value: req.Schedule__c,
                        short: true
                    });
                    fields.push({
                        title: "Primary Location",
                        value: req.Primary_Location__c,
                        short: true
                    });
                    fields.push({
                        title: "Justification",
                        value: req.Justification__c,
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