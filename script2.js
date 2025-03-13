"use strict";
//import {BlockInfo, GameInfo} from "./logic";



/////
//const Big = require("big.js");


"use strict";
/////////////////////


var BlockInfo = /** @class */ (function () {
    function BlockInfo(targetBlock) {
        //index in tower
        this.targetBlock = targetBlock;
        this.index = (this.targetBlock ? this.targetBlock.index : 0) + 1;
        //size and position
        if (!this.targetBlock) {
            this.dimensions = { width: new Big.default('10'), height: new Big.default('2'), depth: new Big.default('10') };
            this.position = { x: new Big.default(0), y: this.dimensions.height.mul(this.index), z: new Big.default(0) };
        }
        else {
            this.dimensions = { width: this.targetBlock.dimensions.width, height: this.targetBlock.dimensions.height, depth: this.targetBlock.dimensions.depth };
            this.position = { x: this.targetBlock.position.x, y: this.dimensions.height.mul(this.index), z: this.targetBlock.position.z };
            this.position.y = this.dimensions.height.times(this.index);
        }
        // state
        this.state = this.index > 1 ? BlockInfo.STATES.ACTIVE : BlockInfo.STATES.STOPPED;
        //movement
        var speed = new Big.default('-0.1').minus(new Big.default(this.index).times('0.005'));
        //let speed = -0.1 - (this.index * 0.005);
        if (speed.lte(-4)) {
            speed = new Big.default('-4');
        }
        this.movement = {
            speed: speed,
            direction: speed,
            workingDimension: this.index % 2 ? 'width' : 'depth',
            workingPlane: this.index % 2 ? 'x' : 'z'
        };
        if (this.state === BlockInfo.STATES.ACTIVE) {
            // this.position[this.workingPlane] = Math.random() > 0.5 ? -this.MOVE_AMOUNT : this.MOVE_AMOUNT;
            this.position[this.movement.workingPlane] = this.position[this.movement.workingPlane].minus(BlockInfo.MOVE_AMOUNT); //remove random
        }
    }
    BlockInfo.prototype.reverseDirection = function () {
        this.movement.direction = this.movement.direction.gt('0') ? this.movement.speed : this.movement.speed.abs();
    };
    BlockInfo.prototype.place = function () {
        this.state = BlockInfo.STATES.STOPPED;
        var workingPlane = this.movement.workingPlane;
        var workingDimension = this.movement.workingDimension;
        var overlap = this.targetBlock.dimensions[workingDimension]
            .minus((this.position[workingPlane].minus(this.targetBlock.position[workingPlane])).abs());
        var bonus = false;
        //let overlap = this.targetBlock.dimension[this.workingDimension] - Math.abs(this.position[this.workingPlane] - this.targetBlock.position[this.workingPlane]);
        //if overlap < 0.3, consider it perfect alignment
        if (overlap.lte('0')) {
            this.state = BlockInfo.STATES.MISSED;
        }
        else if (this.dimensions[workingDimension].minus(overlap).lt('0.3')) {
            overlap = this.dimensions[workingDimension];
            bonus = true;
            this.position.x = this.targetBlock.position.x;
            this.position.z = this.targetBlock.position.z;
            this.dimensions.width = this.targetBlock.dimensions.width;
            this.dimensions.depth = this.targetBlock.dimensions.depth;
        }
        if (this.position[workingPlane].lt(this.targetBlock.position[workingPlane])) {
            this.position[workingPlane] = this.targetBlock.position[workingPlane];
        }
        this.dimensions[workingDimension] = overlap;
        return {
            overlap: overlap,
            bonus: bonus
        };
    };
    BlockInfo.prototype.tick = function () {
        if (this.state === BlockInfo.STATES.ACTIVE) {
            var value = this.position[this.movement.workingPlane];
            if (value.gt(BlockInfo.MOVE_AMOUNT) || value.lt(-BlockInfo.MOVE_AMOUNT)) {
                this.reverseDirection();
            }
            //this.position[this.movement.workingPlane] += this.direction;
            this.position[this.movement.workingPlane] = this.position[this.movement.workingPlane].add(this.movement.direction);
        }
    };
    BlockInfo.STATES = { ACTIVE: 'active', STOPPED: 'stopped', MISSED: 'missed' };
    BlockInfo.MOVE_AMOUNT = 12;
    return BlockInfo;
}());

