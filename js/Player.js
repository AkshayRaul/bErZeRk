var player = function (scene, camera, startPosition) {
    var that = {};

    var UP = 0;
    var DOWN = 1;
    var LEFT = 2;
    var RIGHT = 3;
    var defaultDirection = UP;
    var clock = new THREE.Clock()
    var playerModel = null
    var input = playerInput();

    var createModel = function () {

        var loader = new THREE.GLTFLoader();

        that.animations = []
        obj = that
        var loader = loader.load('./js/libs/Soldier.glb', function (gltf) {
            const model = gltf.scene.children[0];
            model.position.copy(new THREE.Vector3(startPosition.x, startPosition.y, 0));
            model.scale.set(0.1, 0.1, 0.1)
            model.rotation.set(0, 0, 0)
            playerModel = model
            const animations = gltf.animations;
            for (var i = 0; i < animations.length; i++)
                obj.animations.push(animations[i]);

            mixer = new THREE.AnimationMixer(model);


            const action = mixer.clipAction(animations[0]);
            action.play();
            that.mixer = mixer
            gameScene.add(model);
            model.traverse(function (object) {
                if (object.isMesh) object.castShadow = true;
            });
            //
            skeleton = new THREE.SkeletonHelper(model);
            skeleton.visible = false;
            gameScene.add(skeleton);
            obj.mixer = mixer
            animate()
        },
            // called while loading is progressing
            function (xhr) {

                console.log((xhr.loaded / xhr.total * 100) + '% loaded');

            },
            // called when loading has errors
            function (error) {

                console.log(error);

            }
        );
    }


    /*
     * Creates player
     */
    var createPlayer = function () {
        var head = new THREE.Mesh(geometry, material);

        // Start in middle of screen facing right
        head.position.x = startPosition.x;
        head.position.y = startPosition.y;

        // scene.add(head);
        player.push(head);


    };

    var createBullet = function (direction) {
        var geometry = new THREE.CubeGeometry(BOT.TILE_SIZE, BOT.TILE_SIZE, BOT.TILE_SIZE);
        var material = new THREE.MeshLambertMaterial({ color: '#002395' });
        var bullet = new THREE.Mesh(geometry, material);
        bullet.position.x = player[0].position.x;
        bullet.position.y = player[0].position.y;
        bullet.direction = direction
        scene.add(bullet);

        var listener = new THREE.AudioListener();
        camera.add(listener);

        // create a global audio source
        sound = new THREE.Audio(listener);
        var audioLoader = new THREE.AudioLoader();
        audioLoader.load('sounds/shoot.mp3', function (buffer) {
            sound.setBuffer(buffer);
            sound.setLoop(false);
            sound.setVolume(0.5);
            sound.play();
        });
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

        var moveBy = 2;
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
    animate = function () {
        // Render loop
        // Get the time elapsed since the last frame, used for mixer update (if not in single step mode)

        var mixerUpdateDelta = clock.getDelta();
        // If in single step mode, make one step and then do nothing (until the user clicks again)
        sizeOfNextStep = 2
        if (true) {
            mixerUpdateDelta = sizeOfNextStep;
            sizeOfNextStep = 0;
        }
        // Update the animation mixer, the stats panel, and render this frame
        that.mixer.update(mixerUpdateDelta);


    }

    that.update = function () {
        input.update();  // This needed?
        // Calculate time since the last frame
        var thisFrame = Date.now();
        var dt = (thisFrame - lastFrame) / 1000;
        lastFrame = thisFrame;
        timeSinceLastFrame = timeSinceLastFrame - dt;

        // Update player at 25 FPS
        var action = that.mixer.clipAction(that.animations[1])
        action.play()
        if (timeSinceLastFrame <= 0) {

            timeSinceLastFrame = timeBetweenFrames;

            if (dead) {
                updateDeathAnimation();
                return;
            }
            // if(that.mixer!=null){
            //     action.paused =  true
            // }


            var head = player[0];

            if (input.buttons[input.BUTTON_UP]) {
                direction = UP;
                animate();

            } else if (input.buttons[input.BUTTON_DOWN]) {
                direction = DOWN;
                animate();


            } else if (input.buttons[input.BUTTON_LEFT]) {
                direction = LEFT;
                animate();


            } else if (input.buttons[input.BUTTON_RIGHT]) {
                direction = RIGHT;
                animate();

            }

            var moveBy = 2;
            switch (direction) {
                case UP:
                    head.position.y += moveBy;
                    playerModel.position.y += moveBy;
                    playerModel.rotation.z = 0
                    break;
                case DOWN:
                    head.position.y -= moveBy;
                    playerModel.position.y -= moveBy;
                    playerModel.rotation.z = Math.PI
                    break;
                case LEFT:
                    head.position.x -= moveBy;
                    playerModel.position.x -= moveBy;
                    playerModel.rotation.z = Math.PI / 2
                    break;
                case RIGHT:
                    head.position.x += moveBy;
                    playerModel.position.x += moveBy;
                    playerModel.rotation.z = -Math.PI / 2
                    break;
            }
            if (input.buttons[input.SPACE]) {
                if (!lockBulletPress) {
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
        for (var i = 1; i < length; i++) {

            playerModel.position.x += Math.random() * 2 * (Math.random() > 0.5 ? -10 : 10);
            playerModel.position.y += Math.random() * 2 * (Math.random() > 0.5 ? -1 : 1);
            playerModel.position.z += Math.random() * 3 * (Math.random() > 0.5 ? -1 : 1);
        }
        scene.remove(playerModel)


        // Update color hue. Rotating from 0.0 --> 1.0
        var time = Date.now() * 0.00005;
        // material.color.setHSL(time % 1, 1, 1);
    };

    that.bulletDie = function () {
        deadBullet = bullet
        deadBullet.x += Math.random() * 2 * (Math.random() > 0.5 ? -1 : 1);
        deadBullet.y += Math.random() * 2 * (Math.random() > 0.5 ? -1 : 1);
        deadBullet.z += Math.random() * 3 * (Math.random() > 0.5 ? -1 : 1);
        deadBullet.rotation.x += 0.03
        deadBullet.rotation.y += 0.3
        bullet = false
        lockBulletPress = false;

    }
    that.die = function () {
        if (dead) {
            return;
        }

        var listener = new THREE.AudioListener();
        camera.add(listener);

        // create a global audio source
        sound = new THREE.Audio(listener);
        // load a sound and set it as the Audio object's buffer
        var audioLoader = new THREE.AudioLoader();
        audioLoader.load('sounds/die.mp3', function (buffer) {
            sound.setBuffer(buffer);
            sound.setLoop(false);
            sound.setVolume(0.5);
            sound.play();
        });
        
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
    that.getBullet = function () {
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

    createPlayer();
    createModel();
    return that;
};