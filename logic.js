"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameInfo = exports.BlockInfo = void 0;
//const bigDecimal = require('js-big-decimal')
//import bigDecimal = require('js-big-decimal');
var big_js_1 = require("big.js");
var BlockInfo = /** @class */ (function () {
    function BlockInfo(targetBlock) {
        //index in tower
        this.targetBlock = targetBlock;
        this.index = (this.targetBlock ? this.targetBlock.index : 0) + 1;
        //size and position
        if (!this.targetBlock) {
            this.dimensions = { width: new big_js_1.default('10'), height: new big_js_1.default('2'), depth: new big_js_1.default('10') };
            this.position = { x: new big_js_1.default(0), y: new big_js_1.default(this.index), z: new big_js_1.default(0) };
        }
        else {
            this.dimensions = { width: this.targetBlock.dimensions.width, height: this.targetBlock.dimensions.height, depth: this.targetBlock.dimensions.depth };
            this.position = { x: this.targetBlock.position.x, y: this.targetBlock.position.y.mul(this.index), z: this.targetBlock.position.z };
            this.position.y = this.dimensions.height.times(this.index);
        }
        // state
        this.state = this.index > 1 ? BlockInfo.STATES.ACTIVE : BlockInfo.STATES.STOPPED;
        //movement
        var speed = new big_js_1.default('-0.1').minus(new big_js_1.default(this.index).times('0.005'));
        //let speed = -0.1 - (this.index * 0.005);
        if (speed.lte(-4)) {
            speed = new big_js_1.default('-4');
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
exports.BlockInfo = BlockInfo;
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
exports.GameInfo = GameInfo;
