document.addEventListener("DOMContentLoaded", function(event) { 

  var ctx;
  var canvas = document.getElementById('fleet-display');
  if (canvas.getContext) {
    ctx = canvas.getContext('2d');
  }

  document.getElementById('button-progress').addEventListener('click', function(){
    draw();
  });
  
  // One half of the basic invader, 6x8.
  // Invaders are symmetrical to a vertical axis, making the final size 11x8 pixels.
  var baseInvader = [
    [0,0,1,0,0,0],
    [0,0,0,1,0,0],
    [0,0,1,1,1,1],
    [0,1,1,0,1,1],
    [1,1,1,1,1,1],
    [1,0,1,1,1,1],
    [1,0,1,0,0,0],
    [0,0,0,1,1,0],
  ];

  function draw() {
    drawInvader(ctx,0,0,baseInvader);
  }
});

function drawInvader(context, x0, y0, invader){
  var pixelSize = 10;
  context.fillStyle = 'rgb(200,200,200)';
  
  for(var y=0;y<invader.length;y++){
    var len = invader[y].length;
    //we're mirroring every column but the last
    for(var x=0;x<len*2-1;x++){ 
      var xPos = x>=len? x-(x-len+1)*2 : x;
      if(invader[y][xPos]){
        context.fillRect(x0+x*pixelSize,y0+y*pixelSize,pixelSize,pixelSize);        
      }
    }
  }  
}