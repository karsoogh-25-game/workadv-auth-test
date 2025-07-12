document.addEventListener('DOMContentLoaded', () => {
    const welcomeMessage = document.getElementById('welcome-message');
    const passwordForm = document.getElementById('password-form');
    const passwordInput = document.getElementById('password');
    const resultMessage = document.getElementById('result-message');
    let userPhoneNumber;

    const params = new URLSearchParams(window.location.search);
    userPhoneNumber = params.get('name');

    if (!userPhoneNumber) {
        welcomeMessage.textContent = 'خطا: شماره کاربر مشخص نشده است.';
        passwordForm.style.display = 'none';
        return;
    }

    fetch(`/api/user-data?phone=${userPhoneNumber}`)
        .then(response => response.json())
        .then(data => {
            if (data.name) {
                welcomeMessage.textContent = `سلام، ${data.name}! خوش آمدید.`;
            } else {
                welcomeMessage.textContent = data.error || 'کاربر یافت نشد.';
                passwordForm.style.display = 'none';
            }
        })
        .catch(() => {
            welcomeMessage.textContent = 'خطا در ارتباط با سرور.';
            passwordForm.style.display = 'none';
        });

    passwordForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const password = passwordInput.value;

        fetch('/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phoneNumber: userPhoneNumber,
                password: password,
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                resultMessage.textContent = 'رمز صحیح است. موفقیت‌آمیز!';
                resultMessage.className = 'success';
            } else {
                resultMessage.textContent = 'رمز وارد شده اشتباه است.';
                resultMessage.className = 'error';
            }
        })
        .catch(() => {
            resultMessage.textContent = 'خطا در ارتباط با سرور.';
            resultMessage.className = 'error';
        });
    });
});