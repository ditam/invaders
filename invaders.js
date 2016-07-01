﻿var _1 = {
  color: 'rgb(200,200,100)'
};

var PARAMS = Object.freeze({
  COLLECTION_TIME: 1000,
  MOVE_THRESHOLD: 200
});
  
document.addEventListener('DOMContentLoaded', function(){

  var ctx = document.getElementById('fleet-display').getContext('2d');
  var progressButton = document.getElementById('button-progress');
  var clickHandler = function(){ startGeneration(); };
  progressButton.addEventListener('click', clickHandler);

  // One half of the basic invader, 6x8.
  // Invaders are symmetrical to a vertical axis, making the final size 11x8 pixels.
  var baseInvader = [
    [0,0,_1,0,0,0],
    [0,0,0,_1,0,0],
    [0,0,_1,_1,_1,_1],
    [0,_1,_1,0,_1,_1],
    [_1,_1,_1,_1,_1,_1],
    [_1,0,_1,_1,_1,_1],
    [_1,0,_1,0,0,0],
    [0,0,0,_1,_1,0],
  ];

  //NB: hullMutator should come before antennaMutator, because they overlap
  var mutators = [hullMutator, antennaMutator, weaponMutator, thrusterMutator];

  function startGeneration() {
    collectInput(function(inputs){
      var invader = mutateInvader(baseInvader, inputs, mutators);
      display(invader);
    });
  }

  function collectInput(callback){
    var inputArea = document.getElementById('input-area');
    var inputSeed = [];
    var moveCount = 0;
    var moveCounter = function(){
      moveCount++;
    };

    inputArea.addEventListener('mousemove', moveCounter);

    progressButton.removeEventListener('click', clickHandler);
    progressButton.innerHTML = 'Generating fleet... (0/'+mutators.length+')';

    //Dispatch a timeout for each mutator, with increasing delays. Mouse moves are
    // collected between the callbacks, creating the input seed for each mutator.
    mutators.forEach(function(_, i){
      setTimeout(function(){
        progressButton.innerHTML = 'Generating fleet... ('+(i+1)+'/'+mutators.length+')';
        inputSeed.push({ moveCount: moveCount });
        moveCount = 0;
        if(i===mutators.length-1){
          inputArea.removeEventListener('mousemove', moveCounter);
          callback(inputSeed);
          progressButton.innerHTML = 'Fleet generated. (Click to restart)';
          progressButton.addEventListener('click', clickHandler);
        }
      }, PARAMS.COLLECTION_TIME*(i+1));
    });

  }

  //TODO: extend this function to display rows (the whole fleet)
  function display(invader){
    drawInvader(ctx,0,0,invader);
  }

});

function deepCopy(obj){
  return JSON.parse(JSON.stringify(obj));
}

function mutateInvader(base, inputs, mutators){
  var invader = deepCopy(base);
  mutators.forEach(function(mutator, i){
    invader = mutator(invader, inputs[i]);
  });
  return invader;
}

function hullMutator(invader, input){
  var basePixel = {
    color: getColorString(input.moveCount)
  };
  var part = [
    [0,0,0,basePixel], // antenna will overwrite first 3 anyway
    [basePixel,0,basePixel,basePixel], //2nd empty for "eye"
    [basePixel,basePixel,basePixel,basePixel],
    [basePixel,basePixel,basePixel,basePixel]
  ];
  return applyPart(invader, part, 2, 2);
}

function antennaMutator(invader, input){
  var basePixel = {
    color: getColorString(input.moveCount)
  };
  var part = [
    [basePixel,0,0,0],
    [0,basePixel,0,0],
    [basePixel,basePixel,basePixel,null]
  ];
  return applyPart(invader, part, 2, 0);
}

function weaponMutator(invader, input){
  var basePixel = {
    color: getColorString(input.moveCount)
  };
  var part = [
    [0,0],
    [0,0],
    [0,basePixel],
    [basePixel,basePixel],
    [basePixel,0],
    [basePixel,0],
    [0,0]
  ];
  return applyPart(invader, part, 0, 0);
}

function thrusterMutator(invader, input){
  var basePixel = {
    color: getColorString(input.moveCount)
  };
  var part = [
    [basePixel,0,0,0],
    [0,basePixel,basePixel,0]
  ];
  return applyPart(invader, part, 2, 6);
}

function getColorString(moveCount){
  var n = 256-Math.min(PARAMS.MOVE_THRESHOLD,moveCount);
  //greyscale for now TODO: colorize with RGB bias param?
  return 'rgb('+n+','+n+','+n+')';
}

function applyPart(base, part, x, y){
  var invader = deepCopy(base);
  for(var i=0;i<part.length;i++){
    for(var j=0;j<part[i].length;j++){
      if(part[i][j] != null){ // null signals ignore, 0 signals overwrite with empty
        invader[y+i][x+j] = part[i][j];
      }
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
        context.fillStyle = invader[y][xPos].color;
        context.fillRect(x0+x*pixelSize,y0+y*pixelSize,pixelSize,pixelSize);        
      }
    }
  }  
}