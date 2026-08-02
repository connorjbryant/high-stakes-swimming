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
        visualCorridors.forEach(box => scene.remove(box));
        visualCorridors = [];

        // Grab all list elements from game loop
        const totalOptions = $(rabbithole).find("li");

        const isMobile = $(window).width() < 768;

        totalOptions.each(function(index){
            const spacing = 5;
            const layoutOffset = (index - (totalOptions.length - 1) / 2) * spacing;

            // Basic wireframe hallway box
            const geometry = new THREE.BoxGeometry(4, 4, 15);

            // Mechanic visual
            const isCheckpoint = ($(this).attr("id") === "checkpoint");

            const boxColor = isCheckpoint ? 0x00ffcc : 0xff00ff;

            const material = new THREE.MeshStandardMaterial({
                color: boxColor,
                roughness: 0.4,
                metalness: 0.2,
                side: THREE.BackSide
            });
            const boxMesh = new THREE.Mesh(geometry, material);

            const edges = new THREE.EdgesGeometry(geometry);
            const lineMat = new THREE.LineBasicMaterial({color: isCheckpoint ? 0x00ffcc : 0xff00ff });
            const line = new THREE.LineSegments(edges, lineMat);
            boxMesh.add(line);

            if (isMobile){
                boxMesh.position.set(0, layoutOffset, -7.5);
            } else {
                boxMesh.position.set(layoutOffset, 0, -7.5);
            }
            scene.add(boxMesh);
            visualCorridors.push(boxMesh);
        })
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

            //var activeTile = $(".checkpoint");
            var activeTile = $("#checkpoint");

            targetCameraZ = -5;

            setTimeout(function(){
                spawnPaths(activeTile);
                targetCameraZ = 8;
            }, 400);
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