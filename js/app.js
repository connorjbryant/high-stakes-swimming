jQuery(function($){

    const scene = new THREE.Scene();
    const skyColor = 0x66ccff;
    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.FogExp2(skyColor, 0.005);
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("three-canvas"), antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Camera pos
    const isMobile = window.innerWidth < 1024;
    const defaultCamY = 0.8;
    const defaultCamZ = isMobile ? -5 : -2;
    camera.position.set(0, defaultCamY, defaultCamZ);
    camera.lookAt(0, -0.2, -20);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(10, 20, 10);
    scene.add(sunLight);

    let targetCameraZ = defaultCamZ;
    let targetCameraX = 0;
    let visualCorridors = [];
    let lavaMeshes = [];
    let bombGroups = [];
    let activeSparks = [];
    let roomGroup = null; // Container to manage global room geometry cleanly
    let selectionMarker = null;

    var score = 0;
    var gameActive = false;
    let currentArrowColor = 0xffff00;

    const colorPalette = [
        { hex: 0xff3b30, emissive: 0x661510 }, //Red
        { hex: 0xff9500, emissive: 0x663800 }, //Orange
        { hex: 0xffd60a, emissive: 0x665500 }, //Yellow
        { hex: 0x34c759, emissive: 0x145022 }, //Green
        { hex: 0x32ade6, emissive: 0x10455c }, //Blue
        { hex: 0x5856d6, emissive: 0x222157 }, //Indigo
        { hex: 0xaf52de, emissive: 0x452058 } //Violet
    ];

    function createFuseSparks(){
        const sparkGroup = new THREE.Group();
        const sparkGeometry = new THREE.SphereGeometry(0.1, 6, 6);
        const sparkMaterial = new THREE.MeshBasicMaterial({
            color: 0xffcc00,
            depthTest: false
        });
        const particleCount = 16;
        const sparks = [];

        for (let i = 0; i < particleCount; i++){
            const spark = new THREE.Mesh(
                sparkGeometry,
                sparkMaterial.clone()
            );

            spark.position.set(
                (Math.random() - 0.5) * 0.12,
                (Math.random() - 0.5) * 0.12,
                (Math.random() - 0.5) * 0.12
            );

            // spark.userData.velocity = new THREE.Vector3(
            //     (Math.random() - 0.5) * 0.012,
            //     Math.random() * 0.018 + 0.005,
            //     (Math.random() - 0.5) * 0.012
            // );

            sparkGroup.add(spark);
            sparks.push(spark);
        }

        sparkGroup.userData.sparks = sparks;
        return sparkGroup;
    }

    function animate(){
        requestAnimationFrame(animate);
        camera.position.z += (targetCameraZ - camera.position.z) * 0.08;
        camera.position.x += (targetCameraX - camera.position.x) * 0.08;

        if (camera.position.z > 0 && camera.rotation.x !== 0){
            camera.rotation.x += (0 - camera.rotation.x) * 0.1;
        }

        activeSparks.forEach(sparkGroup => {
            if (!sparkGroup.visible) return;

            sparkGroup.userData.sparks.forEach(spark => {
                const flicker = Math.random() * 0.7 + 0.5;
                spark.scale.setScalar(flicker);
                spark.visible = true;
            });
        })

        renderer.render(scene, camera);
    }
    animate();

    function createSpikes(){
        const spikeGroup = new THREE.Group();
        const spikeGeom = new THREE.ConeGeometry(0.2, 0.9, 8);
        const spikeMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.2,
            metalness: 0.8
        });

        const rows = 4;
        const cols = 3;
        const spacingX = 0.5;
        const spacingZ = 0.8;

        for (let r = 0; r < rows; r++){
            for (let c = 0; c < cols; c++){
                const spike = new THREE.Mesh(spikeGeom, spikeMat);
                const xPos = (c - (cols - 1) / 2) * spacingX;
                const zPos = (r - (rows - 1) / 2) * spacingZ;

                spike.position.set(xPos, -0.8, zPos);
                spike.rotation.x = -Math.PI / 2;

                spikeGroup.add(spike);
            }
        }

        spikeGroup.visible = false;
        return spikeGroup;
    }

    function createRainbowRibbon(color, laneIndex, laneCount, laneWidth = 3.5){
        const geometry = new THREE.BufferGeometry();

        const segments = 220;
        const depth = 280;

        const vertices = [];
        const indices = [];

        // What color lanes sits across the rainbow
        const laneOffset = (laneIndex - (laneCount - 1) / 2) * laneWidth;

        for (let i = 0; i <= segments; i++){
            const progress = i / segments;

            const z = -4 - progress * depth;

            const curveX = Math.sin(progress * Math.PI * 1.15) * 12 * progress;

            const curveY = -1.5 + Math.pow(progress, 1.7) * 17;

            const spread = 1 + progress * 0.5;

            const centerX = curveX + laneOffset * spread;

            const halfWidth = laneWidth / 2;

            vertices.push(centerX - halfWidth, curveY, z);

            vertices.push(centerX + halfWidth, curveY, z);
        }

        for (let i = 0; i < segments; i++){
            const current = i * 2;
            const next = current + 2;

            indices.push(current, next, current + 1);

            indices.push(next, next + 1, current + 1);
        }

        geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));

        geometry.setIndex(indices);

        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.18,
            transparent: true,
            opacity: 0.82,
            roughness: 0.35,
            metalness: 0,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        return new THREE.Mesh(geometry, material);
    }

    // 3D translator function
    function draw3DCorridors(){
        visualCorridors.forEach(group => scene.remove(group));
        visualCorridors = [];
        bombGroups = [];
        activeSparks = [];

        if (roomGroup) scene.remove(roomGroup);
        roomGroup = new THREE.Group();

        lavaMeshes = [];

        const totalOptions = $(rabbithole).find("li");

        const spacing = 3.5;

        const shuffledPalette = [...colorPalette].sort(() => Math.random() - 0.5);

        const winningIndex = Math.floor(Math.random() * totalOptions.length);

        let laneColors = [];

        totalOptions.each(function(index){
            const colorObj = shuffledPalette[index];

            const rainbowIndex = colorPalette.findIndex(
                item => item.hex === colorObj.hex
            );

            laneColors.push(colorObj);

            $(this).data("slideColor", colorObj.hex);

            $(this).data("rainbowIndex", rainbowIndex);

            if (index === winningIndex){
                currentArrowColor = colorObj.hex;
            }
        });

        colorPalette.forEach(function(colorObj, index){
            const corridorGroup = new THREE.Group();

            const rainbowLane = createRainbowRibbon(
                colorObj.hex,
                index,
                colorPalette.length,
                spacing
            );

            corridorGroup.add(rainbowLane);

            scene.add(corridorGroup);

            visualCorridors.push(corridorGroup);
        });

        totalOptions.each(function(index){
            const rainbowIndex = $(this).data("rainbowIndex");

            const laneX = (
                rainbowIndex - (colorPalette.length - 1) / 2
            ) * spacing;

            const bombGroup =
                new THREE.Group();


            const bodyGeom =
                new THREE.SphereGeometry(
                    1.2,
                    16,
                    16
                );

            const bodyMat =
                new THREE.MeshStandardMaterial({
                    color: 0x111111,
                    roughness: 0.4
                });

            const bombBody =
                new THREE.Mesh(
                    bodyGeom,
                    bodyMat
                );

            bombGroup.add(
                bombBody
            );


            const capGeom =
                new THREE.CylinderGeometry(
                    0.3,
                    0.3,
                    0.3,
                    8
                );

            const capMat =
                new THREE.MeshStandardMaterial({
                    color: 0x888888,
                    metalness: 0.8,
                    roughness: 0.2
                });

            const bombCap =
                new THREE.Mesh(
                    capGeom,
                    capMat
                );

            bombCap.position.y = 1.2;

            bombGroup.add(
                bombCap
            );

            const fuseGeom =
                new THREE.CylinderGeometry(
                    0.06,
                    0.06,
                    0.8,
                    8
                );

            const fuseMat =
                new THREE.MeshStandardMaterial({
                    color: 0xd2b48c,
                    roughness: 0.9
                });

            const bombFuse =
                new THREE.Mesh(
                    fuseGeom,
                    fuseMat
                );

            bombFuse.position.set(
                0,
                1.6,
                0
            );

            bombFuse.rotation.x =
                -Math.PI / 6;

            bombGroup.add(
                bombFuse
            );

            const sparkParticles =
                createFuseSparks();

            sparkParticles.position.set(
                0,
                0.4,
                0
            );

            bombFuse.add(
                sparkParticles
            );

            activeSparks.push(
                sparkParticles
            );

            bombGroup.position.set(
                laneX,
                7,
                -30
            );

            bombGroup.visible = false;
            
            bombGroups.push(
                bombGroup
            );

            scene.add(bombGroup);
        });

        if (selectionMarker) scene.remove(selectionMarker);

        const markerGeom = new THREE.ConeGeometry(0.8, 1.8, 4);
        const markerMat = new THREE.MeshStandardMaterial({
            color: currentArrowColor,
            emissive: currentArrowColor,
            emissiveIntensity: 0.5,
            roughness: 0.3
        });
        selectionMarker = new THREE.Mesh(markerGeom, markerMat);
        selectionMarker.rotation.x = Math.PI;

        const initialTile = player.parent();
        const initialRainbowIndex = initialTile.data("rainbowIndex");
        const startX = Number.isFinite(initialRainbowIndex) ? (
            initialRainbowIndex - (colorPalette.length - 1) / 2
        ) * spacing : 0;

        selectionMarker.position.set(startX, 4, -28);
        scene.add(selectionMarker);
        scene.add(roomGroup);
    }

    var player = $(".js-player");
    var friend = $(".js-friend");
    var rabbithole = $("#game");

    var autoMoveTimer = null;
    var moveDirection = 1;
    //var randomNum = Math.floor(Math.random() * 4) + 2;

    // LocalStorage High Score Setup
    var highScore = localStorage.getItem("worming_high_score") || 0;
    $("#high-score-display").text("HIGH SCORE: " + highScore);
    $("#startBtn").on("click", function(e){
        e.stopPropagation();
        e.preventDefault();

        gameActive = true;

        // Hide start screen overlay and show active HUD
        $("#start-screen").hide();
        $("#hud").show();

        // Reset score
        score = 0;
        $("#msg").text(score);

        $(rabbithole).empty();
        var hallwayCount = Math.floor(Math.random() * 2) + 2;
        for (var i = 0; i < hallwayCount; i++){
            $(rabbithole).append("<li></li>");
        }
        var allLis = $(rabbithole).find("li");
        allLis.eq(0).append(player);
        var randomIndex = Math.floor(Math.random() * allLis.length);
        //allLis.eq(randomIndex).append(friend).attr("id", "checkpoint");
        const targetLi = allLis.eq(randomIndex);
        targetLi.attr("id", "checkpoint");
        targetLi.append(friend);

        $(this).hide();

        // Reset cam position
        targetCameraX = 0;
        targetCameraZ = defaultCamZ;
        camera.position.set(0, defaultCamY, defaultCamZ);
        draw3DCorridors();
        startAutoMovement();
    });

    function startAutoMovement(){
        clearInterval(autoMoveTimer);

        var initialTiles = $(rabbithole).find("li");
        var initialIndex = initialTiles.index(player.parent());
        if (selectionMarker && initialIndex !== -1){
            const spacing = 3.5;
            const initialTile = player.parent();
            const rainbowIndex = initialTile.data("rainbowIndex");
            const activeX = (
                rainbowIndex - (colorPalette.length - 1) / 2
            ) * spacing;
            selectionMarker.position.set(activeX, 4, -28);
        }

        autoMoveTimer = setInterval(function(){
            var allTiles = $(rabbithole).find("li");
            var currentTile = player.parent();
            var currentIndex = allTiles.index(currentTile);
            var targetIndex = currentIndex + moveDirection;

            if (targetIndex >= allTiles.length){
                moveDirection = -1;
                targetIndex = currentIndex + moveDirection;
            } else if (targetIndex < 0) {
                moveDirection = 1;
                targetIndex = currentIndex + moveDirection;
            }

            var targetTile = allTiles.eq(targetIndex);
            player.appendTo(targetTile);

            const spacing = 3.5;
            const rainbowIndex = targetTile.data("rainbowIndex");

            const activeX = (
                rainbowIndex - (colorPalette.length - 1) / 2
            ) * spacing;

            targetCameraX = activeX;

            visualCorridors.forEach(
                box => box.scale.set(1, 1, 1)
            );

            if (selectionMarker){
                selectionMarker.position.set(
                    activeX, 4, -28
                );
            }
        }, 400);
    }

    $(document).on("keydown", function(e){
        if (e.key === "Enter" && gameActive){
            e.preventDefault();
            attemptAdvance();
        }
    });

    $("#three-canvas").on("click", function(event){
        if (gameActive){
            attemptAdvance();
        }
    });

    function attemptAdvance(){
        clearInterval(autoMoveTimer);
        if (selectionMarker) selectionMarker.visible = false;
        var playerTile = player.parent();
        //var friendTile = friend.parent();

        var allTiles = $(rabbithole).find("li");
        var playerIndex = allTiles.index(playerTile);
        
        const spacing = 3.5;
        const rainbowIndex = playerTile.data("rainbowIndex");
        const offsetPosition = (
            rainbowIndex - 
            (colorPalette.length - 1) / 2
        ) * spacing;
        targetCameraX = offsetPosition;
        
        var playerSlideColor = playerTile.data("slideColor");
        if (playerTile.length && playerSlideColor === currentArrowColor){
            console.log("correct");
            score++;
            $("#msg").text(score);

            targetCameraX = offsetPosition;
            targetCameraZ = -24;

            setTimeout(function(){
                spawnPaths();
                camera.position.set(0, defaultCamY, defaultCamZ);
                camera.rotation.set(0, 0, 0);
                targetCameraX = 0;
                targetCameraZ = defaultCamZ;
                startAutoMovement();
            }, 900);
            
            // setTimeout(function(){
            //     spawnPaths(activeTile);
            //     camera.position.x = 0;
            //     camera.position.z = defaultCamZ;
            //     targetCameraX = 0;
            //     targetCameraZ = defaultCamZ;
            // }, 600);
            
        } else {
            gameActive = false;
            clearInterval(autoMoveTimer);
            targetCameraX = offsetPosition;
            targetCameraZ = -26;

            const bomb = bombGroups[playerIndex];

            if (bomb) {
                bomb.visible = true;
                if (activeSparks[playerIndex]) activeSparks[playerIndex].visible = true;
                let bombY = 7;

                setTimeout(() => {
                    const dropInterval = setInterval(() => {
                        bombY -= 1.0;
                        bomb.position.y = bombY;

                        if (bombY <= -0.5){
                            clearInterval(dropInterval);

                            //if (activeSparks[playerIndex]) activeSparks[playerIndex].visible = false;

                            scene.fog.color.setHex(0xff0000);
                            scene.fog.density = 0.03;

                            let shakeCount = 0;
                            const shakeInterval = setInterval(function(){
                                camera.position.x = targetCameraX + (Math.random() - 0.5) * 0.6;
                                camera.position.y = defaultCamY + (Math.random() - 0.5) * 0.6;

                                shakeCount++;
                                if (shakeCount > 12) clearInterval(shakeInterval);
                            }, 40);

                            setTimeout(function(){
                                playGameOverBurst(function(){
                                    scene.fog.color.setHex(skyColor);
                                    scene.fog.density = 0.005;

                                    camera.position.set(0, defaultCamY, defaultCamZ);
                                    camera.rotation.set(0, 0, 0);
                                    targetCameraX = 0;
                                    targetCameraZ = defaultCamZ;
                                    gameOver();
                                });
                            }, 1800);
                        }
                    }, 20);
                }, 500);
            }
        }
    }

    function spawnPaths(){
        //activeTile.removeAttr("id");
        $(rabbithole).empty();

        var hallwayCount = Math.floor(Math.random() * 2) + 2;

        for (var i = 0; i < hallwayCount; i++){
            $(rabbithole).append("<li></li>");
        }

        var newLis = $(rabbithole).find("li");
        newLis.eq(0).append(player);
        
        var randomIndex = Math.floor(Math.random() * newLis.length);
        const targetLi = newLis.eq(randomIndex);
        targetLi.attr("id", "checkpoint");
        targetLi.append(friend);

        draw3DCorridors();
    }

    function playGameOverBurst(callback){
        const overlay = document.createElement("div");

        Object.assign(overlay.style, {
            position: "fixed",
            inset: "0",
            zIndex: "99999",
            pointerEvents: "none",
            overflow: "hidden"
        });

        document.body.appendChild(overlay);

        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        const sharedCount = 12;

        for (let i = 0; i < sharedCount; i++){
            const shard = document.createElement("div");

            const angle = (Math.PI * 2 / sharedCount) * i;
            const distance = Math.max(
                window.innerWidth,
                window.innerHeight
            ) * 0.75;

            const width = 80 + Math.random() * 120;
            const height = 350 + Math.random() * 350;

            Object.assign(shard.style, {
                position: "absolute",
                left: centerX + "px",
                top: centerY + "px",
                width: width + "px",
                height: height + "px",
                background: "white",
                clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                transformOrigin: "50% 0%",
                opacity: "0",
                transform: `
                translate(-50%, 0)
                rotate(${angle}rad)
                scaleY(0)`,
                transition: "transform 450ms cubic-bezier(.2,.8,.2,1), opacity 180ms ease"
            });

            overlay.appendChild(shard);

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    shard.style.opacity = "0.95";

                    shard.style.transform = `
                    translate(-50%, 0)
                    rotate(${angle}rad)
                    scaleY(1)`;
                });
            });
        }

        const flash = document.createElement("div");

        Object.assign(flash.style, {
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "white",
            transform: "translate(-50%, -50%) scale(0)",
            opacity: "1",
            transition: "transform 400ms ease-out, opacity 500ms ease-out"
        });

        overlay.appendChild(flash);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                flash.style.transform = "translate(-50%, -50%) scale(35)";

                flash.style.opacity = "0";
            }, 500);
        })

        setTimeout(() => {
            overlay.style.transition = "opacity 200ms ease";
            overlay.style.opacity = "0";
        }, 500);

        setTimeout(() => {
            overlay.remove();

            if (callback){
                callback();
            }
        }, 700);
    }

    function gameOver(){
        gameActive = false;
        clearInterval(autoMoveTimer);

        // Check and save high score
        if (score > highScore){
            highScore = score;
            localStorage.setItem("worming_high_score", highScore);
        }
        
        // Reset Ui to start screen
        $("#final-score").text(score);
        $("#final-high-score").text(highScore);
        $("#high-score-display").text("HIGH SCORE: " + highScore);
        $("#hud").hide();
        $("#start-screen").hide();
        $("#game-over-screen").show();
    }

    $("#restartBtn").on("click", function(e){
        e.stopPropagation();
        e.preventDefault();

        $("#game-over-screen").hide();

        gameActive = true;

        score = 0;
        $("#msg").text(score);
        $("#hud").show();

        scene.fog.color.setHex(skyColor);
        scene.fog.density = 0.005;

        camera.position.set(0, defaultCamY, defaultCamZ);
        camera.rotation.set(0, 0, 0);

        targetCameraX = 0;
        targetCameraZ = defaultCamZ;

        $(rabbithole).empty();

        var hallwayCount = Math.floor(Math.random() * 2) + 2;

        for (var i = 0; i < hallwayCount; i++){
            $(rabbithole).append("<li></li>");
        }

        var allLis = $(rabbithole).find("li");

        allLis.eq(0).append(player);
        var randomIndex = Math.floor(Math.random() * allLis.length);
        const targetLi = allLis.eq(randomIndex);

        allLis.attr("id", "checkpoint");
        targetLi.append(friend);

        draw3DCorridors();
        startAutoMovement();
    })

    $(window).on("resize", function(){
        const isMobile = window.innerWidth < 1024;
        const currentCamZ = isMobile ? 2.8 : 5;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.fov = isMobile ? 55 : 45;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize($(window).width(), $(window).height());
        draw3DCorridors();
    });

});