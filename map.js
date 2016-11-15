/**
 * Default variables
 */
var markerCoordinates;
var marker;
var markersArray = [];
var infowindow = new google.maps.InfoWindow();
var geocoder = new google.maps.Geocoder();

$.fn.mapify = function (options) {
    
    
//    if (!options.location) {
//        console.error("Map location is undefined");
//        $(this).text("Map location is undefined").css("color", "red");
//        return false;
//    }

    options.title = ((options.title) ? options.title : '');
    options.marker = ((options.marker !== false) ? options.marker : false);
    options.onMapClick = ((options.onMapClick !== false) ? options.onMapClick : false);
    options.center = ((options.center) ? options.center : options.location);

    var mapElement = $(this)[0];

    var mapOptions = {
        zoom: (options.zoom > 0) ? options.zoom : 13,
        center: options.center
    };

    var map = new google.maps.Map(mapElement, mapOptions);

    google.maps.Map.prototype.markers = new Array();
    google.maps.Map.prototype.getMarkers = function () {
        return this.markers
    };
    google.maps.Map.prototype.clearMarkers = function () {
        for (var i = 0; i < this.markers.length; i++) {
            this.markers[i].setMap(null);
        }
        this.markers = new Array();
    };
    google.maps.Marker.prototype._setMap = google.maps.Marker.prototype.setMap;
    google.maps.Marker.prototype.setMap = function (map) {
        if (map) {
            map.markers[map.markers.length] = this;
        }
        this._setMap(map);
    }


    if (typeof options.location === 'string') {
        /**
         * Single Marker on the Gmap
         */
        geocoder.geocode({'address': options.location}, function (results, status) {
            var results = results[0];
            if (status == google.maps.GeocoderStatus.OK) {
                map.setCenter(results.geometry.location);

                if (options.autocomplete) {
                    var input = document.getElementById(options.autocomplete);
                    var autocomplete = new google.maps.places.Autocomplete(input);
                    autocomplete.bindTo('bounds', map);

                    autocomplete.addListener('place_changed', function () {

                        var place = autocomplete.getPlace();
                        if (!place.geometry) {
                            return;
                        }
                        var lat = place.geometry.location.lat();
                        var lng = place.geometry.location.lng();
                        $('#coordinates').val(lat + ', ' + lng);
                        $('#place_id').val(place.place_id);
                        
                        $.each(place.address_components, function (i, item) {
                            if (item.types[0] == "locality") {
                                $('#city').val(item.long_name);
                                return false;
                            }
                        });

                        if (place.geometry.viewport) {
                            map.fitBounds(place.geometry.viewport);
                        } else {
                            map.setCenter(place.geometry.location);
                            map.setZoom(17);
                        }

                        google.maps.Map.prototype.clearMarkers();
                        placeMarker(map, marker, place, true);
                    });
                }

                if (options.onMapClick) {
                    google.maps.event.addListener(map, 'click', function (event) {
                        var latitude = event.latLng.lat();
                        var longitude = event.latLng.lng();
                        markerCoordinates = new google.maps.LatLng(latitude, longitude);

                        geocoder.geocode({'location': markerCoordinates}, function (results, status) {
                            if (status === google.maps.GeocoderStatus.OK) {
                                var placeId = results[0].place_id;
                                if (placeId) {
                                    $('#coordinates').val(latitude + ', ' + longitude);
                                    $('#place_id').val(placeId);
                                    $('#location').val(results[0].formatted_address);

                                    $.each(results, function (i, item) {
                                        if (item.types[0] == "locality") {
                                            $('#city').val(item.address_components[0].long_name);
                                            return false;
                                        }
                                    });

                                    google.maps.Map.prototype.clearMarkers();
                                    placeMarker(map, marker, results[0], true);

                                } else {
                                    window.alert('No results found');
                                }
                            } else {
                                window.alert('Geocoder failed due to: ' + status);
                            }
                        });
                    });
                }

                if (options.marker) {
                    markerCoordinates = (options.position) ? options.position : results.geometry.location;

                    marker = new google.maps.Marker({
                        map: map,
                        position: markerCoordinates
                    });
                    infowindow.setContent('<div><strong>' + options.location + '</strong><br /></div>');
                    infowindow.open(map, marker);

//                    if (options.onMarkerClick) {
//                        google.maps.event.addListener(marker, 'click', function () {
//                            options.onMarkerClick(map, marker);
//                        });
//                    }
//                    if (options.onMarkerHover) {
//                        google.maps.event.addListener(marker, 'mouseover', function () {
//                            options.onMarkerHover(map, marker);
//                        });
//                    }
//                    if (options.onMarkerHoverEnd) {
//                        google.maps.event.addListener(marker, 'mouseout', function () {
//                            options.onMarkerHoverEnd(map, marker);
//                        });
//                    }
                }

            } else {
                console.error('Geocode was not successful for the following reason: ' + status);
            }
        });

    } else {
        // multiple markers
        options.location.forEach(function (address) {
            geocoder.geocode({'address': address[1]}, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    marker = placeMarker(map, marker, results[0], false);
                } else {
                    console.error('Geocode was not successful for the following reason: ' + status);
                }
            });
        });
    }
    
    if (options.onZoom) {
        google.maps.event.addListener(map, "idle", function () {
            options.onZoom(map.getZoom());
        });
    }
};

function placeMarker(map, marker, place, showInfo) {
    var marker = new google.maps.Marker({
        map: map
    });

    marker.setPlace({
        placeId: place.place_id,
        location: place.geometry.location
    });
    marker.setVisible(true);

    if (showInfo) {
        showInfoWindow(place.formatted_address);
    }
    
    return marker;
    
}

function showInfoWindow(text){
    infowindow.close();
    infowindow.setContent('<div><strong>' + text + '</strong><br /></div>');
    infowindow.open(map, marker);
}