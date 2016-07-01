var _1 = {
  color: 'rgb(200,200,100)'
};

var PARAMS = Object.freeze({
  COLLECTION_TIME: 2000,
  MOVE_THRESHOLD: 200
});
  
document.addEventListener("DOMContentLoaded", function(event) { 

  var ctx = document.getElementById('fleet-display').getContext('2d');

  document.getElementById('button-progress').addEventListener('click', function(){
    startGeneration();
  });

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

  function startGeneration() {
    collectInput(function(inputs){
      var invader = generate(inputs);
      display(invader);
    });
  }

  function collectInput(callback){
    //NB: input seed array's length should equal no. of mutators!
    var inputSeed = [{}];

    var inputArea = document.getElementById('input-area');
    var moveCount = 0;
    var moveCounter = function(){
      moveCount++;
    };

    inputArea.addEventListener('mousemove', moveCounter);

    setTimeout(function(){
      inputArea.removeEventListener('mousemove', moveCounter);
      inputSeed[0].moveCount = moveCount;
      callback(inputSeed);
    }, PARAMS.COLLECTION_TIME);
  }

  function generate(inputSeed){
    return mutateInvader(baseInvader, inputSeed);
  }

  function display(invader){
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
  var basePixel = {
    color: getColorString(input.moveCount)
  };
  var part = [
    [basePixel,0,0],
    [0,basePixel,0],
    [basePixel,basePixel,basePixel]
  ];
  //TODO mutate based on input
  return applyPart(invader, part, 2, 0);
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
      invader[y+i][x+j] = part[i][j];
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