var GameInfo = /** @class */ (function () {
    function GameInfo() {
        this.blocks = [];
        this.over = false;
        this.history = [];
    }
    GameInfo.prototype.move = function () {
        var currentBlock = this.blocks[this.blocks.length - 1];
        var overlapInfo = currentBlock.place();
        var addedBlock = this.addBlock();
        this.history.push(this.ticksSinceLastMove);
        this.ticksSinceLastMove = 0;
        return {
            addedBlock: addedBlock,
            overlapInfo: overlapInfo
        };
    };
    GameInfo.prototype.addBlock = function () {
        var lastBlock = this.blocks[this.blocks.length - 1];
        //game over, no new block
        if (lastBlock && lastBlock.state == BlockInfo.STATES.MISSED) {
            this.over = true;
            return null;
        }
        //generate new block with target as last block
        var newKidOnTheBlock = new BlockInfo(lastBlock);
        this.blocks.push(newKidOnTheBlock);
        return newKidOnTheBlock;
    };
    GameInfo.prototype.tick = function () {
        this.blocks[this.blocks.length - 1].tick();
        if (!this.ticksSinceLastMove) {
            this.ticksSinceLastMove = 1;
        }
        else {
            this.ticksSinceLastMove = this.ticksSinceLastMove + 1;
        }
    };
    return GameInfo;
}());





/////
console.clear();
class Stage {
    constructor() {
        // container
        this.render = function () {
            this.renderer.render(this.scene, this.camera);
        };
        this.add = function (elem) {
            this.scene.add(elem);
        };
        this.remove = function (elem) {
            this.scene.remove(elem);
        };
        this.container = document.getElementById('game');
        // renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setClearColor( 0xffffff, 0 );
        //this.renderer.setClearColorHex( 0x000000, 1 );

// => change it to
        //this.renderer.setClearColorHex( 0xffffff, 1 );

        this.renderer.setSize(window.innerWidth, window.innerHeight);
      //  this.renderer.setClearColor('#D0CBC7', 1);
        this.container.appendChild(this.renderer.domElement);
        // scene
        this.scene = new THREE.Scene();
       // this.scene.background = new THREE.Color( 0xff0000 );
        // camera
        let aspect = window.innerWidth / window.innerHeight;
        let d = 20;
        this.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, -100, 1000);
        this.camera.position.x = 2;
        this.camera.position.y = 2;
        this.camera.position.z = 2;
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        //light
        this.light = new THREE.DirectionalLight(0xffffff, 0.5);
        this.light.position.set(0, 499, 0);
        this.scene.add(this.light);
        this.softLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(this.softLight);
        window.addEventListener('resize', () => this.onResize());
        this.onResize();
    }
    setCamera(y, speed = 0.3) {
        TweenLite.to(this.camera.position, speed, { y: y + 4, ease: Power1.easeInOut });
        TweenLite.to(this.camera.lookAt, speed, { y: y, ease: Power1.easeInOut });
    }
    onResize() {
        let viewSize = 30;
        this.renderer.setSize(window.innerWidth , window.innerHeight);
        this.camera.left = window.innerWidth / -viewSize;
        this.camera.right = window.innerWidth / viewSize;
        this.camera.top = window.innerHeight / viewSize;
        this.camera.bottom = window.innerHeight / -viewSize;
        this.camera.updateProjectionMatrix();
    }
}
class Block {

    Big
    constructor(blockInfo, block) {

        this.setBlockInfo(blockInfo);
        this.setColor(block);
        this.setGeometry();
    }

    setBlockInfo(blockInfo) {
        console.log(blockInfo);
        console.log(blockInfo.index);
        this.blockInfo = blockInfo;
        this.dimension = {
            height : blockInfo.dimensions.height.toNumber(),
            width: blockInfo.dimensions.width.toNumber(),
            depth: blockInfo.dimensions.depth.toNumber()
        };
        this.position = {
            x: blockInfo.position.x.toNumber() ,
            y : blockInfo.position.y.toNumber(),
            z: blockInfo.position.z.toNumber()
        }
        console.log(this.position);
        //this.position = blockInfo.position;
        this.workingDimension = blockInfo.movement.workingDimension
        this.workingPlane = blockInfo.movement.workingPlane;
       // this.setColor();
       // this.setGeometry();
    }
    setColor(prevBlock) {
        console.log(prevBlock);
        this.colorOffset = prevBlock ? prevBlock.colorOffset : Math.round(Math.random() * 100);
        // set color
        if (!prevBlock) {
            this.color = 0x333344;
        }
        else {
            let offset = this.blockInfo.index + this.colorOffset;
            var r = Math.sin(0.3 * offset) * 55 + 200;
            var g = Math.sin(0.3 * offset + 2) * 55 + 200;
            var b = Math.sin(0.3 * offset + 4) * 55 + 200;
            this.color = new THREE.Color(r / 255, g / 255, b / 255);
        }
    }

