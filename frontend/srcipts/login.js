const baseUrl = BE_URL;
const form = document.getElementById('signup-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const response = await fetch(`${baseUrl}/signup/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        window.location.href = '../requirements.html';
      } else {
        alert(data.error || 'Signin failed');
      }
    } catch (error) {
      console.error(error);
      alert('Something went wrong');
    }
  });