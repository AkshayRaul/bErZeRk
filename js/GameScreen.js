/*
 * GameScreen
 */

/**
 * 
 */

var GameScreen = Class.extend({
    /*
     * Init
     */
    init: function (game, scene, camera) {
        this.game = game;
        this.scene = scene;
        this.camera = camera;
        this.level = 3;  // start at level 1
        this.lastLevel = 3;
        this.cameraUpdate = false;
        this.clock = new THREE.Clock();
        this.mixer = null;
        this.setup();
    },

    /*
     * Setup
     */
    setup: function () {
        this.clearLevel();

        switch (this.level) {
            case 1:
                this.size = { x_min: -100, x_max: 100, y_min: -80, y_max: 80 };
                this.stars = starField({
                    scene: this.scene,
                    stars: 10000,
                    size: 3
                });
                this.botsToKill = 1;
                this.randomBotSize = true;
                this.cameraPosition = { x: -120, y: -50, z: 250 };
                break;
            case 2:
                this.cameraPosition = { x: -120, y: -50, z: 250 };
                this.size = { x_min: -100, x_max: 100, y_min: -80, y_max: 80 };
                this.stars = starField({
                    scene: this.scene,
                    stars: 50000,
                    size: 2
                });
                this.botsToKill = 5;
                this.randomBotSize = true;
                this.cameraUpdate = true;
                break;
            case 3:
                this.size = { x_min: -100, x_max: 100, y_min: -80, y_max: 80 };
                this.stars = starField({
                    scene: this.scene,
                    stars: 30000,
                    size: 2
                });
                this.botsToKill = 6;
                this.randomBotSize = true;
                this.cameraPosition = { x: -120, y: -50, z: 250 };
                this.cameraUpdate = true;
                break;
            case 4:
                this.size = { x_min: -100, x_max: 100, y_min: -80, y_max: 80 };
                this.stars = starField({
                    scene: this.scene,
                    stars: 30000,
                    size: 2
                });
                this.botsToKill = 15;
                this.randomBotSize = false;
                this.cameraPosition = { x: -120, y: -50, z: 250 };
                this.cameraUpdate = true;
                break;
        }

        
        var geometry = new THREE.PlaneGeometry(200, 160, 0);
        texture = new THREE.TextureLoader().load('images/space.jpg');
        var material = new THREE.MeshBasicMaterial({ map:texture, side: THREE.DoubleSide });
        var plane = new THREE.Mesh(geometry, material);
        this.scene.add(plane)

        this.wallTexture = new THREE.TextureLoader().load('images/star.png');

        gameScene = this.scene

        

        $('#info .level').html('Level ' + this.level);
        if (this.cameraUpdate) {
            this.updateCamera();
        }

        this.createWalls();
        this.player = player(this.scene, {
            x: this.size.x_min + 32, // Needs to be % 4 == 0
            y: this.size.y_min + 16
        });
        this.bot = bot(this.scene);
        this.addObstacles();

        // Set valid bot positions
        this.xPositions = [];
        this.yPositions = [];
        for (var x = this.size.x_min + BOT.TILE_SIZE; x < this.size.x_max; x = x + BOT.TILE_SIZE) {
            this.xPositions.push(x);
        }
        for (var y = this.size.y_min + BOT.TILE_SIZE; y < this.size.y_max; y = y + BOT.TILE_SIZE) {
            this.yPositions.push(y);
        }

        // Then create the bot, so it spawns inside level walls
        this.addBots();
        this.score = 0;
        this.botsKilled = 0;

        $('#info').show();
        this.setScore(0);
        this.levelFinished = false;
        this.updateLevelGoal();

        console.log(this.player.getPosition())

    },
    

    getXMax: function (x) {
        var DISPLAY_HEIGHT = 2 * this.cameraPosition.z * Math.tan(45 / 2 * (Math.PI / 180));
        var DISPLAY_WIDTH = DISPLAY_HEIGHT * (BOT.WIDTH / BOT.HEIGHT);

        var X_MAX = DISPLAY_WIDTH / 2;
        var Y_MAX = DISPLAY_HEIGHT / 2;

        var x = Math.round(X_MAX);
        while (x--) {
            if (x % 4 == 0) {
                return x;
            }
        }
    },

    getYMax: function (x) {
        var DISPLAY_HEIGHT = 2 * this.cameraPosition.z * Math.tan(45 / 2 * (Math.PI / 180));
        var DISPLAY_WIDTH = DISPLAY_HEIGHT * (BOT.WIDTH / BOT.HEIGHT);

        var X_MAX = DISPLAY_WIDTH / 2;
        var Y_MAX = DISPLAY_HEIGHT / 2;

        var y = Math.round(Y_MAX);
        while (y--) {
            if (y % 4 == 0) {
                return y;
            }
        }
    },

    /*
     * Add wallbits as level obstacles
     */

    addBots: function () {
        this.bots = [];

        for (var i = 0; i < this.botsToKill; i++) {
            var botObstacle = this.createBot();
            this.bots.push(botObstacle);
        }
    },
    addObstacles: function () {
        this.obstacles = [];
        // if (this.level > 1) {
        //     return;
        // }
        // bottom
        obstacles_map = obstacles[this.level - 1]
        x = obstacles_map["x"]
        for (var i = 0; i < x.length; i++) {
            range = x[i]
            for (var y = range["y_min"]; y < range["y_max"]; y += BOT.TILE_SIZE) {
                var position = { x: range["x_val"], y: y };
                this.obstacles.push(position);
                this.createWall(position);
            }
        }
        y = obstacles_map["y"]
        for (var i = 0; i < y.length; i++) {
            range = y[i]
            for (var x = range["x_min"]; x < range["x_max"]; x += BOT.TILE_SIZE) {
                var position = { y: range["y_val"], x: x };
                this.obstacles.push(position);
                this.createWall(position);
            }
        }

    },

    /*
     * Update camera
     */
    updateCamera: function () {
        this.camera.position.x = this.cameraPosition.x;
        this.camera.position.y = this.cameraPosition.y;
        this.camera.position.z = this.cameraPosition.z;
        this.camera.lookAt(this.scene.position);
    },

    /*
     * Removes all THREE objects from scene
     */
    clearLevel: function () {
        var length = this.scene.children.length;
        var removeMe = [];
        for (var i = 0; i < length; i++) {
            var child = this.scene.children[i];
            // Don't delete camera, lightning and grid
            if (child.name !== 'save-me') {
                removeMe.push(child);
            }
        }
        for (var i = 0; i < removeMe.length; i++) {
            this.scene.remove(removeMe[i]);
        }
    },

    /*
     * Creates a random colored bit of wall at position (x, y)
     */
    createWall: function (position) {
        var color24 = 0
        var geometry = new THREE.CubeGeometry(BOT.TILE_SIZE, BOT.TILE_SIZE, BOT.TILE_SIZE + 20);
        var material = new THREE.MeshLambertMaterial({ map: this.wallTexture });
        var wallBit = new THREE.Mesh(geometry, material);
        wallBit.position.x = position.x;
        wallBit.position.y = position.y;
        this.scene.add(wallBit);

        return wallBit;
    },

    /*
     * Creates a random colored square
     */
    createWalls: function () {
       
    },

    /*
     * Returns random bot postion, inside walls
     */
    getRandomPosition: function () {
        var x = this.xPositions[Math.round(Math.random() * (this.xPositions.length - 1))];
        var y = this.yPositions[Math.round(Math.random() * (this.yPositions.length - 1))];

        return { x: x, y: y };
    },

    /*
     * Returns fresh bot
     */
    createBot: function () {
        // Check obstacle positions
        var pos;
        while (true) {
            pos = this.getRandomPosition();
            if (this.okPosition(pos)) {
                break;
            }
        }
        return this.bot.createBot(pos)

    },

    okPosition: function (pos) {
        var length = this.obstacles.length;
        var obstacle;
        for (var i = 0; i < length; i++) {
            obstacle = this.obstacles[i];
            if (obstacle.x == pos.x && obstacle.y == pos.y) {
                return false;
            }
        }

        return true;
    },

    /*
     * Check collisions with outer walls.
     */
    checkBounds: function () {
        var pos = this.player.getPosition();

        // indexOf?
        var length = this.obstacles.length;
        var obstacle;
        for (var i = 0; i < length; i++) {
            obstacle = this.obstacles[i];
            if (Math.abs(obstacle.x-pos.x)<=BOT.TILE_SIZE && Math.abs(obstacle.y -pos.y)<=BOT.TILE_SIZE) {
                this.player.die();
            }
        }
    },
    checkPlayerBulletBounds: function () {

        if (!this.player.getBullet())
            return
        pos = this.player.getBulletPosition()
        var length = this.obstacles.length;
        var obstacle;
        for (var j = 0; j < length; j++) {
            obstacle = this.obstacles[j];
            if ((pos.x <= obstacle.x + BOT.TILE_SIZE && pos.x >= obstacle.x - BOT.TILE_SIZE)
                && (pos.y <= obstacle.y + BOT.TILE_SIZE && pos.y >= obstacle.y - BOT.TILE_SIZE)) {
                this.player.bulletDie();
                return
            }
        }
        if (pos.x < (this.size.x_min + BOT.TILE_SIZE) || pos.x > (this.size.x_max - BOT.TILE_SIZE) ||
            pos.y < (this.size.y_min + BOT.TILE_SIZE) || pos.y > this.size.y_max - BOT.TILE_SIZE) {

            this.player.bulletDie();
        }
    },
    checkBotBulletBounds: function () {

        if (!this.bot.getBullet())
            return
        pos = this.bot.getBulletPosition()
        var length = this.obstacles.length;
        var obstacle;
        for (var j = 0; j < length; j++) {
            obstacle = this.obstacles[j];
            if (pos.x <= obstacle.x + BOT.TILE_SIZE && pos.x >= obstacle.x - BOT.TILE_SIZE
                && pos.y <= obstacle.y + BOT.TILE_SIZE && pos.y >= obstacle.y - BOT.TILE_SIZE) {
                console.log(true)
                this.bot.bulletDie();
                return
            }
        }
        if (pos.x < (this.size.x_min + BOT.TILE_SIZE) || pos.x > (this.size.x_max - BOT.TILE_SIZE) ||
            pos.y < (this.size.y_min + BOT.TILE_SIZE) || pos.y > this.size.y_max - BOT.TILE_SIZE) {

            this.bot.bulletDie();
        }
    },
    checkBotBounds: function () {
        // check bots collision amongst themselves
        for (var i = 0; i < this.bots.length; i++) {
            var removeIthBot = false
            for (var j = i + 1; j < this.bots.length; j++) {
                var bot1 = this.bots[i]
                var bot2 = this.bots[i]
                var bot1Pos = this.bots[i].getPosition()
                var bot2Pos = this.bots[j].getPosition()
                if (this.bot.distance(bot1Pos, bot2Pos) < 2 * bot1.getRadius()) {
                    removeIthBot = true
                    this.scene.remove(this.bots[i].getSphereObject())
                    this.scene.remove(this.bots[j].getSphereObject())
                    this.bots.splice(j, 1);
                    this.botsToKill--;

                }
            }
            if (removeIthBot) {
                this.bots.splice(i, 1);
                this.botsToKill--;
                i--;
            }
        }
        // box bounds check
        for (var i = 0; i < this.bots.length; i++) {
            var bot = this.bots[i]
            var pos = bot.getPosition()
            if (Math.abs(pos.x - this.size.x_min) < bot.getRadius() || Math.abs(pos.x - this.size.x_max) < bot.getRadius() ||
                Math.abs(pos.y - this.size.y_min) < bot.getRadius() || Math.abs(pos.y - this.size.y_max) < bot.getRadius()) {
                this.scene.remove(this.bots[i].getSphereObject())
                this.bots.splice(i, 1);
                this.botsToKill--;
            }

            //inside walls collision check
        }
        for (var i = 0; i < this.bots.length; i++) {
            var bot = this.bots[i]
            var pos = bot.getPosition()
            var length = this.obstacles.length;
            var obstacle;
            for (var j = 0; j < length; j++) {
                obstacle = this.obstacles[j];
                if (Math.abs(pos.x - obstacle.x) < bot.getRadius() && Math.abs(pos.y - obstacle.y) < bot.getRadius()) {
                    this.scene.remove(this.bots[i].getSphereObject())
                    this.bots.splice(i, 1);
                    i--;
                    this.botsToKill--;
                    break;
                }
            }
        }

    },
    checkBulletBotCollision: function () {
        if (!this.player.getBullet())
            return false
        var pos = this.player.getBulletPosition()
        var length = this.bots.length;
        var obstacle;

        for (var i = 0; i < length; i++) {
            obstacle = this.bots[i];
            var a = pos.x - obstacle.getPosition().x
            var b = pos.y - obstacle.getPosition().y
            if (this.player.bulletBotCollision(obstacle)) {
                this.scene.remove(this.player.getBullet())
                this.player.bulletDie();
                this.scene.remove(obstacle.getSphereObject())
                this.bots.splice(i, 1)
                return true
            }
        }
        return false
    },
    checkBulletPlayerCollision: function () {
        if (!this.bot.getBullet())
            return false
        var obstacle;
        obstacle = this.player;
        if (this.bot.bulletPlayerCollision(obstacle)) {
            this.scene.remove(this.bot.getBullet())
            this.bot.bulletDie();
            // this.scene.remove(obstacle.getSphereObject())
            return true
        }

        return false
    },

    checkBots: function () {
        var pos = this.player.getPosition();



        // indexOf?
        var length = this.bots.length;
        var obstacle;

        for (var i = 0; i < length; i++) {
            obstacle = this.bots[i];
            if (this.player.collidesWith(obstacle)) {
                this.player.die();
            }

            if (obstacle.x == pos.x && obstacle.y == pos.y) {
                this.player.die();
            }
        }
    },
    botShoot: function () {
        var length = this.bots.length;
        if (length == 0)
            return
        var min = Number.MAX_SAFE_INTEGER
        var hasDistance = Number.MAX_SAFE_INTEGER
        var whichBot = 0
        for (var i = 0; i < length; i++) {
            var bot = this.bots[i]
            var distance = this.bot.distance(bot.getPosition(), this.player.getPosition())
            if (distance < hasDistance) {
                whichBot = i
                hasDistance = distance
            }
        }
        if (hasDistance < 40) {

            this.bot.createBotBullet(this.player, this.bots[whichBot])
        }


    },
    moveBotTowardsTarget: function () {
        var length = this.bots.length;
        if (length == 0)
            return
        var min = Number.MAX_SAFE_INTEGER;
        // var i = Math.floor(Math.random()*length)
        for (var i = 0; i < length; i++) {
            var botPos = this.bots[i].getPosition()

            if (Math.abs(botPos.x - this.player.getPosition().x) >= BOT.TILE_SIZE) {
                direction = Math.sign(botPos.x - this.player.getPosition().x)
                pos = {
                    x: botPos.x - direction * 0.2, //(botPos.x - this.player.getPosition().x) / Math.abs((botPos.x - this.player.getPosition().x) * 4),
                    y: botPos.y
                }
            } else {
                direction = Math.sign(botPos.y - this.player.getPosition().y)
                pos = {
                    x: botPos.x,
                    y: botPos.y - direction * 0.2 //(botPos.y - this.player.getPosition().y) / Math.abs((botPos.y - this.player.getPosition().y) * 4)
                }
            }
            this.bots[i].setPosition(pos)

        }
    }
    ,

    /*
     * Pad zeros. (1123, 9) Returns 000001123
     */
    zeroPad: function (num, places) {
        var zero = places - num.toString().length + 1;
        return Array(+(zero > 0 && zero)).join("0") + num;
    },

  
    setScore: function (score) {
        $('.score').html(score);
    },

    /*
     * Updates bots killed
     */
    updateLevelGoal: function () {
        var current = this.botsToKill - this.botsKilled;
        outOfMaze = false;
        pos = this.player.getPosition()
        if (pos.x < (this.size.x_min + BOT.TILE_SIZE) || pos.x > (this.size.x_max - BOT.TILE_SIZE) ||
            pos.y < (this.size.y_min + BOT.TILE_SIZE) || pos.y > this.size.y_max - BOT.TILE_SIZE) {
            outOfMaze = true;
        }
        if (outOfMaze) {
            this.levelFinished = true;
            $('#goal').html('Woo! Done! :D');
            if (this.level == this.lastLevel) {
                $('#done').html('Well done! Game clear! Congratulations! :DD').show('slow');
            } else {
                $('#done').html('Well done! Level cleared! <a href="javascript:;">Play next?</a>').show('slow');
                var that = this;
                $('#done a').click(function () {
                    $('#done').hide('slow');
                    that.level++;
                    that.setup();
                });
            }
        } else {
            $('#goal').html('kill ' + current + ' bots!');
        }
    },

    /*
     * Update
     */
    update: function () {
        this.stars.update();
        if (!this.levelFinished) {
            this.player.update();
            //this.bot.update()

            if (this.checkBulletBotCollision()) {
                this.botsToKill--;
                this.score += 100;
                this.setScore(this.score)
            }
            if (this.checkBulletPlayerCollision()) {
                this.player.die()
            }
            this.moveBotTowardsTarget()
            this.botShoot();
            this.updateLevelGoal();
            this.player.updateBullet();
            this.bot.updateBullet();
            this.checkBotBulletBounds();
            this.checkPlayerBulletBounds();
            this.checkBotBounds();
            this.checkBots();
            this.checkBounds();
        }
    }
});