//const bigDecimal = require('js-big-decimal')
//import bigDecimal = require('js-big-decimal');
import Big from 'big.js';

type Dimensions = {
    width : Big,
    height : Big,
    depth : Big
}

type Position = {
    x : Big,
    y : Big,
    z : Big
}

type Movement = {
    speed : Big,
    direction : Big,
    workingPlane : string,
    workingDimension : string
}

export class BlockInfo {

    static STATES = { ACTIVE: 'active', STOPPED: 'stopped', MISSED: 'missed' };
    static MOVE_AMOUNT = 12;

    public targetBlock : BlockInfo;
    public index : number;

    public dimensions : Dimensions;
    public position : Position;
    public movement : Movement;

    public state : string;

    public constructor(targetBlock ?: BlockInfo) {

        //index in tower
        this.targetBlock = targetBlock;
        this.index = (this.targetBlock ? this.targetBlock.index : 0) + 1;

        //size and position
        if (!this.targetBlock) {
            this.dimensions = {width : new Big('10'), height: new Big('2'), depth : new Big('10') };
            this.position = {x : new Big(0), y : this.dimensions.height.mul(this.index), z : new Big(0) };
        } else {
            this.dimensions = {width: this.targetBlock.dimensions.width, height: this.targetBlock.dimensions.height, depth: this.targetBlock.dimensions.depth};
            this.position = {x: this.targetBlock.position.x, y: this.dimensions.height.mul(this.index), z: this.targetBlock.position.z};
            this.position.y = this.dimensions.height.times(this.index);
        }

        // state
        this.state = this.index > 1 ? BlockInfo.STATES.ACTIVE : BlockInfo.STATES.STOPPED;

        //movement
        let speed = new Big('-0.1').minus(new Big(this.index).times('0.005'));
        //let speed = -0.1 - (this.index * 0.005);
        if (speed.lte(-4)) {
            speed = new Big('-4');
        }
        this.movement = {
            speed : speed,
            direction : speed,
            workingDimension : this.index % 2 ? 'width' : 'depth',
            workingPlane: this.index % 2 ? 'x' : 'z'
        }

        if (this.state === BlockInfo.STATES.ACTIVE) {
            // this.position[this.workingPlane] = Math.random() > 0.5 ? -this.MOVE_AMOUNT : this.MOVE_AMOUNT;
            this.position[this.movement.workingPlane] =  this.position[this.movement.workingPlane].minus(BlockInfo.MOVE_AMOUNT); //remove random
        }
    }

    private reverseDirection() {
        this.movement.direction = this.movement.direction.gt('0') ? this.movement.speed : this.movement.speed.abs();
    }

    public place() {
        this.state = BlockInfo.STATES.STOPPED;
        let workingPlane = this.movement.workingPlane;
        let workingDimension = this.movement.workingDimension;
        let overlap = this.targetBlock.dimensions[workingDimension]
            .minus((this.position[workingPlane].minus(this.targetBlock.position[workingPlane])).abs());
        let bonus = false;
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
        if (this.position[workingPlane].lt( this.targetBlock.position[workingPlane])) {
            this.position[workingPlane] = this.targetBlock.position[workingPlane];
        }
        this.dimensions[workingDimension] = overlap;
        return {
            overlap : overlap,
            bonus : bonus
        };
    }

    public tick() {
        if (this.state === BlockInfo.STATES.ACTIVE) {
            let value : Big = this.position[this.movement.workingPlane];
            if (value.gt(BlockInfo.MOVE_AMOUNT) || value.lt(-BlockInfo.MOVE_AMOUNT)) {
                this.reverseDirection();
            }
            //this.position[this.movement.workingPlane] += this.direction;
            this.position[this.movement.workingPlane] = (<Big>this.position[this.movement.workingPlane]).add(this.movement.direction);
        }
    }
}

export class GameInfo {

    public blocks : BlockInfo[] = [];
    public over : boolean = false ;
    public history : number[] = [];
    public ticksSinceLastMove : number;

    public constructor() {

    }
    public move() {
        let currentBlock = this.blocks[this.blocks.length - 1];
        let overlapInfo = currentBlock.place();
        let addedBlock = this.addBlock();
        this.history.push(this.ticksSinceLastMove);
        this.ticksSinceLastMove = 0;
        return {
            addedBlock : addedBlock,
            overlapInfo : overlapInfo
        };
    }
    public addBlock() {
        let lastBlock = this.blocks[this.blocks.length - 1];
        //game over, no new block
        if (lastBlock && lastBlock.state == BlockInfo.STATES.MISSED) {
            this.over = true;
            return null;
        }
        //generate new block with target as last block
        let newKidOnTheBlock = new BlockInfo(lastBlock);
        this.blocks.push(newKidOnTheBlock);
        return newKidOnTheBlock;
    }

    tick() {
        this.blocks[this.blocks.length - 1].tick();
        if (!this.ticksSinceLastMove) {
            this.ticksSinceLastMove = 1;
        } else {
            this.ticksSinceLastMove = this.ticksSinceLastMove + 1;
        }

    }
}