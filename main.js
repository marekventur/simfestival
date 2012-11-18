

var money = 2000000;
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
						if (el.name) {
							var cost = Math.round(Math.sqrt(el.listeners) * 50);
							var $add = $('<li><div class="artist-name">'+el.name+'</div><div class="listeners">'+el.listeners+' Listener</div><div class="cost">Cost: £'+cost+'</div></li>');
							$add.data('reach', el.listeners);

							if (cost <= money) {
								
								// This is the event handler for adding an artist
								$add.click(function() {
									money -= cost;
									updateMoney();

									// Add it to the main list
									$('.signed-artists').append($add);

									// Remove this event from that artist
									$add.off().click(function() {
										money += cost;
										updateMoney();
										$add.remove();
									});

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
						}
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

	function getFansForArtist(artist, callback) {
		$.ajax({
			url: "http://ws.audioscrobbler.com/2.0/",
			data: {
				"method": "artist.gettopfans",
				"artist": artist,
				"api_key": "271b20f03af75122c82e09f3b4399db3",
				"format": "json"
			},
			success: function(res) {
				callback(res.topfans.user);
			},
			dataType: 'json'
		});
	}

	function getFanFestivalCompatibility(fanName, listOfArtists, callback) {
		$.ajax({
			url: "http://ws.audioscrobbler.com/2.0/",
			data: {
				"method": "tasteometer.compare",
				"type1": 'user',
				"type2": "artists",
				"value1": fanName,
				"value2": listOfArtists.join(','),
				"api_key": "271b20f03af75122c82e09f3b4399db3",
				"format": "json"
			},
			success: function(res) {
				callback(res.comparison.result);
			},
			dataType: 'json'
		});
	}

	function startRound() {
		
		// Reset all css
		$('.wait, .result').hide();
		$('.main-game').show();
		$('#going-number, .income').text('0');

		// empty list of potential artists
		$('.artists, .signed-artists').empty();

		// give it a name
		countFextival++;
		$('.festival-name').val('Festival ' + countFextival);

		// hide start festival button and make remove/add event handlers
		$('.start-festival').off().hide().click(function() {

			var festivalPrice = $('.festival-price').val();
			if (festivalPrice * 1 != festivalPrice) {
				alert('Please define a valid price!');
				return;
			}
			$('.wait').show();
			$('.main-game').hide();

			calculateRound(function() {
				startRound();
			});
		});
	}

	function calculateRound(callback) {

		// Create list of fans
		var count = 0;
		var listOfArtists = [];
		var popularityFactor = 0;
		$('.signed-artists li').each(function(i, el) {
			count++;
			var artistName = $('.artist-name', el).text();

			popularityFactor += $(el).data('reach');

			listOfArtists.push(artistName);

			getFansForArtist(artistName, function(fans) {
				$(el).remove();

				$.each(fans, function(i, fan) {
					if (fan.image) {
						var url = fan.image[1]['#text'];
						url = url.replace(/\/64\//m, "\/64s\/");
						if ( ! url) {
							url = "http://cdn.last.fm/flatness/responsive/2/noimage/default_user_60_g1.png";
						}
						
						var $image = $('<img alt="dontcare">');

						// remove fan if he's already in the list
						//$('#'+fan.name+'_lastfm').remove();

						// add him to the list
						$image
							.attr('src', url)
							.css('height', 32)
							.css('width', 32)
							.data('username', fan.name)
							.data('artist', artistName)
							.attr('id', fan.name+'_lastfm');


						$('.fan-list').append($image);
					}
				});
				
				// Are all fans fetched?
				count--;
				if (count == 0) {
					var factor = Math.sqrt(Math.sqrt(popularityFactor)) * 100;
					if (factor > 50000) {
						factor = 50000;
					}
					console.log(factor);
					calculateRound2(factor, listOfArtists, callback);
				}
				
			})
		});
	}

	function calculateRound2(popularityFactor, listOfArtists, callback) {
		// Find out if fans would be willing to go
		var going = 0;
		var count = 0;
		var lastPrice = 0;
		$('.fan-list img').each(function(i, el) {
			count++;
			var $el = $(el);
			var artist = $el.data('artist');
			var username = $el.data('username');
			getFanFestivalCompatibility(username, listOfArtists, function(res) {

				var artists = [];
				
				if (typeof res.artists.artist === 'undefined') {
					artists = [artist];
				}
				else
				{
					var inList = false;
					if (typeof res.artists.artist.name === 'undefined') {
						$.each(res.artists.artist, function(i, art) {
							artists.push(art.name);
							if (art.name == artist) {
								inList = true;
							}
						});
					}
					else
					{
						artists = [res.artists.artist.name];
						if (artists[0] == artist) {
							inList = true;
						}
					}

					if ( ! inList) {
						artists.push(artist);
					}


				}

				var wouldpay = artists.length * 30 - Math.floor(Math.random() * 25) - 15;
				var festivalPrice = $('.festival-price').val() * 1;

				if (wouldpay >= festivalPrice) {
					// is going
					going++;
					var realGoing = Math.round(going * popularityFactor);
					lastPrice = realGoing * festivalPrice;
					$('#going-number').text(realGoing);
					$('.income').text(lastPrice);
				}
				else
				{
					// is not going
					$el.animate({
						opacity: 0.1
					},
					{
						duration: 400
					});
				}

				count--;
				if (count == 0) {
					money += lastPrice;
					updateMoney();
					setTimeout(function() {
						alert('You earned £'+lastPrice);
						callback();

					}, 1500);
				}
				
			});

		});

		if (count == 0) {
			money += lastPrice;
			updateMoney();
			setTimeout(function() {
				alert('You earned £'+lastPrice);
				callback();

			}, 1500);
		}
	}

	startRound();
});