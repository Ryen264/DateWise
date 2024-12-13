function toggleHeart(button) {
    const heartIcon = button.querySelector("img");
    if (heartIcon.src.includes("heart.svg")) {
        // Switch to filled heart icon
        heartIcon.src = "../asset/icon/heart-filled.svg";
        button.style.backgroundColor = '#fe6969';
    } else {
        // Switch back to unfilled heart icon
        heartIcon.src = "../asset/icon/heart.svg";
        button.style.backgroundColor = '#8d8d8d';
    }
}

