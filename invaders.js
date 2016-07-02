var PARAMS = Object.freeze({
  COLLECTION_TIME: 1000,
  MAX_COLOR_BIAS: 3,
  MOVE_THRESHOLD: 200,
  MOVE_ADJUSTMENT_MULTIPLIER: 2,
  INPUT_WIDTH: 300,
  INPUT_HEIGHT: 250,
  CANVAS_WIDTH: 500,
  CANVAS_HEIGHT: 300,
  PIXEL_SIZE: 10
});
  
document.addEventListener('DOMContentLoaded', function(){

  var ctx = document.getElementById('fleet-display').getContext('2d');
  var progressButton = document.getElementById('button-progress');
  var clickHandler = function(){ startGeneration(); };
  progressButton.addEventListener('click', clickHandler);

  // Only one half, a 6x8 grid is stored for an invader, because they are 
  // symmetrical to the vertical axis (making their final size 11x8 pixels).
  // The half of the "standard" space invader looks like this:
  //[0,0,1,0,0,0],
  //[0,0,0,1,0,0],
  //[0,0,1,1,1,1],
  //[0,1,1,0,1,1],
  //[1,1,1,1,1,1],
  //[1,0,1,1,1,1],
  //[1,0,1,0,0,0],
  //[0,0,0,1,1,0],
  //but it's not necessary to store this, because the mutators recreate it if there's no mouse input

  var baseInvader = [
    [0,0,0,0,0,0],
    [0,0,0,0,0,0],
    [0,0,0,0,0,0],
    [0,0,0,0,0,0],
    [0,0,0,0,0,0],
    [0,0,0,0,0,0],
    [0,0,0,0,0,0],
    [0,0,0,0,0,0],
  ];

  var mutators = [hullMutator, antennaMutator, weaponMutator, thrusterMutator];

  function startGeneration() {
    collectInput(function(inputs){
      var invader = mutateInvader(baseInvader, inputs, mutators);
      display(invader);
    });
  }

  function collectInput(callback){
    var inputArea = document.getElementById('input-area');
    var inputWidth = inputArea.getBoundingClientRect().width; //NB this includes borders
    var inputHeight = inputArea.getBoundingClientRect().height;
    var inputSeed = [];
    var moveCount = 0;
    var firstMove;
    var lastMove;
    var moveCounter = function(event){
      moveCount++;
      var X = event.clientX - this.getBoundingClientRect().left;
      var Y = event.clientY - this.getBoundingClientRect().top;
      if(firstMove){
        lastMove = {x: X, y: Y};
      } else {
        firstMove = {x: X, y: Y};
      }
    };

    inputArea.addEventListener('mousemove', moveCounter);

    progressButton.removeEventListener('click', clickHandler);
    progressButton.innerHTML = 'Generating fleet... (0/'+mutators.length+')';

    //Dispatch a timeout for each mutator, with increasing delays. Mouse moves are
    // collected between the callbacks, creating the input seed for each mutator.
    mutators.forEach(function(_, i){
      setTimeout(function(){
        progressButton.innerHTML = 'Generating fleet... ('+(i+1)+'/'+mutators.length+')';
        inputSeed.push({
          moveCount: moveCount,
          firstMove: firstMove,
          lastMove: lastMove
        });
        moveCount = 0;
        firstMove = undefined;
        lastMove = undefined;
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
  var p = { //base pixel
    color: getColorString(input.moveCount)
  };
  var s = deepCopy(p); //secondary pixel
  if(input.firstMove && input.lastMove){
    var x0 = input.firstMove.x;
    var y0 = input.firstMove.y;
    var x1 = input.lastMove.x;
    var y1 = input.lastMove.y;
    if(Math.abs(x0-x1)<100 && Math.abs(y0-y1)<100){
      s.color = getColorString(input.moveCount, 0.8, 0.8, 1)
    }
  }
  var e = 0; //eye pixel
  if(input.firstMove && input.lastMove){
    //only color eyes if movement was downwards - should be rare due to layout
    if(input.firstMove.y < input.lastMove.y ){
      e = {
        color: input.firstMove.x < input.lastMove.x? 'rgb(200,15,15)' : 'rgb(50,175,20)'
      };
    }
  }
  var part = [
    [0,0,0,s], // antenna will overwrite first 3 anyway
    [s,e,s,p],
    [p,s,p,s],
    [s,p,s,p]
  ];
  return applyPart(invader, part, 2, 2);
}

function antennaMutator(invader, input){
  var biasR = 1;
  var biasG = 1;
  var biasB = 1;
  if(input.firstMove && input.lastMove){
    biasR = input.firstMove.x/PARAMS.INPUT_WIDTH;
    biasG = input.firstMove.y/PARAMS.INPUT_HEIGHT;
    biasB = input.lastMove.x/PARAMS.INPUT_WIDTH;
  }
  var p = {
    color: getColorString(input.moveCount, biasR, biasG, biasB)
  };
  var part = [
    [p,0,0,0],
    [0,p,0,0],
    [p,p,p,null]
  ];
  return applyPart(invader, part, 2, 0);
}

function weaponMutator(invader, input){
  var p = {
    color: getColorString(input.moveCount)
  };
  var part = [
    [0,0],
    [0,0],
    [0,0],
    [0,p],
    [p,p],
    [p,0],
    [p,0],
    [0,0]
  ];
  return applyPart(invader, part, 0, 0);
}

function thrusterMutator(invader, input){
  var biasR = 1;
  var biasG = 1;
  var biasB = 1;
  if(input.lastMove){
    var biasR = Math.min(PARAMS.MAX_COLOR_BIAS/2, input.lastMove.x/input.lastMove.y);
    var biasG = input.lastMove.x > input.lastMove.y? 1: 0;
    var biasB = (input.lastMove.x<20 && input.lastMove.y<20)? 0: 1;
  }
  var p = {
    color: getColorString(input.moveCount, biasR, biasG, biasB)
  };
  var part = [
    [p,0,0,0],
    [0,p,p,0]
  ];
  return applyPart(invader, part, 2, 6);
}

function getColorString(moveCount, biasR, biasG, biasB){
  var n = 256-Math.min(PARAMS.MOVE_THRESHOLD,moveCount*PARAMS.MOVE_ADJUSTMENT_MULTIPLIER);
  var R = 1;
  var G = 1;
  var B = 1;
  if(biasR) R=biasR;
  if(biasG) G=biasG;
  if(biasB) B=biasB;
  //NB: non-integer values are not valid here!
  return 'rgb('+Math.floor(n*R)+','+Math.floor(n*G)+','+Math.floor(n*B)+')';
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
  context.clearRect(0,0,PARAMS.CANVAS_WIDTH,PARAMS.CANVAS_HEIGHT);
  
  for(var y=0;y<invader.length;y++){
    var len = invader[y].length;
    //we're mirroring every column but the last
    for(var x=0;x<len*2-1;x++){ 
      var xPos = x>=len? x-(x-len+1)*2 : x;
      if(invader[y][xPos]){
        context.fillStyle = invader[y][xPos].color;
        context.fillRect(
          x0+x*PARAMS.PIXEL_SIZE,
          y0+y*PARAMS.PIXEL_SIZE,
          PARAMS.PIXEL_SIZE,
          PARAMS.PIXEL_SIZE
        );
      }
    }
  }  
}