/*
 * Creates random placed, rotating color-changing particles.
 */
var introStars = function(options) {
    var that = {};
    var scene = options.scene;
    var stars = options.stars;
    var size = options.size*2;

    // Create stars
    var geometry = new THREE.Geometry();

    for (i=0; i<stars; i++) {
        var vertex = new THREE.Vector3();
        vertex.x = Math.random() * 1000 - 500;
        vertex.y = Math.random() * 1000 - 500;
        vertex.z = Math.random() * 1000 - 500;
        geometry.vertices.push(vertex);
    }
    var material = new THREE.PointsMaterial({
        color: new THREE.Color(Math.random(1), Math.random(4),Math.random()),
        map: new THREE.TextureLoader().load(BOT.IMAGES+'/bubble.png'),
        depthTest:false,
        blending: THREE.AdditiveBlending,  // Transparent
        transparent: 1,
        opacity: 1,
        size:size
    });
    
    var particles = new THREE.Points(geometry, material);
    particles.geometry.color = new THREE.Color(0.1,0.3,0.4)
    particles.rotation.x = Math.random() * 15;
    particles.rotation.y = Math.random() * 15;
    particles.rotation.z = Math.random() * 15;

    scene.add(particles);

    // Create beams
    var BEAMS = 10;
    var ROTATION = 0.003;
    // PlaneGeometry(width, height, segments width, sements height)
    var beamGeometry = new THREE.PlaneGeometry(5000, 5, 1, 1);
    var beamGroup = new THREE.Object3D();

    for (var i=0; i<BEAMS; i++) {
        var beamMaterial = new THREE.MeshBasicMaterial({
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthTest: false
        });
        beamMaterial.color = new THREE.Color(Math.random(),Math.random(),Math.random());
        // beamMaterial.color.setHSL(Math.random(), 1, 1.0);
        // Make beam with above created material
        var beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.doubleSided = true;
        beam.rotation.x = Math.random() * Math.PI;
        beam.rotation.y = Math.random() * Math.PI;
        beam.rotation.z = Math.random() * Math.PI;
        beamGroup.add(beam);
    }

    // scene.add(beamGroup);

    /*
     * Update
     */
    that.update = function() {
        particles.rotation.y = Date.now() * 0.00005;
        particles.geometry.color.set(Math.random(1), Math.random(4),Math.random());

        beamGroup.rotation.x += ROTATION;
        beamGroup.rotation.y += ROTATION;

    };

    return that;
};