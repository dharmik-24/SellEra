document.getElementById("loginTab").addEventListener("click", function () {
  document.getElementById("loginForm").classList.add("active");
  document.getElementById("registerForm").classList.remove("active");
  this.classList.add("active");
  document.getElementById("registerTab").classList.remove("active");
});

document.getElementById("registerTab").addEventListener("click", function () {
  document.getElementById("registerForm").classList.add("active");
  document.getElementById("loginForm").classList.remove("active");
  this.classList.add("active");
  document.getElementById("loginTab").classList.remove("active");
});

function validateForm(event, fields) {
  let valid = true;

  function showError(inputId, errorId, message) {
    let input = document.getElementById(inputId);
    let error = document.getElementById(errorId);
    error.innerText = message;
    error.style.display = "block";
    input.classList.add("shake");
    setTimeout(() => input.classList.remove("shake"), 300);
    valid = false;
  }

  function hideError(errorId) {
    document.getElementById(errorId).style.display = "none";
  }

  fields.forEach(({ id, pattern, message }) => {
    let value = document.getElementById(id).value.trim();
    if (!pattern.test(value)) {
      showError(id, id + "Error", message);
    } else {
      hideError(id + "Error");
    }
  });

  let password = document.getElementById("registerPassword").value;
  let confirmPassword = document.getElementById("confirmPassword").value;
  if (password !== confirmPassword) {
    showError(
      "confirmPassword",
      "confirmPasswordError",
      "Passwords do not match."
    );
  } else {
    hideError("confirmPasswordError");
  }

  if (!valid) {
    event.preventDefault();
  }
}

document
  .getElementById("registerForm")
  .addEventListener("submit", function (event) {
    validateForm(event, [
      {
        id: "name",
        pattern: /.{3,}/,
        message: "Name must be at least 3 characters.",
      },
      {
        id: "registerEmail",
        pattern: /^[^ ]+@[^ ]+\.[a-z]{2,3}$/,
        message: "Enter a valid email.",
      },
      {
        id: "registerPassword",
        pattern: /^(?=.*\d).{6,}$/,
        message: "Password must be at least 6 characters with a number.",
      },
    ]);
  });

document
  .getElementById("loginForm")
  .addEventListener("submit", function (event) {
    validateForm(event, [
      {
        id: "loginEmail",
        pattern: /^[^ ]+@[^ ]+\.[a-z]{2,3}$/,
        message: "Enter a valid email.",
      },
      {
        id: "loginPassword",
        pattern: /^(?!\s*$).+/,
        message: "Password can't be empty.",
      },
    ]);
  });
