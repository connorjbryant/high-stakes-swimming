jQuery(function($){

    const scene = new THREE.Scene();
    const skyColor = 0x66ccff;
    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.FogExp2(skyColor, 0.005);
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("three-canvas"), antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Camera pos
    const defaultCamY = 1.8;
    const defaultCamZ = 12;
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
    let roomGroup = null; // Container to manage global room geometry cleanly
    let selectionMarker = null;

    var score = 0;
    var gameActive = false;

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

    // 3D translator function
    function draw3DCorridors(){
        visualCorridors.forEach(group => scene.remove(group));
        visualCorridors = [];

        if (roomGroup) scene.remove(roomGroup);
        roomGroup = new THREE.Group();

        const totalOptions = $(rabbithole).find("li");
        const isMobile = $(window).width() < 768;

        const spacing = 5;
        const w = spacing;
        const h = 4;
        const d = 40;
        const roomWidth = Math.max(totalOptions.length * spacing, 40);

        totalOptions.each(function(index){
            const layoutOffset = (index - (totalOptions.length - 1) / 2) * spacing;

            const corridorGroup = new THREE.Group();

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
            const ropeMat = new THREE.MeshStandardMaterial({ color: ropeColor, roughness: 0.3 });

            const ropeGeom = new THREE.CylinderGeometry(0.12, 0.12, d, 8);

            const leftRope = new THREE.Mesh(ropeGeom, ropeMat);
            leftRope.position.set(-spacing / 2, 0, -d / 2);
            leftRope.rotation.x = Math.PI / 2;
            corridorGroup.add(leftRope);

            const rightRope = new THREE.Mesh(ropeGeom, ropeMat);
            rightRope.position.set(spacing / 2, 0, -d / 2);
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

            const slideColor = isCheckpoint ? 0xffaa00 : 0x00aaff;
            const slideMat = new THREE.MeshStandardMaterial({
                color: slideColor,
                roughness: 0.1,
                side: THREE.DoubleSide
            });

            const slide = new THREE.Mesh(slideGeom, slideMat);

            //slide.rotation.z = Math.PI;
            slide.rotation.x = Math.PI / 2.3;
            slide.position.set(0, -0.8, -d - 2);
            corridorGroup.add(slide);

            corridorGroup.position.set(layoutOffset, 0, 0);

            scene.add(corridorGroup);
            visualCorridors.push(corridorGroup);
        });

        // Shared Room Structure
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a4b6e, roughness: 0.2 });
        const waterMat = new THREE.MeshStandardMaterial({ color: 0x00aaff, transparent: true, opacity: 0.45 });
        const outerWallMat = new THREE.MeshStandardMaterial({ color: 0x0a2d4a, roughness: 0.7, side: THREE.DoubleSide });

        const globalFloor = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth + 20, d + 20), floorMat);
        globalFloor.position.set(0, -h / 2, -d / 2 + 1);
        globalFloor.rotation.x = -Math.PI / 2;
        roomGroup.add(globalFloor);

        const waterSurface = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth + 20, d + 20), waterMat);
        waterSurface.position.set(0, -0.1, -d / 2 + 1);
        waterSurface.rotation.x = -Math.PI / 2;
        roomGroup.add(waterSurface);

        const farLeftWall = new THREE.Mesh(new THREE.PlaneGeometry(d + 40, h * 2), outerWallMat);
        farLeftWall.position.set(-roomWidth / 2 - 2, 0, -d / 2);
        farLeftWall.rotation.y = Math.PI / 2;
        roomGroup.add(farLeftWall);

        const farRightWall = new THREE.Mesh(new THREE.PlaneGeometry(d + 40, h * 2), outerWallMat);
        farRightWall.position.set(roomWidth / 2 + 2, 0, -d / 2);
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
        const markerGeom = new THREE.RingGeometry(0.8, 1.2, 32);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide });
        selectionMarker = new THREE.Mesh(markerGeom, markerMat);
        selectionMarker.rotation.x = Math.PI / 2;

        const initialTiles = $(rabbithole).find("li");
        const pIndex = initialTiles.index(player.parent());
        const startX = pIndex > -1 ? (pIndex - (initialTiles.length - 1) / 2) * spacing : 0;
        selectionMarker.position.set(startX, 0.1, 2.5);
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
        var hallwayCount = Math.floor(Math.random() * 4) + 2;
        for (var i = 0; i < hallwayCount; i++){
            $(rabbithole).append("<li></li>");
        }
        var allLis = $(rabbithole).find("li");
        allLis.eq(0).append(player);
        var randomIndex = Math.floor(Math.random() * allLis.length);
        allLis.eq(randomIndex).append(friend).attr("id", "checkpoint");

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
            selectionMarker.position.x = (initialIndex - (initialTiles.length - 1) / 2) * spacing;
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

            visualCorridors.forEach(box => box.scale.set(1, 1, 1));

            if (selectionMarker) {
                const spacing = 5;
                const activeX = (targetIndex - (allTiles.length - 1) / 2) * spacing;
                selectionMarker.position.x = activeX;
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
        var playerTile = player.parent();
        var friendTile = friend.parent();
        
        if (playerTile.length && friendTile.length && playerTile.is(friendTile)){
            console.log("correct");
            score++;
            $("#msg").text(score);
            var activeTile = $("#checkpoint");
            
            var allTiles = $(rabbithole).find("> li");
            var winIndex = allTiles.index(activeTile);
            
            const spacing = 5;
            const offsetPosition = (winIndex - (allTiles.length - 1) / 2) * spacing;

            targetCameraX = offsetPosition;
            targetCameraZ = -38;

            setTimeout(function(){
                camera.rotation.x = -Math.PI / 6;
                camera.position.y = -2.5;
                targetCameraZ = -52;
            }, 450);

            setTimeout(function(){
                spawnPaths(activeTile);
                camera.position.set(0, defaultCamY, defaultCamZ);
                camera.rotation.set(0, 0, 0);
                targetCameraX = 0;
                targetCameraZ = defaultCamZ;
            }, 1200);
            
            // setTimeout(function(){
            //     spawnPaths(activeTile);
            //     camera.position.x = 0;
            //     camera.position.z = defaultCamZ;
            //     targetCameraX = 0;
            //     targetCameraZ = defaultCamZ;
            // }, 600);
            
        } else {
            console.log("wrong");
            gameOver();
        }
    }

    function spawnPaths(activeTile){
        activeTile.removeAttr("id");
        $(rabbithole).empty();

        var hallwayCount = Math.floor(Math.random() * 4) + 2;

        for (var i = 0; i < hallwayCount; i++){
            $(rabbithole).append("<li></li>");
        }

        var newLis = $(rabbithole).find("li");
        newLis.eq(0).append(player);
        var randomIndex = Math.floor(Math.random() * newLis.length);
        newLis.eq(randomIndex).append(friend).attr("id", "checkpoint");

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
            alert("GAME OVER! Score: " + score);
        }
        
        // Reset Ui to start screen
        $("#high-score-display").text("HIGH SCORE: " + highScore);
        $("#hud").hide();
        $("#start-screen").show();
        $("#startBtn").show().text("Try Again?");
    }

    $(window).on("resize", function(){
        camera.aspect = $(window).width() / $(window).height();
        camera.updateProjectionMatrix();
        renderer.setSize($(window).width(), $(window).height());
        draw3DCorridors();
    });

});