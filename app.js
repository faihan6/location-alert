const appButton = document.getElementById('app-button')
const logsButton = document.getElementById('logs-button')

const appWindow = document.getElementById('app-window')
const logsWindow = document.getElementById('logs-window')
const logsContainer = document.getElementById('logs-container')

const targetLocation = { latitude: 9.73581586172279, longitude: 77.7916178550191 };

let lastKnownLocation = null;

// Register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(registration => {
            log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
            log('Service Worker registration failed:', error);
        });
}

// Check if Geolocation is supported
if ('geolocation' in navigator) {
    // Set the target location coordinates (latitude, longitude)
    const targetLocation = { lat: 37.7749, lon: -122.4194 };
    const targetRadius = 1; // in kilometers

    // Options for geolocation
    const geoOptions = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };

    // Function to calculate distance between two points
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in kilometers
        return distance;
    }

    // Function to handle location updates
    function handleLocationUpdate(position) {
        log('New location:', position.coords);
        updateLocationToApp(position.coords)
        const currentLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
        };

        const distance = calculateDistance(
            currentLocation.lat, currentLocation.lon,
            targetLocation.lat, targetLocation.lon
        );

        if (distance <= targetRadius) {
            log('You are within 5 kilometers of the target location!');
        }
    }

    function handleLocationError(error) {
        log('Geolocation error:', error.message);
    }

    navigator.geolocation.watchPosition(handleLocationUpdate, handleLocationError, geoOptions);

    // setInterval(() => {
    //     log("Requesting location...")
    //     navigator.geolocation.getCurrentPosition(handleLocationUpdate, handleLocationError, geoOptions);
    // }, 3 * 1000)
} else {
    log('Geolocation is not supported by this browser.');
}


appButton.onclick = function() {
    appWindow.style.display = 'block';
    logsWindow.style.display = 'none';
}

logsButton.onclick = function() {
    appWindow.style.display = 'none';
    logsWindow.style.display = 'block';
}

function log(...args){
    // add date and time with args
    console.log(...args)
    let div = document.createElement('div')
    div.innerHTML = `${new Date().toLocaleString()}: ${args.map(JSON.stringify).join(' ')}<br>`
    div.classList.add('log-element')
    logsContainer.appendChild(div)

    // if logsContainer has more than 50 children, remove the first child
    if(logsContainer.children.length > 50){
        logsContainer.removeChild(logsContainer.children[0])
    }
}

// appWindow.innerHTML = lastKnownLocation ? lastKnownLocation.toString() : 'No location data available'
function updateLocationToApp(location){
    lastKnownLocation = location
    // with better formatting
    document.getElementById('distance-from-target').innerText = "Distance from Target Location : (9.73581586172279, 77.7916178550191): " + calculateDistance(location.latitude, location.longitude, targetLocation.latitude, targetLocation.longitude) + " km";
    document.getElementById('latitude').innerText = "Latitude: " + location.latitude;
    document.getElementById('longitude').innerText = "Longitude: " + location.longitude;
    document.getElementById('accuracy').innerText = "Accuracy: " + location.accuracy;
    document.getElementById('altitude').innerText = "Altitude: " + location.altitude;
    document.getElementById('altitudeAccuracy').innerText = "Altitude Accuracy: " + location.altitudeAccuracy;
    document.getElementById('heading').innerText = "Heading: " + location.heading;
    document.getElementById('speed').innerText = "Speed: " + location.speed;
    
}

GeolocationCoordinates.prototype.toString = function(){
    return `Latitude: ${this.latitude}, Longitude: ${this.longitude}, Accuracy: ${this.accuracy}, Altitude: ${this.altitude}, Altitude Accuracy: ${this.altitudeAccuracy}, Heading: ${this.heading}, Speed: ${this.speed}`
}

GeolocationCoordinates.prototype.toJSON = function(){
    return {
        latitude: this.latitude,
        longitude: this.longitude,
        accuracy: this.accuracy,
        altitude: this.altitude,
        altitudeAccuracy: this.altitudeAccuracy,
        heading: this.heading,
        speed: this.speed
    }
}