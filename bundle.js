(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
//imports
var Game = require('./modules/Game.js');
var Point = require('./modules/common/Point.js');
var MouseState = require('./modules/containers/MouseState.js');
var CanvasState = require('./modules/containers/CanvasState.js');
var GameState = require('./modules/containers/GameState.js');

//game objects
var game;
var canvas;
var ctx;

//mouse handling
var mousePosition;
var relativeMousePosition;
var mouseDown;
var mouseIn;
var wheelDelta;

//passable states
var mouseState;
var canvasState;
var gameState;

//fires when the window loads
window.onload = function(e){
    //variable and loop initialization
    initializeVariables();
    loop();
}

//initialization for variables, mouse events, and game "class"
function initializeVariables(){
    //camvas initialization
    canvas = document.querySelector('canvas');
    ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    console.log("Canvas Dimensions: " + canvas.width + ", " + canvas.height);
    
    
    //mouse variable initialization
    mousePosition = new Point(0,0);
    relativeMousePosition = new Point(0,0);
    
    //event listeners for mouse interactions with the canvas
    canvas.addEventListener("mousemove", function(e){
        var boundRect = canvas.getBoundingClientRect();
        mousePosition = new Point(e.clientX - boundRect.left, e.clientY - boundRect.top);
        relativeMousePosition = new Point(mousePosition.x - (canvasState.relativeWidth/2) - (canvasState.width - canvasState.relativeWidth), mousePosition.y - (canvasState.height/2.0));        
    });
    mouseDown = false;
    canvas.addEventListener("mousedown", function(e){
        mouseDown = true;
    });
    canvas.addEventListener("mouseup", function(e){
        mouseDown = false;
    });
    mouseIn = false;
    canvas.addEventListener("mouseover", function(e){
        mouseIn = true;
    });
    canvas.addEventListener("mouseout", function(e){
        mouseIn = false;
        mouseDown = false;
    });
    wheelDelta = 0;
    canvas.addEventListener("mousewheel", function(e){
        wheelDelta = e.wheelDelta;
    });
    
    //feed variables into mouseState
    mouseState = new MouseState(
        mousePosition,
        relativeMousePosition,
        mouseDown,
        mouseIn,
        wheelDelta
    );
    
    //canvas state container: context, center point, width, height, scale
    canvasState = new CanvasState(
        ctx, 
        new Point(canvas.width / 2, canvas.height/2),
        canvas.offsetWidth,
        canvas.offsetHeight
    );
    
    //creates the game object from which most interaction is managed
    game = new Game();
}

//fires once per frame
function loop(){
    //binds loop to frames
    window.requestAnimationFrame(loop.bind(this));
    
    //feed current mouse variables back into mouse state
    mouseState.update(
        mousePosition,
        relativeMousePosition,
        mouseDown,
        mouseIn,
        wheelDelta
    );
    //net wheel movement resets to 0
    wheelDelta = 0;
    
    //update game's variables: passing canvasState, mouseState, delta time
    game.update(canvasState, mouseState);
}

//listens for changes in size of window and updates canvas state appropriately
window.addEventListener("resize", function(e){
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    //canvas state update: context, center point, width, height, scale
    canvasState.update(
        ctx,
        new Point(canvas.width / 2, canvas.height / 2),
        canvas.width,
        canvas.height
    );
});




},{"./modules/Game.js":2,"./modules/common/Point.js":3,"./modules/containers/CanvasState.js":4,"./modules/containers/GameState.js":5,"./modules/containers/MouseState.js":6}],2:[function(require,module,exports){
//DONEpoloraoid labels written on
//DONE improved corkboard texture
//DONE credits and attribution
//wooden border
//board preview for the select screen

//11:15 12:05 MWF in the grad (sad) lab


"use strict";
//imported objects
var BoardPhase = require('./phases/BoardPhase.js');
var DrawLib = require('./libraries/Drawlib.js');
var Utilities = require('./libraries/Utilities.js');
var BoardData = require('./phases/BoardData.js');

//var activePhase;
var painter;
var utility;

function Game(){    
    painter = new DrawLib();
    utility = new Utilities();
    
    //boardPhase: the currently loaded JSON file corresponding to the current board
    this.activeBoard;
    //string: stores current phase. (title, select, board)
    this.phase = "title";
    //bool: whether or not progression is locked by a fade animation
    this.fadeAnimationLock = false;
    //number: duration of time in milliseconds since a fade animation lock was put in place
    this.fadeAnimationLockTimer = -1;
    //array<data>: contains readable game data that will be read from everywhere else in the game
    this.sceneData;
    //bool: whether or not the necessary data manifests have been fully loaded
    this.sceneDataLoaded = false;
    //array<boardData>: stores board data as it loads so it can be properly passed to scene data
    this.boardDataArray = [];
    //bool: whether it is safe to begin checking for load completion
    this.loadStarted = false;
    //array<data>: contains data corresponding to the scroller array
    this.scrollerData = [];
    //DOM: access to the main gameObject
    this.gameDataReference = document.getElementById("gameData");
    
    //set bindings for local helper functions
    _populateMysteryLayer = _populateMysteryLayer.bind(this);
    _initializeScroller = _initializeScroller.bind(this);
    _changePhase = _changePhase.bind(this);
    _populateAffirmation = _populateAffirmation.bind(this);
    _processMystery = _processMystery.bind(this);
    
    //load the sceneManifest file
    utility.loadJSON("./content/scene/sceneManifest.json", dataLoadedCallback.bind(this));
    
    
    //definitions of onclick methods for static UI elements
    //clicking the go arrow will change to the board
    document.getElementById("selectButtonFrame").onclick = function(){
        _changePhase("board");
    }.bind(this);
    document.getElementById("mysteryFrame").onclick = function(){
        _populateMysteryLayer(0);
    }.bind(this);
    document.getElementById("mysteryReturnButton").onclick = function(){
        document.getElementById("mysteryLayer").className = "hiddenLayer";
    }.bind(this);
    document.getElementById("revelationFrame").onclick = function(){
        _populateMysteryLayer(4);
    }.bind(this);
    document.getElementById("mysteryAffirmNo").onclick = function(){
        _populateMysteryLayer(0);
    }.bind(this);
    document.getElementById("mysteryAffirmYes").onclick = function(){
        _processMystery();
    }.bind(this);
    document.getElementById("resultButton").onclick = function(){
        document.getElementById("resultLayer").className = "hiddenLayer";
        document.getElementById("resultContent").className = "hiddenLayer";
        //stuff that makes the title appear
        document.getElementById("titleLayer").className = "";
        document.getElementById("boardUILayer").className = "hiddenElement";
        document.getElementById("evidenceLayer").className = "hiddenElement";
        
        
        
        
        
        //reset variables and stuff
        //boardPhase: the currently loaded JSON file corresponding to the current board
        this.activeBoard = undefined;
        //string: stores current phase. (title, select, board)
        this.phase = "title";
        //bool: whether or not progression is locked by a fade animation
        this.fadeAnimationLock = false;
        //number: duration of time in milliseconds since a fade animation lock was put in place
        this.fadeAnimationLockTimer = -1;
        //array<data>: contains readable game data that will be read from everywhere else in the game
        this.sceneData = undefined;
        //bool: whether or not the necessary data manifests have been fully loaded
        this.sceneDataLoaded = false;
        //array<boardData>: stores board data as it loads so it can be properly passed to scene data
        this.boardDataArray = [];
        //bool: whether it is safe to begin checking for load completion
        this.loadStarted = false;
        //array<data>: contains data corresponding to the scroller array
        this.scrollerData = [];
        //DOM: access to the main gameObject
        this.gameDataReference = document.getElementById("gameData");

        //load the sceneManifest file
        utility.loadJSON("./content/scene/sceneManifest.json", dataLoadedCallback.bind(this));
        
        
        
    }.bind(this);
}

//code execution for when the mysteryAffirm button is clicked
var _processMystery = function(){
    var choice0 = this.gameDataReference.getAttribute("data-mysteryVar0");
    var choice1 = this.gameDataReference.getAttribute("data-mysteryVar1");
    var choice2 = this.gameDataReference.getAttribute("data-mysteryVar2");
    var choice3 = this.gameDataReference.getAttribute("data-mysteryVar3");
    
    //compound this particular combination
    var compoundedChoices = choice1 + "-" + choice2 + "-" + choice3;
    //iterate through the records of the target mystery
    var i;
    var arrayLength = this.sceneData.mysteries[choice0].records.length;
    var flag = true;
    for(i = 0; i < arrayLength; i++){
        if(compoundedChoices === this.sceneData.mysteries[choice0].records[i].value){
            flag = false;
            break;
        }
    }
    
    if(flag === false){
        //queue a notification
        this.activeBoard._notify("This combination of clues has already been considered.");
    }
    else{
        //commit the new compoundedChoices to record
        this.sceneData.mysteries[choice0].records.push( {value: compoundedChoices} );
        
        //check if it's a match to any set of mystery components
        arrayLength = this.sceneData.mysteries[choice0].components.length;
        var targetResponse = -1;
        for(i = 0; i < arrayLength; i++){
            var targetData = this.sceneData.mysteries[choice0].components[i];
            if((targetData.part1 + "") === choice1){
                if((targetData.part2 + "") === choice2){
                    if((targetData.part3 + "") === choice3){
                        targetResponse = i;
                        break;
                    }
                }
            }
        }

        
        //cost of the action here
        if(targetResponse === -1){
            //queue a notification
            //this.activeBoard._notify("A conclusion could not be reached with this combination of evidence.");
            //COST TODO: 
            this.activeBoard._addAction({ "type": "spendTime", "target": { "cost": 1, "notification": "A conclusion could not be reached with this combination of evidence." } });
        }
        else{
            //hide mysteryLayer
            document.getElementById("mysteryLayer").className = "hiddenLayer";
            //queue the actions from the response array
            var targetResults = this.sceneData.mysteries[choice0].components[targetResponse].result;
            arrayLength = targetResults.length;
            for(i = 0; i < arrayLength; i++){
                this.activeBoard._addAction(targetResults[i]);
            }
        }
    }
    
}

//populate the mystery layer depending on parameters
var _populateMysteryLayer = function(populationMode){      
    //reset variables
    document.getElementById("mysteryScrollerOverflow").innerHTML = "";
    try{
        document.getElementById("mysteryScrollerOverflow").scrollTo(0, 0);
    }
    catch(e) { 
        console.log("Current browser version does not accept scrollto function.");
    }
    document.getElementById("mysteryInfoProfile").className = "hiddenElement";
    document.getElementById("mysteryInfoDescription").innerHTML = "";
    document.getElementById("mysteryInfoButton").className = "hiddenElement";
    document.getElementById("mysteryInfoButton").onclick = function(){}
    document.getElementById("mysteryAffirm").className = "hiddenElement";
    
    //establish important variables and iterate through each revelation to generte an array
    var i;
    var arrayLength;
    var combinedArray = [];
    document.getElementById("mysteryScroller").className = "";
    document.getElementById("mysteryInfo").className = "";
    
    //mystery select
    if(populationMode === 0){
        document.getElementById("mysteryTitle").innerHTML = "Crack the Case";
        document.getElementById("mysterySubtitle").innerHTML = "Attempt to solve one of the case's mysteries using clues you have gathered.";
        arrayLength = this.sceneData.mysteries.length;
        for(i = 0; i < arrayLength; i++){
            if(this.sceneData.mysteries[i].visible){
                combinedArray.push(this.sceneData.mysteries[i]);
            }
        }
    }
    //person of interest
    if(populationMode === 1 || populationMode === 4){
        document.getElementById("mysteryTitle").innerHTML = "Person of Interest";
        document.getElementById("mysterySubtitle").innerHTML = this.sceneData.mysteries[this.gameDataReference.getAttribute("data-mysteryVar0")].statement1;
        arrayLength = this.sceneData.revelations[0].length;
        for(i = 0; i < arrayLength; i++){
            if(this.sceneData.revelations[0][i].visible){
                combinedArray.push(this.sceneData.revelations[0][i]);
            }
        }
    }
    //method
    if(populationMode === 2 || populationMode === 4){
        document.getElementById("mysteryTitle").innerHTML = "Method";
        document.getElementById("mysterySubtitle").innerHTML = this.sceneData.mysteries[this.gameDataReference.getAttribute("data-mysteryVar0")].statement2;
        arrayLength = this.sceneData.revelations[1].length;
        for(i = 0; i < arrayLength; i++){
            if(this.sceneData.revelations[1][i].visible){
                combinedArray.push(this.sceneData.revelations[1][i]);
            }
        }
    }
    //motive
    if(populationMode === 3 || populationMode === 4){
        document.getElementById("mysteryTitle").innerHTML = "Motive";
        document.getElementById("mysterySubtitle").innerHTML = this.sceneData.mysteries[this.gameDataReference.getAttribute("data-mysteryVar0")].statement3;
        arrayLength = this.sceneData.revelations[2].length;
        for(i = 0; i < arrayLength; i++){
            if(this.sceneData.revelations[2][i].visible){
                combinedArray.push(this.sceneData.revelations[2][i]);
            }
        }
    }
    //view specific stuff for populationMode 4
    if(populationMode === 4){
        document.getElementById("mysteryTitle").innerHTML = "Important Clues";
        document.getElementById("mysterySubtitle").innerHTML = "Notable clues collected during investigation that may prove vital for cracking the case.";
    }
    
    //if the combined array is empty, populate it with a placeholder
    if(combinedArray.length === 0){
        document.getElementById("mysteryScrollerOverflow").innerHTML = "<p id='mysteryScrollerPlaceholder'>There currently is nothing here. Continue the investigation and search for clues.</p>";
    }
    
    //use the data from the array to populate the scroller
    arrayLength = combinedArray.length;
    for(i = 0; i < arrayLength; i++){
        var targetData = combinedArray[i];
        //declare the new element and set attributes
        var targetElement = document.createElement("div");
        targetElement.setAttribute("class", "mysteryScrollerElement");
        targetElement.setAttribute("data-name", targetData.name);
        targetElement.setAttribute("data-type", targetData.type);
        targetElement.setAttribute("data-description", targetData.description);
        targetElement.setAttribute("data-image", targetData.image);
        targetElement.setAttribute("data-mode", populationMode);
        targetElement.setAttribute("data-indexSelf", targetData.indexSelf);
        document.getElementById("mysteryScroller").className = "";
        document.getElementById("mysteryInfo").className = "";
        
        //configure image
        var mysteryScrollerImage = document.createElement("img");
        mysteryScrollerImage.setAttribute("src", targetData.image);
        targetElement.appendChild(mysteryScrollerImage);
        
        //configure text
        var textContainer = document.createElement("div");
        var textChild = document.createElement("p");
        textChild.appendChild(document.createTextNode(targetData.name));
        textChild.setAttribute("class", "mysteryScrollerElementUpper");
        textContainer.appendChild(textChild);
        
        textChild = document.createElement("p");
        textChild.appendChild(document.createTextNode(targetData.type));
        textChild.setAttribute("class", "mysteryScrollerElementLower");
        textContainer.appendChild(textChild);
        
        targetElement.appendChild(textContainer);
        
        //add click event
        targetElement.onclick = function(){
            //populate data in visual elements
            document.getElementById("mysteryInfoProfile").className = "";
            document.getElementById("mysteryInfoProfileImage").src = this.getAttribute("data-image");
            document.getElementById("mysteryInfoProfileUpper").innerHTML = this.getAttribute("data-name");
            document.getElementById("mysteryInfoProfileLower").innerHTML = this.getAttribute("data-type");
            document.getElementById("mysteryInfoDescription").innerHTML = this.getAttribute("data-description");
            
            
            
            
            //set mysteryInfoButton functionality based on what population step you're on
            if(this.getAttribute("data-mode") !== "4"){
                document.getElementById("mysteryInfoButton").className = "";
                if(this.getAttribute("data-mode") === "0"){
                    document.getElementById("gameData").setAttribute("data-mysteryVar0", this.getAttribute("data-indexSelf"));
                    document.getElementById("mysteryInfoButton").onclick = function(){
                        _populateMysteryLayer(1);
                    } 
                }
                else if(this.getAttribute("data-mode") === "1"){
                    document.getElementById("gameData").setAttribute("data-mysteryVar1", this.getAttribute("data-indexSelf"));
                    document.getElementById("mysteryInfoButton").onclick = function(){
                        _populateMysteryLayer(2);
                    }
                }
                else if(this.getAttribute("data-mode") === "2"){
                    document.getElementById("gameData").setAttribute("data-mysteryVar2", this.getAttribute("data-indexSelf"));
                    document.getElementById("mysteryInfoButton").onclick = function(){
                        _populateMysteryLayer(3);
                    }
                }
                else if(this.getAttribute("data-mode") === "3"){
                    document.getElementById("gameData").setAttribute("data-mysteryVar3", this.getAttribute("data-indexSelf"));
                    document.getElementById("mysteryInfoButton").onclick = function(){
                        //make the affirmation screen appear
                        _populateAffirmation();
                    }
                }
            }
        }
        
        //append the element to the scroller
        document.getElementById("mysteryScrollerOverflow").appendChild(targetElement);
    }    
    
    //make the layer visible
    document.getElementById("mysteryLayer").className = "";
}

//populates a sublayer of the mystery layer with information
var _populateAffirmation = function(){
    //clear out previous elements
    document.getElementById("mysteryScroller").className = "hiddenElement";
    document.getElementById("mysteryInfo").className = "hiddenElement";
    document.getElementById("mysteryTitle").innerHTML = "Affirmation";
    document.getElementById("mysterySubtitle").innerHTML = this.sceneData.mysteries[this.gameDataReference.getAttribute("data-mysteryVar0")].name;
    document.getElementById("mysteryAffirm").className = "";
    //set the various affirim layer variables
    document.getElementById("mysteryAffirmStatement1").innerHTML = this.sceneData.mysteries[this.gameDataReference.getAttribute("data-mysteryVar0")].statement1;
    document.getElementById("mysteryAffirmImage1").src = this.sceneData.revelations[0][this.gameDataReference.getAttribute("data-mysteryVar1")].image;
    document.getElementById("mysteryAffirmUpper1").innerHTML = this.sceneData.revelations[0][this.gameDataReference.getAttribute("data-mysteryVar1")].name;
    document.getElementById("mysteryAffirmLower1").innerHTML = this.sceneData.revelations[0][this.gameDataReference.getAttribute("data-mysteryVar1")].type;
    
    document.getElementById("mysteryAffirmStatement2").innerHTML = this.sceneData.mysteries[this.gameDataReference.getAttribute("data-mysteryVar0")].statement2;
    document.getElementById("mysteryAffirmImage2").src = this.sceneData.revelations[1][this.gameDataReference.getAttribute("data-mysteryVar2")].image;
    document.getElementById("mysteryAffirmUpper2").innerHTML = this.sceneData.revelations[1][this.gameDataReference.getAttribute("data-mysteryVar2")].name;
    document.getElementById("mysteryAffirmLower2").innerHTML = this.sceneData.revelations[1][this.gameDataReference.getAttribute("data-mysteryVar2")].type;
    
    document.getElementById("mysteryAffirmStatement3").innerHTML = this.sceneData.mysteries[this.gameDataReference.getAttribute("data-mysteryVar0")].statement3;
    document.getElementById("mysteryAffirmImage3").src = this.sceneData.revelations[2][this.gameDataReference.getAttribute("data-mysteryVar3")].image;
    document.getElementById("mysteryAffirmUpper3").innerHTML = this.sceneData.revelations[2][this.gameDataReference.getAttribute("data-mysteryVar3")].name;
    document.getElementById("mysteryAffirmLower3").innerHTML = this.sceneData.revelations[2][this.gameDataReference.getAttribute("data-mysteryVar3")].type;
    
}

//reads data from the scene manifest
function dataLoadedCallback(response){
    //populate array with json
    this.sceneData = JSON.parse(response);    
    
    //load individual board data to the sceneData array
    var i;
    var arrayLength = this.sceneData.scenes.length;
    for(i = 0; i < arrayLength; i++){
        this.boardDataArray[i] = new BoardData(this.sceneData.scenes[i].board);
    }
    
    //deal with scroller stuff
    _initializeScroller();
    
    //set a necessary default values in gamedata
    this.gameDataReference.setAttribute("data-mysteryVar0", "0");
    this.gameDataReference.setAttribute("data-caseTime", this.sceneData.caseTime);
    document.getElementById("timeRemainingText").innerHTML = this.gameDataReference.getAttribute("data-caseTime");
    document.getElementById("selectTimeRemainingText").innerHTML = this.gameDataReference.getAttribute("data-caseTime");
    
    //it is safe to start checking that every piece has been loaded
    this.loadStarted = true;
}

function _initializeScroller(){
    //set overflow to nothing to start
    document.getElementById("selectScrollerOverflow").innerHTML = "";
    
    //populate the scrollerarray, but set proper visibility
    //iterate through content array and populate scroller with content
    var scrollerhtml = "";
    var i;
    var arrayLength = this.sceneData.scenes.length;
    for(i = 0; i < arrayLength; i++){
        //set variables local to each individual element
        var targetElement = document.createElement("div");
        targetElement.setAttribute("class", "selectScrollerElement");
        //text
        var scrollerText = document.createElement("p");
        scrollerText.appendChild(document.createTextNode(this.sceneData.scenes[i].name));
        targetElement.appendChild(scrollerText);
        //new tag
        var newTag = document.createElement("p")
        newTag.setAttribute("class", "newTag");
        newTag.appendChild(document.createTextNode("NEW"));
        targetElement.appendChild(newTag);
        //hide if already selected
        if(this.sceneData.scenes[i].visible === 1){
            targetElement.childNodes[1].className = "hiddenElement";
        }
            
        //attributes
        targetElement.setAttribute("data-boardIndex", i);
        targetElement.setAttribute("data-image", this.sceneData.scenes[i].image);
        targetElement.setAttribute("data-name", this.sceneData.scenes[i].name);
        targetElement.setAttribute("data-description", this.sceneData.scenes[i].description);
        targetElement.setAttribute("data-visibility", this.sceneData.scenes[i].visible);
        
        //create onclick function
        targetElement.onclick = function(){
            //get the index assigned to the scroller element
            var targetIndex = this.getAttribute("data-boardIndex");
            //set the master gameData element's value to the target index
            document.getElementById("gameData").setAttribute("data-boardIndex", targetIndex);
            //additionally tell the gameData element that the board preview needs a refresh
            document.getElementById("gameData").setAttribute("data-boardPreviewRefresh", true);
            
            console.log("gameData data-boardIndex set to " + targetIndex);
            //change around visible data based variables stored in the scroller element
            document.getElementById("selectTitle").innerHTML = this.getAttribute("data-name");
            document.getElementById("selectText").innerHTML = this.getAttribute("data-description");
            document.getElementById("selectImage").src = "content/scene/" + this.getAttribute("data-image");
            
            //manage selection
            //set every scroller element to unselected
            var selectionArray = document.getElementsByClassName("selectScrollerElement");
            var i;
            var arrayLength = selectionArray.length;
            for(i = 0; i < arrayLength; i++){
                //set class attribute to default
                selectionArray[i].className = "selectScrollerElement";
                
                //set target element visibility to hidden if necessary
                if(selectionArray[i].getAttribute("data-visibility") === "0"){
                    selectionArray[i].className = selectionArray[i].className + " hiddenElement";
                }
            }
            //make this one selected
            this.setAttribute("class", "selectScrollerElement selected");
            
            //hide the new tag of this particular scrollerElement
            this.childNodes[1].className = "hiddenElement";
        }
        
        this.scrollerData[i] = targetElement;
        
        //add the element to the scroller
        document.getElementById("selectScrollerOverflow").appendChild(targetElement);

    }
}

//passing context, canvas, delta time, center point, usable height, mouse state
Game.prototype.update = function(pCanvasState, pMouseState){
    //wipe the canvas before anything else
    painter.clear(pCanvasState.ctx, 0, 0, pCanvasState.width, pCanvasState.height);
    //change the cursor to default
    document.body.style.cursor = "default";
    
    //ensure that all data is loaded before executing anything
    if(this.sceneDataLoaded){
        if(this.phase === "board" || this.phase === "boardToSelect"){
            //make sure that the fadeAnimationLock is off before attempting to update the active board
            if(this.fadeAnimationLock === false || this.phase === "boardToSelect"){
                //update key variables in the active phase, executing act and draw
                this.activeBoard.update(pMouseState, pCanvasState);
            }
            
        }
        else if(this.phase === "select" || this.phase === "selectToBoard"){
            //draw calls for the select view
            this.drawSelect(pCanvasState);
            //if the game data variable checks denotes that a refresh is required
            if(this.gameDataReference.getAttribute("data-boardPreviewRefresh") === "true"){
                //set the manager variable to false to prevent a additional loops
                this.gameDataReference.setAttribute("data-boardPreviewRefresh", false);
                //get the current index and set it as a reference
                var currentBoardIndex = this.gameDataReference.getAttribute("data-boardIndex");
                
                //populate the preview div here based on sceneData
                var compoundHTML = "";
                var compoundHTML2 = "";
                var i;
                var arrayLength = this.sceneData.scenes[currentBoardIndex].data.evidence.length;
                //iterate and draw the connecting lines
                for(i = 0; i < arrayLength; i++){
                    var currentNode = this.sceneData.scenes[currentBoardIndex].data.evidence[i];
                    if(currentNode.visible){
                        if(currentNode.previous.length > 0){
                            //get mapped coordinates for the current node
                            var previewX = currentNode.previewX;
                            var previewY = currentNode.previewY;
                            //for a node with two parents
                            if(currentNode.previous.length > 1){
                                var previousX1 = this.sceneData.scenes[currentBoardIndex].data.evidence[currentNode.previous[0]].previewX;
                                var previousY1 = this.sceneData.scenes[currentBoardIndex].data.evidence[currentNode.previous[0]].previewY;
                                var previousX2 = this.sceneData.scenes[currentBoardIndex].data.evidence[currentNode.previous[1]].previewX;
                                var previousY2 = this.sceneData.scenes[currentBoardIndex].data.evidence[currentNode.previous[1]].previewY;
                                //draw the connector for the resulting node and the center point of the two previous
                                compoundHTML += "<line x1='" + previewX + "%' y1='" + previewY + "%' x2='" + (previousX1 + previousX2)/2 + "%' y2='" + (previousY1 + previousY2)/2 + "%' class='selectBoardPreviewOutline' />";
                                compoundHTML2 += "<line x1='" + previewX + "%' y1='" + previewY + "%' x2='" + (previousX1 + previousX2)/2 + "%' y2='" + (previousY1 + previousY2)/2 + "%' class='selectBoardPreviewLine' />";
                                //add the two lines connecting the previous together
                                compoundHTML += "<line x1='" + previousX1 + "%' y1='" + previousY1 + "%' x2='" + previousX2 + "%' y2='" + previousY2 + "%' class='selectBoardPreviewOutline' />";
                                compoundHTML2 += "<line x1='" + previousX1 + "%' y1='" + previousY1 + "%' x2='" + previousX2 + "%' y2='" + previousY2 + "%' class='selectBoardPreviewLine' />";
                            }
                            //for a node with one parent
                            else{
                                //set a line from the previous node location to current location
                                var previousX1 = this.sceneData.scenes[currentBoardIndex].data.evidence[currentNode.previous[0]].previewX;
                                var previousY1 = this.sceneData.scenes[currentBoardIndex].data.evidence[currentNode.previous[0]].previewY;
                                compoundHTML += "<line x1='" + previewX + "%' y1='" + previewY + "%' x2='" + previousX1 + "%' y2='" + previousY1 + "%' class='selectBoardPreviewOutline' />";
                                compoundHTML += "<line x1='" + previewX + "%' y1='" + previewY + "%' x2='" + previousX1 + "%' y2='" + previousY1 + "%' class='selectBoardPreviewLine' />";
                                
                            }
                        }
                    }
                }
                document.getElementById("selectBoardPreviewLines").innerHTML = "";
                document.getElementById("selectBoardPreviewLines").innerHTML = compoundHTML;
                document.getElementById("selectBoardPreviewLines").innerHTML += compoundHTML2;
                
                compoundHTML = "";
                //iterate and draw the nodes
                for(i = 0; i < arrayLength; i++){
                    if(this.sceneData.scenes[currentBoardIndex].data.evidence[i].visible){
                        var previewX = this.sceneData.scenes[currentBoardIndex].data.evidence[i].previewX;
                        var previewY = this.sceneData.scenes[currentBoardIndex].data.evidence[i].previewY;
                        compoundHTML += "<div class='selectBoardPreviewNode' style='top: " + previewY + "%; left: " + previewX + "%;'>";
                        compoundHTML+= "<img class='selectBoardPreviewNodeImage' src='" + this.sceneData.scenes[currentBoardIndex].data.evidence[i].image + "'>";
                        compoundHTML += "</div>";
                    }
                }
                document.getElementById("selectBoardPreview").innerHTML = compoundHTML;
            }
            
            
            
        }
        else if(this.phase === "title"){
            this.drawTitle(pCanvasState);
        }

        //handle fade animation locking
        if(this.fadeAnimationLock === true){
            var currentTime = (new Date()).getTime();
            //check and initialize timer if need be
            if(this.fadeAnimationLockTimer === -1){
                this.fadeAnimationLockTimer = currentTime;
            }
            else if (currentTime - this.fadeAnimationLockTimer > 200){
                //sufficient time has passed for the animation to complete, the phase can safely change
                this.fadeAnimationLock = false;
                this.fadeAnimationLockTimer = -1;
                //hide the title layer if it is visible
                document.getElementById("titleLayer").className = "hiddenElement";
                
                //depending on which direction the phases are going, different elements will need to be loaded
                if(this.phase === "boardToSelect" && this.sceneDataLoaded === true){
                    this.phase = "select";
                    

                    //phase in select DOM elements
                    document.getElementById("selectLayer").className = "";
                    //hide board DOM elements
                    document.getElementById("evidenceLayer").className = "hiddenElement";
                    document.getElementById("boardUILayer").className = "hiddenElement";
                    //wipe the canvas
                    painter.clear(pCanvasState.ctx, 0, 0, pCanvasState.width, pCanvasState.height);
                    document.getElementById("fadeBlinder").className = "hiddenLayer";
                }
                else if(this.phase === "selectToBoard"){
                    this.phase = "board"
                    //change visibility of DOM elements
                    document.getElementById("selectLayer").className = "hiddenElement";
                }
                else if(this.phase === "titleToBoard"){
                    this.phase = "board"
                    //change visibility of DOM elements
                    document.getElementById("selectLayer").className = "hiddenElement";
                }
            }
        }
    }
    //if everything is not completely loaded, run this
    else if(this.sceneDataLoaded === false && this.loadStarted === true){
        //parse through boardDataArray and see if everything has loaded
        var flag = true;
        var i;
        var arrayLength = this.boardDataArray.length;
        for(i = 0; i < arrayLength; i++){
            if(this.boardDataArray[i].loaded !== true){
                flag = false;
                break;
            }
        }
        //if this variable remains true, this serves as an initializer for some variables
        if(flag){
            //transfer individual board data to scenes array
            for(i = 0; i < this.boardDataArray.length; i++){
                this.sceneData.scenes[i].data = this.boardDataArray[i].data;
                var j;
                var evidenceArray = this.sceneData.scenes[i].data.evidence
                var evidenceArrayLength = evidenceArray.length;
                for(j = 0; j < evidenceArrayLength; j++){
                    evidenceArray[j].previewX = utility.map(evidenceArray[j].x, -100, 100, 0, 90);
                    evidenceArray[j].previewY = utility.map(evidenceArray[j].y, -100, 100, 0, 90);
                }
            }
            //set loading completion flag to true
            this.sceneDataLoaded = true;
            //wipe the leftover data
            this.boardDataArray = undefined;
            //set the target index of the first board
            this.gameDataReference.setAttribute("data-boardIndex", this.sceneData.initialScene);
            //set the boolean that tracks whether the board preview requires a refresh
            this.gameDataReference.setAttribute("data-boardPreviewRefresh", false);
            //wipe canvas adjust DOM as necessary
            this._changeTitleScreen("title");
        }
        
        //draw loading screen
        this.drawLoading(pCanvasState);
    }
    
}

Game.prototype._changeTitleScreen = function(pTarget){
    if(pTarget === "title"){
        //hide other layers
        document.getElementById("creditLayer").className = "hiddenElement";
        //set DOM data
        document.getElementById("titleLayerSubtitle").innerHTML = this.sceneData.caseName;
        document.getElementById("titleLayerBackground").src = "content/scene/" + this.sceneData.titleLayerBackground;
        //set button interaction
        document.getElementById("titleLayerStartButton").onclick = function(){ 
            //start the phase change process
            _changePhase("board");
        }.bind(this);
        document.getElementById("titleLayerCreditsButton").onclick = function(){ this._changeTitleScreen("credit"); }.bind(this);
        //make the layer visible
        document.getElementById("titleLayer").className = "";
    } else if(pTarget === "credit"){
        //hide other layers
        document.getElementById("titleLayer").className = "hiddenElement";
        //set DOM data
        document.getElementById("creditLayerScenario").innerHTML = this.sceneData.caseName;
        document.getElementById("creditLayerScenarioCredit").innerHTML = this.sceneData.author;
        document.getElementById("creditLayerBackground").src = "content/scene/" + this.sceneData.titleLayerBackground;
        //set button interaction
        document.getElementById("creditLayerReturnButton").onclick = function(){ this._changeTitleScreen("title"); }.bind(this);
        //make the layer visible
        document.getElementById("creditLayer").className = "";
    }
}

var _changePhase = function(pTarget){
    console.log("Executing phase change " + this.phase + " to " + pTarget);
    //catch the target and begin the correct transition phase
    if(this.fadeAnimationLock === false){
        this.fadeAnimationLock = true;
        
        if(pTarget === "select"){
            this.phase = "boardToSelect";
            //set select screen element variables by clicking the active button
            this.scrollerData[this.gameDataReference.getAttribute("data-boardIndex")].click();
        }
        else if(pTarget === "board"){
            //differentiates between ToBoard types. Changes what needs to be loaded
            if(this.phase == "title"){
                this.phase = "titleToBoard";
            }
            else{
                this.phase = "selectToBoard"
            }
            //begin loading the new conspiracy board
            this.activeBoard = new BoardPhase(this.sceneData.scenes[this.gameDataReference.getAttribute("data-boardIndex")], _changePhase.bind(this), this._modifyData.bind(this));
        }
        
        //begin blinder fade in as part of the phase transition
        document.getElementById("fadeBlinder").className = "";
    }
}

//allows a boardData object to change data in the parent level
Game.prototype._modifyData = function(type, target){
    if(type === "unlockBoard"){
        //change scenedata visibility
        this.sceneData.scenes[target].visible = 2;
        //use scenedata to change scroller visibility
        var i;
        var arrayLength = this.sceneData.scenes.length;
        for(i = 0; i < arrayLength; i++){
            this.scrollerData[i].setAttribute("data-visibility", target + "");
        }
        
        //push a notification
        this.activeBoard._notify(this.sceneData.scenes[target].name + " has been added to your destinations.");
    }
    else if(type === "unlockClue"){
        //change the visibility of the target clue
        this.sceneData.revelations[target.array][target.clue].visible = true;
        //push a notification
        this.activeBoard._notify(this.sceneData.revelations[target.array][target.clue].name + " has been added as an important clue.");
    }
    else if(type === "unlockMystery"){
        //change the visibility of the target mystery
        this.sceneData.mysteries[target].visible = true;
        //push a notification
        this.activeBoard._notify("\"" + this.sceneData.mysteries[target].name + "\" has been added to the list of unsolved mysteries.");
    }
    else if(type === "lockMystery"){
        //change the visibility of the target mystery
        this.sceneData.mysteries[target].visible = false;
        this.sceneData.mysteries[target].solved = true;
        
        //push a notification
        this.activeBoard._notify("\"" + this.sceneData.mysteries[target].name + "\" has been solved.");
    }
    else if(type === "updateMystery"){
        //push a notification first before variables have change
        this.activeBoard._notify("Details of \"" + this.sceneData.mysteries[target.index].name + "\" have been updated.");
        
        //check the target object for changed parameters and change if present
        if(target.name !== undefined){
            this.sceneData.mysteries[target.index].name = target.name;
        }
        if(target.description !== undefined){
            this.sceneData.mysteries[target.index].description = target.description;
        }
        if(target.image !== undefined){
            this.sceneData.mysteries[target.index].image = target.image;
        }
        if(target.statement1 !== undefined){
            this.sceneData.mysteries[target.index].statement1 = target.staement1;
        }
        if(target.statement2 !== undefined){
            this.sceneData.mysteries[target.index].statement2 = target.staement2;
        }
        if(target.statement3 !== undefined){
            this.sceneData.mysteries[target.index].statement3 = target.staement3;
        }
    }
    else if(type === "addTime"){
        //add to the caseTime by the target amount
        var resultingTime = parseInt(this.gameDataReference.getAttribute("data-caseTime")) + target;
        this.gameDataReference.setAttribute("data-caseTime", resultingTime);
        document.getElementById("timeRemainingText").innerHTML = this.gameDataReference.getAttribute("data-caseTime");
        document.getElementById("selectTimeRemainingText").innerHTML = this.gameDataReference.getAttribute("data-caseTime");
        
        if(target === 1){
            this.activeBoard._notify("An hour of additional time has been added to the investigation.");
        }
        else{
            this.activeBoard._notify(target + " hours of additional time have been added to the investigation.");
        }
        
    }
    else if(type === "spendTime"){
        //reduce the caseTime by the target amount
        var resultingTime = parseInt(this.gameDataReference.getAttribute("data-caseTime")) - target.cost;
        //prevent it from falling below 0
        if(resultingTime < 0){
            resultingTime = 0;
        }
        this.gameDataReference.setAttribute("data-caseTime", resultingTime);
        document.getElementById("timeRemainingText").innerHTML = this.gameDataReference.getAttribute("data-caseTime");
        document.getElementById("selectTimeRemainingText").innerHTML = this.gameDataReference.getAttribute("data-caseTime");
        
        //check for an accompanying description if there is one
        if(target.notification !== ""){
            this.activeBoard._notify(target.notification);
        }
        
        //if no time is left, add the an endGame event to the end of the event pipeline
        if(resultingTime === 0){
            this.activeBoard._addAction({ "type": "endGame", "target": "timeout" });
        }
    }
    else if(type === "endGame"){
        var flag = true;
        //if caused by timeout, check and see whether any additional time was added since it was assigned
        if(target === "timeout"){
            if(parseInt(this.gameDataReference.getAttribute("data-caseTime")) > 0){
                //end the game via timeout
                flag = false;
            }
        }
        
        //continue with ending the game
        if(flag){
            
            //determine type of outcome based on target and set image
            var resultingStatement;
            if(target === "timeout"){
                resultingStatement = "TIME EXPIRED";
                document.getElementById("resultBackground").src = this.sceneData.failImage;
            }
            else{
                resultingStatement = "CASE CLOSED";
                document.getElementById("resultBackground").src = target;
            }
            //set values of title subtitle
            document.getElementById("resultTitle").innerHTML = this.sceneData.caseName;
            document.getElementById("resultSubtitle").innerHTML = resultingStatement;
            //populate the scroller
            var i;
            var arrayLength = this.sceneData.mysteries.length;
            var compoundHTML = "";
            var mysteryName;
            var mysteryImage;
            var mysteryStatus;
            var targetMystery;
            
            //iterate through mysteries and populate the scroller
            for(i = 0; i < arrayLength; i++){
                targetMystery = this.sceneData.mysteries[i];
                //determine left side
                if(targetMystery.solved === true){
                    mysteryName = targetMystery.name;
                    mysteryImage = targetMystery.image;
                }
                else if(targetMystery.visible === false){
                    mysteryName = "????";
                    mysteryImage = "content/ui/hidden.png";
                }
                else{
                    mysteryName = targetMystery.name;
                    mysteryImage = targetMystery.image;
                }
                if(targetMystery.solved){
                    mysteryStatus = "Solved";
                }
                else{
                    mysteryStatus = "Unsolved"
                }
                //compound data
                compoundHTML += "<div class='resultScrollerDivider'><div class='resultScrollerProfileContainer'><div class='resultScrollerProfile'><img src='" + mysteryImage + "'><p>" + mysteryName + "</p></div><p class='resultScrollerStatus'>" + mysteryStatus + "</p></div></div>";
            }
            document.getElementById("resultScroller").innerHTML = compoundHTML;
            document.getElementById("resultLayer").className = "";
            
            setTimeout(function(){
                document.getElementById("resultContent").className = "";
            }, 2000);
            
        }
    }
}

Game.prototype.drawSelect = function(canvasState){
    
}

Game.prototype.drawTitle = function(canvasState){
    
}

Game.prototype.drawLoading = function(canvasState){
    canvasState.ctx.save();
    //wipe the canvas to start a new frame
    painter.clear(canvasState.ctx, 0, 0, canvasState.width, canvasState.height);
    canvasState.ctx.rect(0,0,canvasState.width,canvasState.height);
    canvasState.ctx.fillStyle = "black";
    canvasState.ctx.fill();
    
    //text
    canvasState.ctx.font = (canvasState.height/10) + "px Arial";
    canvasState.ctx.textBaseline = "middle";
    canvasState.ctx.textAlign = "center";
    canvasState.ctx.fillStyle = "white";
    canvasState.ctx.fillText("Loading...", canvasState.center.x, canvasState.center.y);
    
    canvasState.ctx.restore();
}

module.exports = Game;
},{"./libraries/Drawlib.js":9,"./libraries/Utilities.js":10,"./phases/BoardData.js":12,"./phases/BoardPhase.js":13}],3:[function(require,module,exports){
"use strict";
function Point(pX, pY){
    this.x = pX;
    this.y = pY;
}

module.exports = Point;
},{}],4:[function(require,module,exports){
//Contains canvas related variables in a single easy-to-pass object
"use strict";
//import point
var Point = require('../common/Point.js');

function CanvasState(ctx, center, width, height){
    this.ctx = ctx;
    this.center = center;
    this.relativeCenter = new Point(width - ((width * .8) / 2), height / 2);
    this.relativeWidth = width * .8;
    this.width = width;
    this.height = height;
    
    if(this.width > this.height){
        this.evidenceFrameSize = this.height / 8;
    } else{
        this.evidenceFrameSize = this.width / 8;
    }
}

CanvasState.prototype.update = function(ctx, center, width, height){
    this.ctx = ctx;
    this.center = center;
    this.relativeCenter = new Point(width - ((width * .8) / 2), height / 2);
    this.relativeWidth = width * .8;
    this.width = width;
    this.height = height;
    
    if(this.width > this.height){
        this.evidenceFrameSize = this.height / 8;
    } else{
        this.evidenceFrameSize = this.width / 8;
    }
}

module.exports = CanvasState;
},{"../common/Point.js":3}],5:[function(require,module,exports){
//contains vareiables relating to state and save information
"use strict";
//scene is where you are located in the investigation
//scene evidence is essentially your progress in the current scene
//key evidence is your progress overall
function GameState(scene, sceneEvidence, keyEvidence){
    //the location where your characters are located
    this.scene = scene;
    
    //key evidence array, the evidence and revelations that carry between scenes
    this.keyEvidence = keyEvidence;
    
    //scene evidence array of arrays, the evidence that is specific to particular scenes
    this.sceneEvidence = sceneEvidence;
}

module.exports = GameState;
},{}],6:[function(require,module,exports){
//keeps track of mouse related variables.
//calculated in main and passed to game
//contains up state
//position
//relative position
//on canvas
"use strict";
function MouseState(pPosition, pRelativePosition, pMouseDown, pMouseIn, pWheelDelta){
    this.position = pPosition;
    this.relativePosition = pRelativePosition;
    this.mouseDown = pMouseDown;
    this.mouseIn = pMouseIn;
    this.wheelDelta = pWheelDelta;
    
    //tracking previous mouse states
    this.lastPosition = pPosition;
    this.lastRelativePosition = pRelativePosition;
    this.lastMouseDown = pMouseDown;
    this.lastMouseIn = pMouseIn;
    this.lastWheelDelta = pWheelDelta
}

MouseState.prototype.update = function(pPosition, pRelativePosition, pMouseDown, pMouseIn, pWheelDelta){
    this.lastPosition = this.position;
    this.lastRelativePosition = this.relativePosition;
    this.lastMouseDown = this.mouseDown;
    this.lastMouseIn = this.mouseIn;
    this.lastWheelDelta = this.wheelDelta;
    
    
    this.position = pPosition;
    this.relativePosition = pRelativePosition;
    this.mouseDown = pMouseDown;
    this.mouseIn = pMouseIn;
    this.wheelDelta = pWheelDelta;
}

module.exports = MouseState;
},{}],7:[function(require,module,exports){
arguments[4][2][0].apply(exports,arguments)
},{"./libraries/Drawlib.js":9,"./libraries/Utilities.js":10,"./phases/BoardData.js":12,"./phases/BoardPhase.js":13,"dup":2}],8:[function(require,module,exports){
"use strict";
function Drawlib(){
}

Drawlib.prototype.clear = function(ctx, x, y, w, h) {
    ctx.clearRect(x, y, w, h);
}

Drawlib.prototype.rect = function(ctx, x, y, w, h, fillColor, strokeColor, strokeWidth) {
    ctx.save();
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
}

Drawlib.prototype.line = function(ctx, x1, y1, x2, y2, thickness, color) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = thickness;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();
}

Drawlib.prototype.circle = function(ctx, x, y, radius, color, filled, lineWidth){
    ctx.save();
    ctx.beginPath();
    ctx.arc(x,y, radius, 0, 2 * Math.PI, false);
    if(filled){
        ctx.fillStyle = color;
        ctx.fill(); 
    }
    else{
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        ctx.stroke();
    }
    ctx.restore();
}

//solution based on https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
Drawlib.prototype.roundedRectangle = function(ctx, x, y, w, h, r, fillColor, strokeColor, lineWidth){
    ctx.save();
    //set colors
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.lineWidth = lineWidth;
    
    //if only a single number is given as a parameter for radius, generates object with full parameter set
    if (typeof r === 'number') {
        r = {tl: r, tr: r, br: r, bl: r};
    } else {
        var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
        for (var side in defaultRadius) {
            r[side] = r[side] || defaultRadius[side];
        }
    }
    ctx.beginPath();
    ctx.moveTo(x + r.tl, y);
    ctx.lineTo(x + w - r.tr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
    ctx.lineTo(x + w, y + h - r.br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
    ctx.lineTo(x + r.bl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
    ctx.lineTo(x, y + r.tl);
    ctx.quadraticCurveTo(x, y, x + r.tl, y);
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

Drawlib.prototype.ellipse = function(ctx, x, y, w, h, fillColor, strokeColor, lineWidth){
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.lineWidth = lineWidth;
    
    ctx.beginPath();
    ctx.ellipse(x, y, w/2, h/2, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

Drawlib.prototype.pushpin = function(ctx, x, y, frameSize, type){
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(20*Math.PI / 180);
    //normal type
    if(type === 0){
        this.rect(ctx, -frameSize/40, -frameSize/20, frameSize/25, frameSize/10, "darkgray", "black", 0);
        this.ellipse(ctx, 0, -frameSize/13, frameSize/4, frameSize/6, "#0000ff", "#9999ff", frameSize/80);
        this.ellipse(ctx, 0, -frameSize/12, frameSize/8, frameSize/12, "#000090", "transparent", 0);
        this.rect(ctx, -frameSize/16, -5*frameSize/24, frameSize/8, frameSize/8, "#000090", "transparent", 0);
        this.ellipse(ctx, 0, -5*frameSize/24, 3*frameSize/16, 3*frameSize/24, "#0000ff", "#9999ff", frameSize/80);
    }
    //revelation type
    else if(type === 1){
        this.rect(ctx, -frameSize/40, -frameSize/20, frameSize/25, frameSize/10, "darkgray", "black", 0);
        this.ellipse(ctx, 0, -frameSize/13, frameSize/4, frameSize/6, "#ed0202", "#ff9999", frameSize/80);
        this.ellipse(ctx, 0, -frameSize/12, frameSize/8, frameSize/12, "#900000", "transparent", 0);
        this.rect(ctx, -frameSize/16, -5*frameSize/24, frameSize/8, frameSize/8, "#900000", "transparent", 0);
        this.ellipse(ctx, 0, -5*frameSize/24, 3*frameSize/16, 3*frameSize/24, "#ed0202", "#ff9999", frameSize/80);
    }
    
    
    ctx.restore();
}

module.exports = Drawlib;
},{}],9:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"dup":8}],10:[function(require,module,exports){
"use strict";
var Point = require('../common/Point.js');

function Utilities(){
}

//BOARDPHASE - set a status value of a node in localStorage based on ID
Utilities.prototype.setProgress = function(pObject){
    var progressString = localStorage.progress;
    
    var targetObject = pObject;
    //make accomodations if this is an extension node
    var extensionflag = true;
    while(extensionflag){
        if(targetObject.type === "extension"){
            targetObject = targetObject.connectionForward[0];
        }
        else{
            extensionflag = false;
        }
    }
    
    var objectID = targetObject.data._id;
    var objectStatus = targetObject.status;
    
    //search the progressString for the current ID
    var idIndex = progressString.indexOf(objectID);
    
    //if it's not add it to the end
    if(idIndex === -1){
        progressString += objectID + "" + objectStatus + ",";
    }
    //otherwise modify the status value
    else{
        progressString = progressString.substr(0, objectID.length + idIndex) + objectStatus + progressString.substr(objectID.length + 1 + idIndex, progressString.length) + "";
    }
    localStorage.progress = progressString;
}

//returns mouse position in local coordinate system of element
Utilities.prototype.getMouse = function(e){
    return new Point((e.pageX - e.target.offsetLeft), (e.pageY - e.target.offsetTop));
}

Utilities.prototype.map = function(value, min1, max1, min2, max2){
    return min2 + (max2 - min2) * ((value - min1) / (max1 - min1));
}

//limits the upper and lower limits of the parameter value
Utilities.prototype.clamp = function(value, min, max){
    return Math.max(min, Math.min(max, value));
}

//checks mouse collision on canvas
Utilities.prototype.mouseIntersect = function(pMouseState, pElement, pFrameSize){
    //check x collision
    if(pMouseState.relativePosition.x > (pElement.position.x - pFrameSize/2) && pMouseState.relativePosition.x < (pElement.position.x + pFrameSize/2)){
        //if the y position collides
        if(pMouseState.relativePosition.y > (pElement.position.y - (6*pFrameSize)/10) && pMouseState.relativePosition.y < (pElement.position.y + (pFrameSize)/2)){
            pElement.mouseOver = true;
        } else{
            pElement.mouseOver = false;
        }
    } else{
        pElement.mouseOver = false;
    }
}

//loads an external file from JSON
Utilities.prototype.loadJSON = function(location, cFunction) { 
    console.log("loading JSON at " + location);
    
    //declare the request
    var xhr = new XMLHttpRequest();
    
    //assign the url to be opened
    xhr.open("GET", location, true);
    
    //tell the request what it needs to do when the state changes.
    //each step of the request will fire this, but only when it's totally ready will it send
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            //feed the data back into the callback
            cFunction(xhr.responseText);
        }
    };
    
    //set everything in motion, it will take a short period of time to load
    xhr.send();
 }

module.exports = Utilities;
},{"../common/Point.js":3}],11:[function(require,module,exports){
"use strict";
var Utilities = require('../libraries/Utilities.js');
var Sprite = require('./Sprite.js');

var painter;
var utility;

//parameters for initial settings
function Actor(pName){
    utility = new Utilities();
    
    //bool: whether all of the assets have been loaded or not
    this.loaded = false;
    //string: the name of the character tied to this actor object
    this.name = pName;
    //array<sprite>: contains all of the expression sprites for the actor
    this.sprites = [];
    //number: the index of the current expression
    this.index = 0;
    //bool: whether the actor is currently being drawn to the canvas
    this.active = false;
    //number: percent -100 to 100 referring to horizontal position on the screen
    this.position = 0;
    //bool: whether or not the actor is currently the center of attention
    this.focus = false;
    //JSON: object containing variables imported from expressions.js corresponding to this actor
    this.data;
    //bool: whether it is ready to check load status. Doing so too early can make events fire out of order
    this.checkReady = false;
    
    //tells the function where the data is and passes a callback that can be used with loading
    utility.loadJSON("./content/actor/" + this.name + "/expressions.js", _dataLoadedCallback.bind(this));
}

//fire on JSON read completion
//load JSON corresponding to the dialogue sequence
var _dataLoadedCallback = function(pResponse){
    this.data = JSON.parse(pResponse);
    
    //now that the dataset is loaded, the image uris can be loaded
    for(var i = 0; i < this.data.expressions.length; i++){
        this.sprites.push(new Sprite(this.data.expressions[i].type, this.name, this.checkSpriteStatus.bind(this)));
    }
    this.checkReady = true;
}

//modify variables that change the appearance of the actor when drawn
Actor.prototype.update = function(pIndex, pActive, pPosition){
    this.index = pIndex;
    this.active = pActive;
    this.position = pPosition;
}

Actor.prototype.checkSpriteStatus = function(){
    this.loaded = true;
    for(var i = 0; i < this.sprites.length; i++){
        if(this.sprites[i].loaded === false){
            this.loaded = false;
            //console.log(this.name + " sprites not loaded yet");
            break;  
        }
    }
}

//draw the scene
Actor.prototype.draw = function(canvasState){
    //makes sure that the assets are loaded before attempting to draw them
    if(this.loaded){
        canvasState.ctx.save();
        
        this.sprites[this.index].draw(canvasState, this.position, this.active, this.focus);
        
        canvasState.ctx.restore();
    }
};

module.exports = Actor;
},{"../libraries/Utilities.js":10,"./Sprite.js":18}],12:[function(require,module,exports){
"use strict";
var Utilities = require('./../libraries/Utilities.js');
var utility;

//constructor
function BoardData(target){
    //helper library declarations
    utility = new Utilities();
    
    //bool: whether this asset has loaded or not
    this.loaded = false;
    //json: data for conspiracy board
    this.date;
    
    
    utility.loadJSON("./content/interaction/" + target + ".json", _loadData.bind(this));
}

//reads data and commits to evidence array
function _loadData(response){
    this.data = JSON.parse(response);
    
    this.loaded = true;
}

module.exports = BoardData;
},{"./../libraries/Utilities.js":10}],13:[function(require,module,exports){
"use strict";
var Point = require('../common/Point.js');
var DrawLib = require('../libraries/DrawLib.js');
var Utilities = require('../libraries/Utilities.js');
var EvidenceNode = require('./EvidenceNode.js');
var Dialogue = require('./Dialogue.js');

var utility;
var painter;

function BoardPhase(pBoardData, incomingBoardSelector, incomingExternalModifier){
    //instantiate libraries
    painter = new DrawLib();
    utility = new Utilities();
    
    //parameter storage
    
    //JSON: data specific to this board
    this.boardData = pBoardData
    //function: imported function that allows the switching of boards
    this.boardSelectorFunction = incomingBoardSelector;
    //function: imported function that allows the modification of external data (revelation, board unlock)
    this.externalModifierFunction = incomingExternalModifier;
    
    //bool: if the first visit variable has no value, initialize properly
    if(this.boardData.firstVisit === undefined){
        console.log("This is the first time " + this.boardData.name + " has been visited");
        this.boardData.firstVisit = true;
    }
    //bool: whether or not the first loop has been executed
    this.firstLoop = true;
    //array<EvidenceNode>: array of all the evidence nodes visible on the board
    this.evidence = [];
    //string: serves as a pseudo enum that stores the current phase
    this.mode = "board";
    //object: stores the object that the mouse is hovering over based on collision checks. 0 when nothing is targeted
    this.mouseTarget = 0;
    //object: contains a pipeline of seqential instructions to be read and executed in order based on player input
    this.actionArray = [];
    //object: references the node from which a click and drag operation has begun. 0 when nothing is targeted
    this.originNode = 0;
    //bool: whether a notification is currently being displayed
    this.notification = false;
    //object: container for the active dialogue
    this.activeDialogue;
    //bool: whether or not progression is locked by a fade animation
    this.fadeAnimationLock = false;
    //number: duration of time in milliseconds since a fade animation lock was put in place
    this.fadeAnimationLockTimer = -1;
    //image: the repeating texture for the board
    this.boardTexture = new Image();
    //pattern: the boardTexture converted to a pattern
    this.boardTexturePattern;
    //image: the repeating texture for the yarn
    this.yarnTexture = new Image();
    //pattern: the yarn texture converted to a pattern
    this.yarnTexturePattern;
    //bool: whether or not texture assets have been converted to patterns
    this.patternConversion = false;
    //number: the dimensions of the evidence frames
    this.evidenceFrameSize = 0;
    //number: index of the next node to be focused
    //this.boardData.focusTarget;
    
    
    //attach the termination event to the notification layer
    document.getElementById("notificationLayer").onclick =  this._terminateNotification.bind(this);
    
    
    //loadCallback for board texture
    this.boardTexture.addEventListener('load', _loadBoardTexture.bind(this), false);
    this.boardTexture.src = "./content/ui/board.jpg";
    this.yarnTexture.addEventListener('load', _loadYarnTexture.bind(this), false);
    this.yarnTexture.src = "./content/ui/yarn.png";
    
    //things previously done in the data loaded callback can now be done here
    //load evidence array
    var i;
    var arrayLength = this.boardData.data.evidence.length;
    for(i = 0; i < arrayLength; i++){
        this.evidence.push(new EvidenceNode(this.boardData.data.evidence[i], this._addAction.bind(this), this._setFocus.bind(this)));
    }
    //set title field
    document.getElementById("boardTitleText").innerHTML = this.boardData.data.boardName;
    //set the shift focus click event
    document.getElementById("boardTitleInnerFrame").onclick = function(){
        this.boardSelectorFunction("select");
    }.bind(this);
    
}

//callback function that loads the board texture once
var _loadBoardTexture = function(e){
    this.boardTexture = e.target;
}
var _loadYarnTexture = function(e){
    this.yarnTexture = e.target;
}

//attached to the click event of the notication layer, closes notification
BoardPhase.prototype._terminateNotification = function(){
    this.notification = false;
    document.getElementById("notificationLayer").className = "hiddenLayer";
    
    //forcibly call the mousemove function to update the position of the mouse
    document.querySelector('canvas').dispatchEvent(new Event('mousemove'));
}

//updates state variables from the highest level
BoardPhase.prototype.update = function(mouseState, canvasState){
    //console.dir(mouseState.position.x + ", " + mouseState.position.y);
    //complete denotes whether or not the particular texture has fully loaded
    if(this.boardTexture.complete && this.yarnTexture.complete) {
        //update frame size variable so it can be used in collision calculation
        this.evidenceFrameSize = canvasState.evidenceFrameSize;
        
        //execute extra code if this is the first loop
        if(this.firstLoop){
            
            //if this is the first visit, do the first time dialogue
            if(this.boardData.firstVisit === true){
                //create an array of actions from the openingActions in the data
                var i;
                var arrayLength = this.boardData.data.openingActions.length;
                for(i = 0; i < arrayLength; i++){
                    this._addAction(this.boardData.data.openingActions[i]);
                }
                this.boardData.firstVisit = false;
            }
            else{
                //otherwise fade out the fade blinder and everything will proceed as normal
                document.getElementById("fadeBlinder").className = "hiddenLayer";
                document.getElementById("boardUILayer").className = "";
            }
            
            //begin by clicking the board's focus target
            this.evidence[this.boardData.focusTarget].click();
            
            this.firstLoop = false;
        }
        
        //modify variables
        this.act(mouseState);
        //draw elements
        this.draw(canvasState, mouseState);
    }
    else {
        //loading screen elements
        canvasState.ctx.save();
        canvasState.ctx.font = "40px Arial";
        canvasState.ctx.textBaseline = "middle";
        canvasState.ctx.textAlign = "center";
        canvasState.ctx.fillText("Loading...", canvasState.center.x, canvasState.center.y);
        canvasState.ctx.restore();
    }
}

//method called remotely from evidence node to add actions to the action array
BoardPhase.prototype._addAction = function(importedJSON){
    this.actionArray.push(importedJSON);
}
BoardPhase.prototype._setFocus = function(index){
    this.boardData.focusTarget = parseInt(index);
}

//called to check connections between 2 nodes and handle the results
BoardPhase.prototype._connect = function(node1, node2){
    this.mouseTarget = 0;
    if(node1.data.connection.includes(node2.data.num)){
        console.log("This is a repeated connection");
        //check whether it is successful connection
        //or a failed connection
        
        var interactionFound = false;
        //iterate through each possible interaction
        var i;
        var arrayLength = node1.data.interactions.length;
        for(i = 0; i < arrayLength; i++){
            if(node1.data.interactions[i].target === node2.data.num){
                //iterate through the interaction's result loop
                var j;
                var arrayLengthJ = node1.data.interactions[i].result.length;
                for(j = 0; j < arrayLengthJ; j++){
                    interactionFound = true;
                    node2.mouseOver = false;
                }
                //the interaction was found, so the for loop can be broken
                break;
            }
        }
        if(!interactionFound){
            //fires if absolutely nothing happens after connecting the two
           this._notify("Connection already attempted.");
        }
        else{
            this._notify("Connection already made.");
        }
    }
    //the connection is NEW
    else{
        node1.data.connection.push(node2.data.num);
        node2.data.connection.push(node1.data.num);
        
        var interactionFound = false;
        //iterate through each possible interaction
        var i;
        var arrayLength = node1.data.interactions.length;
        for(i = 0; i < arrayLength; i++){
            if(node1.data.interactions[i].target === node2.data.num){
                //iterate through the interaction's result loop
                var j;
                var arrayLengthJ = node1.data.interactions[i].result.length;
                for(j = 0; j < arrayLengthJ; j++){
                    this._addAction(node1.data.interactions[i].result[j]);
                    interactionFound = true;
                    node2.mouseOver = false;
                }
                //the interaction was found, so the for loop can be broken
                break;
            }
        }
        if(!interactionFound){
            //fires if absolutely nothing happens after connecting the two
            //this._notify("A connection could not be made.");
            //COST TODO: work in progress
            this._addAction({ "type": "spendTime", "target": { "cost": 1, "notification": "A connection could not be made." } });
        }
    }
                
    
    
}

//inserts an active notification
BoardPhase.prototype._notify = function(message){
    //set notification variable
    this.notification = true;
    //set notification text
    document.getElementById("notificationText").innerHTML = message;
    //make notification layer visible
    document.getElementById("notificationLayer").className = "";
}

//called when an action has finished executing, removes action and executes cleanup if last in array
BoardPhase.prototype._actionCleanup = function(){
    this.actionArray.splice(0,1);
    try{
        this.evidence[this.boardData.focusTarget].click();
    }
    catch(e){
        console.log("There was a problem selecting the focus target");
    }
}

//called every loop and processes action queue
BoardPhase.prototype.act = function(mouseState){
    //an active notification takes precedence over all else
    if(this.notification === false){
        //goes through each item in the action queue and processes them one by one
        if(this.actionArray.length > 0){
            //the array contains unresolved actions that need to be processed
            if (this.actionArray[0].type === "dialogue"){
                //dialogue advancement and handling
                //check and see if dialogue is loaded at all
                if(this.actionArray[0].initStatus === undefined){
                    //flag the object as having been initialized
                    this.actionArray[0].initStatus = "initialized";
                    //load dialogue data into object
                    this.activeDialogue = new Dialogue(this.actionArray[0].target);
                    
                    //blinder fade in as part of transition
                    if(this.fadeAnimationLock === false){
                        this.fadeAnimationLock = true;
                        document.getElementById("fadeBlinder").className = "";
                    }
                }
                else if(this.actionArray[0].initStatus === "initialized"){
                    //allow dialogue to act and load
                    this.activeDialogue.act();
                    
                    //wait for load before
                    if(this.activeDialogue.allLoaded && this.fadeAnimationLock === false){
                        document.getElementById("fadeBlinder").className = "hiddenLayer";
                        //document.getElementById("fadeBlinder").className = "";
                        //hide the evidence menu
                        document.getElementById("evidenceLayer").className = "hiddenElement";
                        document.getElementById("boardUILayer").className = "hiddenElement";
                        //change mode to dialogue
                        this.mode = "dialogue";
                        this.actionArray[0].initStatus = "fullyLoaded";
                    } 
                }
                else if(this.actionArray[0].initStatus === "fullyLoaded"){
                    this.activeDialogue.act();
                    //check dialogue completion
                    if(this.activeDialogue.complete === true){
                        this.fadeAnimationLock = true;
                        //fade the blinder in now that everythings has wrapped up
                        document.getElementById("fadeBlinder").className = "";
                        this.actionArray[0].initStatus = "terminating";
                    }  
                }
                else if(this.actionArray[0].initStatus === "terminating"){
                    if(this.fadeAnimationLock === false){
                        //fade the blinder out now that it has had a chance to fade in completely
                        document.getElementById("fadeBlinder").className = "hiddenLayer";
                        //the ui layer can return to visibility as well
                        document.getElementById("boardUILayer").className = "";
                        this._actionCleanup();
                        this.mode = "board";
                    }
                }
            }
            else if (this.actionArray[0].type === "unlockEvidence"){
                //unveil the corresponding evidence
                this.evidence[this.actionArray[0].target].data.visible = true;
                //set focus target to the index of the unlocked evidence
                this.boardData.focusTarget = this.actionArray[0].target;
                //push notification
                this._notify(this.evidence[this.actionArray[0].target].data.name + " has been added to the board.");
                //execute cleanup
                this._actionCleanup();
            }
            else if (this.actionArray[0].type === "unlockBoard"){
                //unlock the corresponding scene
                this.externalModifierFunction("unlockBoard", this.actionArray[0].target);
                //advance the actionArray
                this._actionCleanup();
            }
            else if (this.actionArray[0].type === "unlockClue"){
                //unlock the corresponding clue
                this.externalModifierFunction("unlockClue", this.actionArray[0].target);
                //advance the actionArray
                this._actionCleanup();
            }
            else if (this.actionArray[0].type === "unlockMystery"){
                //unlock the corresponding mystery
                this.externalModifierFunction("unlockMystery", this.actionArray[0].target);
                //advance the actionArray
                this._actionCleanup();
            }
            else if (this.actionArray[0].type === "lockMystery"){
                //lock the corresponding mystery
                this.externalModifierFunction("lockMystery", this.actionArray[0].target);
                //advance the actionArray
                this._actionCleanup();
            }
            else if (this.actionArray[0].type === "updateMystery"){
                //update the corresponding mystery
                this.externalModifierFunction("updateMystery", this.actionArray[0].target);
                //advance the actionArray
                this._actionCleanup();
            }
            else if (this.actionArray[0].type === "addTime"){
                //add the specified amount of time
                this.externalModifierFunction("addTime", this.actionArray[0].target);
                //advance the actionArray
                this._actionCleanup();
            }
            else if (this.actionArray[0].type === "spendTime"){
                //spend the specified amount of time
                this.externalModifierFunction("spendTime", this.actionArray[0].target);
                //check and see just how much time remains, add endGame if time is fully consumed
                //advance the actionArray
                this._actionCleanup();
            }
            else if (this.actionArray[0].type === "endGame"){
                //populate the results screen
                this.externalModifierFunction("endGame", this.actionArray[0].target);
                //advance the actionArray
                this._actionCleanup();
            }
            else {
                console.log("Action array parse error: " + this.actionArray[0].type + " unknown");
            }
        }
        else if(this.actionArray.length === 0) {
            //GUIDE: processes mouse actions
            //check for collisions by iterating through every node and comparing against the relative mouse position
            var targetAcquired = false;
            var i;
            var arrayLength = this.evidence.length;
            for(i = 0; i < arrayLength; i++){
                if(this.evidence[i].data.visible){
                    utility.mouseIntersect(mouseState, this.evidence[i], this.evidenceFrameSize);
                    //set the mouse target to the object and break if collision is detected
                    if(this.evidence[i].mouseOver === true){
                        this.mouseTarget = this.evidence[i];
                        targetAcquired = true;
                        break;
                    }
                }
            }
            //if there is no collision, set mousetarget to 0
            if(targetAcquired !== true){
               this.mouseTarget = 0;
            }
            //when the mouse button goes from up to down
            if(mouseState.lastMouseDown === false && mouseState.mouseDown === true){
                //if the mouse is hovering over a node, that node is marked as the origin node
                if(this.mouseTarget !== 0){
                   this.originNode = this.mouseTarget;
                }
            }
            //when the mouse button goes from down to up
            if(mouseState.lastMouseDown === true && mouseState.mouseDown === false){
                //if the mouse is hovering over a node
                if(this.mouseTarget !== 0){
                    //if origin node is assigned
                    if(this.originNode !== 0){
                        //if the mouse hasn't moved beyond the origin node
                        if(this.originNode === this.mouseTarget){
                            //activates click method on the target
                            this.mouseTarget.click();
                        } else{
                            //check for connection
                            this._connect(this.originNode, this.mouseTarget);
                        }
                    }
                }
                else{
                    if(this.originNode === 0){
                        //when the mouse is clicked while nothing is targeted
                    }
                }
                //at this point any drag operation has ended
                this.originNode = 0;
            }
        }
    }
    
    //handle animation locking
    if(this.fadeAnimationLock === true){
        var currentTime = (new Date()).getTime();
        //check and initialize timer if need be
        if(this.fadeAnimationLockTimer === -1){
            this.fadeAnimationLockTimer = currentTime;
        }
        else if (currentTime - this.fadeAnimationLockTimer > 200){
            this.fadeAnimationLock = false;
            this.fadeAnimationLockTimer = -1;
        }
    }
    
    var originNodePrintContent = 0;
    if(this.originNode !== 0){
       this.originNodePrintContent = this.originNode.data.name;
    }
}

//draws board, dialogue, and transitions as necessary
BoardPhase.prototype.draw = function(canvasState, mouseState){
    //convert textures to patterns
    if(this.patternConversion === false){
        this.boardTexturePattern = canvasState.ctx.createPattern(this.boardTexture,"repeat");
        this.yarnTexturePattern = canvasState.ctx.createPattern(this.yarnTexture,"repeat");
        this.patternConversion = true;
    }
    
    if(this.mode === "board"){
        this._drawBoard(canvasState, mouseState);
    }
    else if(this.mode === "dialogue"){
        this._drawDialogue(canvasState);
    }
    else if(this.mode === "switch"){
              
    }
}

BoardPhase.prototype._drawDialogue = function(canvasState){
    canvasState.ctx.save();
    canvasState.ctx.translate(canvasState.center.x, canvasState.center.y);
    
    this.activeDialogue.draw(canvasState);
    canvasState.ctx.restore();
}
//draw calls to that make the conspiracy board appear
BoardPhase.prototype._drawBoard = function(canvasState, mouseState){
    //draw backdrop elements
    canvasState.ctx.save();
    //wipe the canvas to start a new frame
    painter.clear(canvasState.ctx, 0, 0, canvasState.width, canvasState.height);
    //specify and draw a rectangle using the pattern
    canvasState.ctx.rect(0,0,canvasState.width,canvasState.height);
    canvasState.ctx.fillStyle = this.boardTexturePattern;
    canvasState.ctx.fill();
    canvasState.ctx.restore();
    
    //draw everything that goes on the board
    canvasState.ctx.save();
    //make the relative center 0,0 in the coordinate grid
    canvasState.ctx.translate(canvasState.relativeCenter.x, canvasState.relativeCenter.y);
    
    //go through the evidence array one by one and draw nodes
    var i;
    var arrayLength = this.evidence.length;
    for(i = 0; i < arrayLength; i++){
        if(this.evidence[i].data.visible){
            this.evidence[i].draw(canvasState);
        }
    }

    //draw the connecting lines
    var i;
    var arrayLength = this.evidence.length;
    for(i = 0; i < arrayLength; i++){
        if(this.evidence[i].data.visible){
            //draw connection lines between evidence if they exist
            if(this.evidence[i].data.previous.length === 1){
                painter.line(
                    canvasState.ctx,
                    this.evidence[this.evidence[i].data.previous[0]].position.x,
                    this.evidence[this.evidence[i].data.previous[0]].position.y - this.evidenceFrameSize/2,
                    this.evidence[i].position.x,
                    this.evidence[i].position.y - this.evidenceFrameSize/2,
                    this.evidenceFrameSize/20,
                    this.yarnTexturePattern
                );
            }
            else if(this.evidence[i].data.previous.length === 2){
                var junction = new Point(
                    (this.evidence[this.evidence[i].data.previous[0]].position.x + this.evidence[this.evidence[i].data.previous[1]].position.x)/2,
                    (this.evidence[this.evidence[i].data.previous[0]].position.y - this.evidenceFrameSize/2 + this.evidence[this.evidence[i].data.previous[1]].position.y - this.evidenceFrameSize/2)/2);
                painter.line(
                    canvasState.ctx,
                    this.evidence[this.evidence[i].data.previous[0]].position.x,
                    this.evidence[this.evidence[i].data.previous[0]].position.y - this.evidenceFrameSize/2,
                    this.evidence[this.evidence[i].data.previous[1]].position.x,
                    this.evidence[this.evidence[i].data.previous[1]].position.y - this.evidenceFrameSize/2,
                    this.evidenceFrameSize/20,
                    this.yarnTexturePattern
                );
                painter.line(
                    canvasState.ctx,
                    junction.x,
                    junction.y,
                    this.evidence[i].position.x,
                    this.evidence[i].position.y - this.evidenceFrameSize/2,
                    this.evidenceFrameSize/20,
                    this.yarnTexturePattern
                );
            }
        }
    }

    //draw pushpins
    var i;
    var arrayLength = this.evidence.length;
    for(i = 0; i < arrayLength; i++){
        if(this.evidence[i].data.visible){
            if(this.evidence[i].data.revelation !== 0){
                painter.pushpin(
                    canvasState.ctx,
                    this.evidence[i].position.x,
                    this.evidence[i].position.y - this.evidenceFrameSize/2,
                    this.evidenceFrameSize,
                    1
                );
            }
            else{
                painter.pushpin(
                    canvasState.ctx,
                    this.evidence[i].position.x,
                    this.evidence[i].position.y - this.evidenceFrameSize/2,
                    this.evidenceFrameSize,
                    0
                );
            }
            
        }
    }
    
    /*removed because I was informed that it does not fit the aesthetic
    canvasState.ctx.save();
    canvasState.ctx.strokeStyle = "white";
    canvasState.ctx.fillStyle = "black";
    canvasState.ctx.lineWidth = this.evidenceFrameSize/30;
    
    
    //draw evidence labels
    for(var i = 0; i < this.evidence.length; i++){
        if(this.evidence[i].data.visible){
            //accompanying text
            canvasState.ctx.font = (this.evidenceFrameSize/6) + "px Arial";
            canvasState.ctx.textBaseline = "hanging";
            canvasState.ctx.textAlign = "center";
            canvasState.ctx.strokeText(this.evidence[i].data.name, this.evidence[i].position.x, this.evidence[i].position.y + this.evidenceFrameSize / 2);
            canvasState.ctx.fillText(this.evidence[i].data.name, this.evidence[i].position.x, this.evidence[i].position.y + this.evidenceFrameSize / 2);
        }
    }
    canvasState.ctx.restore();*/
    
    //draw postit notes
    var postItSize = this.evidenceFrameSize*.35;
    for(var i = 0; i < this.evidence.length; i++){
        if(this.evidence[i].data.analyzed && this.evidence[i].data.visible){
            painter.rect(canvasState.ctx, this.evidence[i].position.x + this.evidenceFrameSize/2 - 2*postItSize/3, this.evidence[i].position.y - this.evidenceFrameSize/2 - postItSize/2, postItSize, postItSize, "#ffffa5", "lightgray", 2);
            canvasState.ctx.font = (this.evidenceFrameSize/3) + "px Arial";
            canvasState.ctx.fillStyle = "green";
            canvasState.ctx.fillText("✔", this.evidence[i].position.x + this.evidenceFrameSize/2 - postItSize/2, this.evidence[i].position.y - this.evidenceFrameSize*.38);
        }
    }
    
    //draw the line connecting origin node to the mouse position
    if(this.originNode !== 0){
        painter.line(canvasState.ctx, this.originNode.position.x, this.originNode.position.y, mouseState.relativePosition.x, mouseState.relativePosition.y, this.evidenceFrameSize/20, "dodgerblue");
    }
    
    if(this.mouseTarget !== 0){
        canvasState.ctx.font = (this.evidenceFrameSize/4) + "px Arial";
        canvasState.ctx.textBaseline = "hanging";
        canvasState.ctx.textAlign = "center";
        canvasState.ctx.fillStyle = "white";
        canvasState.ctx.lineWidth = this.evidenceFrameSize/30;
        canvasState.ctx.strokeText(this.mouseTarget.data.name, mouseState.relativePosition.x, mouseState.relativePosition.y + this.evidenceFrameSize / 3);
        canvasState.ctx.fillText(this.mouseTarget.data.name, mouseState.relativePosition.x, mouseState.relativePosition.y + this.evidenceFrameSize / 3);
    }
    
    canvasState.ctx.restore();
}

module.exports = BoardPhase;
},{"../common/Point.js":3,"../libraries/DrawLib.js":8,"../libraries/Utilities.js":10,"./Dialogue.js":14,"./EvidenceNode.js":15}],14:[function(require,module,exports){
"use strict";
var DrawLib = require('../libraries/Drawlib.js');
var Utilities = require('../libraries/Utilities.js');
var Scene = require('./Scene.js');
var Actor = require('./Actor.js');
var Prop = require('./Prop.js');

var painter;
var utility;

var dialogueLayer;
var dialogueText;
var dialogueSpeaker;
var dialogueFrame;

//parameter is a point that denotes starting position
function Dialogue(target){   
    //instantiate libraries
    painter = new DrawLib();
    utility = new Utilities();
    
    //JSON: complete dialogue file loaded into JSON variable
    this.data;
    //bool: whether the JSON data has been fully loaded
    this.dataLoaded = false;
    //number: step count index of progress through the dialogue
    this.dialogueProgress = -1;
    //bool: whether the current step has run to completion
    this.currentStepComplete = false;
    //number: arbitray progress through step action
    this.currentStepProgress = 0;
    //bool: whether the dialogue has played through to its conclusion
    this.complete = false;
    //array<scene>: contains all of the scene objects
    this.scenes = [];
    //bool: whether all the scene assets have fully loaded
    this.scenesLoaded = false;
    //array<actor>: contains all of the actor objects
    this.actors = [];
    //bool: whether all actor objects have loaded
    this.actorsLoaded = false;
    //bool: whether all image assets have loaded
    this.allLoaded = false;
    //number: index of the currently used scene
    this.activeSceneIndex = 0;
    //string: denotes location of the dialogue
    this.locationText = "";
    //bool: to prevent act from firing before load can occur, it is blocked until loading begins
    this.actReady = false;
    //array<prop>: contains all prop objects
    this.props = [];
    //bool: whether or not props have loaded
    this.propsLoaded = false;
    //number: the index of the active prop. -1 if nothing
    this.activeProp = -1;
    //bool: whether or not progression is locked by a fade animation
    this.fadeAnimationLock = false;
    //number: duration of time in milliseconds since a fade animation lock was put in place
    this.fadeAnimationLockTimer = -1;
    
    dialogueLayer = document.getElementById("dialogueLayer");
    dialogueText = document.getElementById("dialogueText");
    dialogueSpeaker = document.getElementById("dialogueSpeaker");
    dialogueFrame = document.getElementById("dialogueFrame");
    
    //store the scope of the tick event so that it can be removed properly later
    this.tickScope = this.tick.bind(this);
    dialogueLayer.addEventListener('click', this.tickScope, false);
    //make the dialogue layer visible
    document.getElementById("dialogueLayer").className = "";
    
    //tells the function where the data is and passes a callback that can be used with loading
    console.log("Loading Dialogue: " + target);
    utility.loadJSON("./content/dialogue/" + target, _dataLoadedCallback.bind(this));
}

//load JSON corresponding to the dialogue sequence
function _dataLoadedCallback(response){
    this.data = JSON.parse(response);
    
    this.dataLoaded = true;
    
    this.locationText = this.data.location;
    
    //now that the dataset is loaded, the image uris can be loaded
    this._loadImages();
    this.actReady = true;
}

//called during initial load
//set up load calls for each of the images used in this dialogue
Dialogue.prototype._loadImages = function(){
    //for every actor
    for(var i = 0; i < this.data.actors.length; i++){
        //push a new actor object
        this.actors.push(new Actor(this.data.actors[i].name));
    }
    
    //for every scene...
    for(var i = 0; i < this.data.scenes.length; i++){
        //push a new scene object. Loading will be handled internally
        this.scenes.push(new Scene("content/scene/" + this.data.scenes[i].backdrop));
    }
    
    //for every prop
    for(var i = 0; i < this.data.props.length; i++){
        //push a new prop asset
        this.props.push(new Prop(this.data.props[i].prop));
    }
}

//handle the different types of dialogue accordingly
Dialogue.prototype._processDialogue = function(){
    //dialogue: text that a character says, sets to dialogue box
    if(this.data.dialogue[this.dialogueProgress].type === "dialogue"){
        dialogueFrame.className = "";
        dialogueSpeaker.innerHTML = this.data.actors[this.data.dialogue[this.dialogueProgress].speaker].name;
        dialogueText.innerHTML = this.data.dialogue[this.dialogueProgress].statement;
        
        //loop through actors and set the focus for each
        for(var i = 0; i < this.actors.length; i++){
            if(this.data.dialogue[this.dialogueProgress].speaker === i){
                //set focus to true
                this.actors[i].focus = true;
            } else{
                //set focus to false   
                this.actors[i].focus = false;
            }
        }
    } else if(this.data.dialogue[this.dialogueProgress].type === "transition"){
        //dialogueSpeaker.innerHTML = "";
        //dialogueText.innerHTML = "";
        dialogueFrame.className = "hiddenLayer";
        
        //measured fade to black
        this.fadeAnimationLock = true;
        document.getElementById("fadeBlinder").className = "";
    }
    //iterate through each action apply
    for(var i = 0; i < this.data.dialogue[this.dialogueProgress].action.length; i++){
        //change the properties of one of the scene's actors
        if(this.data.dialogue[this.dialogueProgress].action[i].type === "actorAction"){
            
            this.actors[this.data.dialogue[this.dialogueProgress].action[i].target].update(
                this.data.dialogue[this.dialogueProgress].action[i].expression,
                this.data.dialogue[this.dialogueProgress].action[i].active,
                this.data.dialogue[this.dialogueProgress].action[i].position
            );
        } else if(this.data.dialogue[this.dialogueProgress].action[i].type === "locationMarker"){ //change the location marker text
            this.locationText = this.data.dialogue[this.dialogueProgress].action[i].text;
        } else if(this.data.dialogue[this.dialogueProgress].action[i].type === "propAction"){
            this.activeProp = this.data.dialogue[this.dialogueProgress].action[i].target;
        }
    }
}

//fires when an asset finishes loading
//run through the image arrays and check if everything is loaded
Dialogue.prototype._checkImageLoadStatus = function(){
    if(!this.scenesLoaded){
        var completeFlag = true;
        for(var i = 0; i < this.scenes.length; i++){
            if(this.scenes[i].loaded === false){
                completeFlag = false;
                break;
            }
        }
        if(completeFlag){
            this.scenesLoaded = true;
        }
    }
    
    if(!this.actorsLoaded){
        var completeFlag = true;
        for(var i = 0; i < this.actors.length; i++){
            if(this.actors[i].loaded === false){
                completeFlag = false;
                break;
            }
        }
        if(completeFlag){
            this.actorsLoaded = true;
        }
    }
    
    if(!this.propsLoaded){
        var completeFlag = true;
        for(var i = 0; i < this.props.length; i++){
            if(this.props[i].loaded === false){
                completeFlag = false;
                break;
            }
        }
        if(completeFlag){
            this.propsLoaded = true;
        }
    }
}

//catch events and other stuff
Dialogue.prototype.act = function(){
    if(this.allLoaded){
        //handle animation locking
        if(this.fadeAnimationLock === true){
            var currentTime = (new Date()).getTime();
            //check and initialize timer if need be
            if(this.fadeAnimationLockTimer === -1){
                this.fadeAnimationLockTimer = currentTime;
            } else if (currentTime - this.fadeAnimationLockTimer > 200){
                this.fadeAnimationLock = false;
                this.fadeAnimationLockTimer = -1;
                this.activeSceneIndex = parseInt(this.data.dialogue[this.dialogueProgress].scene);
                
                for(var i = 0; i < this.actors.length; i++){
                    this.actors[i].active = false;
                    this.activeProp = -1;
                }
                document.getElementById("fadeBlinder").className = "hiddenLayer";
            }
        }
    } else{
        //waits for loading the begin before running anything that checks and sees whether loading is complete
        //running this too early can result in false positives for load completion
        if(this.actReady){
            //check to see whether everything has been loaded. If yes, make the layer visible and remove any loading messages. Set allLoaded to true
            this._checkImageLoadStatus();

            if(this.dataLoaded && this.scenesLoaded && this.actorsLoaded){
                this.allLoaded = true;
                //console.log("All dialogue assets successfully loaded");
                
            }
        }
    }
};

//draw the dialogue visual elements
Dialogue.prototype.draw = function(canvasState){
    if(this.allLoaded){
        //draw dark backdrop
        painter.rect(canvasState.ctx, -canvasState.width / 2, -canvasState.height / 2, canvasState.width, canvasState.height, "black", "black", 0);
        
        this.scenes[this.activeSceneIndex].draw(canvasState);
        
        //draw the active prop
        if(this.activeProp > -1){
            this.props[this.activeProp].draw(canvasState);
        }
        
        //draw the location marker if conditions are appropriate
        if(this.locationText !== "" && this.fadeAnimationLock === false){
            this._drawLocationMarker(canvasState);
        }
        //should fire immediately on full visual load when location text is empty
        else if(this.locationText === "" && this.fadeAnimationLock === false && this.dialogueProgress === -1){
            this.tick();
        }
        
        //iterate and draw with actors
        for(var i = 0; i < this.actors.length; i++){
            this.actors[i].draw(canvasState);
        }
    }
};

//draw the location marker when it is needed
Dialogue.prototype._drawLocationMarker = function(canvasState){
    canvasState.ctx.save();
    canvasState.ctx.font = (canvasState.height/10) + "px Arial";
    canvasState.ctx.textBaseline = "middle";
    canvasState.ctx.textAlign = "center";
    var textWidth = canvasState.ctx.measureText((this.locationText + "")).width;
    var textBorder = canvasState.height/70;
    painter.roundedRectangle(
        canvasState.ctx,
        -textWidth/2 - textBorder,
        -canvasState.height/20,
        textWidth + textBorder * 2,
        (canvasState.height/10),
        5,
        "white",
        "black",
        canvasState.height/100
    );
    canvasState.ctx.fillStyle = 'black';
    canvasState.ctx.fillText(this.locationText, 0, 0);
    canvasState.ctx.restore();
}

//advances the dialoue progression
Dialogue.prototype.tick = function(){
    if(this.allLoaded){
        this.dialogueProgress++;
        if(this.dialogueProgress < this.data.dialogue.length){
            this._processDialogue();
        } else{
            dialogueSpeaker.innerHTML = "";
            dialogueText.innerHTML = "";
            
            this.complete = true;
            
            dialogueLayer.removeEventListener('click', this.tickScope, false);
            
            dialogueLayer.className = "hiddenElement";
            dialogueFrame.className = "hiddenLayer";
        }
    }
};



module.exports = Dialogue;
},{"../libraries/Drawlib.js":9,"../libraries/Utilities.js":10,"./Actor.js":11,"./Prop.js":16,"./Scene.js":17}],15:[function(require,module,exports){
"use strict";
var DrawLib = require('../libraries/Drawlib.js');
var Utilities = require('../libraries/Utilities.js');
var Point = require('../common/Point.js');

var painter;
var utility;

//parameter is a point that denotes starting position
function EvidenceNode(JSONChunk, incomingActionfunction, incomingFocusFunction){
    painter = new DrawLib();
    utility = new Utilities();
    
    this.addAction = incomingActionfunction;
    this.setFocus = incomingFocusFunction;
    
    //bool: whether the image has been loaded
    this.loaded = false;
    //image: image asset tied to this node
    this.image;
    //number: adjusted width of the node to be drawn
    this.width;
    //number: adjusted height of the node to be drawn
    this.height;
    //point: holds x and y values representing position of the node
    this.position = new Point(0,0);
    //bool: whether the house is hovering over the node or not
    this.mouseOver = false;
    //JSON: node data separated from board JSON. Contains only the node's data
    this.data = JSONChunk;
    
    //image loading and resizing
    var tempImage = new Image();
    //assign listeners for responding to loads and errors
    tempImage.addEventListener('load', _loadAction.bind(this), false);
    tempImage.addEventListener('error', _errorAction.bind(this), false);
    //sets the image source and begins load event
    tempImage.src = this.data.image;
}

//attempts to load the specified image
var _loadAction = function (e) {
    this.image = e.target;
    this.width = e.target.naturalWidth;
    this.height = e.target.naturalHeight;
    
    //the default max width and height of an image
    var maxDimension = 100;
    
    //size the image down evenly
    if(this.width < maxDimension && this.height < maxDimension){
        var x;
        if(this.width > this.height){
            x = maxDimension / this.width;
        }
        else{
            x = maxDimension / this.height;
        }
        this.width = this.width * x;
        this.height = this.height * x;
    }
    if(this.width > maxDimension || this.height > maxDimension){
        var x;
        if(this.width > this.height){
            x = this.width / maxDimension;
        }
        else{
            x = this.height / maxDimension;
        }
        this.width = this.width / x;
        this.height = this.height / x;
    }
    
    this.loaded = true;
};
//fires if loading is unsuccesful, assigns a guaranteed thumbnail
var _errorAction = function(e){
    //alert("There was an error loading an image.");
    this.image = new Image();
    this.image.src = "./../../../content/ui/missingThumbnail.gif";
    this.width = 100;
    this.height = 100;
    this.loaded = true;
};

//draw the node and its accompanying visual elements
EvidenceNode.prototype.draw = function(canvasState){
    //makes sure that the assets are loaded before attempting to draw them
    if(this.loaded){
        canvasState.ctx.save();
        
        //safely attempt to draw this node
        try{
            //only draw if the node has been revealed
            if(this.data.visible === true){
                //convert 0-100 values to actual coordinates on the canvas
                this.position.x = utility.map(this.data.x, -100, 100, -canvasState.relativeWidth*.43, canvasState.relativeWidth*.43) - canvasState.evidenceFrameSize*.2;
                this.position.y = utility.map(this.data.y, -100, 100, -canvasState.height*.35, canvasState.height*.35);
                
                this._drawNode(canvasState);
            }
        }
        catch(error){
            //usually hit if image files load slowly, gives them a chance to load before attempting to draw
            console.log("There was a problem drawing " + this.data.image + " ...reattempting");
        }
        
        canvasState.ctx.restore();
    }
};

//draw the scaled evidence node
EvidenceNode.prototype._drawNode = function(canvasState){    
    //adjust dimensions to fit node frames
    var adjustedWidth;
    var adjustedHeight;
    if(this.width > this.height){
        var modifier = canvasState.evidenceFrameSize/this.width*.85;
        adjustedWidth = this.width * modifier;
        adjustedHeight = this.height * modifier;
    }
    else{
        var modifier = canvasState.evidenceFrameSize/this.height*.85;
        adjustedWidth = this.width * modifier;
        adjustedHeight = this.height * modifier;
    }
    
    canvasState.ctx.save();
    //highlight this if mouse is over, isolated from everything else so only the back layer glows
    if(this.mouseOver){
        canvasState.ctx.shadowColor = '#0066ff';
        canvasState.ctx.shadowBlur = 7;
        document.body.style.cursor = "pointer";
    }
    painter.rect(canvasState.ctx, (-canvasState.evidenceFrameSize/2) + (this.position.x), (-canvasState.evidenceFrameSize/2) + (this.position.y) - canvasState.evidenceFrameSize*.1, canvasState.evidenceFrameSize, canvasState.evidenceFrameSize + canvasState.evidenceFrameSize*.1, "white", "gray", 1);
    canvasState.ctx.restore();
    
    painter.rect(canvasState.ctx, (-canvasState.evidenceFrameSize/2*.85) + (this.position.x), (-canvasState.evidenceFrameSize/2*.85) + (this.position.y) - canvasState.evidenceFrameSize*.1, canvasState.evidenceFrameSize*.85, canvasState.evidenceFrameSize*.85, "#272727", "transparent", 0);
    
    canvasState.ctx.drawImage(this.image, (-adjustedWidth/2) + (this.position.x), (-adjustedHeight/2) + (this.position.y) - canvasState.evidenceFrameSize*.1, adjustedWidth, adjustedHeight);
    
    /*part of label removal
    //draw the paper backing for the evidence node name
    canvasState.ctx.font = (canvasState.evidenceFrameSize/6) + "px Arial";
    var textWidth = canvasState.ctx.measureText((this.data.name + "")).width * 1.1;
    painter.rect(
        canvasState.ctx,
        this.position.x - textWidth/2,
        this.position.y + canvasState.evidenceFrameSize/2 - (canvasState.evidenceFrameSize/6 * 1.5)/4,
        textWidth,
        canvasState.evidenceFrameSize/6 * 1.5,
        "#ffffa5",
        "lightgray",
        0
    );
    */
    
    
    canvasState.ctx.save();
    
    //label text visual element
    canvasState.ctx.font = (canvasState.evidenceFrameSize/14) + "px Architects Daughter";
    canvasState.ctx.textBaseline = "middle";
    canvasState.ctx.textAlign = "center";
    canvasState.ctx.fillText(this.data.name, this.position.x, this.position.y + 17*canvasState.evidenceFrameSize / 40);
    
    //checkbox moved to boardphase layer
    //analysis checkbox
    /*
    if(this.data.analyzed){
        var postItSize = canvasState.evidenceFrameSize*.35;
        painter.rect(canvasState.ctx, this.position.x + canvasState.evidenceFrameSize/2 - 2*postItSize/3, this.position.y - canvasState.evidenceFrameSize/2 - postItSize/2, postItSize, postItSize, "#ffffa5", "lightgray", 2);
        canvasState.ctx.font = (canvasState.evidenceFrameSize/3) + "px Arial";
        canvasState.ctx.fillStyle = "green";
        canvasState.ctx.fillText("✔", this.position.x + canvasState.evidenceFrameSize/2 - postItSize/7, this.position.y - canvasState.evidenceFrameSize/2);
    }*/
    canvasState.ctx.restore();
}

//this will be called when the analysis button is clicked in BoardPhase
var _analysis = function(){
    //set analyzed property to true
    this.data.analyzed = true;
    
    //set the focus in the parent
    this.setFocus(this.data.num);
    
    //parse the insight outcome array
    var i;
    var arrayLength = this.data.insightOutcome.length;
    for(i = 0; i < arrayLength; i++){
        //add each insight outcome action to the actionArray
        this.addAction(this.data.insightOutcome[i]);
    }
}

//populates the detailWindow based on the sender
EvidenceNode.prototype.click = function(){
    //set mouseover to false to prevent the overlay from appearing when the board returns to gameplay
    this.mouseOver = false;
    //set the focus to this node because it was clicked
    this.setFocus(this.data.num);
    //change the innerhtml and style based on whether or not this is a revelation
    if(this.data.revelation !== 0){
        document.getElementById("analysisFrameTitle").innerHTML = this.data.revelation;
        document.getElementById("analysisFramePaper").className = "analysisFramePaperRed";
    }
    else{
        document.getElementById("analysisFrameTitle").innerHTML = "Analysis";
        document.getElementById("analysisFramePaper").className = "analysisFramePaperBlue";
    }
    
    //populate the evidence menu
    document.getElementById("evidenceLayer").className = "";
    document.getElementById("photoFrameTitleFrame").className = "";
    document.getElementById("photoFrameTitle").innerHTML = this.data.name;
    document.getElementById("photoImage").src = this.data.image;
    document.getElementById("descriptionFrameContent").innerHTML = this.data.description;
    if(this.data.analyzed === false){
        //button visible and interactable, no insight
        document.getElementById("analysisFramePaper").className = "hiddenElement";
        document.getElementById("analysisButton").className = "";
        document.getElementById("analysisButton").onclick = _analysis.bind(this);
    }
    else{
        //document.getElementById("analysisFramePaper").className = "";
        document.getElementById("analysisFrameContent").innerHTML = this.data.insight;
        document.getElementById("analysisButton").className = "hiddenElement";
    }
};

module.exports = EvidenceNode;
},{"../common/Point.js":3,"../libraries/Drawlib.js":9,"../libraries/Utilities.js":10}],16:[function(require,module,exports){
"use strict";
var DrawLib = require('./../libraries/Drawlib.js');
var Utilities = require('./../libraries/Utilities.js');

var painter;
var utility;

//constructor
function Prop(pUri){
    //helper library declarations
    painter = new DrawLib();
    utility = new Utilities();
    
    //bool: whether this asset has loaded or not
    this.loaded = false;
    //image: data for the image asset itself
    this.image;
    //number: width of the image asset
    this.width;
    //number: height of the image asset
    this.height;
    
    //container to define loading and resizing image asset
    var tempImage = new Image();
    //assign listeners for responding to loads and errors
    tempImage.addEventListener('load', _loadAction.bind(this), false);
    tempImage.addEventListener('error', _errorAction.bind(this), false);
    //sets the image source and begins load event
    tempImage.src = pUri;
}

//attempts to load the specified image
var _loadAction = function (e) {
    this.image = e.target;
    this.width = e.target.naturalWidth;
    this.height = e.target.naturalHeight;
    this.origWidth = e.target.naturalWidth;
    this.origHeight = e.target.naturalHeight;
    this.loaded = true;
};
//fires if loading is unsuccesful, assigns a guaranteed thumbnail
var _errorAction = function(e){
    //alert("There was an error loading an image.");
    this.image = new Image();
    this.image.src = "./content/ui/missingThumbnail.gif";
    this.width = 100;
    this.height = 100;
    this.loaded = true;
};

//draw the prop
Prop.prototype.draw = function(canvasState){
    //makes sure that the assets are loaded before attempting to draw them
    if(this.loaded){
        canvasState.ctx.save();
        //safely attempt to draw
        try{
            if(this.origWidth < this.origHeight){
                //use height as scaling factor
                this.height = canvasState.height/2;
                this.width = this.origWidth * (this.height/this.origHeight);
            } else{
                //use width as scaling factor
                this.width = canvasState.height/2;
                this.height = this.origHeight * (this.width/this.origWidth);
            }
            painter.roundedRectangle(canvasState.ctx, -this.width/2, -canvasState.height/6 - this.height/2, this.width, this.height, 5, 'rgba(0, 0, 0, .7)', "transparent", 0);
            canvasState.ctx.drawImage(this.image, -this.width * .85 / 2, -canvasState.height/6 -this.height * .85 / 2, this.width * .85, this.height * .85);
        } catch(error){
            //usually hit if image files load slowly, gives them a chance to load before attempting to draw
            console.log("Error: Prop draw " + this.image.src + " ...reattempting");
        }
        canvasState.ctx.restore();
    }
};

module.exports = Prop;
},{"./../libraries/Drawlib.js":9,"./../libraries/Utilities.js":10}],17:[function(require,module,exports){
"use strict";
var DrawLib = require('./../libraries/Drawlib.js');
var Utilities = require('./../libraries/Utilities.js');

var painter;
var utility;

//constructor
function Scene(pUri){
    //helper library declarations
    painter = new DrawLib();
    utility = new Utilities();
    
    //bool: whether this asset has loaded or not
    this.loaded = false;
    //image: data for the image asset itself
    this.image;
    //number: width of the image asset
    this.width;
    //number: height of the image asset
    this.height;
    
    //container to define loading and resizing image asset
    var tempImage = new Image();
    //assign listeners for responding to loads and errors
    tempImage.addEventListener('load', _loadAction.bind(this), false);
    tempImage.addEventListener('error', _errorAction.bind(this), false);
    //sets the image source and begins load event
    tempImage.src = pUri;
}

//attempts to load the specified image
var _loadAction = function (e) {
    this.image = e.target;
    this.width = e.target.naturalWidth;
    this.height = e.target.naturalHeight;
    this.loaded = true;
};
//fires if loading is unsuccesful, assigns a guaranteed thumbnail
var _errorAction = function(e){
    //alert("There was an error loading an image.");
    this.image = new Image();
    this.image.src = "./content/ui/missingThumbnail.gif";
    this.width = 100;
    this.height = 100;
    this.loaded = true;
};

//draw the scene
Scene.prototype.draw = function(canvasState){
    //makes sure that the assets are loaded before attempting to draw them
    if(this.loaded){
        canvasState.ctx.save();
        //safely attempt to draw
        try{
            if((canvasState.width / canvasState.height) > (16/9)){
                //wider
                this.width = canvasState.width;
                this.height = (this.width / 16) * 9;
            } else{
                //taller
                this.height = canvasState.height;
                this.width = (this.height / 9) * 16;
            }
            canvasState.ctx.drawImage(this.image, -this.width/2, -this.height/2, this.width, this.height);
        } catch(error){
            //usually hit if image files load slowly, gives them a chance to load before attempting to draw
            console.log("Error: Scene draw " + this.image.src + " ...reattempting");
        }
        canvasState.ctx.restore();
    }
};

module.exports = Scene;
},{"./../libraries/Drawlib.js":9,"./../libraries/Utilities.js":10}],18:[function(require,module,exports){
"use strict";
var DrawLib = require('./../libraries/Drawlib.js');
var Utilities = require('./../libraries/Utilities.js');

var painter;
var utility;

//constructor
function Sprite(pExpression, pTarget, pIncomingFunction){
    //helper library declarations
    painter = new DrawLib();
    utility = new Utilities();
    
    
    //bool: whether this asset has loaded or not
    this.loaded = false;
    //string: the name associated with the expression represented by this sprite
    this.expression = pExpression;
    //string: the name of the actor tied to this sprite
    this.target = pTarget;
    //function: reports to actor when loading is complete
    this.report = pIncomingFunction;
    
    //container to define loading and resizing image asset
    var tempImage = new Image();
    //assign listeners for responding to loads and errors
    tempImage.addEventListener('load', _loadAction.bind(this), false);
    tempImage.addEventListener('error', _errorAction.bind(this), false);
    //sets image source and begins load event
    tempImage.src = "./content/actor/" + this.target + "/" + this.expression + ".png";
}

//attempts to load the specified image
var _loadAction = function (e) {
    this.image = e.target;
    this.width = e.target.naturalWidth;
    this.height = e.target.naturalHeight;
    this.loaded = true;
    
    //let actor know that loading is complete
    this.report();
};
//fires if loading is unsuccesful, assigns a guaranteed thumbnail
var _errorAction = function(e){
    //alert("There was an error loading an image.");
    this.image = new Image();
    this.image.src = "./content/ui/missingThumbnail.gif";
    this.width = 100;
    this.height = 100;
    this.loaded = true;
    
    this.report();
};

//draw the scene
Sprite.prototype.draw = function(canvasState, position, active, focus){
    //makes sure that the assets are loaded before attempting to draw them
    if(this.loaded){
        canvasState.ctx.save();
        //safely attempt to draw
        try{
            if(active){
                if(focus){
                    canvasState.ctx.shadowColor = '#1b81e5';
                    canvasState.ctx.shadowBlur = 7;
                }
                
                //establish actual position
                var drawPos = -1 * utility.map(position, -100, 100, canvasState.width * -.5, canvasState.width * .5);
                //establish direction
                var direction = 1;
                if(position > 0){
                    direction = -1;
                } else{
                    drawPos = drawPos * -1;
                }
                //scale draw dimensions to ensure proper screen coverage
                var previousHeight = this.height;
                this.height = canvasState.height * .8;
                this.width = this.width * (this.height/previousHeight);
                
                //scale to flip reversed image
                canvasState.ctx.scale(direction, 1);
                canvasState.ctx.drawImage(this.image, drawPos - this.width/2, canvasState.height/2 - this.height, this.width, this.height);
                
                //if focused, draw the image multiple times to make the shadow outline more intense
                //probably horrible inefficient but cursory research turns up nothing
                if(focus){
                    for(var i = 0; i < 3; i++){
                        canvasState.ctx.drawImage(this.image, drawPos - this.width/2, canvasState.height/2 - this.height, this.width, this.height);
                    }
                }
            }
        } catch(error){
            //usually hit if image files load slowly, gives them a chance to load before attempting to draw
            console.log("Error: Sprite draw " + this.image.src + " ...reattempting");
        }
        canvasState.ctx.restore();
    }
};

module.exports = Sprite;
},{"./../libraries/Drawlib.js":9,"./../libraries/Utilities.js":10}]},{},[1,3,4,5,6,7,9,10,11,12,13,14,15,16,17,18])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9tYWluLmpzIiwianMvbW9kdWxlcy9HYW1lLmpzIiwianMvbW9kdWxlcy9jb21tb24vUG9pbnQuanMiLCJqcy9tb2R1bGVzL2NvbnRhaW5lcnMvQ2FudmFzU3RhdGUuanMiLCJqcy9tb2R1bGVzL2NvbnRhaW5lcnMvR2FtZVN0YXRlLmpzIiwianMvbW9kdWxlcy9jb250YWluZXJzL01vdXNlU3RhdGUuanMiLCJqcy9tb2R1bGVzL2xpYnJhcmllcy9EcmF3TGliLmpzIiwianMvbW9kdWxlcy9saWJyYXJpZXMvVXRpbGl0aWVzLmpzIiwianMvbW9kdWxlcy9waGFzZXMvQWN0b3IuanMiLCJqcy9tb2R1bGVzL3BoYXNlcy9Cb2FyZERhdGEuanMiLCJqcy9tb2R1bGVzL3BoYXNlcy9Cb2FyZFBoYXNlLmpzIiwianMvbW9kdWxlcy9waGFzZXMvRGlhbG9ndWUuanMiLCJqcy9tb2R1bGVzL3BoYXNlcy9FdmlkZW5jZU5vZGUuanMiLCJqcy9tb2R1bGVzL3BoYXNlcy9Qcm9wLmpzIiwianMvbW9kdWxlcy9waGFzZXMvU2NlbmUuanMiLCJqcy9tb2R1bGVzL3BoYXNlcy9TcHJpdGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuNEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzltQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiO1xyXG4vL2ltcG9ydHNcclxudmFyIEdhbWUgPSByZXF1aXJlKCcuL21vZHVsZXMvR2FtZS5qcycpO1xyXG52YXIgUG9pbnQgPSByZXF1aXJlKCcuL21vZHVsZXMvY29tbW9uL1BvaW50LmpzJyk7XHJcbnZhciBNb3VzZVN0YXRlID0gcmVxdWlyZSgnLi9tb2R1bGVzL2NvbnRhaW5lcnMvTW91c2VTdGF0ZS5qcycpO1xyXG52YXIgQ2FudmFzU3RhdGUgPSByZXF1aXJlKCcuL21vZHVsZXMvY29udGFpbmVycy9DYW52YXNTdGF0ZS5qcycpO1xyXG52YXIgR2FtZVN0YXRlID0gcmVxdWlyZSgnLi9tb2R1bGVzL2NvbnRhaW5lcnMvR2FtZVN0YXRlLmpzJyk7XHJcblxyXG4vL2dhbWUgb2JqZWN0c1xyXG52YXIgZ2FtZTtcclxudmFyIGNhbnZhcztcclxudmFyIGN0eDtcclxuXHJcbi8vbW91c2UgaGFuZGxpbmdcclxudmFyIG1vdXNlUG9zaXRpb247XHJcbnZhciByZWxhdGl2ZU1vdXNlUG9zaXRpb247XHJcbnZhciBtb3VzZURvd247XHJcbnZhciBtb3VzZUluO1xyXG52YXIgd2hlZWxEZWx0YTtcclxuXHJcbi8vcGFzc2FibGUgc3RhdGVzXHJcbnZhciBtb3VzZVN0YXRlO1xyXG52YXIgY2FudmFzU3RhdGU7XHJcbnZhciBnYW1lU3RhdGU7XHJcblxyXG4vL2ZpcmVzIHdoZW4gdGhlIHdpbmRvdyBsb2Fkc1xyXG53aW5kb3cub25sb2FkID0gZnVuY3Rpb24oZSl7XHJcbiAgICAvL3ZhcmlhYmxlIGFuZCBsb29wIGluaXRpYWxpemF0aW9uXHJcbiAgICBpbml0aWFsaXplVmFyaWFibGVzKCk7XHJcbiAgICBsb29wKCk7XHJcbn1cclxuXHJcbi8vaW5pdGlhbGl6YXRpb24gZm9yIHZhcmlhYmxlcywgbW91c2UgZXZlbnRzLCBhbmQgZ2FtZSBcImNsYXNzXCJcclxuZnVuY3Rpb24gaW5pdGlhbGl6ZVZhcmlhYmxlcygpe1xyXG4gICAgLy9jYW12YXMgaW5pdGlhbGl6YXRpb25cclxuICAgIGNhbnZhcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2NhbnZhcycpO1xyXG4gICAgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICBjYW52YXMud2lkdGggPSBjYW52YXMub2Zmc2V0V2lkdGg7XHJcbiAgICBjYW52YXMuaGVpZ2h0ID0gY2FudmFzLm9mZnNldEhlaWdodDtcclxuICAgIGNvbnNvbGUubG9nKFwiQ2FudmFzIERpbWVuc2lvbnM6IFwiICsgY2FudmFzLndpZHRoICsgXCIsIFwiICsgY2FudmFzLmhlaWdodCk7XHJcbiAgICBcclxuICAgIFxyXG4gICAgLy9tb3VzZSB2YXJpYWJsZSBpbml0aWFsaXphdGlvblxyXG4gICAgbW91c2VQb3NpdGlvbiA9IG5ldyBQb2ludCgwLDApO1xyXG4gICAgcmVsYXRpdmVNb3VzZVBvc2l0aW9uID0gbmV3IFBvaW50KDAsMCk7XHJcbiAgICBcclxuICAgIC8vZXZlbnQgbGlzdGVuZXJzIGZvciBtb3VzZSBpbnRlcmFjdGlvbnMgd2l0aCB0aGUgY2FudmFzXHJcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBmdW5jdGlvbihlKXtcclxuICAgICAgICB2YXIgYm91bmRSZWN0ID0gY2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICAgIG1vdXNlUG9zaXRpb24gPSBuZXcgUG9pbnQoZS5jbGllbnRYIC0gYm91bmRSZWN0LmxlZnQsIGUuY2xpZW50WSAtIGJvdW5kUmVjdC50b3ApO1xyXG4gICAgICAgIHJlbGF0aXZlTW91c2VQb3NpdGlvbiA9IG5ldyBQb2ludChtb3VzZVBvc2l0aW9uLnggLSAoY2FudmFzU3RhdGUucmVsYXRpdmVXaWR0aC8yKSAtIChjYW52YXNTdGF0ZS53aWR0aCAtIGNhbnZhc1N0YXRlLnJlbGF0aXZlV2lkdGgpLCBtb3VzZVBvc2l0aW9uLnkgLSAoY2FudmFzU3RhdGUuaGVpZ2h0LzIuMCkpOyAgICAgICAgXHJcbiAgICB9KTtcclxuICAgIG1vdXNlRG93biA9IGZhbHNlO1xyXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgbW91c2VEb3duID0gdHJ1ZTtcclxuICAgIH0pO1xyXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgIG1vdXNlRG93biA9IGZhbHNlO1xyXG4gICAgfSk7XHJcbiAgICBtb3VzZUluID0gZmFsc2U7XHJcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbihlKXtcclxuICAgICAgICBtb3VzZUluID0gdHJ1ZTtcclxuICAgIH0pO1xyXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW91dFwiLCBmdW5jdGlvbihlKXtcclxuICAgICAgICBtb3VzZUluID0gZmFsc2U7XHJcbiAgICAgICAgbW91c2VEb3duID0gZmFsc2U7XHJcbiAgICB9KTtcclxuICAgIHdoZWVsRGVsdGEgPSAwO1xyXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXdoZWVsXCIsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgIHdoZWVsRGVsdGEgPSBlLndoZWVsRGVsdGE7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy9mZWVkIHZhcmlhYmxlcyBpbnRvIG1vdXNlU3RhdGVcclxuICAgIG1vdXNlU3RhdGUgPSBuZXcgTW91c2VTdGF0ZShcclxuICAgICAgICBtb3VzZVBvc2l0aW9uLFxyXG4gICAgICAgIHJlbGF0aXZlTW91c2VQb3NpdGlvbixcclxuICAgICAgICBtb3VzZURvd24sXHJcbiAgICAgICAgbW91c2VJbixcclxuICAgICAgICB3aGVlbERlbHRhXHJcbiAgICApO1xyXG4gICAgXHJcbiAgICAvL2NhbnZhcyBzdGF0ZSBjb250YWluZXI6IGNvbnRleHQsIGNlbnRlciBwb2ludCwgd2lkdGgsIGhlaWdodCwgc2NhbGVcclxuICAgIGNhbnZhc1N0YXRlID0gbmV3IENhbnZhc1N0YXRlKFxyXG4gICAgICAgIGN0eCwgXHJcbiAgICAgICAgbmV3IFBvaW50KGNhbnZhcy53aWR0aCAvIDIsIGNhbnZhcy5oZWlnaHQvMiksXHJcbiAgICAgICAgY2FudmFzLm9mZnNldFdpZHRoLFxyXG4gICAgICAgIGNhbnZhcy5vZmZzZXRIZWlnaHRcclxuICAgICk7XHJcbiAgICBcclxuICAgIC8vY3JlYXRlcyB0aGUgZ2FtZSBvYmplY3QgZnJvbSB3aGljaCBtb3N0IGludGVyYWN0aW9uIGlzIG1hbmFnZWRcclxuICAgIGdhbWUgPSBuZXcgR2FtZSgpO1xyXG59XHJcblxyXG4vL2ZpcmVzIG9uY2UgcGVyIGZyYW1lXHJcbmZ1bmN0aW9uIGxvb3AoKXtcclxuICAgIC8vYmluZHMgbG9vcCB0byBmcmFtZXNcclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobG9vcC5iaW5kKHRoaXMpKTtcclxuICAgIFxyXG4gICAgLy9mZWVkIGN1cnJlbnQgbW91c2UgdmFyaWFibGVzIGJhY2sgaW50byBtb3VzZSBzdGF0ZVxyXG4gICAgbW91c2VTdGF0ZS51cGRhdGUoXHJcbiAgICAgICAgbW91c2VQb3NpdGlvbixcclxuICAgICAgICByZWxhdGl2ZU1vdXNlUG9zaXRpb24sXHJcbiAgICAgICAgbW91c2VEb3duLFxyXG4gICAgICAgIG1vdXNlSW4sXHJcbiAgICAgICAgd2hlZWxEZWx0YVxyXG4gICAgKTtcclxuICAgIC8vbmV0IHdoZWVsIG1vdmVtZW50IHJlc2V0cyB0byAwXHJcbiAgICB3aGVlbERlbHRhID0gMDtcclxuICAgIFxyXG4gICAgLy91cGRhdGUgZ2FtZSdzIHZhcmlhYmxlczogcGFzc2luZyBjYW52YXNTdGF0ZSwgbW91c2VTdGF0ZSwgZGVsdGEgdGltZVxyXG4gICAgZ2FtZS51cGRhdGUoY2FudmFzU3RhdGUsIG1vdXNlU3RhdGUpO1xyXG59XHJcblxyXG4vL2xpc3RlbnMgZm9yIGNoYW5nZXMgaW4gc2l6ZSBvZiB3aW5kb3cgYW5kIHVwZGF0ZXMgY2FudmFzIHN0YXRlIGFwcHJvcHJpYXRlbHlcclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgZnVuY3Rpb24oZSl7XHJcbiAgICBjYW52YXMud2lkdGggPSBjYW52YXMub2Zmc2V0V2lkdGg7XHJcbiAgICBjYW52YXMuaGVpZ2h0ID0gY2FudmFzLm9mZnNldEhlaWdodDtcclxuICAgIC8vY2FudmFzIHN0YXRlIHVwZGF0ZTogY29udGV4dCwgY2VudGVyIHBvaW50LCB3aWR0aCwgaGVpZ2h0LCBzY2FsZVxyXG4gICAgY2FudmFzU3RhdGUudXBkYXRlKFxyXG4gICAgICAgIGN0eCxcclxuICAgICAgICBuZXcgUG9pbnQoY2FudmFzLndpZHRoIC8gMiwgY2FudmFzLmhlaWdodCAvIDIpLFxyXG4gICAgICAgIGNhbnZhcy53aWR0aCxcclxuICAgICAgICBjYW52YXMuaGVpZ2h0XHJcbiAgICApO1xyXG59KTtcclxuXHJcblxyXG5cclxuIiwiLy9ET05FcG9sb3Jhb2lkIGxhYmVscyB3cml0dGVuIG9uXHJcbi8vRE9ORSBpbXByb3ZlZCBjb3JrYm9hcmQgdGV4dHVyZVxyXG4vL0RPTkUgY3JlZGl0cyBhbmQgYXR0cmlidXRpb25cclxuLy93b29kZW4gYm9yZGVyXHJcbi8vYm9hcmQgcHJldmlldyBmb3IgdGhlIHNlbGVjdCBzY3JlZW5cclxuXHJcbi8vMTE6MTUgMTI6MDUgTVdGIGluIHRoZSBncmFkIChzYWQpIGxhYlxyXG5cclxuXHJcblwidXNlIHN0cmljdFwiO1xyXG4vL2ltcG9ydGVkIG9iamVjdHNcclxudmFyIEJvYXJkUGhhc2UgPSByZXF1aXJlKCcuL3BoYXNlcy9Cb2FyZFBoYXNlLmpzJyk7XHJcbnZhciBEcmF3TGliID0gcmVxdWlyZSgnLi9saWJyYXJpZXMvRHJhd2xpYi5qcycpO1xyXG52YXIgVXRpbGl0aWVzID0gcmVxdWlyZSgnLi9saWJyYXJpZXMvVXRpbGl0aWVzLmpzJyk7XHJcbnZhciBCb2FyZERhdGEgPSByZXF1aXJlKCcuL3BoYXNlcy9Cb2FyZERhdGEuanMnKTtcclxuXHJcbi8vdmFyIGFjdGl2ZVBoYXNlO1xyXG52YXIgcGFpbnRlcjtcclxudmFyIHV0aWxpdHk7XHJcblxyXG5mdW5jdGlvbiBHYW1lKCl7ICAgIFxyXG4gICAgcGFpbnRlciA9IG5ldyBEcmF3TGliKCk7XHJcbiAgICB1dGlsaXR5ID0gbmV3IFV0aWxpdGllcygpO1xyXG4gICAgXHJcbiAgICAvL2JvYXJkUGhhc2U6IHRoZSBjdXJyZW50bHkgbG9hZGVkIEpTT04gZmlsZSBjb3JyZXNwb25kaW5nIHRvIHRoZSBjdXJyZW50IGJvYXJkXHJcbiAgICB0aGlzLmFjdGl2ZUJvYXJkO1xyXG4gICAgLy9zdHJpbmc6IHN0b3JlcyBjdXJyZW50IHBoYXNlLiAodGl0bGUsIHNlbGVjdCwgYm9hcmQpXHJcbiAgICB0aGlzLnBoYXNlID0gXCJ0aXRsZVwiO1xyXG4gICAgLy9ib29sOiB3aGV0aGVyIG9yIG5vdCBwcm9ncmVzc2lvbiBpcyBsb2NrZWQgYnkgYSBmYWRlIGFuaW1hdGlvblxyXG4gICAgdGhpcy5mYWRlQW5pbWF0aW9uTG9jayA9IGZhbHNlO1xyXG4gICAgLy9udW1iZXI6IGR1cmF0aW9uIG9mIHRpbWUgaW4gbWlsbGlzZWNvbmRzIHNpbmNlIGEgZmFkZSBhbmltYXRpb24gbG9jayB3YXMgcHV0IGluIHBsYWNlXHJcbiAgICB0aGlzLmZhZGVBbmltYXRpb25Mb2NrVGltZXIgPSAtMTtcclxuICAgIC8vYXJyYXk8ZGF0YT46IGNvbnRhaW5zIHJlYWRhYmxlIGdhbWUgZGF0YSB0aGF0IHdpbGwgYmUgcmVhZCBmcm9tIGV2ZXJ5d2hlcmUgZWxzZSBpbiB0aGUgZ2FtZVxyXG4gICAgdGhpcy5zY2VuZURhdGE7XHJcbiAgICAvL2Jvb2w6IHdoZXRoZXIgb3Igbm90IHRoZSBuZWNlc3NhcnkgZGF0YSBtYW5pZmVzdHMgaGF2ZSBiZWVuIGZ1bGx5IGxvYWRlZFxyXG4gICAgdGhpcy5zY2VuZURhdGFMb2FkZWQgPSBmYWxzZTtcclxuICAgIC8vYXJyYXk8Ym9hcmREYXRhPjogc3RvcmVzIGJvYXJkIGRhdGEgYXMgaXQgbG9hZHMgc28gaXQgY2FuIGJlIHByb3Blcmx5IHBhc3NlZCB0byBzY2VuZSBkYXRhXHJcbiAgICB0aGlzLmJvYXJkRGF0YUFycmF5ID0gW107XHJcbiAgICAvL2Jvb2w6IHdoZXRoZXIgaXQgaXMgc2FmZSB0byBiZWdpbiBjaGVja2luZyBmb3IgbG9hZCBjb21wbGV0aW9uXHJcbiAgICB0aGlzLmxvYWRTdGFydGVkID0gZmFsc2U7XHJcbiAgICAvL2FycmF5PGRhdGE+OiBjb250YWlucyBkYXRhIGNvcnJlc3BvbmRpbmcgdG8gdGhlIHNjcm9sbGVyIGFycmF5XHJcbiAgICB0aGlzLnNjcm9sbGVyRGF0YSA9IFtdO1xyXG4gICAgLy9ET006IGFjY2VzcyB0byB0aGUgbWFpbiBnYW1lT2JqZWN0XHJcbiAgICB0aGlzLmdhbWVEYXRhUmVmZXJlbmNlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lRGF0YVwiKTtcclxuICAgIFxyXG4gICAgLy9zZXQgYmluZGluZ3MgZm9yIGxvY2FsIGhlbHBlciBmdW5jdGlvbnNcclxuICAgIF9wb3B1bGF0ZU15c3RlcnlMYXllciA9IF9wb3B1bGF0ZU15c3RlcnlMYXllci5iaW5kKHRoaXMpO1xyXG4gICAgX2luaXRpYWxpemVTY3JvbGxlciA9IF9pbml0aWFsaXplU2Nyb2xsZXIuYmluZCh0aGlzKTtcclxuICAgIF9jaGFuZ2VQaGFzZSA9IF9jaGFuZ2VQaGFzZS5iaW5kKHRoaXMpO1xyXG4gICAgX3BvcHVsYXRlQWZmaXJtYXRpb24gPSBfcG9wdWxhdGVBZmZpcm1hdGlvbi5iaW5kKHRoaXMpO1xyXG4gICAgX3Byb2Nlc3NNeXN0ZXJ5ID0gX3Byb2Nlc3NNeXN0ZXJ5LmJpbmQodGhpcyk7XHJcbiAgICBcclxuICAgIC8vbG9hZCB0aGUgc2NlbmVNYW5pZmVzdCBmaWxlXHJcbiAgICB1dGlsaXR5LmxvYWRKU09OKFwiLi9jb250ZW50L3NjZW5lL3NjZW5lTWFuaWZlc3QuanNvblwiLCBkYXRhTG9hZGVkQ2FsbGJhY2suYmluZCh0aGlzKSk7XHJcbiAgICBcclxuICAgIFxyXG4gICAgLy9kZWZpbml0aW9ucyBvZiBvbmNsaWNrIG1ldGhvZHMgZm9yIHN0YXRpYyBVSSBlbGVtZW50c1xyXG4gICAgLy9jbGlja2luZyB0aGUgZ28gYXJyb3cgd2lsbCBjaGFuZ2UgdG8gdGhlIGJvYXJkXHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNlbGVjdEJ1dHRvbkZyYW1lXCIpLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIF9jaGFuZ2VQaGFzZShcImJvYXJkXCIpO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJteXN0ZXJ5RnJhbWVcIikub25jbGljayA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgX3BvcHVsYXRlTXlzdGVyeUxheWVyKDApO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJteXN0ZXJ5UmV0dXJuQnV0dG9uXCIpLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlzdGVyeUxheWVyXCIpLmNsYXNzTmFtZSA9IFwiaGlkZGVuTGF5ZXJcIjtcclxuICAgIH0uYmluZCh0aGlzKTtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmV2ZWxhdGlvbkZyYW1lXCIpLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIF9wb3B1bGF0ZU15c3RlcnlMYXllcig0KTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlzdGVyeUFmZmlybU5vXCIpLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIF9wb3B1bGF0ZU15c3RlcnlMYXllcigwKTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlzdGVyeUFmZmlybVllc1wiKS5vbmNsaWNrID0gZnVuY3Rpb24oKXtcclxuICAgICAgICBfcHJvY2Vzc015c3RlcnkoKTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmVzdWx0QnV0dG9uXCIpLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmVzdWx0TGF5ZXJcIikuY2xhc3NOYW1lID0gXCJoaWRkZW5MYXllclwiO1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmVzdWx0Q29udGVudFwiKS5jbGFzc05hbWUgPSBcImhpZGRlbkxheWVyXCI7XHJcbiAgICAgICAgLy9zdHVmZiB0aGF0IG1ha2VzIHRoZSB0aXRsZSBhcHBlYXJcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRpdGxlTGF5ZXJcIikuY2xhc3NOYW1lID0gXCJcIjtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJvYXJkVUlMYXllclwiKS5jbGFzc05hbWUgPSBcImhpZGRlbkVsZW1lbnRcIjtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV2aWRlbmNlTGF5ZXJcIikuY2xhc3NOYW1lID0gXCJoaWRkZW5FbGVtZW50XCI7XHJcbiAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9yZXNldCB2YXJpYWJsZXMgYW5kIHN0dWZmXHJcbiAgICAgICAgLy9ib2FyZFBoYXNlOiB0aGUgY3VycmVudGx5IGxvYWRlZCBKU09OIGZpbGUgY29ycmVzcG9uZGluZyB0byB0aGUgY3VycmVudCBib2FyZFxyXG4gICAgICAgIHRoaXMuYWN0aXZlQm9hcmQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgLy9zdHJpbmc6IHN0b3JlcyBjdXJyZW50IHBoYXNlLiAodGl0bGUsIHNlbGVjdCwgYm9hcmQpXHJcbiAgICAgICAgdGhpcy5waGFzZSA9IFwidGl0bGVcIjtcclxuICAgICAgICAvL2Jvb2w6IHdoZXRoZXIgb3Igbm90IHByb2dyZXNzaW9uIGlzIGxvY2tlZCBieSBhIGZhZGUgYW5pbWF0aW9uXHJcbiAgICAgICAgdGhpcy5mYWRlQW5pbWF0aW9uTG9jayA9IGZhbHNlO1xyXG4gICAgICAgIC8vbnVtYmVyOiBkdXJhdGlvbiBvZiB0aW1lIGluIG1pbGxpc2Vjb25kcyBzaW5jZSBhIGZhZGUgYW5pbWF0aW9uIGxvY2sgd2FzIHB1dCBpbiBwbGFjZVxyXG4gICAgICAgIHRoaXMuZmFkZUFuaW1hdGlvbkxvY2tUaW1lciA9IC0xO1xyXG4gICAgICAgIC8vYXJyYXk8ZGF0YT46IGNvbnRhaW5zIHJlYWRhYmxlIGdhbWUgZGF0YSB0aGF0IHdpbGwgYmUgcmVhZCBmcm9tIGV2ZXJ5d2hlcmUgZWxzZSBpbiB0aGUgZ2FtZVxyXG4gICAgICAgIHRoaXMuc2NlbmVEYXRhID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIC8vYm9vbDogd2hldGhlciBvciBub3QgdGhlIG5lY2Vzc2FyeSBkYXRhIG1hbmlmZXN0cyBoYXZlIGJlZW4gZnVsbHkgbG9hZGVkXHJcbiAgICAgICAgdGhpcy5zY2VuZURhdGFMb2FkZWQgPSBmYWxzZTtcclxuICAgICAgICAvL2FycmF5PGJvYXJkRGF0YT46IHN0b3JlcyBib2FyZCBkYXRhIGFzIGl0IGxvYWRzIHNvIGl0IGNhbiBiZSBwcm9wZXJseSBwYXNzZWQgdG8gc2NlbmUgZGF0YVxyXG4gICAgICAgIHRoaXMuYm9hcmREYXRhQXJyYXkgPSBbXTtcclxuICAgICAgICAvL2Jvb2w6IHdoZXRoZXIgaXQgaXMgc2FmZSB0byBiZWdpbiBjaGVja2luZyBmb3IgbG9hZCBjb21wbGV0aW9uXHJcbiAgICAgICAgdGhpcy5sb2FkU3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgICAgIC8vYXJyYXk8ZGF0YT46IGNvbnRhaW5zIGRhdGEgY29ycmVzcG9uZGluZyB0byB0aGUgc2Nyb2xsZXIgYXJyYXlcclxuICAgICAgICB0aGlzLnNjcm9sbGVyRGF0YSA9IFtdO1xyXG4gICAgICAgIC8vRE9NOiBhY2Nlc3MgdG8gdGhlIG1haW4gZ2FtZU9iamVjdFxyXG4gICAgICAgIHRoaXMuZ2FtZURhdGFSZWZlcmVuY2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVEYXRhXCIpO1xyXG5cclxuICAgICAgICAvL2xvYWQgdGhlIHNjZW5lTWFuaWZlc3QgZmlsZVxyXG4gICAgICAgIHV0aWxpdHkubG9hZEpTT04oXCIuL2NvbnRlbnQvc2NlbmUvc2NlbmVNYW5pZmVzdC5qc29uXCIsIGRhdGFMb2FkZWRDYWxsYmFjay5iaW5kKHRoaXMpKTtcclxuICAgICAgICBcclxuICAgICAgICBcclxuICAgICAgICBcclxuICAgIH0uYmluZCh0aGlzKTtcclxufVxyXG5cclxuLy9jb2RlIGV4ZWN1dGlvbiBmb3Igd2hlbiB0aGUgbXlzdGVyeUFmZmlybSBidXR0b24gaXMgY2xpY2tlZFxyXG52YXIgX3Byb2Nlc3NNeXN0ZXJ5ID0gZnVuY3Rpb24oKXtcclxuICAgIHZhciBjaG9pY2UwID0gdGhpcy5nYW1lRGF0YVJlZmVyZW5jZS5nZXRBdHRyaWJ1dGUoXCJkYXRhLW15c3RlcnlWYXIwXCIpO1xyXG4gICAgdmFyIGNob2ljZTEgPSB0aGlzLmdhbWVEYXRhUmVmZXJlbmNlLmdldEF0dHJpYnV0ZShcImRhdGEtbXlzdGVyeVZhcjFcIik7XHJcbiAgICB2YXIgY2hvaWNlMiA9IHRoaXMuZ2FtZURhdGFSZWZlcmVuY2UuZ2V0QXR0cmlidXRlKFwiZGF0YS1teXN0ZXJ5VmFyMlwiKTtcclxuICAgIHZhciBjaG9pY2UzID0gdGhpcy5nYW1lRGF0YVJlZmVyZW5jZS5nZXRBdHRyaWJ1dGUoXCJkYXRhLW15c3RlcnlWYXIzXCIpO1xyXG4gICAgXHJcbiAgICAvL2NvbXBvdW5kIHRoaXMgcGFydGljdWxhciBjb21iaW5hdGlvblxyXG4gICAgdmFyIGNvbXBvdW5kZWRDaG9pY2VzID0gY2hvaWNlMSArIFwiLVwiICsgY2hvaWNlMiArIFwiLVwiICsgY2hvaWNlMztcclxuICAgIC8vaXRlcmF0ZSB0aHJvdWdoIHRoZSByZWNvcmRzIG9mIHRoZSB0YXJnZXQgbXlzdGVyeVxyXG4gICAgdmFyIGk7XHJcbiAgICB2YXIgYXJyYXlMZW5ndGggPSB0aGlzLnNjZW5lRGF0YS5teXN0ZXJpZXNbY2hvaWNlMF0ucmVjb3Jkcy5sZW5ndGg7XHJcbiAgICB2YXIgZmxhZyA9IHRydWU7XHJcbiAgICBmb3IoaSA9IDA7IGkgPCBhcnJheUxlbmd0aDsgaSsrKXtcclxuICAgICAgICBpZihjb21wb3VuZGVkQ2hvaWNlcyA9PT0gdGhpcy5zY2VuZURhdGEubXlzdGVyaWVzW2Nob2ljZTBdLnJlY29yZHNbaV0udmFsdWUpe1xyXG4gICAgICAgICAgICBmbGFnID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgaWYoZmxhZyA9PT0gZmFsc2Upe1xyXG4gICAgICAgIC8vcXVldWUgYSBub3RpZmljYXRpb25cclxuICAgICAgICB0aGlzLmFjdGl2ZUJvYXJkLl9ub3RpZnkoXCJUaGlzIGNvbWJpbmF0aW9uIG9mIGNsdWVzIGhhcyBhbHJlYWR5IGJlZW4gY29uc2lkZXJlZC5cIik7XHJcbiAgICB9XHJcbiAgICBlbHNle1xyXG4gICAgICAgIC8vY29tbWl0IHRoZSBuZXcgY29tcG91bmRlZENob2ljZXMgdG8gcmVjb3JkXHJcbiAgICAgICAgdGhpcy5zY2VuZURhdGEubXlzdGVyaWVzW2Nob2ljZTBdLnJlY29yZHMucHVzaCgge3ZhbHVlOiBjb21wb3VuZGVkQ2hvaWNlc30gKTtcclxuICAgICAgICBcclxuICAgICAgICAvL2NoZWNrIGlmIGl0J3MgYSBtYXRjaCB0byBhbnkgc2V0IG9mIG15c3RlcnkgY29tcG9uZW50c1xyXG4gICAgICAgIGFycmF5TGVuZ3RoID0gdGhpcy5zY2VuZURhdGEubXlzdGVyaWVzW2Nob2ljZTBdLmNvbXBvbmVudHMubGVuZ3RoO1xyXG4gICAgICAgIHZhciB0YXJnZXRSZXNwb25zZSA9IC0xO1xyXG4gICAgICAgIGZvcihpID0gMDsgaSA8IGFycmF5TGVuZ3RoOyBpKyspe1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0RGF0YSA9IHRoaXMuc2NlbmVEYXRhLm15c3Rlcmllc1tjaG9pY2UwXS5jb21wb25lbnRzW2ldO1xyXG4gICAgICAgICAgICBpZigodGFyZ2V0RGF0YS5wYXJ0MSArIFwiXCIpID09PSBjaG9pY2UxKXtcclxuICAgICAgICAgICAgICAgIGlmKCh0YXJnZXREYXRhLnBhcnQyICsgXCJcIikgPT09IGNob2ljZTIpe1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKCh0YXJnZXREYXRhLnBhcnQzICsgXCJcIikgPT09IGNob2ljZTMpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRSZXNwb25zZSA9IGk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9jb3N0IG9mIHRoZSBhY3Rpb24gaGVyZVxyXG4gICAgICAgIGlmKHRhcmdldFJlc3BvbnNlID09PSAtMSl7XHJcbiAgICAgICAgICAgIC8vcXVldWUgYSBub3RpZmljYXRpb25cclxuICAgICAgICAgICAgLy90aGlzLmFjdGl2ZUJvYXJkLl9ub3RpZnkoXCJBIGNvbmNsdXNpb24gY291bGQgbm90IGJlIHJlYWNoZWQgd2l0aCB0aGlzIGNvbWJpbmF0aW9uIG9mIGV2aWRlbmNlLlwiKTtcclxuICAgICAgICAgICAgLy9DT1NUIFRPRE86IFxyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUJvYXJkLl9hZGRBY3Rpb24oeyBcInR5cGVcIjogXCJzcGVuZFRpbWVcIiwgXCJ0YXJnZXRcIjogeyBcImNvc3RcIjogMSwgXCJub3RpZmljYXRpb25cIjogXCJBIGNvbmNsdXNpb24gY291bGQgbm90IGJlIHJlYWNoZWQgd2l0aCB0aGlzIGNvbWJpbmF0aW9uIG9mIGV2aWRlbmNlLlwiIH0gfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIC8vaGlkZSBteXN0ZXJ5TGF5ZXJcclxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJteXN0ZXJ5TGF5ZXJcIikuY2xhc3NOYW1lID0gXCJoaWRkZW5MYXllclwiO1xyXG4gICAgICAgICAgICAvL3F1ZXVlIHRoZSBhY3Rpb25zIGZyb20gdGhlIHJlc3BvbnNlIGFycmF5XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXRSZXN1bHRzID0gdGhpcy5zY2VuZURhdGEubXlzdGVyaWVzW2Nob2ljZTBdLmNvbXBvbmVudHNbdGFyZ2V0UmVzcG9uc2VdLnJlc3VsdDtcclxuICAgICAgICAgICAgYXJyYXlMZW5ndGggPSB0YXJnZXRSZXN1bHRzLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yKGkgPSAwOyBpIDwgYXJyYXlMZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUJvYXJkLl9hZGRBY3Rpb24odGFyZ2V0UmVzdWx0c1tpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxufVxyXG5cclxuLy9wb3B1bGF0ZSB0aGUgbXlzdGVyeSBsYXllciBkZXBlbmRpbmcgb24gcGFyYW1ldGVyc1xyXG52YXIgX3BvcHVsYXRlTXlzdGVyeUxheWVyID0gZnVuY3Rpb24ocG9wdWxhdGlvbk1vZGUpeyAgICAgIFxyXG4gICAgLy9yZXNldCB2YXJpYWJsZXNcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlzdGVyeVNjcm9sbGVyT3ZlcmZsb3dcIikuaW5uZXJIVE1MID0gXCJcIjtcclxuICAgIHRyeXtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm15c3RlcnlTY3JvbGxlck92ZXJmbG93XCIpLnNjcm9sbFRvKDAsIDApO1xyXG4gICAgfVxyXG4gICAgY2F0Y2goZSkgeyBcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkN1cnJlbnQgYnJvd3NlciB2ZXJzaW9uIGRvZXMgbm90IGFjY2VwdCBzY3JvbGx0byBmdW5jdGlvbi5cIik7XHJcbiAgICB9XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm15c3RlcnlJbmZvUHJvZmlsZVwiKS5jbGFzc05hbWUgPSBcImhpZGRlbkVsZW1lbnRcIjtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlzdGVyeUluZm9EZXNjcmlwdGlvblwiKS5pbm5lckhUTUwgPSBcIlwiO1xyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJteXN0ZXJ5SW5mb0J1dHRvblwiKS5jbGFzc05hbWUgPSBcImhpZGRlbkVsZW1lbnRcIjtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlzdGVyeUluZm9CdXR0b25cIikub25jbGljayA9IGZ1bmN0aW9uKCl7fVxyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJteXN0ZXJ5QWZmaXJtXCIpLmNsYXNzTmFtZSA9IFwiaGlkZGVuRWxlbWVudFwiO1xyXG4gICAgXHJcbiAgICAvL2VzdGFibGlzaCBpbXBvcnRhbnQgdmFyaWFibGVzIGFuZCBpdGVyYXRlIHRocm91Z2ggZWFjaCByZXZlbGF0aW9uIHRvIGdlbmVydGUgYW4gYXJyYXlcclxuICAgIHZhciBpO1xyXG4gICAgdmFyIGFycmF5TGVuZ3RoO1xyXG4gICAgdmFyIGNvbWJpbmVkQXJyYXkgPSBbXTtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlzdGVyeVNjcm9sbGVyXCIpLmNsYXNzTmFtZSA9IFwiXCI7XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm15c3RlcnlJbmZvXCIpLmNsYXNzTmFtZSA9IFwiXCI7XHJcbiAgICBcclxuICAgIC8vbXlzdGVyeSBzZWxlY3RcclxuICAgIGlmKHBvcHVsYXRpb25Nb2RlID09PSAwKXtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm15c3RlcnlUaXRsZVwiKS5pbm5lckhUTUwgPSBcIkNyYWNrIHRoZSBDYXNlXCI7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJteXN0ZXJ5U3VidGl0bGVcIikuaW5uZXJIVE1MID0gXCJBdHRlbXB0IHRvIHNvbHZlIG9uZSBvZiB0aGUgY2FzZSdzIG15c3RlcmllcyB1c2luZyBjbHVlcyB5b3UgaGF2ZSBnYXRoZXJlZC5cIjtcclxuICAgICAgICBhcnJheUxlbmd0aCA9IHRoaXMuc2NlbmVEYXRhLm15c3Rlcmllcy5sZW5ndGg7XHJcbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgYXJyYXlMZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgICAgIGlmKHRoaXMuc2NlbmVEYXRhLm15c3Rlcmllc1tpXS52aXNpYmxlKXtcclxuICAgICAgICAgICAgICAgIGNvbWJpbmVkQXJyYXkucHVzaCh0aGlzLnNjZW5lRGF0YS5teXN0ZXJpZXNbaV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy9wZXJzb24gb2YgaW50ZXJlc3RcclxuICAgIGlmKHBvcHVsYXRpb25Nb2RlID09PSAxIHx8IHBvcHVsYXRpb25Nb2RlID09PSA0KXtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm15c3RlcnlUaXRsZVwiKS5pbm5lckhUTUwgPSBcIlBlcnNvbiBvZiBJbnRlcmVzdFwiO1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlzdGVyeVN1YnRpdGxlXCIpLmlubmVySFRNTCA9IHRoaXMuc2NlbmVEYXRhLm15c3Rlcmllc1t0aGlzLmdhbWVEYXRhUmVmZXJlbmNlLmdldEF0dHJpYnV0ZShcImRhdGEtbXlzdGVyeVZhcjBcIildLnN0YXRlbWVudDE7XHJcbiAgICAgICAgYXJyYXlMZW5ndGggPSB0aGlzLnNjZW5lRGF0YS5yZXZlbGF0aW9uc1swXS5sZW5ndGg7XHJcbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgYXJyYXlMZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgICAgIGlmKHRoaXMuc2NlbmVEYXRhLnJldmVsYXRpb25zWzBdW2ldLnZpc2libGUpe1xyXG4gICAgICAgICAgICAgICAgY29tYmluZWRBcnJheS5wdXNoKHRoaXMuc2NlbmVEYXRhLnJldmVsYXRpb25zWzBdW2ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vbWV0aG9kXHJcbiAgICBpZihwb3B1bGF0aW9uTW9kZSA9PT0gMiB8fCBwb3B1bGF0aW9uTW9kZSA9PT0gNCl7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJteXN0ZXJ5VGl0bGVcIikuaW5uZXJIVE1MID0gXCJNZXRob2RcIjtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm15c3RlcnlTdWJ0aXRsZVwiKS5pbm5lckhUTUwgPSB0aGlzLnNjZW5lRGF0YS5teXN0ZXJpZXNbdGhpcy5nYW1lRGF0YVJlZmVyZW5jZS5nZXRBdHRyaWJ1dGUoXCJkYXRhLW15c3RlcnlWYXIwXCIpXS5zdGF0ZW1lbnQyO1xyXG4gICAgICAgIGFycmF5TGVuZ3RoID0gdGhpcy5zY2VuZURhdGEucmV2ZWxhdGlvbnNbMV0ubGVuZ3RoO1xyXG4gICAgICAgIGZvcihpID0gMDsgaSA8IGFycmF5TGVuZ3RoOyBpKyspe1xyXG4gICAgICAgICAgICBpZih0aGlzLnNjZW5lRGF0YS5yZXZlbGF0aW9uc1sxXVtpXS52aXNpYmxlKXtcclxuICAgICAgICAgICAgICAgIGNvbWJpbmVkQXJyYXkucHVzaCh0aGlzLnNjZW5lRGF0YS5yZXZlbGF0aW9uc1sxXVtpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvL21vdGl2ZVxyXG4gICAgaWYocG9wdWxhdGlvbk1vZGUgPT09IDMgfHwgcG9wdWxhdGlvbk1vZGUgPT09IDQpe1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlzdGVyeVRpdGxlXCIpLmlubmVySFRNTCA9IFwiTW90aXZlXCI7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJteXN0ZXJ5U3VidGl0bGVcIikuaW5uZXJIVE1MID0gdGhpcy5zY2VuZURhdGEubXlzdGVyaWVzW3RoaXMuZ2FtZURhdGFSZWZlcmVuY2UuZ2V0QXR0cmlidXRlKFwiZGF0YS1teXN0ZXJ5VmFyMFwiKV0uc3RhdGVtZW50MztcclxuICAgICAgICBhcnJheUxlbmd0aCA9IHRoaXMuc2NlbmVEYXRhLnJldmVsYXRpb25zWzJdLmxlbmd0aDtcclxuICAgICAgICBmb3IoaSA9IDA7IGkgPCBhcnJheUxlbmd0aDsgaSsrKXtcclxuICAgICAgICAgICAgaWYodGhpcy5zY2VuZURhdGEucmV2ZWxhdGlvbnNbMl1baV0udmlzaWJsZSl7XHJcbiAgICAgICAgICAgICAgICBjb21iaW5lZEFycmF5LnB1c2godGhpcy5zY2VuZURhdGEucmV2ZWxhdGlvbnNbMl1baV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy92aWV3IHNwZWNpZmljIHN0dWZmIGZvciBwb3B1bGF0aW9uTW9kZSA0XHJcbiAgICBpZihwb3B1bGF0aW9uTW9kZSA9PT0gNCl7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJteXN0ZXJ5VGl0bGVcIikuaW5uZXJIVE1MID0gXCJJbXBvcnRhbnQgQ2x1ZXNcIjtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm15c3RlcnlTdWJ0aXRsZVwiKS5pbm5lckhUTUwgPSBcIk5vdGFibGUgY2x1ZXMgY29sbGVjdGVkIGR1cmluZyBpbnZlc3RpZ2F0aW9uIHRoYXQgbWF5IHByb3ZlIHZpdGFsIGZvciBjcmFja2luZyB0aGUgY2FzZS5cIjtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy9pZiB0aGUgY29tYmluZWQgYXJyYXkgaXMgZW1wdHksIHBvcHVsYXRlIGl0IHdpdGggYSBwbGFjZWhvbGRlclxyXG4gICAgaWYoY29tYmluZWRBcnJheS5sZW5ndGggPT09IDApe1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlzdGVyeVNjcm9sbGVyT3ZlcmZsb3dcIikuaW5uZXJIVE1MID0gXCI8cCBpZD0nbXlzdGVyeVNjcm9sbGVyUGxhY2Vob2xkZXInPlRoZXJlIGN1cnJlbnRseSBpcyBub3RoaW5nIGhlcmUuIENvbnRpbnVlIHRoZSBpbnZlc3RpZ2F0aW9uIGFuZCBzZWFyY2ggZm9yIGNsdWVzLjwvcD5cIjtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy91c2UgdGhlIGRhdGEgZnJvbSB0aGUgYXJyYXkgdG8gcG9wdWxhdGUgdGhlIHNjcm9sbGVyXHJcbiAgICBhcnJheUxlbmd0aCA9IGNvbWJpbmVkQXJyYXkubGVuZ3RoO1xyXG4gICAgZm9yKGkgPSAwOyBpIDwgYXJyYXlMZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgdmFyIHRhcmdldERhdGEgPSBjb21iaW5lZEFycmF5W2ldO1xyXG4gICAgICAgIC8vZGVjbGFyZSB0aGUgbmV3IGVsZW1lbnQgYW5kIHNldCBhdHRyaWJ1dGVzXHJcbiAgICAgICAgdmFyIHRhcmdldEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgIHRhcmdldEVsZW1lbnQuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgXCJteXN0ZXJ5U2Nyb2xsZXJFbGVtZW50XCIpO1xyXG4gICAgICAgIHRhcmdldEVsZW1lbnQuc2V0QXR0cmlidXRlKFwiZGF0YS1uYW1lXCIsIHRhcmdldERhdGEubmFtZSk7XHJcbiAgICAgICAgdGFyZ2V0RWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJkYXRhLXR5cGVcIiwgdGFyZ2V0RGF0YS50eXBlKTtcclxuICAgICAgICB0YXJnZXRFbGVtZW50LnNldEF0dHJpYnV0ZShcImRhdGEtZGVzY3JpcHRpb25cIiwgdGFyZ2V0RGF0YS5kZXNjcmlwdGlvbik7XHJcbiAgICAgICAgdGFyZ2V0RWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJkYXRhLWltYWdlXCIsIHRhcmdldERhdGEuaW1hZ2UpO1xyXG4gICAgICAgIHRhcmdldEVsZW1lbnQuc2V0QXR0cmlidXRlKFwiZGF0YS1tb2RlXCIsIHBvcHVsYXRpb25Nb2RlKTtcclxuICAgICAgICB0YXJnZXRFbGVtZW50LnNldEF0dHJpYnV0ZShcImRhdGEtaW5kZXhTZWxmXCIsIHRhcmdldERhdGEuaW5kZXhTZWxmKTtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm15c3RlcnlTY3JvbGxlclwiKS5jbGFzc05hbWUgPSBcIlwiO1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlzdGVyeUluZm9cIikuY2xhc3NOYW1lID0gXCJcIjtcclxuICAgICAgICBcclxuICAgICAgICAvL2NvbmZpZ3VyZSBpbWFnZVxyXG4gICAgICAgIHZhciBteXN0ZXJ5U2Nyb2xsZXJJbWFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIik7XHJcbiAgICAgICAgbXlzdGVyeVNjcm9sbGVySW1hZ2Uuc2V0QXR0cmlidXRlKFwic3JjXCIsIHRhcmdldERhdGEuaW1hZ2UpO1xyXG4gICAgICAgIHRhcmdldEVsZW1lbnQuYXBwZW5kQ2hpbGQobXlzdGVyeVNjcm9sbGVySW1hZ2UpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vY29uZmlndXJlIHRleHRcclxuICAgICAgICB2YXIgdGV4dENvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgdmFyIHRleHRDaGlsZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwXCIpO1xyXG4gICAgICAgIHRleHRDaGlsZC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0YXJnZXREYXRhLm5hbWUpKTtcclxuICAgICAgICB0ZXh0Q2hpbGQuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgXCJteXN0ZXJ5U2Nyb2xsZXJFbGVtZW50VXBwZXJcIik7XHJcbiAgICAgICAgdGV4dENvbnRhaW5lci5hcHBlbmRDaGlsZCh0ZXh0Q2hpbGQpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRleHRDaGlsZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwXCIpO1xyXG4gICAgICAgIHRleHRDaGlsZC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0YXJnZXREYXRhLnR5cGUpKTtcclxuICAgICAgICB0ZXh0Q2hpbGQuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgXCJteXN0ZXJ5U2Nyb2xsZXJFbGVtZW50TG93ZXJcIik7XHJcbiAgICAgICAgdGV4dENvbnRhaW5lci5hcHBlbmRDaGlsZCh0ZXh0Q2hpbGQpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRhcmdldEVsZW1lbnQuYXBwZW5kQ2hpbGQodGV4dENvbnRhaW5lcik7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9hZGQgY2xpY2sgZXZlbnRcclxuICAgICAgICB0YXJnZXRFbGVtZW50Lm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAvL3BvcHVsYXRlIGRhdGEgaW4gdmlzdWFsIGVsZW1lbnRzXHJcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlzdGVyeUluZm9Qcm9maWxlXCIpLmNsYXNzTmFtZSA9IFwiXCI7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlzdGVyeUluZm9Qcm9maWxlSW1hZ2VcIikuc3JjID0gdGhpcy5nZXRBdHRyaWJ1dGUoXCJkYXRhLWltYWdlXCIpO1xyXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm15c3RlcnlJbmZvUHJvZmlsZVVwcGVyXCIpLmlubmVySFRNTCA9IHRoaXMuZ2V0QXR0cmlidXRlKFwiZGF0YS1uYW1lXCIpO1xyXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm15c3RlcnlJbmZvUHJvZmlsZUxvd2VyXCIpLmlubmVySFRNTCA9IHRoaXMuZ2V0QXR0cmlidXRlKFwiZGF0YS10eXBlXCIpO1xyXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm15c3RlcnlJbmZvRGVzY3JpcHRpb25cIikuaW5uZXJIVE1MID0gdGhpcy5nZXRBdHRyaWJ1dGUoXCJkYXRhLWRlc2NyaXB0aW9uXCIpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy9zZXQgbXlzdGVyeUluZm9CdXR0b24gZnVuY3Rpb25hbGl0eSBiYXNlZCBvbiB3aGF0IHBvcHVsYXRpb24gc3RlcCB5b3UncmUgb25cclxuICAgICAgICAgICAgaWYodGhpcy5nZXRBdHRyaWJ1dGUoXCJkYXRhLW1vZGVcIikgIT09IFwiNFwiKXtcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlzdGVyeUluZm9CdXR0b25cIikuY2xhc3NOYW1lID0gXCJcIjtcclxuICAgICAgICAgICAgICAgIGlmKHRoaXMuZ2V0QXR0cmlidXRlKFwiZGF0YS1tb2RlXCIpID09PSBcIjBcIil7XHJcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lRGF0YVwiKS5zZXRBdHRyaWJ1dGUoXCJkYXRhLW15c3RlcnlWYXIwXCIsIHRoaXMuZ2V0QXR0cmlidXRlKFwiZGF0YS1pbmRleFNlbGZcIikpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlzdGVyeUluZm9CdXR0b25cIikub25jbGljayA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF9wb3B1bGF0ZU15c3RlcnlMYXllcigxKTtcclxuICAgICAgICAgICAgICAgICAgICB9IFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZih0aGlzLmdldEF0dHJpYnV0ZShcImRhdGEtbW9kZVwiKSA9PT0gXCIxXCIpe1xyXG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZURhdGFcIikuc2V0QXR0cmlidXRlKFwiZGF0YS1teXN0ZXJ5VmFyMVwiLCB0aGlzLmdldEF0dHJpYnV0ZShcImRhdGEtaW5kZXhTZWxmXCIpKTtcclxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm15c3RlcnlJbmZvQnV0dG9uXCIpLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBfcG9wdWxhdGVNeXN0ZXJ5TGF5ZXIoMik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZih0aGlzLmdldEF0dHJpYnV0ZShcImRhdGEtbW9kZVwiKSA9PT0gXCIyXCIpe1xyXG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZURhdGFcIikuc2V0QXR0cmlidXRlKFwiZGF0YS1teXN0ZXJ5VmFyMlwiLCB0aGlzLmdldEF0dHJpYnV0ZShcImRhdGEtaW5kZXhTZWxmXCIpKTtcclxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm15c3RlcnlJbmZvQnV0dG9uXCIpLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBfcG9wdWxhdGVNeXN0ZXJ5TGF5ZXIoMyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZih0aGlzLmdldEF0dHJpYnV0ZShcImRhdGEtbW9kZVwiKSA9PT0gXCIzXCIpe1xyXG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZURhdGFcIikuc2V0QXR0cmlidXRlKFwiZGF0YS1teXN0ZXJ5VmFyM1wiLCB0aGlzLmdldEF0dHJpYnV0ZShcImRhdGEtaW5kZXhTZWxmXCIpKTtcclxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm15c3RlcnlJbmZvQnV0dG9uXCIpLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL21ha2UgdGhlIGFmZmlybWF0aW9uIHNjcmVlbiBhcHBlYXJcclxuICAgICAgICAgICAgICAgICAgICAgICAgX3BvcHVsYXRlQWZmaXJtYXRpb24oKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9hcHBlbmQgdGhlIGVsZW1lbnQgdG8gdGhlIHNjcm9sbGVyXHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJteXN0ZXJ5U2Nyb2xsZXJPdmVyZmxvd1wiKS5hcHBlbmRDaGlsZCh0YXJnZXRFbGVtZW50KTtcclxuICAgIH0gICAgXHJcbiAgICBcclxuICAgIC8vbWFrZSB0aGUgbGF5ZXIgdmlzaWJsZVxyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJteXN0ZXJ5TGF5ZXJcIikuY2xhc3NOYW1lID0gXCJcIjtcclxufVxyXG5cclxuLy9wb3B1bGF0ZXMgYSBzdWJsYXllciBvZiB0aGUgbXlzdGVyeSBsYXllciB3aXRoIGluZm9ybWF0aW9uXHJcbnZhciBfcG9wdWxhdGVBZmZpcm1hdGlvbiA9IGZ1bmN0aW9uKCl7XHJcbiAgICAvL2NsZWFyIG91dCBwcmV2aW91cyBlbGVtZW50c1xyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJteXN0ZXJ5U2Nyb2xsZXJcIikuY2xhc3NOYW1lID0gXCJoaWRkZW5FbGVtZW50XCI7XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm15c3RlcnlJbmZvXCIpLmNsYXNzTmFtZSA9IFwiaGlkZGVuRWxlbWVudFwiO1xyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJteXN0ZXJ5VGl0bGVcIikuaW5uZXJIVE1MID0gXCJBZmZpcm1hdGlvblwiO1xyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJteXN0ZXJ5U3VidGl0bGVcIikuaW5uZXJIVE1MID0gdGhpcy5zY2VuZURhdGEubXlzdGVyaWVzW3RoaXMuZ2FtZURhdGFSZWZlcmVuY2UuZ2V0QXR0cmlidXRlKFwiZGF0YS1teXN0ZXJ5VmFyMFwiKV0ubmFtZTtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlzdGVyeUFmZmlybVwiKS5jbGFzc05hbWUgPSBcIlwiO1xyXG4gICAgLy9zZXQgdGhlIHZhcmlvdXMgYWZmaXJpbSBsYXllciB2YXJpYWJsZXNcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlzdGVyeUFmZmlybVN0YXRlbWVudDFcIikuaW5uZXJIVE1MID0gdGhpcy5zY2VuZURhdGEubXlzdGVyaWVzW3RoaXMuZ2FtZURhdGFSZWZlcmVuY2UuZ2V0QXR0cmlidXRlKFwiZGF0YS1teXN0ZXJ5VmFyMFwiKV0uc3RhdGVtZW50MTtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlzdGVyeUFmZmlybUltYWdlMVwiKS5zcmMgPSB0aGlzLnNjZW5lRGF0YS5yZXZlbGF0aW9uc1swXVt0aGlzLmdhbWVEYXRhUmVmZXJlbmNlLmdldEF0dHJpYnV0ZShcImRhdGEtbXlzdGVyeVZhcjFcIildLmltYWdlO1xyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJteXN0ZXJ5QWZmaXJtVXBwZXIxXCIpLmlubmVySFRNTCA9IHRoaXMuc2NlbmVEYXRhLnJldmVsYXRpb25zWzBdW3RoaXMuZ2FtZURhdGFSZWZlcmVuY2UuZ2V0QXR0cmlidXRlKFwiZGF0YS1teXN0ZXJ5VmFyMVwiKV0ubmFtZTtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlzdGVyeUFmZmlybUxvd2VyMVwiKS5pbm5lckhUTUwgPSB0aGlzLnNjZW5lRGF0YS5yZXZlbGF0aW9uc1swXVt0aGlzLmdhbWVEYXRhUmVmZXJlbmNlLmdldEF0dHJpYnV0ZShcImRhdGEtbXlzdGVyeVZhcjFcIildLnR5cGU7XHJcbiAgICBcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlzdGVyeUFmZmlybVN0YXRlbWVudDJcIikuaW5uZXJIVE1MID0gdGhpcy5zY2VuZURhdGEubXlzdGVyaWVzW3RoaXMuZ2FtZURhdGFSZWZlcmVuY2UuZ2V0QXR0cmlidXRlKFwiZGF0YS1teXN0ZXJ5VmFyMFwiKV0uc3RhdGVtZW50MjtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlzdGVyeUFmZmlybUltYWdlMlwiKS5zcmMgPSB0aGlzLnNjZW5lRGF0YS5yZXZlbGF0aW9uc1sxXVt0aGlzLmdhbWVEYXRhUmVmZXJlbmNlLmdldEF0dHJpYnV0ZShcImRhdGEtbXlzdGVyeVZhcjJcIildLmltYWdlO1xyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJteXN0ZXJ5QWZmaXJtVXBwZXIyXCIpLmlubmVySFRNTCA9IHRoaXMuc2NlbmVEYXRhLnJldmVsYXRpb25zWzFdW3RoaXMuZ2FtZURhdGFSZWZlcmVuY2UuZ2V0QXR0cmlidXRlKFwiZGF0YS1teXN0ZXJ5VmFyMlwiKV0ubmFtZTtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlzdGVyeUFmZmlybUxvd2VyMlwiKS5pbm5lckhUTUwgPSB0aGlzLnNjZW5lRGF0YS5yZXZlbGF0aW9uc1sxXVt0aGlzLmdhbWVEYXRhUmVmZXJlbmNlLmdldEF0dHJpYnV0ZShcImRhdGEtbXlzdGVyeVZhcjJcIildLnR5cGU7XHJcbiAgICBcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlzdGVyeUFmZmlybVN0YXRlbWVudDNcIikuaW5uZXJIVE1MID0gdGhpcy5zY2VuZURhdGEubXlzdGVyaWVzW3RoaXMuZ2FtZURhdGFSZWZlcmVuY2UuZ2V0QXR0cmlidXRlKFwiZGF0YS1teXN0ZXJ5VmFyMFwiKV0uc3RhdGVtZW50MztcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlzdGVyeUFmZmlybUltYWdlM1wiKS5zcmMgPSB0aGlzLnNjZW5lRGF0YS5yZXZlbGF0aW9uc1syXVt0aGlzLmdhbWVEYXRhUmVmZXJlbmNlLmdldEF0dHJpYnV0ZShcImRhdGEtbXlzdGVyeVZhcjNcIildLmltYWdlO1xyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJteXN0ZXJ5QWZmaXJtVXBwZXIzXCIpLmlubmVySFRNTCA9IHRoaXMuc2NlbmVEYXRhLnJldmVsYXRpb25zWzJdW3RoaXMuZ2FtZURhdGFSZWZlcmVuY2UuZ2V0QXR0cmlidXRlKFwiZGF0YS1teXN0ZXJ5VmFyM1wiKV0ubmFtZTtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlzdGVyeUFmZmlybUxvd2VyM1wiKS5pbm5lckhUTUwgPSB0aGlzLnNjZW5lRGF0YS5yZXZlbGF0aW9uc1syXVt0aGlzLmdhbWVEYXRhUmVmZXJlbmNlLmdldEF0dHJpYnV0ZShcImRhdGEtbXlzdGVyeVZhcjNcIildLnR5cGU7XHJcbiAgICBcclxufVxyXG5cclxuLy9yZWFkcyBkYXRhIGZyb20gdGhlIHNjZW5lIG1hbmlmZXN0XHJcbmZ1bmN0aW9uIGRhdGFMb2FkZWRDYWxsYmFjayhyZXNwb25zZSl7XHJcbiAgICAvL3BvcHVsYXRlIGFycmF5IHdpdGgganNvblxyXG4gICAgdGhpcy5zY2VuZURhdGEgPSBKU09OLnBhcnNlKHJlc3BvbnNlKTsgICAgXHJcbiAgICBcclxuICAgIC8vbG9hZCBpbmRpdmlkdWFsIGJvYXJkIGRhdGEgdG8gdGhlIHNjZW5lRGF0YSBhcnJheVxyXG4gICAgdmFyIGk7XHJcbiAgICB2YXIgYXJyYXlMZW5ndGggPSB0aGlzLnNjZW5lRGF0YS5zY2VuZXMubGVuZ3RoO1xyXG4gICAgZm9yKGkgPSAwOyBpIDwgYXJyYXlMZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgdGhpcy5ib2FyZERhdGFBcnJheVtpXSA9IG5ldyBCb2FyZERhdGEodGhpcy5zY2VuZURhdGEuc2NlbmVzW2ldLmJvYXJkKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy9kZWFsIHdpdGggc2Nyb2xsZXIgc3R1ZmZcclxuICAgIF9pbml0aWFsaXplU2Nyb2xsZXIoKTtcclxuICAgIFxyXG4gICAgLy9zZXQgYSBuZWNlc3NhcnkgZGVmYXVsdCB2YWx1ZXMgaW4gZ2FtZWRhdGFcclxuICAgIHRoaXMuZ2FtZURhdGFSZWZlcmVuY2Uuc2V0QXR0cmlidXRlKFwiZGF0YS1teXN0ZXJ5VmFyMFwiLCBcIjBcIik7XHJcbiAgICB0aGlzLmdhbWVEYXRhUmVmZXJlbmNlLnNldEF0dHJpYnV0ZShcImRhdGEtY2FzZVRpbWVcIiwgdGhpcy5zY2VuZURhdGEuY2FzZVRpbWUpO1xyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0aW1lUmVtYWluaW5nVGV4dFwiKS5pbm5lckhUTUwgPSB0aGlzLmdhbWVEYXRhUmVmZXJlbmNlLmdldEF0dHJpYnV0ZShcImRhdGEtY2FzZVRpbWVcIik7XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNlbGVjdFRpbWVSZW1haW5pbmdUZXh0XCIpLmlubmVySFRNTCA9IHRoaXMuZ2FtZURhdGFSZWZlcmVuY2UuZ2V0QXR0cmlidXRlKFwiZGF0YS1jYXNlVGltZVwiKTtcclxuICAgIFxyXG4gICAgLy9pdCBpcyBzYWZlIHRvIHN0YXJ0IGNoZWNraW5nIHRoYXQgZXZlcnkgcGllY2UgaGFzIGJlZW4gbG9hZGVkXHJcbiAgICB0aGlzLmxvYWRTdGFydGVkID0gdHJ1ZTtcclxufVxyXG5cclxuZnVuY3Rpb24gX2luaXRpYWxpemVTY3JvbGxlcigpe1xyXG4gICAgLy9zZXQgb3ZlcmZsb3cgdG8gbm90aGluZyB0byBzdGFydFxyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZWxlY3RTY3JvbGxlck92ZXJmbG93XCIpLmlubmVySFRNTCA9IFwiXCI7XHJcbiAgICBcclxuICAgIC8vcG9wdWxhdGUgdGhlIHNjcm9sbGVyYXJyYXksIGJ1dCBzZXQgcHJvcGVyIHZpc2liaWxpdHlcclxuICAgIC8vaXRlcmF0ZSB0aHJvdWdoIGNvbnRlbnQgYXJyYXkgYW5kIHBvcHVsYXRlIHNjcm9sbGVyIHdpdGggY29udGVudFxyXG4gICAgdmFyIHNjcm9sbGVyaHRtbCA9IFwiXCI7XHJcbiAgICB2YXIgaTtcclxuICAgIHZhciBhcnJheUxlbmd0aCA9IHRoaXMuc2NlbmVEYXRhLnNjZW5lcy5sZW5ndGg7XHJcbiAgICBmb3IoaSA9IDA7IGkgPCBhcnJheUxlbmd0aDsgaSsrKXtcclxuICAgICAgICAvL3NldCB2YXJpYWJsZXMgbG9jYWwgdG8gZWFjaCBpbmRpdmlkdWFsIGVsZW1lbnRcclxuICAgICAgICB2YXIgdGFyZ2V0RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgdGFyZ2V0RWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBcInNlbGVjdFNjcm9sbGVyRWxlbWVudFwiKTtcclxuICAgICAgICAvL3RleHRcclxuICAgICAgICB2YXIgc2Nyb2xsZXJUZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInBcIik7XHJcbiAgICAgICAgc2Nyb2xsZXJUZXh0LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMuc2NlbmVEYXRhLnNjZW5lc1tpXS5uYW1lKSk7XHJcbiAgICAgICAgdGFyZ2V0RWxlbWVudC5hcHBlbmRDaGlsZChzY3JvbGxlclRleHQpO1xyXG4gICAgICAgIC8vbmV3IHRhZ1xyXG4gICAgICAgIHZhciBuZXdUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicFwiKVxyXG4gICAgICAgIG5ld1RhZy5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBcIm5ld1RhZ1wiKTtcclxuICAgICAgICBuZXdUYWcuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJORVdcIikpO1xyXG4gICAgICAgIHRhcmdldEVsZW1lbnQuYXBwZW5kQ2hpbGQobmV3VGFnKTtcclxuICAgICAgICAvL2hpZGUgaWYgYWxyZWFkeSBzZWxlY3RlZFxyXG4gICAgICAgIGlmKHRoaXMuc2NlbmVEYXRhLnNjZW5lc1tpXS52aXNpYmxlID09PSAxKXtcclxuICAgICAgICAgICAgdGFyZ2V0RWxlbWVudC5jaGlsZE5vZGVzWzFdLmNsYXNzTmFtZSA9IFwiaGlkZGVuRWxlbWVudFwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgLy9hdHRyaWJ1dGVzXHJcbiAgICAgICAgdGFyZ2V0RWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJkYXRhLWJvYXJkSW5kZXhcIiwgaSk7XHJcbiAgICAgICAgdGFyZ2V0RWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJkYXRhLWltYWdlXCIsIHRoaXMuc2NlbmVEYXRhLnNjZW5lc1tpXS5pbWFnZSk7XHJcbiAgICAgICAgdGFyZ2V0RWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJkYXRhLW5hbWVcIiwgdGhpcy5zY2VuZURhdGEuc2NlbmVzW2ldLm5hbWUpO1xyXG4gICAgICAgIHRhcmdldEVsZW1lbnQuc2V0QXR0cmlidXRlKFwiZGF0YS1kZXNjcmlwdGlvblwiLCB0aGlzLnNjZW5lRGF0YS5zY2VuZXNbaV0uZGVzY3JpcHRpb24pO1xyXG4gICAgICAgIHRhcmdldEVsZW1lbnQuc2V0QXR0cmlidXRlKFwiZGF0YS12aXNpYmlsaXR5XCIsIHRoaXMuc2NlbmVEYXRhLnNjZW5lc1tpXS52aXNpYmxlKTtcclxuICAgICAgICBcclxuICAgICAgICAvL2NyZWF0ZSBvbmNsaWNrIGZ1bmN0aW9uXHJcbiAgICAgICAgdGFyZ2V0RWxlbWVudC5vbmNsaWNrID0gZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgLy9nZXQgdGhlIGluZGV4IGFzc2lnbmVkIHRvIHRoZSBzY3JvbGxlciBlbGVtZW50XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXRJbmRleCA9IHRoaXMuZ2V0QXR0cmlidXRlKFwiZGF0YS1ib2FyZEluZGV4XCIpO1xyXG4gICAgICAgICAgICAvL3NldCB0aGUgbWFzdGVyIGdhbWVEYXRhIGVsZW1lbnQncyB2YWx1ZSB0byB0aGUgdGFyZ2V0IGluZGV4XHJcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZURhdGFcIikuc2V0QXR0cmlidXRlKFwiZGF0YS1ib2FyZEluZGV4XCIsIHRhcmdldEluZGV4KTtcclxuICAgICAgICAgICAgLy9hZGRpdGlvbmFsbHkgdGVsbCB0aGUgZ2FtZURhdGEgZWxlbWVudCB0aGF0IHRoZSBib2FyZCBwcmV2aWV3IG5lZWRzIGEgcmVmcmVzaFxyXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVEYXRhXCIpLnNldEF0dHJpYnV0ZShcImRhdGEtYm9hcmRQcmV2aWV3UmVmcmVzaFwiLCB0cnVlKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZ2FtZURhdGEgZGF0YS1ib2FyZEluZGV4IHNldCB0byBcIiArIHRhcmdldEluZGV4KTtcclxuICAgICAgICAgICAgLy9jaGFuZ2UgYXJvdW5kIHZpc2libGUgZGF0YSBiYXNlZCB2YXJpYWJsZXMgc3RvcmVkIGluIHRoZSBzY3JvbGxlciBlbGVtZW50XHJcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2VsZWN0VGl0bGVcIikuaW5uZXJIVE1MID0gdGhpcy5nZXRBdHRyaWJ1dGUoXCJkYXRhLW5hbWVcIik7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2VsZWN0VGV4dFwiKS5pbm5lckhUTUwgPSB0aGlzLmdldEF0dHJpYnV0ZShcImRhdGEtZGVzY3JpcHRpb25cIik7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2VsZWN0SW1hZ2VcIikuc3JjID0gXCJjb250ZW50L3NjZW5lL1wiICsgdGhpcy5nZXRBdHRyaWJ1dGUoXCJkYXRhLWltYWdlXCIpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy9tYW5hZ2Ugc2VsZWN0aW9uXHJcbiAgICAgICAgICAgIC8vc2V0IGV2ZXJ5IHNjcm9sbGVyIGVsZW1lbnQgdG8gdW5zZWxlY3RlZFxyXG4gICAgICAgICAgICB2YXIgc2VsZWN0aW9uQXJyYXkgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwic2VsZWN0U2Nyb2xsZXJFbGVtZW50XCIpO1xyXG4gICAgICAgICAgICB2YXIgaTtcclxuICAgICAgICAgICAgdmFyIGFycmF5TGVuZ3RoID0gc2VsZWN0aW9uQXJyYXkubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IoaSA9IDA7IGkgPCBhcnJheUxlbmd0aDsgaSsrKXtcclxuICAgICAgICAgICAgICAgIC8vc2V0IGNsYXNzIGF0dHJpYnV0ZSB0byBkZWZhdWx0XHJcbiAgICAgICAgICAgICAgICBzZWxlY3Rpb25BcnJheVtpXS5jbGFzc05hbWUgPSBcInNlbGVjdFNjcm9sbGVyRWxlbWVudFwiO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvL3NldCB0YXJnZXQgZWxlbWVudCB2aXNpYmlsaXR5IHRvIGhpZGRlbiBpZiBuZWNlc3NhcnlcclxuICAgICAgICAgICAgICAgIGlmKHNlbGVjdGlvbkFycmF5W2ldLmdldEF0dHJpYnV0ZShcImRhdGEtdmlzaWJpbGl0eVwiKSA9PT0gXCIwXCIpe1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbkFycmF5W2ldLmNsYXNzTmFtZSA9IHNlbGVjdGlvbkFycmF5W2ldLmNsYXNzTmFtZSArIFwiIGhpZGRlbkVsZW1lbnRcIjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL21ha2UgdGhpcyBvbmUgc2VsZWN0ZWRcclxuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBcInNlbGVjdFNjcm9sbGVyRWxlbWVudCBzZWxlY3RlZFwiKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vaGlkZSB0aGUgbmV3IHRhZyBvZiB0aGlzIHBhcnRpY3VsYXIgc2Nyb2xsZXJFbGVtZW50XHJcbiAgICAgICAgICAgIHRoaXMuY2hpbGROb2Rlc1sxXS5jbGFzc05hbWUgPSBcImhpZGRlbkVsZW1lbnRcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5zY3JvbGxlckRhdGFbaV0gPSB0YXJnZXRFbGVtZW50O1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vYWRkIHRoZSBlbGVtZW50IHRvIHRoZSBzY3JvbGxlclxyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2VsZWN0U2Nyb2xsZXJPdmVyZmxvd1wiKS5hcHBlbmRDaGlsZCh0YXJnZXRFbGVtZW50KTtcclxuXHJcbiAgICB9XHJcbn1cclxuXHJcbi8vcGFzc2luZyBjb250ZXh0LCBjYW52YXMsIGRlbHRhIHRpbWUsIGNlbnRlciBwb2ludCwgdXNhYmxlIGhlaWdodCwgbW91c2Ugc3RhdGVcclxuR2FtZS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24ocENhbnZhc1N0YXRlLCBwTW91c2VTdGF0ZSl7XHJcbiAgICAvL3dpcGUgdGhlIGNhbnZhcyBiZWZvcmUgYW55dGhpbmcgZWxzZVxyXG4gICAgcGFpbnRlci5jbGVhcihwQ2FudmFzU3RhdGUuY3R4LCAwLCAwLCBwQ2FudmFzU3RhdGUud2lkdGgsIHBDYW52YXNTdGF0ZS5oZWlnaHQpO1xyXG4gICAgLy9jaGFuZ2UgdGhlIGN1cnNvciB0byBkZWZhdWx0XHJcbiAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwiZGVmYXVsdFwiO1xyXG4gICAgXHJcbiAgICAvL2Vuc3VyZSB0aGF0IGFsbCBkYXRhIGlzIGxvYWRlZCBiZWZvcmUgZXhlY3V0aW5nIGFueXRoaW5nXHJcbiAgICBpZih0aGlzLnNjZW5lRGF0YUxvYWRlZCl7XHJcbiAgICAgICAgaWYodGhpcy5waGFzZSA9PT0gXCJib2FyZFwiIHx8IHRoaXMucGhhc2UgPT09IFwiYm9hcmRUb1NlbGVjdFwiKXtcclxuICAgICAgICAgICAgLy9tYWtlIHN1cmUgdGhhdCB0aGUgZmFkZUFuaW1hdGlvbkxvY2sgaXMgb2ZmIGJlZm9yZSBhdHRlbXB0aW5nIHRvIHVwZGF0ZSB0aGUgYWN0aXZlIGJvYXJkXHJcbiAgICAgICAgICAgIGlmKHRoaXMuZmFkZUFuaW1hdGlvbkxvY2sgPT09IGZhbHNlIHx8IHRoaXMucGhhc2UgPT09IFwiYm9hcmRUb1NlbGVjdFwiKXtcclxuICAgICAgICAgICAgICAgIC8vdXBkYXRlIGtleSB2YXJpYWJsZXMgaW4gdGhlIGFjdGl2ZSBwaGFzZSwgZXhlY3V0aW5nIGFjdCBhbmQgZHJhd1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hY3RpdmVCb2FyZC51cGRhdGUocE1vdXNlU3RhdGUsIHBDYW52YXNTdGF0ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYodGhpcy5waGFzZSA9PT0gXCJzZWxlY3RcIiB8fCB0aGlzLnBoYXNlID09PSBcInNlbGVjdFRvQm9hcmRcIil7XHJcbiAgICAgICAgICAgIC8vZHJhdyBjYWxscyBmb3IgdGhlIHNlbGVjdCB2aWV3XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd1NlbGVjdChwQ2FudmFzU3RhdGUpO1xyXG4gICAgICAgICAgICAvL2lmIHRoZSBnYW1lIGRhdGEgdmFyaWFibGUgY2hlY2tzIGRlbm90ZXMgdGhhdCBhIHJlZnJlc2ggaXMgcmVxdWlyZWRcclxuICAgICAgICAgICAgaWYodGhpcy5nYW1lRGF0YVJlZmVyZW5jZS5nZXRBdHRyaWJ1dGUoXCJkYXRhLWJvYXJkUHJldmlld1JlZnJlc2hcIikgPT09IFwidHJ1ZVwiKXtcclxuICAgICAgICAgICAgICAgIC8vc2V0IHRoZSBtYW5hZ2VyIHZhcmlhYmxlIHRvIGZhbHNlIHRvIHByZXZlbnQgYSBhZGRpdGlvbmFsIGxvb3BzXHJcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVEYXRhUmVmZXJlbmNlLnNldEF0dHJpYnV0ZShcImRhdGEtYm9hcmRQcmV2aWV3UmVmcmVzaFwiLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAvL2dldCB0aGUgY3VycmVudCBpbmRleCBhbmQgc2V0IGl0IGFzIGEgcmVmZXJlbmNlXHJcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEJvYXJkSW5kZXggPSB0aGlzLmdhbWVEYXRhUmVmZXJlbmNlLmdldEF0dHJpYnV0ZShcImRhdGEtYm9hcmRJbmRleFwiKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy9wb3B1bGF0ZSB0aGUgcHJldmlldyBkaXYgaGVyZSBiYXNlZCBvbiBzY2VuZURhdGFcclxuICAgICAgICAgICAgICAgIHZhciBjb21wb3VuZEhUTUwgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbXBvdW5kSFRNTDIgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgdmFyIGk7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyYXlMZW5ndGggPSB0aGlzLnNjZW5lRGF0YS5zY2VuZXNbY3VycmVudEJvYXJkSW5kZXhdLmRhdGEuZXZpZGVuY2UubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgLy9pdGVyYXRlIGFuZCBkcmF3IHRoZSBjb25uZWN0aW5nIGxpbmVzXHJcbiAgICAgICAgICAgICAgICBmb3IoaSA9IDA7IGkgPCBhcnJheUxlbmd0aDsgaSsrKXtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudE5vZGUgPSB0aGlzLnNjZW5lRGF0YS5zY2VuZXNbY3VycmVudEJvYXJkSW5kZXhdLmRhdGEuZXZpZGVuY2VbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoY3VycmVudE5vZGUudmlzaWJsZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGN1cnJlbnROb2RlLnByZXZpb3VzLmxlbmd0aCA+IDApe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9nZXQgbWFwcGVkIGNvb3JkaW5hdGVzIGZvciB0aGUgY3VycmVudCBub2RlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJldmlld1ggPSBjdXJyZW50Tm9kZS5wcmV2aWV3WDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmV2aWV3WSA9IGN1cnJlbnROb2RlLnByZXZpZXdZO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9mb3IgYSBub2RlIHdpdGggdHdvIHBhcmVudHNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGN1cnJlbnROb2RlLnByZXZpb3VzLmxlbmd0aCA+IDEpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmV2aW91c1gxID0gdGhpcy5zY2VuZURhdGEuc2NlbmVzW2N1cnJlbnRCb2FyZEluZGV4XS5kYXRhLmV2aWRlbmNlW2N1cnJlbnROb2RlLnByZXZpb3VzWzBdXS5wcmV2aWV3WDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJldmlvdXNZMSA9IHRoaXMuc2NlbmVEYXRhLnNjZW5lc1tjdXJyZW50Qm9hcmRJbmRleF0uZGF0YS5ldmlkZW5jZVtjdXJyZW50Tm9kZS5wcmV2aW91c1swXV0ucHJldmlld1k7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByZXZpb3VzWDIgPSB0aGlzLnNjZW5lRGF0YS5zY2VuZXNbY3VycmVudEJvYXJkSW5kZXhdLmRhdGEuZXZpZGVuY2VbY3VycmVudE5vZGUucHJldmlvdXNbMV1dLnByZXZpZXdYO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmV2aW91c1kyID0gdGhpcy5zY2VuZURhdGEuc2NlbmVzW2N1cnJlbnRCb2FyZEluZGV4XS5kYXRhLmV2aWRlbmNlW2N1cnJlbnROb2RlLnByZXZpb3VzWzFdXS5wcmV2aWV3WTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2RyYXcgdGhlIGNvbm5lY3RvciBmb3IgdGhlIHJlc3VsdGluZyBub2RlIGFuZCB0aGUgY2VudGVyIHBvaW50IG9mIHRoZSB0d28gcHJldmlvdXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wb3VuZEhUTUwgKz0gXCI8bGluZSB4MT0nXCIgKyBwcmV2aWV3WCArIFwiJScgeTE9J1wiICsgcHJldmlld1kgKyBcIiUnIHgyPSdcIiArIChwcmV2aW91c1gxICsgcHJldmlvdXNYMikvMiArIFwiJScgeTI9J1wiICsgKHByZXZpb3VzWTEgKyBwcmV2aW91c1kyKS8yICsgXCIlJyBjbGFzcz0nc2VsZWN0Qm9hcmRQcmV2aWV3T3V0bGluZScgLz5cIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wb3VuZEhUTUwyICs9IFwiPGxpbmUgeDE9J1wiICsgcHJldmlld1ggKyBcIiUnIHkxPSdcIiArIHByZXZpZXdZICsgXCIlJyB4Mj0nXCIgKyAocHJldmlvdXNYMSArIHByZXZpb3VzWDIpLzIgKyBcIiUnIHkyPSdcIiArIChwcmV2aW91c1kxICsgcHJldmlvdXNZMikvMiArIFwiJScgY2xhc3M9J3NlbGVjdEJvYXJkUHJldmlld0xpbmUnIC8+XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9hZGQgdGhlIHR3byBsaW5lcyBjb25uZWN0aW5nIHRoZSBwcmV2aW91cyB0b2dldGhlclxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvdW5kSFRNTCArPSBcIjxsaW5lIHgxPSdcIiArIHByZXZpb3VzWDEgKyBcIiUnIHkxPSdcIiArIHByZXZpb3VzWTEgKyBcIiUnIHgyPSdcIiArIHByZXZpb3VzWDIgKyBcIiUnIHkyPSdcIiArIHByZXZpb3VzWTIgKyBcIiUnIGNsYXNzPSdzZWxlY3RCb2FyZFByZXZpZXdPdXRsaW5lJyAvPlwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvdW5kSFRNTDIgKz0gXCI8bGluZSB4MT0nXCIgKyBwcmV2aW91c1gxICsgXCIlJyB5MT0nXCIgKyBwcmV2aW91c1kxICsgXCIlJyB4Mj0nXCIgKyBwcmV2aW91c1gyICsgXCIlJyB5Mj0nXCIgKyBwcmV2aW91c1kyICsgXCIlJyBjbGFzcz0nc2VsZWN0Qm9hcmRQcmV2aWV3TGluZScgLz5cIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vZm9yIGEgbm9kZSB3aXRoIG9uZSBwYXJlbnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9zZXQgYSBsaW5lIGZyb20gdGhlIHByZXZpb3VzIG5vZGUgbG9jYXRpb24gdG8gY3VycmVudCBsb2NhdGlvblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmV2aW91c1gxID0gdGhpcy5zY2VuZURhdGEuc2NlbmVzW2N1cnJlbnRCb2FyZEluZGV4XS5kYXRhLmV2aWRlbmNlW2N1cnJlbnROb2RlLnByZXZpb3VzWzBdXS5wcmV2aWV3WDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJldmlvdXNZMSA9IHRoaXMuc2NlbmVEYXRhLnNjZW5lc1tjdXJyZW50Qm9hcmRJbmRleF0uZGF0YS5ldmlkZW5jZVtjdXJyZW50Tm9kZS5wcmV2aW91c1swXV0ucHJldmlld1k7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcG91bmRIVE1MICs9IFwiPGxpbmUgeDE9J1wiICsgcHJldmlld1ggKyBcIiUnIHkxPSdcIiArIHByZXZpZXdZICsgXCIlJyB4Mj0nXCIgKyBwcmV2aW91c1gxICsgXCIlJyB5Mj0nXCIgKyBwcmV2aW91c1kxICsgXCIlJyBjbGFzcz0nc2VsZWN0Qm9hcmRQcmV2aWV3T3V0bGluZScgLz5cIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wb3VuZEhUTUwgKz0gXCI8bGluZSB4MT0nXCIgKyBwcmV2aWV3WCArIFwiJScgeTE9J1wiICsgcHJldmlld1kgKyBcIiUnIHgyPSdcIiArIHByZXZpb3VzWDEgKyBcIiUnIHkyPSdcIiArIHByZXZpb3VzWTEgKyBcIiUnIGNsYXNzPSdzZWxlY3RCb2FyZFByZXZpZXdMaW5lJyAvPlwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZWxlY3RCb2FyZFByZXZpZXdMaW5lc1wiKS5pbm5lckhUTUwgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZWxlY3RCb2FyZFByZXZpZXdMaW5lc1wiKS5pbm5lckhUTUwgPSBjb21wb3VuZEhUTUw7XHJcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNlbGVjdEJvYXJkUHJldmlld0xpbmVzXCIpLmlubmVySFRNTCArPSBjb21wb3VuZEhUTUwyO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBjb21wb3VuZEhUTUwgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgLy9pdGVyYXRlIGFuZCBkcmF3IHRoZSBub2Rlc1xyXG4gICAgICAgICAgICAgICAgZm9yKGkgPSAwOyBpIDwgYXJyYXlMZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYodGhpcy5zY2VuZURhdGEuc2NlbmVzW2N1cnJlbnRCb2FyZEluZGV4XS5kYXRhLmV2aWRlbmNlW2ldLnZpc2libGUpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJldmlld1ggPSB0aGlzLnNjZW5lRGF0YS5zY2VuZXNbY3VycmVudEJvYXJkSW5kZXhdLmRhdGEuZXZpZGVuY2VbaV0ucHJldmlld1g7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmV2aWV3WSA9IHRoaXMuc2NlbmVEYXRhLnNjZW5lc1tjdXJyZW50Qm9hcmRJbmRleF0uZGF0YS5ldmlkZW5jZVtpXS5wcmV2aWV3WTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcG91bmRIVE1MICs9IFwiPGRpdiBjbGFzcz0nc2VsZWN0Qm9hcmRQcmV2aWV3Tm9kZScgc3R5bGU9J3RvcDogXCIgKyBwcmV2aWV3WSArIFwiJTsgbGVmdDogXCIgKyBwcmV2aWV3WCArIFwiJTsnPlwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb3VuZEhUTUwrPSBcIjxpbWcgY2xhc3M9J3NlbGVjdEJvYXJkUHJldmlld05vZGVJbWFnZScgc3JjPSdcIiArIHRoaXMuc2NlbmVEYXRhLnNjZW5lc1tjdXJyZW50Qm9hcmRJbmRleF0uZGF0YS5ldmlkZW5jZVtpXS5pbWFnZSArIFwiJz5cIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcG91bmRIVE1MICs9IFwiPC9kaXY+XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZWxlY3RCb2FyZFByZXZpZXdcIikuaW5uZXJIVE1MID0gY29tcG91bmRIVE1MO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYodGhpcy5waGFzZSA9PT0gXCJ0aXRsZVwiKXtcclxuICAgICAgICAgICAgdGhpcy5kcmF3VGl0bGUocENhbnZhc1N0YXRlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vaGFuZGxlIGZhZGUgYW5pbWF0aW9uIGxvY2tpbmdcclxuICAgICAgICBpZih0aGlzLmZhZGVBbmltYXRpb25Mb2NrID09PSB0cnVlKXtcclxuICAgICAgICAgICAgdmFyIGN1cnJlbnRUaW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcclxuICAgICAgICAgICAgLy9jaGVjayBhbmQgaW5pdGlhbGl6ZSB0aW1lciBpZiBuZWVkIGJlXHJcbiAgICAgICAgICAgIGlmKHRoaXMuZmFkZUFuaW1hdGlvbkxvY2tUaW1lciA9PT0gLTEpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5mYWRlQW5pbWF0aW9uTG9ja1RpbWVyID0gY3VycmVudFRpbWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoY3VycmVudFRpbWUgLSB0aGlzLmZhZGVBbmltYXRpb25Mb2NrVGltZXIgPiAyMDApe1xyXG4gICAgICAgICAgICAgICAgLy9zdWZmaWNpZW50IHRpbWUgaGFzIHBhc3NlZCBmb3IgdGhlIGFuaW1hdGlvbiB0byBjb21wbGV0ZSwgdGhlIHBoYXNlIGNhbiBzYWZlbHkgY2hhbmdlXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZhZGVBbmltYXRpb25Mb2NrID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZhZGVBbmltYXRpb25Mb2NrVGltZXIgPSAtMTtcclxuICAgICAgICAgICAgICAgIC8vaGlkZSB0aGUgdGl0bGUgbGF5ZXIgaWYgaXQgaXMgdmlzaWJsZVxyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0aXRsZUxheWVyXCIpLmNsYXNzTmFtZSA9IFwiaGlkZGVuRWxlbWVudFwiO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvL2RlcGVuZGluZyBvbiB3aGljaCBkaXJlY3Rpb24gdGhlIHBoYXNlcyBhcmUgZ29pbmcsIGRpZmZlcmVudCBlbGVtZW50cyB3aWxsIG5lZWQgdG8gYmUgbG9hZGVkXHJcbiAgICAgICAgICAgICAgICBpZih0aGlzLnBoYXNlID09PSBcImJvYXJkVG9TZWxlY3RcIiAmJiB0aGlzLnNjZW5lRGF0YUxvYWRlZCA9PT0gdHJ1ZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5waGFzZSA9IFwic2VsZWN0XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vcGhhc2UgaW4gc2VsZWN0IERPTSBlbGVtZW50c1xyXG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2VsZWN0TGF5ZXJcIikuY2xhc3NOYW1lID0gXCJcIjtcclxuICAgICAgICAgICAgICAgICAgICAvL2hpZGUgYm9hcmQgRE9NIGVsZW1lbnRzXHJcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJldmlkZW5jZUxheWVyXCIpLmNsYXNzTmFtZSA9IFwiaGlkZGVuRWxlbWVudFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYm9hcmRVSUxheWVyXCIpLmNsYXNzTmFtZSA9IFwiaGlkZGVuRWxlbWVudFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vd2lwZSB0aGUgY2FudmFzXHJcbiAgICAgICAgICAgICAgICAgICAgcGFpbnRlci5jbGVhcihwQ2FudmFzU3RhdGUuY3R4LCAwLCAwLCBwQ2FudmFzU3RhdGUud2lkdGgsIHBDYW52YXNTdGF0ZS5oZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmFkZUJsaW5kZXJcIikuY2xhc3NOYW1lID0gXCJoaWRkZW5MYXllclwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZih0aGlzLnBoYXNlID09PSBcInNlbGVjdFRvQm9hcmRcIil7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5waGFzZSA9IFwiYm9hcmRcIlxyXG4gICAgICAgICAgICAgICAgICAgIC8vY2hhbmdlIHZpc2liaWxpdHkgb2YgRE9NIGVsZW1lbnRzXHJcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZWxlY3RMYXllclwiKS5jbGFzc05hbWUgPSBcImhpZGRlbkVsZW1lbnRcIjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYodGhpcy5waGFzZSA9PT0gXCJ0aXRsZVRvQm9hcmRcIil7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5waGFzZSA9IFwiYm9hcmRcIlxyXG4gICAgICAgICAgICAgICAgICAgIC8vY2hhbmdlIHZpc2liaWxpdHkgb2YgRE9NIGVsZW1lbnRzXHJcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZWxlY3RMYXllclwiKS5jbGFzc05hbWUgPSBcImhpZGRlbkVsZW1lbnRcIjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vaWYgZXZlcnl0aGluZyBpcyBub3QgY29tcGxldGVseSBsb2FkZWQsIHJ1biB0aGlzXHJcbiAgICBlbHNlIGlmKHRoaXMuc2NlbmVEYXRhTG9hZGVkID09PSBmYWxzZSAmJiB0aGlzLmxvYWRTdGFydGVkID09PSB0cnVlKXtcclxuICAgICAgICAvL3BhcnNlIHRocm91Z2ggYm9hcmREYXRhQXJyYXkgYW5kIHNlZSBpZiBldmVyeXRoaW5nIGhhcyBsb2FkZWRcclxuICAgICAgICB2YXIgZmxhZyA9IHRydWU7XHJcbiAgICAgICAgdmFyIGk7XHJcbiAgICAgICAgdmFyIGFycmF5TGVuZ3RoID0gdGhpcy5ib2FyZERhdGFBcnJheS5sZW5ndGg7XHJcbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgYXJyYXlMZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgICAgIGlmKHRoaXMuYm9hcmREYXRhQXJyYXlbaV0ubG9hZGVkICE9PSB0cnVlKXtcclxuICAgICAgICAgICAgICAgIGZsYWcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vaWYgdGhpcyB2YXJpYWJsZSByZW1haW5zIHRydWUsIHRoaXMgc2VydmVzIGFzIGFuIGluaXRpYWxpemVyIGZvciBzb21lIHZhcmlhYmxlc1xyXG4gICAgICAgIGlmKGZsYWcpe1xyXG4gICAgICAgICAgICAvL3RyYW5zZmVyIGluZGl2aWR1YWwgYm9hcmQgZGF0YSB0byBzY2VuZXMgYXJyYXlcclxuICAgICAgICAgICAgZm9yKGkgPSAwOyBpIDwgdGhpcy5ib2FyZERhdGFBcnJheS5sZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjZW5lRGF0YS5zY2VuZXNbaV0uZGF0YSA9IHRoaXMuYm9hcmREYXRhQXJyYXlbaV0uZGF0YTtcclxuICAgICAgICAgICAgICAgIHZhciBqO1xyXG4gICAgICAgICAgICAgICAgdmFyIGV2aWRlbmNlQXJyYXkgPSB0aGlzLnNjZW5lRGF0YS5zY2VuZXNbaV0uZGF0YS5ldmlkZW5jZVxyXG4gICAgICAgICAgICAgICAgdmFyIGV2aWRlbmNlQXJyYXlMZW5ndGggPSBldmlkZW5jZUFycmF5Lmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIGZvcihqID0gMDsgaiA8IGV2aWRlbmNlQXJyYXlMZW5ndGg7IGorKyl7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZpZGVuY2VBcnJheVtqXS5wcmV2aWV3WCA9IHV0aWxpdHkubWFwKGV2aWRlbmNlQXJyYXlbal0ueCwgLTEwMCwgMTAwLCAwLCA5MCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZpZGVuY2VBcnJheVtqXS5wcmV2aWV3WSA9IHV0aWxpdHkubWFwKGV2aWRlbmNlQXJyYXlbal0ueSwgLTEwMCwgMTAwLCAwLCA5MCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy9zZXQgbG9hZGluZyBjb21wbGV0aW9uIGZsYWcgdG8gdHJ1ZVxyXG4gICAgICAgICAgICB0aGlzLnNjZW5lRGF0YUxvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIC8vd2lwZSB0aGUgbGVmdG92ZXIgZGF0YVxyXG4gICAgICAgICAgICB0aGlzLmJvYXJkRGF0YUFycmF5ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAvL3NldCB0aGUgdGFyZ2V0IGluZGV4IG9mIHRoZSBmaXJzdCBib2FyZFxyXG4gICAgICAgICAgICB0aGlzLmdhbWVEYXRhUmVmZXJlbmNlLnNldEF0dHJpYnV0ZShcImRhdGEtYm9hcmRJbmRleFwiLCB0aGlzLnNjZW5lRGF0YS5pbml0aWFsU2NlbmUpO1xyXG4gICAgICAgICAgICAvL3NldCB0aGUgYm9vbGVhbiB0aGF0IHRyYWNrcyB3aGV0aGVyIHRoZSBib2FyZCBwcmV2aWV3IHJlcXVpcmVzIGEgcmVmcmVzaFxyXG4gICAgICAgICAgICB0aGlzLmdhbWVEYXRhUmVmZXJlbmNlLnNldEF0dHJpYnV0ZShcImRhdGEtYm9hcmRQcmV2aWV3UmVmcmVzaFwiLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIC8vd2lwZSBjYW52YXMgYWRqdXN0IERPTSBhcyBuZWNlc3NhcnlcclxuICAgICAgICAgICAgdGhpcy5fY2hhbmdlVGl0bGVTY3JlZW4oXCJ0aXRsZVwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9kcmF3IGxvYWRpbmcgc2NyZWVuXHJcbiAgICAgICAgdGhpcy5kcmF3TG9hZGluZyhwQ2FudmFzU3RhdGUpO1xyXG4gICAgfVxyXG4gICAgXHJcbn1cclxuXHJcbkdhbWUucHJvdG90eXBlLl9jaGFuZ2VUaXRsZVNjcmVlbiA9IGZ1bmN0aW9uKHBUYXJnZXQpe1xyXG4gICAgaWYocFRhcmdldCA9PT0gXCJ0aXRsZVwiKXtcclxuICAgICAgICAvL2hpZGUgb3RoZXIgbGF5ZXJzXHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjcmVkaXRMYXllclwiKS5jbGFzc05hbWUgPSBcImhpZGRlbkVsZW1lbnRcIjtcclxuICAgICAgICAvL3NldCBET00gZGF0YVxyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidGl0bGVMYXllclN1YnRpdGxlXCIpLmlubmVySFRNTCA9IHRoaXMuc2NlbmVEYXRhLmNhc2VOYW1lO1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidGl0bGVMYXllckJhY2tncm91bmRcIikuc3JjID0gXCJjb250ZW50L3NjZW5lL1wiICsgdGhpcy5zY2VuZURhdGEudGl0bGVMYXllckJhY2tncm91bmQ7XHJcbiAgICAgICAgLy9zZXQgYnV0dG9uIGludGVyYWN0aW9uXHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0aXRsZUxheWVyU3RhcnRCdXR0b25cIikub25jbGljayA9IGZ1bmN0aW9uKCl7IFxyXG4gICAgICAgICAgICAvL3N0YXJ0IHRoZSBwaGFzZSBjaGFuZ2UgcHJvY2Vzc1xyXG4gICAgICAgICAgICBfY2hhbmdlUGhhc2UoXCJib2FyZFwiKTtcclxuICAgICAgICB9LmJpbmQodGhpcyk7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0aXRsZUxheWVyQ3JlZGl0c0J1dHRvblwiKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsgdGhpcy5fY2hhbmdlVGl0bGVTY3JlZW4oXCJjcmVkaXRcIik7IH0uYmluZCh0aGlzKTtcclxuICAgICAgICAvL21ha2UgdGhlIGxheWVyIHZpc2libGVcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRpdGxlTGF5ZXJcIikuY2xhc3NOYW1lID0gXCJcIjtcclxuICAgIH0gZWxzZSBpZihwVGFyZ2V0ID09PSBcImNyZWRpdFwiKXtcclxuICAgICAgICAvL2hpZGUgb3RoZXIgbGF5ZXJzXHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0aXRsZUxheWVyXCIpLmNsYXNzTmFtZSA9IFwiaGlkZGVuRWxlbWVudFwiO1xyXG4gICAgICAgIC8vc2V0IERPTSBkYXRhXHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjcmVkaXRMYXllclNjZW5hcmlvXCIpLmlubmVySFRNTCA9IHRoaXMuc2NlbmVEYXRhLmNhc2VOYW1lO1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY3JlZGl0TGF5ZXJTY2VuYXJpb0NyZWRpdFwiKS5pbm5lckhUTUwgPSB0aGlzLnNjZW5lRGF0YS5hdXRob3I7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjcmVkaXRMYXllckJhY2tncm91bmRcIikuc3JjID0gXCJjb250ZW50L3NjZW5lL1wiICsgdGhpcy5zY2VuZURhdGEudGl0bGVMYXllckJhY2tncm91bmQ7XHJcbiAgICAgICAgLy9zZXQgYnV0dG9uIGludGVyYWN0aW9uXHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjcmVkaXRMYXllclJldHVybkJ1dHRvblwiKS5vbmNsaWNrID0gZnVuY3Rpb24oKXsgdGhpcy5fY2hhbmdlVGl0bGVTY3JlZW4oXCJ0aXRsZVwiKTsgfS5iaW5kKHRoaXMpO1xyXG4gICAgICAgIC8vbWFrZSB0aGUgbGF5ZXIgdmlzaWJsZVxyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY3JlZGl0TGF5ZXJcIikuY2xhc3NOYW1lID0gXCJcIjtcclxuICAgIH1cclxufVxyXG5cclxudmFyIF9jaGFuZ2VQaGFzZSA9IGZ1bmN0aW9uKHBUYXJnZXQpe1xyXG4gICAgY29uc29sZS5sb2coXCJFeGVjdXRpbmcgcGhhc2UgY2hhbmdlIFwiICsgdGhpcy5waGFzZSArIFwiIHRvIFwiICsgcFRhcmdldCk7XHJcbiAgICAvL2NhdGNoIHRoZSB0YXJnZXQgYW5kIGJlZ2luIHRoZSBjb3JyZWN0IHRyYW5zaXRpb24gcGhhc2VcclxuICAgIGlmKHRoaXMuZmFkZUFuaW1hdGlvbkxvY2sgPT09IGZhbHNlKXtcclxuICAgICAgICB0aGlzLmZhZGVBbmltYXRpb25Mb2NrID0gdHJ1ZTtcclxuICAgICAgICBcclxuICAgICAgICBpZihwVGFyZ2V0ID09PSBcInNlbGVjdFwiKXtcclxuICAgICAgICAgICAgdGhpcy5waGFzZSA9IFwiYm9hcmRUb1NlbGVjdFwiO1xyXG4gICAgICAgICAgICAvL3NldCBzZWxlY3Qgc2NyZWVuIGVsZW1lbnQgdmFyaWFibGVzIGJ5IGNsaWNraW5nIHRoZSBhY3RpdmUgYnV0dG9uXHJcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsZXJEYXRhW3RoaXMuZ2FtZURhdGFSZWZlcmVuY2UuZ2V0QXR0cmlidXRlKFwiZGF0YS1ib2FyZEluZGV4XCIpXS5jbGljaygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmKHBUYXJnZXQgPT09IFwiYm9hcmRcIil7XHJcbiAgICAgICAgICAgIC8vZGlmZmVyZW50aWF0ZXMgYmV0d2VlbiBUb0JvYXJkIHR5cGVzLiBDaGFuZ2VzIHdoYXQgbmVlZHMgdG8gYmUgbG9hZGVkXHJcbiAgICAgICAgICAgIGlmKHRoaXMucGhhc2UgPT0gXCJ0aXRsZVwiKXtcclxuICAgICAgICAgICAgICAgIHRoaXMucGhhc2UgPSBcInRpdGxlVG9Cb2FyZFwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBoYXNlID0gXCJzZWxlY3RUb0JvYXJkXCJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL2JlZ2luIGxvYWRpbmcgdGhlIG5ldyBjb25zcGlyYWN5IGJvYXJkXHJcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlQm9hcmQgPSBuZXcgQm9hcmRQaGFzZSh0aGlzLnNjZW5lRGF0YS5zY2VuZXNbdGhpcy5nYW1lRGF0YVJlZmVyZW5jZS5nZXRBdHRyaWJ1dGUoXCJkYXRhLWJvYXJkSW5kZXhcIildLCBfY2hhbmdlUGhhc2UuYmluZCh0aGlzKSwgdGhpcy5fbW9kaWZ5RGF0YS5iaW5kKHRoaXMpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9iZWdpbiBibGluZGVyIGZhZGUgaW4gYXMgcGFydCBvZiB0aGUgcGhhc2UgdHJhbnNpdGlvblxyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmFkZUJsaW5kZXJcIikuY2xhc3NOYW1lID0gXCJcIjtcclxuICAgIH1cclxufVxyXG5cclxuLy9hbGxvd3MgYSBib2FyZERhdGEgb2JqZWN0IHRvIGNoYW5nZSBkYXRhIGluIHRoZSBwYXJlbnQgbGV2ZWxcclxuR2FtZS5wcm90b3R5cGUuX21vZGlmeURhdGEgPSBmdW5jdGlvbih0eXBlLCB0YXJnZXQpe1xyXG4gICAgaWYodHlwZSA9PT0gXCJ1bmxvY2tCb2FyZFwiKXtcclxuICAgICAgICAvL2NoYW5nZSBzY2VuZWRhdGEgdmlzaWJpbGl0eVxyXG4gICAgICAgIHRoaXMuc2NlbmVEYXRhLnNjZW5lc1t0YXJnZXRdLnZpc2libGUgPSAyO1xyXG4gICAgICAgIC8vdXNlIHNjZW5lZGF0YSB0byBjaGFuZ2Ugc2Nyb2xsZXIgdmlzaWJpbGl0eVxyXG4gICAgICAgIHZhciBpO1xyXG4gICAgICAgIHZhciBhcnJheUxlbmd0aCA9IHRoaXMuc2NlbmVEYXRhLnNjZW5lcy5sZW5ndGg7XHJcbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgYXJyYXlMZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsZXJEYXRhW2ldLnNldEF0dHJpYnV0ZShcImRhdGEtdmlzaWJpbGl0eVwiLCB0YXJnZXQgKyBcIlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9wdXNoIGEgbm90aWZpY2F0aW9uXHJcbiAgICAgICAgdGhpcy5hY3RpdmVCb2FyZC5fbm90aWZ5KHRoaXMuc2NlbmVEYXRhLnNjZW5lc1t0YXJnZXRdLm5hbWUgKyBcIiBoYXMgYmVlbiBhZGRlZCB0byB5b3VyIGRlc3RpbmF0aW9ucy5cIik7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmKHR5cGUgPT09IFwidW5sb2NrQ2x1ZVwiKXtcclxuICAgICAgICAvL2NoYW5nZSB0aGUgdmlzaWJpbGl0eSBvZiB0aGUgdGFyZ2V0IGNsdWVcclxuICAgICAgICB0aGlzLnNjZW5lRGF0YS5yZXZlbGF0aW9uc1t0YXJnZXQuYXJyYXldW3RhcmdldC5jbHVlXS52aXNpYmxlID0gdHJ1ZTtcclxuICAgICAgICAvL3B1c2ggYSBub3RpZmljYXRpb25cclxuICAgICAgICB0aGlzLmFjdGl2ZUJvYXJkLl9ub3RpZnkodGhpcy5zY2VuZURhdGEucmV2ZWxhdGlvbnNbdGFyZ2V0LmFycmF5XVt0YXJnZXQuY2x1ZV0ubmFtZSArIFwiIGhhcyBiZWVuIGFkZGVkIGFzIGFuIGltcG9ydGFudCBjbHVlLlwiKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYodHlwZSA9PT0gXCJ1bmxvY2tNeXN0ZXJ5XCIpe1xyXG4gICAgICAgIC8vY2hhbmdlIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSB0YXJnZXQgbXlzdGVyeVxyXG4gICAgICAgIHRoaXMuc2NlbmVEYXRhLm15c3Rlcmllc1t0YXJnZXRdLnZpc2libGUgPSB0cnVlO1xyXG4gICAgICAgIC8vcHVzaCBhIG5vdGlmaWNhdGlvblxyXG4gICAgICAgIHRoaXMuYWN0aXZlQm9hcmQuX25vdGlmeShcIlxcXCJcIiArIHRoaXMuc2NlbmVEYXRhLm15c3Rlcmllc1t0YXJnZXRdLm5hbWUgKyBcIlxcXCIgaGFzIGJlZW4gYWRkZWQgdG8gdGhlIGxpc3Qgb2YgdW5zb2x2ZWQgbXlzdGVyaWVzLlwiKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYodHlwZSA9PT0gXCJsb2NrTXlzdGVyeVwiKXtcclxuICAgICAgICAvL2NoYW5nZSB0aGUgdmlzaWJpbGl0eSBvZiB0aGUgdGFyZ2V0IG15c3RlcnlcclxuICAgICAgICB0aGlzLnNjZW5lRGF0YS5teXN0ZXJpZXNbdGFyZ2V0XS52aXNpYmxlID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5zY2VuZURhdGEubXlzdGVyaWVzW3RhcmdldF0uc29sdmVkID0gdHJ1ZTtcclxuICAgICAgICBcclxuICAgICAgICAvL3B1c2ggYSBub3RpZmljYXRpb25cclxuICAgICAgICB0aGlzLmFjdGl2ZUJvYXJkLl9ub3RpZnkoXCJcXFwiXCIgKyB0aGlzLnNjZW5lRGF0YS5teXN0ZXJpZXNbdGFyZ2V0XS5uYW1lICsgXCJcXFwiIGhhcyBiZWVuIHNvbHZlZC5cIik7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmKHR5cGUgPT09IFwidXBkYXRlTXlzdGVyeVwiKXtcclxuICAgICAgICAvL3B1c2ggYSBub3RpZmljYXRpb24gZmlyc3QgYmVmb3JlIHZhcmlhYmxlcyBoYXZlIGNoYW5nZVxyXG4gICAgICAgIHRoaXMuYWN0aXZlQm9hcmQuX25vdGlmeShcIkRldGFpbHMgb2YgXFxcIlwiICsgdGhpcy5zY2VuZURhdGEubXlzdGVyaWVzW3RhcmdldC5pbmRleF0ubmFtZSArIFwiXFxcIiBoYXZlIGJlZW4gdXBkYXRlZC5cIik7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9jaGVjayB0aGUgdGFyZ2V0IG9iamVjdCBmb3IgY2hhbmdlZCBwYXJhbWV0ZXJzIGFuZCBjaGFuZ2UgaWYgcHJlc2VudFxyXG4gICAgICAgIGlmKHRhcmdldC5uYW1lICE9PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICB0aGlzLnNjZW5lRGF0YS5teXN0ZXJpZXNbdGFyZ2V0LmluZGV4XS5uYW1lID0gdGFyZ2V0Lm5hbWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHRhcmdldC5kZXNjcmlwdGlvbiAhPT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgdGhpcy5zY2VuZURhdGEubXlzdGVyaWVzW3RhcmdldC5pbmRleF0uZGVzY3JpcHRpb24gPSB0YXJnZXQuZGVzY3JpcHRpb247XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHRhcmdldC5pbWFnZSAhPT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgdGhpcy5zY2VuZURhdGEubXlzdGVyaWVzW3RhcmdldC5pbmRleF0uaW1hZ2UgPSB0YXJnZXQuaW1hZ2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHRhcmdldC5zdGF0ZW1lbnQxICE9PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICB0aGlzLnNjZW5lRGF0YS5teXN0ZXJpZXNbdGFyZ2V0LmluZGV4XS5zdGF0ZW1lbnQxID0gdGFyZ2V0LnN0YWVtZW50MTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodGFyZ2V0LnN0YXRlbWVudDIgIT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICAgIHRoaXMuc2NlbmVEYXRhLm15c3Rlcmllc1t0YXJnZXQuaW5kZXhdLnN0YXRlbWVudDIgPSB0YXJnZXQuc3RhZW1lbnQyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0YXJnZXQuc3RhdGVtZW50MyAhPT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgdGhpcy5zY2VuZURhdGEubXlzdGVyaWVzW3RhcmdldC5pbmRleF0uc3RhdGVtZW50MyA9IHRhcmdldC5zdGFlbWVudDM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSBpZih0eXBlID09PSBcImFkZFRpbWVcIil7XHJcbiAgICAgICAgLy9hZGQgdG8gdGhlIGNhc2VUaW1lIGJ5IHRoZSB0YXJnZXQgYW1vdW50XHJcbiAgICAgICAgdmFyIHJlc3VsdGluZ1RpbWUgPSBwYXJzZUludCh0aGlzLmdhbWVEYXRhUmVmZXJlbmNlLmdldEF0dHJpYnV0ZShcImRhdGEtY2FzZVRpbWVcIikpICsgdGFyZ2V0O1xyXG4gICAgICAgIHRoaXMuZ2FtZURhdGFSZWZlcmVuY2Uuc2V0QXR0cmlidXRlKFwiZGF0YS1jYXNlVGltZVwiLCByZXN1bHRpbmdUaW1lKTtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRpbWVSZW1haW5pbmdUZXh0XCIpLmlubmVySFRNTCA9IHRoaXMuZ2FtZURhdGFSZWZlcmVuY2UuZ2V0QXR0cmlidXRlKFwiZGF0YS1jYXNlVGltZVwiKTtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNlbGVjdFRpbWVSZW1haW5pbmdUZXh0XCIpLmlubmVySFRNTCA9IHRoaXMuZ2FtZURhdGFSZWZlcmVuY2UuZ2V0QXR0cmlidXRlKFwiZGF0YS1jYXNlVGltZVwiKTtcclxuICAgICAgICBcclxuICAgICAgICBpZih0YXJnZXQgPT09IDEpe1xyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUJvYXJkLl9ub3RpZnkoXCJBbiBob3VyIG9mIGFkZGl0aW9uYWwgdGltZSBoYXMgYmVlbiBhZGRlZCB0byB0aGUgaW52ZXN0aWdhdGlvbi5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlQm9hcmQuX25vdGlmeSh0YXJnZXQgKyBcIiBob3VycyBvZiBhZGRpdGlvbmFsIHRpbWUgaGF2ZSBiZWVuIGFkZGVkIHRvIHRoZSBpbnZlc3RpZ2F0aW9uLlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICB9XHJcbiAgICBlbHNlIGlmKHR5cGUgPT09IFwic3BlbmRUaW1lXCIpe1xyXG4gICAgICAgIC8vcmVkdWNlIHRoZSBjYXNlVGltZSBieSB0aGUgdGFyZ2V0IGFtb3VudFxyXG4gICAgICAgIHZhciByZXN1bHRpbmdUaW1lID0gcGFyc2VJbnQodGhpcy5nYW1lRGF0YVJlZmVyZW5jZS5nZXRBdHRyaWJ1dGUoXCJkYXRhLWNhc2VUaW1lXCIpKSAtIHRhcmdldC5jb3N0O1xyXG4gICAgICAgIC8vcHJldmVudCBpdCBmcm9tIGZhbGxpbmcgYmVsb3cgMFxyXG4gICAgICAgIGlmKHJlc3VsdGluZ1RpbWUgPCAwKXtcclxuICAgICAgICAgICAgcmVzdWx0aW5nVGltZSA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZ2FtZURhdGFSZWZlcmVuY2Uuc2V0QXR0cmlidXRlKFwiZGF0YS1jYXNlVGltZVwiLCByZXN1bHRpbmdUaW1lKTtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRpbWVSZW1haW5pbmdUZXh0XCIpLmlubmVySFRNTCA9IHRoaXMuZ2FtZURhdGFSZWZlcmVuY2UuZ2V0QXR0cmlidXRlKFwiZGF0YS1jYXNlVGltZVwiKTtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNlbGVjdFRpbWVSZW1haW5pbmdUZXh0XCIpLmlubmVySFRNTCA9IHRoaXMuZ2FtZURhdGFSZWZlcmVuY2UuZ2V0QXR0cmlidXRlKFwiZGF0YS1jYXNlVGltZVwiKTtcclxuICAgICAgICBcclxuICAgICAgICAvL2NoZWNrIGZvciBhbiBhY2NvbXBhbnlpbmcgZGVzY3JpcHRpb24gaWYgdGhlcmUgaXMgb25lXHJcbiAgICAgICAgaWYodGFyZ2V0Lm5vdGlmaWNhdGlvbiAhPT0gXCJcIil7XHJcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlQm9hcmQuX25vdGlmeSh0YXJnZXQubm90aWZpY2F0aW9uKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9pZiBubyB0aW1lIGlzIGxlZnQsIGFkZCB0aGUgYW4gZW5kR2FtZSBldmVudCB0byB0aGUgZW5kIG9mIHRoZSBldmVudCBwaXBlbGluZVxyXG4gICAgICAgIGlmKHJlc3VsdGluZ1RpbWUgPT09IDApe1xyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUJvYXJkLl9hZGRBY3Rpb24oeyBcInR5cGVcIjogXCJlbmRHYW1lXCIsIFwidGFyZ2V0XCI6IFwidGltZW91dFwiIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2UgaWYodHlwZSA9PT0gXCJlbmRHYW1lXCIpe1xyXG4gICAgICAgIHZhciBmbGFnID0gdHJ1ZTtcclxuICAgICAgICAvL2lmIGNhdXNlZCBieSB0aW1lb3V0LCBjaGVjayBhbmQgc2VlIHdoZXRoZXIgYW55IGFkZGl0aW9uYWwgdGltZSB3YXMgYWRkZWQgc2luY2UgaXQgd2FzIGFzc2lnbmVkXHJcbiAgICAgICAgaWYodGFyZ2V0ID09PSBcInRpbWVvdXRcIil7XHJcbiAgICAgICAgICAgIGlmKHBhcnNlSW50KHRoaXMuZ2FtZURhdGFSZWZlcmVuY2UuZ2V0QXR0cmlidXRlKFwiZGF0YS1jYXNlVGltZVwiKSkgPiAwKXtcclxuICAgICAgICAgICAgICAgIC8vZW5kIHRoZSBnYW1lIHZpYSB0aW1lb3V0XHJcbiAgICAgICAgICAgICAgICBmbGFnID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9jb250aW51ZSB3aXRoIGVuZGluZyB0aGUgZ2FtZVxyXG4gICAgICAgIGlmKGZsYWcpe1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy9kZXRlcm1pbmUgdHlwZSBvZiBvdXRjb21lIGJhc2VkIG9uIHRhcmdldCBhbmQgc2V0IGltYWdlXHJcbiAgICAgICAgICAgIHZhciByZXN1bHRpbmdTdGF0ZW1lbnQ7XHJcbiAgICAgICAgICAgIGlmKHRhcmdldCA9PT0gXCJ0aW1lb3V0XCIpe1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0aW5nU3RhdGVtZW50ID0gXCJUSU1FIEVYUElSRURcIjtcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmVzdWx0QmFja2dyb3VuZFwiKS5zcmMgPSB0aGlzLnNjZW5lRGF0YS5mYWlsSW1hZ2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICAgIHJlc3VsdGluZ1N0YXRlbWVudCA9IFwiQ0FTRSBDTE9TRURcIjtcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmVzdWx0QmFja2dyb3VuZFwiKS5zcmMgPSB0YXJnZXQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy9zZXQgdmFsdWVzIG9mIHRpdGxlIHN1YnRpdGxlXHJcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmVzdWx0VGl0bGVcIikuaW5uZXJIVE1MID0gdGhpcy5zY2VuZURhdGEuY2FzZU5hbWU7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmVzdWx0U3VidGl0bGVcIikuaW5uZXJIVE1MID0gcmVzdWx0aW5nU3RhdGVtZW50O1xyXG4gICAgICAgICAgICAvL3BvcHVsYXRlIHRoZSBzY3JvbGxlclxyXG4gICAgICAgICAgICB2YXIgaTtcclxuICAgICAgICAgICAgdmFyIGFycmF5TGVuZ3RoID0gdGhpcy5zY2VuZURhdGEubXlzdGVyaWVzLmxlbmd0aDtcclxuICAgICAgICAgICAgdmFyIGNvbXBvdW5kSFRNTCA9IFwiXCI7XHJcbiAgICAgICAgICAgIHZhciBteXN0ZXJ5TmFtZTtcclxuICAgICAgICAgICAgdmFyIG15c3RlcnlJbWFnZTtcclxuICAgICAgICAgICAgdmFyIG15c3RlcnlTdGF0dXM7XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXRNeXN0ZXJ5O1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy9pdGVyYXRlIHRocm91Z2ggbXlzdGVyaWVzIGFuZCBwb3B1bGF0ZSB0aGUgc2Nyb2xsZXJcclxuICAgICAgICAgICAgZm9yKGkgPSAwOyBpIDwgYXJyYXlMZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgICAgICAgICB0YXJnZXRNeXN0ZXJ5ID0gdGhpcy5zY2VuZURhdGEubXlzdGVyaWVzW2ldO1xyXG4gICAgICAgICAgICAgICAgLy9kZXRlcm1pbmUgbGVmdCBzaWRlXHJcbiAgICAgICAgICAgICAgICBpZih0YXJnZXRNeXN0ZXJ5LnNvbHZlZCA9PT0gdHJ1ZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgbXlzdGVyeU5hbWUgPSB0YXJnZXRNeXN0ZXJ5Lm5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgbXlzdGVyeUltYWdlID0gdGFyZ2V0TXlzdGVyeS5pbWFnZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYodGFyZ2V0TXlzdGVyeS52aXNpYmxlID09PSBmYWxzZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgbXlzdGVyeU5hbWUgPSBcIj8/Pz9cIjtcclxuICAgICAgICAgICAgICAgICAgICBteXN0ZXJ5SW1hZ2UgPSBcImNvbnRlbnQvdWkvaGlkZGVuLnBuZ1wiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICBteXN0ZXJ5TmFtZSA9IHRhcmdldE15c3RlcnkubmFtZTtcclxuICAgICAgICAgICAgICAgICAgICBteXN0ZXJ5SW1hZ2UgPSB0YXJnZXRNeXN0ZXJ5LmltYWdlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYodGFyZ2V0TXlzdGVyeS5zb2x2ZWQpe1xyXG4gICAgICAgICAgICAgICAgICAgIG15c3RlcnlTdGF0dXMgPSBcIlNvbHZlZFwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICBteXN0ZXJ5U3RhdHVzID0gXCJVbnNvbHZlZFwiXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvL2NvbXBvdW5kIGRhdGFcclxuICAgICAgICAgICAgICAgIGNvbXBvdW5kSFRNTCArPSBcIjxkaXYgY2xhc3M9J3Jlc3VsdFNjcm9sbGVyRGl2aWRlcic+PGRpdiBjbGFzcz0ncmVzdWx0U2Nyb2xsZXJQcm9maWxlQ29udGFpbmVyJz48ZGl2IGNsYXNzPSdyZXN1bHRTY3JvbGxlclByb2ZpbGUnPjxpbWcgc3JjPSdcIiArIG15c3RlcnlJbWFnZSArIFwiJz48cD5cIiArIG15c3RlcnlOYW1lICsgXCI8L3A+PC9kaXY+PHAgY2xhc3M9J3Jlc3VsdFNjcm9sbGVyU3RhdHVzJz5cIiArIG15c3RlcnlTdGF0dXMgKyBcIjwvcD48L2Rpdj48L2Rpdj5cIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInJlc3VsdFNjcm9sbGVyXCIpLmlubmVySFRNTCA9IGNvbXBvdW5kSFRNTDtcclxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyZXN1bHRMYXllclwiKS5jbGFzc05hbWUgPSBcIlwiO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyZXN1bHRDb250ZW50XCIpLmNsYXNzTmFtZSA9IFwiXCI7XHJcbiAgICAgICAgICAgIH0sIDIwMDApO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbkdhbWUucHJvdG90eXBlLmRyYXdTZWxlY3QgPSBmdW5jdGlvbihjYW52YXNTdGF0ZSl7XHJcbiAgICBcclxufVxyXG5cclxuR2FtZS5wcm90b3R5cGUuZHJhd1RpdGxlID0gZnVuY3Rpb24oY2FudmFzU3RhdGUpe1xyXG4gICAgXHJcbn1cclxuXHJcbkdhbWUucHJvdG90eXBlLmRyYXdMb2FkaW5nID0gZnVuY3Rpb24oY2FudmFzU3RhdGUpe1xyXG4gICAgY2FudmFzU3RhdGUuY3R4LnNhdmUoKTtcclxuICAgIC8vd2lwZSB0aGUgY2FudmFzIHRvIHN0YXJ0IGEgbmV3IGZyYW1lXHJcbiAgICBwYWludGVyLmNsZWFyKGNhbnZhc1N0YXRlLmN0eCwgMCwgMCwgY2FudmFzU3RhdGUud2lkdGgsIGNhbnZhc1N0YXRlLmhlaWdodCk7XHJcbiAgICBjYW52YXNTdGF0ZS5jdHgucmVjdCgwLDAsY2FudmFzU3RhdGUud2lkdGgsY2FudmFzU3RhdGUuaGVpZ2h0KTtcclxuICAgIGNhbnZhc1N0YXRlLmN0eC5maWxsU3R5bGUgPSBcImJsYWNrXCI7XHJcbiAgICBjYW52YXNTdGF0ZS5jdHguZmlsbCgpO1xyXG4gICAgXHJcbiAgICAvL3RleHRcclxuICAgIGNhbnZhc1N0YXRlLmN0eC5mb250ID0gKGNhbnZhc1N0YXRlLmhlaWdodC8xMCkgKyBcInB4IEFyaWFsXCI7XHJcbiAgICBjYW52YXNTdGF0ZS5jdHgudGV4dEJhc2VsaW5lID0gXCJtaWRkbGVcIjtcclxuICAgIGNhbnZhc1N0YXRlLmN0eC50ZXh0QWxpZ24gPSBcImNlbnRlclwiO1xyXG4gICAgY2FudmFzU3RhdGUuY3R4LmZpbGxTdHlsZSA9IFwid2hpdGVcIjtcclxuICAgIGNhbnZhc1N0YXRlLmN0eC5maWxsVGV4dChcIkxvYWRpbmcuLi5cIiwgY2FudmFzU3RhdGUuY2VudGVyLngsIGNhbnZhc1N0YXRlLmNlbnRlci55KTtcclxuICAgIFxyXG4gICAgY2FudmFzU3RhdGUuY3R4LnJlc3RvcmUoKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBHYW1lOyIsIlwidXNlIHN0cmljdFwiO1xyXG5mdW5jdGlvbiBQb2ludChwWCwgcFkpe1xyXG4gICAgdGhpcy54ID0gcFg7XHJcbiAgICB0aGlzLnkgPSBwWTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQb2ludDsiLCIvL0NvbnRhaW5zIGNhbnZhcyByZWxhdGVkIHZhcmlhYmxlcyBpbiBhIHNpbmdsZSBlYXN5LXRvLXBhc3Mgb2JqZWN0XHJcblwidXNlIHN0cmljdFwiO1xyXG4vL2ltcG9ydCBwb2ludFxyXG52YXIgUG9pbnQgPSByZXF1aXJlKCcuLi9jb21tb24vUG9pbnQuanMnKTtcclxuXHJcbmZ1bmN0aW9uIENhbnZhc1N0YXRlKGN0eCwgY2VudGVyLCB3aWR0aCwgaGVpZ2h0KXtcclxuICAgIHRoaXMuY3R4ID0gY3R4O1xyXG4gICAgdGhpcy5jZW50ZXIgPSBjZW50ZXI7XHJcbiAgICB0aGlzLnJlbGF0aXZlQ2VudGVyID0gbmV3IFBvaW50KHdpZHRoIC0gKCh3aWR0aCAqIC44KSAvIDIpLCBoZWlnaHQgLyAyKTtcclxuICAgIHRoaXMucmVsYXRpdmVXaWR0aCA9IHdpZHRoICogLjg7XHJcbiAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuICAgIFxyXG4gICAgaWYodGhpcy53aWR0aCA+IHRoaXMuaGVpZ2h0KXtcclxuICAgICAgICB0aGlzLmV2aWRlbmNlRnJhbWVTaXplID0gdGhpcy5oZWlnaHQgLyA4O1xyXG4gICAgfSBlbHNle1xyXG4gICAgICAgIHRoaXMuZXZpZGVuY2VGcmFtZVNpemUgPSB0aGlzLndpZHRoIC8gODtcclxuICAgIH1cclxufVxyXG5cclxuQ2FudmFzU3RhdGUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKGN0eCwgY2VudGVyLCB3aWR0aCwgaGVpZ2h0KXtcclxuICAgIHRoaXMuY3R4ID0gY3R4O1xyXG4gICAgdGhpcy5jZW50ZXIgPSBjZW50ZXI7XHJcbiAgICB0aGlzLnJlbGF0aXZlQ2VudGVyID0gbmV3IFBvaW50KHdpZHRoIC0gKCh3aWR0aCAqIC44KSAvIDIpLCBoZWlnaHQgLyAyKTtcclxuICAgIHRoaXMucmVsYXRpdmVXaWR0aCA9IHdpZHRoICogLjg7XHJcbiAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuICAgIFxyXG4gICAgaWYodGhpcy53aWR0aCA+IHRoaXMuaGVpZ2h0KXtcclxuICAgICAgICB0aGlzLmV2aWRlbmNlRnJhbWVTaXplID0gdGhpcy5oZWlnaHQgLyA4O1xyXG4gICAgfSBlbHNle1xyXG4gICAgICAgIHRoaXMuZXZpZGVuY2VGcmFtZVNpemUgPSB0aGlzLndpZHRoIC8gODtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDYW52YXNTdGF0ZTsiLCIvL2NvbnRhaW5zIHZhcmVpYWJsZXMgcmVsYXRpbmcgdG8gc3RhdGUgYW5kIHNhdmUgaW5mb3JtYXRpb25cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcbi8vc2NlbmUgaXMgd2hlcmUgeW91IGFyZSBsb2NhdGVkIGluIHRoZSBpbnZlc3RpZ2F0aW9uXHJcbi8vc2NlbmUgZXZpZGVuY2UgaXMgZXNzZW50aWFsbHkgeW91ciBwcm9ncmVzcyBpbiB0aGUgY3VycmVudCBzY2VuZVxyXG4vL2tleSBldmlkZW5jZSBpcyB5b3VyIHByb2dyZXNzIG92ZXJhbGxcclxuZnVuY3Rpb24gR2FtZVN0YXRlKHNjZW5lLCBzY2VuZUV2aWRlbmNlLCBrZXlFdmlkZW5jZSl7XHJcbiAgICAvL3RoZSBsb2NhdGlvbiB3aGVyZSB5b3VyIGNoYXJhY3RlcnMgYXJlIGxvY2F0ZWRcclxuICAgIHRoaXMuc2NlbmUgPSBzY2VuZTtcclxuICAgIFxyXG4gICAgLy9rZXkgZXZpZGVuY2UgYXJyYXksIHRoZSBldmlkZW5jZSBhbmQgcmV2ZWxhdGlvbnMgdGhhdCBjYXJyeSBiZXR3ZWVuIHNjZW5lc1xyXG4gICAgdGhpcy5rZXlFdmlkZW5jZSA9IGtleUV2aWRlbmNlO1xyXG4gICAgXHJcbiAgICAvL3NjZW5lIGV2aWRlbmNlIGFycmF5IG9mIGFycmF5cywgdGhlIGV2aWRlbmNlIHRoYXQgaXMgc3BlY2lmaWMgdG8gcGFydGljdWxhciBzY2VuZXNcclxuICAgIHRoaXMuc2NlbmVFdmlkZW5jZSA9IHNjZW5lRXZpZGVuY2U7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gR2FtZVN0YXRlOyIsIi8va2VlcHMgdHJhY2sgb2YgbW91c2UgcmVsYXRlZCB2YXJpYWJsZXMuXHJcbi8vY2FsY3VsYXRlZCBpbiBtYWluIGFuZCBwYXNzZWQgdG8gZ2FtZVxyXG4vL2NvbnRhaW5zIHVwIHN0YXRlXHJcbi8vcG9zaXRpb25cclxuLy9yZWxhdGl2ZSBwb3NpdGlvblxyXG4vL29uIGNhbnZhc1xyXG5cInVzZSBzdHJpY3RcIjtcclxuZnVuY3Rpb24gTW91c2VTdGF0ZShwUG9zaXRpb24sIHBSZWxhdGl2ZVBvc2l0aW9uLCBwTW91c2VEb3duLCBwTW91c2VJbiwgcFdoZWVsRGVsdGEpe1xyXG4gICAgdGhpcy5wb3NpdGlvbiA9IHBQb3NpdGlvbjtcclxuICAgIHRoaXMucmVsYXRpdmVQb3NpdGlvbiA9IHBSZWxhdGl2ZVBvc2l0aW9uO1xyXG4gICAgdGhpcy5tb3VzZURvd24gPSBwTW91c2VEb3duO1xyXG4gICAgdGhpcy5tb3VzZUluID0gcE1vdXNlSW47XHJcbiAgICB0aGlzLndoZWVsRGVsdGEgPSBwV2hlZWxEZWx0YTtcclxuICAgIFxyXG4gICAgLy90cmFja2luZyBwcmV2aW91cyBtb3VzZSBzdGF0ZXNcclxuICAgIHRoaXMubGFzdFBvc2l0aW9uID0gcFBvc2l0aW9uO1xyXG4gICAgdGhpcy5sYXN0UmVsYXRpdmVQb3NpdGlvbiA9IHBSZWxhdGl2ZVBvc2l0aW9uO1xyXG4gICAgdGhpcy5sYXN0TW91c2VEb3duID0gcE1vdXNlRG93bjtcclxuICAgIHRoaXMubGFzdE1vdXNlSW4gPSBwTW91c2VJbjtcclxuICAgIHRoaXMubGFzdFdoZWVsRGVsdGEgPSBwV2hlZWxEZWx0YVxyXG59XHJcblxyXG5Nb3VzZVN0YXRlLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbihwUG9zaXRpb24sIHBSZWxhdGl2ZVBvc2l0aW9uLCBwTW91c2VEb3duLCBwTW91c2VJbiwgcFdoZWVsRGVsdGEpe1xyXG4gICAgdGhpcy5sYXN0UG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uO1xyXG4gICAgdGhpcy5sYXN0UmVsYXRpdmVQb3NpdGlvbiA9IHRoaXMucmVsYXRpdmVQb3NpdGlvbjtcclxuICAgIHRoaXMubGFzdE1vdXNlRG93biA9IHRoaXMubW91c2VEb3duO1xyXG4gICAgdGhpcy5sYXN0TW91c2VJbiA9IHRoaXMubW91c2VJbjtcclxuICAgIHRoaXMubGFzdFdoZWVsRGVsdGEgPSB0aGlzLndoZWVsRGVsdGE7XHJcbiAgICBcclxuICAgIFxyXG4gICAgdGhpcy5wb3NpdGlvbiA9IHBQb3NpdGlvbjtcclxuICAgIHRoaXMucmVsYXRpdmVQb3NpdGlvbiA9IHBSZWxhdGl2ZVBvc2l0aW9uO1xyXG4gICAgdGhpcy5tb3VzZURvd24gPSBwTW91c2VEb3duO1xyXG4gICAgdGhpcy5tb3VzZUluID0gcE1vdXNlSW47XHJcbiAgICB0aGlzLndoZWVsRGVsdGEgPSBwV2hlZWxEZWx0YTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNb3VzZVN0YXRlOyIsIlwidXNlIHN0cmljdFwiO1xyXG5mdW5jdGlvbiBEcmF3bGliKCl7XHJcbn1cclxuXHJcbkRyYXdsaWIucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oY3R4LCB4LCB5LCB3LCBoKSB7XHJcbiAgICBjdHguY2xlYXJSZWN0KHgsIHksIHcsIGgpO1xyXG59XHJcblxyXG5EcmF3bGliLnByb3RvdHlwZS5yZWN0ID0gZnVuY3Rpb24oY3R4LCB4LCB5LCB3LCBoLCBmaWxsQ29sb3IsIHN0cm9rZUNvbG9yLCBzdHJva2VXaWR0aCkge1xyXG4gICAgY3R4LnNhdmUoKTtcclxuICAgIGN0eC5maWxsU3R5bGUgPSBmaWxsQ29sb3I7XHJcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSBzdHJva2VDb2xvcjtcclxuICAgIGN0eC5saW5lV2lkdGggPSBzdHJva2VXaWR0aDtcclxuICAgIGN0eC5maWxsUmVjdCh4LCB5LCB3LCBoKTtcclxuICAgIGN0eC5zdHJva2VSZWN0KHgsIHksIHcsIGgpO1xyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxufVxyXG5cclxuRHJhd2xpYi5wcm90b3R5cGUubGluZSA9IGZ1bmN0aW9uKGN0eCwgeDEsIHkxLCB4MiwgeTIsIHRoaWNrbmVzcywgY29sb3IpIHtcclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICBjdHgubW92ZVRvKHgxLCB5MSk7XHJcbiAgICBjdHgubGluZVRvKHgyLCB5Mik7XHJcbiAgICBjdHgubGluZVdpZHRoID0gdGhpY2tuZXNzO1xyXG4gICAgY3R4LnN0cm9rZVN0eWxlID0gY29sb3I7XHJcbiAgICBjdHguc3Ryb2tlKCk7XHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG59XHJcblxyXG5EcmF3bGliLnByb3RvdHlwZS5jaXJjbGUgPSBmdW5jdGlvbihjdHgsIHgsIHksIHJhZGl1cywgY29sb3IsIGZpbGxlZCwgbGluZVdpZHRoKXtcclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICBjdHguYXJjKHgseSwgcmFkaXVzLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xyXG4gICAgaWYoZmlsbGVkKXtcclxuICAgICAgICBjdHguZmlsbFN0eWxlID0gY29sb3I7XHJcbiAgICAgICAgY3R4LmZpbGwoKTsgXHJcbiAgICB9XHJcbiAgICBlbHNle1xyXG4gICAgICAgIGN0eC5saW5lV2lkdGggPSBsaW5lV2lkdGg7XHJcbiAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gY29sb3I7XHJcbiAgICAgICAgY3R4LnN0cm9rZSgpO1xyXG4gICAgfVxyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxufVxyXG5cclxuLy9zb2x1dGlvbiBiYXNlZCBvbiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMjU1NTEyL2hvdy10by1kcmF3LWEtcm91bmRlZC1yZWN0YW5nbGUtb24taHRtbC1jYW52YXNcclxuRHJhd2xpYi5wcm90b3R5cGUucm91bmRlZFJlY3RhbmdsZSA9IGZ1bmN0aW9uKGN0eCwgeCwgeSwgdywgaCwgciwgZmlsbENvbG9yLCBzdHJva2VDb2xvciwgbGluZVdpZHRoKXtcclxuICAgIGN0eC5zYXZlKCk7XHJcbiAgICAvL3NldCBjb2xvcnNcclxuICAgIGN0eC5zdHJva2VTdHlsZSA9IHN0cm9rZUNvbG9yO1xyXG4gICAgY3R4LmZpbGxTdHlsZSA9IGZpbGxDb2xvcjtcclxuICAgIGN0eC5saW5lV2lkdGggPSBsaW5lV2lkdGg7XHJcbiAgICBcclxuICAgIC8vaWYgb25seSBhIHNpbmdsZSBudW1iZXIgaXMgZ2l2ZW4gYXMgYSBwYXJhbWV0ZXIgZm9yIHJhZGl1cywgZ2VuZXJhdGVzIG9iamVjdCB3aXRoIGZ1bGwgcGFyYW1ldGVyIHNldFxyXG4gICAgaWYgKHR5cGVvZiByID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgIHIgPSB7dGw6IHIsIHRyOiByLCBicjogciwgYmw6IHJ9O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB2YXIgZGVmYXVsdFJhZGl1cyA9IHt0bDogMCwgdHI6IDAsIGJyOiAwLCBibDogMH07XHJcbiAgICAgICAgZm9yICh2YXIgc2lkZSBpbiBkZWZhdWx0UmFkaXVzKSB7XHJcbiAgICAgICAgICAgIHJbc2lkZV0gPSByW3NpZGVdIHx8IGRlZmF1bHRSYWRpdXNbc2lkZV07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgY3R4Lm1vdmVUbyh4ICsgci50bCwgeSk7XHJcbiAgICBjdHgubGluZVRvKHggKyB3IC0gci50ciwgeSk7XHJcbiAgICBjdHgucXVhZHJhdGljQ3VydmVUbyh4ICsgdywgeSwgeCArIHcsIHkgKyByLnRyKTtcclxuICAgIGN0eC5saW5lVG8oeCArIHcsIHkgKyBoIC0gci5icik7XHJcbiAgICBjdHgucXVhZHJhdGljQ3VydmVUbyh4ICsgdywgeSArIGgsIHggKyB3IC0gci5iciwgeSArIGgpO1xyXG4gICAgY3R4LmxpbmVUbyh4ICsgci5ibCwgeSArIGgpO1xyXG4gICAgY3R4LnF1YWRyYXRpY0N1cnZlVG8oeCwgeSArIGgsIHgsIHkgKyBoIC0gci5ibCk7XHJcbiAgICBjdHgubGluZVRvKHgsIHkgKyByLnRsKTtcclxuICAgIGN0eC5xdWFkcmF0aWNDdXJ2ZVRvKHgsIHksIHggKyByLnRsLCB5KTtcclxuICAgIGN0eC5jbG9zZVBhdGgoKTtcclxuICAgIFxyXG4gICAgY3R4LmZpbGwoKTtcclxuICAgIGN0eC5zdHJva2UoKTtcclxuICAgIGN0eC5yZXN0b3JlKCk7XHJcbn1cclxuXHJcbkRyYXdsaWIucHJvdG90eXBlLmVsbGlwc2UgPSBmdW5jdGlvbihjdHgsIHgsIHksIHcsIGgsIGZpbGxDb2xvciwgc3Ryb2tlQ29sb3IsIGxpbmVXaWR0aCl7XHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgY3R4LnN0cm9rZVN0eWxlID0gc3Ryb2tlQ29sb3I7XHJcbiAgICBjdHguZmlsbFN0eWxlID0gZmlsbENvbG9yO1xyXG4gICAgY3R4LmxpbmVXaWR0aCA9IGxpbmVXaWR0aDtcclxuICAgIFxyXG4gICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgY3R4LmVsbGlwc2UoeCwgeSwgdy8yLCBoLzIsIDAsIDAsIDIgKiBNYXRoLlBJKTtcclxuICAgIGN0eC5maWxsKCk7XHJcbiAgICBjdHguc3Ryb2tlKCk7XHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG59XHJcblxyXG5EcmF3bGliLnByb3RvdHlwZS5wdXNocGluID0gZnVuY3Rpb24oY3R4LCB4LCB5LCBmcmFtZVNpemUsIHR5cGUpe1xyXG4gICAgY3R4LnNhdmUoKTtcclxuICAgIGN0eC50cmFuc2xhdGUoeCwgeSk7XHJcbiAgICBjdHgucm90YXRlKDIwKk1hdGguUEkgLyAxODApO1xyXG4gICAgLy9ub3JtYWwgdHlwZVxyXG4gICAgaWYodHlwZSA9PT0gMCl7XHJcbiAgICAgICAgdGhpcy5yZWN0KGN0eCwgLWZyYW1lU2l6ZS80MCwgLWZyYW1lU2l6ZS8yMCwgZnJhbWVTaXplLzI1LCBmcmFtZVNpemUvMTAsIFwiZGFya2dyYXlcIiwgXCJibGFja1wiLCAwKTtcclxuICAgICAgICB0aGlzLmVsbGlwc2UoY3R4LCAwLCAtZnJhbWVTaXplLzEzLCBmcmFtZVNpemUvNCwgZnJhbWVTaXplLzYsIFwiIzAwMDBmZlwiLCBcIiM5OTk5ZmZcIiwgZnJhbWVTaXplLzgwKTtcclxuICAgICAgICB0aGlzLmVsbGlwc2UoY3R4LCAwLCAtZnJhbWVTaXplLzEyLCBmcmFtZVNpemUvOCwgZnJhbWVTaXplLzEyLCBcIiMwMDAwOTBcIiwgXCJ0cmFuc3BhcmVudFwiLCAwKTtcclxuICAgICAgICB0aGlzLnJlY3QoY3R4LCAtZnJhbWVTaXplLzE2LCAtNSpmcmFtZVNpemUvMjQsIGZyYW1lU2l6ZS84LCBmcmFtZVNpemUvOCwgXCIjMDAwMDkwXCIsIFwidHJhbnNwYXJlbnRcIiwgMCk7XHJcbiAgICAgICAgdGhpcy5lbGxpcHNlKGN0eCwgMCwgLTUqZnJhbWVTaXplLzI0LCAzKmZyYW1lU2l6ZS8xNiwgMypmcmFtZVNpemUvMjQsIFwiIzAwMDBmZlwiLCBcIiM5OTk5ZmZcIiwgZnJhbWVTaXplLzgwKTtcclxuICAgIH1cclxuICAgIC8vcmV2ZWxhdGlvbiB0eXBlXHJcbiAgICBlbHNlIGlmKHR5cGUgPT09IDEpe1xyXG4gICAgICAgIHRoaXMucmVjdChjdHgsIC1mcmFtZVNpemUvNDAsIC1mcmFtZVNpemUvMjAsIGZyYW1lU2l6ZS8yNSwgZnJhbWVTaXplLzEwLCBcImRhcmtncmF5XCIsIFwiYmxhY2tcIiwgMCk7XHJcbiAgICAgICAgdGhpcy5lbGxpcHNlKGN0eCwgMCwgLWZyYW1lU2l6ZS8xMywgZnJhbWVTaXplLzQsIGZyYW1lU2l6ZS82LCBcIiNlZDAyMDJcIiwgXCIjZmY5OTk5XCIsIGZyYW1lU2l6ZS84MCk7XHJcbiAgICAgICAgdGhpcy5lbGxpcHNlKGN0eCwgMCwgLWZyYW1lU2l6ZS8xMiwgZnJhbWVTaXplLzgsIGZyYW1lU2l6ZS8xMiwgXCIjOTAwMDAwXCIsIFwidHJhbnNwYXJlbnRcIiwgMCk7XHJcbiAgICAgICAgdGhpcy5yZWN0KGN0eCwgLWZyYW1lU2l6ZS8xNiwgLTUqZnJhbWVTaXplLzI0LCBmcmFtZVNpemUvOCwgZnJhbWVTaXplLzgsIFwiIzkwMDAwMFwiLCBcInRyYW5zcGFyZW50XCIsIDApO1xyXG4gICAgICAgIHRoaXMuZWxsaXBzZShjdHgsIDAsIC01KmZyYW1lU2l6ZS8yNCwgMypmcmFtZVNpemUvMTYsIDMqZnJhbWVTaXplLzI0LCBcIiNlZDAyMDJcIiwgXCIjZmY5OTk5XCIsIGZyYW1lU2l6ZS84MCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIFxyXG4gICAgY3R4LnJlc3RvcmUoKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBEcmF3bGliOyIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgUG9pbnQgPSByZXF1aXJlKCcuLi9jb21tb24vUG9pbnQuanMnKTtcclxuXHJcbmZ1bmN0aW9uIFV0aWxpdGllcygpe1xyXG59XHJcblxyXG4vL0JPQVJEUEhBU0UgLSBzZXQgYSBzdGF0dXMgdmFsdWUgb2YgYSBub2RlIGluIGxvY2FsU3RvcmFnZSBiYXNlZCBvbiBJRFxyXG5VdGlsaXRpZXMucHJvdG90eXBlLnNldFByb2dyZXNzID0gZnVuY3Rpb24ocE9iamVjdCl7XHJcbiAgICB2YXIgcHJvZ3Jlc3NTdHJpbmcgPSBsb2NhbFN0b3JhZ2UucHJvZ3Jlc3M7XHJcbiAgICBcclxuICAgIHZhciB0YXJnZXRPYmplY3QgPSBwT2JqZWN0O1xyXG4gICAgLy9tYWtlIGFjY29tb2RhdGlvbnMgaWYgdGhpcyBpcyBhbiBleHRlbnNpb24gbm9kZVxyXG4gICAgdmFyIGV4dGVuc2lvbmZsYWcgPSB0cnVlO1xyXG4gICAgd2hpbGUoZXh0ZW5zaW9uZmxhZyl7XHJcbiAgICAgICAgaWYodGFyZ2V0T2JqZWN0LnR5cGUgPT09IFwiZXh0ZW5zaW9uXCIpe1xyXG4gICAgICAgICAgICB0YXJnZXRPYmplY3QgPSB0YXJnZXRPYmplY3QuY29ubmVjdGlvbkZvcndhcmRbMF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIGV4dGVuc2lvbmZsYWcgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHZhciBvYmplY3RJRCA9IHRhcmdldE9iamVjdC5kYXRhLl9pZDtcclxuICAgIHZhciBvYmplY3RTdGF0dXMgPSB0YXJnZXRPYmplY3Quc3RhdHVzO1xyXG4gICAgXHJcbiAgICAvL3NlYXJjaCB0aGUgcHJvZ3Jlc3NTdHJpbmcgZm9yIHRoZSBjdXJyZW50IElEXHJcbiAgICB2YXIgaWRJbmRleCA9IHByb2dyZXNzU3RyaW5nLmluZGV4T2Yob2JqZWN0SUQpO1xyXG4gICAgXHJcbiAgICAvL2lmIGl0J3Mgbm90IGFkZCBpdCB0byB0aGUgZW5kXHJcbiAgICBpZihpZEluZGV4ID09PSAtMSl7XHJcbiAgICAgICAgcHJvZ3Jlc3NTdHJpbmcgKz0gb2JqZWN0SUQgKyBcIlwiICsgb2JqZWN0U3RhdHVzICsgXCIsXCI7XHJcbiAgICB9XHJcbiAgICAvL290aGVyd2lzZSBtb2RpZnkgdGhlIHN0YXR1cyB2YWx1ZVxyXG4gICAgZWxzZXtcclxuICAgICAgICBwcm9ncmVzc1N0cmluZyA9IHByb2dyZXNzU3RyaW5nLnN1YnN0cigwLCBvYmplY3RJRC5sZW5ndGggKyBpZEluZGV4KSArIG9iamVjdFN0YXR1cyArIHByb2dyZXNzU3RyaW5nLnN1YnN0cihvYmplY3RJRC5sZW5ndGggKyAxICsgaWRJbmRleCwgcHJvZ3Jlc3NTdHJpbmcubGVuZ3RoKSArIFwiXCI7XHJcbiAgICB9XHJcbiAgICBsb2NhbFN0b3JhZ2UucHJvZ3Jlc3MgPSBwcm9ncmVzc1N0cmluZztcclxufVxyXG5cclxuLy9yZXR1cm5zIG1vdXNlIHBvc2l0aW9uIGluIGxvY2FsIGNvb3JkaW5hdGUgc3lzdGVtIG9mIGVsZW1lbnRcclxuVXRpbGl0aWVzLnByb3RvdHlwZS5nZXRNb3VzZSA9IGZ1bmN0aW9uKGUpe1xyXG4gICAgcmV0dXJuIG5ldyBQb2ludCgoZS5wYWdlWCAtIGUudGFyZ2V0Lm9mZnNldExlZnQpLCAoZS5wYWdlWSAtIGUudGFyZ2V0Lm9mZnNldFRvcCkpO1xyXG59XHJcblxyXG5VdGlsaXRpZXMucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uKHZhbHVlLCBtaW4xLCBtYXgxLCBtaW4yLCBtYXgyKXtcclxuICAgIHJldHVybiBtaW4yICsgKG1heDIgLSBtaW4yKSAqICgodmFsdWUgLSBtaW4xKSAvIChtYXgxIC0gbWluMSkpO1xyXG59XHJcblxyXG4vL2xpbWl0cyB0aGUgdXBwZXIgYW5kIGxvd2VyIGxpbWl0cyBvZiB0aGUgcGFyYW1ldGVyIHZhbHVlXHJcblV0aWxpdGllcy5wcm90b3R5cGUuY2xhbXAgPSBmdW5jdGlvbih2YWx1ZSwgbWluLCBtYXgpe1xyXG4gICAgcmV0dXJuIE1hdGgubWF4KG1pbiwgTWF0aC5taW4obWF4LCB2YWx1ZSkpO1xyXG59XHJcblxyXG4vL2NoZWNrcyBtb3VzZSBjb2xsaXNpb24gb24gY2FudmFzXHJcblV0aWxpdGllcy5wcm90b3R5cGUubW91c2VJbnRlcnNlY3QgPSBmdW5jdGlvbihwTW91c2VTdGF0ZSwgcEVsZW1lbnQsIHBGcmFtZVNpemUpe1xyXG4gICAgLy9jaGVjayB4IGNvbGxpc2lvblxyXG4gICAgaWYocE1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi54ID4gKHBFbGVtZW50LnBvc2l0aW9uLnggLSBwRnJhbWVTaXplLzIpICYmIHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueCA8IChwRWxlbWVudC5wb3NpdGlvbi54ICsgcEZyYW1lU2l6ZS8yKSl7XHJcbiAgICAgICAgLy9pZiB0aGUgeSBwb3NpdGlvbiBjb2xsaWRlc1xyXG4gICAgICAgIGlmKHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueSA+IChwRWxlbWVudC5wb3NpdGlvbi55IC0gKDYqcEZyYW1lU2l6ZSkvMTApICYmIHBNb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueSA8IChwRWxlbWVudC5wb3NpdGlvbi55ICsgKHBGcmFtZVNpemUpLzIpKXtcclxuICAgICAgICAgICAgcEVsZW1lbnQubW91c2VPdmVyID0gdHJ1ZTtcclxuICAgICAgICB9IGVsc2V7XHJcbiAgICAgICAgICAgIHBFbGVtZW50Lm1vdXNlT3ZlciA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZXtcclxuICAgICAgICBwRWxlbWVudC5tb3VzZU92ZXIgPSBmYWxzZTtcclxuICAgIH1cclxufVxyXG5cclxuLy9sb2FkcyBhbiBleHRlcm5hbCBmaWxlIGZyb20gSlNPTlxyXG5VdGlsaXRpZXMucHJvdG90eXBlLmxvYWRKU09OID0gZnVuY3Rpb24obG9jYXRpb24sIGNGdW5jdGlvbikgeyBcclxuICAgIGNvbnNvbGUubG9nKFwibG9hZGluZyBKU09OIGF0IFwiICsgbG9jYXRpb24pO1xyXG4gICAgXHJcbiAgICAvL2RlY2xhcmUgdGhlIHJlcXVlc3RcclxuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuICAgIFxyXG4gICAgLy9hc3NpZ24gdGhlIHVybCB0byBiZSBvcGVuZWRcclxuICAgIHhoci5vcGVuKFwiR0VUXCIsIGxvY2F0aW9uLCB0cnVlKTtcclxuICAgIFxyXG4gICAgLy90ZWxsIHRoZSByZXF1ZXN0IHdoYXQgaXQgbmVlZHMgdG8gZG8gd2hlbiB0aGUgc3RhdGUgY2hhbmdlcy5cclxuICAgIC8vZWFjaCBzdGVwIG9mIHRoZSByZXF1ZXN0IHdpbGwgZmlyZSB0aGlzLCBidXQgb25seSB3aGVuIGl0J3MgdG90YWxseSByZWFkeSB3aWxsIGl0IHNlbmRcclxuICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQgJiYgeGhyLnN0YXR1cyA9PT0gMjAwKSB7XHJcbiAgICAgICAgICAgIC8vZmVlZCB0aGUgZGF0YSBiYWNrIGludG8gdGhlIGNhbGxiYWNrXHJcbiAgICAgICAgICAgIGNGdW5jdGlvbih4aHIucmVzcG9uc2VUZXh0KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAvL3NldCBldmVyeXRoaW5nIGluIG1vdGlvbiwgaXQgd2lsbCB0YWtlIGEgc2hvcnQgcGVyaW9kIG9mIHRpbWUgdG8gbG9hZFxyXG4gICAgeGhyLnNlbmQoKTtcclxuIH1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVXRpbGl0aWVzOyIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgVXRpbGl0aWVzID0gcmVxdWlyZSgnLi4vbGlicmFyaWVzL1V0aWxpdGllcy5qcycpO1xyXG52YXIgU3ByaXRlID0gcmVxdWlyZSgnLi9TcHJpdGUuanMnKTtcclxuXHJcbnZhciBwYWludGVyO1xyXG52YXIgdXRpbGl0eTtcclxuXHJcbi8vcGFyYW1ldGVycyBmb3IgaW5pdGlhbCBzZXR0aW5nc1xyXG5mdW5jdGlvbiBBY3RvcihwTmFtZSl7XHJcbiAgICB1dGlsaXR5ID0gbmV3IFV0aWxpdGllcygpO1xyXG4gICAgXHJcbiAgICAvL2Jvb2w6IHdoZXRoZXIgYWxsIG9mIHRoZSBhc3NldHMgaGF2ZSBiZWVuIGxvYWRlZCBvciBub3RcclxuICAgIHRoaXMubG9hZGVkID0gZmFsc2U7XHJcbiAgICAvL3N0cmluZzogdGhlIG5hbWUgb2YgdGhlIGNoYXJhY3RlciB0aWVkIHRvIHRoaXMgYWN0b3Igb2JqZWN0XHJcbiAgICB0aGlzLm5hbWUgPSBwTmFtZTtcclxuICAgIC8vYXJyYXk8c3ByaXRlPjogY29udGFpbnMgYWxsIG9mIHRoZSBleHByZXNzaW9uIHNwcml0ZXMgZm9yIHRoZSBhY3RvclxyXG4gICAgdGhpcy5zcHJpdGVzID0gW107XHJcbiAgICAvL251bWJlcjogdGhlIGluZGV4IG9mIHRoZSBjdXJyZW50IGV4cHJlc3Npb25cclxuICAgIHRoaXMuaW5kZXggPSAwO1xyXG4gICAgLy9ib29sOiB3aGV0aGVyIHRoZSBhY3RvciBpcyBjdXJyZW50bHkgYmVpbmcgZHJhd24gdG8gdGhlIGNhbnZhc1xyXG4gICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcclxuICAgIC8vbnVtYmVyOiBwZXJjZW50IC0xMDAgdG8gMTAwIHJlZmVycmluZyB0byBob3Jpem9udGFsIHBvc2l0aW9uIG9uIHRoZSBzY3JlZW5cclxuICAgIHRoaXMucG9zaXRpb24gPSAwO1xyXG4gICAgLy9ib29sOiB3aGV0aGVyIG9yIG5vdCB0aGUgYWN0b3IgaXMgY3VycmVudGx5IHRoZSBjZW50ZXIgb2YgYXR0ZW50aW9uXHJcbiAgICB0aGlzLmZvY3VzID0gZmFsc2U7XHJcbiAgICAvL0pTT046IG9iamVjdCBjb250YWluaW5nIHZhcmlhYmxlcyBpbXBvcnRlZCBmcm9tIGV4cHJlc3Npb25zLmpzIGNvcnJlc3BvbmRpbmcgdG8gdGhpcyBhY3RvclxyXG4gICAgdGhpcy5kYXRhO1xyXG4gICAgLy9ib29sOiB3aGV0aGVyIGl0IGlzIHJlYWR5IHRvIGNoZWNrIGxvYWQgc3RhdHVzLiBEb2luZyBzbyB0b28gZWFybHkgY2FuIG1ha2UgZXZlbnRzIGZpcmUgb3V0IG9mIG9yZGVyXHJcbiAgICB0aGlzLmNoZWNrUmVhZHkgPSBmYWxzZTtcclxuICAgIFxyXG4gICAgLy90ZWxscyB0aGUgZnVuY3Rpb24gd2hlcmUgdGhlIGRhdGEgaXMgYW5kIHBhc3NlcyBhIGNhbGxiYWNrIHRoYXQgY2FuIGJlIHVzZWQgd2l0aCBsb2FkaW5nXHJcbiAgICB1dGlsaXR5LmxvYWRKU09OKFwiLi9jb250ZW50L2FjdG9yL1wiICsgdGhpcy5uYW1lICsgXCIvZXhwcmVzc2lvbnMuanNcIiwgX2RhdGFMb2FkZWRDYWxsYmFjay5iaW5kKHRoaXMpKTtcclxufVxyXG5cclxuLy9maXJlIG9uIEpTT04gcmVhZCBjb21wbGV0aW9uXHJcbi8vbG9hZCBKU09OIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGRpYWxvZ3VlIHNlcXVlbmNlXHJcbnZhciBfZGF0YUxvYWRlZENhbGxiYWNrID0gZnVuY3Rpb24ocFJlc3BvbnNlKXtcclxuICAgIHRoaXMuZGF0YSA9IEpTT04ucGFyc2UocFJlc3BvbnNlKTtcclxuICAgIFxyXG4gICAgLy9ub3cgdGhhdCB0aGUgZGF0YXNldCBpcyBsb2FkZWQsIHRoZSBpbWFnZSB1cmlzIGNhbiBiZSBsb2FkZWRcclxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmRhdGEuZXhwcmVzc2lvbnMubGVuZ3RoOyBpKyspe1xyXG4gICAgICAgIHRoaXMuc3ByaXRlcy5wdXNoKG5ldyBTcHJpdGUodGhpcy5kYXRhLmV4cHJlc3Npb25zW2ldLnR5cGUsIHRoaXMubmFtZSwgdGhpcy5jaGVja1Nwcml0ZVN0YXR1cy5iaW5kKHRoaXMpKSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmNoZWNrUmVhZHkgPSB0cnVlO1xyXG59XHJcblxyXG4vL21vZGlmeSB2YXJpYWJsZXMgdGhhdCBjaGFuZ2UgdGhlIGFwcGVhcmFuY2Ugb2YgdGhlIGFjdG9yIHdoZW4gZHJhd25cclxuQWN0b3IucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKHBJbmRleCwgcEFjdGl2ZSwgcFBvc2l0aW9uKXtcclxuICAgIHRoaXMuaW5kZXggPSBwSW5kZXg7XHJcbiAgICB0aGlzLmFjdGl2ZSA9IHBBY3RpdmU7XHJcbiAgICB0aGlzLnBvc2l0aW9uID0gcFBvc2l0aW9uO1xyXG59XHJcblxyXG5BY3Rvci5wcm90b3R5cGUuY2hlY2tTcHJpdGVTdGF0dXMgPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy5sb2FkZWQgPSB0cnVlO1xyXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMuc3ByaXRlcy5sZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgaWYodGhpcy5zcHJpdGVzW2ldLmxvYWRlZCA9PT0gZmFsc2Upe1xyXG4gICAgICAgICAgICB0aGlzLmxvYWRlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKHRoaXMubmFtZSArIFwiIHNwcml0ZXMgbm90IGxvYWRlZCB5ZXRcIik7XHJcbiAgICAgICAgICAgIGJyZWFrOyAgXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4vL2RyYXcgdGhlIHNjZW5lXHJcbkFjdG9yLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY2FudmFzU3RhdGUpe1xyXG4gICAgLy9tYWtlcyBzdXJlIHRoYXQgdGhlIGFzc2V0cyBhcmUgbG9hZGVkIGJlZm9yZSBhdHRlbXB0aW5nIHRvIGRyYXcgdGhlbVxyXG4gICAgaWYodGhpcy5sb2FkZWQpe1xyXG4gICAgICAgIGNhbnZhc1N0YXRlLmN0eC5zYXZlKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5zcHJpdGVzW3RoaXMuaW5kZXhdLmRyYXcoY2FudmFzU3RhdGUsIHRoaXMucG9zaXRpb24sIHRoaXMuYWN0aXZlLCB0aGlzLmZvY3VzKTtcclxuICAgICAgICBcclxuICAgICAgICBjYW52YXNTdGF0ZS5jdHgucmVzdG9yZSgpO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBY3RvcjsiLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIFV0aWxpdGllcyA9IHJlcXVpcmUoJy4vLi4vbGlicmFyaWVzL1V0aWxpdGllcy5qcycpO1xyXG52YXIgdXRpbGl0eTtcclxuXHJcbi8vY29uc3RydWN0b3JcclxuZnVuY3Rpb24gQm9hcmREYXRhKHRhcmdldCl7XHJcbiAgICAvL2hlbHBlciBsaWJyYXJ5IGRlY2xhcmF0aW9uc1xyXG4gICAgdXRpbGl0eSA9IG5ldyBVdGlsaXRpZXMoKTtcclxuICAgIFxyXG4gICAgLy9ib29sOiB3aGV0aGVyIHRoaXMgYXNzZXQgaGFzIGxvYWRlZCBvciBub3RcclxuICAgIHRoaXMubG9hZGVkID0gZmFsc2U7XHJcbiAgICAvL2pzb246IGRhdGEgZm9yIGNvbnNwaXJhY3kgYm9hcmRcclxuICAgIHRoaXMuZGF0ZTtcclxuICAgIFxyXG4gICAgXHJcbiAgICB1dGlsaXR5LmxvYWRKU09OKFwiLi9jb250ZW50L2ludGVyYWN0aW9uL1wiICsgdGFyZ2V0ICsgXCIuanNvblwiLCBfbG9hZERhdGEuYmluZCh0aGlzKSk7XHJcbn1cclxuXHJcbi8vcmVhZHMgZGF0YSBhbmQgY29tbWl0cyB0byBldmlkZW5jZSBhcnJheVxyXG5mdW5jdGlvbiBfbG9hZERhdGEocmVzcG9uc2Upe1xyXG4gICAgdGhpcy5kYXRhID0gSlNPTi5wYXJzZShyZXNwb25zZSk7XHJcbiAgICBcclxuICAgIHRoaXMubG9hZGVkID0gdHJ1ZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCb2FyZERhdGE7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBQb2ludCA9IHJlcXVpcmUoJy4uL2NvbW1vbi9Qb2ludC5qcycpO1xyXG52YXIgRHJhd0xpYiA9IHJlcXVpcmUoJy4uL2xpYnJhcmllcy9EcmF3TGliLmpzJyk7XHJcbnZhciBVdGlsaXRpZXMgPSByZXF1aXJlKCcuLi9saWJyYXJpZXMvVXRpbGl0aWVzLmpzJyk7XHJcbnZhciBFdmlkZW5jZU5vZGUgPSByZXF1aXJlKCcuL0V2aWRlbmNlTm9kZS5qcycpO1xyXG52YXIgRGlhbG9ndWUgPSByZXF1aXJlKCcuL0RpYWxvZ3VlLmpzJyk7XHJcblxyXG52YXIgdXRpbGl0eTtcclxudmFyIHBhaW50ZXI7XHJcblxyXG5mdW5jdGlvbiBCb2FyZFBoYXNlKHBCb2FyZERhdGEsIGluY29taW5nQm9hcmRTZWxlY3RvciwgaW5jb21pbmdFeHRlcm5hbE1vZGlmaWVyKXtcclxuICAgIC8vaW5zdGFudGlhdGUgbGlicmFyaWVzXHJcbiAgICBwYWludGVyID0gbmV3IERyYXdMaWIoKTtcclxuICAgIHV0aWxpdHkgPSBuZXcgVXRpbGl0aWVzKCk7XHJcbiAgICBcclxuICAgIC8vcGFyYW1ldGVyIHN0b3JhZ2VcclxuICAgIFxyXG4gICAgLy9KU09OOiBkYXRhIHNwZWNpZmljIHRvIHRoaXMgYm9hcmRcclxuICAgIHRoaXMuYm9hcmREYXRhID0gcEJvYXJkRGF0YVxyXG4gICAgLy9mdW5jdGlvbjogaW1wb3J0ZWQgZnVuY3Rpb24gdGhhdCBhbGxvd3MgdGhlIHN3aXRjaGluZyBvZiBib2FyZHNcclxuICAgIHRoaXMuYm9hcmRTZWxlY3RvckZ1bmN0aW9uID0gaW5jb21pbmdCb2FyZFNlbGVjdG9yO1xyXG4gICAgLy9mdW5jdGlvbjogaW1wb3J0ZWQgZnVuY3Rpb24gdGhhdCBhbGxvd3MgdGhlIG1vZGlmaWNhdGlvbiBvZiBleHRlcm5hbCBkYXRhIChyZXZlbGF0aW9uLCBib2FyZCB1bmxvY2spXHJcbiAgICB0aGlzLmV4dGVybmFsTW9kaWZpZXJGdW5jdGlvbiA9IGluY29taW5nRXh0ZXJuYWxNb2RpZmllcjtcclxuICAgIFxyXG4gICAgLy9ib29sOiBpZiB0aGUgZmlyc3QgdmlzaXQgdmFyaWFibGUgaGFzIG5vIHZhbHVlLCBpbml0aWFsaXplIHByb3Blcmx5XHJcbiAgICBpZih0aGlzLmJvYXJkRGF0YS5maXJzdFZpc2l0ID09PSB1bmRlZmluZWQpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiVGhpcyBpcyB0aGUgZmlyc3QgdGltZSBcIiArIHRoaXMuYm9hcmREYXRhLm5hbWUgKyBcIiBoYXMgYmVlbiB2aXNpdGVkXCIpO1xyXG4gICAgICAgIHRoaXMuYm9hcmREYXRhLmZpcnN0VmlzaXQgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgLy9ib29sOiB3aGV0aGVyIG9yIG5vdCB0aGUgZmlyc3QgbG9vcCBoYXMgYmVlbiBleGVjdXRlZFxyXG4gICAgdGhpcy5maXJzdExvb3AgPSB0cnVlO1xyXG4gICAgLy9hcnJheTxFdmlkZW5jZU5vZGU+OiBhcnJheSBvZiBhbGwgdGhlIGV2aWRlbmNlIG5vZGVzIHZpc2libGUgb24gdGhlIGJvYXJkXHJcbiAgICB0aGlzLmV2aWRlbmNlID0gW107XHJcbiAgICAvL3N0cmluZzogc2VydmVzIGFzIGEgcHNldWRvIGVudW0gdGhhdCBzdG9yZXMgdGhlIGN1cnJlbnQgcGhhc2VcclxuICAgIHRoaXMubW9kZSA9IFwiYm9hcmRcIjtcclxuICAgIC8vb2JqZWN0OiBzdG9yZXMgdGhlIG9iamVjdCB0aGF0IHRoZSBtb3VzZSBpcyBob3ZlcmluZyBvdmVyIGJhc2VkIG9uIGNvbGxpc2lvbiBjaGVja3MuIDAgd2hlbiBub3RoaW5nIGlzIHRhcmdldGVkXHJcbiAgICB0aGlzLm1vdXNlVGFyZ2V0ID0gMDtcclxuICAgIC8vb2JqZWN0OiBjb250YWlucyBhIHBpcGVsaW5lIG9mIHNlcWVudGlhbCBpbnN0cnVjdGlvbnMgdG8gYmUgcmVhZCBhbmQgZXhlY3V0ZWQgaW4gb3JkZXIgYmFzZWQgb24gcGxheWVyIGlucHV0XHJcbiAgICB0aGlzLmFjdGlvbkFycmF5ID0gW107XHJcbiAgICAvL29iamVjdDogcmVmZXJlbmNlcyB0aGUgbm9kZSBmcm9tIHdoaWNoIGEgY2xpY2sgYW5kIGRyYWcgb3BlcmF0aW9uIGhhcyBiZWd1bi4gMCB3aGVuIG5vdGhpbmcgaXMgdGFyZ2V0ZWRcclxuICAgIHRoaXMub3JpZ2luTm9kZSA9IDA7XHJcbiAgICAvL2Jvb2w6IHdoZXRoZXIgYSBub3RpZmljYXRpb24gaXMgY3VycmVudGx5IGJlaW5nIGRpc3BsYXllZFxyXG4gICAgdGhpcy5ub3RpZmljYXRpb24gPSBmYWxzZTtcclxuICAgIC8vb2JqZWN0OiBjb250YWluZXIgZm9yIHRoZSBhY3RpdmUgZGlhbG9ndWVcclxuICAgIHRoaXMuYWN0aXZlRGlhbG9ndWU7XHJcbiAgICAvL2Jvb2w6IHdoZXRoZXIgb3Igbm90IHByb2dyZXNzaW9uIGlzIGxvY2tlZCBieSBhIGZhZGUgYW5pbWF0aW9uXHJcbiAgICB0aGlzLmZhZGVBbmltYXRpb25Mb2NrID0gZmFsc2U7XHJcbiAgICAvL251bWJlcjogZHVyYXRpb24gb2YgdGltZSBpbiBtaWxsaXNlY29uZHMgc2luY2UgYSBmYWRlIGFuaW1hdGlvbiBsb2NrIHdhcyBwdXQgaW4gcGxhY2VcclxuICAgIHRoaXMuZmFkZUFuaW1hdGlvbkxvY2tUaW1lciA9IC0xO1xyXG4gICAgLy9pbWFnZTogdGhlIHJlcGVhdGluZyB0ZXh0dXJlIGZvciB0aGUgYm9hcmRcclxuICAgIHRoaXMuYm9hcmRUZXh0dXJlID0gbmV3IEltYWdlKCk7XHJcbiAgICAvL3BhdHRlcm46IHRoZSBib2FyZFRleHR1cmUgY29udmVydGVkIHRvIGEgcGF0dGVyblxyXG4gICAgdGhpcy5ib2FyZFRleHR1cmVQYXR0ZXJuO1xyXG4gICAgLy9pbWFnZTogdGhlIHJlcGVhdGluZyB0ZXh0dXJlIGZvciB0aGUgeWFyblxyXG4gICAgdGhpcy55YXJuVGV4dHVyZSA9IG5ldyBJbWFnZSgpO1xyXG4gICAgLy9wYXR0ZXJuOiB0aGUgeWFybiB0ZXh0dXJlIGNvbnZlcnRlZCB0byBhIHBhdHRlcm5cclxuICAgIHRoaXMueWFyblRleHR1cmVQYXR0ZXJuO1xyXG4gICAgLy9ib29sOiB3aGV0aGVyIG9yIG5vdCB0ZXh0dXJlIGFzc2V0cyBoYXZlIGJlZW4gY29udmVydGVkIHRvIHBhdHRlcm5zXHJcbiAgICB0aGlzLnBhdHRlcm5Db252ZXJzaW9uID0gZmFsc2U7XHJcbiAgICAvL251bWJlcjogdGhlIGRpbWVuc2lvbnMgb2YgdGhlIGV2aWRlbmNlIGZyYW1lc1xyXG4gICAgdGhpcy5ldmlkZW5jZUZyYW1lU2l6ZSA9IDA7XHJcbiAgICAvL251bWJlcjogaW5kZXggb2YgdGhlIG5leHQgbm9kZSB0byBiZSBmb2N1c2VkXHJcbiAgICAvL3RoaXMuYm9hcmREYXRhLmZvY3VzVGFyZ2V0O1xyXG4gICAgXHJcbiAgICBcclxuICAgIC8vYXR0YWNoIHRoZSB0ZXJtaW5hdGlvbiBldmVudCB0byB0aGUgbm90aWZpY2F0aW9uIGxheWVyXHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5vdGlmaWNhdGlvbkxheWVyXCIpLm9uY2xpY2sgPSAgdGhpcy5fdGVybWluYXRlTm90aWZpY2F0aW9uLmJpbmQodGhpcyk7XHJcbiAgICBcclxuICAgIFxyXG4gICAgLy9sb2FkQ2FsbGJhY2sgZm9yIGJvYXJkIHRleHR1cmVcclxuICAgIHRoaXMuYm9hcmRUZXh0dXJlLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBfbG9hZEJvYXJkVGV4dHVyZS5iaW5kKHRoaXMpLCBmYWxzZSk7XHJcbiAgICB0aGlzLmJvYXJkVGV4dHVyZS5zcmMgPSBcIi4vY29udGVudC91aS9ib2FyZC5qcGdcIjtcclxuICAgIHRoaXMueWFyblRleHR1cmUuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIF9sb2FkWWFyblRleHR1cmUuYmluZCh0aGlzKSwgZmFsc2UpO1xyXG4gICAgdGhpcy55YXJuVGV4dHVyZS5zcmMgPSBcIi4vY29udGVudC91aS95YXJuLnBuZ1wiO1xyXG4gICAgXHJcbiAgICAvL3RoaW5ncyBwcmV2aW91c2x5IGRvbmUgaW4gdGhlIGRhdGEgbG9hZGVkIGNhbGxiYWNrIGNhbiBub3cgYmUgZG9uZSBoZXJlXHJcbiAgICAvL2xvYWQgZXZpZGVuY2UgYXJyYXlcclxuICAgIHZhciBpO1xyXG4gICAgdmFyIGFycmF5TGVuZ3RoID0gdGhpcy5ib2FyZERhdGEuZGF0YS5ldmlkZW5jZS5sZW5ndGg7XHJcbiAgICBmb3IoaSA9IDA7IGkgPCBhcnJheUxlbmd0aDsgaSsrKXtcclxuICAgICAgICB0aGlzLmV2aWRlbmNlLnB1c2gobmV3IEV2aWRlbmNlTm9kZSh0aGlzLmJvYXJkRGF0YS5kYXRhLmV2aWRlbmNlW2ldLCB0aGlzLl9hZGRBY3Rpb24uYmluZCh0aGlzKSwgdGhpcy5fc2V0Rm9jdXMuYmluZCh0aGlzKSkpO1xyXG4gICAgfVxyXG4gICAgLy9zZXQgdGl0bGUgZmllbGRcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYm9hcmRUaXRsZVRleHRcIikuaW5uZXJIVE1MID0gdGhpcy5ib2FyZERhdGEuZGF0YS5ib2FyZE5hbWU7XHJcbiAgICAvL3NldCB0aGUgc2hpZnQgZm9jdXMgY2xpY2sgZXZlbnRcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYm9hcmRUaXRsZUlubmVyRnJhbWVcIikub25jbGljayA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgdGhpcy5ib2FyZFNlbGVjdG9yRnVuY3Rpb24oXCJzZWxlY3RcIik7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbiAgICBcclxufVxyXG5cclxuLy9jYWxsYmFjayBmdW5jdGlvbiB0aGF0IGxvYWRzIHRoZSBib2FyZCB0ZXh0dXJlIG9uY2VcclxudmFyIF9sb2FkQm9hcmRUZXh0dXJlID0gZnVuY3Rpb24oZSl7XHJcbiAgICB0aGlzLmJvYXJkVGV4dHVyZSA9IGUudGFyZ2V0O1xyXG59XHJcbnZhciBfbG9hZFlhcm5UZXh0dXJlID0gZnVuY3Rpb24oZSl7XHJcbiAgICB0aGlzLnlhcm5UZXh0dXJlID0gZS50YXJnZXQ7XHJcbn1cclxuXHJcbi8vYXR0YWNoZWQgdG8gdGhlIGNsaWNrIGV2ZW50IG9mIHRoZSBub3RpY2F0aW9uIGxheWVyLCBjbG9zZXMgbm90aWZpY2F0aW9uXHJcbkJvYXJkUGhhc2UucHJvdG90eXBlLl90ZXJtaW5hdGVOb3RpZmljYXRpb24gPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ub3RpZmljYXRpb24gPSBmYWxzZTtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibm90aWZpY2F0aW9uTGF5ZXJcIikuY2xhc3NOYW1lID0gXCJoaWRkZW5MYXllclwiO1xyXG4gICAgXHJcbiAgICAvL2ZvcmNpYmx5IGNhbGwgdGhlIG1vdXNlbW92ZSBmdW5jdGlvbiB0byB1cGRhdGUgdGhlIHBvc2l0aW9uIG9mIHRoZSBtb3VzZVxyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignY2FudmFzJykuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ21vdXNlbW92ZScpKTtcclxufVxyXG5cclxuLy91cGRhdGVzIHN0YXRlIHZhcmlhYmxlcyBmcm9tIHRoZSBoaWdoZXN0IGxldmVsXHJcbkJvYXJkUGhhc2UucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKG1vdXNlU3RhdGUsIGNhbnZhc1N0YXRlKXtcclxuICAgIC8vY29uc29sZS5kaXIobW91c2VTdGF0ZS5wb3NpdGlvbi54ICsgXCIsIFwiICsgbW91c2VTdGF0ZS5wb3NpdGlvbi55KTtcclxuICAgIC8vY29tcGxldGUgZGVub3RlcyB3aGV0aGVyIG9yIG5vdCB0aGUgcGFydGljdWxhciB0ZXh0dXJlIGhhcyBmdWxseSBsb2FkZWRcclxuICAgIGlmKHRoaXMuYm9hcmRUZXh0dXJlLmNvbXBsZXRlICYmIHRoaXMueWFyblRleHR1cmUuY29tcGxldGUpIHtcclxuICAgICAgICAvL3VwZGF0ZSBmcmFtZSBzaXplIHZhcmlhYmxlIHNvIGl0IGNhbiBiZSB1c2VkIGluIGNvbGxpc2lvbiBjYWxjdWxhdGlvblxyXG4gICAgICAgIHRoaXMuZXZpZGVuY2VGcmFtZVNpemUgPSBjYW52YXNTdGF0ZS5ldmlkZW5jZUZyYW1lU2l6ZTtcclxuICAgICAgICBcclxuICAgICAgICAvL2V4ZWN1dGUgZXh0cmEgY29kZSBpZiB0aGlzIGlzIHRoZSBmaXJzdCBsb29wXHJcbiAgICAgICAgaWYodGhpcy5maXJzdExvb3Ape1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy9pZiB0aGlzIGlzIHRoZSBmaXJzdCB2aXNpdCwgZG8gdGhlIGZpcnN0IHRpbWUgZGlhbG9ndWVcclxuICAgICAgICAgICAgaWYodGhpcy5ib2FyZERhdGEuZmlyc3RWaXNpdCA9PT0gdHJ1ZSl7XHJcbiAgICAgICAgICAgICAgICAvL2NyZWF0ZSBhbiBhcnJheSBvZiBhY3Rpb25zIGZyb20gdGhlIG9wZW5pbmdBY3Rpb25zIGluIHRoZSBkYXRhXHJcbiAgICAgICAgICAgICAgICB2YXIgaTtcclxuICAgICAgICAgICAgICAgIHZhciBhcnJheUxlbmd0aCA9IHRoaXMuYm9hcmREYXRhLmRhdGEub3BlbmluZ0FjdGlvbnMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgZm9yKGkgPSAwOyBpIDwgYXJyYXlMZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYWRkQWN0aW9uKHRoaXMuYm9hcmREYXRhLmRhdGEub3BlbmluZ0FjdGlvbnNbaV0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5ib2FyZERhdGEuZmlyc3RWaXNpdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgICAvL290aGVyd2lzZSBmYWRlIG91dCB0aGUgZmFkZSBibGluZGVyIGFuZCBldmVyeXRoaW5nIHdpbGwgcHJvY2VlZCBhcyBub3JtYWxcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmFkZUJsaW5kZXJcIikuY2xhc3NOYW1lID0gXCJoaWRkZW5MYXllclwiO1xyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJib2FyZFVJTGF5ZXJcIikuY2xhc3NOYW1lID0gXCJcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy9iZWdpbiBieSBjbGlja2luZyB0aGUgYm9hcmQncyBmb2N1cyB0YXJnZXRcclxuICAgICAgICAgICAgdGhpcy5ldmlkZW5jZVt0aGlzLmJvYXJkRGF0YS5mb2N1c1RhcmdldF0uY2xpY2soKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMuZmlyc3RMb29wID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vbW9kaWZ5IHZhcmlhYmxlc1xyXG4gICAgICAgIHRoaXMuYWN0KG1vdXNlU3RhdGUpO1xyXG4gICAgICAgIC8vZHJhdyBlbGVtZW50c1xyXG4gICAgICAgIHRoaXMuZHJhdyhjYW52YXNTdGF0ZSwgbW91c2VTdGF0ZSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICAvL2xvYWRpbmcgc2NyZWVuIGVsZW1lbnRzXHJcbiAgICAgICAgY2FudmFzU3RhdGUuY3R4LnNhdmUoKTtcclxuICAgICAgICBjYW52YXNTdGF0ZS5jdHguZm9udCA9IFwiNDBweCBBcmlhbFwiO1xyXG4gICAgICAgIGNhbnZhc1N0YXRlLmN0eC50ZXh0QmFzZWxpbmUgPSBcIm1pZGRsZVwiO1xyXG4gICAgICAgIGNhbnZhc1N0YXRlLmN0eC50ZXh0QWxpZ24gPSBcImNlbnRlclwiO1xyXG4gICAgICAgIGNhbnZhc1N0YXRlLmN0eC5maWxsVGV4dChcIkxvYWRpbmcuLi5cIiwgY2FudmFzU3RhdGUuY2VudGVyLngsIGNhbnZhc1N0YXRlLmNlbnRlci55KTtcclxuICAgICAgICBjYW52YXNTdGF0ZS5jdHgucmVzdG9yZSgpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vL21ldGhvZCBjYWxsZWQgcmVtb3RlbHkgZnJvbSBldmlkZW5jZSBub2RlIHRvIGFkZCBhY3Rpb25zIHRvIHRoZSBhY3Rpb24gYXJyYXlcclxuQm9hcmRQaGFzZS5wcm90b3R5cGUuX2FkZEFjdGlvbiA9IGZ1bmN0aW9uKGltcG9ydGVkSlNPTil7XHJcbiAgICB0aGlzLmFjdGlvbkFycmF5LnB1c2goaW1wb3J0ZWRKU09OKTtcclxufVxyXG5Cb2FyZFBoYXNlLnByb3RvdHlwZS5fc2V0Rm9jdXMgPSBmdW5jdGlvbihpbmRleCl7XHJcbiAgICB0aGlzLmJvYXJkRGF0YS5mb2N1c1RhcmdldCA9IHBhcnNlSW50KGluZGV4KTtcclxufVxyXG5cclxuLy9jYWxsZWQgdG8gY2hlY2sgY29ubmVjdGlvbnMgYmV0d2VlbiAyIG5vZGVzIGFuZCBoYW5kbGUgdGhlIHJlc3VsdHNcclxuQm9hcmRQaGFzZS5wcm90b3R5cGUuX2Nvbm5lY3QgPSBmdW5jdGlvbihub2RlMSwgbm9kZTIpe1xyXG4gICAgdGhpcy5tb3VzZVRhcmdldCA9IDA7XHJcbiAgICBpZihub2RlMS5kYXRhLmNvbm5lY3Rpb24uaW5jbHVkZXMobm9kZTIuZGF0YS5udW0pKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIlRoaXMgaXMgYSByZXBlYXRlZCBjb25uZWN0aW9uXCIpO1xyXG4gICAgICAgIC8vY2hlY2sgd2hldGhlciBpdCBpcyBzdWNjZXNzZnVsIGNvbm5lY3Rpb25cclxuICAgICAgICAvL29yIGEgZmFpbGVkIGNvbm5lY3Rpb25cclxuICAgICAgICBcclxuICAgICAgICB2YXIgaW50ZXJhY3Rpb25Gb3VuZCA9IGZhbHNlO1xyXG4gICAgICAgIC8vaXRlcmF0ZSB0aHJvdWdoIGVhY2ggcG9zc2libGUgaW50ZXJhY3Rpb25cclxuICAgICAgICB2YXIgaTtcclxuICAgICAgICB2YXIgYXJyYXlMZW5ndGggPSBub2RlMS5kYXRhLmludGVyYWN0aW9ucy5sZW5ndGg7XHJcbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgYXJyYXlMZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgICAgIGlmKG5vZGUxLmRhdGEuaW50ZXJhY3Rpb25zW2ldLnRhcmdldCA9PT0gbm9kZTIuZGF0YS5udW0pe1xyXG4gICAgICAgICAgICAgICAgLy9pdGVyYXRlIHRocm91Z2ggdGhlIGludGVyYWN0aW9uJ3MgcmVzdWx0IGxvb3BcclxuICAgICAgICAgICAgICAgIHZhciBqO1xyXG4gICAgICAgICAgICAgICAgdmFyIGFycmF5TGVuZ3RoSiA9IG5vZGUxLmRhdGEuaW50ZXJhY3Rpb25zW2ldLnJlc3VsdC5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICBmb3IoaiA9IDA7IGogPCBhcnJheUxlbmd0aEo7IGorKyl7XHJcbiAgICAgICAgICAgICAgICAgICAgaW50ZXJhY3Rpb25Gb3VuZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZTIubW91c2VPdmVyID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvL3RoZSBpbnRlcmFjdGlvbiB3YXMgZm91bmQsIHNvIHRoZSBmb3IgbG9vcCBjYW4gYmUgYnJva2VuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZighaW50ZXJhY3Rpb25Gb3VuZCl7XHJcbiAgICAgICAgICAgIC8vZmlyZXMgaWYgYWJzb2x1dGVseSBub3RoaW5nIGhhcHBlbnMgYWZ0ZXIgY29ubmVjdGluZyB0aGUgdHdvXHJcbiAgICAgICAgICAgdGhpcy5fbm90aWZ5KFwiQ29ubmVjdGlvbiBhbHJlYWR5IGF0dGVtcHRlZC5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIHRoaXMuX25vdGlmeShcIkNvbm5lY3Rpb24gYWxyZWFkeSBtYWRlLlwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvL3RoZSBjb25uZWN0aW9uIGlzIE5FV1xyXG4gICAgZWxzZXtcclxuICAgICAgICBub2RlMS5kYXRhLmNvbm5lY3Rpb24ucHVzaChub2RlMi5kYXRhLm51bSk7XHJcbiAgICAgICAgbm9kZTIuZGF0YS5jb25uZWN0aW9uLnB1c2gobm9kZTEuZGF0YS5udW0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBpbnRlcmFjdGlvbkZvdW5kID0gZmFsc2U7XHJcbiAgICAgICAgLy9pdGVyYXRlIHRocm91Z2ggZWFjaCBwb3NzaWJsZSBpbnRlcmFjdGlvblxyXG4gICAgICAgIHZhciBpO1xyXG4gICAgICAgIHZhciBhcnJheUxlbmd0aCA9IG5vZGUxLmRhdGEuaW50ZXJhY3Rpb25zLmxlbmd0aDtcclxuICAgICAgICBmb3IoaSA9IDA7IGkgPCBhcnJheUxlbmd0aDsgaSsrKXtcclxuICAgICAgICAgICAgaWYobm9kZTEuZGF0YS5pbnRlcmFjdGlvbnNbaV0udGFyZ2V0ID09PSBub2RlMi5kYXRhLm51bSl7XHJcbiAgICAgICAgICAgICAgICAvL2l0ZXJhdGUgdGhyb3VnaCB0aGUgaW50ZXJhY3Rpb24ncyByZXN1bHQgbG9vcFxyXG4gICAgICAgICAgICAgICAgdmFyIGo7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyYXlMZW5ndGhKID0gbm9kZTEuZGF0YS5pbnRlcmFjdGlvbnNbaV0ucmVzdWx0Lmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIGZvcihqID0gMDsgaiA8IGFycmF5TGVuZ3RoSjsgaisrKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hZGRBY3Rpb24obm9kZTEuZGF0YS5pbnRlcmFjdGlvbnNbaV0ucmVzdWx0W2pdKTtcclxuICAgICAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbkZvdW5kID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBub2RlMi5tb3VzZU92ZXIgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vdGhlIGludGVyYWN0aW9uIHdhcyBmb3VuZCwgc28gdGhlIGZvciBsb29wIGNhbiBiZSBicm9rZW5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKCFpbnRlcmFjdGlvbkZvdW5kKXtcclxuICAgICAgICAgICAgLy9maXJlcyBpZiBhYnNvbHV0ZWx5IG5vdGhpbmcgaGFwcGVucyBhZnRlciBjb25uZWN0aW5nIHRoZSB0d29cclxuICAgICAgICAgICAgLy90aGlzLl9ub3RpZnkoXCJBIGNvbm5lY3Rpb24gY291bGQgbm90IGJlIG1hZGUuXCIpO1xyXG4gICAgICAgICAgICAvL0NPU1QgVE9ETzogd29yayBpbiBwcm9ncmVzc1xyXG4gICAgICAgICAgICB0aGlzLl9hZGRBY3Rpb24oeyBcInR5cGVcIjogXCJzcGVuZFRpbWVcIiwgXCJ0YXJnZXRcIjogeyBcImNvc3RcIjogMSwgXCJub3RpZmljYXRpb25cIjogXCJBIGNvbm5lY3Rpb24gY291bGQgbm90IGJlIG1hZGUuXCIgfSB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgIFxyXG4gICAgXHJcbn1cclxuXHJcbi8vaW5zZXJ0cyBhbiBhY3RpdmUgbm90aWZpY2F0aW9uXHJcbkJvYXJkUGhhc2UucHJvdG90eXBlLl9ub3RpZnkgPSBmdW5jdGlvbihtZXNzYWdlKXtcclxuICAgIC8vc2V0IG5vdGlmaWNhdGlvbiB2YXJpYWJsZVxyXG4gICAgdGhpcy5ub3RpZmljYXRpb24gPSB0cnVlO1xyXG4gICAgLy9zZXQgbm90aWZpY2F0aW9uIHRleHRcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibm90aWZpY2F0aW9uVGV4dFwiKS5pbm5lckhUTUwgPSBtZXNzYWdlO1xyXG4gICAgLy9tYWtlIG5vdGlmaWNhdGlvbiBsYXllciB2aXNpYmxlXHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5vdGlmaWNhdGlvbkxheWVyXCIpLmNsYXNzTmFtZSA9IFwiXCI7XHJcbn1cclxuXHJcbi8vY2FsbGVkIHdoZW4gYW4gYWN0aW9uIGhhcyBmaW5pc2hlZCBleGVjdXRpbmcsIHJlbW92ZXMgYWN0aW9uIGFuZCBleGVjdXRlcyBjbGVhbnVwIGlmIGxhc3QgaW4gYXJyYXlcclxuQm9hcmRQaGFzZS5wcm90b3R5cGUuX2FjdGlvbkNsZWFudXAgPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy5hY3Rpb25BcnJheS5zcGxpY2UoMCwxKTtcclxuICAgIHRyeXtcclxuICAgICAgICB0aGlzLmV2aWRlbmNlW3RoaXMuYm9hcmREYXRhLmZvY3VzVGFyZ2V0XS5jbGljaygpO1xyXG4gICAgfVxyXG4gICAgY2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJUaGVyZSB3YXMgYSBwcm9ibGVtIHNlbGVjdGluZyB0aGUgZm9jdXMgdGFyZ2V0XCIpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vL2NhbGxlZCBldmVyeSBsb29wIGFuZCBwcm9jZXNzZXMgYWN0aW9uIHF1ZXVlXHJcbkJvYXJkUGhhc2UucHJvdG90eXBlLmFjdCA9IGZ1bmN0aW9uKG1vdXNlU3RhdGUpe1xyXG4gICAgLy9hbiBhY3RpdmUgbm90aWZpY2F0aW9uIHRha2VzIHByZWNlZGVuY2Ugb3ZlciBhbGwgZWxzZVxyXG4gICAgaWYodGhpcy5ub3RpZmljYXRpb24gPT09IGZhbHNlKXtcclxuICAgICAgICAvL2dvZXMgdGhyb3VnaCBlYWNoIGl0ZW0gaW4gdGhlIGFjdGlvbiBxdWV1ZSBhbmQgcHJvY2Vzc2VzIHRoZW0gb25lIGJ5IG9uZVxyXG4gICAgICAgIGlmKHRoaXMuYWN0aW9uQXJyYXkubGVuZ3RoID4gMCl7XHJcbiAgICAgICAgICAgIC8vdGhlIGFycmF5IGNvbnRhaW5zIHVucmVzb2x2ZWQgYWN0aW9ucyB0aGF0IG5lZWQgdG8gYmUgcHJvY2Vzc2VkXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmFjdGlvbkFycmF5WzBdLnR5cGUgPT09IFwiZGlhbG9ndWVcIil7XHJcbiAgICAgICAgICAgICAgICAvL2RpYWxvZ3VlIGFkdmFuY2VtZW50IGFuZCBoYW5kbGluZ1xyXG4gICAgICAgICAgICAgICAgLy9jaGVjayBhbmQgc2VlIGlmIGRpYWxvZ3VlIGlzIGxvYWRlZCBhdCBhbGxcclxuICAgICAgICAgICAgICAgIGlmKHRoaXMuYWN0aW9uQXJyYXlbMF0uaW5pdFN0YXR1cyA9PT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgICAgICAgICAvL2ZsYWcgdGhlIG9iamVjdCBhcyBoYXZpbmcgYmVlbiBpbml0aWFsaXplZFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uQXJyYXlbMF0uaW5pdFN0YXR1cyA9IFwiaW5pdGlhbGl6ZWRcIjtcclxuICAgICAgICAgICAgICAgICAgICAvL2xvYWQgZGlhbG9ndWUgZGF0YSBpbnRvIG9iamVjdFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlRGlhbG9ndWUgPSBuZXcgRGlhbG9ndWUodGhpcy5hY3Rpb25BcnJheVswXS50YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIC8vYmxpbmRlciBmYWRlIGluIGFzIHBhcnQgb2YgdHJhbnNpdGlvblxyXG4gICAgICAgICAgICAgICAgICAgIGlmKHRoaXMuZmFkZUFuaW1hdGlvbkxvY2sgPT09IGZhbHNlKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5mYWRlQW5pbWF0aW9uTG9jayA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmFkZUJsaW5kZXJcIikuY2xhc3NOYW1lID0gXCJcIjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmKHRoaXMuYWN0aW9uQXJyYXlbMF0uaW5pdFN0YXR1cyA9PT0gXCJpbml0aWFsaXplZFwiKXtcclxuICAgICAgICAgICAgICAgICAgICAvL2FsbG93IGRpYWxvZ3VlIHRvIGFjdCBhbmQgbG9hZFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlRGlhbG9ndWUuYWN0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgLy93YWl0IGZvciBsb2FkIGJlZm9yZVxyXG4gICAgICAgICAgICAgICAgICAgIGlmKHRoaXMuYWN0aXZlRGlhbG9ndWUuYWxsTG9hZGVkICYmIHRoaXMuZmFkZUFuaW1hdGlvbkxvY2sgPT09IGZhbHNlKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmYWRlQmxpbmRlclwiKS5jbGFzc05hbWUgPSBcImhpZGRlbkxheWVyXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmYWRlQmxpbmRlclwiKS5jbGFzc05hbWUgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2hpZGUgdGhlIGV2aWRlbmNlIG1lbnVcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJldmlkZW5jZUxheWVyXCIpLmNsYXNzTmFtZSA9IFwiaGlkZGVuRWxlbWVudFwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJvYXJkVUlMYXllclwiKS5jbGFzc05hbWUgPSBcImhpZGRlbkVsZW1lbnRcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9jaGFuZ2UgbW9kZSB0byBkaWFsb2d1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1vZGUgPSBcImRpYWxvZ3VlXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uQXJyYXlbMF0uaW5pdFN0YXR1cyA9IFwiZnVsbHlMb2FkZWRcIjtcclxuICAgICAgICAgICAgICAgICAgICB9IFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZih0aGlzLmFjdGlvbkFycmF5WzBdLmluaXRTdGF0dXMgPT09IFwiZnVsbHlMb2FkZWRcIil7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3RpdmVEaWFsb2d1ZS5hY3QoKTtcclxuICAgICAgICAgICAgICAgICAgICAvL2NoZWNrIGRpYWxvZ3VlIGNvbXBsZXRpb25cclxuICAgICAgICAgICAgICAgICAgICBpZih0aGlzLmFjdGl2ZURpYWxvZ3VlLmNvbXBsZXRlID09PSB0cnVlKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5mYWRlQW5pbWF0aW9uTG9jayA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vZmFkZSB0aGUgYmxpbmRlciBpbiBub3cgdGhhdCBldmVyeXRoaW5ncyBoYXMgd3JhcHBlZCB1cFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZhZGVCbGluZGVyXCIpLmNsYXNzTmFtZSA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uQXJyYXlbMF0uaW5pdFN0YXR1cyA9IFwidGVybWluYXRpbmdcIjtcclxuICAgICAgICAgICAgICAgICAgICB9ICBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYodGhpcy5hY3Rpb25BcnJheVswXS5pbml0U3RhdHVzID09PSBcInRlcm1pbmF0aW5nXCIpe1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKHRoaXMuZmFkZUFuaW1hdGlvbkxvY2sgPT09IGZhbHNlKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9mYWRlIHRoZSBibGluZGVyIG91dCBub3cgdGhhdCBpdCBoYXMgaGFkIGEgY2hhbmNlIHRvIGZhZGUgaW4gY29tcGxldGVseVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZhZGVCbGluZGVyXCIpLmNsYXNzTmFtZSA9IFwiaGlkZGVuTGF5ZXJcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy90aGUgdWkgbGF5ZXIgY2FuIHJldHVybiB0byB2aXNpYmlsaXR5IGFzIHdlbGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJib2FyZFVJTGF5ZXJcIikuY2xhc3NOYW1lID0gXCJcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYWN0aW9uQ2xlYW51cCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1vZGUgPSBcImJvYXJkXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuYWN0aW9uQXJyYXlbMF0udHlwZSA9PT0gXCJ1bmxvY2tFdmlkZW5jZVwiKXtcclxuICAgICAgICAgICAgICAgIC8vdW52ZWlsIHRoZSBjb3JyZXNwb25kaW5nIGV2aWRlbmNlXHJcbiAgICAgICAgICAgICAgICB0aGlzLmV2aWRlbmNlW3RoaXMuYWN0aW9uQXJyYXlbMF0udGFyZ2V0XS5kYXRhLnZpc2libGUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgLy9zZXQgZm9jdXMgdGFyZ2V0IHRvIHRoZSBpbmRleCBvZiB0aGUgdW5sb2NrZWQgZXZpZGVuY2VcclxuICAgICAgICAgICAgICAgIHRoaXMuYm9hcmREYXRhLmZvY3VzVGFyZ2V0ID0gdGhpcy5hY3Rpb25BcnJheVswXS50YXJnZXQ7XHJcbiAgICAgICAgICAgICAgICAvL3B1c2ggbm90aWZpY2F0aW9uXHJcbiAgICAgICAgICAgICAgICB0aGlzLl9ub3RpZnkodGhpcy5ldmlkZW5jZVt0aGlzLmFjdGlvbkFycmF5WzBdLnRhcmdldF0uZGF0YS5uYW1lICsgXCIgaGFzIGJlZW4gYWRkZWQgdG8gdGhlIGJvYXJkLlwiKTtcclxuICAgICAgICAgICAgICAgIC8vZXhlY3V0ZSBjbGVhbnVwXHJcbiAgICAgICAgICAgICAgICB0aGlzLl9hY3Rpb25DbGVhbnVwKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5hY3Rpb25BcnJheVswXS50eXBlID09PSBcInVubG9ja0JvYXJkXCIpe1xyXG4gICAgICAgICAgICAgICAgLy91bmxvY2sgdGhlIGNvcnJlc3BvbmRpbmcgc2NlbmVcclxuICAgICAgICAgICAgICAgIHRoaXMuZXh0ZXJuYWxNb2RpZmllckZ1bmN0aW9uKFwidW5sb2NrQm9hcmRcIiwgdGhpcy5hY3Rpb25BcnJheVswXS50YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgLy9hZHZhbmNlIHRoZSBhY3Rpb25BcnJheVxyXG4gICAgICAgICAgICAgICAgdGhpcy5fYWN0aW9uQ2xlYW51cCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuYWN0aW9uQXJyYXlbMF0udHlwZSA9PT0gXCJ1bmxvY2tDbHVlXCIpe1xyXG4gICAgICAgICAgICAgICAgLy91bmxvY2sgdGhlIGNvcnJlc3BvbmRpbmcgY2x1ZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5leHRlcm5hbE1vZGlmaWVyRnVuY3Rpb24oXCJ1bmxvY2tDbHVlXCIsIHRoaXMuYWN0aW9uQXJyYXlbMF0udGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgIC8vYWR2YW5jZSB0aGUgYWN0aW9uQXJyYXlcclxuICAgICAgICAgICAgICAgIHRoaXMuX2FjdGlvbkNsZWFudXAoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICh0aGlzLmFjdGlvbkFycmF5WzBdLnR5cGUgPT09IFwidW5sb2NrTXlzdGVyeVwiKXtcclxuICAgICAgICAgICAgICAgIC8vdW5sb2NrIHRoZSBjb3JyZXNwb25kaW5nIG15c3RlcnlcclxuICAgICAgICAgICAgICAgIHRoaXMuZXh0ZXJuYWxNb2RpZmllckZ1bmN0aW9uKFwidW5sb2NrTXlzdGVyeVwiLCB0aGlzLmFjdGlvbkFycmF5WzBdLnRhcmdldCk7XHJcbiAgICAgICAgICAgICAgICAvL2FkdmFuY2UgdGhlIGFjdGlvbkFycmF5XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9hY3Rpb25DbGVhbnVwKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5hY3Rpb25BcnJheVswXS50eXBlID09PSBcImxvY2tNeXN0ZXJ5XCIpe1xyXG4gICAgICAgICAgICAgICAgLy9sb2NrIHRoZSBjb3JyZXNwb25kaW5nIG15c3RlcnlcclxuICAgICAgICAgICAgICAgIHRoaXMuZXh0ZXJuYWxNb2RpZmllckZ1bmN0aW9uKFwibG9ja015c3RlcnlcIiwgdGhpcy5hY3Rpb25BcnJheVswXS50YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgLy9hZHZhbmNlIHRoZSBhY3Rpb25BcnJheVxyXG4gICAgICAgICAgICAgICAgdGhpcy5fYWN0aW9uQ2xlYW51cCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuYWN0aW9uQXJyYXlbMF0udHlwZSA9PT0gXCJ1cGRhdGVNeXN0ZXJ5XCIpe1xyXG4gICAgICAgICAgICAgICAgLy91cGRhdGUgdGhlIGNvcnJlc3BvbmRpbmcgbXlzdGVyeVxyXG4gICAgICAgICAgICAgICAgdGhpcy5leHRlcm5hbE1vZGlmaWVyRnVuY3Rpb24oXCJ1cGRhdGVNeXN0ZXJ5XCIsIHRoaXMuYWN0aW9uQXJyYXlbMF0udGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgIC8vYWR2YW5jZSB0aGUgYWN0aW9uQXJyYXlcclxuICAgICAgICAgICAgICAgIHRoaXMuX2FjdGlvbkNsZWFudXAoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICh0aGlzLmFjdGlvbkFycmF5WzBdLnR5cGUgPT09IFwiYWRkVGltZVwiKXtcclxuICAgICAgICAgICAgICAgIC8vYWRkIHRoZSBzcGVjaWZpZWQgYW1vdW50IG9mIHRpbWVcclxuICAgICAgICAgICAgICAgIHRoaXMuZXh0ZXJuYWxNb2RpZmllckZ1bmN0aW9uKFwiYWRkVGltZVwiLCB0aGlzLmFjdGlvbkFycmF5WzBdLnRhcmdldCk7XHJcbiAgICAgICAgICAgICAgICAvL2FkdmFuY2UgdGhlIGFjdGlvbkFycmF5XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9hY3Rpb25DbGVhbnVwKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5hY3Rpb25BcnJheVswXS50eXBlID09PSBcInNwZW5kVGltZVwiKXtcclxuICAgICAgICAgICAgICAgIC8vc3BlbmQgdGhlIHNwZWNpZmllZCBhbW91bnQgb2YgdGltZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5leHRlcm5hbE1vZGlmaWVyRnVuY3Rpb24oXCJzcGVuZFRpbWVcIiwgdGhpcy5hY3Rpb25BcnJheVswXS50YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgLy9jaGVjayBhbmQgc2VlIGp1c3QgaG93IG11Y2ggdGltZSByZW1haW5zLCBhZGQgZW5kR2FtZSBpZiB0aW1lIGlzIGZ1bGx5IGNvbnN1bWVkXHJcbiAgICAgICAgICAgICAgICAvL2FkdmFuY2UgdGhlIGFjdGlvbkFycmF5XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9hY3Rpb25DbGVhbnVwKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5hY3Rpb25BcnJheVswXS50eXBlID09PSBcImVuZEdhbWVcIil7XHJcbiAgICAgICAgICAgICAgICAvL3BvcHVsYXRlIHRoZSByZXN1bHRzIHNjcmVlblxyXG4gICAgICAgICAgICAgICAgdGhpcy5leHRlcm5hbE1vZGlmaWVyRnVuY3Rpb24oXCJlbmRHYW1lXCIsIHRoaXMuYWN0aW9uQXJyYXlbMF0udGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgIC8vYWR2YW5jZSB0aGUgYWN0aW9uQXJyYXlcclxuICAgICAgICAgICAgICAgIHRoaXMuX2FjdGlvbkNsZWFudXAoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQWN0aW9uIGFycmF5IHBhcnNlIGVycm9yOiBcIiArIHRoaXMuYWN0aW9uQXJyYXlbMF0udHlwZSArIFwiIHVua25vd25cIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZih0aGlzLmFjdGlvbkFycmF5Lmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAvL0dVSURFOiBwcm9jZXNzZXMgbW91c2UgYWN0aW9uc1xyXG4gICAgICAgICAgICAvL2NoZWNrIGZvciBjb2xsaXNpb25zIGJ5IGl0ZXJhdGluZyB0aHJvdWdoIGV2ZXJ5IG5vZGUgYW5kIGNvbXBhcmluZyBhZ2FpbnN0IHRoZSByZWxhdGl2ZSBtb3VzZSBwb3NpdGlvblxyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0QWNxdWlyZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgdmFyIGk7XHJcbiAgICAgICAgICAgIHZhciBhcnJheUxlbmd0aCA9IHRoaXMuZXZpZGVuY2UubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IoaSA9IDA7IGkgPCBhcnJheUxlbmd0aDsgaSsrKXtcclxuICAgICAgICAgICAgICAgIGlmKHRoaXMuZXZpZGVuY2VbaV0uZGF0YS52aXNpYmxlKXtcclxuICAgICAgICAgICAgICAgICAgICB1dGlsaXR5Lm1vdXNlSW50ZXJzZWN0KG1vdXNlU3RhdGUsIHRoaXMuZXZpZGVuY2VbaV0sIHRoaXMuZXZpZGVuY2VGcmFtZVNpemUpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vc2V0IHRoZSBtb3VzZSB0YXJnZXQgdG8gdGhlIG9iamVjdCBhbmQgYnJlYWsgaWYgY29sbGlzaW9uIGlzIGRldGVjdGVkXHJcbiAgICAgICAgICAgICAgICAgICAgaWYodGhpcy5ldmlkZW5jZVtpXS5tb3VzZU92ZXIgPT09IHRydWUpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlVGFyZ2V0ID0gdGhpcy5ldmlkZW5jZVtpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0QWNxdWlyZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy9pZiB0aGVyZSBpcyBubyBjb2xsaXNpb24sIHNldCBtb3VzZXRhcmdldCB0byAwXHJcbiAgICAgICAgICAgIGlmKHRhcmdldEFjcXVpcmVkICE9PSB0cnVlKXtcclxuICAgICAgICAgICAgICAgdGhpcy5tb3VzZVRhcmdldCA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy93aGVuIHRoZSBtb3VzZSBidXR0b24gZ29lcyBmcm9tIHVwIHRvIGRvd25cclxuICAgICAgICAgICAgaWYobW91c2VTdGF0ZS5sYXN0TW91c2VEb3duID09PSBmYWxzZSAmJiBtb3VzZVN0YXRlLm1vdXNlRG93biA9PT0gdHJ1ZSl7XHJcbiAgICAgICAgICAgICAgICAvL2lmIHRoZSBtb3VzZSBpcyBob3ZlcmluZyBvdmVyIGEgbm9kZSwgdGhhdCBub2RlIGlzIG1hcmtlZCBhcyB0aGUgb3JpZ2luIG5vZGVcclxuICAgICAgICAgICAgICAgIGlmKHRoaXMubW91c2VUYXJnZXQgIT09IDApe1xyXG4gICAgICAgICAgICAgICAgICAgdGhpcy5vcmlnaW5Ob2RlID0gdGhpcy5tb3VzZVRhcmdldDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL3doZW4gdGhlIG1vdXNlIGJ1dHRvbiBnb2VzIGZyb20gZG93biB0byB1cFxyXG4gICAgICAgICAgICBpZihtb3VzZVN0YXRlLmxhc3RNb3VzZURvd24gPT09IHRydWUgJiYgbW91c2VTdGF0ZS5tb3VzZURvd24gPT09IGZhbHNlKXtcclxuICAgICAgICAgICAgICAgIC8vaWYgdGhlIG1vdXNlIGlzIGhvdmVyaW5nIG92ZXIgYSBub2RlXHJcbiAgICAgICAgICAgICAgICBpZih0aGlzLm1vdXNlVGFyZ2V0ICE9PSAwKXtcclxuICAgICAgICAgICAgICAgICAgICAvL2lmIG9yaWdpbiBub2RlIGlzIGFzc2lnbmVkXHJcbiAgICAgICAgICAgICAgICAgICAgaWYodGhpcy5vcmlnaW5Ob2RlICE9PSAwKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9pZiB0aGUgbW91c2UgaGFzbid0IG1vdmVkIGJleW9uZCB0aGUgb3JpZ2luIG5vZGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYodGhpcy5vcmlnaW5Ob2RlID09PSB0aGlzLm1vdXNlVGFyZ2V0KXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vYWN0aXZhdGVzIGNsaWNrIG1ldGhvZCBvbiB0aGUgdGFyZ2V0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlVGFyZ2V0LmNsaWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vY2hlY2sgZm9yIGNvbm5lY3Rpb25cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2Nvbm5lY3QodGhpcy5vcmlnaW5Ob2RlLCB0aGlzLm1vdXNlVGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYodGhpcy5vcmlnaW5Ob2RlID09PSAwKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy93aGVuIHRoZSBtb3VzZSBpcyBjbGlja2VkIHdoaWxlIG5vdGhpbmcgaXMgdGFyZ2V0ZWRcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvL2F0IHRoaXMgcG9pbnQgYW55IGRyYWcgb3BlcmF0aW9uIGhhcyBlbmRlZFxyXG4gICAgICAgICAgICAgICAgdGhpcy5vcmlnaW5Ob2RlID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgLy9oYW5kbGUgYW5pbWF0aW9uIGxvY2tpbmdcclxuICAgIGlmKHRoaXMuZmFkZUFuaW1hdGlvbkxvY2sgPT09IHRydWUpe1xyXG4gICAgICAgIHZhciBjdXJyZW50VGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgLy9jaGVjayBhbmQgaW5pdGlhbGl6ZSB0aW1lciBpZiBuZWVkIGJlXHJcbiAgICAgICAgaWYodGhpcy5mYWRlQW5pbWF0aW9uTG9ja1RpbWVyID09PSAtMSl7XHJcbiAgICAgICAgICAgIHRoaXMuZmFkZUFuaW1hdGlvbkxvY2tUaW1lciA9IGN1cnJlbnRUaW1lO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChjdXJyZW50VGltZSAtIHRoaXMuZmFkZUFuaW1hdGlvbkxvY2tUaW1lciA+IDIwMCl7XHJcbiAgICAgICAgICAgIHRoaXMuZmFkZUFuaW1hdGlvbkxvY2sgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy5mYWRlQW5pbWF0aW9uTG9ja1RpbWVyID0gLTE7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICB2YXIgb3JpZ2luTm9kZVByaW50Q29udGVudCA9IDA7XHJcbiAgICBpZih0aGlzLm9yaWdpbk5vZGUgIT09IDApe1xyXG4gICAgICAgdGhpcy5vcmlnaW5Ob2RlUHJpbnRDb250ZW50ID0gdGhpcy5vcmlnaW5Ob2RlLmRhdGEubmFtZTtcclxuICAgIH1cclxufVxyXG5cclxuLy9kcmF3cyBib2FyZCwgZGlhbG9ndWUsIGFuZCB0cmFuc2l0aW9ucyBhcyBuZWNlc3NhcnlcclxuQm9hcmRQaGFzZS5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGNhbnZhc1N0YXRlLCBtb3VzZVN0YXRlKXtcclxuICAgIC8vY29udmVydCB0ZXh0dXJlcyB0byBwYXR0ZXJuc1xyXG4gICAgaWYodGhpcy5wYXR0ZXJuQ29udmVyc2lvbiA9PT0gZmFsc2Upe1xyXG4gICAgICAgIHRoaXMuYm9hcmRUZXh0dXJlUGF0dGVybiA9IGNhbnZhc1N0YXRlLmN0eC5jcmVhdGVQYXR0ZXJuKHRoaXMuYm9hcmRUZXh0dXJlLFwicmVwZWF0XCIpO1xyXG4gICAgICAgIHRoaXMueWFyblRleHR1cmVQYXR0ZXJuID0gY2FudmFzU3RhdGUuY3R4LmNyZWF0ZVBhdHRlcm4odGhpcy55YXJuVGV4dHVyZSxcInJlcGVhdFwiKTtcclxuICAgICAgICB0aGlzLnBhdHRlcm5Db252ZXJzaW9uID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgaWYodGhpcy5tb2RlID09PSBcImJvYXJkXCIpe1xyXG4gICAgICAgIHRoaXMuX2RyYXdCb2FyZChjYW52YXNTdGF0ZSwgbW91c2VTdGF0ZSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmKHRoaXMubW9kZSA9PT0gXCJkaWFsb2d1ZVwiKXtcclxuICAgICAgICB0aGlzLl9kcmF3RGlhbG9ndWUoY2FudmFzU3RhdGUpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZih0aGlzLm1vZGUgPT09IFwic3dpdGNoXCIpe1xyXG4gICAgICAgICAgICAgIFxyXG4gICAgfVxyXG59XHJcblxyXG5Cb2FyZFBoYXNlLnByb3RvdHlwZS5fZHJhd0RpYWxvZ3VlID0gZnVuY3Rpb24oY2FudmFzU3RhdGUpe1xyXG4gICAgY2FudmFzU3RhdGUuY3R4LnNhdmUoKTtcclxuICAgIGNhbnZhc1N0YXRlLmN0eC50cmFuc2xhdGUoY2FudmFzU3RhdGUuY2VudGVyLngsIGNhbnZhc1N0YXRlLmNlbnRlci55KTtcclxuICAgIFxyXG4gICAgdGhpcy5hY3RpdmVEaWFsb2d1ZS5kcmF3KGNhbnZhc1N0YXRlKTtcclxuICAgIGNhbnZhc1N0YXRlLmN0eC5yZXN0b3JlKCk7XHJcbn1cclxuLy9kcmF3IGNhbGxzIHRvIHRoYXQgbWFrZSB0aGUgY29uc3BpcmFjeSBib2FyZCBhcHBlYXJcclxuQm9hcmRQaGFzZS5wcm90b3R5cGUuX2RyYXdCb2FyZCA9IGZ1bmN0aW9uKGNhbnZhc1N0YXRlLCBtb3VzZVN0YXRlKXtcclxuICAgIC8vZHJhdyBiYWNrZHJvcCBlbGVtZW50c1xyXG4gICAgY2FudmFzU3RhdGUuY3R4LnNhdmUoKTtcclxuICAgIC8vd2lwZSB0aGUgY2FudmFzIHRvIHN0YXJ0IGEgbmV3IGZyYW1lXHJcbiAgICBwYWludGVyLmNsZWFyKGNhbnZhc1N0YXRlLmN0eCwgMCwgMCwgY2FudmFzU3RhdGUud2lkdGgsIGNhbnZhc1N0YXRlLmhlaWdodCk7XHJcbiAgICAvL3NwZWNpZnkgYW5kIGRyYXcgYSByZWN0YW5nbGUgdXNpbmcgdGhlIHBhdHRlcm5cclxuICAgIGNhbnZhc1N0YXRlLmN0eC5yZWN0KDAsMCxjYW52YXNTdGF0ZS53aWR0aCxjYW52YXNTdGF0ZS5oZWlnaHQpO1xyXG4gICAgY2FudmFzU3RhdGUuY3R4LmZpbGxTdHlsZSA9IHRoaXMuYm9hcmRUZXh0dXJlUGF0dGVybjtcclxuICAgIGNhbnZhc1N0YXRlLmN0eC5maWxsKCk7XHJcbiAgICBjYW52YXNTdGF0ZS5jdHgucmVzdG9yZSgpO1xyXG4gICAgXHJcbiAgICAvL2RyYXcgZXZlcnl0aGluZyB0aGF0IGdvZXMgb24gdGhlIGJvYXJkXHJcbiAgICBjYW52YXNTdGF0ZS5jdHguc2F2ZSgpO1xyXG4gICAgLy9tYWtlIHRoZSByZWxhdGl2ZSBjZW50ZXIgMCwwIGluIHRoZSBjb29yZGluYXRlIGdyaWRcclxuICAgIGNhbnZhc1N0YXRlLmN0eC50cmFuc2xhdGUoY2FudmFzU3RhdGUucmVsYXRpdmVDZW50ZXIueCwgY2FudmFzU3RhdGUucmVsYXRpdmVDZW50ZXIueSk7XHJcbiAgICBcclxuICAgIC8vZ28gdGhyb3VnaCB0aGUgZXZpZGVuY2UgYXJyYXkgb25lIGJ5IG9uZSBhbmQgZHJhdyBub2Rlc1xyXG4gICAgdmFyIGk7XHJcbiAgICB2YXIgYXJyYXlMZW5ndGggPSB0aGlzLmV2aWRlbmNlLmxlbmd0aDtcclxuICAgIGZvcihpID0gMDsgaSA8IGFycmF5TGVuZ3RoOyBpKyspe1xyXG4gICAgICAgIGlmKHRoaXMuZXZpZGVuY2VbaV0uZGF0YS52aXNpYmxlKXtcclxuICAgICAgICAgICAgdGhpcy5ldmlkZW5jZVtpXS5kcmF3KGNhbnZhc1N0YXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy9kcmF3IHRoZSBjb25uZWN0aW5nIGxpbmVzXHJcbiAgICB2YXIgaTtcclxuICAgIHZhciBhcnJheUxlbmd0aCA9IHRoaXMuZXZpZGVuY2UubGVuZ3RoO1xyXG4gICAgZm9yKGkgPSAwOyBpIDwgYXJyYXlMZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgaWYodGhpcy5ldmlkZW5jZVtpXS5kYXRhLnZpc2libGUpe1xyXG4gICAgICAgICAgICAvL2RyYXcgY29ubmVjdGlvbiBsaW5lcyBiZXR3ZWVuIGV2aWRlbmNlIGlmIHRoZXkgZXhpc3RcclxuICAgICAgICAgICAgaWYodGhpcy5ldmlkZW5jZVtpXS5kYXRhLnByZXZpb3VzLmxlbmd0aCA9PT0gMSl7XHJcbiAgICAgICAgICAgICAgICBwYWludGVyLmxpbmUoXHJcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzU3RhdGUuY3R4LFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXZpZGVuY2VbdGhpcy5ldmlkZW5jZVtpXS5kYXRhLnByZXZpb3VzWzBdXS5wb3NpdGlvbi54LFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXZpZGVuY2VbdGhpcy5ldmlkZW5jZVtpXS5kYXRhLnByZXZpb3VzWzBdXS5wb3NpdGlvbi55IC0gdGhpcy5ldmlkZW5jZUZyYW1lU2l6ZS8yLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXZpZGVuY2VbaV0ucG9zaXRpb24ueCxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmV2aWRlbmNlW2ldLnBvc2l0aW9uLnkgLSB0aGlzLmV2aWRlbmNlRnJhbWVTaXplLzIsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ldmlkZW5jZUZyYW1lU2l6ZS8yMCxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnlhcm5UZXh0dXJlUGF0dGVyblxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmKHRoaXMuZXZpZGVuY2VbaV0uZGF0YS5wcmV2aW91cy5sZW5ndGggPT09IDIpe1xyXG4gICAgICAgICAgICAgICAgdmFyIGp1bmN0aW9uID0gbmV3IFBvaW50KFxyXG4gICAgICAgICAgICAgICAgICAgICh0aGlzLmV2aWRlbmNlW3RoaXMuZXZpZGVuY2VbaV0uZGF0YS5wcmV2aW91c1swXV0ucG9zaXRpb24ueCArIHRoaXMuZXZpZGVuY2VbdGhpcy5ldmlkZW5jZVtpXS5kYXRhLnByZXZpb3VzWzFdXS5wb3NpdGlvbi54KS8yLFxyXG4gICAgICAgICAgICAgICAgICAgICh0aGlzLmV2aWRlbmNlW3RoaXMuZXZpZGVuY2VbaV0uZGF0YS5wcmV2aW91c1swXV0ucG9zaXRpb24ueSAtIHRoaXMuZXZpZGVuY2VGcmFtZVNpemUvMiArIHRoaXMuZXZpZGVuY2VbdGhpcy5ldmlkZW5jZVtpXS5kYXRhLnByZXZpb3VzWzFdXS5wb3NpdGlvbi55IC0gdGhpcy5ldmlkZW5jZUZyYW1lU2l6ZS8yKS8yKTtcclxuICAgICAgICAgICAgICAgIHBhaW50ZXIubGluZShcclxuICAgICAgICAgICAgICAgICAgICBjYW52YXNTdGF0ZS5jdHgsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ldmlkZW5jZVt0aGlzLmV2aWRlbmNlW2ldLmRhdGEucHJldmlvdXNbMF1dLnBvc2l0aW9uLngsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ldmlkZW5jZVt0aGlzLmV2aWRlbmNlW2ldLmRhdGEucHJldmlvdXNbMF1dLnBvc2l0aW9uLnkgLSB0aGlzLmV2aWRlbmNlRnJhbWVTaXplLzIsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ldmlkZW5jZVt0aGlzLmV2aWRlbmNlW2ldLmRhdGEucHJldmlvdXNbMV1dLnBvc2l0aW9uLngsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ldmlkZW5jZVt0aGlzLmV2aWRlbmNlW2ldLmRhdGEucHJldmlvdXNbMV1dLnBvc2l0aW9uLnkgLSB0aGlzLmV2aWRlbmNlRnJhbWVTaXplLzIsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ldmlkZW5jZUZyYW1lU2l6ZS8yMCxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnlhcm5UZXh0dXJlUGF0dGVyblxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIHBhaW50ZXIubGluZShcclxuICAgICAgICAgICAgICAgICAgICBjYW52YXNTdGF0ZS5jdHgsXHJcbiAgICAgICAgICAgICAgICAgICAganVuY3Rpb24ueCxcclxuICAgICAgICAgICAgICAgICAgICBqdW5jdGlvbi55LFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXZpZGVuY2VbaV0ucG9zaXRpb24ueCxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmV2aWRlbmNlW2ldLnBvc2l0aW9uLnkgLSB0aGlzLmV2aWRlbmNlRnJhbWVTaXplLzIsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ldmlkZW5jZUZyYW1lU2l6ZS8yMCxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnlhcm5UZXh0dXJlUGF0dGVyblxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvL2RyYXcgcHVzaHBpbnNcclxuICAgIHZhciBpO1xyXG4gICAgdmFyIGFycmF5TGVuZ3RoID0gdGhpcy5ldmlkZW5jZS5sZW5ndGg7XHJcbiAgICBmb3IoaSA9IDA7IGkgPCBhcnJheUxlbmd0aDsgaSsrKXtcclxuICAgICAgICBpZih0aGlzLmV2aWRlbmNlW2ldLmRhdGEudmlzaWJsZSl7XHJcbiAgICAgICAgICAgIGlmKHRoaXMuZXZpZGVuY2VbaV0uZGF0YS5yZXZlbGF0aW9uICE9PSAwKXtcclxuICAgICAgICAgICAgICAgIHBhaW50ZXIucHVzaHBpbihcclxuICAgICAgICAgICAgICAgICAgICBjYW52YXNTdGF0ZS5jdHgsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ldmlkZW5jZVtpXS5wb3NpdGlvbi54LFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXZpZGVuY2VbaV0ucG9zaXRpb24ueSAtIHRoaXMuZXZpZGVuY2VGcmFtZVNpemUvMixcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmV2aWRlbmNlRnJhbWVTaXplLFxyXG4gICAgICAgICAgICAgICAgICAgIDFcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICAgIHBhaW50ZXIucHVzaHBpbihcclxuICAgICAgICAgICAgICAgICAgICBjYW52YXNTdGF0ZS5jdHgsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ldmlkZW5jZVtpXS5wb3NpdGlvbi54LFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXZpZGVuY2VbaV0ucG9zaXRpb24ueSAtIHRoaXMuZXZpZGVuY2VGcmFtZVNpemUvMixcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmV2aWRlbmNlRnJhbWVTaXplLFxyXG4gICAgICAgICAgICAgICAgICAgIDBcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvKnJlbW92ZWQgYmVjYXVzZSBJIHdhcyBpbmZvcm1lZCB0aGF0IGl0IGRvZXMgbm90IGZpdCB0aGUgYWVzdGhldGljXHJcbiAgICBjYW52YXNTdGF0ZS5jdHguc2F2ZSgpO1xyXG4gICAgY2FudmFzU3RhdGUuY3R4LnN0cm9rZVN0eWxlID0gXCJ3aGl0ZVwiO1xyXG4gICAgY2FudmFzU3RhdGUuY3R4LmZpbGxTdHlsZSA9IFwiYmxhY2tcIjtcclxuICAgIGNhbnZhc1N0YXRlLmN0eC5saW5lV2lkdGggPSB0aGlzLmV2aWRlbmNlRnJhbWVTaXplLzMwO1xyXG4gICAgXHJcbiAgICBcclxuICAgIC8vZHJhdyBldmlkZW5jZSBsYWJlbHNcclxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmV2aWRlbmNlLmxlbmd0aDsgaSsrKXtcclxuICAgICAgICBpZih0aGlzLmV2aWRlbmNlW2ldLmRhdGEudmlzaWJsZSl7XHJcbiAgICAgICAgICAgIC8vYWNjb21wYW55aW5nIHRleHRcclxuICAgICAgICAgICAgY2FudmFzU3RhdGUuY3R4LmZvbnQgPSAodGhpcy5ldmlkZW5jZUZyYW1lU2l6ZS82KSArIFwicHggQXJpYWxcIjtcclxuICAgICAgICAgICAgY2FudmFzU3RhdGUuY3R4LnRleHRCYXNlbGluZSA9IFwiaGFuZ2luZ1wiO1xyXG4gICAgICAgICAgICBjYW52YXNTdGF0ZS5jdHgudGV4dEFsaWduID0gXCJjZW50ZXJcIjtcclxuICAgICAgICAgICAgY2FudmFzU3RhdGUuY3R4LnN0cm9rZVRleHQodGhpcy5ldmlkZW5jZVtpXS5kYXRhLm5hbWUsIHRoaXMuZXZpZGVuY2VbaV0ucG9zaXRpb24ueCwgdGhpcy5ldmlkZW5jZVtpXS5wb3NpdGlvbi55ICsgdGhpcy5ldmlkZW5jZUZyYW1lU2l6ZSAvIDIpO1xyXG4gICAgICAgICAgICBjYW52YXNTdGF0ZS5jdHguZmlsbFRleHQodGhpcy5ldmlkZW5jZVtpXS5kYXRhLm5hbWUsIHRoaXMuZXZpZGVuY2VbaV0ucG9zaXRpb24ueCwgdGhpcy5ldmlkZW5jZVtpXS5wb3NpdGlvbi55ICsgdGhpcy5ldmlkZW5jZUZyYW1lU2l6ZSAvIDIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGNhbnZhc1N0YXRlLmN0eC5yZXN0b3JlKCk7Ki9cclxuICAgIFxyXG4gICAgLy9kcmF3IHBvc3RpdCBub3Rlc1xyXG4gICAgdmFyIHBvc3RJdFNpemUgPSB0aGlzLmV2aWRlbmNlRnJhbWVTaXplKi4zNTtcclxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmV2aWRlbmNlLmxlbmd0aDsgaSsrKXtcclxuICAgICAgICBpZih0aGlzLmV2aWRlbmNlW2ldLmRhdGEuYW5hbHl6ZWQgJiYgdGhpcy5ldmlkZW5jZVtpXS5kYXRhLnZpc2libGUpe1xyXG4gICAgICAgICAgICBwYWludGVyLnJlY3QoY2FudmFzU3RhdGUuY3R4LCB0aGlzLmV2aWRlbmNlW2ldLnBvc2l0aW9uLnggKyB0aGlzLmV2aWRlbmNlRnJhbWVTaXplLzIgLSAyKnBvc3RJdFNpemUvMywgdGhpcy5ldmlkZW5jZVtpXS5wb3NpdGlvbi55IC0gdGhpcy5ldmlkZW5jZUZyYW1lU2l6ZS8yIC0gcG9zdEl0U2l6ZS8yLCBwb3N0SXRTaXplLCBwb3N0SXRTaXplLCBcIiNmZmZmYTVcIiwgXCJsaWdodGdyYXlcIiwgMik7XHJcbiAgICAgICAgICAgIGNhbnZhc1N0YXRlLmN0eC5mb250ID0gKHRoaXMuZXZpZGVuY2VGcmFtZVNpemUvMykgKyBcInB4IEFyaWFsXCI7XHJcbiAgICAgICAgICAgIGNhbnZhc1N0YXRlLmN0eC5maWxsU3R5bGUgPSBcImdyZWVuXCI7XHJcbiAgICAgICAgICAgIGNhbnZhc1N0YXRlLmN0eC5maWxsVGV4dChcIuKclFwiLCB0aGlzLmV2aWRlbmNlW2ldLnBvc2l0aW9uLnggKyB0aGlzLmV2aWRlbmNlRnJhbWVTaXplLzIgLSBwb3N0SXRTaXplLzIsIHRoaXMuZXZpZGVuY2VbaV0ucG9zaXRpb24ueSAtIHRoaXMuZXZpZGVuY2VGcmFtZVNpemUqLjM4KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vZHJhdyB0aGUgbGluZSBjb25uZWN0aW5nIG9yaWdpbiBub2RlIHRvIHRoZSBtb3VzZSBwb3NpdGlvblxyXG4gICAgaWYodGhpcy5vcmlnaW5Ob2RlICE9PSAwKXtcclxuICAgICAgICBwYWludGVyLmxpbmUoY2FudmFzU3RhdGUuY3R4LCB0aGlzLm9yaWdpbk5vZGUucG9zaXRpb24ueCwgdGhpcy5vcmlnaW5Ob2RlLnBvc2l0aW9uLnksIG1vdXNlU3RhdGUucmVsYXRpdmVQb3NpdGlvbi54LCBtb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueSwgdGhpcy5ldmlkZW5jZUZyYW1lU2l6ZS8yMCwgXCJkb2RnZXJibHVlXCIpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpZih0aGlzLm1vdXNlVGFyZ2V0ICE9PSAwKXtcclxuICAgICAgICBjYW52YXNTdGF0ZS5jdHguZm9udCA9ICh0aGlzLmV2aWRlbmNlRnJhbWVTaXplLzQpICsgXCJweCBBcmlhbFwiO1xyXG4gICAgICAgIGNhbnZhc1N0YXRlLmN0eC50ZXh0QmFzZWxpbmUgPSBcImhhbmdpbmdcIjtcclxuICAgICAgICBjYW52YXNTdGF0ZS5jdHgudGV4dEFsaWduID0gXCJjZW50ZXJcIjtcclxuICAgICAgICBjYW52YXNTdGF0ZS5jdHguZmlsbFN0eWxlID0gXCJ3aGl0ZVwiO1xyXG4gICAgICAgIGNhbnZhc1N0YXRlLmN0eC5saW5lV2lkdGggPSB0aGlzLmV2aWRlbmNlRnJhbWVTaXplLzMwO1xyXG4gICAgICAgIGNhbnZhc1N0YXRlLmN0eC5zdHJva2VUZXh0KHRoaXMubW91c2VUYXJnZXQuZGF0YS5uYW1lLCBtb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueCwgbW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnkgKyB0aGlzLmV2aWRlbmNlRnJhbWVTaXplIC8gMyk7XHJcbiAgICAgICAgY2FudmFzU3RhdGUuY3R4LmZpbGxUZXh0KHRoaXMubW91c2VUYXJnZXQuZGF0YS5uYW1lLCBtb3VzZVN0YXRlLnJlbGF0aXZlUG9zaXRpb24ueCwgbW91c2VTdGF0ZS5yZWxhdGl2ZVBvc2l0aW9uLnkgKyB0aGlzLmV2aWRlbmNlRnJhbWVTaXplIC8gMyk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGNhbnZhc1N0YXRlLmN0eC5yZXN0b3JlKCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQm9hcmRQaGFzZTsiLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIERyYXdMaWIgPSByZXF1aXJlKCcuLi9saWJyYXJpZXMvRHJhd2xpYi5qcycpO1xyXG52YXIgVXRpbGl0aWVzID0gcmVxdWlyZSgnLi4vbGlicmFyaWVzL1V0aWxpdGllcy5qcycpO1xyXG52YXIgU2NlbmUgPSByZXF1aXJlKCcuL1NjZW5lLmpzJyk7XHJcbnZhciBBY3RvciA9IHJlcXVpcmUoJy4vQWN0b3IuanMnKTtcclxudmFyIFByb3AgPSByZXF1aXJlKCcuL1Byb3AuanMnKTtcclxuXHJcbnZhciBwYWludGVyO1xyXG52YXIgdXRpbGl0eTtcclxuXHJcbnZhciBkaWFsb2d1ZUxheWVyO1xyXG52YXIgZGlhbG9ndWVUZXh0O1xyXG52YXIgZGlhbG9ndWVTcGVha2VyO1xyXG52YXIgZGlhbG9ndWVGcmFtZTtcclxuXHJcbi8vcGFyYW1ldGVyIGlzIGEgcG9pbnQgdGhhdCBkZW5vdGVzIHN0YXJ0aW5nIHBvc2l0aW9uXHJcbmZ1bmN0aW9uIERpYWxvZ3VlKHRhcmdldCl7ICAgXHJcbiAgICAvL2luc3RhbnRpYXRlIGxpYnJhcmllc1xyXG4gICAgcGFpbnRlciA9IG5ldyBEcmF3TGliKCk7XHJcbiAgICB1dGlsaXR5ID0gbmV3IFV0aWxpdGllcygpO1xyXG4gICAgXHJcbiAgICAvL0pTT046IGNvbXBsZXRlIGRpYWxvZ3VlIGZpbGUgbG9hZGVkIGludG8gSlNPTiB2YXJpYWJsZVxyXG4gICAgdGhpcy5kYXRhO1xyXG4gICAgLy9ib29sOiB3aGV0aGVyIHRoZSBKU09OIGRhdGEgaGFzIGJlZW4gZnVsbHkgbG9hZGVkXHJcbiAgICB0aGlzLmRhdGFMb2FkZWQgPSBmYWxzZTtcclxuICAgIC8vbnVtYmVyOiBzdGVwIGNvdW50IGluZGV4IG9mIHByb2dyZXNzIHRocm91Z2ggdGhlIGRpYWxvZ3VlXHJcbiAgICB0aGlzLmRpYWxvZ3VlUHJvZ3Jlc3MgPSAtMTtcclxuICAgIC8vYm9vbDogd2hldGhlciB0aGUgY3VycmVudCBzdGVwIGhhcyBydW4gdG8gY29tcGxldGlvblxyXG4gICAgdGhpcy5jdXJyZW50U3RlcENvbXBsZXRlID0gZmFsc2U7XHJcbiAgICAvL251bWJlcjogYXJiaXRyYXkgcHJvZ3Jlc3MgdGhyb3VnaCBzdGVwIGFjdGlvblxyXG4gICAgdGhpcy5jdXJyZW50U3RlcFByb2dyZXNzID0gMDtcclxuICAgIC8vYm9vbDogd2hldGhlciB0aGUgZGlhbG9ndWUgaGFzIHBsYXllZCB0aHJvdWdoIHRvIGl0cyBjb25jbHVzaW9uXHJcbiAgICB0aGlzLmNvbXBsZXRlID0gZmFsc2U7XHJcbiAgICAvL2FycmF5PHNjZW5lPjogY29udGFpbnMgYWxsIG9mIHRoZSBzY2VuZSBvYmplY3RzXHJcbiAgICB0aGlzLnNjZW5lcyA9IFtdO1xyXG4gICAgLy9ib29sOiB3aGV0aGVyIGFsbCB0aGUgc2NlbmUgYXNzZXRzIGhhdmUgZnVsbHkgbG9hZGVkXHJcbiAgICB0aGlzLnNjZW5lc0xvYWRlZCA9IGZhbHNlO1xyXG4gICAgLy9hcnJheTxhY3Rvcj46IGNvbnRhaW5zIGFsbCBvZiB0aGUgYWN0b3Igb2JqZWN0c1xyXG4gICAgdGhpcy5hY3RvcnMgPSBbXTtcclxuICAgIC8vYm9vbDogd2hldGhlciBhbGwgYWN0b3Igb2JqZWN0cyBoYXZlIGxvYWRlZFxyXG4gICAgdGhpcy5hY3RvcnNMb2FkZWQgPSBmYWxzZTtcclxuICAgIC8vYm9vbDogd2hldGhlciBhbGwgaW1hZ2UgYXNzZXRzIGhhdmUgbG9hZGVkXHJcbiAgICB0aGlzLmFsbExvYWRlZCA9IGZhbHNlO1xyXG4gICAgLy9udW1iZXI6IGluZGV4IG9mIHRoZSBjdXJyZW50bHkgdXNlZCBzY2VuZVxyXG4gICAgdGhpcy5hY3RpdmVTY2VuZUluZGV4ID0gMDtcclxuICAgIC8vc3RyaW5nOiBkZW5vdGVzIGxvY2F0aW9uIG9mIHRoZSBkaWFsb2d1ZVxyXG4gICAgdGhpcy5sb2NhdGlvblRleHQgPSBcIlwiO1xyXG4gICAgLy9ib29sOiB0byBwcmV2ZW50IGFjdCBmcm9tIGZpcmluZyBiZWZvcmUgbG9hZCBjYW4gb2NjdXIsIGl0IGlzIGJsb2NrZWQgdW50aWwgbG9hZGluZyBiZWdpbnNcclxuICAgIHRoaXMuYWN0UmVhZHkgPSBmYWxzZTtcclxuICAgIC8vYXJyYXk8cHJvcD46IGNvbnRhaW5zIGFsbCBwcm9wIG9iamVjdHNcclxuICAgIHRoaXMucHJvcHMgPSBbXTtcclxuICAgIC8vYm9vbDogd2hldGhlciBvciBub3QgcHJvcHMgaGF2ZSBsb2FkZWRcclxuICAgIHRoaXMucHJvcHNMb2FkZWQgPSBmYWxzZTtcclxuICAgIC8vbnVtYmVyOiB0aGUgaW5kZXggb2YgdGhlIGFjdGl2ZSBwcm9wLiAtMSBpZiBub3RoaW5nXHJcbiAgICB0aGlzLmFjdGl2ZVByb3AgPSAtMTtcclxuICAgIC8vYm9vbDogd2hldGhlciBvciBub3QgcHJvZ3Jlc3Npb24gaXMgbG9ja2VkIGJ5IGEgZmFkZSBhbmltYXRpb25cclxuICAgIHRoaXMuZmFkZUFuaW1hdGlvbkxvY2sgPSBmYWxzZTtcclxuICAgIC8vbnVtYmVyOiBkdXJhdGlvbiBvZiB0aW1lIGluIG1pbGxpc2Vjb25kcyBzaW5jZSBhIGZhZGUgYW5pbWF0aW9uIGxvY2sgd2FzIHB1dCBpbiBwbGFjZVxyXG4gICAgdGhpcy5mYWRlQW5pbWF0aW9uTG9ja1RpbWVyID0gLTE7XHJcbiAgICBcclxuICAgIGRpYWxvZ3VlTGF5ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRpYWxvZ3VlTGF5ZXJcIik7XHJcbiAgICBkaWFsb2d1ZVRleHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRpYWxvZ3VlVGV4dFwiKTtcclxuICAgIGRpYWxvZ3VlU3BlYWtlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGlhbG9ndWVTcGVha2VyXCIpO1xyXG4gICAgZGlhbG9ndWVGcmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGlhbG9ndWVGcmFtZVwiKTtcclxuICAgIFxyXG4gICAgLy9zdG9yZSB0aGUgc2NvcGUgb2YgdGhlIHRpY2sgZXZlbnQgc28gdGhhdCBpdCBjYW4gYmUgcmVtb3ZlZCBwcm9wZXJseSBsYXRlclxyXG4gICAgdGhpcy50aWNrU2NvcGUgPSB0aGlzLnRpY2suYmluZCh0aGlzKTtcclxuICAgIGRpYWxvZ3VlTGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnRpY2tTY29wZSwgZmFsc2UpO1xyXG4gICAgLy9tYWtlIHRoZSBkaWFsb2d1ZSBsYXllciB2aXNpYmxlXHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRpYWxvZ3VlTGF5ZXJcIikuY2xhc3NOYW1lID0gXCJcIjtcclxuICAgIFxyXG4gICAgLy90ZWxscyB0aGUgZnVuY3Rpb24gd2hlcmUgdGhlIGRhdGEgaXMgYW5kIHBhc3NlcyBhIGNhbGxiYWNrIHRoYXQgY2FuIGJlIHVzZWQgd2l0aCBsb2FkaW5nXHJcbiAgICBjb25zb2xlLmxvZyhcIkxvYWRpbmcgRGlhbG9ndWU6IFwiICsgdGFyZ2V0KTtcclxuICAgIHV0aWxpdHkubG9hZEpTT04oXCIuL2NvbnRlbnQvZGlhbG9ndWUvXCIgKyB0YXJnZXQsIF9kYXRhTG9hZGVkQ2FsbGJhY2suYmluZCh0aGlzKSk7XHJcbn1cclxuXHJcbi8vbG9hZCBKU09OIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGRpYWxvZ3VlIHNlcXVlbmNlXHJcbmZ1bmN0aW9uIF9kYXRhTG9hZGVkQ2FsbGJhY2socmVzcG9uc2Upe1xyXG4gICAgdGhpcy5kYXRhID0gSlNPTi5wYXJzZShyZXNwb25zZSk7XHJcbiAgICBcclxuICAgIHRoaXMuZGF0YUxvYWRlZCA9IHRydWU7XHJcbiAgICBcclxuICAgIHRoaXMubG9jYXRpb25UZXh0ID0gdGhpcy5kYXRhLmxvY2F0aW9uO1xyXG4gICAgXHJcbiAgICAvL25vdyB0aGF0IHRoZSBkYXRhc2V0IGlzIGxvYWRlZCwgdGhlIGltYWdlIHVyaXMgY2FuIGJlIGxvYWRlZFxyXG4gICAgdGhpcy5fbG9hZEltYWdlcygpO1xyXG4gICAgdGhpcy5hY3RSZWFkeSA9IHRydWU7XHJcbn1cclxuXHJcbi8vY2FsbGVkIGR1cmluZyBpbml0aWFsIGxvYWRcclxuLy9zZXQgdXAgbG9hZCBjYWxscyBmb3IgZWFjaCBvZiB0aGUgaW1hZ2VzIHVzZWQgaW4gdGhpcyBkaWFsb2d1ZVxyXG5EaWFsb2d1ZS5wcm90b3R5cGUuX2xvYWRJbWFnZXMgPSBmdW5jdGlvbigpe1xyXG4gICAgLy9mb3IgZXZlcnkgYWN0b3JcclxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmRhdGEuYWN0b3JzLmxlbmd0aDsgaSsrKXtcclxuICAgICAgICAvL3B1c2ggYSBuZXcgYWN0b3Igb2JqZWN0XHJcbiAgICAgICAgdGhpcy5hY3RvcnMucHVzaChuZXcgQWN0b3IodGhpcy5kYXRhLmFjdG9yc1tpXS5uYW1lKSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vZm9yIGV2ZXJ5IHNjZW5lLi4uXHJcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5kYXRhLnNjZW5lcy5sZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgLy9wdXNoIGEgbmV3IHNjZW5lIG9iamVjdC4gTG9hZGluZyB3aWxsIGJlIGhhbmRsZWQgaW50ZXJuYWxseVxyXG4gICAgICAgIHRoaXMuc2NlbmVzLnB1c2gobmV3IFNjZW5lKFwiY29udGVudC9zY2VuZS9cIiArIHRoaXMuZGF0YS5zY2VuZXNbaV0uYmFja2Ryb3ApKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy9mb3IgZXZlcnkgcHJvcFxyXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMuZGF0YS5wcm9wcy5sZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgLy9wdXNoIGEgbmV3IHByb3AgYXNzZXRcclxuICAgICAgICB0aGlzLnByb3BzLnB1c2gobmV3IFByb3AodGhpcy5kYXRhLnByb3BzW2ldLnByb3ApKTtcclxuICAgIH1cclxufVxyXG5cclxuLy9oYW5kbGUgdGhlIGRpZmZlcmVudCB0eXBlcyBvZiBkaWFsb2d1ZSBhY2NvcmRpbmdseVxyXG5EaWFsb2d1ZS5wcm90b3R5cGUuX3Byb2Nlc3NEaWFsb2d1ZSA9IGZ1bmN0aW9uKCl7XHJcbiAgICAvL2RpYWxvZ3VlOiB0ZXh0IHRoYXQgYSBjaGFyYWN0ZXIgc2F5cywgc2V0cyB0byBkaWFsb2d1ZSBib3hcclxuICAgIGlmKHRoaXMuZGF0YS5kaWFsb2d1ZVt0aGlzLmRpYWxvZ3VlUHJvZ3Jlc3NdLnR5cGUgPT09IFwiZGlhbG9ndWVcIil7XHJcbiAgICAgICAgZGlhbG9ndWVGcmFtZS5jbGFzc05hbWUgPSBcIlwiO1xyXG4gICAgICAgIGRpYWxvZ3VlU3BlYWtlci5pbm5lckhUTUwgPSB0aGlzLmRhdGEuYWN0b3JzW3RoaXMuZGF0YS5kaWFsb2d1ZVt0aGlzLmRpYWxvZ3VlUHJvZ3Jlc3NdLnNwZWFrZXJdLm5hbWU7XHJcbiAgICAgICAgZGlhbG9ndWVUZXh0LmlubmVySFRNTCA9IHRoaXMuZGF0YS5kaWFsb2d1ZVt0aGlzLmRpYWxvZ3VlUHJvZ3Jlc3NdLnN0YXRlbWVudDtcclxuICAgICAgICBcclxuICAgICAgICAvL2xvb3AgdGhyb3VnaCBhY3RvcnMgYW5kIHNldCB0aGUgZm9jdXMgZm9yIGVhY2hcclxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5hY3RvcnMubGVuZ3RoOyBpKyspe1xyXG4gICAgICAgICAgICBpZih0aGlzLmRhdGEuZGlhbG9ndWVbdGhpcy5kaWFsb2d1ZVByb2dyZXNzXS5zcGVha2VyID09PSBpKXtcclxuICAgICAgICAgICAgICAgIC8vc2V0IGZvY3VzIHRvIHRydWVcclxuICAgICAgICAgICAgICAgIHRoaXMuYWN0b3JzW2ldLmZvY3VzID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSBlbHNle1xyXG4gICAgICAgICAgICAgICAgLy9zZXQgZm9jdXMgdG8gZmFsc2UgICBcclxuICAgICAgICAgICAgICAgIHRoaXMuYWN0b3JzW2ldLmZvY3VzID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9IGVsc2UgaWYodGhpcy5kYXRhLmRpYWxvZ3VlW3RoaXMuZGlhbG9ndWVQcm9ncmVzc10udHlwZSA9PT0gXCJ0cmFuc2l0aW9uXCIpe1xyXG4gICAgICAgIC8vZGlhbG9ndWVTcGVha2VyLmlubmVySFRNTCA9IFwiXCI7XHJcbiAgICAgICAgLy9kaWFsb2d1ZVRleHQuaW5uZXJIVE1MID0gXCJcIjtcclxuICAgICAgICBkaWFsb2d1ZUZyYW1lLmNsYXNzTmFtZSA9IFwiaGlkZGVuTGF5ZXJcIjtcclxuICAgICAgICBcclxuICAgICAgICAvL21lYXN1cmVkIGZhZGUgdG8gYmxhY2tcclxuICAgICAgICB0aGlzLmZhZGVBbmltYXRpb25Mb2NrID0gdHJ1ZTtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZhZGVCbGluZGVyXCIpLmNsYXNzTmFtZSA9IFwiXCI7XHJcbiAgICB9XHJcbiAgICAvL2l0ZXJhdGUgdGhyb3VnaCBlYWNoIGFjdGlvbiBhcHBseVxyXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMuZGF0YS5kaWFsb2d1ZVt0aGlzLmRpYWxvZ3VlUHJvZ3Jlc3NdLmFjdGlvbi5sZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgLy9jaGFuZ2UgdGhlIHByb3BlcnRpZXMgb2Ygb25lIG9mIHRoZSBzY2VuZSdzIGFjdG9yc1xyXG4gICAgICAgIGlmKHRoaXMuZGF0YS5kaWFsb2d1ZVt0aGlzLmRpYWxvZ3VlUHJvZ3Jlc3NdLmFjdGlvbltpXS50eXBlID09PSBcImFjdG9yQWN0aW9uXCIpe1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5hY3RvcnNbdGhpcy5kYXRhLmRpYWxvZ3VlW3RoaXMuZGlhbG9ndWVQcm9ncmVzc10uYWN0aW9uW2ldLnRhcmdldF0udXBkYXRlKFxyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhLmRpYWxvZ3VlW3RoaXMuZGlhbG9ndWVQcm9ncmVzc10uYWN0aW9uW2ldLmV4cHJlc3Npb24sXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGEuZGlhbG9ndWVbdGhpcy5kaWFsb2d1ZVByb2dyZXNzXS5hY3Rpb25baV0uYWN0aXZlLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhLmRpYWxvZ3VlW3RoaXMuZGlhbG9ndWVQcm9ncmVzc10uYWN0aW9uW2ldLnBvc2l0aW9uXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSBlbHNlIGlmKHRoaXMuZGF0YS5kaWFsb2d1ZVt0aGlzLmRpYWxvZ3VlUHJvZ3Jlc3NdLmFjdGlvbltpXS50eXBlID09PSBcImxvY2F0aW9uTWFya2VyXCIpeyAvL2NoYW5nZSB0aGUgbG9jYXRpb24gbWFya2VyIHRleHRcclxuICAgICAgICAgICAgdGhpcy5sb2NhdGlvblRleHQgPSB0aGlzLmRhdGEuZGlhbG9ndWVbdGhpcy5kaWFsb2d1ZVByb2dyZXNzXS5hY3Rpb25baV0udGV4dDtcclxuICAgICAgICB9IGVsc2UgaWYodGhpcy5kYXRhLmRpYWxvZ3VlW3RoaXMuZGlhbG9ndWVQcm9ncmVzc10uYWN0aW9uW2ldLnR5cGUgPT09IFwicHJvcEFjdGlvblwiKXtcclxuICAgICAgICAgICAgdGhpcy5hY3RpdmVQcm9wID0gdGhpcy5kYXRhLmRpYWxvZ3VlW3RoaXMuZGlhbG9ndWVQcm9ncmVzc10uYWN0aW9uW2ldLnRhcmdldDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vZmlyZXMgd2hlbiBhbiBhc3NldCBmaW5pc2hlcyBsb2FkaW5nXHJcbi8vcnVuIHRocm91Z2ggdGhlIGltYWdlIGFycmF5cyBhbmQgY2hlY2sgaWYgZXZlcnl0aGluZyBpcyBsb2FkZWRcclxuRGlhbG9ndWUucHJvdG90eXBlLl9jaGVja0ltYWdlTG9hZFN0YXR1cyA9IGZ1bmN0aW9uKCl7XHJcbiAgICBpZighdGhpcy5zY2VuZXNMb2FkZWQpe1xyXG4gICAgICAgIHZhciBjb21wbGV0ZUZsYWcgPSB0cnVlO1xyXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLnNjZW5lcy5sZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgICAgIGlmKHRoaXMuc2NlbmVzW2ldLmxvYWRlZCA9PT0gZmFsc2Upe1xyXG4gICAgICAgICAgICAgICAgY29tcGxldGVGbGFnID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihjb21wbGV0ZUZsYWcpe1xyXG4gICAgICAgICAgICB0aGlzLnNjZW5lc0xvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpZighdGhpcy5hY3RvcnNMb2FkZWQpe1xyXG4gICAgICAgIHZhciBjb21wbGV0ZUZsYWcgPSB0cnVlO1xyXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmFjdG9ycy5sZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgICAgIGlmKHRoaXMuYWN0b3JzW2ldLmxvYWRlZCA9PT0gZmFsc2Upe1xyXG4gICAgICAgICAgICAgICAgY29tcGxldGVGbGFnID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihjb21wbGV0ZUZsYWcpe1xyXG4gICAgICAgICAgICB0aGlzLmFjdG9yc0xvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpZighdGhpcy5wcm9wc0xvYWRlZCl7XHJcbiAgICAgICAgdmFyIGNvbXBsZXRlRmxhZyA9IHRydWU7XHJcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMucHJvcHMubGVuZ3RoOyBpKyspe1xyXG4gICAgICAgICAgICBpZih0aGlzLnByb3BzW2ldLmxvYWRlZCA9PT0gZmFsc2Upe1xyXG4gICAgICAgICAgICAgICAgY29tcGxldGVGbGFnID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihjb21wbGV0ZUZsYWcpe1xyXG4gICAgICAgICAgICB0aGlzLnByb3BzTG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vY2F0Y2ggZXZlbnRzIGFuZCBvdGhlciBzdHVmZlxyXG5EaWFsb2d1ZS5wcm90b3R5cGUuYWN0ID0gZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMuYWxsTG9hZGVkKXtcclxuICAgICAgICAvL2hhbmRsZSBhbmltYXRpb24gbG9ja2luZ1xyXG4gICAgICAgIGlmKHRoaXMuZmFkZUFuaW1hdGlvbkxvY2sgPT09IHRydWUpe1xyXG4gICAgICAgICAgICB2YXIgY3VycmVudFRpbWUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xyXG4gICAgICAgICAgICAvL2NoZWNrIGFuZCBpbml0aWFsaXplIHRpbWVyIGlmIG5lZWQgYmVcclxuICAgICAgICAgICAgaWYodGhpcy5mYWRlQW5pbWF0aW9uTG9ja1RpbWVyID09PSAtMSl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZhZGVBbmltYXRpb25Mb2NrVGltZXIgPSBjdXJyZW50VGltZTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50VGltZSAtIHRoaXMuZmFkZUFuaW1hdGlvbkxvY2tUaW1lciA+IDIwMCl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZhZGVBbmltYXRpb25Mb2NrID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZhZGVBbmltYXRpb25Mb2NrVGltZXIgPSAtMTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlU2NlbmVJbmRleCA9IHBhcnNlSW50KHRoaXMuZGF0YS5kaWFsb2d1ZVt0aGlzLmRpYWxvZ3VlUHJvZ3Jlc3NdLnNjZW5lKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMuYWN0b3JzLmxlbmd0aDsgaSsrKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdG9yc1tpXS5hY3RpdmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZVByb3AgPSAtMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmFkZUJsaW5kZXJcIikuY2xhc3NOYW1lID0gXCJoaWRkZW5MYXllclwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNle1xyXG4gICAgICAgIC8vd2FpdHMgZm9yIGxvYWRpbmcgdGhlIGJlZ2luIGJlZm9yZSBydW5uaW5nIGFueXRoaW5nIHRoYXQgY2hlY2tzIGFuZCBzZWVzIHdoZXRoZXIgbG9hZGluZyBpcyBjb21wbGV0ZVxyXG4gICAgICAgIC8vcnVubmluZyB0aGlzIHRvbyBlYXJseSBjYW4gcmVzdWx0IGluIGZhbHNlIHBvc2l0aXZlcyBmb3IgbG9hZCBjb21wbGV0aW9uXHJcbiAgICAgICAgaWYodGhpcy5hY3RSZWFkeSl7XHJcbiAgICAgICAgICAgIC8vY2hlY2sgdG8gc2VlIHdoZXRoZXIgZXZlcnl0aGluZyBoYXMgYmVlbiBsb2FkZWQuIElmIHllcywgbWFrZSB0aGUgbGF5ZXIgdmlzaWJsZSBhbmQgcmVtb3ZlIGFueSBsb2FkaW5nIG1lc3NhZ2VzLiBTZXQgYWxsTG9hZGVkIHRvIHRydWVcclxuICAgICAgICAgICAgdGhpcy5fY2hlY2tJbWFnZUxvYWRTdGF0dXMoKTtcclxuXHJcbiAgICAgICAgICAgIGlmKHRoaXMuZGF0YUxvYWRlZCAmJiB0aGlzLnNjZW5lc0xvYWRlZCAmJiB0aGlzLmFjdG9yc0xvYWRlZCl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFsbExvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiQWxsIGRpYWxvZ3VlIGFzc2V0cyBzdWNjZXNzZnVsbHkgbG9hZGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG4vL2RyYXcgdGhlIGRpYWxvZ3VlIHZpc3VhbCBlbGVtZW50c1xyXG5EaWFsb2d1ZS5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGNhbnZhc1N0YXRlKXtcclxuICAgIGlmKHRoaXMuYWxsTG9hZGVkKXtcclxuICAgICAgICAvL2RyYXcgZGFyayBiYWNrZHJvcFxyXG4gICAgICAgIHBhaW50ZXIucmVjdChjYW52YXNTdGF0ZS5jdHgsIC1jYW52YXNTdGF0ZS53aWR0aCAvIDIsIC1jYW52YXNTdGF0ZS5oZWlnaHQgLyAyLCBjYW52YXNTdGF0ZS53aWR0aCwgY2FudmFzU3RhdGUuaGVpZ2h0LCBcImJsYWNrXCIsIFwiYmxhY2tcIiwgMCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5zY2VuZXNbdGhpcy5hY3RpdmVTY2VuZUluZGV4XS5kcmF3KGNhbnZhc1N0YXRlKTtcclxuICAgICAgICBcclxuICAgICAgICAvL2RyYXcgdGhlIGFjdGl2ZSBwcm9wXHJcbiAgICAgICAgaWYodGhpcy5hY3RpdmVQcm9wID4gLTEpe1xyXG4gICAgICAgICAgICB0aGlzLnByb3BzW3RoaXMuYWN0aXZlUHJvcF0uZHJhdyhjYW52YXNTdGF0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vZHJhdyB0aGUgbG9jYXRpb24gbWFya2VyIGlmIGNvbmRpdGlvbnMgYXJlIGFwcHJvcHJpYXRlXHJcbiAgICAgICAgaWYodGhpcy5sb2NhdGlvblRleHQgIT09IFwiXCIgJiYgdGhpcy5mYWRlQW5pbWF0aW9uTG9jayA9PT0gZmFsc2Upe1xyXG4gICAgICAgICAgICB0aGlzLl9kcmF3TG9jYXRpb25NYXJrZXIoY2FudmFzU3RhdGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL3Nob3VsZCBmaXJlIGltbWVkaWF0ZWx5IG9uIGZ1bGwgdmlzdWFsIGxvYWQgd2hlbiBsb2NhdGlvbiB0ZXh0IGlzIGVtcHR5XHJcbiAgICAgICAgZWxzZSBpZih0aGlzLmxvY2F0aW9uVGV4dCA9PT0gXCJcIiAmJiB0aGlzLmZhZGVBbmltYXRpb25Mb2NrID09PSBmYWxzZSAmJiB0aGlzLmRpYWxvZ3VlUHJvZ3Jlc3MgPT09IC0xKXtcclxuICAgICAgICAgICAgdGhpcy50aWNrKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vaXRlcmF0ZSBhbmQgZHJhdyB3aXRoIGFjdG9yc1xyXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmFjdG9ycy5sZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgICAgIHRoaXMuYWN0b3JzW2ldLmRyYXcoY2FudmFzU3RhdGUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbi8vZHJhdyB0aGUgbG9jYXRpb24gbWFya2VyIHdoZW4gaXQgaXMgbmVlZGVkXHJcbkRpYWxvZ3VlLnByb3RvdHlwZS5fZHJhd0xvY2F0aW9uTWFya2VyID0gZnVuY3Rpb24oY2FudmFzU3RhdGUpe1xyXG4gICAgY2FudmFzU3RhdGUuY3R4LnNhdmUoKTtcclxuICAgIGNhbnZhc1N0YXRlLmN0eC5mb250ID0gKGNhbnZhc1N0YXRlLmhlaWdodC8xMCkgKyBcInB4IEFyaWFsXCI7XHJcbiAgICBjYW52YXNTdGF0ZS5jdHgudGV4dEJhc2VsaW5lID0gXCJtaWRkbGVcIjtcclxuICAgIGNhbnZhc1N0YXRlLmN0eC50ZXh0QWxpZ24gPSBcImNlbnRlclwiO1xyXG4gICAgdmFyIHRleHRXaWR0aCA9IGNhbnZhc1N0YXRlLmN0eC5tZWFzdXJlVGV4dCgodGhpcy5sb2NhdGlvblRleHQgKyBcIlwiKSkud2lkdGg7XHJcbiAgICB2YXIgdGV4dEJvcmRlciA9IGNhbnZhc1N0YXRlLmhlaWdodC83MDtcclxuICAgIHBhaW50ZXIucm91bmRlZFJlY3RhbmdsZShcclxuICAgICAgICBjYW52YXNTdGF0ZS5jdHgsXHJcbiAgICAgICAgLXRleHRXaWR0aC8yIC0gdGV4dEJvcmRlcixcclxuICAgICAgICAtY2FudmFzU3RhdGUuaGVpZ2h0LzIwLFxyXG4gICAgICAgIHRleHRXaWR0aCArIHRleHRCb3JkZXIgKiAyLFxyXG4gICAgICAgIChjYW52YXNTdGF0ZS5oZWlnaHQvMTApLFxyXG4gICAgICAgIDUsXHJcbiAgICAgICAgXCJ3aGl0ZVwiLFxyXG4gICAgICAgIFwiYmxhY2tcIixcclxuICAgICAgICBjYW52YXNTdGF0ZS5oZWlnaHQvMTAwXHJcbiAgICApO1xyXG4gICAgY2FudmFzU3RhdGUuY3R4LmZpbGxTdHlsZSA9ICdibGFjayc7XHJcbiAgICBjYW52YXNTdGF0ZS5jdHguZmlsbFRleHQodGhpcy5sb2NhdGlvblRleHQsIDAsIDApO1xyXG4gICAgY2FudmFzU3RhdGUuY3R4LnJlc3RvcmUoKTtcclxufVxyXG5cclxuLy9hZHZhbmNlcyB0aGUgZGlhbG91ZSBwcm9ncmVzc2lvblxyXG5EaWFsb2d1ZS5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKCl7XHJcbiAgICBpZih0aGlzLmFsbExvYWRlZCl7XHJcbiAgICAgICAgdGhpcy5kaWFsb2d1ZVByb2dyZXNzKys7XHJcbiAgICAgICAgaWYodGhpcy5kaWFsb2d1ZVByb2dyZXNzIDwgdGhpcy5kYXRhLmRpYWxvZ3VlLmxlbmd0aCl7XHJcbiAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3NEaWFsb2d1ZSgpO1xyXG4gICAgICAgIH0gZWxzZXtcclxuICAgICAgICAgICAgZGlhbG9ndWVTcGVha2VyLmlubmVySFRNTCA9IFwiXCI7XHJcbiAgICAgICAgICAgIGRpYWxvZ3VlVGV4dC5pbm5lckhUTUwgPSBcIlwiO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5jb21wbGV0ZSA9IHRydWU7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBkaWFsb2d1ZUxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy50aWNrU2NvcGUsIGZhbHNlKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGRpYWxvZ3VlTGF5ZXIuY2xhc3NOYW1lID0gXCJoaWRkZW5FbGVtZW50XCI7XHJcbiAgICAgICAgICAgIGRpYWxvZ3VlRnJhbWUuY2xhc3NOYW1lID0gXCJoaWRkZW5MYXllclwiO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBEaWFsb2d1ZTsiLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIERyYXdMaWIgPSByZXF1aXJlKCcuLi9saWJyYXJpZXMvRHJhd2xpYi5qcycpO1xyXG52YXIgVXRpbGl0aWVzID0gcmVxdWlyZSgnLi4vbGlicmFyaWVzL1V0aWxpdGllcy5qcycpO1xyXG52YXIgUG9pbnQgPSByZXF1aXJlKCcuLi9jb21tb24vUG9pbnQuanMnKTtcclxuXHJcbnZhciBwYWludGVyO1xyXG52YXIgdXRpbGl0eTtcclxuXHJcbi8vcGFyYW1ldGVyIGlzIGEgcG9pbnQgdGhhdCBkZW5vdGVzIHN0YXJ0aW5nIHBvc2l0aW9uXHJcbmZ1bmN0aW9uIEV2aWRlbmNlTm9kZShKU09OQ2h1bmssIGluY29taW5nQWN0aW9uZnVuY3Rpb24sIGluY29taW5nRm9jdXNGdW5jdGlvbil7XHJcbiAgICBwYWludGVyID0gbmV3IERyYXdMaWIoKTtcclxuICAgIHV0aWxpdHkgPSBuZXcgVXRpbGl0aWVzKCk7XHJcbiAgICBcclxuICAgIHRoaXMuYWRkQWN0aW9uID0gaW5jb21pbmdBY3Rpb25mdW5jdGlvbjtcclxuICAgIHRoaXMuc2V0Rm9jdXMgPSBpbmNvbWluZ0ZvY3VzRnVuY3Rpb247XHJcbiAgICBcclxuICAgIC8vYm9vbDogd2hldGhlciB0aGUgaW1hZ2UgaGFzIGJlZW4gbG9hZGVkXHJcbiAgICB0aGlzLmxvYWRlZCA9IGZhbHNlO1xyXG4gICAgLy9pbWFnZTogaW1hZ2UgYXNzZXQgdGllZCB0byB0aGlzIG5vZGVcclxuICAgIHRoaXMuaW1hZ2U7XHJcbiAgICAvL251bWJlcjogYWRqdXN0ZWQgd2lkdGggb2YgdGhlIG5vZGUgdG8gYmUgZHJhd25cclxuICAgIHRoaXMud2lkdGg7XHJcbiAgICAvL251bWJlcjogYWRqdXN0ZWQgaGVpZ2h0IG9mIHRoZSBub2RlIHRvIGJlIGRyYXduXHJcbiAgICB0aGlzLmhlaWdodDtcclxuICAgIC8vcG9pbnQ6IGhvbGRzIHggYW5kIHkgdmFsdWVzIHJlcHJlc2VudGluZyBwb3NpdGlvbiBvZiB0aGUgbm9kZVxyXG4gICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBQb2ludCgwLDApO1xyXG4gICAgLy9ib29sOiB3aGV0aGVyIHRoZSBob3VzZSBpcyBob3ZlcmluZyBvdmVyIHRoZSBub2RlIG9yIG5vdFxyXG4gICAgdGhpcy5tb3VzZU92ZXIgPSBmYWxzZTtcclxuICAgIC8vSlNPTjogbm9kZSBkYXRhIHNlcGFyYXRlZCBmcm9tIGJvYXJkIEpTT04uIENvbnRhaW5zIG9ubHkgdGhlIG5vZGUncyBkYXRhXHJcbiAgICB0aGlzLmRhdGEgPSBKU09OQ2h1bms7XHJcbiAgICBcclxuICAgIC8vaW1hZ2UgbG9hZGluZyBhbmQgcmVzaXppbmdcclxuICAgIHZhciB0ZW1wSW1hZ2UgPSBuZXcgSW1hZ2UoKTtcclxuICAgIC8vYXNzaWduIGxpc3RlbmVycyBmb3IgcmVzcG9uZGluZyB0byBsb2FkcyBhbmQgZXJyb3JzXHJcbiAgICB0ZW1wSW1hZ2UuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIF9sb2FkQWN0aW9uLmJpbmQodGhpcyksIGZhbHNlKTtcclxuICAgIHRlbXBJbWFnZS5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIF9lcnJvckFjdGlvbi5iaW5kKHRoaXMpLCBmYWxzZSk7XHJcbiAgICAvL3NldHMgdGhlIGltYWdlIHNvdXJjZSBhbmQgYmVnaW5zIGxvYWQgZXZlbnRcclxuICAgIHRlbXBJbWFnZS5zcmMgPSB0aGlzLmRhdGEuaW1hZ2U7XHJcbn1cclxuXHJcbi8vYXR0ZW1wdHMgdG8gbG9hZCB0aGUgc3BlY2lmaWVkIGltYWdlXHJcbnZhciBfbG9hZEFjdGlvbiA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICB0aGlzLmltYWdlID0gZS50YXJnZXQ7XHJcbiAgICB0aGlzLndpZHRoID0gZS50YXJnZXQubmF0dXJhbFdpZHRoO1xyXG4gICAgdGhpcy5oZWlnaHQgPSBlLnRhcmdldC5uYXR1cmFsSGVpZ2h0O1xyXG4gICAgXHJcbiAgICAvL3RoZSBkZWZhdWx0IG1heCB3aWR0aCBhbmQgaGVpZ2h0IG9mIGFuIGltYWdlXHJcbiAgICB2YXIgbWF4RGltZW5zaW9uID0gMTAwO1xyXG4gICAgXHJcbiAgICAvL3NpemUgdGhlIGltYWdlIGRvd24gZXZlbmx5XHJcbiAgICBpZih0aGlzLndpZHRoIDwgbWF4RGltZW5zaW9uICYmIHRoaXMuaGVpZ2h0IDwgbWF4RGltZW5zaW9uKXtcclxuICAgICAgICB2YXIgeDtcclxuICAgICAgICBpZih0aGlzLndpZHRoID4gdGhpcy5oZWlnaHQpe1xyXG4gICAgICAgICAgICB4ID0gbWF4RGltZW5zaW9uIC8gdGhpcy53aWR0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgeCA9IG1heERpbWVuc2lvbiAvIHRoaXMuaGVpZ2h0O1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLndpZHRoID0gdGhpcy53aWR0aCAqIHg7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSB0aGlzLmhlaWdodCAqIHg7XHJcbiAgICB9XHJcbiAgICBpZih0aGlzLndpZHRoID4gbWF4RGltZW5zaW9uIHx8IHRoaXMuaGVpZ2h0ID4gbWF4RGltZW5zaW9uKXtcclxuICAgICAgICB2YXIgeDtcclxuICAgICAgICBpZih0aGlzLndpZHRoID4gdGhpcy5oZWlnaHQpe1xyXG4gICAgICAgICAgICB4ID0gdGhpcy53aWR0aCAvIG1heERpbWVuc2lvbjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgeCA9IHRoaXMuaGVpZ2h0IC8gbWF4RGltZW5zaW9uO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLndpZHRoID0gdGhpcy53aWR0aCAvIHg7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSB0aGlzLmhlaWdodCAvIHg7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHRoaXMubG9hZGVkID0gdHJ1ZTtcclxufTtcclxuLy9maXJlcyBpZiBsb2FkaW5nIGlzIHVuc3VjY2VzZnVsLCBhc3NpZ25zIGEgZ3VhcmFudGVlZCB0aHVtYm5haWxcclxudmFyIF9lcnJvckFjdGlvbiA9IGZ1bmN0aW9uKGUpe1xyXG4gICAgLy9hbGVydChcIlRoZXJlIHdhcyBhbiBlcnJvciBsb2FkaW5nIGFuIGltYWdlLlwiKTtcclxuICAgIHRoaXMuaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcclxuICAgIHRoaXMuaW1hZ2Uuc3JjID0gXCIuLy4uLy4uLy4uL2NvbnRlbnQvdWkvbWlzc2luZ1RodW1ibmFpbC5naWZcIjtcclxuICAgIHRoaXMud2lkdGggPSAxMDA7XHJcbiAgICB0aGlzLmhlaWdodCA9IDEwMDtcclxuICAgIHRoaXMubG9hZGVkID0gdHJ1ZTtcclxufTtcclxuXHJcbi8vZHJhdyB0aGUgbm9kZSBhbmQgaXRzIGFjY29tcGFueWluZyB2aXN1YWwgZWxlbWVudHNcclxuRXZpZGVuY2VOb2RlLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY2FudmFzU3RhdGUpe1xyXG4gICAgLy9tYWtlcyBzdXJlIHRoYXQgdGhlIGFzc2V0cyBhcmUgbG9hZGVkIGJlZm9yZSBhdHRlbXB0aW5nIHRvIGRyYXcgdGhlbVxyXG4gICAgaWYodGhpcy5sb2FkZWQpe1xyXG4gICAgICAgIGNhbnZhc1N0YXRlLmN0eC5zYXZlKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9zYWZlbHkgYXR0ZW1wdCB0byBkcmF3IHRoaXMgbm9kZVxyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgLy9vbmx5IGRyYXcgaWYgdGhlIG5vZGUgaGFzIGJlZW4gcmV2ZWFsZWRcclxuICAgICAgICAgICAgaWYodGhpcy5kYXRhLnZpc2libGUgPT09IHRydWUpe1xyXG4gICAgICAgICAgICAgICAgLy9jb252ZXJ0IDAtMTAwIHZhbHVlcyB0byBhY3R1YWwgY29vcmRpbmF0ZXMgb24gdGhlIGNhbnZhc1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3NpdGlvbi54ID0gdXRpbGl0eS5tYXAodGhpcy5kYXRhLngsIC0xMDAsIDEwMCwgLWNhbnZhc1N0YXRlLnJlbGF0aXZlV2lkdGgqLjQzLCBjYW52YXNTdGF0ZS5yZWxhdGl2ZVdpZHRoKi40MykgLSBjYW52YXNTdGF0ZS5ldmlkZW5jZUZyYW1lU2l6ZSouMjtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9zaXRpb24ueSA9IHV0aWxpdHkubWFwKHRoaXMuZGF0YS55LCAtMTAwLCAxMDAsIC1jYW52YXNTdGF0ZS5oZWlnaHQqLjM1LCBjYW52YXNTdGF0ZS5oZWlnaHQqLjM1KTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdGhpcy5fZHJhd05vZGUoY2FudmFzU3RhdGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoKGVycm9yKXtcclxuICAgICAgICAgICAgLy91c3VhbGx5IGhpdCBpZiBpbWFnZSBmaWxlcyBsb2FkIHNsb3dseSwgZ2l2ZXMgdGhlbSBhIGNoYW5jZSB0byBsb2FkIGJlZm9yZSBhdHRlbXB0aW5nIHRvIGRyYXdcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJUaGVyZSB3YXMgYSBwcm9ibGVtIGRyYXdpbmcgXCIgKyB0aGlzLmRhdGEuaW1hZ2UgKyBcIiAuLi5yZWF0dGVtcHRpbmdcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGNhbnZhc1N0YXRlLmN0eC5yZXN0b3JlKCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vL2RyYXcgdGhlIHNjYWxlZCBldmlkZW5jZSBub2RlXHJcbkV2aWRlbmNlTm9kZS5wcm90b3R5cGUuX2RyYXdOb2RlID0gZnVuY3Rpb24oY2FudmFzU3RhdGUpeyAgICBcclxuICAgIC8vYWRqdXN0IGRpbWVuc2lvbnMgdG8gZml0IG5vZGUgZnJhbWVzXHJcbiAgICB2YXIgYWRqdXN0ZWRXaWR0aDtcclxuICAgIHZhciBhZGp1c3RlZEhlaWdodDtcclxuICAgIGlmKHRoaXMud2lkdGggPiB0aGlzLmhlaWdodCl7XHJcbiAgICAgICAgdmFyIG1vZGlmaWVyID0gY2FudmFzU3RhdGUuZXZpZGVuY2VGcmFtZVNpemUvdGhpcy53aWR0aCouODU7XHJcbiAgICAgICAgYWRqdXN0ZWRXaWR0aCA9IHRoaXMud2lkdGggKiBtb2RpZmllcjtcclxuICAgICAgICBhZGp1c3RlZEhlaWdodCA9IHRoaXMuaGVpZ2h0ICogbW9kaWZpZXI7XHJcbiAgICB9XHJcbiAgICBlbHNle1xyXG4gICAgICAgIHZhciBtb2RpZmllciA9IGNhbnZhc1N0YXRlLmV2aWRlbmNlRnJhbWVTaXplL3RoaXMuaGVpZ2h0Ki44NTtcclxuICAgICAgICBhZGp1c3RlZFdpZHRoID0gdGhpcy53aWR0aCAqIG1vZGlmaWVyO1xyXG4gICAgICAgIGFkanVzdGVkSGVpZ2h0ID0gdGhpcy5oZWlnaHQgKiBtb2RpZmllcjtcclxuICAgIH1cclxuICAgIFxyXG4gICAgY2FudmFzU3RhdGUuY3R4LnNhdmUoKTtcclxuICAgIC8vaGlnaGxpZ2h0IHRoaXMgaWYgbW91c2UgaXMgb3ZlciwgaXNvbGF0ZWQgZnJvbSBldmVyeXRoaW5nIGVsc2Ugc28gb25seSB0aGUgYmFjayBsYXllciBnbG93c1xyXG4gICAgaWYodGhpcy5tb3VzZU92ZXIpe1xyXG4gICAgICAgIGNhbnZhc1N0YXRlLmN0eC5zaGFkb3dDb2xvciA9ICcjMDA2NmZmJztcclxuICAgICAgICBjYW52YXNTdGF0ZS5jdHguc2hhZG93Qmx1ciA9IDc7XHJcbiAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcInBvaW50ZXJcIjtcclxuICAgIH1cclxuICAgIHBhaW50ZXIucmVjdChjYW52YXNTdGF0ZS5jdHgsICgtY2FudmFzU3RhdGUuZXZpZGVuY2VGcmFtZVNpemUvMikgKyAodGhpcy5wb3NpdGlvbi54KSwgKC1jYW52YXNTdGF0ZS5ldmlkZW5jZUZyYW1lU2l6ZS8yKSArICh0aGlzLnBvc2l0aW9uLnkpIC0gY2FudmFzU3RhdGUuZXZpZGVuY2VGcmFtZVNpemUqLjEsIGNhbnZhc1N0YXRlLmV2aWRlbmNlRnJhbWVTaXplLCBjYW52YXNTdGF0ZS5ldmlkZW5jZUZyYW1lU2l6ZSArIGNhbnZhc1N0YXRlLmV2aWRlbmNlRnJhbWVTaXplKi4xLCBcIndoaXRlXCIsIFwiZ3JheVwiLCAxKTtcclxuICAgIGNhbnZhc1N0YXRlLmN0eC5yZXN0b3JlKCk7XHJcbiAgICBcclxuICAgIHBhaW50ZXIucmVjdChjYW52YXNTdGF0ZS5jdHgsICgtY2FudmFzU3RhdGUuZXZpZGVuY2VGcmFtZVNpemUvMiouODUpICsgKHRoaXMucG9zaXRpb24ueCksICgtY2FudmFzU3RhdGUuZXZpZGVuY2VGcmFtZVNpemUvMiouODUpICsgKHRoaXMucG9zaXRpb24ueSkgLSBjYW52YXNTdGF0ZS5ldmlkZW5jZUZyYW1lU2l6ZSouMSwgY2FudmFzU3RhdGUuZXZpZGVuY2VGcmFtZVNpemUqLjg1LCBjYW52YXNTdGF0ZS5ldmlkZW5jZUZyYW1lU2l6ZSouODUsIFwiIzI3MjcyN1wiLCBcInRyYW5zcGFyZW50XCIsIDApO1xyXG4gICAgXHJcbiAgICBjYW52YXNTdGF0ZS5jdHguZHJhd0ltYWdlKHRoaXMuaW1hZ2UsICgtYWRqdXN0ZWRXaWR0aC8yKSArICh0aGlzLnBvc2l0aW9uLngpLCAoLWFkanVzdGVkSGVpZ2h0LzIpICsgKHRoaXMucG9zaXRpb24ueSkgLSBjYW52YXNTdGF0ZS5ldmlkZW5jZUZyYW1lU2l6ZSouMSwgYWRqdXN0ZWRXaWR0aCwgYWRqdXN0ZWRIZWlnaHQpO1xyXG4gICAgXHJcbiAgICAvKnBhcnQgb2YgbGFiZWwgcmVtb3ZhbFxyXG4gICAgLy9kcmF3IHRoZSBwYXBlciBiYWNraW5nIGZvciB0aGUgZXZpZGVuY2Ugbm9kZSBuYW1lXHJcbiAgICBjYW52YXNTdGF0ZS5jdHguZm9udCA9IChjYW52YXNTdGF0ZS5ldmlkZW5jZUZyYW1lU2l6ZS82KSArIFwicHggQXJpYWxcIjtcclxuICAgIHZhciB0ZXh0V2lkdGggPSBjYW52YXNTdGF0ZS5jdHgubWVhc3VyZVRleHQoKHRoaXMuZGF0YS5uYW1lICsgXCJcIikpLndpZHRoICogMS4xO1xyXG4gICAgcGFpbnRlci5yZWN0KFxyXG4gICAgICAgIGNhbnZhc1N0YXRlLmN0eCxcclxuICAgICAgICB0aGlzLnBvc2l0aW9uLnggLSB0ZXh0V2lkdGgvMixcclxuICAgICAgICB0aGlzLnBvc2l0aW9uLnkgKyBjYW52YXNTdGF0ZS5ldmlkZW5jZUZyYW1lU2l6ZS8yIC0gKGNhbnZhc1N0YXRlLmV2aWRlbmNlRnJhbWVTaXplLzYgKiAxLjUpLzQsXHJcbiAgICAgICAgdGV4dFdpZHRoLFxyXG4gICAgICAgIGNhbnZhc1N0YXRlLmV2aWRlbmNlRnJhbWVTaXplLzYgKiAxLjUsXHJcbiAgICAgICAgXCIjZmZmZmE1XCIsXHJcbiAgICAgICAgXCJsaWdodGdyYXlcIixcclxuICAgICAgICAwXHJcbiAgICApO1xyXG4gICAgKi9cclxuICAgIFxyXG4gICAgXHJcbiAgICBjYW52YXNTdGF0ZS5jdHguc2F2ZSgpO1xyXG4gICAgXHJcbiAgICAvL2xhYmVsIHRleHQgdmlzdWFsIGVsZW1lbnRcclxuICAgIGNhbnZhc1N0YXRlLmN0eC5mb250ID0gKGNhbnZhc1N0YXRlLmV2aWRlbmNlRnJhbWVTaXplLzE0KSArIFwicHggQXJjaGl0ZWN0cyBEYXVnaHRlclwiO1xyXG4gICAgY2FudmFzU3RhdGUuY3R4LnRleHRCYXNlbGluZSA9IFwibWlkZGxlXCI7XHJcbiAgICBjYW52YXNTdGF0ZS5jdHgudGV4dEFsaWduID0gXCJjZW50ZXJcIjtcclxuICAgIGNhbnZhc1N0YXRlLmN0eC5maWxsVGV4dCh0aGlzLmRhdGEubmFtZSwgdGhpcy5wb3NpdGlvbi54LCB0aGlzLnBvc2l0aW9uLnkgKyAxNypjYW52YXNTdGF0ZS5ldmlkZW5jZUZyYW1lU2l6ZSAvIDQwKTtcclxuICAgIFxyXG4gICAgLy9jaGVja2JveCBtb3ZlZCB0byBib2FyZHBoYXNlIGxheWVyXHJcbiAgICAvL2FuYWx5c2lzIGNoZWNrYm94XHJcbiAgICAvKlxyXG4gICAgaWYodGhpcy5kYXRhLmFuYWx5emVkKXtcclxuICAgICAgICB2YXIgcG9zdEl0U2l6ZSA9IGNhbnZhc1N0YXRlLmV2aWRlbmNlRnJhbWVTaXplKi4zNTtcclxuICAgICAgICBwYWludGVyLnJlY3QoY2FudmFzU3RhdGUuY3R4LCB0aGlzLnBvc2l0aW9uLnggKyBjYW52YXNTdGF0ZS5ldmlkZW5jZUZyYW1lU2l6ZS8yIC0gMipwb3N0SXRTaXplLzMsIHRoaXMucG9zaXRpb24ueSAtIGNhbnZhc1N0YXRlLmV2aWRlbmNlRnJhbWVTaXplLzIgLSBwb3N0SXRTaXplLzIsIHBvc3RJdFNpemUsIHBvc3RJdFNpemUsIFwiI2ZmZmZhNVwiLCBcImxpZ2h0Z3JheVwiLCAyKTtcclxuICAgICAgICBjYW52YXNTdGF0ZS5jdHguZm9udCA9IChjYW52YXNTdGF0ZS5ldmlkZW5jZUZyYW1lU2l6ZS8zKSArIFwicHggQXJpYWxcIjtcclxuICAgICAgICBjYW52YXNTdGF0ZS5jdHguZmlsbFN0eWxlID0gXCJncmVlblwiO1xyXG4gICAgICAgIGNhbnZhc1N0YXRlLmN0eC5maWxsVGV4dChcIuKclFwiLCB0aGlzLnBvc2l0aW9uLnggKyBjYW52YXNTdGF0ZS5ldmlkZW5jZUZyYW1lU2l6ZS8yIC0gcG9zdEl0U2l6ZS83LCB0aGlzLnBvc2l0aW9uLnkgLSBjYW52YXNTdGF0ZS5ldmlkZW5jZUZyYW1lU2l6ZS8yKTtcclxuICAgIH0qL1xyXG4gICAgY2FudmFzU3RhdGUuY3R4LnJlc3RvcmUoKTtcclxufVxyXG5cclxuLy90aGlzIHdpbGwgYmUgY2FsbGVkIHdoZW4gdGhlIGFuYWx5c2lzIGJ1dHRvbiBpcyBjbGlja2VkIGluIEJvYXJkUGhhc2VcclxudmFyIF9hbmFseXNpcyA9IGZ1bmN0aW9uKCl7XHJcbiAgICAvL3NldCBhbmFseXplZCBwcm9wZXJ0eSB0byB0cnVlXHJcbiAgICB0aGlzLmRhdGEuYW5hbHl6ZWQgPSB0cnVlO1xyXG4gICAgXHJcbiAgICAvL3NldCB0aGUgZm9jdXMgaW4gdGhlIHBhcmVudFxyXG4gICAgdGhpcy5zZXRGb2N1cyh0aGlzLmRhdGEubnVtKTtcclxuICAgIFxyXG4gICAgLy9wYXJzZSB0aGUgaW5zaWdodCBvdXRjb21lIGFycmF5XHJcbiAgICB2YXIgaTtcclxuICAgIHZhciBhcnJheUxlbmd0aCA9IHRoaXMuZGF0YS5pbnNpZ2h0T3V0Y29tZS5sZW5ndGg7XHJcbiAgICBmb3IoaSA9IDA7IGkgPCBhcnJheUxlbmd0aDsgaSsrKXtcclxuICAgICAgICAvL2FkZCBlYWNoIGluc2lnaHQgb3V0Y29tZSBhY3Rpb24gdG8gdGhlIGFjdGlvbkFycmF5XHJcbiAgICAgICAgdGhpcy5hZGRBY3Rpb24odGhpcy5kYXRhLmluc2lnaHRPdXRjb21lW2ldKTtcclxuICAgIH1cclxufVxyXG5cclxuLy9wb3B1bGF0ZXMgdGhlIGRldGFpbFdpbmRvdyBiYXNlZCBvbiB0aGUgc2VuZGVyXHJcbkV2aWRlbmNlTm9kZS5wcm90b3R5cGUuY2xpY2sgPSBmdW5jdGlvbigpe1xyXG4gICAgLy9zZXQgbW91c2VvdmVyIHRvIGZhbHNlIHRvIHByZXZlbnQgdGhlIG92ZXJsYXkgZnJvbSBhcHBlYXJpbmcgd2hlbiB0aGUgYm9hcmQgcmV0dXJucyB0byBnYW1lcGxheVxyXG4gICAgdGhpcy5tb3VzZU92ZXIgPSBmYWxzZTtcclxuICAgIC8vc2V0IHRoZSBmb2N1cyB0byB0aGlzIG5vZGUgYmVjYXVzZSBpdCB3YXMgY2xpY2tlZFxyXG4gICAgdGhpcy5zZXRGb2N1cyh0aGlzLmRhdGEubnVtKTtcclxuICAgIC8vY2hhbmdlIHRoZSBpbm5lcmh0bWwgYW5kIHN0eWxlIGJhc2VkIG9uIHdoZXRoZXIgb3Igbm90IHRoaXMgaXMgYSByZXZlbGF0aW9uXHJcbiAgICBpZih0aGlzLmRhdGEucmV2ZWxhdGlvbiAhPT0gMCl7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhbmFseXNpc0ZyYW1lVGl0bGVcIikuaW5uZXJIVE1MID0gdGhpcy5kYXRhLnJldmVsYXRpb247XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhbmFseXNpc0ZyYW1lUGFwZXJcIikuY2xhc3NOYW1lID0gXCJhbmFseXNpc0ZyYW1lUGFwZXJSZWRcIjtcclxuICAgIH1cclxuICAgIGVsc2V7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhbmFseXNpc0ZyYW1lVGl0bGVcIikuaW5uZXJIVE1MID0gXCJBbmFseXNpc1wiO1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYW5hbHlzaXNGcmFtZVBhcGVyXCIpLmNsYXNzTmFtZSA9IFwiYW5hbHlzaXNGcmFtZVBhcGVyQmx1ZVwiO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvL3BvcHVsYXRlIHRoZSBldmlkZW5jZSBtZW51XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV2aWRlbmNlTGF5ZXJcIikuY2xhc3NOYW1lID0gXCJcIjtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicGhvdG9GcmFtZVRpdGxlRnJhbWVcIikuY2xhc3NOYW1lID0gXCJcIjtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicGhvdG9GcmFtZVRpdGxlXCIpLmlubmVySFRNTCA9IHRoaXMuZGF0YS5uYW1lO1xyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwaG90b0ltYWdlXCIpLnNyYyA9IHRoaXMuZGF0YS5pbWFnZTtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGVzY3JpcHRpb25GcmFtZUNvbnRlbnRcIikuaW5uZXJIVE1MID0gdGhpcy5kYXRhLmRlc2NyaXB0aW9uO1xyXG4gICAgaWYodGhpcy5kYXRhLmFuYWx5emVkID09PSBmYWxzZSl7XHJcbiAgICAgICAgLy9idXR0b24gdmlzaWJsZSBhbmQgaW50ZXJhY3RhYmxlLCBubyBpbnNpZ2h0XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhbmFseXNpc0ZyYW1lUGFwZXJcIikuY2xhc3NOYW1lID0gXCJoaWRkZW5FbGVtZW50XCI7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhbmFseXNpc0J1dHRvblwiKS5jbGFzc05hbWUgPSBcIlwiO1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYW5hbHlzaXNCdXR0b25cIikub25jbGljayA9IF9hbmFseXNpcy5iaW5kKHRoaXMpO1xyXG4gICAgfVxyXG4gICAgZWxzZXtcclxuICAgICAgICAvL2RvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYW5hbHlzaXNGcmFtZVBhcGVyXCIpLmNsYXNzTmFtZSA9IFwiXCI7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhbmFseXNpc0ZyYW1lQ29udGVudFwiKS5pbm5lckhUTUwgPSB0aGlzLmRhdGEuaW5zaWdodDtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFuYWx5c2lzQnV0dG9uXCIpLmNsYXNzTmFtZSA9IFwiaGlkZGVuRWxlbWVudFwiO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBFdmlkZW5jZU5vZGU7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBEcmF3TGliID0gcmVxdWlyZSgnLi8uLi9saWJyYXJpZXMvRHJhd2xpYi5qcycpO1xyXG52YXIgVXRpbGl0aWVzID0gcmVxdWlyZSgnLi8uLi9saWJyYXJpZXMvVXRpbGl0aWVzLmpzJyk7XHJcblxyXG52YXIgcGFpbnRlcjtcclxudmFyIHV0aWxpdHk7XHJcblxyXG4vL2NvbnN0cnVjdG9yXHJcbmZ1bmN0aW9uIFByb3AocFVyaSl7XHJcbiAgICAvL2hlbHBlciBsaWJyYXJ5IGRlY2xhcmF0aW9uc1xyXG4gICAgcGFpbnRlciA9IG5ldyBEcmF3TGliKCk7XHJcbiAgICB1dGlsaXR5ID0gbmV3IFV0aWxpdGllcygpO1xyXG4gICAgXHJcbiAgICAvL2Jvb2w6IHdoZXRoZXIgdGhpcyBhc3NldCBoYXMgbG9hZGVkIG9yIG5vdFxyXG4gICAgdGhpcy5sb2FkZWQgPSBmYWxzZTtcclxuICAgIC8vaW1hZ2U6IGRhdGEgZm9yIHRoZSBpbWFnZSBhc3NldCBpdHNlbGZcclxuICAgIHRoaXMuaW1hZ2U7XHJcbiAgICAvL251bWJlcjogd2lkdGggb2YgdGhlIGltYWdlIGFzc2V0XHJcbiAgICB0aGlzLndpZHRoO1xyXG4gICAgLy9udW1iZXI6IGhlaWdodCBvZiB0aGUgaW1hZ2UgYXNzZXRcclxuICAgIHRoaXMuaGVpZ2h0O1xyXG4gICAgXHJcbiAgICAvL2NvbnRhaW5lciB0byBkZWZpbmUgbG9hZGluZyBhbmQgcmVzaXppbmcgaW1hZ2UgYXNzZXRcclxuICAgIHZhciB0ZW1wSW1hZ2UgPSBuZXcgSW1hZ2UoKTtcclxuICAgIC8vYXNzaWduIGxpc3RlbmVycyBmb3IgcmVzcG9uZGluZyB0byBsb2FkcyBhbmQgZXJyb3JzXHJcbiAgICB0ZW1wSW1hZ2UuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIF9sb2FkQWN0aW9uLmJpbmQodGhpcyksIGZhbHNlKTtcclxuICAgIHRlbXBJbWFnZS5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIF9lcnJvckFjdGlvbi5iaW5kKHRoaXMpLCBmYWxzZSk7XHJcbiAgICAvL3NldHMgdGhlIGltYWdlIHNvdXJjZSBhbmQgYmVnaW5zIGxvYWQgZXZlbnRcclxuICAgIHRlbXBJbWFnZS5zcmMgPSBwVXJpO1xyXG59XHJcblxyXG4vL2F0dGVtcHRzIHRvIGxvYWQgdGhlIHNwZWNpZmllZCBpbWFnZVxyXG52YXIgX2xvYWRBY3Rpb24gPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgdGhpcy5pbWFnZSA9IGUudGFyZ2V0O1xyXG4gICAgdGhpcy53aWR0aCA9IGUudGFyZ2V0Lm5hdHVyYWxXaWR0aDtcclxuICAgIHRoaXMuaGVpZ2h0ID0gZS50YXJnZXQubmF0dXJhbEhlaWdodDtcclxuICAgIHRoaXMub3JpZ1dpZHRoID0gZS50YXJnZXQubmF0dXJhbFdpZHRoO1xyXG4gICAgdGhpcy5vcmlnSGVpZ2h0ID0gZS50YXJnZXQubmF0dXJhbEhlaWdodDtcclxuICAgIHRoaXMubG9hZGVkID0gdHJ1ZTtcclxufTtcclxuLy9maXJlcyBpZiBsb2FkaW5nIGlzIHVuc3VjY2VzZnVsLCBhc3NpZ25zIGEgZ3VhcmFudGVlZCB0aHVtYm5haWxcclxudmFyIF9lcnJvckFjdGlvbiA9IGZ1bmN0aW9uKGUpe1xyXG4gICAgLy9hbGVydChcIlRoZXJlIHdhcyBhbiBlcnJvciBsb2FkaW5nIGFuIGltYWdlLlwiKTtcclxuICAgIHRoaXMuaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcclxuICAgIHRoaXMuaW1hZ2Uuc3JjID0gXCIuL2NvbnRlbnQvdWkvbWlzc2luZ1RodW1ibmFpbC5naWZcIjtcclxuICAgIHRoaXMud2lkdGggPSAxMDA7XHJcbiAgICB0aGlzLmhlaWdodCA9IDEwMDtcclxuICAgIHRoaXMubG9hZGVkID0gdHJ1ZTtcclxufTtcclxuXHJcbi8vZHJhdyB0aGUgcHJvcFxyXG5Qcm9wLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY2FudmFzU3RhdGUpe1xyXG4gICAgLy9tYWtlcyBzdXJlIHRoYXQgdGhlIGFzc2V0cyBhcmUgbG9hZGVkIGJlZm9yZSBhdHRlbXB0aW5nIHRvIGRyYXcgdGhlbVxyXG4gICAgaWYodGhpcy5sb2FkZWQpe1xyXG4gICAgICAgIGNhbnZhc1N0YXRlLmN0eC5zYXZlKCk7XHJcbiAgICAgICAgLy9zYWZlbHkgYXR0ZW1wdCB0byBkcmF3XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICBpZih0aGlzLm9yaWdXaWR0aCA8IHRoaXMub3JpZ0hlaWdodCl7XHJcbiAgICAgICAgICAgICAgICAvL3VzZSBoZWlnaHQgYXMgc2NhbGluZyBmYWN0b3JcclxuICAgICAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gY2FudmFzU3RhdGUuaGVpZ2h0LzI7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpZHRoID0gdGhpcy5vcmlnV2lkdGggKiAodGhpcy5oZWlnaHQvdGhpcy5vcmlnSGVpZ2h0KTtcclxuICAgICAgICAgICAgfSBlbHNle1xyXG4gICAgICAgICAgICAgICAgLy91c2Ugd2lkdGggYXMgc2NhbGluZyBmYWN0b3JcclxuICAgICAgICAgICAgICAgIHRoaXMud2lkdGggPSBjYW52YXNTdGF0ZS5oZWlnaHQvMjtcclxuICAgICAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy5vcmlnSGVpZ2h0ICogKHRoaXMud2lkdGgvdGhpcy5vcmlnV2lkdGgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHBhaW50ZXIucm91bmRlZFJlY3RhbmdsZShjYW52YXNTdGF0ZS5jdHgsIC10aGlzLndpZHRoLzIsIC1jYW52YXNTdGF0ZS5oZWlnaHQvNiAtIHRoaXMuaGVpZ2h0LzIsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCA1LCAncmdiYSgwLCAwLCAwLCAuNyknLCBcInRyYW5zcGFyZW50XCIsIDApO1xyXG4gICAgICAgICAgICBjYW52YXNTdGF0ZS5jdHguZHJhd0ltYWdlKHRoaXMuaW1hZ2UsIC10aGlzLndpZHRoICogLjg1IC8gMiwgLWNhbnZhc1N0YXRlLmhlaWdodC82IC10aGlzLmhlaWdodCAqIC44NSAvIDIsIHRoaXMud2lkdGggKiAuODUsIHRoaXMuaGVpZ2h0ICogLjg1KTtcclxuICAgICAgICB9IGNhdGNoKGVycm9yKXtcclxuICAgICAgICAgICAgLy91c3VhbGx5IGhpdCBpZiBpbWFnZSBmaWxlcyBsb2FkIHNsb3dseSwgZ2l2ZXMgdGhlbSBhIGNoYW5jZSB0byBsb2FkIGJlZm9yZSBhdHRlbXB0aW5nIHRvIGRyYXdcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJFcnJvcjogUHJvcCBkcmF3IFwiICsgdGhpcy5pbWFnZS5zcmMgKyBcIiAuLi5yZWF0dGVtcHRpbmdcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhbnZhc1N0YXRlLmN0eC5yZXN0b3JlKCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFByb3A7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBEcmF3TGliID0gcmVxdWlyZSgnLi8uLi9saWJyYXJpZXMvRHJhd2xpYi5qcycpO1xyXG52YXIgVXRpbGl0aWVzID0gcmVxdWlyZSgnLi8uLi9saWJyYXJpZXMvVXRpbGl0aWVzLmpzJyk7XHJcblxyXG52YXIgcGFpbnRlcjtcclxudmFyIHV0aWxpdHk7XHJcblxyXG4vL2NvbnN0cnVjdG9yXHJcbmZ1bmN0aW9uIFNjZW5lKHBVcmkpe1xyXG4gICAgLy9oZWxwZXIgbGlicmFyeSBkZWNsYXJhdGlvbnNcclxuICAgIHBhaW50ZXIgPSBuZXcgRHJhd0xpYigpO1xyXG4gICAgdXRpbGl0eSA9IG5ldyBVdGlsaXRpZXMoKTtcclxuICAgIFxyXG4gICAgLy9ib29sOiB3aGV0aGVyIHRoaXMgYXNzZXQgaGFzIGxvYWRlZCBvciBub3RcclxuICAgIHRoaXMubG9hZGVkID0gZmFsc2U7XHJcbiAgICAvL2ltYWdlOiBkYXRhIGZvciB0aGUgaW1hZ2UgYXNzZXQgaXRzZWxmXHJcbiAgICB0aGlzLmltYWdlO1xyXG4gICAgLy9udW1iZXI6IHdpZHRoIG9mIHRoZSBpbWFnZSBhc3NldFxyXG4gICAgdGhpcy53aWR0aDtcclxuICAgIC8vbnVtYmVyOiBoZWlnaHQgb2YgdGhlIGltYWdlIGFzc2V0XHJcbiAgICB0aGlzLmhlaWdodDtcclxuICAgIFxyXG4gICAgLy9jb250YWluZXIgdG8gZGVmaW5lIGxvYWRpbmcgYW5kIHJlc2l6aW5nIGltYWdlIGFzc2V0XHJcbiAgICB2YXIgdGVtcEltYWdlID0gbmV3IEltYWdlKCk7XHJcbiAgICAvL2Fzc2lnbiBsaXN0ZW5lcnMgZm9yIHJlc3BvbmRpbmcgdG8gbG9hZHMgYW5kIGVycm9yc1xyXG4gICAgdGVtcEltYWdlLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBfbG9hZEFjdGlvbi5iaW5kKHRoaXMpLCBmYWxzZSk7XHJcbiAgICB0ZW1wSW1hZ2UuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCBfZXJyb3JBY3Rpb24uYmluZCh0aGlzKSwgZmFsc2UpO1xyXG4gICAgLy9zZXRzIHRoZSBpbWFnZSBzb3VyY2UgYW5kIGJlZ2lucyBsb2FkIGV2ZW50XHJcbiAgICB0ZW1wSW1hZ2Uuc3JjID0gcFVyaTtcclxufVxyXG5cclxuLy9hdHRlbXB0cyB0byBsb2FkIHRoZSBzcGVjaWZpZWQgaW1hZ2VcclxudmFyIF9sb2FkQWN0aW9uID0gZnVuY3Rpb24gKGUpIHtcclxuICAgIHRoaXMuaW1hZ2UgPSBlLnRhcmdldDtcclxuICAgIHRoaXMud2lkdGggPSBlLnRhcmdldC5uYXR1cmFsV2lkdGg7XHJcbiAgICB0aGlzLmhlaWdodCA9IGUudGFyZ2V0Lm5hdHVyYWxIZWlnaHQ7XHJcbiAgICB0aGlzLmxvYWRlZCA9IHRydWU7XHJcbn07XHJcbi8vZmlyZXMgaWYgbG9hZGluZyBpcyB1bnN1Y2Nlc2Z1bCwgYXNzaWducyBhIGd1YXJhbnRlZWQgdGh1bWJuYWlsXHJcbnZhciBfZXJyb3JBY3Rpb24gPSBmdW5jdGlvbihlKXtcclxuICAgIC8vYWxlcnQoXCJUaGVyZSB3YXMgYW4gZXJyb3IgbG9hZGluZyBhbiBpbWFnZS5cIik7XHJcbiAgICB0aGlzLmltYWdlID0gbmV3IEltYWdlKCk7XHJcbiAgICB0aGlzLmltYWdlLnNyYyA9IFwiLi9jb250ZW50L3VpL21pc3NpbmdUaHVtYm5haWwuZ2lmXCI7XHJcbiAgICB0aGlzLndpZHRoID0gMTAwO1xyXG4gICAgdGhpcy5oZWlnaHQgPSAxMDA7XHJcbiAgICB0aGlzLmxvYWRlZCA9IHRydWU7XHJcbn07XHJcblxyXG4vL2RyYXcgdGhlIHNjZW5lXHJcblNjZW5lLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY2FudmFzU3RhdGUpe1xyXG4gICAgLy9tYWtlcyBzdXJlIHRoYXQgdGhlIGFzc2V0cyBhcmUgbG9hZGVkIGJlZm9yZSBhdHRlbXB0aW5nIHRvIGRyYXcgdGhlbVxyXG4gICAgaWYodGhpcy5sb2FkZWQpe1xyXG4gICAgICAgIGNhbnZhc1N0YXRlLmN0eC5zYXZlKCk7XHJcbiAgICAgICAgLy9zYWZlbHkgYXR0ZW1wdCB0byBkcmF3XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICBpZigoY2FudmFzU3RhdGUud2lkdGggLyBjYW52YXNTdGF0ZS5oZWlnaHQpID4gKDE2LzkpKXtcclxuICAgICAgICAgICAgICAgIC8vd2lkZXJcclxuICAgICAgICAgICAgICAgIHRoaXMud2lkdGggPSBjYW52YXNTdGF0ZS53aWR0aDtcclxuICAgICAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gKHRoaXMud2lkdGggLyAxNikgKiA5O1xyXG4gICAgICAgICAgICB9IGVsc2V7XHJcbiAgICAgICAgICAgICAgICAvL3RhbGxlclxyXG4gICAgICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSBjYW52YXNTdGF0ZS5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpZHRoID0gKHRoaXMuaGVpZ2h0IC8gOSkgKiAxNjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYW52YXNTdGF0ZS5jdHguZHJhd0ltYWdlKHRoaXMuaW1hZ2UsIC10aGlzLndpZHRoLzIsIC10aGlzLmhlaWdodC8yLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XHJcbiAgICAgICAgfSBjYXRjaChlcnJvcil7XHJcbiAgICAgICAgICAgIC8vdXN1YWxseSBoaXQgaWYgaW1hZ2UgZmlsZXMgbG9hZCBzbG93bHksIGdpdmVzIHRoZW0gYSBjaGFuY2UgdG8gbG9hZCBiZWZvcmUgYXR0ZW1wdGluZyB0byBkcmF3XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRXJyb3I6IFNjZW5lIGRyYXcgXCIgKyB0aGlzLmltYWdlLnNyYyArIFwiIC4uLnJlYXR0ZW1wdGluZ1wiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2FudmFzU3RhdGUuY3R4LnJlc3RvcmUoKTtcclxuICAgIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2NlbmU7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBEcmF3TGliID0gcmVxdWlyZSgnLi8uLi9saWJyYXJpZXMvRHJhd2xpYi5qcycpO1xyXG52YXIgVXRpbGl0aWVzID0gcmVxdWlyZSgnLi8uLi9saWJyYXJpZXMvVXRpbGl0aWVzLmpzJyk7XHJcblxyXG52YXIgcGFpbnRlcjtcclxudmFyIHV0aWxpdHk7XHJcblxyXG4vL2NvbnN0cnVjdG9yXHJcbmZ1bmN0aW9uIFNwcml0ZShwRXhwcmVzc2lvbiwgcFRhcmdldCwgcEluY29taW5nRnVuY3Rpb24pe1xyXG4gICAgLy9oZWxwZXIgbGlicmFyeSBkZWNsYXJhdGlvbnNcclxuICAgIHBhaW50ZXIgPSBuZXcgRHJhd0xpYigpO1xyXG4gICAgdXRpbGl0eSA9IG5ldyBVdGlsaXRpZXMoKTtcclxuICAgIFxyXG4gICAgXHJcbiAgICAvL2Jvb2w6IHdoZXRoZXIgdGhpcyBhc3NldCBoYXMgbG9hZGVkIG9yIG5vdFxyXG4gICAgdGhpcy5sb2FkZWQgPSBmYWxzZTtcclxuICAgIC8vc3RyaW5nOiB0aGUgbmFtZSBhc3NvY2lhdGVkIHdpdGggdGhlIGV4cHJlc3Npb24gcmVwcmVzZW50ZWQgYnkgdGhpcyBzcHJpdGVcclxuICAgIHRoaXMuZXhwcmVzc2lvbiA9IHBFeHByZXNzaW9uO1xyXG4gICAgLy9zdHJpbmc6IHRoZSBuYW1lIG9mIHRoZSBhY3RvciB0aWVkIHRvIHRoaXMgc3ByaXRlXHJcbiAgICB0aGlzLnRhcmdldCA9IHBUYXJnZXQ7XHJcbiAgICAvL2Z1bmN0aW9uOiByZXBvcnRzIHRvIGFjdG9yIHdoZW4gbG9hZGluZyBpcyBjb21wbGV0ZVxyXG4gICAgdGhpcy5yZXBvcnQgPSBwSW5jb21pbmdGdW5jdGlvbjtcclxuICAgIFxyXG4gICAgLy9jb250YWluZXIgdG8gZGVmaW5lIGxvYWRpbmcgYW5kIHJlc2l6aW5nIGltYWdlIGFzc2V0XHJcbiAgICB2YXIgdGVtcEltYWdlID0gbmV3IEltYWdlKCk7XHJcbiAgICAvL2Fzc2lnbiBsaXN0ZW5lcnMgZm9yIHJlc3BvbmRpbmcgdG8gbG9hZHMgYW5kIGVycm9yc1xyXG4gICAgdGVtcEltYWdlLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBfbG9hZEFjdGlvbi5iaW5kKHRoaXMpLCBmYWxzZSk7XHJcbiAgICB0ZW1wSW1hZ2UuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCBfZXJyb3JBY3Rpb24uYmluZCh0aGlzKSwgZmFsc2UpO1xyXG4gICAgLy9zZXRzIGltYWdlIHNvdXJjZSBhbmQgYmVnaW5zIGxvYWQgZXZlbnRcclxuICAgIHRlbXBJbWFnZS5zcmMgPSBcIi4vY29udGVudC9hY3Rvci9cIiArIHRoaXMudGFyZ2V0ICsgXCIvXCIgKyB0aGlzLmV4cHJlc3Npb24gKyBcIi5wbmdcIjtcclxufVxyXG5cclxuLy9hdHRlbXB0cyB0byBsb2FkIHRoZSBzcGVjaWZpZWQgaW1hZ2VcclxudmFyIF9sb2FkQWN0aW9uID0gZnVuY3Rpb24gKGUpIHtcclxuICAgIHRoaXMuaW1hZ2UgPSBlLnRhcmdldDtcclxuICAgIHRoaXMud2lkdGggPSBlLnRhcmdldC5uYXR1cmFsV2lkdGg7XHJcbiAgICB0aGlzLmhlaWdodCA9IGUudGFyZ2V0Lm5hdHVyYWxIZWlnaHQ7XHJcbiAgICB0aGlzLmxvYWRlZCA9IHRydWU7XHJcbiAgICBcclxuICAgIC8vbGV0IGFjdG9yIGtub3cgdGhhdCBsb2FkaW5nIGlzIGNvbXBsZXRlXHJcbiAgICB0aGlzLnJlcG9ydCgpO1xyXG59O1xyXG4vL2ZpcmVzIGlmIGxvYWRpbmcgaXMgdW5zdWNjZXNmdWwsIGFzc2lnbnMgYSBndWFyYW50ZWVkIHRodW1ibmFpbFxyXG52YXIgX2Vycm9yQWN0aW9uID0gZnVuY3Rpb24oZSl7XHJcbiAgICAvL2FsZXJ0KFwiVGhlcmUgd2FzIGFuIGVycm9yIGxvYWRpbmcgYW4gaW1hZ2UuXCIpO1xyXG4gICAgdGhpcy5pbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG4gICAgdGhpcy5pbWFnZS5zcmMgPSBcIi4vY29udGVudC91aS9taXNzaW5nVGh1bWJuYWlsLmdpZlwiO1xyXG4gICAgdGhpcy53aWR0aCA9IDEwMDtcclxuICAgIHRoaXMuaGVpZ2h0ID0gMTAwO1xyXG4gICAgdGhpcy5sb2FkZWQgPSB0cnVlO1xyXG4gICAgXHJcbiAgICB0aGlzLnJlcG9ydCgpO1xyXG59O1xyXG5cclxuLy9kcmF3IHRoZSBzY2VuZVxyXG5TcHJpdGUucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjYW52YXNTdGF0ZSwgcG9zaXRpb24sIGFjdGl2ZSwgZm9jdXMpe1xyXG4gICAgLy9tYWtlcyBzdXJlIHRoYXQgdGhlIGFzc2V0cyBhcmUgbG9hZGVkIGJlZm9yZSBhdHRlbXB0aW5nIHRvIGRyYXcgdGhlbVxyXG4gICAgaWYodGhpcy5sb2FkZWQpe1xyXG4gICAgICAgIGNhbnZhc1N0YXRlLmN0eC5zYXZlKCk7XHJcbiAgICAgICAgLy9zYWZlbHkgYXR0ZW1wdCB0byBkcmF3XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICBpZihhY3RpdmUpe1xyXG4gICAgICAgICAgICAgICAgaWYoZm9jdXMpe1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbnZhc1N0YXRlLmN0eC5zaGFkb3dDb2xvciA9ICcjMWI4MWU1JztcclxuICAgICAgICAgICAgICAgICAgICBjYW52YXNTdGF0ZS5jdHguc2hhZG93Qmx1ciA9IDc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vZXN0YWJsaXNoIGFjdHVhbCBwb3NpdGlvblxyXG4gICAgICAgICAgICAgICAgdmFyIGRyYXdQb3MgPSAtMSAqIHV0aWxpdHkubWFwKHBvc2l0aW9uLCAtMTAwLCAxMDAsIGNhbnZhc1N0YXRlLndpZHRoICogLS41LCBjYW52YXNTdGF0ZS53aWR0aCAqIC41KTtcclxuICAgICAgICAgICAgICAgIC8vZXN0YWJsaXNoIGRpcmVjdGlvblxyXG4gICAgICAgICAgICAgICAgdmFyIGRpcmVjdGlvbiA9IDE7XHJcbiAgICAgICAgICAgICAgICBpZihwb3NpdGlvbiA+IDApe1xyXG4gICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IC0xO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNle1xyXG4gICAgICAgICAgICAgICAgICAgIGRyYXdQb3MgPSBkcmF3UG9zICogLTE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvL3NjYWxlIGRyYXcgZGltZW5zaW9ucyB0byBlbnN1cmUgcHJvcGVyIHNjcmVlbiBjb3ZlcmFnZVxyXG4gICAgICAgICAgICAgICAgdmFyIHByZXZpb3VzSGVpZ2h0ID0gdGhpcy5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhlaWdodCA9IGNhbnZhc1N0YXRlLmhlaWdodCAqIC44O1xyXG4gICAgICAgICAgICAgICAgdGhpcy53aWR0aCA9IHRoaXMud2lkdGggKiAodGhpcy5oZWlnaHQvcHJldmlvdXNIZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvL3NjYWxlIHRvIGZsaXAgcmV2ZXJzZWQgaW1hZ2VcclxuICAgICAgICAgICAgICAgIGNhbnZhc1N0YXRlLmN0eC5zY2FsZShkaXJlY3Rpb24sIDEpO1xyXG4gICAgICAgICAgICAgICAgY2FudmFzU3RhdGUuY3R4LmRyYXdJbWFnZSh0aGlzLmltYWdlLCBkcmF3UG9zIC0gdGhpcy53aWR0aC8yLCBjYW52YXNTdGF0ZS5oZWlnaHQvMiAtIHRoaXMuaGVpZ2h0LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vaWYgZm9jdXNlZCwgZHJhdyB0aGUgaW1hZ2UgbXVsdGlwbGUgdGltZXMgdG8gbWFrZSB0aGUgc2hhZG93IG91dGxpbmUgbW9yZSBpbnRlbnNlXHJcbiAgICAgICAgICAgICAgICAvL3Byb2JhYmx5IGhvcnJpYmxlIGluZWZmaWNpZW50IGJ1dCBjdXJzb3J5IHJlc2VhcmNoIHR1cm5zIHVwIG5vdGhpbmdcclxuICAgICAgICAgICAgICAgIGlmKGZvY3VzKXtcclxuICAgICAgICAgICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgMzsgaSsrKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FudmFzU3RhdGUuY3R4LmRyYXdJbWFnZSh0aGlzLmltYWdlLCBkcmF3UG9zIC0gdGhpcy53aWR0aC8yLCBjYW52YXNTdGF0ZS5oZWlnaHQvMiAtIHRoaXMuaGVpZ2h0LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaChlcnJvcil7XHJcbiAgICAgICAgICAgIC8vdXN1YWxseSBoaXQgaWYgaW1hZ2UgZmlsZXMgbG9hZCBzbG93bHksIGdpdmVzIHRoZW0gYSBjaGFuY2UgdG8gbG9hZCBiZWZvcmUgYXR0ZW1wdGluZyB0byBkcmF3XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRXJyb3I6IFNwcml0ZSBkcmF3IFwiICsgdGhpcy5pbWFnZS5zcmMgKyBcIiAuLi5yZWF0dGVtcHRpbmdcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhbnZhc1N0YXRlLmN0eC5yZXN0b3JlKCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNwcml0ZTsiXX0=
