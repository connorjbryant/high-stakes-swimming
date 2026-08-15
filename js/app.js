jQuery(function($){

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("three-canvas"), antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Camera pos for hallways
    camera.position.set(0, 0, 8);
    camera.lookAt(0, 0, -5);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.8, 60);
    pointLight.position.set(0, 2, 2);
    scene.add(pointLight);

    let targetCameraZ = 8;
    let visualCorridors = [];
    let roomGroup = null; // Container to manage global room geometry cleanly
    let selectionMarker = null;

    function animate(){
        requestAnimationFrame(animate);
        camera.position.z += (targetCameraZ - camera.position.z) * 0.1;
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
        targetCameraZ = 8;

        const spacing = 5;
        const w = spacing;
        const h = 4;
        const d= 15;
        const roomWidth = totalOptions.length * spacing;

        totalOptions.each(function(index){
            const layoutOffset = (index - (totalOptions.length - 1) / 2) * spacing;

            const corridorGroup = new THREE.Group();

            const isCheckpoint = ($(this).attr("id") === "checkpoint");
            const wallColor = isCheckpoint ? 0x113322 : 0x1a2536; 
            const trimColor = isCheckpoint ? 0x00ffcc : 0xff00ff;

            const corridorWallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.6, side: THREE.DoubleSide });
            const trimMat = new THREE.LineBasicMaterial({ color: trimColor, linewidth: 2 });

            // Left Wall
            const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(d, h), corridorWallMat);
            leftWall.position.set(-w/2, 0, 0);
            leftWall.rotation.y = Math.PI / 2;
            corridorGroup.add(leftWall);

            // Right Wall
            const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(d, h), corridorWallMat);
            rightWall.position.set(w/2, 0, 0);
            rightWall.rotation.y = -Math.PI / 2;
            corridorGroup.add(rightWall);

            const backWallMat = new THREE.MeshStandardMaterial({ color: 0x0d1117, roughness: 0.8 });
            const backWall = new THREE.Mesh(new THREE.PlaneGeometry(w, h), backWallMat);
            backWall.position.set(0, 0, -d/2);
            corridorGroup.add(backWall);

            // Neon door trims on entrance and exit
            const entranceGeom = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-w/2, -h/2, d/2), new THREE.Vector3(-w/2, h/2, d/2),
                new THREE.Vector3(w/2, h/2, d/2), new THREE.Vector3(w/2, -h/2, d/2),
                new THREE.Vector3(-w/2, -h/2, d/2)
            ]);
            const exitGeom = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-w/2, -h/2, -d/2), new THREE.Vector3(-w/2, h/2, -d/2),
                new THREE.Vector3(w/2, h/2, -d/2), new THREE.Vector3(w/2, -h/2, -d/2),
                new THREE.Vector3(-w/2, -h/2, -d/2)
            ]);
            corridorGroup.add(new THREE.Line(entranceGeom, trimMat));
            corridorGroup.add(new THREE.Line(exitGeom, trimMat));

            corridorGroup.position.set(layoutOffset, 0, -d/2);

            scene.add(corridorGroup);
            visualCorridors.push(corridorGroup);
        });

        // Shared Room Structure
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x181820, roughness: 0.4, side: THREE.DoubleSide });
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x101015, roughness: 0.5, side: THREE.DoubleSide });
        const outerWallMat = new THREE.MeshStandardMaterial({ color: 0x0a0d14, roughness: 0.7, side: THREE.DoubleSide });

        const globalFloor = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, d + 10), floorMat);
        globalFloor.position.set(0, -h / 2, -d / 2 + 5);
        globalFloor.rotation.x = -Math.PI / 2;
        roomGroup.add(globalFloor);

        const globalCeiling = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, d + 10), roofMat);
        globalCeiling.position.set(0, h / 2, -d / 2 + 5);
        globalCeiling.rotation.x = Math.PI / 2;
        roomGroup.add(globalCeiling);

        const farLeftWall = new THREE.Mesh(new THREE.PlaneGeometry(d + 10, h), outerWallMat);
        farLeftWall.position.set(-roomWidth / 2, 0, -d / 2 + 5);
        farLeftWall.rotation.y = Math.PI / 2;
        roomGroup.add(farLeftWall);

        const farRightWall = new THREE.Mesh(new THREE.PlaneGeometry(d + 10, h), outerWallMat);
        farRightWall.position.set(roomWidth / 2, 0, -d / 2 + 5);
        farRightWall.rotation.y = -Math.PI / 2;
        roomGroup.add(farRightWall);

        // Floor and Ceiling Grid Helpers (fixed THREE.GridHelper spelling)
        // const floorGrid = new THREE.GridHelper(roomWidth, totalOptions.length, 0x00ffcc, 0x334455);
        // floorGrid.position.set(0, -h / 2 + 0.01, -d / 2);
        // roomGroup.add(floorGrid);

        // const ceilingGrid = new THREE.GridHelper(roomWidth, totalOptions.length, 0xff00ff, 0x334455);
        // ceilingGrid.position.set(0, h / 2 - 0.01, -d / 2);
        // roomGroup.add(ceilingGrid);

        const globalBackWall = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, h), outerWallMat);
        globalBackWall.position.set(0, 0, -d);
        roomGroup.add(globalBackWall);

        if (selectionMarker) scene.remove(selectionMarker);
        const markerGeom = new THREE.RingGeometry(0.8, 1.2, 32);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide });
        selectionMarker = new THREE.Mesh(markerGeom, markerMat);
        selectionMarker.rotation.x = Math.PI / 2;

        const initialTiles = $(rabbithole).find("li");
        const pIndex = initialTiles.index(player.parent());
        const startX = pIndex > -1 ? (pIndex - (initialTiles - 1) / 2) * spacing : 0;
        selectionMarker.position.set(startX, -h / 2 + 0.08, 2.5);
        scene.add(selectionMarker);

        scene.add(roomGroup);
    }

    var player = $(".js-player");
    var friend = $(".js-friend");
    var rabbithole = $("#game");

    var autoMoveTimer = null;
    var moveDirection = 1;
    var randomNum = Math.floor(Math.random() * 4) + 2;

    $("#startBtn").on("click", function(e){
        e.stopPropagation();
        $(rabbithole).empty();
        for (var i = 0; i <= randomNum; i++){
            $(rabbithole).append("<li></li>");
        }
        var allLis = $(rabbithole).find("li");
        allLis.eq(0).append(player);
        var randomIndex = Math.floor(Math.random() * allLis.length);
        allLis.eq(randomIndex).append(friend).attr("id", "checkpoint");

        $(this).hide();
        draw3DCorridors();
        startAutoMovement();
    });

    function startAutoMovement(){
        clearInterval(autoMoveTimer);

        var initialTiles = $(rabbithole).find("li");
        var initialIndex = initialTiles.index(player.parent());
        if (selectionMarker && initialIndex !== -1){
            const spacing = 5;
            selectionMarker.position.x = (initialIndex - (initialTiles.length - 1) /2) * spacing;
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
        if (e.key === "Enter"){
            e.preventDefault();
            attemptAdvance();
        }
    });

    $("#three-canvas").on("click", function(event){
        attemptAdvance();
    });

    function attemptAdvance(){
        var playerTile = player.parent();
        var friendTile = friend.parent();
        
        if (playerTile.length && friendTile.length && playerTile.is(friendTile)){
            console.log("correct");
            var activeTile = $("#checkpoint");
            
            var allTiles = $(rabbithole).find("> li");
            var winIndex = allTiles.index(activeTile);
            
            const spacing = 5;
            const offsetPosition = (winIndex - (allTiles.length - 1) / 2) * spacing;

            camera.position.x = offsetPosition;
            targetCameraZ = -14;
            
            setTimeout(function(){
                spawnPaths(activeTile);
                camera.position.set(0, 0, 8); 
                targetCameraZ = 8;
            }, 500);
            
        } else {
            console.log("wrong");
            gameOver();
        }
    }

    function spawnPaths(activeTile){
        activeTile.removeAttr("id");
        $(rabbithole).empty();

        var freshRandomNum = Math.floor(Math.random() * 4) + 2;

        for (var i = 0; i <= freshRandomNum; i++){
            $(rabbithole).append("<li></li>");
        }

        var newLis = $(rabbithole).find("> li");
        newLis.eq(0).append(player);
        var randomIndex = Math.floor(Math.random() * newLis.length);
        newLis.eq(randomIndex).append(friend).attr("id", "checkpoint");

        draw3DCorridors();
    }

    function gameOver(){
        clearInterval(autoMoveTimer);
        alert("game over");
        $("#startBtn").show().text("Try Again?");
        location.reload();
    }

    $(window).on("resize", function(){
        camera.aspect = $(window).width() / $(window).height();
        camera.updateProjectionMatrix();
        renderer.setSize($(window).width(), $(window).height());
        draw3DCorridors();
    });

});