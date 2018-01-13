var google = require('googleapis');
var tm = google.tagmanager('v2');
var key = require('./BigQ-DRD-1-98f05c98238c.json');
var Slack = require('slack-node');
const config = require('./config.json');

var scopes = [
  'https://www.googleapis.com/auth/tagmanager.edit.containers',
    'https://www.googleapis.com/auth/tagmanager.readonly'
];



var jwtClient = new google.auth.JWT(
  key.client_email,
  null,
  key.private_key,
  scopes, // an array of auth scopes
  null
);

function getGTMData(){
    jwtClient.authorize(function (err, tokens) {
        if (err) {
            console.log(err);
            return;
        }
        tm.accounts.containers.versions.live({
            parent: 'accounts/23565264/containers/798869',
            auth: jwtClient
            },
            function (err, resp) {
                if(err){
                    console.log(err);
                    return;
                }
                isNew = checkStatus(resp);
                if(isNew){
                    sendSlack(resp);
                }
            });
        });
}

function checkStatus(data){
    console.log("test")
    var datePublished = new Date(Number(data.fingerprint));
    var nowDate = new Date();
    var diff = Math.floor((Math.abs(nowDate - datePublished)/1000)/60);
    console.log(diff)
    return diff <=30;
}

function sendSlack(data){
    var publishDate = new Date(Number(data.fingerprint));
     var utc = publishDate.getTime() + (publishDate.getTimezoneOffset() * 60000);
    // console.log(publishDate.getTimezoneOffset() * 60000);
    var ad = new Date(utc + (3600000*11));
    var msg = "Container "+data.container.name+" ["+data.container.publicId+"] has been published at "+ad+".\n";
    msg+="Live version is now "+ data.containerVersionId +": "+ data.name+" - "+ data.description +".\n";
    msg+= "<"+data.tagManagerUrl+"|Full details available here.>";
   slack = new Slack();
  slack.setWebhook(config.TESTING_SLACK_URL);
  slack.webhook({text: msg}, function(err, response) {
    console.log(response);
    });    
   console.log(msg);
}
//getGTMData();
exports.gtmnotifications =  function (event, callback) {
    getGTMData();
    callback();
}
