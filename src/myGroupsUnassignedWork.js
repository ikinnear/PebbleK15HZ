var debug = false;
var Settings = require('settings');
var UI = require('ui');
var Vector2 = require('vector2');
var error = require('error');
var parseFeed = require('parseFeed');
var ajax = require('ajax');
var comments = require('comments');
var menuTitle = "Group Unassigned";
var myGroupsUnassignedWork = {
  show: function(instance,encoded_auth,user_name) {
    instance = Settings.option('instance');
    encoded_auth = Settings.option('encoded_auth');
    user_name = Settings.option('user_name');
    if(debug){
      console.log("DEBUG Stored instance value is: " + instance);
      console.log("DEBUG Stored encoded_auth value is: " + encoded_auth);
      console.log("DEBUG Stored user_name value is: " + user_name);
    }
 
    // Show splash screen while waiting for data
    var splashWindow = new UI.Window();
 
    // Text element to inform user
    var text = new UI.Text({
      position: new Vector2(0, 50),
      size: new Vector2(144, 168),
      text:'Downloading data...',
      font:'GOTHIC_28_BOLD',
      color:'black',
      textOverflow:'wrap',
      textAlign:'center',
      backgroundColor:'white'
    });

    var image = new UI.Image({ 
      image: 'images/icon.png',
      size: new Vector2(144, 50),
      backgroundColor:'white'
    });
 
    // Add to splashWindow and show
    splashWindow.add(text);
    splashWindow.add(image);
    splashWindow.show();
 
  // Make request to the instance for Task data 
  if((typeof instance=== 'undefined' || typeof encoded_auth=== 'undefined') || (instance.length === 0 || encoded_auth.length === 0)){
    error.show("Please configure the instance parameters within the Pebble app by clicking on the settings gear.");
    splashWindow.hide();
  }
  else{
    if(debug){
      console.log('DEBUG url: ' + encodeURI('https://' + instance + '.service-now.com/api/now/table/task?sysparm_query=assignment_group=javascript:getUserGroupsByUser_Name("' + user_name + '")^assigned_toISEMPTY^active=true'));
      console.log("DEBUG auth: Accept: 'application/json', Authorization: Basic " + encoded_auth);
    }
  ajax(
    {
      url:encodeURI('https://' + instance + '.service-now.com/api/now/table/task?sysparm_query=assignment_group=javascript:getUserGroupsByUser_Name("' + user_name + '")^assigned_toISEMPTY^active=true'),
      method:'get',
      headers:{ Accept: 'application/json', Authorization: "Basic " + encoded_auth},
      type:'json'
    },
    function(data) {
      
      if(data.result.length===0){
        if(debug)
          console.log("DEBUG no records returned: " + JSON.stringify(data, null, 4));
        splashWindow.hide();
      }
      
      if(debug)
        console.log("DEBUG data for menu: " + JSON.stringify(data, null, 4));
      // Create an array of Menu items
      var menuItems = parseFeed.parse(data, 10);
 
      // Construct Menu to show to user
      var resultsMenu = new UI.Menu({
        sections: [{
          title: menuTitle,
          icon: 'images/icon.png',
          items: menuItems
        }]
      });
 
    // Add an action for SELECT
    resultsMenu.on('select', function(e) {
    // Get record details
    var short_description = data.result[e.itemIndex].short_description;
 
    // Assemble body string
    var content = 'Created By: ' + data.result[e.itemIndex].sys_created_by + '\n' +
      'Opened: ' + data.result[e.itemIndex].opened_at + '\n' +
      'Last Updated: ' + data.result[e.itemIndex].sys_updated_on + '\n' +
      'Due Date: ' + data.result[e.itemIndex].due_date + '\n';      
      //'State: ' + data.result[e.itemIndex].state + '\n' + //TODO need to work on this to get the state display value
      //'Assignment Group: ' + data.result[e.itemIndex].assignment_group + '\n' + //TODO need to work on this to get the displayname
      //'Comments: ' + data.result[e.itemIndex].comments;  //TODO need to work on this to get the comments in displayable form
      
      var commentsData = comments.get(instance,encoded_auth,user_name,data.result[e.itemIndex].sys_id);
      if(JSON.stringify(commentsData, null, 4).length>2){
        content += 'Comments:\n'; 
        if(debug)
          console.log("DEBUG data for comments: " + JSON.stringify(commentsData, null, 4) + "length: " + commentsData.result.length);
        for(var index=0;index<commentsData.result.length;index++){
          content += commentsData.result[index].sys_created_on + ': ' + commentsData.result[index].value  + '\n';
        }
      }
      else{
        if(debug)
          console.log("DEBUG data for comments: No comment data returned");
      }

      
      // Create the Card for detailed view
      var detailCard = new UI.Card({
        title:e.item.title,
        subtitle:short_description,
        body: content,
        scrollable: true,
        style: "small"
      });
      detailCard.show();
      
      // Add an action for SELECT
      detailCard.on('click','select', function() { 
        
        var taskMenu = new UI.Menu({
          sections: [{
            title: 'Task Options',
            items: [{
              title: 'Assign To Me'
            }]
          }]
        });
        
        taskMenu.show();
        
        taskMenu.on('select', function(e2) {
          if(debug){
            console.log('Selected item #' + e2.itemIndex + ' of section #' + e2.sectionIndex + " (selected sys_id: " + data.result[e.itemIndex].sys_id + ")");
            console.log('The item is titled "' + e2.item.title + '"');
          }
          if(e2.itemIndex===0){
            //REST OPERATION to Assign Task and update comment
            var requestBody = {'assigned_to':user_name,'comments':user_name + ' accepted assignment via Pebble SmartWatch!'};
            ajax( {
              url:'https://' + instance + '.service-now.com/api/now/table/task/' + data.result[e.itemIndex].sys_id,
              method:'put',
              headers:{ Accept: 'application/json', Authorization: "Basic " + encoded_auth},
              type:'json',
              data:requestBody
            },
            function(data) {
              if(debug)
                console.log("DEBUG data for task assignment: " + JSON.stringify(data, null, 4));
              taskMenu.hide();
              detailCard.hide();
              resultsMenu.hide();
            },
            function(error) {
              //handle error!
              if(debug)
                console.log('error retrieving task data: ' + JSON.stringify(error, null, 4));
            });
          }
        });
      
      });
      
      
      
    });
 
    // Show the Menu, hide the splash
    resultsMenu.show();
    splashWindow.hide();
    
  },
  function(returnedError) {
    var errorMessage = '';
    if(debug)
      console.log("DEBUG Download failed: " + JSON.stringify(returnedError, null, 4));
    //if the query was successful however no records were found, display a suitable message
    if(returnedError.error.message == "No Record found")
      errorMessage = "No records found.";
    else
      errorMessage = "Failed to retrieve the data! Please check instance name and parameters. " + JSON.stringify(returnedError, null, 4);
    error.show(errorMessage); 
  }
);

}
}
};
this.exports =  myGroupsUnassignedWork;