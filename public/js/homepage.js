// public/js/script2.js
function toggleHeart(button) {
    const heartIcon = button.querySelector("img");
    if (heartIcon.src.includes("heart.svg")) {
        // Switch to filled heart icon
        heartIcon.src = "/assets/icon/heart-filled.svg";
        button.style.backgroundColor = '#fe6969';
    } else {
        // Switch back to unfilled heart icon
        heartIcon.src = "/assets/icon/heart.svg";
        button.style.backgroundColor = '#8d8d8d';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchLocations();
    // Code cho carousel
    const carouselSlides = document.querySelectorAll('.carousel-slide');
    let currentSlide = 0;

    document.querySelector('.prev').addEventListener('click', () => {
        carouselSlides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide - 1 + carouselSlides.length) % carouselSlides.length;
        carouselSlides[currentSlide].classList.add('active');
    });

    document.querySelector('.next').addEventListener('click', () => {
        carouselSlides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % carouselSlides.length;
        carouselSlides[currentSlide].classList.add('active');
    });
    // Kêt thúc code cho carousel
});

let locationsData = [];
let tagsData = [];
let restaurantGroupIndex = 0;
let cafeGroupIndex = 0;
const locationsPerGroup = 3; // Số lượng location hiển thị mỗi lần

async function fetchLocations() {
    try {
        // Get locations data from global variable
        const locationsResponse = await fetch('/locations');
        locationsData = await locationsResponse.json();
        if (!Array.isArray(locationsData)) {
            locationsData = [locationsData];
        }

        console.log('Locations data:', locationsData[0]);

        // Get tags data from global variable
        const tagsResponse = await fetch('/tags');
        tagsData = await tagsResponse.json();
        if (!Array.isArray(tagsData)) {
            tagsData = [tagsData];
        }

        console.log('Tags data:', tagsData[0]);

        const userResponse = await fetch('/getCurrentUserData');
        const userData = await userResponse.json();

        console.log('User data:', userData);

        // Lấy thông tin user từ session
        let currentUser = userData;
        console.log('Current user:', currentUser.fullname);

        locationsData.sort(compareLocations(currentUser));

        console.log('Sorted locations:', locationsData);

        displayLocations();
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu địa điểm:', error);
        document.getElementById('locations-container').innerHTML = '<p>Đã xảy ra lỗi khi lấy dữ liệu.</p>';
    }
}

function compareLocations(currentUser) {
    return function (a, b) {
        if (Array.isArray(currentUser.districts) && currentUser.districts.length > 0) {
            const aInDistrict = currentUser.districts.includes(a.district);
            const bInDistrict = currentUser.districts.includes(b.district);

            if (aInDistrict && !bInDistrict) {
                return -1;
            }
            if (!aInDistrict && bInDistrict) {
                return 1;
            }
        }

        const userPreferences = [
            ...(Array.isArray(currentUser.cuisines) ? currentUser.cuisines : []),
            ...(Array.isArray(currentUser.mainCourses) ? currentUser.mainCourses : []),
            ...(Array.isArray(currentUser.desserts) ? currentUser.desserts : []),
            ...(Array.isArray(currentUser.activities) ? currentUser.activities : [])
        ];

        const aMatches = countMatches(a, userPreferences);
        const bMatches = countMatches(b, userPreferences);

        if (aMatches > bMatches) {
            return -1;
        }
        if (aMatches < bMatches) {
            return 1;
        }

        return 0;
    };
}

function countMatches(location, preferences) {
    let matches = 0;
    const locationTags = location.tag.split(',').map(tagID => tagID.trim());

    for (const preference of preferences) {
        for(const tagID of locationTags) {
            const tag = tagsData.find(tag => tag._id.trim() === tagID);

            if(tag){
                if(tag._id === preference) {
                    matches++;
                }
            }
        }
    }
    return matches;
}

