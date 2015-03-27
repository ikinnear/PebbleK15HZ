var parseFeed = {
  parse: function(data, quantity) {
    var items = [];
    for(var i = 0; i < quantity; i++) {
      try{
        var title = data.result[i].number;
   
        // Get date/time substring
        var time = data.result[i].sys_updated_on;
   
        // Add to menu items array
        items.push({
          title:title,
          subtitle:time
        });
      }
      catch(e){}
    }
   
    // Finally return whole array
    return items;
  }
};
this.exports = parseFeed;