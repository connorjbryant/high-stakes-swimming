jQuery(function($){

    var player = $(".js-player");
    var friend = $(".js-friend");
    var rabbithole = $("#game");

    // Game vars
    var autoMoveTimer = null;
    var moveDirection = 1;
    // Random num generation 1-10 for random list amounts
    var randomNum = Math.floor(Math.random() * 6) + 2;

    $("#startBtn").on("click", function(){
        for (var i = 0; i <= randomNum; i++){
            $(rabbithole).append("<li></li>");
        }
        // Find all paths in the rabbithole
        var allLis = $(rabbithole).find("li");

        // Pick a random index based on the num of paths
        var randomIndex = Math.floor(Math.random() * allLis.length);

        // Append the friend to the random path
        allLis.eq(randomIndex).append(friend).addClass("checkpoint");

        $(this).hide();

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
        }, 400);
        
    }

    $(document).on("keydown", function(e){
        if (e.key === "Enter"){
            e.preventDefault();
            attemptAdvance();
        }
    });

    $(document).on("click itnotstartbtn", function(e){
        if ($(e.target).is("#startBtn")) return;
        attemptAdvance();
    });

    function attemptAdvance(){
        var playerTile = player.parent()[0];
        var friendTile = friend.parent()[0];

        if (playerTile === friendTile){
            console.log("correct");

            var activeTile = $(".checkpoint");
            spawnPaths(activeTile);
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
        activeTile.removeClass("checkpoint");
        var freshRandomNum = Math.floor(Math.random() * 6) + 2;
        var newUl = $("<ul></ul>");
        for (var i = 0; i <= freshRandomNum; i++){
            newUl.append("<li></li>");
        }
        activeTile.append(newUl);
        // Isolate the choices to the new paths
        var newLis = newUl.find("li");

        // Pick a random index based on the num of paths for the friend again
        var randomIndex = Math.floor(Math.random() * newLis.length);

        newLis.eq(randomIndex).append(friend).addClass("checkpoint");
    }

    function gameOver(){
        clearInterval(autoMoveTimer);

        alert("game over");
        $("#startBtn").show().text("Try Again?");
        location.reload();
    }

});