function displayLocations() {
    //const container = document.getElementById('locations-container');
    //container.innerHTML = ''; // Remove old data

    // Filter locations by tag
    const restaurants = locationsData.filter((loc) => {
        const locTagIds = loc.tag.split(',').map(tagId => tagId.trim());
        return locTagIds.some((tagId) => {
          const tag = tagsData.find((t) => t._id.trim() === tagId);
          return tag && tag.TAG_TYPE === 'Restaurant';
        });
    });

    const cafes = locationsData.filter((loc) => {
        const locTagIds = loc.tag.split(',').map(tagId => tagId.trim());
        return locTagIds.some((tagId) => {
            const tag = tagsData.find((t) => t._id.trim() === tagId);
            return tag && tag.TAG_TYPE === 'Cafe';
        });
    });

    // Display locations for group restaurants
    
    displayGroup(
        restaurants,
        restaurantGroupIndex,
        'Must-try Restaurants',
        'restaurants-container',
    );

    // Display locations for group cafes
    displayGroup(
        cafes,
        cafeGroupIndex,
        'Must-try Coffee shops',
        'coffeeshops-container',
    );  

    console.log('Display locations successfully');
}

function displayGroup(locations, groupIndex, title, containerID) {
    let container = document.getElementById(containerID);
    
    // groupContainer.innerHTML = '';
    // groupContainer.classList.add('slider-container');
    // groupContainer.classList.add("slider-container");
    if (!container) {
        container = document.createElement('div');
        container.id = containerID;
        container.classList.add('slider');
        
    } else {
        // Clear the previous content of group container
        container.innerHTML = '';
    }

    groupContainer = document.createElement('div');
    groupContainer.id = containerID;
    groupContainer.classList.add('slider-wrapper');
    const prevButton = document.createElement('button');
    prevButton.classList.add('slider-btn', 'prev');
    const prevImg = document.createElement('img');
    prevImg.src = '/assets/icon/left-arrow.svg';
    prevImg.alt = 'Left';
    prevImg.width = 24;
    prevImg.height = 24;
    prevButton.appendChild(prevImg);
    groupContainer.appendChild(prevButton);
    container.appendChild(groupContainer);

    let sliderContainer = document.createElement('div');
    sliderContainer.classList.add('slider-container');
    groupContainer.appendChild(sliderContainer);

    const startIndex = groupIndex * locationsPerGroup;
    const endIndex = startIndex + locationsPerGroup;
    const currentLocations = locations.slice(startIndex, endIndex);

    // Display group title
    // const titleDiv = document.createElement('h2');
    // titleDiv.innerText = title;
    // sliderContainer.appendChild(titleDiv);

    // Add div containing location records
    // const recordsContainer = document.createElement('div');
    // recordsContainer.classList.add('records-container');
    // sliderContainer.appendChild(recordsContainer);

    currentLocations.forEach((location) => {
        const locationDiv = document.createElement('div');
        locationDiv.classList.add('location-record');

        const imageUrl = `/proxy-image?url=${encodeURIComponent(
            location.photo
        )}`;

        const locationHtml = `
            <div class="slider-slide">
            <div class="image-container">
                <img src="${imageUrl}">
                <button id="heart" class="heart-btn" onclick="toggleHeart(this)">
                    <img src="/assets/icon/heart.svg" alt="Heart icon">
                </button>
                </div>
                <div class="text-container">
                <h3>${location.name}</h3>
                <p>⭐ ${location.rating}</p>
                <p>📍 ${location.district}</p>
                <p>💵 From ${formatPrice(location.price)}</p>
            </div>
            </div>
        `;

        // const locationHtml = `
        //     <div class="image-container">
        //         <div class="location-image" style="background-image: url('${imageUrl}');"></div>
        //         <div class="heart-icon">
        //             <span class="icon">❤️</span>
        //         </div>
        //     </div>
        //     <div class="location-details">
        //         <div class="location-name">${location.name}</div>
        //         <div class="detail-item">
        //             <span class="icon">⭐</span>
        //             <span>${location.rating}</span>
        //         </div>
        //         <div class="detail-item">
        //             <span class="icon">📍</span>
        //             <span>${location.district}</span>
        //         </div>
        //         <div class="detail-item">
        //             <span class="icon">💵</span>
        //             <span class="price">From ${formatPrice(location.price)}</span>
        //         </div>
        //     </div>
        // `;
        locationDiv.innerHTML = locationHtml;
        sliderContainer.appendChild(locationDiv);
    });
    //<button class="slider-btn next">
    //<img src="/assets/icon/right-arrow.svg" alt="Right" width="24" height="24">
    //</button>
    const nextButton = document.createElement('button');
    nextButton.classList.add('slider-btn', 'next');
    const nextImg = document.createElement('img');
    nextImg.src = '/assets/icon/right-arrow.svg';
    nextImg.alt = 'Right';
    nextImg.width = 24;
    nextImg.height = 24;
    nextButton.appendChild(nextImg);
    groupContainer.appendChild(nextButton);

    console.log('Display group:', title);

    // Display navigation buttons
    //addNavigationForGroup(groupContainer, locations, groupIndex, containerID.replace('-container', ''));
}

