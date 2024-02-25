const appButton = document.getElementById('app-button')
const logsButton = document.getElementById('logs-button')

const appWindow = document.getElementById('app-window')
const logsWindow = document.getElementById('logs-window')
const logsContainer = document.getElementById('logs-container')

const targetLocationButton = document.getElementById('set-target-button')
const targetlkasLocationButton = document.getElementById('set-lkas-target-button')


const targetLocation = { latitude: 9.73581586172279, longitude: 77.7916178550191 };
const targetRadius = 0.1; // in kilometers

// Options for geolocation
const geoOptions = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
};


let lastKnownCoords = null;

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

if ('geolocation' in navigator) {

    //navigator.geolocation.watchPosition(handleLocationUpdate, handleLocationError, geoOptions);

    setInterval(() => {
        console.log("Requesting location...");
        navigator.geolocation.getCurrentPosition(handleLocationUpdate, handleLocationError, geoOptions);
    }, 3 * 1000)
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

targetLocationButton.onclick = async function(){
    try{
        log('targetLocationButton clicked')
        let location = await new Promise((rs) => {
            navigator.geolocation.getCurrentPosition(rs, log, geoOptions)
        })
        log('targetLocationButton click success')
        updateLocationCoordsToApp(location.coords)
        log('updating location', location.coords.toJSON())
        targetLocation.latitude = location.coords.latitude;
        targetLocation.longitude = location.coords.longitude;
    }
    catch(e){
        log(`Error: targetLocationButton onclick | ${e.toString()}`)
    }
}

targetlkasLocationButton.onclick = function(){
    try{
        log('targetlkasLocationButton clicked')
        targetLocation.latitude = lastKnownCoords.latitude
        targetLocation.longitude = lastKnownCoords.longitude
    }
    catch(e){
        log(`Error: targetlkasLocationButton onclick | ${e.toString()}`)
    }
}   

function log(...args){
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

function updateLocationCoordsToApp(coords){
    try{
        log('updating New location:', coords);
        lastKnownCoords = coords
        // with better formatting
        document.getElementById('distance-from-target').innerText = `Distance from Target Location ${targetLocation.latitude}, ${targetLocation.longitude} : ` + calculateDistance(coords.latitude, coords.longitude, targetLocation.latitude, targetLocation.longitude) + " km";
        document.getElementById('latitude').innerText = "Latitude: " + coords.latitude;
        document.getElementById('longitude').innerText = "Longitude: " + coords.longitude;
        document.getElementById('accuracy').innerText = "Accuracy: " + coords.accuracy;
        document.getElementById('altitude').innerText = "Altitude: " + coords.altitude;
        document.getElementById('altitudeAccuracy').innerText = "Altitude Accuracy: " + coords.altitudeAccuracy;
        document.getElementById('heading').innerText = "Heading: " + coords.heading;
        document.getElementById('speed').innerText = "Speed: " + coords.speed;
    }
    catch(e){
        log(`Error: updateLocationToApp | ${e.toString()}`)
}
    
}

// Function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
    try{
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
    catch(e){
        log(`Error: calculateDistance | ${e.toString()}`)
    }
}

// Function to handle location updates
function handleLocationUpdate(location) {
    try{
    log('New location:', location.coords);
    updateLocationCoordsToApp(location.coords)
    const currentLocation = {
        lat: location.coords.latitude,
        lon: location.coords.longitude
    };

    const distance = calculateDistance(
        currentLocation.lat, currentLocation.lon,
        targetLocation.lat, targetLocation.lon
    );

    if (distance <= targetRadius) {
        log(`You are within ${targetRadius} kilometers of the target location!`);
    }
    }
    catch(e){
        log(`Error: handleLocationUpdate | ${e.toString()}`)
    }
}

function handleLocationError(error) {
    log('Geolocation error:', error.toString());
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