document.addEventListener('DOMContentLoaded', function() {
    // Initialize select2
    $('#location-dropdown').select2({
        placeholder: 'Search for a location...',
        allowClear: true,
        width: 'resolve'
    });

    // Handle add location button click
    document.querySelector('.add-location-button').addEventListener('click', function() {
        const selectedLocations = $('#location-dropdown').val();
        const addedLocationsContainer = document.querySelector('.added-locations');
        addedLocationsContainer.innerHTML = ''; // Clear previous locations

        selectedLocations.forEach(location => {
            const locationElement = document.createElement('div');
            locationElement.className = 'added-location';
            locationElement.textContent = location;
            addedLocationsContainer.appendChild(locationElement);
        });
    });
});