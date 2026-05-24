const getOTPTemplate = (otp, name = 'User') => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { background-color: #ffffff; margin: 50px auto; padding: 20px; max-width: 600px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { text-align: center; color: #333333; }
        .content { color: #555555; line-height: 1.6; }
        .otp-code { display: inline-block; background-color: #fce4ec; color: #d81b60; font-size: 24px; font-weight: bold; padding: 10px 20px; border-radius: 4px; margin: 20px 0; letter-spacing: 2px;}
        .footer { text-align: center; color: #aaaaaa; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <h2 class="header">Verify Your Email</h2>
        <div class="content">
            <p>Hello ${name},</p>
            <p>Thank you for registering. Please use the following One-Time Password (OTP) to complete your verification process:</p>
            <div style="text-align: center;">
                <span class="otp-code">${otp}</span>
            </div>
            <p>This code is valid for a short period. Please do not share it with anyone.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Job Finder. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

const getPasswordResetTemplate = (otp, name = 'User') => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { background-color: #ffffff; margin: 50px auto; padding: 20px; max-width: 600px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { text-align: center; color: #333333; }
        .content { color: #555555; line-height: 1.6; }
        .otp-code { display: inline-block; background-color: #e3f2fd; color: #1976d2; font-size: 24px; font-weight: bold; padding: 10px 20px; border-radius: 4px; margin: 20px 0; letter-spacing: 2px;}
        .footer { text-align: center; color: #aaaaaa; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <h2 class="header">Password Reset Request</h2>
        <div class="content">
            <p>Hello ${name},</p>
            <p>We received a request to reset your password. Please use the following OTP to complete your request:</p>
            <div style="text-align: center;">
                <span class="otp-code">${otp}</span>
            </div>
            <p>If you did not make this request, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Job Finder. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

const getJobAppliedTemplate = (jobTitle, companyName, applicantName = 'User') => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { background-color: #ffffff; margin: 50px auto; padding: 20px; max-width: 600px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { text-align: center; color: #333333; }
        .content { color: #555555; line-height: 1.6; }
        .highlight { font-weight: bold; color: #007bff; }
        .footer { text-align: center; color: #aaaaaa; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <h2 class="header">Application Received</h2>
        <div class="content">
            <p>Hello ${applicantName},</p>
            <p>Great news! We have successfully received your application for the <span class="highlight">${jobTitle}</span> position at <span class="highlight">${companyName}</span>.</p>
            <p>The employer will review your profile, and you will be notified if your profile is shortlisted for the next steps.</p>
            <p>Best of luck with your job search!</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Job Finder. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

module.exports = {
    getOTPTemplate,
    getPasswordResetTemplate,
    getJobAppliedTemplate
};