    setGeometry() {
        // create block
        let geometry = new THREE.BoxGeometry(this.dimension.width, this.dimension.height, this.dimension.depth);
        geometry.applyMatrix(new THREE.Matrix4().makeTranslation(this.dimension.width / 2, this.dimension.height / 2, this.dimension.depth / 2));
        this.material = new THREE.MeshToonMaterial({ color: this.color, shading: THREE.FlatShading });

        const loader = new THREE.TextureLoader();
        const files = ['crab.jpg', 'succinctHat2.jpg', 'yinger.png', 'captain-uma.webp'];
        const filePath = 'assets/' +  files[this.blockInfo.index%files.length];
        const texture = loader.load( filePath );
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        this.material = new THREE.MeshBasicMaterial({
            shading: THREE.FlatShading,
            color: this.color,
            map: texture,
        });


        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.set(this.position.x, this.position.y + (this.blockInfo.state === BlockInfo.STATES.ACTIVE ? 0 : 0), this.position.z);
        return this.mesh;
    }

    setPlaced0(overlapInfo) {
        this.state = BlockInfo.STATES.STOPPED;
        let overlap = overlapInfo.overlap;
       // let overlap = this.targetBlock.dimension[this.workingDimension] - Math.abs(this.position[this.workingPlane] - this.targetBlock.position[this.workingPlane]);
        let blocksToReturn = {
            plane: this.workingPlane,
            direction: this.direction
        };
        //if overlap < 0.3, consider it perfect alignment
       /* if (this.dimension[this.workingDimension] - overlap < 0.3) {
            overlap = this.dimension[this.workingDimension];
            blocksToReturn.bonus = true;
            this.position.x = this.targetBlock.position.x;
            this.position.z = this.targetBlock.position.z;
            this.dimension.width = this.targetBlock.dimension.width;
            this.dimension.depth = this.targetBlock.dimension.depth;
        }*/
        //if not a complete miss...
        //(overlap = amount of overlap/match in moving/working direction)
        if (overlap > 0) {
            let choppedDimensions = { width: this.dimension.width, height: this.dimension.height, depth: this.dimension.depth };
            choppedDimensions[this.workingDimension] -= overlap;
            this.dimension[this.workingDimension] = overlap;
            let placedGeometry = new THREE.BoxGeometry(this.dimension.width, this.dimension.height, this.dimension.depth);
            placedGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(this.dimension.width / 2, this.dimension.height / 2, this.dimension.depth / 2));
            let placedMesh = new THREE.Mesh(placedGeometry, this.material);
            let choppedGeometry = new THREE.BoxGeometry(choppedDimensions.width, choppedDimensions.height, choppedDimensions.depth);
            choppedGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(choppedDimensions.width / 2, choppedDimensions.height / 2, choppedDimensions.depth / 2));
            let choppedMesh = new THREE.Mesh(choppedGeometry, this.material);
            let choppedPosition = {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z
            };
            if (this.blockInfo.position[this.workingPlane] < this.blockInfo.targetBlock.position[this.workingPlane]) {
                //remthis.position[this.workingPlane] = this.targetBlock.position[this.workingPlane];
            }
            else {
                choppedPosition[this.workingPlane] += overlap;
            }
            placedMesh.position.set(this.position.x, this.position.y, this.position.z);
            choppedMesh.position.set(choppedPosition.x, choppedPosition.y, choppedPosition.z);
            blocksToReturn.placed = placedMesh;
            if (!blocksToReturn.bonus)
                blocksToReturn.chopped = choppedMesh;
        }
        //complete miss
        else {
            this.state = BlockInfo.STATES.MISSED;
        }
        //remthis.dimension[this.workingDimension] = overlap;
        this.setBlockInfo(this.blockInfo);
        return blocksToReturn;
    }


    setPlaced(overlapInfo) {
       // let overlapInfo = this.blockInfo.place();
        const unplacedPos = this.position;
        const unplacedDim = this.dimension;
        this.setBlockInfo(this.blockInfo);
        let overlap = overlapInfo.overlap.toNumber();
        let blocksToReturn = {
            plane: this.workingPlane,
            direction: this.direction
        };
        console.log('OVERLAP: ' + overlap);
        //if not a complete miss...
        //(overlap = amount of overlap/match in moving/working direction)
        if (overlap > 0) {
            let choppedDimensions = { width: unplacedDim.width, height: unplacedDim.height, depth: unplacedDim.depth };
            choppedDimensions[this.workingDimension] -= overlap;
            this.dimension[this.workingDimension] = overlap;
            let placedGeometry = new THREE.BoxGeometry(this.dimension.width, this.dimension.height, this.dimension.depth);
            placedGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(this.dimension.width / 2, this.dimension.height / 2, this.dimension.depth / 2));
            let placedMesh = new THREE.Mesh(placedGeometry, this.material);
            let choppedGeometry = new THREE.BoxGeometry(choppedDimensions.width, choppedDimensions.height, choppedDimensions.depth);
            choppedGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(choppedDimensions.width / 2, choppedDimensions.height / 2, choppedDimensions.depth / 2));
            let choppedMesh = new THREE.Mesh(choppedGeometry, this.material);
            let choppedPosition = {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z
            };
            if (unplacedPos[this.workingPlane] < this.blockInfo.targetBlock.position[this.workingPlane].toNumber()) {
               ////??? this.position[this.workingPlane] = this.targetBlock.position[this.workingPlane];
            }
            else {
                choppedPosition[this.workingPlane] += overlap;
            }

            /*if (this.blockInfo.position[this.workingPlane].eq(this.blockInfo.targetBlock.position[this.workingPlane])) {
                choppedPosition[this.workingPlane] += overlap;
            }*/
            placedMesh.position.set(this.position.x, this.position.y, this.position.z);
            choppedMesh.position.set(choppedPosition.x, choppedPosition.y, choppedPosition.z);
            blocksToReturn.placed = placedMesh;
            if (!overlapInfo.bonus)
                blocksToReturn.chopped = choppedMesh;
        }
        //complete miss
        else {
            //this.state = this.STATES.MISSED;
        }
        this.dimension[this.workingDimension] = overlap;
        return blocksToReturn;
    }
    tick() {
        if (this.blockInfo.state === BlockInfo.STATES.ACTIVE) {
            //this.blockInfo.tick();
            this.setBlockInfo(this.blockInfo);
            this.mesh.position[this.workingPlane] = this.position[this.workingPlane];
        }
    }
}

