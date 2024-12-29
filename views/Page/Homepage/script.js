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

const sliderContainer = document.querySelector('.slider-container');
const slides = document.querySelectorAll('.slider-slide');
const prevBtn = document.querySelector('.slider-btn-prev');
const nextBtn = document.querySelector('.slider-btn-next');

let currentIndex = 0;

function showSlide(index) {
    const slideWidth = slides[0].clientWidth;
    sliderContainer.style.transform = `translateX(${-index * slideWidth}px)`;
}

prevBtn.addEventListener('click', () => {
    currentIndex = (currentIndex > 0) ? currentIndex - 1 : slides.length - 1;
    showSlide(currentIndex);
});

nextBtn.addEventListener('click', () => {
    currentIndex = (currentIndex < slides.length - 1) ? currentIndex + 1 : 0;
    showSlide(currentIndex);
});

function toggleHeart(button) {
    const heartIcon = button.querySelector("img");
    if (heartIcon.src.includes("heart.svg")) {
        // Switch to filled heart icon
        heartIcon.src = "heart-filled.svg";
        button.style.backgroundColor = '#fe6969';
    } else {
        // Switch back to unfilled heart icon
        heartIcon.src = "heart.svg";
        button.style.backgroundColor = '#8d8d8d';
    }
}
