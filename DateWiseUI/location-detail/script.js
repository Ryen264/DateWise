function toggleHeart(button) {
    const heartIcon = button.querySelector("img");
    if (heartIcon.src.includes("heart.svg")) {
        // Switch to filled heart icon
        heartIcon.src = "../asset/icon/heart-filled.svg";
    } else {
        // Switch back to unfilled heart icon
        heartIcon.src = "../asset/icon/heart.svg";
    }
}