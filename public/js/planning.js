document.addEventListener('DOMContentLoaded', function() {
    let tagDataLoaded = false;

    fetch('/tags')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(tagData => {
      window.tagData = tagData;
      tagDataLoaded = true;
      console.log('Tags loaded and stored in global variable:', window.tagData[0]);

      // Gọi hàm xử lý applyForm sau khi tagData đã được load
      document.querySelector('.apply-button').addEventListener('click', applyForm);
    })
    .catch(error => {
      console.error('Error fetching tag data:', error);
    });

    // Add event listeners for the clear and apply button
    document.querySelector('.clear-button').addEventListener('click', clearForm);

    async function applyForm() {
        if (!tagDataLoaded) {
          console.error('Tag data is not loaded yet.');
          return;
        }
    
        // Collect selected values (sử dụng trực tiếp window.tagData)
        const selectedCuisines = getSelectedTagIds('Cuisines');
        const selectedMainCourses = getSelectedTagIds('Main Courses');
        const selectedDesserts = getSelectedTagIds('Desserts');
        const selectedActivities = getSelectedTagIds('Activities');
        
        const startTimeHour = document.getElementById('start-time-hour').value;
        const startTimeMinute = document.getElementById('start-time-minute').value;
        const endTimeHour = document.getElementById('end-time-hour').value;
        const endTimeMinute = document.getElementById('end-time-minute').value;
        const selectedLocation = document.getElementById('location').value;
        const minBudget = document.getElementById('min-budget').value;
        const maxBudget = document.getElementById('max-budget').value;

        const startTimeFloat = parseFloat(startTimeHour) + parseFloat(startTimeMinute) / 60;
        const startTimeString = startTimeFloat.toFixed(1); // Format to one decimal place
        const endTimeFloat = parseFloat(endTimeHour) + parseFloat(endTimeMinute) / 60;
        const endTimeString = endTimeFloat.toFixed(1); // Format to one decimal place

        const now = new Date();
        const year = now.getFullYear().toString().slice();
        const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month (0-11)
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const planId = `${year}${month}${day}-${hours}${minutes}${seconds}`;
    
        // Send data to the server
        const data = {
          _id: planId,
          PLAN_USER: window.currentUserId, // Thay bằng giá trị user ID thích hợp
          PLAN_DATE: `${day}/${month}/${year}`,
          PLAN_DISTRICT: selectedLocation,
          PLAN_MAXBUDGET: maxBudget,
          PLAN_STARTTIME: startTimeHour && startTimeMinute ? startTimeString: '',
          PLAN_ENDTIME: endTimeHour && endTimeMinute ? endTimeString: '',
          PLAN_CUISINES: selectedCuisines,
          PLAN_MCOURSES: selectedMainCourses,
          PLAN_DESSERTS: selectedDesserts,
          PLAN_ACTIVITIES: selectedActivities,
        };
    
        sendDataToServer(data);

      }
    
});

function clearForm() {
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

    window.location.href = '/plandetails';
}

// async function applyForm(){
//     if (!tagDataLoaded) {
//         console.error('Tag data is not loaded yet.');
//         return;
//     }
    
//     // Collect selected values
//     // const selectedCuisines = Array.from(document.querySelectorAll('.box:nth-child(1) input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
//     // const selectedMainCourses = Array.from(document.querySelectorAll('.box:nth-child(2) input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
//     // const selectedDesserts = Array.from(document.querySelectorAll('.box:nth-child(3) input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
//     // const selectedActivities = Array.from(document.querySelectorAll('.box:nth-child(4) input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
    
//     const selectedCuisines = getSelectedTagIds('Cuisines');
//     const selectedMainCourses = getSelectedTagIds('Main Courses');
//     const selectedDesserts = getSelectedTagIds('Desserts');
//     const selectedActivities = getSelectedTagIds('Activities');
    
