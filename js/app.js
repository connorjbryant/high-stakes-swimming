jQuery(function($){

    var player = $(".js-player");
    var friend = $(".js-friend");
    var rabbithole = $("#game");

    // Get the player parent list index
    var currentIndex = player.parent().index();

    // Random num generation 1-10 for random list amounts
    var randomNum = Math.floor(Math.random() * 9) + 2;

    $("#startBtn").on("click", function(){
        for (var i = 0; i <= randomNum; i++){
            // Create new path and save the list to a var
            var newLi = $("<li></li>");

            // Append the path to the game area
            $(rabbithole).append(newLi);

            // Append the friend to the newest list
            newLi.append(friend);
        }
        $(this).hide();
    });

    $(document).on("keydown", function(e){
        switch (e.key){
            case "ArrowUp":
                e.preventDefault();
                moveStep(-1); // Backward
                break;
            case "ArrowDown":
                e.preventDefault();
                moveStep(1); // Forward
                break;
        }
    });

    $(document).on("swipeup", function(){
        moveStep(-1);
    });

    $(document).on("swipedown", function(){
        moveStep(1);
    });

    function moveStep(direction){
        // Grab all moveable areas
        var allTiles = $("#root *").filter(function(){
            var $this = $(this);

            // Valid areas
            return ($this.is("li")) && $this.find("ul").length === 0;
        })

        // Locate where player stands
        var currentTile = player.parent();
        var currentIndex = allTiles.index(currentTile);

        // Calculate the target index destination
        var targetIndex = currentIndex + direction;

        // Move if within the map boundaries
        if (targetIndex >= 0 && targetIndex < allTiles.length){
            var targetTile = allTiles.eq(targetIndex);
            player.appendTo(targetTile);
        }
    }

});