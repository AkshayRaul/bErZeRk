var bot = function (scene) {
    var that = {};

    var UP = 0;
    var DOWN = 1;
    var LEFT = 2;
    var RIGHT = 3;
    var defaultDirection = UP;

    that.getRadius = function(){
        return 5
    }

    /*
     * Creates BOT
     */
    that.createBot = function (pos, randomBotSize) {
        var bot=sphere({
            scene: scene,
            radius: 5 ,
            mesh: Math.random() > 0.5 ? true : false,
            x: Math.ceil(pos.x),
            y: Math.ceil(pos.y)
        });
        return bot
    };

    that.createBotBullet =  function(playerPos,botPos){
        if (!lockBulletPress){
            bullet = createBullet(playerPos,botPos)
            lockBulletPress = true;
        }
    
    }

    var createBullet = function (playerPos,bot) {
        var geometry = new THREE.CubeGeometry(BOT.TILE_SIZE, BOT.TILE_SIZE, BOT.TILE_SIZE * 0.3);
        var material = new THREE.MeshLambertMaterial({ color: '#990000' });
        var bullet = new THREE.Mesh(geometry, material);
        bullet.position.x = Math.ceil(pos.x);
        bullet.position.y = Math.ceil(pos.y);
        botPos = bot.getPosition()
        playerPos = playerPos.getPosition()
        if(Math.abs(botPos.x-playerPos.x)<Math.abs(botPos.y-playerPos.y)){
            if(botPos.y-playerPos.y>0){
                direction = DOWN
                bullet.position.y-=bot.getRadius() 
            }else{
                direction = UP
                bullet.position.y+=bot.getRadius() 
            }
        }else{
            if(botPos.x-playerPos.x>0){
                direction = LEFT
                bullet.position.x-=bot.getRadius() 
            }else{
                direction = RIGHT
                bullet.position.x+=bot.getRadius() 
            }
        }
        bullet.direction = direction
        scene.add(bullet);
        return bullet;
    }

    /*
     * Returns the distance between two positions. Sum of shortest sides of the triangle
     */
    var manhattanDistance = function (pos1, pos2) {
        return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
    };

    var pythagorasDistance = function (pos1, pos2) {
        var dx = pos2.x - pos1.x;
        var dy = pos2.y - pos1.y;

        return Math.sqrt(dx * dx + dy * dy);
    };

    that.distance =  function (pos1, pos2) {
        var dx = pos2.x - pos1.x;
        var dy = pos2.y - pos1.y;

        return Math.sqrt(dx * dx + dy * dy);
    };

    
    that.collidesWith = function (obstacle) {
        return obstacle.x ;
    };

    that.bulletPlayerCollision = function (player) {
        if( Math.abs(bullet.position.x - player.getPosition().x) <= BOT.TILE_SIZE && Math.abs(bullet.position.y - player.getPosition().y)<= BOT.TILE_SIZE){
            return true
        }
        return false
    };

    /*
     * Adds a body part at beginning of BOT, before setting tail to head in update
     */


    var timeBetweenFrames = 1 / 15;
    var timeSinceLastFrame = timeBetweenFrames;
    var lastFrame = Date.now();  // Not IE?

    /*
     * Update
     */

    that.updateBullet = function () {

        // Calculate time since the last frame

        var moveBy = 0.5;
        switch (bullet.direction) {
            case UP:
                bullet.position.y += moveBy;
                break;
            case DOWN:
                bullet.position.y -= moveBy;
                break;
            case LEFT:
                bullet.position.x -= moveBy;
                break;
            case RIGHT:
                bullet.position.x += moveBy;
                break;
        }



    };

    that.update = function () {
        input.update();  // This needed?
        // Calculate time since the last frame
        var thisFrame = Date.now();
        var dt = (thisFrame - lastFrame) / 1000;
        lastFrame = thisFrame;
        timeSinceLastFrame = timeSinceLastFrame - dt;

        // Update BOT at 25 FPS
        if (timeSinceLastFrame <= 0) {
            timeSinceLastFrame = timeBetweenFrames;

            if (dead) {
                updateDeathAnimation();
                return;
            }

            var head = BOT[0];
            if (input.buttons[input.BUTTON_UP]) {
                direction = UP;
            } else if (input.buttons[input.BUTTON_DOWN]) {
                direction = DOWN;

            } else if (input.buttons[input.BUTTON_LEFT]) {
                direction = LEFT;

            } else if (input.buttons[input.BUTTON_RIGHT]) {
                direction = RIGHT;

            }
            var moveBy = 0;
            switch (direction) {
                case UP:
                    head.position.y += moveBy;
                    break;
                case DOWN:
                    head.position.y -= moveBy;
                    break;
                case LEFT:
                    head.position.x -= moveBy;
                    break;
                case RIGHT:
                    head.position.x += moveBy;
                    break;
            }
        
            if (!lockBulletPress){
                bullet = createBullet(lastDirection)
                lockBulletPress = true;
            }
        
            if (direction != null)
                lastDirection = direction
            direction = null

            // Update color hue. Rotating from 0.0 --> 1.0
            var time = Date.now() * 0.00005;
            material.color.setHSL(time % 1, 1, 1);
        }
    };

    var updateDeathAnimation = function () {
        var length = BOT.length;
        for (var i = 0; i < length; i++) {
            var bodyPart = BOT[i];
            bodyPart.position.x += bodyPart.vx;
            bodyPart.position.y += bodyPart.vy;
            bodyPart.position.z += bodyPart.vz;
            bodyPart.rotation.x += 0.3;
        }

        // Update color hue. Rotating from 0.0 --> 1.0
        var time = Date.now() * 0.00005;
        // material.color.setHSL(time % 1, 1, 1);
    };

    that.bulletDie =  function(){
        deadBullet = bullet
        deadBullet.x += Math.random() * 2 * (Math.random() > 0.5 ? -1 : 1);
        deadBullet.y += Math.random() * 2 * (Math.random() > 0.5 ? -1 : 1);
        deadBullet.z += Math.random() * 3 * (Math.random() > 0.5 ? -1 : 1);
        deadBullet.rotation.x +=0.03
        deadBullet.rotation.y +=0.3
        bullet=false
        lockBulletPress = false;

    }
    that.die = function (whichBot) {
        if (dead) {
            return;
        }


        var head = BOT[whichBot];
        head.vx = 0;
        head.vy = 0;
        head.vz = 4;

        var bodyPart = BOT[i];
        bodyPart.vx = Math.random() * 2 * (Math.random() > 0.5 ? -1 : 1);
        bodyPart.vy = Math.random() * 2 * (Math.random() > 0.5 ? -1 : 1);
        bodyPart.vz = Math.random() * 3 * (Math.random() > 0.5 ? -1 : 1);
        

    };

    that.getPosition = function () {
        return { 
            x: BOT[0].position.x, 
            y: BOT[0].position.y 
        };
    };
    that.getBulletPosition = function () {
        return {
            x: bullet.position.x,
            y: bullet.position.y
        }
    }
    that.getBullet =  function(){
        return bullet;
    }
    // BOT color, material etc
    var bots = [];
    var bullet = false;
    var TILE_SIZE = 4;
    var TILE_SIZE_BIG = 6;
    var color24 = Math.random() * 255 << 16 | Math.random() * 255 << 8 | Math.random() * 255;
    var material = new THREE.MeshLambertMaterial({ color: color24 });
    var geometry = new THREE.CubeGeometry(TILE_SIZE, TILE_SIZE, TILE_SIZE);
    var geometryBig = new THREE.CubeGeometry(TILE_SIZE_BIG, TILE_SIZE_BIG, TILE_SIZE_BIG);
    var direction = UP;
    var lastDirection = direction;
    var add = false;
    var dead = false;
    var lockBulletPress = false;


    return that;
};