//     const startTimeHour = document.getElementById('start-time-hour').value;
//     const startTimeMinute = document.getElementById('start-time-minute').value;
//     const endTimeHour = document.getElementById('end-time-hour').value;
//     const endTimeMinute = document.getElementById('end-time-minute').value;
//     const selectedLocation = document.getElementById('location').value;
//     const minBudget = document.getElementById('min-budget').value;
//     const maxBudget = document.getElementById('max-budget').value;

//     // Process the collected values
//     // for (let i = 0; i < selectedCuisines.length; i++) {
//     //     selectedCuisines[i] = selectedCuisines[i].replace(/_/g, ' ');
//     // }

//     // Log the collected values (for demonstration purposes)
//     console.log('Selected Cuisines:', selectedCuisines);
//     console.log('Selected Main Courses:', selectedMainCourses);
//     console.log('Selected Desserts:', selectedDesserts);
//     console.log('Selected Activities:', selectedActivities);
//     console.log('Start Time:', `${startTimeHour}:${startTimeMinute}`);
//     console.log('End Time:', `${endTimeHour}:${endTimeMinute}`);
//     console.log('Selected Location:', selectedLocation);
//     console.log('Min Budget:', minBudget);
//     console.log('Max Budget:', maxBudget);

//     // Generate plan ID
//     const now = new Date();
//     const year = now.getFullYear().toString().slice(-2); // Get last 2 digits of year
//     const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month (0-11)
//     const day = now.getDate().toString().padStart(2, '0');
//     const hours = now.getHours().toString().padStart(2, '0');
//     const minutes = now.getMinutes().toString().padStart(2, '0');
//     const seconds = now.getSeconds().toString().padStart(2, '0');
//     const planId = `${year}${month}${day}-${hours}${minutes}${seconds}`;


//     // You can add further processing or form submission logic here
//     // window.location.href = '/plandetails';

//     // Send data to the server
//     const data = {
//         _id: planId,
//         PLAN_USER: 'USR-001',
//         PLAN_DATE: `${day}/${month}/${year}`,
//         PLAN_DISTRICT: selectedLocation,
//         PLAN_MAXBUDGET: maxBudget,
//         PLAN_STARTTIME: `${startTimeHour}:${startTimeMinute}`,
//         PLAN_ENDTIME: `${endTimeHour}:${endTimeMinute}`,
//         PLAN_CUISINES: selectedCuisines,
//         PLAN_MCOURSES: selectedMainCourses,
//         PLAN_DESSERTS: selectedDesserts,
//         PLAN_ACTIVITIES: selectedActivities,
//     };
//     sendDataToServer(data);
// }


// 
function getSelectedTagIds(category) {
    let selectedValues = [];
    
    if (category === 'Cuisines') {
        selectedValues = Array.from(document.querySelectorAll('.box:nth-child(1) input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
    } else if (category === 'Main Courses') {
        selectedValues = Array.from(document.querySelectorAll('.box:nth-child(2) input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
    } else if (category === 'Desserts') {
        selectedValues = Array.from(document.querySelectorAll('.box:nth-child(3) input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
    } else if (category === 'Activities') {
        selectedValues = Array.from(document.querySelectorAll('.box:nth-child(4) input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
    }

    if (selectedValues.length === 0) {
      return [];
    }

    console.log("selectedValues in getSelectedTagIds:", selectedValues);
    console.log("window.tagData in getSelectedTagIds:", tagData[0]);

    // if (!global.tagData) {
    //   console.error('tagData is not defined');
    //   return [];
    // }
    const tagIds = selectedValues.map(value => {
      const tag = tagData.find(tag => tag.TAG_NAME === value);
      return tag ? tag._id : null; // Return null if tag not found
    }).filter(id => id !== null); // Remove null values
    return tagIds;
}

function sendDataToServer(data) {
    fetch('/createPlan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log('Plan created:', data);
      // Redirect to plandetails page
      window.location.href = '/plandetails';
    })
    .catch(error => {
      console.error('Error creating plan:', error);
    });
}
