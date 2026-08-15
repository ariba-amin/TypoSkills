/*
  Typo Skills email configuration.
  To enable real password-reset emails on GitHub Pages, create an EmailJS account
  and replace the three placeholders below with your EmailJS values.
*/
const EMAIL_CONFIG = {
  publicKey: "YOUR_EMAILJS_PUBLIC_KEY",
  serviceId: "YOUR_EMAILJS_SERVICE_ID",
  templateId: "YOUR_EMAILJS_TEMPLATE_ID"
};

function emailConfigured(){
  return window.emailjs && !Object.values(EMAIL_CONFIG).some(v => String(v).startsWith("YOUR_"));
}

async function sendResetEmail(toEmail, name, code){
  if(!emailConfigured()) throw new Error("Email service is not configured. Add your EmailJS Public Key, Service ID and Template ID in js/email-config.js.");
  emailjs.init({publicKey: EMAIL_CONFIG.publicKey});
  return emailjs.send(EMAIL_CONFIG.serviceId, EMAIL_CONFIG.templateId, {
    to_email: toEmail,
    to_name: name,
    reset_code: code,
    app_name: "Typo Skills"
  });
}
