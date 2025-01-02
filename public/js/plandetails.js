// Take data from planData.js and render it to the page
const renderPlanDetails = (data) => {
  const planDetails = document.getElementById("plan-details");

  data.forEach((item) => {
    // Create container for each plan item
    const planItem = document.createElement("div");
    planItem.className = "plan-item";

    // Create category for each plan item
    const category = document.createElement("h2");
    category.textContent = item.category;
    planItem.appendChild(category);

    // Create content for each plan item
    const planContent = document.createElement("div");
    planContent.className = "plan-content";

    // Create time for each plan item
    const time = document.createElement("div");
    time.className = "time";
    time.textContent = item.DETAIL_TIME;
    planContent.appendChild(time);

    // Add details for each plan item
    const details = document.createElement("div");
    details.className = "details";

    const title = document.createElement("h3");
    title.textContent = item.LOC_NAME;
    details.appendChild(title);

    const location = document.createElement("p");
    location.textContent = item.LOC_FADDRESS;
    details.appendChild(location);

    const description = document.createElement("p");
    description.textContent = item.LOC_DESCR;
    details.appendChild(description);

    // Add details to planContent
    planContent.appendChild(details);

    // Add planContent to planItem
    planItem.appendChild(planContent);

    // Add keepActivity to planItem (checkbox)
    const keepActivity = document.createElement("div");
    keepActivity.className = "keep-activity";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `keep-${item.category}`;
    checkbox.checked = true;
    const label = document.createElement("label");
    label.htmlFor = `keep-${item.category}`;
    label.textContent = "Keep this activity";
    keepActivity.appendChild(checkbox);
    keepActivity.appendChild(label);
    planItem.appendChild(keepActivity);

    // Add planItem to planDetails
    planDetails.appendChild(planItem);
  });
};

// Render plan details when the page is loaded
document.addEventListener("DOMContentLoaded", () => {
  // renderPlanDetails(planData);

  fetch('/generatePlan')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(planData => {
        console.log('Plan details fetched:', planData);
        renderPlanDetails(planData);
    })
    .catch(error => {
        console.error('Error fetching plan details:', error);
  });
});