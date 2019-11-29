/*
 * GameScreen
 */
var GameScreen = Class.extend({
    /*
     * Init
     */
    init: function (game, scene, camera) {
        this.game = game;
        this.scene = scene;
        this.camera = camera;
        this.level = 1;  // start at level 1
        this.lastLevel = 4;
        this.cameraUpdate = false;
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
                this.cameraPosition = { x: 0, y: -100, z: 120 };
                this.size = {
                    x_min: - this.getXMax() + BOT.TILE_SIZE,
                    x_max: this.getXMax() - BOT.TILE_SIZE,
                    y_min: - this.getYMax() + BOT.TILE_SIZE,
                    y_max: this.getYMax() - BOT.TILE_SIZE
                };
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
                this.size = { x_min: -100, x_max: 100, y_min: -40, y_max: 40 };
                this.stars = starField({
                    scene: this.scene,
                    stars: 30000,
                    size: 2
                });
                this.botsToKill = 6;
                this.randomBotSize = true;
                this.cameraPosition = { x: 20, y: -120, z: 300 };
                this.cameraUpdate = true;
                break;
            case 4:
                this.size = { x_min: -100, x_max: 100, y_min: -40, y_max: 40 };
                this.stars = starField({
                    scene: this.scene,
                    stars: 30000,
                    size: 2
                });
                this.botsToKill = 15;
                this.randomBotSize = false;
                this.cameraPosition = { x: 20, y: 50, z: 340 };
                this.cameraUpdate = true;
                break;
        }

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
        if (this.level > 1) {
            return;
        }
        // bottom
        for (var x = -52; x < 52; x = x + BOT.TILE_SIZE) {
            var position = { x: x, y: -40 };
            this.obstacles.push(position);
            this.createWall(position);
        }
        // right
        for (var y = -40; y < 8; y = y + BOT.TILE_SIZE) {
            var position = { x: 52, y: y };
            this.obstacles.push(position);
            this.createWall(position);
        }
        // left
        for (var y = -40; y < 8; y = y + BOT.TILE_SIZE) {
            var position = { x: -52, y: y };
            this.obstacles.push(position);
            this.createWall(position);
        }
        // left eye
        for (var y = 0; y < 36; y = y + BOT.TILE_SIZE) {
            var position = { x: 20, y: y };
            this.obstacles.push(position);
            this.createWall(position);
        }
        // right eye
        for (var y = 0; y < 36; y = y + BOT.TILE_SIZE) {
            var position = { x: -20, y: y };
            this.obstacles.push(position);
            this.createWall(position);
        }
    },

    /*
     * Update camera
     */
    updateCamera: function () {
        this.camera.position.x = this.cameraPosition.x;
        this.camera.position.y = this.cameraPosition.y;
        this.camera.position.z = this.cameraPosition.z;
        // this.camera.lookAt(this.scene.position);
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
        var color24 = Math.random() * 255 << 16 | Math.random() * 255 << 8 | Math.random() * 255;
        var geometry = new THREE.CubeGeometry(BOT.TILE_SIZE, BOT.TILE_SIZE, BOT.TILE_SIZE + 2);
        var material = new THREE.MeshLambertMaterial({ color: color24 });
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
        // Top and bottom wall
        for (var x = this.size.x_min; x < this.size.x_max; x = x + BOT.TILE_SIZE) {
            this.createWall({ x: x, y: this.size.y_max });
            this.createWall({ x: x, y: this.size.y_min });
        }

        // Left and right wall
        for (var y = this.size.y_min; y < this.size.y_max; y = y + BOT.TILE_SIZE) {
            this.createWall({ x: this.size.x_min, y: y });
            this.createWall({ x: this.size.x_max, y: y });
        }
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

        if (pos.x < (this.size.x_min + BOT.TILE_SIZE) || pos.x > (this.size.x_max - BOT.TILE_SIZE) ||
            pos.y < (this.size.y_min + BOT.TILE_SIZE) || pos.y > this.size.y_max - BOT.TILE_SIZE) {

            this.player.die();
        }

        // indexOf?
        var length = this.obstacles.length;
        var obstacle;
        for (var i = 0; i < length; i++) {
            obstacle = this.obstacles[i];
            if (obstacle.x == pos.x && obstacle.y == pos.y) {
                this.player.die();
            }
        }
    },
    checkBulletBounds: function () {

        if (!this.player.getBullet())
            return
        pos = this.player.getBulletPosition()
        if (pos.x < (this.size.x_min + BOT.TILE_SIZE) || pos.x > (this.size.x_max - BOT.TILE_SIZE) ||
            pos.y < (this.size.y_min + BOT.TILE_SIZE) || pos.y > this.size.y_max - BOT.TILE_SIZE) {

            this.player.bulletDie();
        }
    },
    checkBotBulletBounds: function () {

        if (!this.bot.getBullet())
            return
        pos = this.bot.getBulletPosition()
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
                if (this.bot.distance(bot1Pos,bot2Pos)<2*bot1.getRadius()) {
                    removeIthBot = true
                    this.scene.remove(this.bots[i].getSphereObject())
                    this.scene.remove(this.bots[j].getSphereObject())
                    this.bots.splice(j, 1);
                    this.botsToKill--;

                }
            }
            if(removeIthBot){
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

        if (pos.x < (this.size.x_min + BOT.TILE_SIZE) || pos.x > (this.size.x_max - BOT.TILE_SIZE) ||
            pos.y < (this.size.y_min + BOT.TILE_SIZE) || pos.y > this.size.y_max - BOT.TILE_SIZE){
            this.player.die();
        }

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

            if ((botPos.x - this.player.getPosition().x) != 0)
                pos = {
                    x: botPos.x - (botPos.x - this.player.getPosition().x) / Math.abs((botPos.x - this.player.getPosition().x) * 4),
                    y: botPos.y
                }
            else
                pos = {
                    x: botPos.x,
                    y: botPos.y - (botPos.y - this.player.getPosition().y) / Math.abs((botPos.y - this.player.getPosition().y) * 4)
                }
            this.bots[i].setPosition(pos)
        }
    },

    /*
     * Pad zeros. (1123, 9) Returns 000001123
     */
    zeroPad: function (num, places) {
        var zero = places - num.toString().length + 1;
        return Array(+(zero > 0 && zero)).join("0") + num;
    },

    /*
     * Sets user score. Both in info and game over box
     */
    setScore: function (score) {
        $('.score').html(this.zeroPad(score, 9));
    },

    /*
     * Updates bots killed
     */
    updateLevelGoal: function () {
        var current = this.botsToKill - this.botsKilled;
        if (current == 0) {
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
            this.updateLevelGoal()
            this.player.updateBullet();
            this.bot.updateBullet();
            this.checkBotBulletBounds();
            this.checkBulletBounds();
            this.checkBotBounds();
            this.checkBots();
            this.checkBounds();
        }
    }
});