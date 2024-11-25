document
  .getElementById("register-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    // Collect form data
    const formData = new URLSearchParams(new FormData(e.target));

    const errorMessageDiv = document.getElementById("error-message");
    try {
      const response = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      // Check if the response is not OK (e.g., status 500)
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend Error:", errorText);

        // Display the error message from the backend
        errorMessageDiv.textContent = `Error: ${errorText}`;
        errorMessageDiv.style.color = "red";
      } else {
        // Redirect if registration is successful
        window.location.href = "/items";
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      errorMessageDiv.textContent =
        "An unexpected error occurred. Please try again.";
      errorMessageDiv.style.color = "red";
    }
  });
