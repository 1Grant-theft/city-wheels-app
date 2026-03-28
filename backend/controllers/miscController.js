// Newsletter subscription endpoint
const subscribeNewsletter = (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    console.log(`[Newsletter] New subscriber: ${email}`);
    res.json({ message: 'Success! You have been subscribed to our newsletter.' });
};

// Contact form endpoint
const submitContactForm = (req, res) => {
    const { name, email, phone, reason, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ message: 'Name, email, and message are required.' });
    }

    // In a real app, this would send an email. For now, we'll log it and return success.
    console.log(`[Contact Form] From: ${name} (${email}) - Reason: ${reason}`);
    console.log(`Message: ${message}`);

    res.json({ message: 'Your message has been sent successfully! We will get back to you soon.' });
};

module.exports = {
    subscribeNewsletter,
    submitContactForm
};
