# EmailJS Setup Guide for Fear City Cycles

## Overview

Fear City Cycles v0.1.5 includes EmailJS integration for real contact form submissions. This guide explains how to configure EmailJS to enable email notifications for customer inquiries.

## Current Implementation Status

✅ **Frontend Integration Complete**
- Contact forms are wired to EmailJS
- Form validation and error handling implemented
- Success/error notifications configured
- Google Analytics tracking for submissions
- Fallback demo mode when EmailJS not configured

## Setup Instructions

### 1. Create EmailJS Account

1. Visit [EmailJS.com](https://www.emailjs.com/)
2. Sign up for a free account (200 emails/month) or paid plan
3. Verify your email address

### 2. Configure Email Service

1. In EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Name it: `fear_city_service`
5. Follow provider-specific setup instructions
6. Test the connection

### 3. Create Email Templates

Create four templates for different inquiry types:

#### Template 1: Custom Build Consultation
- **Template ID**: `template_custom_build`
- **Subject**: New Custom Build Inquiry - {{form_type}}
- **Body**:
```
New custom build consultation received!

Customer Details:
- Name: {{name}}
- Email: {{email}}
- Phone: {{phone}}

Build Details:
- Build Type: {{build_type}}
- Budget Range: {{budget}}

Customer Vision:
{{message}}

Submitted: {{timestamp}}

---
Fear City Cycles Contact System
```

#### Template 2: Gear/Apparel Inquiry
- **Template ID**: `template_gear_inquiry`
- **Subject**: Gear Inquiry - {{form_type}}
- **Body**:
```
New gear/apparel inquiry received!

Customer Details:
- Name: {{name}}
- Email: {{email}}
- Phone: {{phone}}

Inquiry Details:
- Product: {{product}}
- Size: {{size}}

Message:
{{message}}

Submitted: {{timestamp}}

---
Fear City Cycles Contact System
```

#### Template 3: Press Request
- **Template ID**: `template_press_request`
- **Subject**: Press Request - {{organization}}
- **Body**:
```
New press request received!

Contact Details:
- Name: {{name}}
- Email: {{email}}
- Phone: {{phone}}
- Organization: {{organization}}
- Deadline: {{deadline}}

Request Details:
{{message}}

Submitted: {{timestamp}}

---
Fear City Cycles Contact System
```

#### Template 4: General Contact
- **Template ID**: `template_general_contact`
- **Subject**: General Inquiry - Fear City Cycles
- **Body**:
```
New general inquiry received!

Contact Details:
- Name: {{name}}
- Email: {{email}}
- Phone: {{phone}}

Message:
{{message}}

Submitted: {{timestamp}}

---
Fear City Cycles Contact System
```

### 4. Get Your API Keys

1. Go to **Account** → **API Keys** in EmailJS dashboard
2. Copy your **Public Key**
3. Copy your **Service ID** (should be `fear_city_service`)

### 5. Update Code Configuration

Update the following files with your actual EmailJS credentials:

#### In `/contact/index.html` (line 18):
```javascript
emailjs.init('YOUR_ACTUAL_PUBLIC_KEY_HERE');
```

#### In `/assets/js/contact.js` (lines 5-12):
```javascript
const EMAILJS_CONFIG = {
    SERVICE_ID: 'fear_city_service',
    TEMPLATE_IDS: {
        custom: 'template_custom_build',
        gear: 'template_gear_inquiry',
        press: 'template_press_request',
        general: 'template_general_contact'
    },
    PUBLIC_KEY: 'YOUR_ACTUAL_PUBLIC_KEY_HERE'
};
```

### 6. Email Settings

Configure these settings in EmailJS dashboard:

- **Auto-Reply**: Set up auto-reply templates for customer confirmations
- **To Email**: Set default recipient email (e.g., info@fearcitycycles.com)
- **Reply-To**: Uses customer's email for easy response
- **CC/BCC**: Add additional recipients as needed

## Testing

1. Test each form type on the contact page
2. Verify emails are received with correct formatting
3. Check spam folders if emails don't arrive
4. Test error handling by disconnecting internet
5. Verify Google Analytics tracking

## Security Notes

- Never commit actual API keys to version control
- Use environment variables for production deployment
- EmailJS public key is safe to expose (not private key)
- Consider rate limiting for production

## Troubleshooting

### Emails Not Sending
- Check browser console for errors
- Verify API keys are correct
- Ensure email service is connected in EmailJS
- Check EmailJS dashboard for quota/errors

### Form Shows Demo Mode
- Verify EmailJS script is loaded
- Check that public key is configured
- Ensure no JavaScript errors blocking execution

### Email Formatting Issues
- Review template variables match form fields
- Test with different email clients
- Check HTML escaping in templates

## Production Deployment

For Vercel deployment, add environment variables:

```bash
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_actual_key_here
NEXT_PUBLIC_EMAILJS_SERVICE_ID=fear_city_service
```

Then update code to use environment variables instead of hardcoded values.

## Support

- EmailJS Documentation: https://www.emailjs.com/docs/
- EmailJS Support: support@emailjs.com
- Fear City Cycles Dev: [Your contact]

---

**Last Updated**: 2025-06-29  
**Version**: v0.1.5