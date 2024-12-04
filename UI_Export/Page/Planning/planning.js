document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for the clear and apply buttons
    document.querySelector('.clear-button').addEventListener('click', function() {
        // Clear all checkboxes
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        // Clear all input fields
        document.querySelectorAll('input[type="number"]').forEach(input => {
            input.value = '';
        });

        // Clear all select fields
        document.querySelectorAll('select').forEach(select => {
            select.selectedIndex = 0;
        });
    });

    document.querySelector('.apply-button').addEventListener('click', function() {
        // Collect selected values
        const selectedCuisines = Array.from(document.querySelectorAll('.box:nth-child(1) input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
        const selectedMainCourses = Array.from(document.querySelectorAll('.box:nth-child(2) input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
        const selectedDesserts = Array.from(document.querySelectorAll('.box:nth-child(3) input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
        const selectedActivities = Array.from(document.querySelectorAll('.box:nth-child(4) input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
        const startTimeHour = document.getElementById('start-time-hour').value;
        const startTimeMinute = document.getElementById('start-time-minute').value;
        const endTimeHour = document.getElementById('end-time-hour').value;
        const endTimeMinute = document.getElementById('end-time-minute').value;
        const selectedLocation = document.getElementById('location').value;
        const minBudget = document.getElementById('min-budget').value;
        const maxBudget = document.getElementById('max-budget').value;

        // Log the collected values (for demonstration purposes)
        console.log('Selected Cuisines:', selectedCuisines);
        console.log('Selected Main Courses:', selectedMainCourses);
        console.log('Selected Desserts:', selectedDesserts);
        console.log('Selected Activities:', selectedActivities);
        console.log('Start Time:', `${startTimeHour}:${startTimeMinute}`);
        console.log('End Time:', `${endTimeHour}:${endTimeMinute}`);
        console.log('Selected Location:', selectedLocation);
        console.log('Min Budget:', minBudget);
        console.log('Max Budget:', maxBudget);

        // You can add further processing or form submission logic here
        window.location.href = '../PlanDetails/plandetails.html';
    });
});