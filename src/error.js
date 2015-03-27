var UI = require('ui');
var Vector2 = require('vector2');
var error = {
  show: function(error_message) {
    var errorWindow = new UI.Window();
    // Text element to inform user
    var errorText = new UI.Text({
      position: new Vector2(0, 0),
      size: new Vector2(144, 168),
      text:error_message,
      font:'GOTHIC_14_BOLD',
      color:'black',
      textOverflow:'wrap',
      textAlign:'center',
      backgroundColor:'white'
    });
    errorWindow.add(errorText);
    errorWindow.show();
  }
};
this.exports = error;