
const mode = (new URLSearchParams(location.search)).get('mode') ?? 'watch';

const appButton = document.getElementById('app-button')
const logsButton = document.getElementById('logs-button')
const targetLocationsButton = document.getElementById('target-locations-button')

const appWindow = document.getElementById('app-window')

const logsWindow = document.getElementById('logs-window')
const logsContainer = document.getElementById('logs-container')

const targetLocationsWindow = document.getElementById('target-locations-window')
const targetLocationButton = document.getElementById('set-target-button')
const targetLocationsContainer = document.getElementById('target-locations-container')

const addTargetLocationButton = document.getElementById('add-target-location-button');

const targetNameInput = document.getElementById('target-name')
const targetLatitudeInput = document.getElementById('target-latitude')
const targetLongitudeInput = document.getElementById('target-longitude')
const targetRadiusInput = document.getElementById('target-radius')

const alertWindow = document.getElementById('alert');

let isAlertBeingShown = false;


const targetRadius = 0.1; // in kilometers

const targetLocations = []

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


    if(mode == 'loop'){
        log("Initiating in loop mode for 3s")
        setInterval(() => {
            log("Requesting location...");
            navigator.geolocation.getCurrentPosition(handleLocationUpdate, handleLocationError, geoOptions);
        }, 3 * 1000)
    }
    else{
        log("Initiating in watch mode")
        navigator.geolocation.watchPosition(handleLocationUpdate, handleLocationError, geoOptions);
    }
} else {
    log('Geolocation is not supported by this browser.');
}


appButton.onclick = switchToAppWindow

logsButton.onclick = function() {
    appWindow.style.display = 'none';
    appButton.style.backgroundColor = 'white';

    logsWindow.style.display = 'block';
    logsButton.style.backgroundColor = '#AAAAAA';

    targetLocationsWindow.style.display = 'none'
    targetLocationsButton.style.backgroundColor = 'white'
}

targetLocationsButton.onclick = function(){
    appWindow.style.display = 'none';
    appButton.style.backgroundColor = 'white';

    logsWindow.style.display = 'none';
    logsButton.style.backgroundColor = 'white';

    targetLocationsWindow.style.display = 'block'
    targetLocationsButton.style.backgroundColor = '#AAAAAA'
}

addTargetLocationButton?.addEventListener('click', function(){
    try{
        addTargetLocationToList({
            latitude: parseFloat(targetLatitudeInput.value),
            longitude: parseFloat(targetLongitudeInput.value)
        }, parseFloat(targetRadiusInput.value), targetNameInput.value)

        targetNameInput.value = ''
        targetLatitudeInput.value = ''
        targetLongitudeInput.value = ''
        targetRadiusInput.value = ''
        
    }
    catch(e){
        log(`Error: addTargetLocationButton onclick | ${e.toString()}`)
    }
})

function switchToAppWindow(){
    appWindow.style.display = 'block';
    appButton.style.backgroundColor = '#AAAAAA';

    logsWindow.style.display = 'none';
    logsButton.style.backgroundColor = 'white';

    targetLocationsWindow.style.display = 'none'
    targetLocationsButton.style.backgroundColor = 'white'
}


 

function log(...args){
    console.log(...args)
    let div = document.createElement('div')
    div.innerHTML = `${new Date().toLocaleString()}: ${args.map(JSON.stringify).join(' ')}<br>`
    div.classList.add('list-element')
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
        updateLocationCoordsToApp(location.coords);
        generateUIForTargetLocations()
        const currentLocation = {
            lat: location.coords.latitude,
            lon: location.coords.longitude
        };

        if(isAlertBeingShown)
            return
        for(let targetLocation of targetLocations){
            let distance = calculateDistance(currentLocation.lat, currentLocation.lon, targetLocation.coords.latitude, targetLocation.coords.longitude);
            if(distance <= targetLocation.targetRadius){
                let content = `You are ${distance} kms away from ${targetLocation.name}`
                log(content);
                playSound()
                showAlert(content, () => {
                    isAlertBeingShown = false
                    stopSound()
                    let index = targetLocations.indexOf(targetLocation)
                    targetLocations.splice(index, 1)
                })
                isAlertBeingShown = true;
                  
            }
        }
    }
    catch(e){
        log(`Error: handleLocationUpdate | ${e.toString()}`)
    }
}

function handleLocationError(error) {
    log('Geolocation error:', error.toString());
}

function addTargetLocationToList(coords, targetRadius = 2, name){
    targetLocations.push({coords, targetRadius, name})
    generateUIForTargetLocations()
}

function removeTargetLocation(name){
    targetLocations = targetLocations.filter(loc => loc.name !== name)
    generateUIForTargetLocations()
}

function generateUIForTargetLocations(){
    targetLocationsContainer.innerHTML = ''
    targetLocations.forEach(loc => {
        let div = document.createElement('div')
        div.classList.add('list-element')
        div.innerHTML = `Name: ${loc.name}<br>Latitude: ${loc.coords.latitude}<br>Longitude: ${loc.coords.longitude}<br>Target Radius: ${loc.targetRadius} kms<br>Distance from here: ${calculateDistance(lastKnownCoords.latitude, lastKnownCoords.longitude, loc.coords.latitude, loc.coords.longitude)} kms<br>`
        targetLocationsContainer.appendChild(div)
    })
}


function playSound() {
    let audio = new Audio('alert.mp3'); 
    window.audio = audio
    audio.loop = true;
    audio.play();
}

function stopSound(){
    window.audio.pause()
}


function showAlert(content, onAlertClose){

    alertWindow.style.display = 'block';
    alertWindow.querySelector('span').innerHTML = content;
    alertWindow.querySelector('button').onclick = function(){
        alertWindow.style.display = 'none';
        onAlertClose?.()
    }
    
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

