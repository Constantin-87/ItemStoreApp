document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const csrfToken = document.querySelector('input[name="_csrf"]').value;
  const errorMessageDiv = document.getElementById("error-message");

  const formData = new URLSearchParams();
  formData.append("email", email);
  formData.append("password", password);
  formData.append("_csrf", csrfToken);

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (response.status === 401) {
      // Dynamically update the error message safely
      errorMessageDiv.textContent = `Email ${email} or password is incorrect.`;
      errorMessageDiv.style.color = "red";
    } else if (response.ok) {
      window.location.href = "/items";
    } else {
      const errorMessage = await response.text(); // Get error message from the backend
      console.error("Backend Error:", errorMessage); // Log it in the browser console for debugging

      // Display the error message from the backend
      errorMessageDiv.textContent = `Error: ${errorMessage}`;
      errorMessageDiv.style.color = "red";
    }
  } catch (error) {
    console.error("Fetch Error:", error);
    errorMessageDiv.textContent = "An error occurred. Please try again.";
    errorMessageDiv.style.color = "red";
  }
});
