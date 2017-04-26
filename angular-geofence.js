angular.module('geoFence', [])
    .directive('ngGeofence', function() {
        return {
            restrict: 'E',
            scope: {
                zones: "=zones",
                marker: "=",
                boundaries: "=boundaries",
                isZone: "=isZone",
                geoMap: "=geoMap"
            },
            templateUrl: "bower_components/angular-geofence/angular-geofence.html",
            controller: ['$scope', '$timeout', function($scope, $timeout, $watch) {

                // googlemap variables //
                $scope.temp = {};
                var markers = [];
                var defaultShape;
                var drawingManager;
                var refPolygon;
                var overlays = [];
                var userOverlays = []; //to draw and hide the shape
                $scope.lat = 19.119126;
                $scope.lng = 72.890775;
                if(!$scope.zones)
                    $scope.zones = [];
                if(!$scope.boundaries)
                    $scope.boundaries = [];
                if($scope.isZone == undefined)
                    $scope.isZone = true;

                const lineSymbol = {
                    path: 'M 0,-1 0,1',
                    strokeOpacity: 1,
                    scale: 3
                }


                $scope.showMap = function() {
                    // if(!map){
                    map = new google.maps.Map(document.getElementById('map'), {
                        center: { lat: $scope.lat, lng: $scope.lng },
                        zoom: 17,
                        mapTypeId: google.maps.MapTypeId.ROADMAP
                    });
                    // }
                    function addMarker(location) {
                        var marker = new google.maps.Marker({
                            map: map,
                            title: location.name,
                            position: location.geometry.location
                        });
                        markers.push(marker);
                    }
                    if ($scope.zones.length >= 1) {
                        drawPartnerShapes();
                    }
                    if ($scope.boundaries.length >= 1) {
                        drawUserShapes();
                    }
                    if ($scope.geoMap.partneraddress && $scope.isZone) {
                        $scope.temp.selectedGmapArea = {};
                        $scope.temp.selectedGmapArea.geometry = {};
                        $scope.temp.selectedGmapArea.geometry.location = { lat: $scope.geoMap.lat, lng: $scope.geoMap.lng };
                        addMarker($scope.temp.selectedGmapArea);
                        $scope.lat = $scope.geoMap.lat;
                        $scope.lng = $scope.geoMap.lng;
                    }
                    map.setCenter({ lat: $scope.lat, lng: $scope.lng });
                    $timeout(function() {
                        google.maps.event.trigger(map, 'resize');
                    }, 1000);
                    // Create the search box and link it to the UI element.
                    if ($scope.isZone) {
                        var input = document.getElementById('pac-input');
                        var searchBox = new google.maps.places.SearchBox(input);
                        map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

                        // Bias the SearchBox results towards current map's viewport.
                        map.addListener('bounds_changed', function() {
                            searchBox.setBounds(map.getBounds());
                        });

                        searchBox.addListener('places_changed', function() {
                            clearMarkers();
                            var place = searchBox.getPlaces();
                            $scope.temp.selectedGmapArea = place[0];
                            $scope.geoMap.partneraddress = $scope.temp.selectedGmapArea.formatted_address;
                            document.getElementById('pac-input').value = $scope.temp.selectedGmapArea.formatted_address;
                            $scope.geoMap.lat = $scope.temp.selectedGmapArea.geometry.location.lat();
                            $scope.geoMap.lng = $scope.temp.selectedGmapArea.geometry.location.lng();
                            var placeId = undefined;
                            map.setCenter($scope.temp.selectedGmapArea.geometry.location);
                            map.setZoom(17);
                            addMarker($scope.temp.selectedGmapArea);
                            //make default shape as circle
                            // defaultShape = defaultGeofence($scope.temp.selectedGmapArea.geometry.location);
                            // defaultShape.setMap(map);
                            // defaultShape.type = "circle";
                        });
                        if ($scope.geoMap)
                            $scope.temp.search = angular.copy($scope.geoMap.partneraddress);
                    }
                }

                google.maps.event.addDomListener(map, 'click', function() {
                    if (overlays.length) {
                        overlays.map((obj, $index) => {
                            obj.setEditable(false);
                            obj.setDraggable(false);
                        })
                    }
                });

                function clearMarkers() {
                    for (var i = 0; i < markers.length; i++) {
                        markers[i].setMap(null);
                    }
                }

                function drawPartnerShapes() {
                    overlays = [];
                    $scope.zones.forEach((zone, $index) => {
                        var shape = makePartnerShape(zone, false);
                        overlays.push(shape);
                        shape.setMap(map);
                    })
                }

                function defaultGeofence(latlng) {
                    return new google.maps.Circle({
                        radius: 200,
                        center: latlng,
                        fillColor: 'green',
                        fillOpacity: 0.35,
                        strokeColor: 'green',
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        editable: true,
                        draggable: true
                    })
                }

                $scope.switchToPoly = function() {
                    if (defaultShape)
                        defaultShape.setMap(null);
                    drawingManager = new google.maps.drawing.DrawingManager({
                        drawingControl: false,
                        drawingMode: google.maps.drawing.OverlayType.POLYGON,
                        polygonOptions: {
                            fillColor: '#FF0000',
                            fillOpacity: 0.35,
                            strokeColor: '#FF0000',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            editable: true,
                            draggable: true
                        }
                    });
                    drawingManager.setMap(map);
                    drawingManager.addListener('overlaycomplete', function(e) {
                        console.log("gfgh");
                        defaultShape = e.overlay;
                        defaultShape.type = e.type;
                        drawingManager.setDrawingMode(null);
                    });
                }

                $scope.switchToCircle = function() {
                    if (defaultShape)
                        defaultShape.setMap(null);
                    drawingManager = new google.maps.drawing.DrawingManager({
                        drawingControl: false,
                        drawingMode: google.maps.drawing.OverlayType.CIRCLE,
                        circleOptions: {
                            fillColor: 'green',
                            fillOpacity: 0.35,
                            strokeColor: 'green',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            editable: true,
                            draggable: true
                        }
                    });
                    drawingManager.setMap(map);
                    drawingManager.addListener('overlaycomplete', function(e) {
                        console.log("circle")
                        defaultShape = e.overlay;
                        defaultShape.type = e.type;
                        drawingManager.setDrawingMode(null);
                    });
                    // if($scope.boundaries.length >= 1){
                    //     $scope.temp.selectedGmapArea = {
                    //         geometry : {
                    //             location : {
                    //                 lat : $scope.lat,
                    //                 lng: $scope.lng
                    //             }
                    //         }
                    //     };
                    // }
                    // defaultShape = defaultGeofence($scope.temp.selectedGmapArea.geometry.location);
                    // defaultShape.setMap(map);
                    // defaultShape.type = "circle";
                }

                function setShapeData(shapeObj) {
                    var shapeJSON = {};
                    var latlng = [];
                    var geometry = [];
                    if (shapeObj.type == 'polygon') {
                        latlng = shapeObj.getPath().getArray();
                        shapeJSON.properties = {
                            fillColor: '#FF0000',
                            fillOpacity: 0.35,
                            strokeColor: '#FF0000',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            editable: true,
                            draggable: true
                        }
                    }
                    if (shapeObj.type == 'circle') {
                        latlng.push(shapeObj.getCenter());
                        shapeJSON.properties = {
                            radius: shapeObj.getRadius(),
                            fillColor: 'green',
                            fillOpacity: 0.35,
                            strokeColor: 'green',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            editable: true,
                            draggable: true
                        }
                    }

                    latlng.forEach(obj => {
                        var temp = {
                            lat: obj.lat(),
                            lng: obj.lng()
                        }
                        geometry.push(temp);
                    });
                    shapeJSON.geometry = geometry;
                    shapeJSON.type = shapeObj.type;
                    return shapeJSON;
                }

                function makePartnerShape(JsonObj, isEditable) {
                    if (JsonObj.type == 'circle') {
                        return new google.maps.Circle({
                            radius: JsonObj.properties.radius || 150,
                            center: JsonObj.geometry[0],
                            fillColor: JsonObj.properties.fillColor || 'green',
                            fillOpacity: 0.35,
                            strokeColor: JsonObj.properties.strokeColor || 'green',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            editable: isEditable || false,
                            draggable: isEditable || false
                        });
                    }

                    if (JsonObj.type == 'polygon') {
                        return new google.maps.Polygon({
                            paths: JsonObj.geometry,
                            fillColor: JsonObj.properties.fillColor || '#FF0000',
                            fillOpacity: 0.35,
                            strokeColor: JsonObj.properties.strokeColor || '#FF0000',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            editable: isEditable || false,
                            draggable: isEditable || false
                        });
                    }
                }

                function addCurrentShape(shape) {
                    $scope.zones.push(shape);
                    defaultShape.setEditable(false);
                    defaultShape.setDraggable(false);
                    $scope.temp.currentAreaName = "";
                    defaultShape.setMap(null);
                    //to show the saved shapes
                    $scope.zones.forEach((zone, $index) => {
                        var shape1 = makePartnerShape(zone, false);
                        if ($scope.zones.length - 1 == $index) {
                            overlays.push(shape1);
                            shape1.setMap(map);
                            var x = document.getElementById("shapeAdd")
                            x.className = "show";
                            $timeout(function() { x.className = x.className.replace("show", ""); }, 2000);
                        }
                    })
                }


                $scope.addCurrentArea = function() {
                    if (defaultShape) {
                        var shapeFeature = setShapeData(defaultShape);
                        shapeFeature.name = $scope.temp.currentAreaName;
                        if ($scope.boundaries.length > 0) { //for userinfo
                            let shapeExist = false;
                            let tempObj = checkIfInside(shapeFeature, shapeExist, defaultShape);
                            shapeExist = tempObj.exist;
                            original_geometry = tempObj.geometry;
                            if (shapeExist == true) {
                                if (original_geometry.length)
                                    shapeFeature.geometry = original_geometry; // storing original circle geometry
                                addCurrentShape(shapeFeature);
                            }
                            if (shapeExist == false) {
                                defaultShape.setDraggable(true);
                                defaultShape.setEditable(true);
                                var x = document.getElementById("shapeAlert")
                                x.className = "show";
                                $timeout(function() { x.className = x.className.replace("show", ""); }, 2000);
                            }
                        } else {
                            addCurrentShape(shapeFeature);
                        }
                    }
                }

                $scope.removeCurrentArea = function() {
                    if (defaultShape) {
                        defaultShape.setMap(null);
                        $scope.temp.currentAreaName = "";
                        defaultShape = undefined;
                    }
                }

                $scope.removeArea = function(areaObj, index) {
                    overlays[index].setMap(null);
                    $scope.zones.splice(index, 1);
                    overlays.splice(index, 1);
                }

                $scope.editArea = function(areaObj, indexes) {
                    overlays.map((obj, $index) => {
                        if (indexes == $index) {
                            obj.setEditable(true);
                            obj.setDraggable(true);
                        } else {
                            obj.setEditable(false);
                            obj.setDraggable(false);
                        }
                    })
                    $scope.zones.forEach((obj, index)=>{
                        if(index == indexes)
                            obj.editMode = true;
                        else
                            obj.editMode = false;
                    })
                }


                $scope.updateArea = function(areaObj, index) {
                    overlays[index].type = areaObj.type;
                    var updatedShape = setShapeData(overlays[index]);
                    if ($scope.boundaries.length > 0) {
                        var shapeExist = false;
                        var tempObj = checkIfInside(updatedShape, shapeExist, overlays[index]);
                        shapeExist = tempObj.exist;
                        original_geometry = tempObj.geometry;
                        if (shapeExist == true) {
                            updatedShape.geometry = original_geometry;
                            overlays[index].setMap(map);
                            overlays[index].setDraggable(false);
                            overlays[index].setEditable(false);
                            $scope.zones[index] = updatedShape;
                            $scope.zones[index].name = areaObj.name;
                            var x = document.getElementById("shapeUpdate")
                            x.className = "show";
                            $timeout(function() { x.className = x.className.replace("show", ""); }, 2000);
                        }
                        if (shapeExist == false) {
                            updatedShape.geometry = original_geometry;
                            overlays[index].setDraggable(true);
                            overlays[index].setEditable(true);
                            overlays[index].setMap(map);
                            var x = document.getElementById("shapeAlert")
                            x.className = "show";
                            $timeout(function() { x.className = x.className.replace("show", ""); }, 2000);
                        }
                    } else {
                        overlays[index].setDraggable(false);
                        overlays[index].setEditable(false);
                        $scope.zones[index] = updatedShape;
                        $scope.zones[index].name = areaObj.name;
                        var x = document.getElementById("shapeUpdate")
                        x.className = "show";
                        $timeout(function() { x.className = x.className.replace("show", ""); }, 2000);
                    }
                }

                $scope.showMap();

                $scope.$watch("boundaries", function(newValue, oldValue) {
                    if (!$scope.isZone) {
                        for (var j = oldValue.length; j < newValue.length; j++) {
                            var shape = makeUserShape(newValue[j]);
                            shape.setMap(map);
                        }
                        map.setZoom(12);
                    }
                    //This gets called when data changes.
                });

                $scope.clearInput = function() {
                        if (defaultShape)
                            defaultShape.setMap(null);
                        $scope.temp.currentAreaName = "";
                        $scope.temp.search = "";
                        clearMarkers();
                    }
                    //------------User Info---------------------------//

                function drawUserShapes() {
                    $scope.boundaries.forEach((boundary, $index) => {
                        var shape = makeUserShape(boundary);
                        shape.setMap(map);
                    })
                }

                function drawCircle(point, radius, dir) {
                    var d2r = Math.PI / 180; // degrees to radians 
                    var r2d = 180 / Math.PI; // radians to degrees 
                    var earthsradius = 3963; // 3963 is the radius of the earth in miles

                    var points = 2048;
                    // find the raidus in lat/lon 
                    var rlat = (radius / earthsradius) * r2d;
                    var rlng = rlat / Math.cos(point.lat * d2r);

                    var extp = new Array();
                    if (dir == 1) {
                        var start = 0;
                        var end = points + 1; // one extra here makes sure we connect the path
                    } else {
                        var start = points + 1;
                        var end = 0;
                    }
                    for (var i = start;
                        (dir == 1 ? i < end : i > end); i = i + dir) {
                        var theta = Math.PI * (i / (points / 2));
                        ey = point.lng + (rlng * Math.cos(theta)); // center a + radius x * cos(theta) 
                        ex = point.lat + (rlat * Math.sin(theta)); // center b + radius y * sin(theta) 
                        extp.push(new google.maps.LatLng(ex, ey));

                    }
                    return extp;
                }

                function makeUserShape(shapeObj) {
                    //convert to polyline
                    if (shapeObj.type == 'polygon') {

                        userOverlays.push(new google.maps.Polygon({ paths: shapeObj.geometry }));
                        //one extra here makes sure we connect the path
                        var polyGeometry = angular.copy(shapeObj.geometry);
                        polyGeometry.push(shapeObj.geometry[0]);
                        return new google.maps.Polyline({
                            path: polyGeometry,
                            strokeColor: 'blue',
                            strokeOpacity: 0,
                            strokeWeight: 2,
                            icons: [{
                                icon: lineSymbol,
                                offset: '0',
                                repeat: '15px'
                            }]
                        });
                    } else if (shapeObj.type == 'circle') {
                        userOverlays.push(new google.maps.Circle({ center: shapeObj.geometry[0], radius: shapeObj.properties.radius }))
                        return new google.maps.Polyline({
                            path: drawCircle(shapeObj.geometry[0], shapeObj.properties.radius / 1610, 1),
                            strokeColor: 'blue',
                            strokeOpacity: 0,
                            strokeWeight: 2,
                            icons: [{
                                icon: lineSymbol,
                                offset: '0',
                                repeat: '15px'
                            }]
                        });
                    }
                }

                function checkIfInside(shape, shapeExist, overlayObj) {
                    var original_geometry = [];
                    original_geometry = shape.geometry; // storing original circle geometry
                    if (shape.type == 'circle') { //converting circle to polyline to check whether it is inside the shape
                        let polyCircle = new google.maps.Polyline({
                            path: drawCircle(shape.geometry[0], shape.properties.radius / 1610, 1)
                        });
                        let tempArray = polyCircle.getPath().getArray();
                        let polyCircleCoords = tempArray.map(obj => {
                            return { lat: obj.lat(), lng: obj.lng() }
                        });
                        shape.geometry = polyCircleCoords; // polyline geometry
                    }
                    for (var i = 0; i < $scope.boundaries.length; i++) { //loop to check if shape is inside or outside
                        if (i > 0 && shapeExist == true)
                            break;
                        for (var j = 0; j < shape.geometry.length; j++) {
                            var latlng = new google.maps.LatLng(shape.geometry[j].lat, shape.geometry[j].lng);
                            if ($scope.boundaries[i].type == 'polygon') {
                                shapeExist = google.maps.geometry.poly.containsLocation(latlng, userOverlays[i]) ? true : false
                                if (shapeExist == false) {
                                    break;
                                }
                            }
                            if ($scope.boundaries[i].type == 'circle') {
                                shapeExist = userOverlays[i].getBounds().contains(latlng) ? true : false
                                if (shapeExist == false) {
                                    break;
                                }
                            }
                        }
                    }
                    var temp = {
                        geometry: original_geometry,
                        exist: shapeExist
                    };
                    return temp;
                }
            }]
        }
    })
