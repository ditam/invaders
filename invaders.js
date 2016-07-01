﻿document.addEventListener("DOMContentLoaded", function(event) { 

  var ctx = document.getElementById('fleet-display').getContext('2d');

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
    //TODO: generate input seed object - length should equal no. of mutators!
    var inputSeed = [
      {movement: 0}
    ];
    var invader = mutateInvader(baseInvader, inputSeed);
    drawInvader(ctx,0,0,invader);
  }
});

function deepCopy(obj){
  return JSON.parse(JSON.stringify(obj));
}

function mutateInvader(base, inputs){
  var invader = deepCopy(base);
  mutators = [antennaMutator/*, weaponMutator, thrusterMutator*/];
  mutators.forEach(function(mutator, i){
    invader = mutator(invader, inputs[i]);
  });
  return invader;
}

function antennaMutator(invader, input){
  var part = [
    [1,1,1],
    [1,1,1]
  ];
  //TODO mutate based on input
  return applyPart(invader, part, 2, 0);
}

function applyPart(base, part, x, y){
  var invader = deepCopy(base);
  for(var i=0;i<part.length;i++){
    for(var j=0;j<part[i].length;j++){
      invader[y+i][x+j] = 1;
    }
  }
  return invader;
}

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