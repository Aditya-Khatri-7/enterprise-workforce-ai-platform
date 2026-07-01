document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    const step4 = document.getElementById('step-4');

    const loader = document.getElementById('loader');
    
    const emailInput = document.getElementById('email-input');
    const sendOtpBtn = document.getElementById('send-otp-btn');
    const step1Error = document.getElementById('step-1-error');
    const displayEmail = document.getElementById('display-email');

    const otpBoxes = document.querySelectorAll('.otp-box');
    const verifyOtpBtn = document.getElementById('verify-otp-btn');
    const step2Error = document.getElementById('step-2-error');
    const resendLink = document.getElementById('resend-link');

    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const resetPasswordBtn = document.getElementById('reset-password-btn');
    const step3Error = document.getElementById('step-3-error');

    let currentEmail = '';

    // --- Utility Functions ---
    const showLoader = () => loader.classList.remove('hidden');
    const hideLoader = () => loader.classList.add('hidden');
    
    const goToStep = (stepElement) => {
        document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
        stepElement.classList.add('active');
    };

    // --- Step 1: Send OTP ---
    const sendOtp = async () => {
        const email = emailInput.value.trim();
        if (!email) {
            step1Error.textContent = "Please enter an email address.";
            return;
        }

        showLoader();
        step1Error.textContent = "";

        try {
            const res = await fetch('/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();
            hideLoader();

            if (res.ok) {
                currentEmail = email;
                displayEmail.textContent = email;
                goToStep(step2);
                otpBoxes[0].focus();
            } else {
                step1Error.textContent = data.error || "Failed to send OTP.";
            }
        } catch (err) {
            hideLoader();
            step1Error.textContent = "An error occurred. Please try again later.";
        }
    };

    sendOtpBtn.addEventListener('click', sendOtp);
    emailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendOtp();
    });

    // --- Step 2: OTP Logic ---
    otpBoxes.forEach((box, index) => {
        box.addEventListener('input', (e) => {
            const val = e.target.value;
            // Move to next box if filled
            if (val && index < otpBoxes.length - 1) {
                otpBoxes[index + 1].focus();
            }
        });

        box.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                // Move to previous box on backspace if current is empty
                otpBoxes[index - 1].focus();
            } else if (e.key === 'Enter') {
                verifyOtp();
            }
        });

        // Paste functionality
        box.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasteData = e.clipboardData.getData('text').trim();
            if (/^\d{6}$/.test(pasteData)) {
                otpBoxes.forEach((b, i) => b.value = pasteData[i]);
                verifyOtpBtn.focus();
            }
        });
    });

    const verifyOtp = async () => {
        let otp = '';
        otpBoxes.forEach(b => otp += b.value);

        if (otp.length !== 6) {
            step2Error.textContent = "Please enter all 6 digits.";
            return;
        }

        showLoader();
        step2Error.textContent = "";

        try {
            const res = await fetch('/api/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentEmail, otp })
            });

            const data = await res.json();
            hideLoader();

            if (res.ok) {
                goToStep(step3);
                newPasswordInput.focus();
            } else {
                step2Error.textContent = data.error || "Invalid OTP.";
                // Clear boxes on error
                otpBoxes.forEach(b => b.value = '');
                otpBoxes[0].focus();
            }
        } catch (err) {
            hideLoader();
            step2Error.textContent = "An error occurred. Please try again later.";
        }
    };

    verifyOtpBtn.addEventListener('click', verifyOtp);

    resendLink.addEventListener('click', (e) => {
        e.preventDefault();
        sendOtp(); // Re-use the sendOtp function using the already entered email
    });

    // --- Step 3: Reset Password ---
    const resetPassword = async () => {
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (!newPassword || !confirmPassword) {
            step3Error.textContent = "Please fill in both fields.";
            return;
        }

        if (newPassword !== confirmPassword) {
            step3Error.textContent = "Passwords do not match.";
            return;
        }

        showLoader();
        step3Error.textContent = "";

        try {
            const res = await fetch('/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentEmail, newPassword })
            });

            const data = await res.json();
            hideLoader();

            if (res.ok) {
                goToStep(step4);
            } else {
                step3Error.textContent = data.error || "Failed to reset password.";
            }
        } catch (err) {
            hideLoader();
            step3Error.textContent = "An error occurred. Please try again later.";
        }
    };

    resetPasswordBtn.addEventListener('click', resetPassword);
    confirmPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') resetPassword();
    });
});
