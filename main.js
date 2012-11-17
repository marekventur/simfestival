

var money = 100000;
var points = 0;
var rounds = 0;
var countFextival = 0;
$(function() {

	// Set up event handlers 
	$('.artist').keyup(function(event){
		// Enter
	    if(event.keyCode == 13){
	       
	       $.ajax({
				url: "http://ws.audioscrobbler.com/2.0/",
				data: {
					"method": "artist.search",
					"artist": $('.artist').val(),
					"api_key": "271b20f03af75122c82e09f3b4399db3",
					"format": "json"
				},
				success: function(res) {
					var $list = $('.artists');
					$list.empty();
					$.each(res.results.artistmatches.artist, function(i, el) {
						var cost = el.listeners * 10;
						var $add = $('<li><div class="artist-name">'+el.name+'</div><div class="listeners">'+el.listeners+' Listener</div><div class="cost">Cost: £'+cost+'</div></li>');

						if (cost <= money) {
							
							// This is the event handler for adding an artist
							$add.click(function() {
								money -= cost;
								updateMoney();

								// Add it to the main list
								$('.signed-artists').append($add);

								// Remove this event from that artist
								$add.off();

								// Clear the list
								$list.empty();

								// show start festival link
								$('.start-festival').show();
							});
						}
						else
						{
							$add.addClass("unavailable");
						}

						$list.append($add);
					});
				},
				dataType: 'json'
			});

	       $('.artist').val('');
	    }
	});

	function updateMoney() {
		$('#money').text(money);
	}

	function startRound() {
		
		// Reset all css
		$('.wait, .result').hide();
		$('.main-game').show();

		// empty list of potential artists
		$('.artists, .signed-artists').empty();

		// give it a name
		countFextival++;
		$('.festival-name').val('Festival ' + countFextival);

		// hide start festival button and make remove/add event handlers
		$('.start-festival').off().hide().click(function() {
			alert('start')
		});
	}

	startRound();
});