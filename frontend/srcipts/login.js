const baseUrl = BE_URL;
const form = document.getElementById('login-form');
localStorage.clear();
document.addEventListener("DOMContentLoaded", () => {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const identifier = document.getElementById('email').value;
        console.log(identifier);
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${baseUrl}/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password })
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                localStorage.setItem("access_token", data.access);
                localStorage.setItem("refresh_token", data.refresh);
                window.location.href = '../environments.html';
            } else {
                alert(data.error || 'Signin failed');
            }
        } catch (error) {
            console.error(error);
            alert('Something went wrong');
        }
    });
});