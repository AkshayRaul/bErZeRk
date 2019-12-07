/*
 * IntroScreen
 */
var IntroScreen = Class.extend({
    init: function(game, scene, camera) {
        this.stars = introStars({
            scene: scene,
            camera: camera,
            stars: 10000,
            size:3
        });
 
        $('#intro a').click(function() {
            $('#intro').hide('slow');
            game.setScreen(new GameScreen(game, scene, camera));
        });
    },

    update: function() {
        this.stars.update();
    }
});