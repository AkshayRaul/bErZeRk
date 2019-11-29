var player = function (scene, startPosition) {
    var that = {};

    var UP = 0;
    var DOWN = 1;
    var LEFT = 2;
    var RIGHT = 3;
    var defaultDirection = UP;

    var input = playerInput();

    /*
     * Creates player
     */
    var createPlayer = function (length) {
        var head = new THREE.Mesh(geometry, material);

        // Start in middle of screen facing right
        head.position.x = startPosition.x;
        head.position.y = startPosition.y;
        scene.add(head);
        player.push(head);


    };

    var createBullet = function (direction) {
        var color24 = Math.random() * 255 << 16 | Math.random() * 255 << 8 | Math.random() * 255;
        var geometry = new THREE.CubeGeometry(BOT.TILE_SIZE, BOT.TILE_SIZE, BOT.TILE_SIZE * 0.3);
        var material = new THREE.MeshLambertMaterial({ color: color24 });
        var bullet = new THREE.Mesh(geometry, material);
        bullet.position.x = player[0].position.x;
        bullet.position.y = player[0].position.y;
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

    /*
     * Returns if player collides with bot = distance < bot radius
     */
    that.collidesWith = function (bot) {
        return (bot && pythagorasDistance(player[0].position, bot.getPosition()) < bot.getRadius());
    };

    that.bulletBotCollision = function (bot) {
        return (pythagorasDistance(bullet.position, bot.getPosition()) < bot.getRadius());
    };

    /*
     * Adds a body part at beginning of player, before setting tail to head in update
     */


    var timeBetweenFrames = 1 / 15;
    var timeSinceLastFrame = timeBetweenFrames;
    var lastFrame = Date.now();  // Not IE?

    /*
     * Update
     */

    that.updateBullet = function () {

        // Calculate time since the last frame

        var moveBy = 1;
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

        // Update player at 25 FPS
        if (timeSinceLastFrame <= 0) {
            timeSinceLastFrame = timeBetweenFrames;

            if (dead) {
                updateDeathAnimation();
                return;
            }

            var head = player[0];
            if (input.buttons[input.BUTTON_UP]) {
                direction = UP;
            } else if (input.buttons[input.BUTTON_DOWN]) {
                direction = DOWN;

            } else if (input.buttons[input.BUTTON_LEFT]) {
                direction = LEFT;

            } else if (input.buttons[input.BUTTON_RIGHT]) {
                direction = RIGHT;

            }
            var moveBy = TILE_SIZE;
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
            if (input.buttons[input.SPACE]) {
                if (!lockBulletPress){
                    bullet = createBullet(lastDirection)
                    lockBulletPress = true;
                }
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
        var length = player.length;
        for (var i = 0; i < length; i++) {
            var bodyPart = player[i];
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
    that.die = function () {
        if (dead) {
            return;
        }

        var length = player.length;

        var head = player[0];
        head.vx = 0;
        head.vy = 0;
        head.vz = 4;

        for (var i = 1; i < length; i++) {
            var bodyPart = player[i];
            bodyPart.vx = Math.random() * 2 * (Math.random() > 0.5 ? -1 : 1);
            bodyPart.vy = Math.random() * 2 * (Math.random() > 0.5 ? -1 : 1);
            bodyPart.vz = Math.random() * 3 * (Math.random() > 0.5 ? -1 : 1);
        }

        dead = true;

        // Show game over box
        $('#gameover').show('slow');
    };

    that.getPosition = function () {
        return { 
            x: player[0].position.x, 
            y: player[0].position.y 
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
    // Player color, material etc
    var player = [];
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

    createPlayer(4); // TODO: Remove the parameter

    return that;
};