let game;
class Game {
    constructor() {
        this.gameInfo = new GameInfo();
        this.STATES = {
            'LOADING': 'loading',
            'PLAYING': 'playing',
            'READY': 'ready',
            'ENDED': 'ended',
            'RESETTING': 'resetting'
        };
        this.blocks = [];
        this.state = this.STATES.LOADING;
        this.stage = new Stage();
        this.mainContainer = document.getElementById('container');
        this.scoreContainer = document.getElementById('score');
        this.startButton = document.getElementById('start-button');
        this.instructions = document.getElementById('instructions');
        this.scoreContainer.innerHTML = '0';
        this.newBlocks = new THREE.Group();
        this.placedBlocks = new THREE.Group();
        this.choppedBlocks = new THREE.Group();
        this.stage.add(this.newBlocks);
        this.stage.add(this.placedBlocks);
        this.stage.add(this.choppedBlocks);
        this.addBlock();
        this.tick();
        this.updateState(this.STATES.READY);
        document.addEventListener('keydown', e => {
            if (e.keyCode == 32)
                this.onAction();
        });
        document.addEventListener('click', e => {
            this.onAction();
        });
        document.addEventListener('touchstart', e => {
            e.preventDefault();
            // this.onAction();
            // this triggers after click on android so you
            // insta-lose, will figure it out later.
        });
    }
    updateState(newState) {
        for (let key in this.STATES)
            this.mainContainer.classList.remove(this.STATES[key]);
        this.mainContainer.classList.add(newState);
        this.state = newState;
    }
    onAction() {
        switch (this.state) {
            case this.STATES.READY:
                this.startGame();
                break;
            case this.STATES.PLAYING:
                this.placeBlock();
                break;
            case this.STATES.ENDED:
                //this.restartGame();
                //window.sendScores();
                break;
        }
    }
    startGame() {
        if (this.state != this.STATES.PLAYING) {
            this.scoreContainer.innerHTML = '0';
            this.updateState(this.STATES.PLAYING);
            this.addBlock();
        }
    }
    restartGame() {
        this.updateState(this.STATES.RESETTING);
        let oldBlocks = this.placedBlocks.children;
        let removeSpeed = 0.2;
        let delayAmount = 0.02;
        for (let i = 0; i < oldBlocks.length; i++) {
            TweenLite.to(oldBlocks[i].scale, removeSpeed, { x: 0, y: 0, z: 0, delay: (oldBlocks.length - i) * delayAmount, ease: Power1.easeIn, onComplete: () => this.placedBlocks.remove(oldBlocks[i]) });
            TweenLite.to(oldBlocks[i].rotation, removeSpeed, { y: 0.5, delay: (oldBlocks.length - i) * delayAmount, ease: Power1.easeIn });
        }
        let cameraMoveSpeed = removeSpeed * 2 + (oldBlocks.length * delayAmount);
        this.stage.setCamera(2, cameraMoveSpeed);
        let countdown = { value: this.blocks.length - 1 };
        TweenLite.to(countdown, cameraMoveSpeed, { value: 0, onUpdate: () => { this.scoreContainer.innerHTML = String(Math.round(countdown.value)); } });

        //const print = ()
        window.sendScores();
        //
       /* this.gameInfo = new GameInfo();
        this.blocks = this.blocks.slice(0, 1);
        //this.blocks = [];
        this.state = this.STATES.LOADING;

        //this.stage = new Stage();
        this.scoreContainer.innerHTML = '0';
        this.newBlocks = new THREE.Group();
        this.placedBlocks = new THREE.Group();
        this.choppedBlocks = new THREE.Group();
        this.stage.add(this.newBlocks);
        this.stage.add(this.placedBlocks);
        this.stage.add(this.choppedBlocks);
        this.addBlock();
        this.tick();
        this.updateState(this.STATES.READY);*/
        //

        //this.blocks = [];
        //game = new Game();
       // this.stage.
        //game.stage = this.stage;
        /*setTimeout(() => {
            game.startGame();
        }, cameraMoveSpeed * 1000);*/
    }
    placeBlock() {
        const res = this.gameInfo.move();
        let currentBlock = this.blocks[this.blocks.length - 1];
        let newBlocks = currentBlock.setPlaced(res.overlapInfo);
        this.newBlocks.remove(currentBlock.mesh);
        if (newBlocks.placed)
            this.placedBlocks.add(newBlocks.placed);
        if (newBlocks.chopped) {
            this.choppedBlocks.add(newBlocks.chopped);
            let positionParams = { y: '-=30', ease: Power1.easeIn, onComplete: () => this.choppedBlocks.remove(newBlocks.chopped) };
            let rotateRandomness = 10;
            let rotationParams = {
                delay: 0.05,
                x: newBlocks.plane == 'z' ? ((Math.random() * rotateRandomness) - (rotateRandomness / 2)) : 0.1,
                z: newBlocks.plane == 'x' ? ((Math.random() * rotateRandomness) - (rotateRandomness / 2)) : 0.1,
                y: Math.random() * 0.1,
            };
            if (newBlocks.chopped.position[newBlocks.plane] > newBlocks.placed.position[newBlocks.plane]) {
                positionParams[newBlocks.plane] = '+=' + (40 * Math.abs(newBlocks.direction));
            }
            else {
                positionParams[newBlocks.plane] = '-=' + (40 * Math.abs(newBlocks.direction));
            }
            TweenLite.to(newBlocks.chopped.position, 1, positionParams);
            TweenLite.to(newBlocks.chopped.rotation, 1, rotationParams);
        }
        this.addBlock(res.addedBlock);
    }
    addBlock(newBlockInfo) {

        if (this.gameInfo.over) {
            return this.endGame();
        }
        /*let lastBlock = this.blocks[this.blocks.length - 1];
        if (lastBlock && lastBlock.state == lastBlock.STATES.MISSED) {
            return this.endGame();
        }*/
        if (!newBlockInfo) {
            newBlockInfo = this.gameInfo.addBlock();
        }

        this.scoreContainer.innerHTML = String(this.gameInfo.blocks.length - 1);
        let lastBlock = this.blocks[this.blocks.length - 1];
        let newKidOnTheBlock = new Block(newBlockInfo, lastBlock);
        this.newBlocks.add(newKidOnTheBlock.mesh);
        this.blocks.push(newKidOnTheBlock);
        this.stage.setCamera(this.blocks.length * 2);
        if (this.blocks.length >= 5)
            this.instructions.classList.add('hide');
    }
    endGame() {

      //  alert("game is over");
       // alert(this.gameInfo.history);
        this.updateState(this.STATES.ENDED);
        setTimeout(() => {
            document.querySelector('button#proofButton').click();
        } , 2000);
    }
    tick() {
        this.gameInfo.tick();
        this.blocks[this.blocks.length - 1].tick();
        this.stage.render();
        requestAnimationFrame(() => { this.tick(); });
    }
}
game = new Game();



//////
