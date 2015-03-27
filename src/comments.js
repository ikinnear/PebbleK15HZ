var ajax = require('ajax');
var debug = false;
var commentsData = {};
var comments = {
  get: function(instance,encoded_auth,user_name,sys_id) {
    commentsData={};
    //get comments
    ajax( {
      url:'https://' + instance + '.service-now.com/api/now/table/sys_journal_field?sysparm_query=element_id=' + sys_id,
      method:'get',
      headers:{ Accept: 'application/json', Authorization: "Basic " + encoded_auth},
      type:'json',
      async:false
    },
    function(data) {
      if(debug)
        console.log("DEBUG data for comments: " + JSON.stringify(data, null, 4));
      commentsData=data;
    },
    function(error) {
      commentsData={};
    });
    if(debug)
        console.log("DEBUG data for commentsData: " + JSON.stringify(commentsData, null, 4));
    return commentsData;
  }
};
this.exports = comments;