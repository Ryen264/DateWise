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

// Get the modal
var modal = document.getElementById("editModal");

// Function to open the modal
function openEditModal() {
    modal.style.display = "block";
}

// Function to close the modal
function closeEditModal() {
    modal.style.display = "none";
}

// Function to save changes
function saveChanges() {
   // Implement saving logic here
    closeEditModal(); // Close modal after saving
}

// Function to load profile image preview
function loadProfileImage(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
    
  reader.onload = function(e) {
        document.getElementById('profile-image-preview').src = e.target.result;
  }
  if (file) {
      reader.readAsDataURL(file);
  }
}

// Function to remove profile image
function removeProfileImage() {
    document.getElementById('profile-image-preview').src = "../asset/image/ava.png";
     document.getElementById('profile-image-input').value = '';
}
function togglePasswordVisibility(inputId) {
  const passwordInput = document.getElementById(inputId);
  const passwordToggle = passwordInput.nextElementSibling;
  const eyeIcon = passwordToggle.querySelector('i');

  if (passwordInput.type === "password") {
     passwordInput.type = "text";
      eyeIcon.classList.remove('fa-eye');
      eyeIcon.classList.add('fa-eye-slash');
  } else {
     passwordInput.type = "password";
      eyeIcon.classList.remove('fa-eye-slash');
     eyeIcon.classList.add('fa-eye');
  }
}