function addNavigationForGroup(groupContainer, locations, groupIndex, groupName) {
    const navDiv = document.createElement('div');
    navDiv.classList.add('nav-buttons');

    const prevBtn = document.createElement('button');
    prevBtn.id = `${groupName}-prev-btn`;
    prevBtn.classList.add('nav-btn');
    prevBtn.textContent = '❮';
    prevBtn.addEventListener('click', () => {
        if (groupIndex > 0) {
            groupIndex--;
            if (groupName === 'restaurants') {
                restaurantGroupIndex = groupIndex;
            } else if (groupName === 'cafes') {
                cafeGroupIndex = groupIndex;
            }

            // Update again for corresponding group
            updateDisplayGroup(locations, groupIndex, groupName);
        }
    });

    const nextBtn = document.createElement('button');
    nextBtn.id = `${groupName}-next-btn`;
    nextBtn.classList.add('nav-btn');
    nextBtn.textContent = '❯';
    nextBtn.addEventListener('click', () => {
        if ((groupIndex + 1) * locationsPerGroup < locations.length) {
            groupIndex++;
            if (groupName === 'restaurants') {
                restaurantGroupIndex = groupIndex;
            } else if (groupName === 'cafes') {
                cafeGroupIndex = groupIndex;
            }

            // Update again for corresponding group
            updateDisplayGroup(locations, groupIndex, groupName);
        }
    });

    navDiv.appendChild(prevBtn);
    navDiv.appendChild(nextBtn);
    groupContainer.appendChild(navDiv);

    console.log('Add navigation for group:', groupName);

}

function updateDisplayGroup(locations, groupIndex, groupName) {
    const containerID = `${groupName}-container`;
    const container = document.getElementById(containerID).querySelector('.records-container');
    container.innerHTML = ''; // Remove old data

    const startIndex = groupIndex * locationsPerGroup;
    const endIndex = startIndex + locationsPerGroup;
    const currentLocations = locations.slice(startIndex, endIndex);

    currentLocations.forEach((location) => {
        const locationDiv = document.createElement('div');
        locationDiv.classList.add('location-record');

        const imageUrl = `/proxy-image?url=${encodeURIComponent(
            location.photo
        )}`;

        const locationHtml = `
            <div class="image-container">
            <img src="${imageUrl}">
            <button id="heart" class="heart-btn" onclick="toggleHeart(this)">
                <img src="/assets/icon/heart.svg" alt="Heart icon">
            </button>
            </div>
            <div class="text-container">
            <h3>${location.name}</h3>
            <p>⭐ ${location.rating}</p>
            <p>📍 ${location.district}</p>
            <p>💵 From ${formatPrice(location.price)}</p>
            </div>
        `;

        // const locationHtml = `
            
        //       <div class="image-container">
        //           <div class="location-image" style="background-image: url('${imageUrl}');"></div>
        //           <div class="heart-icon">
        //               <span class="icon">❤️</span>
        //           </div>
        //       </div>
        //       <div class="location-details">
        //           <div class="location-name">${location.name}</div>
        //           <div class="detail-item">
        //               <span class="icon">⭐</span>
        //               <span>${location.rating}</span>
        //           </div>
        //           <div class="detail-item">
        //               <span class="icon">📍</span>
        //               <span>${location.district}</span>
        //           </div>
        //           <div class="detail-item">
        //               <span class="icon">💵</span>
        //               <span class="price">From ${formatPrice(location.price)}</span>
        //           </div>
        //       </div>
        //   `;
        locationDiv.innerHTML = locationHtml;
        container.appendChild(locationDiv);
    });
}

function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}