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
    const defaultCamY = 1.55;
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
    let roomGroup = null; // Container to manage global room geometry cleanly
    let selectionMarker = null;

    var score = 0;
    var gameActive = false;
    let currentArrowColor = 0xffff00;

    const colorPalette = [
        { hex: 0xff3333, emissive: 0x550000 }, //Red
        { hex: 0x33ff33, emissive: 0x005500 }, //Green
        { hex: 0x3388ff, emissive: 0x002255 }, //Blue
        { hex: 0xffff33, emissive: 0x555500 }, //Yellow
        { hex: 0xff33ff, emissive: 0x550055 }, //Magenta
        { hex: 0x33ffff, emissive: 0x005555 } //Cyan
    ];

    function animate(){
        requestAnimationFrame(animate);
        camera.position.z += (targetCameraZ - camera.position.z) * 0.08;
        camera.position.x += (targetCameraX - camera.position.x) * 0.08;

        if (camera.position.z > 0 && camera.rotation.x !== 0){
            camera.rotation.x += (0 - camera.rotation.x) * 0.1;
        }

        renderer.render(scene, camera);
    }
    animate();

    function createTileTexture(){
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = "#f0f4f8";
        ctx.fillRect(0, 0, 256, 256);

        ctx.strokeStyle = "#c0c9d0";
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, 256, 256);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    const tileTexture = createTileTexture();

    // 3D translator function
    function draw3DCorridors(){
        visualCorridors.forEach(group => scene.remove(group));
        visualCorridors = [];

        if (roomGroup) scene.remove(roomGroup);
        roomGroup = new THREE.Group();

        lavaMeshes = [];

        const totalOptions = $(rabbithole).find("li");

        const spacing = 5;
        const h = 4;
        const d = 30;
        const roomWidth = Math.max(totalOptions.length * spacing, 30);

        const shuffledPalette = [...colorPalette].sort(() => Math.random() - 0.5);
        const winningIndex = Math.floor(Math.random() * totalOptions.length);

        let laneColors = [];

        totalOptions.each(function(index){
            const colorObj = shuffledPalette[index % shuffledPalette.length];
            laneColors.push(colorObj);
            $(this).data("slideColor", colorObj.hex);

            if (index === winningIndex){
                currentArrowColor = colorObj.hex;
            }
        });

        totalOptions.each(function(index){
            const layoutOffset = (index - (totalOptions.length - 1) / 2) * spacing;

            const corridorGroup = new THREE.Group();
            const colorObj = laneColors[index];

            const isCheckpoint = ($(this).attr("id") === "checkpoint");
            const wallColor = isCheckpoint ? 0x00ffcc : 0x005588; 
            const trimColor = isCheckpoint ? 0xffd700 : 0x0088cc;

            const corridorWallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.6, side: THREE.DoubleSide });
            const trimMat = new THREE.LineBasicMaterial({ color: trimColor, linewidth: 2 });

            // Left Wall
            // const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(d, h), corridorWallMat);
            // leftWall.position.set(-w/2, 0, 0);
            // leftWall.rotation.y = Math.PI / 2;
            // corridorGroup.add(leftWall);

            // // Right Wall
            // const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(d, h), corridorWallMat);
            // rightWall.position.set(w/2, 0, 0);
            // rightWall.rotation.y = -Math.PI / 2;
            // corridorGroup.add(rightWall);

            const ropeColor = isCheckpoint ? 0xffd700 : 0x0088cc;
            const ropeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });

            const ropeGeom = new THREE.CylinderGeometry(0.12, 0.12, d, 8);

            const leftRope = new THREE.Mesh(ropeGeom, ropeMat);
            leftRope.position.set(-spacing / 2, -h / 2 + 1.2, -d / 2);
            leftRope.rotation.x = Math.PI / 2;
            corridorGroup.add(leftRope);

            const rightRope = new THREE.Mesh(ropeGeom, ropeMat);
            rightRope.position.set(spacing / 2, -h / 2 + 1.2, -d / 2);
            rightRope.rotation.x = Math.PI / 2;
            corridorGroup.add(rightRope);

            // const backWallMat = new THREE.MeshStandardMaterial({ color: 0x0d1117, roughness: 0.8 });
            // const backWall = new THREE.Mesh(new THREE.PlaneGeometry(w, h), backWallMat);
            // backWall.position.set(0, 0, -d/2);
            // corridorGroup.add(backWall);

            // Swimming T markers
            const centerLineGeom = new THREE.PlaneGeometry(0.2, d - 4);
            const tMat = new THREE.MeshBasicMaterial({ color: 0x001122, side: THREE.DoubleSide });
            const centerLine = new THREE.Mesh(centerLineGeom, tMat);
            centerLine.rotation.x = -Math.PI / 2;
            centerLine.position.set(0, -h / 2 + 0.02, 1);
            corridorGroup.add(centerLine);

            const crossbarGeom = new THREE.PlaneGeometry(1.2, 0.2);
            const crossbar = new THREE.Mesh(crossbarGeom, tMat);
            crossbar.rotation.x = -Math.PI / 2;
            crossbar.position.set(0, -h / 2 + 0.02, -d / 2 + 1.5);
            corridorGroup.add(crossbar);

            // Waterslide at lane end
            const slideGeom = new THREE.CylinderGeometry(1.8, 1.8, 20, 16, 1, true, 0, Math.PI * 2);

            const slideColor = isCheckpoint ? 0xffaa00 : 0xff00de;

            const emissiveColor = isCheckpoint ? 0x004433 : 0x991100;

            const slideMat = new THREE.MeshStandardMaterial({
                color: colorObj.hex,
                emissive: colorObj.emissive,
                emissiveIntensity: 0.6,
                roughness: 0.2,
                side: THREE.DoubleSide
            });

            const slide = new THREE.Mesh(slideGeom, slideMat);

            //slide.rotation.z = Math.PI;
            slide.rotation.x = Math.PI / 2.3;
            slide.position.set(0, -0.8, -d - 2);
            corridorGroup.add(slide);

            if (!isCheckpoint){
                const lavaGeom = new THREE.PlaneGeometry(2000, 400);
                const lavaMat = new THREE.MeshBasicMaterial({
                    color: 0xff2200,
                    side: THREE.DoubleSide
                });
                const lavaPit = new THREE.Mesh(lavaGeom, lavaMat);
                lavaPit.rotation.x = -Math.PI / 2;
                lavaPit.position.set(0, -11.4, -d - 40);
                lavaPit.visible = false;
                corridorGroup.add(lavaPit);
                lavaMeshes.push(lavaPit);
            }

            corridorGroup.position.set(layoutOffset, 0, 0);

            scene.add(corridorGroup);
            visualCorridors.push(corridorGroup);
        });

        // Shared Room Structure
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a4b6e, roughness: 0.2 });
        const waterMat = new THREE.MeshStandardMaterial({ color: 0x00aaff, transparent: true, opacity: 0.45 });
        const outerWallMat = new THREE.MeshStandardMaterial({ color: 0x0a2d4a, roughness: 0.7, side: THREE.DoubleSide });

        const totalWorldDepth = 300;
        const groundDepth = d + 20;

        const upperDepth = d;
        const upperFloorMat = new THREE.MeshStandardMaterial({ color: 0x0a4b6e, roughness: 0.2 });
        const upperWaterMat = new THREE.MeshStandardMaterial({ color: 0x00aaff, transparent: true, opacity: 0.45 });

        const upperWater = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, upperDepth), upperWaterMat);
        upperWater.position.set(0, -h / 2 + 1.2, -upperDepth / 2);
        upperWater.rotation.x = -Math.PI / 2;
        roomGroup.add(upperWater);

        const upperFloor = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, upperDepth), upperFloorMat);
        upperFloor.position.set(0, -h / 2, -upperDepth / 2);
        upperFloor.rotation.x = -Math.PI / 2;
        roomGroup.add(upperFloor);

        const poolY = -12;
        const basinDepth = 150;
        const basinWidth = roomWidth + 80;

        const lowerFloor = new THREE.Mesh(new THREE.PlaneGeometry(basinWidth, basinDepth), upperFloorMat);

        lowerFloor.position.set(0, poolY, -d - (basinDepth / 2));

        lowerFloor.rotation.x = -Math.PI / 2;
        roomGroup.add(lowerFloor);

        const lowerWater = new THREE.Mesh(new THREE.PlaneGeometry(basinWidth, basinDepth), upperWaterMat);
        lowerWater.position.set(0, poolY + 6.0, -d - (basinDepth / 2));
        lowerWater.rotation.x = -Math.PI / 2;
        roomGroup.add(lowerWater);

        const tiledWallTexture = tileTexture.clone();
        tiledWallTexture.needsUpdate = true;
        tiledWallTexture.repeat.set(50, 6);

        const tileWallMat = new THREE.MeshStandardMaterial({
            map: tiledWallTexture,
            roughness: 0.3,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        const ledgeWall = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, Math.abs(poolY - (-h / 2))), tileWallMat);
        ledgeWall.position.set(0, (poolY + (-h / 2)) / 2, -d);
        roomGroup.add(ledgeWall);

        const wallDepth = 300;
        const wallHeight = h * 10;

        const farLeftWall = new THREE.Mesh(new THREE.PlaneGeometry(wallDepth, wallHeight), tileWallMat);
        farLeftWall.position.set(-roomWidth / 2 - 2, poolY / 2, -wallDepth / 2 + 20);
        farLeftWall.rotation.y = Math.PI / 2;
        roomGroup.add(farLeftWall);

        const farRightWall = new THREE.Mesh(new THREE.PlaneGeometry(wallDepth, wallHeight), tileWallMat);
        farRightWall.position.set(roomWidth / 2 + 2, poolY / 2, -wallDepth / 2 + 20);
        farRightWall.rotation.y = -Math.PI / 2;
        roomGroup.add(farRightWall);

        // Floor and Ceiling Grid Helpers (fixed THREE.GridHelper spelling)
        // const floorGrid = new THREE.GridHelper(roomWidth, totalOptions.length, 0x00ffcc, 0x334455);
        // floorGrid.position.set(0, -h / 2 + 0.01, -d / 2);
        // roomGroup.add(floorGrid);

        // const ceilingGrid = new THREE.GridHelper(roomWidth, totalOptions.length, 0xff00ff, 0x334455);
        // ceilingGrid.position.set(0, h / 2 - 0.01, -d / 2);
        // roomGroup.add(ceilingGrid);

        // const globalBackWall = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, h), outerWallMat);
        // globalBackWall.position.set(0, 0, -d);
        // roomGroup.add(globalBackWall);

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

        const initialTiles = $(rabbithole).find("li");
        const pIndex = initialTiles.index(player.parent());
        const startX = pIndex > -1 ? (pIndex - (initialTiles.length - 1) / 2) * spacing: 0;

        selectionMarker.position.set(startX, 4.5, -d - 2);
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
            const spacing = 5;
            const activeX = (initialIndex - (initialTiles.length - 1) / 2) * spacing;
            selectionMarker.position.set(activeX, 4.5, -42);
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

            const spacing = 5;
            const activeX = (targetIndex - (allTiles.length - 1) / 2) * spacing;
            targetCameraX = activeX;

            visualCorridors.forEach(box => box.scale.set(1, 1, 1));

            if (selectionMarker) {
                selectionMarker.position.set(activeX, 4.5, -42);
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
        
        const spacing = 5;
        const offsetPosition = (playerIndex - (allTiles.length - 1) / 2) * spacing;
        targetCameraX = offsetPosition;
        
        var playerSlideColor = playerTile.data("slideColor");
        if (playerTile.length && playerSlideColor === currentArrowColor){
            console.log("correct");
            score++;
            $("#msg").text(score);
            var activeTile = $("#checkpoint");

            lavaMeshes.forEach(mesh => mesh.visible = false);

            targetCameraX = offsetPosition;
            targetCameraZ = -38;

            setTimeout(function(){
                camera.rotation.x = -Math.PI / 4;
                camera.position.y = -8;
                targetCameraZ = -45;
            }, 450);

            setTimeout(function(){
                camera.rotation.x = -Math.PI / 6;
                camera.position.y = 0.5;
                targetCameraZ = -42;
            }, 450);

            setTimeout(function(){
                spawnPaths();
                camera.position.set(0, defaultCamY, defaultCamZ);
                camera.rotation.set(0, 0, 0);
                targetCameraX = 0;
                targetCameraZ = defaultCamZ;
                startAutoMovement();
            }, 1200);
            
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
            targetCameraZ = -38;

            //lavaMeshes.forEach(mesh => mesh.visible = true);

            scene.fog.color.setHex(0xff0000);
            scene.fog.density = 0.04;
            
            setTimeout(function(){
                camera.position.x += (Math.random() - 0.5) * 1.5;
                camera.position.y += (Math.random() - 0.5) * 1.5;
            }, 350);

            setTimeout(function(){
                scene.fog.color.setHex(skyColor);
                scene.fog.density = 0.005;

                camera.position.set(0, defaultCamY, defaultCamZ);
                camera.rotation.set(0, 0, 0);
                targetCameraX = 0;
                targetCameraZ = defaultCamZ;
                gameOver();
            }, 1200);
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
        newLis.eq(0).append(friend);

        draw3DCorridors();
    }

    function gameOver(){
        gameActive = false;
        clearInterval(autoMoveTimer);

        // Check and save high score
        if (score > highScore){
            highScore = score;
            localStorage.setItem("worming_high_score", highScore);
            alert("NEW HIGH SCORE: " + score + "!");
        } else {
            alert("GAME OVER! You chose the wrong slide. Score: " + score);
        }
        
        // Reset Ui to start screen
        $("#high-score-display").text("HIGH SCORE: " + highScore);
        $("#hud").hide();
        $("#start-screen").show();
        $("#startBtn").show().text("Try Again?");
    }

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