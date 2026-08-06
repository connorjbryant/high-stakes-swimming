jQuery(function($){

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("three-canvas"), antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Camera pos for hallways
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, -5);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.5, 30);
    pointLight.position.set(0, 0, 5);
    scene.add(pointLight);

    let targetCameraZ = 8;

    let visualCorridors = [];

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

        const totalOptions = $(rabbithole).find("li");
        const isMobile = $(window).width() < 768;

        totalOptions.each(function(index){
            const spacing = 5;
            const layoutOffset = (index - (totalOptions.length - 1) / 2) * spacing;

            // 1. Create a 3D Group to hold our individual walls
            const corridorGroup = new THREE.Group();

            // 2. Define our dimensions
            const w = 4;  // Width of tunnel
            const h = 4;  // Height of tunnel
            const d = 15; // Length of tunnel

            // 3. Mechanic colors: Green/Mint for checkpoint, retro Wolfenstein blue/grey for walls
            const isCheckpoint = ($(this).attr("id") === "checkpoint");
            const wallColor = isCheckpoint ? 0x113322 : 0x1a2536; 
            const trimColor = isCheckpoint ? 0x00ffcc : 0xff00ff;

            // 4. Create standard light-reactive wall materials
            const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.7 });
            const floorMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 }); // Dark floor
            const roofMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1.0 });  // Dark ceiling
            const trimMat = new THREE.LineBasicMaterial({ color: trimColor });

            // Left Wall
            const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(d, h), wallMat);
            leftWall.position.set(-w/2, 0, -d/2);
            leftWall.rotation.y = Math.PI / 2;
            corridorGroup.add(leftWall);

            // Right Wall
            const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(d, h), wallMat);
            rightWall.position.set(w/2, 0, -d/2);
            rightWall.rotation.y = -Math.PI / 2;
            corridorGroup.add(rightWall);

            // Floor
            const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat);
            floor.position.set(0, -h/2, -d/2);
            floor.rotation.x = -Math.PI / 2;
            corridorGroup.add(floor);

            // Ceiling
            const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(w, d), roofMat);
            ceiling.position.set(0, h/2, -d/2);
            ceiling.rotation.x = Math.PI / 2;
            corridorGroup.add(ceiling);

            // 5. Add retro neon door trims on the entrance and exits
            const entranceGeom = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-w/2, -h/2, 0), new THREE.Vector3(-w/2, h/2, 0),
                new THREE.Vector3(w/2, h/2, 0), new THREE.Vector3(w/2, -h/2, 0)
            ]);
            const exitGeom = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-w/2, -h/2, -d), new THREE.Vector3(-w/2, h/2, -d),
                new THREE.Vector3(w/2, h/2, -d), new THREE.Vector3(w/2, -h/2, -d)
            ]);
            corridorGroup.add(new THREE.Line(entranceGeom, trimMat));
            corridorGroup.add(new THREE.Line(exitGeom, trimMat));

            // 6. Positioning the entire group adaptively
            if (isMobile) {
                corridorGroup.position.set(0, layoutOffset, 0);
            } else {
                corridorGroup.position.set(layoutOffset, 0, 0);
            }

            scene.add(corridorGroup);
            visualCorridors.push(corridorGroup); // Save group reference for the pulsing scales
        });
    }


    var player = $(".js-player");
    var friend = $(".js-friend");
    var rabbithole = $("#game");

    // Game vars
    var autoMoveTimer = null;
    var moveDirection = 1;
    // Random num generation 1-10 for random list amounts
    var randomNum = Math.floor(Math.random() * 4) + 2;

    $("#startBtn").on("click", function(e){
        e.stopPropagation();
        $(rabbithole).empty();
        for (var i = 0; i <= randomNum; i++){
            $(rabbithole).append("<li></li>");
        }
        // Find all paths in the rabbithole
        var allLis = $(rabbithole).find("li");

        // Pick a random index based on the num of paths
        var randomIndex = Math.floor(Math.random() * allLis.length);

        // Append the friend to the random path
        //allLis.eq(randomIndex).append(friend).addClass("checkpoint");
        allLis.eq(randomIndex).append(friend).attr("id", "checkpoint");

        $(this).hide();
        draw3DCorridors();
        startAutoMovement();
    });

    // $(document).on("keydown", function(e){
    //     switch (e.key){
    //         case "ArrowUp":
    //             e.preventDefault();
    //             moveStep(-1); // Backward
    //             checkOverlap();
    //             break;
    //         case "ArrowDown":
    //             e.preventDefault();
    //             moveStep(1); // Forward
    //             checkOverlap();
    //             break;
    //     }
    // });

    // $(document).on("swipeleft", function(){
    //     moveStep(-1);
    //     checkOverlap();
    // });

    // $(document).on("swiperight", function(){
    //     moveStep(1);
    //     checkOverlap();
    // });

    // function moveStep(direction){
    //     // Grab all moveable areas
    //     var allTiles = $(rabbithole).find("li");

    //     // Locate where player stands
    //     var currentTile = player.parent();
    //     var currentIndex = allTiles.index(currentTile);

    //     // Calculate the target index destination
    //     var targetIndex = currentIndex + direction;

    //     // Move if within the map boundaries
    //     if (targetIndex >= 0 && targetIndex < allTiles.length){
    //         currentTile.removeClass("checkpoint");
    //         var targetTile = allTiles.eq(targetIndex);
    //         player.appendTo(targetTile);
    //     }
    // }

    function startAutoMovement(){
        // Grab all moveable areas

        clearInterval(autoMoveTimer);

        autoMoveTimer = setInterval(function(){
            var allTiles = $(rabbithole).find("li");

            // Locate where player stands
            var currentTile = player.parent();
            var currentIndex = allTiles.index(currentTile);

            // Calculate the target index destination
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

            visualCorridors.forEach((box, idx) => {
                if (idx === targetIndex){
                    box.scale.set(1.1, 1.1, 1);
                } else {
                    box.scale.set(1, 1, 1);
                }
            });
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
    })

    function attemptAdvance(){
        var playerTile = player.parent();
        var friendTile = friend.parent();
        
        if (playerTile.length && friendTile.length && playerTile.is(friendTile)){
            console.log("correct");
            var activeTile = $("#checkpoint");
            
            // Find which specific hallway index index was the winner
            var allTiles = $(rabbithole).find("> li");
            var winIndex = allTiles.index(activeTile);
            
            const spacing = 5;
            const offsetPosition = (winIndex - (allTiles.length - 1) / 2) * spacing;
            const isMobile = $(window).width() < 768;

            // 1. DIVE PHASE: Lock camera directly inside the chosen hallway coordinates
            if (isMobile) {
                camera.position.y = offsetPosition; // Snap side alignment instantly
                targetCameraZ = -14;                // Rush straight down the length of the hall
            } else {
                camera.position.x = offsetPosition; // Snap side alignment instantly
                targetCameraZ = -14;                // Rush straight down the length of the hall
            }
            
            // 2. WAIT AND RESET PHASE
            setTimeout(function(){
                spawnPaths(activeTile);
                
                // Seamlessly pop camera back to center view for the next overview choices
                camera.position.set(0, 0, 10); 
                targetCameraZ = 10;
            }, 500); // 500ms allows a full first person fly-through sequence
            
        } else {
            console.log("wrong");
            gameOver();
        }
    }


    // function checkOverlap(){
    //     $(".checkpoint").each(function(){
    //         // Check if an li has the player and friend
    //         if (this.contains(player[0]) && this.contains(friend[0])){
    //             console.log("overlap");
    //             spawnPaths($(this));
    //         }
    //     })
    // }

    function spawnPaths(activeTile){
        activeTile.removeAttr("id");

        $(rabbithole).empty();

        var freshRandomNum = Math.floor(Math.random() * 4) + 2;

        for (var i = 0; i <= freshRandomNum; i++){
            $(rabbithole).append("<li></li>");
        }

        var newLis = $(rabbithole).find("> li");
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
    })

});